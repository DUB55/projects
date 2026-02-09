const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const rooms = {};
const ipJoinWindow = {};
const defaultBannedWords = ["badword", "offensive", "swear"];

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function publicState(state) {
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score || b.streak - a.streak)
    .map((p) => ({ id: p.id, nickname: p.nickname, score: p.score, streak: p.streak, sphereId: p.sphereId }));
  const teamLeaderboard =
    state.mode === "team"
      ? Object.values(state.teams).map((t) => ({ name: t.name, score: t.score, size: t.players.length })).sort((a, b) => b.score - a.score)
      : undefined;
  const survivalInfo =
    state.mode === "survival"
      ? Object.fromEntries(Object.keys(state.players).map((pid) => [pid, { lives: state.playerLives[pid] ?? state.livesPerPlayer }]))
      : undefined;
  const cafeInfo = 
      state.mode === "cafe"
        ? Object.fromEntries(Object.keys(state.players).map((pid) => [pid, state.playerCafe[pid] || { money: 0, customersServed: 0 }]))
        : undefined;
    const tdInfo = 
      state.mode === "td"
        ? Object.fromEntries(Object.keys(state.players).map((pid) => [pid, state.playerTD[pid] || { tokens: 0, health: 10, wave: 1 }]))
        : undefined;
  
    return {
      code: state.code,
      status: state.status,
      qIndex: state.qIndex,
      totalQuestions: state.set.questions.length,
      leaderboard,
      mode: state.mode,
      teamLeaderboard,
      survivalInfo,
      cafeInfo,
      tdInfo,
      cafeMoney: state.mode === "cafe" ? state.cafeMoney : undefined,
      cafeCustomers: state.mode === "cafe" ? state.cafeCustomers : undefined
    };
}

