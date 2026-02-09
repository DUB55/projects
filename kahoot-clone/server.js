import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const quizzes = new Map();
const sessions = new Map();

function generateSessionCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

// REST endpoints
app.post("/api/quizzes", (req, res) => {
  const { title, questions } = req.body || {};
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Invalid quiz payload" });
  }
  const quizId = uuidv4();
  quizzes.set(quizId, { title, questions });
  res.json({ quizId });
});

app.post("/api/sessions", (req, res) => {
  const { quizId } = req.body || {};
  const quiz = quizzes.get(quizId);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  const sessionCode = generateSessionCode();
  sessions.set(sessionCode, {
    quizId,
    hostId: null,
    playersByNick: new Map(),
    playersBySocket: new Map(),
    blockedNicknames: new Set(),
    state: {
      status: "lobby",
      questionIndex: -1,
      startedAt: null,
      questionStartedAt: null,
      answers: new Map(),
      timerHandle: null,
      scored: false,
      history: []
    }
  });
  res.json({ sessionCode });
});

// Socket.IO events
io.on("connection", (socket) => {
  socket.on("host:join", ({ sessionCode }) => {
    const session = sessions.get(sessionCode);
    if (!session) {
      socket.emit("error", { message: "Session not found" });
      return;
    }
    session.hostId = socket.id;
    socket.join(sessionCode);
    socket.emit("host:joined", { sessionCode, quizId: session.quizId });
    const quiz = quizzes.get(session.quizId);
    socket.emit("host:lobby", {
      title: quiz.title,
      players: Array.from(session.playersByNick.values()).map((p) => ({ nickname: p.nickname, score: p.score }))
    });
  });

  socket.on("player:join", ({ sessionCode, nickname }) => {
    const session = sessions.get(sessionCode);
    if (!session) {
      socket.emit("player:join:error", { message: "Session not found" });
      return;
    }
    const baseNick = String(nickname || "").trim();
    const nickLower = baseNick.toLowerCase();
    let finalNickname = baseNick;
    const existing = session.playersByNick.get(nickLower);
    if (existing) {
      if (existing.socketId && existing.socketId !== socket.id) {
        finalNickname = `${baseNick}-${Math.floor(Math.random() * 1000)}`;
      } else {
        finalNickname = existing.nickname;
      }
    }
    if (session.blockedNicknames.has(finalNickname.toLowerCase())) {
      socket.emit("player:join:error", { message: "Nickname blocked" });
      return;
    }
    const finalLower = finalNickname.toLowerCase();
    const player = session.playersByNick.get(finalLower) || { nickname: finalNickname, score: 0, streak: 0, socketId: null };
    player.nickname = finalNickname;
    player.socketId = socket.id;
    session.playersByNick.set(finalLower, player);
    session.playersBySocket.set(socket.id, finalLower);
    socket.join(sessionCode);
    socket.emit("player:join:ok", { nickname: finalNickname });
    io.to(sessionCode).emit("lobby:update", {
      players: Array.from(session.playersByNick.values()).map((p) => ({ nickname: p.nickname, score: p.score }))
    });
  });

  socket.on("host:start", ({ sessionCode }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    session.state.status = "in_progress";
    session.state.questionIndex = 0;
    session.state.startedAt = Date.now();
    session.state.answers = new Map();
    session.state.scored = false;
    const quiz = quizzes.get(session.quizId);
    const q = quiz.questions[session.state.questionIndex];
    session.state.questionStartedAt = Date.now();
    if (session.state.timerHandle) clearTimeout(session.state.timerHandle);
    session.state.timerHandle = setTimeout(() => {
      endQuestion(sessionCode);
    }, q.timerSec * 1000);
    io.to(sessionCode).emit("question:show", {
      index: session.state.questionIndex,
      text: q.text,
      choices: q.choices,
      timerSec: q.timerSec
    });
  });

  socket.on("host:next", ({ sessionCode }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    const quiz = quizzes.get(session.quizId);
    if (session.state.questionIndex + 1 >= quiz.questions.length) {
      session.state.status = "finished";
      io.to(sessionCode).emit("session:finished", {
        leaderboard: leaderboardFor(session),
        history: session.state.history
      });
      return;
    }
    session.state.questionIndex += 1;
    session.state.answers = new Map();
    session.state.scored = false;
    const q = quiz.questions[session.state.questionIndex];
    session.state.questionStartedAt = Date.now();
    if (session.state.timerHandle) clearTimeout(session.state.timerHandle);
    session.state.timerHandle = setTimeout(() => {
      endQuestion(sessionCode);
    }, q.timerSec * 1000);
    io.to(sessionCode).emit("question:show", {
      index: session.state.questionIndex,
      text: q.text,
      choices: q.choices,
      timerSec: q.timerSec
    });
  });

  socket.on("player:answer", ({ sessionCode, choiceIndex }) => {
    const session = sessions.get(sessionCode);
    if (!session) return;
    const quiz = quizzes.get(session.quizId);
    const q = quiz.questions[session.state.questionIndex];
    if (!q) return;
    if (session.state.answers.has(socket.id)) return;
    const elapsedMs = Date.now() - session.state.questionStartedAt;
    const nickLower = session.playersBySocket.get(socket.id);
    session.state.answers.set(socket.id, { choiceIndex, ms: elapsedMs, nickLower });
    const correct = Number(choiceIndex) === Number(q.correctIndex);
    socket.emit("player:feedback", { correct });
  });

  socket.on("host:endQuestion", ({ sessionCode }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    endQuestion(sessionCode);
  });

  socket.on("host:kick", ({ sessionCode, nickname }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    const key = nickname.toLowerCase();
    const player = session.playersByNick.get(key);
    if (!player) return;
    if (player.socketId) {
      const sock = io.sockets.sockets.get(player.socketId);
      if (sock) sock.disconnect(true);
      session.playersBySocket.delete(player.socketId);
    }
    session.playersByNick.delete(key);
    io.to(sessionCode).emit("lobby:update", {
      players: Array.from(session.playersByNick.values()).map((p) => ({ nickname: p.nickname, score: p.score }))
    });
  });

  socket.on("host:blockNick", ({ sessionCode, nickname }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    session.blockedNicknames.add(String(nickname || "").toLowerCase());
  });

  socket.on("host:unblockNick", ({ sessionCode, nickname }) => {
    const session = sessions.get(sessionCode);
    if (!session || session.hostId !== socket.id) return;
    session.blockedNicknames.delete(String(nickname || "").toLowerCase());
  });

  socket.on("disconnect", () => {
    for (const [code, session] of sessions.entries()) {
      if (session.hostId === socket.id) {
        session.hostId = null;
        io.to(code).emit("host:disconnected");
      }
      const nickLower = session.playersBySocket.get(socket.id);
      if (nickLower) {
        const player = session.playersByNick.get(nickLower);
        if (player) player.socketId = null;
        session.playersBySocket.delete(socket.id);
      }
    }
  });
});

