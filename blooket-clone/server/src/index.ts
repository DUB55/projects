import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

type Choice = { text: string };
type Question = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctIndex: number;
  timeLimitSec?: number;
};
type QuestionSet = {
  id: string;
  title: string;
  questions: Question[];
};

type Player = {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  connected: boolean;
};

type SessionState = {
  code: string;
  hostSocketId: string;
  set: QuestionSet;
  players: Record<string, Player>;
  status: "lobby" | "question" | "results" | "ended";
  qIndex: number;
  answers: Record<string, number>;
  startedAt?: number;
};

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const rooms: Record<string, SessionState> = {};

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function publicState(state: SessionState) {
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score || b.streak - a.streak)
    .map((p) => ({ id: p.id, nickname: p.nickname, score: p.score, streak: p.streak }));
  return {
    code: state.code,
    status: state.status,
    qIndex: state.qIndex,
    totalQuestions: state.set.questions.length,
    leaderboard
  };
}

io.on("connection", (socket) => {
  socket.on("host:createRoom", (payload: { set: QuestionSet }, ack?: (res: { code: string }) => void) => {
    const code = genCode();
    const state: SessionState = {
      code,
      hostSocketId: socket.id,
      set: payload.set,
      players: {},
      status: "lobby",
      qIndex: -1,
      answers: {}
    };
    rooms[code] = state;
    socket.join(code);
    ack?.({ code });
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("player:join", (payload: { code: string; nickname: string }, ack?: (res: { ok: boolean; reason?: string }) => void) => {
    const { code, nickname } = payload;
    const state = rooms[code];
    if (!state) return ack?.({ ok: false, reason: "Room not found" });
    if (state.status !== "lobby") return ack?.({ ok: false, reason: "Game already started" });
    const clean = nickname.trim().slice(0, 20);
    if (!clean) return ack?.({ ok: false, reason: "Invalid nickname" });
    const dup = Object.values(state.players).find((p) => p.nickname.toLowerCase() === clean.toLowerCase());
    if (dup) return ack?.({ ok: false, reason: "Nickname in use" });
    const id = socket.id;
    state.players[id] = { id, nickname: clean, score: 0, streak: 0, connected: true };
    socket.join(code);
    ack?.({ ok: true });
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("host:start", (code: string) => {
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.status = "question";
    state.qIndex = 0;
    state.answers = {};
    state.startedAt = Date.now();
    const q = state.set.questions[state.qIndex];
    io.to(code).emit("game:question", { index: state.qIndex, prompt: q.prompt, choices: q.choices, timeLimitSec: q.timeLimitSec ?? 20 });
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("player:answer", (payload: { code: string; choiceIndex: number }) => {
    const { code, choiceIndex } = payload;
    const state = rooms[code];
    if (!state || state.status !== "question") return;
    const player = state.players[socket.id];
    if (!player) return;
    if (state.answers[player.id] !== undefined) return;
    state.answers[player.id] = choiceIndex;
    const q = state.set.questions[state.qIndex];
    const correct = q.correctIndex === choiceIndex;
    if (correct) {
      player.streak += 1;
      const base = 100;
      const bonus = Math.min(player.streak * 20, 100);
      player.score += base + bonus;
    } else {
      player.streak = 0;
    }
    io.to(code).emit("state:update", publicState(state));
    const totalPlayers = Object.keys(state.players).length;
    if (Object.keys(state.answers).length >= totalPlayers) {
      io.to(code).emit("game:questionResults", {
        index: state.qIndex,
        correctIndex: q.correctIndex,
        answers: state.answers
      });
    }
  });

  socket.on("host:next", (code: string) => {
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.answers = {};
    state.qIndex += 1;
    if (state.qIndex >= state.set.questions.length) {
      state.status = "ended";
      io.to(code).emit("game:ended", publicState(state));
      io.to(code).emit("state:update", publicState(state));
      return;
    }
    state.status = "question";
    const q = state.set.questions[state.qIndex];
    io.to(code).emit("game:question", { index: state.qIndex, prompt: q.prompt, choices: q.choices, timeLimitSec: q.timeLimitSec ?? 20 });
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("disconnect", () => {
    for (const code of socket.rooms) {
      const state = rooms[code];
      if (!state) continue;
      if (state.players[socket.id]) {
        state.players[socket.id].connected = false;
      }
      if (state.hostSocketId === socket.id) {
        // End the game if host disconnects
        state.status = "ended";
        io.to(code).emit("game:ended", publicState(state));
      }
      io.to(code).emit("state:update", publicState(state));
    }
  });
});

app.get("/", (_req, res) => {
  res.send("Quiz Platform Server (Phase 0)");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
