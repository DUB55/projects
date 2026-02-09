const socket = io();

const quizTitleEl = document.getElementById("quiz-title");
const questionsEl = document.getElementById("questions");
const addQuestionBtn = document.getElementById("add-question");
const saveQuizBtn = document.getElementById("save-quiz");
const createSessionBtn = document.getElementById("create-session");
const statusEl = document.getElementById("quiz-status");

const sessionCodeEl = document.getElementById("session-code");
const joinHostBtn = document.getElementById("join-as-host");
const startBtn = document.getElementById("start");
const endQuestionBtn = document.getElementById("end-question");
const nextBtn = document.getElementById("next");
const playersEl = document.getElementById("players");
const currentQuestionEl = document.getElementById("current-question");
const leaderboardEl = document.getElementById("leaderboard");
const summaryEl = document.getElementById("q-summary");
const exportBtn = document.getElementById("export-quiz");
const importBtn = document.getElementById("import-quiz");
const importFile = document.getElementById("import-file");

let quizId = null;
let sessionCode = null;

function addQuestionUI() {
  const wrapper = document.createElement("div");
  wrapper.className = "card";
  wrapper.style.marginTop = "8px";
  wrapper.innerHTML = `
    <label>Question</label>
    <input class="q-text" placeholder="Question text" />
    <div class="grid grid-2" style="margin-top:6px;">
      <div><label>Choice A</label><input class="q-choice" placeholder="A" /></div>
      <div><label>Choice B</label><input class="q-choice" placeholder="B" /></div>
      <div><label>Choice C</label><input class="q-choice" placeholder="C" /></div>
      <div><label>Choice D</label><input class="q-choice" placeholder="D" /></div>
    </div>
    <div class="grid grid-2" style="margin-top:6px;">
      <div>
        <label>Correct Index (0-3)</label>
        <input class="q-correct" type="number" min="0" max="3" value="0" />
      </div>
      <div>
        <label>Timer (seconds)</label>
        <input class="q-timer" type="number" min="5" max="120" value="20" />
      </div>
    </div>
  `;
  questionsEl.appendChild(wrapper);
}

addQuestionBtn.addEventListener("click", addQuestionUI);
addQuestionUI();

saveQuizBtn.addEventListener("click", async () => {
  const title = quizTitleEl.value.trim();
  const questionNodes = [...questionsEl.querySelectorAll(".card")];
  const questions = questionNodes.map((n) => {
    const text = n.querySelector(".q-text").value.trim();
    const choices = [...n.querySelectorAll(".q-choice")].map((c) => c.value.trim()).filter(Boolean);
    const correctIndex = Number(n.querySelector(".q-correct").value);
    const timerSec = Number(n.querySelector(".q-timer").value);
    return { text, choices, correctIndex, timerSec };
  }).filter(q => q.text && q.choices.length >= 2);
  statusEl.textContent = "";
  const res = await fetch("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, questions })
  });
  if (!res.ok) {
    statusEl.textContent = "Failed to save quiz";
    return;
  }
  const data = await res.json();
  quizId = data.quizId;
  statusEl.textContent = "Quiz saved";
  createSessionBtn.disabled = false;
});

exportBtn.addEventListener("click", () => {
  const title = quizTitleEl.value.trim();
  const questionNodes = [...questionsEl.querySelectorAll(".card")];
  const questions = questionNodes.map((n) => {
    const text = n.querySelector(".q-text").value.trim();
    const choices = [...n.querySelectorAll(".q-choice")].map((c) => c.value.trim()).filter(Boolean);
    const correctIndex = Number(n.querySelector(".q-correct").value);
    const timerSec = Number(n.querySelector(".q-timer").value);
    return { text, choices, correctIndex, timerSec };
  }).filter(q => q.text && q.choices.length >= 2);
  const data = { title, questions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "quiz"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  if (!file) return;
  const text = await file.text();
  const data = JSON.parse(text);
  quizTitleEl.value = data.title || "";
  questionsEl.innerHTML = "";
  const qs = Array.isArray(data.questions) ? data.questions : [];
  for (const q of qs) {
    addQuestionUI();
    const node = questionsEl.lastElementChild;
    node.querySelector(".q-text").value = q.text || "";
    const choiceEls = [...node.querySelectorAll(".q-choice")];
    for (let i = 0; i < choiceEls.length; i++) {
      choiceEls[i].value = q.choices && q.choices[i] ? q.choices[i] : "";
    }
    node.querySelector(".q-correct").value = q.correctIndex ?? 0;
    node.querySelector(".q-timer").value = q.timerSec ?? 20;
  }
});

createSessionBtn.addEventListener("click", async () => {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId })
  });
  const data = await res.json();
  sessionCode = data.sessionCode;
  sessionCodeEl.textContent = sessionCode;
  joinHostBtn.disabled = false;
});