function scoreQuestion(session) {
  const quiz = quizzes.get(session.quizId);
  const q = quiz.questions[session.state.questionIndex];
  const maxMs = q.timerSec * 1000;
  const BASE_POINTS = 1000;
  const SPEED_BONUS_MAX = 500;
  const entries = Array.from(session.state.answers.entries()).map(([socketId, ans]) => ({ socketId, ...ans }));
  entries.sort((a, b) => a.ms - b.ms);

  for (const { choiceIndex, ms, nickLower } of entries) {
    const player = session.playersByNick.get(nickLower);
    if (!player) continue;
    const correct = Number(choiceIndex) === Number(q.correctIndex);
    if (!correct) {
      player.streak = 0;
      continue;
    }
    const speedScore = Math.max(0, Math.min(SPEED_BONUS_MAX, Math.round(((maxMs - ms) / maxMs) * SPEED_BONUS_MAX)));
    const streakBonus = player.streak > 0 ? Math.min(300, player.streak * 50) : 0;
    const points = BASE_POINTS + speedScore + streakBonus;
    player.score += points;
    player.streak += 1;
  }
}

function leaderboardFor(session) {
  return Array.from(session.playersByNick.values())
    .map((p) => ({ nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function questionSummary(session) {
  const quiz = quizzes.get(session.quizId);
  const q = quiz.questions[session.state.questionIndex];
  const entries = Array.from(session.state.answers.values());
  const total = entries.length;
  let correctCount = 0;
  let wrongCount = 0;
  let sumMs = 0;
  for (const a of entries) {
    const correct = Number(a.choiceIndex) === Number(q.correctIndex);
    if (correct) correctCount++; else wrongCount++;
    sumMs += a.ms;
  }
  const avgMs = total > 0 ? Math.round(sumMs / total) : 0;
  return { total, correctCount, wrongCount, avgMs };
}

function endQuestion(sessionCode) {
  const session = sessions.get(sessionCode);
  if (!session) return;
  if (session.state.scored) return;
  session.state.scored = true;
  if (session.state.timerHandle) {
    clearTimeout(session.state.timerHandle);
    session.state.timerHandle = null;
  }
  scoreQuestion(session);
  const summary = questionSummary(session);
  session.state.history.push({ index: session.state.questionIndex, ...summary });
  io.to(sessionCode).emit("leaderboard:update", {
    leaderboard: leaderboardFor(session)
  });
  io.to(sessionCode).emit("question:summary", summary);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