io.on("connection", (socket) => {
  socket.on("host:createRoom", (payload, ack) => {
    const code = genCode();
    const state = {
      code,
      hostSocketId: socket.id,
      set: payload.set,
      players: {},
      status: "lobby",
      qIndex: -1,
      answers: {},
      answerTimes: {},
      locked: false,
      muted: {},
      resultsHistory: [],
      mode: ["team", "survival", "sprint", "cafe"].includes(payload.mode) ? payload.mode : "classic",
      teams: {},
      bannedWords: Array.isArray(payload.bannedWords) ? payload.bannedWords : defaultBannedWords.slice(),
      livesPerPlayer: typeof payload.livesPerPlayer === "number" ? Math.max(1, Math.min(9, payload.livesPerPlayer)) : 3,
      playerLives: {},
      playerCafe: {},
      playerTD: {},
      cafeMoney: 0,
      cafeCustomers: []
    };
    if (state.mode === "team") {
      const names = Array.isArray(payload.teamNames) && payload.teamNames.length > 0 ? payload.teamNames : ["Red", "Blue"];
      for (const n of names) state.teams[n] = { name: n, score: 0, players: [] };
    }
    rooms[code] = state;
    socket.join(code);
    if (ack) ack({ code });
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("player:join", (payload, ack) => {
    const { code, nickname } = payload;
    const state = rooms[code];
    if (!state) return ack && ack({ ok: false, reason: "Room not found" });
    if (state.locked) return ack && ack({ ok: false, reason: "Room locked" });
    if (state.status !== "lobby") return ack && ack({ ok: false, reason: "Game already started" });
    const clean = String(nickname || "").trim().slice(0, 20);
    if (!clean) return ack && ack({ ok: false, reason: "Invalid nickname" });
    const low = clean.toLowerCase();
    if ((state.bannedWords || defaultBannedWords).some((w) => low.includes(w))) return ack && ack({ ok: false, reason: "Nickname blocked" });
    const dup = Object.values(state.players).find((p) => p.nickname.toLowerCase() === clean.toLowerCase());
    if (dup) return ack && ack({ ok: false, reason: "Nickname in use" });
    const ip = socket.handshake.address || "unknown";
    const key = code + "|" + ip;
    const now = Date.now();
    ipJoinWindow[key] = (ipJoinWindow[key] || []).filter((t) => now - t < 30000);
    if (ipJoinWindow[key].length >= 5) return ack && ack({ ok: false, reason: "Too many joins" });
    ipJoinWindow[key].push(now);
    const id = socket.id;
    state.players[id] = { id, nickname: clean, score: 0, streak: 0, connected: true, sphereId: payload.sphereId };
    if (state.mode === "team") {
      const teamName = String(payload.teamName || "");
      if (!state.teams[teamName]) return ack && ack({ ok: false, reason: "Select a valid team" });
      state.teams[teamName].players.push(id);
    }
    if (state.mode === "survival") {
      state.playerLives[id] = state.livesPerPlayer;
    }
    if (state.mode === "cafe") {
      state.playerCafe[id] = { 
        money: 0, 
        customersServed: 0, 
        stock: { "toast": 5, "yogurt": 0, "apple": 0 }, 
        upgrades: { "multiplier": 1, "faster_prep": false },
        customers: [
          { id: "c1", item: "toast", patience: 100 },
          { id: "c2", item: "toast", patience: 100 },
          { id: "c3", item: "toast", patience: 100 }
        ]
      };
    }
    if (state.mode === "td") {
      state.playerTD[id] = {
        tokens: 15,
        health: 10,
        wave: 1,
        towers: []
      };
    }
    socket.join(code);
    ack && ack({ ok: true });
    io.to(code).emit("state:update", publicState(state));
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });

  socket.on("host:start", (code) => {
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.status = "question";
    state.qIndex = 0;
    state.answers = {};
    state.answerTimes = {};
    state.questionStartedAt = Date.now();
    const q = state.set.questions[state.qIndex];
    io.to(code).emit("game:question", { index: state.qIndex, prompt: q.prompt, choices: q.choices, timeLimitSec: q.timeLimitSec ?? 20 });
    io.to(code).emit("state:update", publicState(state));
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });

  socket.on("cafe:serve", (payload) => {
    const { code, customerId } = payload;
    const state = rooms[code];
    if (!state || state.mode !== "cafe") return;
    const cafe = state.playerCafe[socket.id];
    if (!cafe) return;

    const customerIndex = cafe.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;

    const item = cafe.customers[customerIndex].item;
    if (!cafe.stock[item] || cafe.stock[item] <= 0) return;

    const prices = { "toast": 5, "yogurt": 10, "apple": 15, "breakfast_bowl": 30 };
    const price = prices[item] || 5;

    cafe.stock[item]--;
    cafe.money += price * (cafe.upgrades.multiplier || 1);
    cafe.customersServed++;
    
    // Remove served customer
    cafe.customers.splice(customerIndex, 1);

    // If no customers left, maybe add a new one automatically after a delay or just wait for restock
    if (cafe.customers.length < 3) {
      const unlockedItems = Object.keys(cafe.stock);
      const randomItem = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];
      cafe.customers.push({ id: `c-${Date.now()}`, item: randomItem, patience: 100 });
    }
    
    // Also update global room stats for host view
    state.cafeMoney += price;
    state.cafeCustomers.push({ id: `cust-${Date.now()}`, servedBy: state.players[socket.id].nickname });

    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("cafe:upgrade", (payload) => {
    const { code, upgradeId } = payload;
    const state = rooms[code];
    if (!state || state.mode !== "cafe") return;
    const cafe = state.playerCafe[socket.id];
    if (!cafe) return;

    if (upgradeId === "multiplier" && cafe.money >= 100) {
      cafe.money -= 100;
      cafe.upgrades.multiplier = (cafe.upgrades.multiplier || 1) + 1;
    } else if (upgradeId === "unlock_yogurt" && cafe.money >= 50) {
      cafe.money -= 50;
      cafe.stock["yogurt"] = 0;
    } else if (upgradeId === "unlock_apple" && cafe.money >= 150) {
      cafe.money -= 150;
      cafe.stock["apple"] = 0;
    } else if (upgradeId === "unlock_breakfast_bowl" && cafe.money >= 300) {
      cafe.money -= 300;
      cafe.stock["breakfast_bowl"] = 0;
    } else if (upgradeId === "faster_prep" && cafe.money >= 200) {
      cafe.money -= 200;
      cafe.upgrades.faster_prep = true;
    }

    io.to(code).emit("state:update", publicState(state));
   });
 
   socket.on("td:build", (payload) => {
     const { code, towerId, x, y } = payload;
     const state = rooms[code];
     if (!state || state.mode !== "td") return;
     const td = state.playerTD[socket.id];
     if (!td) return;
 
     const towerCosts = { "archer": 10, "mage": 20, "cannon": 30 };
     const cost = towerCosts[towerId] || 10;
 
     if (td.tokens >= cost) {
       td.tokens -= cost;
       td.towers.push({ id: towerId, x, y, level: 1 });
     }
 
     io.to(code).emit("state:update", publicState(state));
   });
 
   socket.on("td:upgrade", (payload) => {
     const { code, towerIndex } = payload;
     const state = rooms[code];
     if (!state || state.mode !== "td") return;
     const td = state.playerTD[socket.id];
     if (!td || !td.towers[towerIndex]) return;
 
     const tower = td.towers[towerIndex];
     const towerCosts = { "archer": 15, "mage": 25, "cannon": 40 };
     const cost = (towerCosts[tower.id] || 15) * tower.level;
 
     if (td.tokens >= cost) {
       td.tokens -= cost;
       tower.level += 1;
     }
 
     io.to(code).emit("state:update", publicState(state));
   });

   socket.on("td:waveComplete", (payload) => {
     const { code } = payload;
     const state = rooms[code];
     if (!state || state.mode !== "td") return;
     const td = state.playerTD[socket.id];
     if (!td) return;
 
     td.wave++;
     td.tokens += td.wave * 5; // Reward for wave completion
 
     io.to(code).emit("state:update", publicState(state));
   });
 
   socket.on("td:damage", (payload) => {
     const { code, amount } = payload;
     const state = rooms[code];
     if (!state || state.mode !== "td") return;
     const td = state.playerTD[socket.id];
     if (!td) return;
 
     td.health = Math.max(0, td.health - amount);
     if (td.health <= 0) {
       // Handle player elimination if needed
     }
 
     io.to(code).emit("state:update", publicState(state));
   });
 
   socket.on("player:usePowerUp", (payload) => {
     const { code, powerUpId } = payload;
     const state = rooms[code];
     if (!state) return;
     const player = state.players[socket.id];
     if (!player) return;

     if (powerUpId === "double_points") {
       player.activePowerUp = "double_points";
     } else if (powerUpId === "shield") {
       player.activePowerUp = "shield";
     } else if (powerUpId === "freeze") {
       // Freeze a random other player
       const otherIds = Object.keys(state.players).filter(id => id !== socket.id);
       if (otherIds.length > 0) {
         const targetId = otherIds[Math.floor(Math.random() * otherIds.length)];
         io.to(targetId).emit("player:frozen", { duration: 5000 });
       }
     } else if (powerUpId === "thief") {
       // Steal some score from a random other player
       const otherIds = Object.keys(state.players).filter(id => id !== socket.id);
       if (otherIds.length > 0) {
         const targetId = otherIds[Math.floor(Math.random() * otherIds.length)];
         const target = state.players[targetId];
         const stealAmount = Math.min(target.score, 200);
         target.score -= stealAmount;
         player.score += stealAmount;
       }
     }

     io.to(code).emit("state:update", publicState(state));
   });

   socket.on("player:answer", (payload) => {
    const { code, choiceIndex } = payload;
    const state = rooms[code];
    if (!state || state.status !== "question") return;
    const player = state.players[socket.id];
    if (!player) return;
    if (state.muted[player.id]) return;
    if (state.answers[player.id] !== undefined) return;
    const q = state.set.questions[state.qIndex];
    const limitMs = (q.timeLimitSec ?? 20) * 1000;
    if (Date.now() - (state.questionStartedAt || 0) > limitMs) return;
    if (state.mode === "survival" && (state.playerLives[player.id] ?? state.livesPerPlayer) <= 0) return;
    state.answers[player.id] = choiceIndex;
    const correct = q.correctIndex === choiceIndex;
    const elapsed = Date.now() - (state.questionStartedAt || 0);
    state.answerTimes[player.id] = elapsed;
    if (correct) {
      player.streak += 1;
      let base = 100;
      let bonus = Math.min(player.streak * 20, 100);
      
      if (player.activePowerUp === "double_points") {
        base *= 2;
        bonus *= 2;
        player.activePowerUp = null; // Consume powerup
      }

      if (state.mode === "sprint") {
        const speed = Math.max(0, limitMs - elapsed);
        const speedBonus = Math.round((speed / limitMs) * 100);
        bonus += speedBonus;
      }
      player.score += base + bonus;
      if (state.mode === "team") {
        for (const t of Object.values(state.teams)) {
          if (t.players.includes(player.id)) {
            t.score += base + bonus;
            break;
          }
        }
      } else if (state.mode === "cafe") {
        const cafe = state.playerCafe[player.id];
        if (cafe) {
          // Add 3 stock of a random item the player has unlocked
          const items = Object.keys(cafe.stock);
          const randomItem = items[Math.floor(Math.random() * items.length)];
          cafe.stock[randomItem] += 3;

          // Also ensure they have 3 customers if they were empty
          while (cafe.customers.length < 3) {
            const custItem = items[Math.floor(Math.random() * items.length)];
            cafe.customers.push({ id: `c-${Date.now()}-${cafe.customers.length}`, item: custItem, patience: 100 });
          }
        }
      } else if (state.mode === "td") {
         const td = state.playerTD[player.id];
         if (td) {
           td.tokens += 10; // Earn 10 tokens for each correct answer
         }
       }
    } else {
      if (player.activePowerUp === "shield") {
        player.activePowerUp = null; // Consume shield, keep streak
      } else {
        player.streak = 0;
      }
      
      if (state.mode === "survival") {
        state.playerLives[player.id] = Math.max(0, (state.playerLives[player.id] ?? state.livesPerPlayer) - 1);
      }
    }
    io.to(code).emit("state:update", publicState(state));
    const totalPlayers = Object.keys(state.players).length;
    if (Object.keys(state.answers).length >= totalPlayers) {
      let fastestCorrectPlayerId = undefined;
      let fastestCorrectTimeMs = undefined;
      for (const pid of Object.keys(state.answers)) {
        const choice = state.answers[pid];
        if (choice === q.correctIndex) {
          const t = state.answerTimes[pid] ?? Infinity;
          if (fastestCorrectTimeMs === undefined || t < fastestCorrectTimeMs) {
            fastestCorrectTimeMs = t;
            fastestCorrectPlayerId = pid;
          }
        }
      }
      const result = {
        index: state.qIndex,
        correctIndex: q.correctIndex,
        answers: state.answers,
        fastestCorrectPlayerId,
        fastestCorrectTimeMs
      };
      state.resultsHistory.push(result);
      io.to(code).emit("game:questionResults", result);
      if (state.mode === "survival") {
        const alive = Object.keys(state.players).filter((pid) => (state.playerLives[pid] ?? state.livesPerPlayer) > 0).length;
        if (alive <= 1) {
          state.status = "ended";
          io.to(code).emit("game:ended", publicState(state));
        }
      }
    }
  });

  socket.on("host:next", (code) => {
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
    state.questionStartedAt = Date.now();
    state.answerTimes = {};
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });
  socket.on("host:lock", (code) => {
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.locked = true;
    io.to(code).emit("state:update", publicState(state));
  });
  socket.on("host:unlock", (code) => {
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.locked = false;
    io.to(code).emit("state:update", publicState(state));
  });
  socket.on("host:mute", (payload) => {
    const { code, playerId } = payload;
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    state.muted[playerId] = true;
    io.to(code).emit("state:update", publicState(state));
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });
  socket.on("host:unmute", (payload) => {
    const { code, playerId } = payload;
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    delete state.muted[playerId];
    io.to(code).emit("state:update", publicState(state));
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });
  socket.on("host:kick", (payload) => {
    const { code, playerId } = payload;
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    if (state.players[playerId]) {
      delete state.players[playerId];
      io.to(code).emit("state:update", publicState(state));
      io.sockets.sockets.get(playerId)?.leave(code);
      if (state.mode === "team") {
        for (const t of Object.values(state.teams)) {
          t.players = t.players.filter((pid) => pid !== playerId);
        }
      }
      if (state.mode === "survival") {
        delete state.playerLives[playerId];
      }
    }
    io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
  });
  socket.on("host:updateSettings", (payload) => {
    const { code, bannedWords, livesPerPlayer } = payload || {};
    const state = rooms[code];
    if (!state || state.hostSocketId !== socket.id) return;
    if (Array.isArray(bannedWords)) state.bannedWords = bannedWords;
    if (typeof livesPerPlayer === "number") state.livesPerPlayer = Math.max(1, Math.min(9, livesPerPlayer));
    io.to(code).emit("state:update", publicState(state));
  });

  socket.on("player:usePowerUp", (payload) => {
     const { code, powerUpId } = payload;
     const state = rooms[code];
     if (!state) return;
     const player = state.players[socket.id];
     if (!player) return;
 
     if (powerUpId === "double_points") {
       player.activePowerUp = "double_points";
     } else if (powerUpId === "shield") {
       player.activePowerUp = "shield";
     } else if (powerUpId === "freeze") {
       // Find a random other player to freeze
       const others = Object.keys(state.players).filter(id => id !== socket.id);
       if (others.length > 0) {
         const targetId = others[Math.floor(Math.random() * others.length)];
         state.muted[targetId] = true;
         io.to(targetId).emit("player:frozen", { duration: 5000 });
         setTimeout(() => {
           delete state.muted[targetId];
           io.to(code).emit("state:update", publicState(state));
         }, 5000);
       }
     } else if (powerUpId === "thief") {
       // Steal 10% from the leader
       const sorted = Object.values(state.players).sort((a, b) => b.score - a.score);
       const leader = sorted[0];
       if (leader && leader.id !== socket.id) {
         const amount = Math.floor(leader.score * 0.1);
         leader.score -= amount;
         player.score += amount;
       }
     }
 
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
        state.status = "ended";
        io.to(code).emit("game:ended", publicState(state));
      }
      io.to(code).emit("state:update", publicState(state));
      io.to(state.hostSocketId).emit("host:players", Object.values(state.players));
    }
  });
});

app.get("/", (_req, res) => {
  res.send("Quiz Platform Server");
});
app.get("/api/room/:code", (req, res) => {
  const code = String(req.params.code || "");
  const state = rooms[code];
  if (!state) return res.status(404).json({ ok: false });
  res.json({
    ok: true,
    status: state.status,
    locked: state.locked,
    mode: state.mode,
    teams: state.mode === "team" ? Object.keys(state.teams) : [],
    livesPerPlayer: state.mode === "survival" ? state.livesPerPlayer : undefined
  });
});

// Cafe Patience Timer
setInterval(() => {
  let changed = false;
  for (const code in rooms) {
    const state = rooms[code];
    if (state.mode === "cafe" && state.status === "question") {
      for (const pid in state.playerCafe) {
        const cafe = state.playerCafe[pid];
        cafe.customers.forEach((c, idx) => {
          c.patience -= 0.5; // Decrease patience
          if (c.patience <= 0) {
            // Customer leaves
            const items = Object.keys(cafe.stock);
            const randomItem = items[Math.floor(Math.random() * items.length)];
            cafe.customers[idx] = { id: `c-${Date.now()}-${idx}`, item: randomItem, patience: 100 };
            changed = true;
          }
        });
      }
      if (changed) {
        io.to(code).emit("state:update", publicState(state));
      }
    }
  }
}, 1000);

app.get("/api/session/:code/export.csv", (req, res) => {
  const code = String(req.params.code || "");
  const state = rooms[code];
  if (!state) return res.status(404).send("not_found");
  const players = Object.values(state.players);
  const headers = ["nickname", "score", "streak"].concat(state.set.questions.map((_, i) => "Q" + (i + 1)));
  const rows = players.map((p) => {
    const perQ = state.set.questions.map((_, qi) => {
      const resQ = state.resultsHistory.find((r) => r.index === qi);
      if (!resQ) return "";
      const choice = resQ.answers[p.id];
      if (choice === undefined) return "NA";
      return choice === state.set.questions[qi].correctIndex ? "1" : "0";
    });
    return [p.nickname, String(p.score), String(p.streak)].concat(perQ);
  });
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