joinHostBtn.addEventListener("click", () => {
  socket.emit("host:join", { sessionCode });
});

socket.on("host:joined", () => {
  startBtn.disabled = false;
});

socket.on("host:lobby", ({ title, players }) => {
  renderLobby(players);
});

socket.on("lobby:update", ({ players }) => {
  renderLobby(players);
});

startBtn.addEventListener("click", () => {
  socket.emit("host:start", { sessionCode });
  startBtn.disabled = true;
  endQuestionBtn.disabled = false;
});

endQuestionBtn.addEventListener("click", () => {
  socket.emit("host:endQuestion", { sessionCode });
  endQuestionBtn.disabled = true;
  nextBtn.disabled = false;
});

nextBtn.addEventListener("click", () => {
  socket.emit("host:next", { sessionCode });
  nextBtn.disabled = true;
  endQuestionBtn.disabled = false;
});

socket.on("question:show", ({ index, text, choices, timerSec }) => {
  currentQuestionEl.innerHTML = `
    <div class="card">
      <h3>Q${index + 1}: ${text}</h3>
      <div>Timer: ${timerSec}s</div>
      <div class="choices" style="margin-top:8px;">
        ${choices.map((c, i) => `<div class="choice">${String.fromCharCode(65 + i)}. ${c}</div>`).join("")}
      </div>
    </div>
  `;
  leaderboardEl.innerHTML = "";
  summaryEl.innerHTML = "";
});

socket.on("leaderboard:update", ({ leaderboard }) => {
  leaderboardEl.innerHTML = `
    <div class="card">
      <h3>Leaderboard</h3>
      <ul class="leaderboard">
        ${leaderboard.map((e) => `<li><span>${e.nickname}</span><span>${e.score}</span></li>`).join("")}
      </ul>
    </div>
  `;
});

socket.on("question:summary", ({ total, correctCount, wrongCount, avgMs }) => {
  summaryEl.innerHTML = `
    <div class="card">
      <h3>Question Summary</h3>
      <div>Total answers: ${total}</div>
      <div>Correct: ${correctCount}</div>
      <div>Wrong: ${wrongCount}</div>
      <div>Avg time: ${avgMs} ms</div>
    </div>
  `;
});

socket.on("session:finished", ({ leaderboard }) => {
  currentQuestionEl.innerHTML = `<div class="card"><h3>Session Finished</h3></div>`;
  nextBtn.disabled = true;
  endQuestionBtn.disabled = true;
  leaderboardEl.innerHTML = `
    <div class="card">
      <h3>Final Leaderboard</h3>
      <ul class="leaderboard">
        ${leaderboard.map((e) => `<li><span>${e.nickname}</span><span>${e.score}</span></li>`).join("")}
      </ul>
    </div>
  `;
});

function renderLobby(players) {
  playersEl.innerHTML = players.map((p) => `
    <li>
      <span>${p.nickname} — ${p.score}</span>
      <span>
        <button class="danger" data-act="kick" data-nick="${p.nickname}">Kick</button>
        <button class="secondary" data-act="block" data-nick="${p.nickname}">Block</button>
      </span>
    </li>
  `).join("");
  [...playersEl.querySelectorAll("button")].forEach(btn => {
    const act = btn.dataset.act;
    const nick = btn.dataset.nick;
    btn.addEventListener("click", () => {
      if (act === "kick") socket.emit("host:kick", { sessionCode, nickname: nick });
      if (act === "block") socket.emit("host:blockNick", { sessionCode, nickname: nick });
    });
  });
}
