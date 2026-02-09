const socket = io();

const codeEl = document.getElementById("code");
const nickEl = document.getElementById("nick");
const joinBtn = document.getElementById("join");
const joinStatusEl = document.getElementById("join-status");
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const rankEl = document.getElementById("rank");

let sessionCode = null;
let nickname = null;
let hasAnswered = false;

joinBtn.addEventListener("click", () => {
  sessionCode = codeEl.value.trim().toUpperCase();
  nickname = nickEl.value.trim();
  if (!sessionCode || !nickname) {
    joinStatusEl.textContent = "Enter code and nickname";
    return;
  }
  socket.emit("player:join", { sessionCode, nickname });
});

socket.on("player:join:ok", ({ nickname: finalNickname }) => {
  joinStatusEl.textContent = `Joined as ${finalNickname}`;
});

socket.on("player:join:error", ({ message }) => {
  joinStatusEl.textContent = message;
});

socket.on("question:show", ({ index, text, choices, timerSec }) => {
  hasAnswered = false;
  feedbackEl.textContent = "";
  questionEl.innerHTML = `
    <div class="card">
      <h3>Q${index + 1}: ${text}</h3>
      <div>Timer: ${timerSec}s</div>
      <div class="choices" style="margin-top:8px;">
        ${choices.map((c, i) => `<button class="choice" data-index="${i}">${String.fromCharCode(65 + i)}. ${c}</button>`).join("")}
      </div>
    </div>
  `;
  [...questionEl.querySelectorAll(".choice")].forEach(btn => {
    btn.addEventListener("click", () => {
      if (hasAnswered) return;
      hasAnswered = true;
      const choiceIndex = Number(btn.dataset.index);
      socket.emit("player:answer", { sessionCode, choiceIndex });
    });
  });
});

socket.on("player:feedback", ({ correct }) => {
  feedbackEl.textContent = correct ? "Correct!" : "Wrong";
});

socket.on("leaderboard:update", ({ leaderboard }) => {
  const you = leaderboard.find((e) => e.nickname === nickname);
  if (you) {
    rankEl.textContent = `Your score: ${you.score}`;
  } else {
    rankEl.textContent = "";
  }
});
