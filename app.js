const API_BASE = window.API_BASE || "http://localhost:5000/api";

let notesText = "";
let chatHistory = [];

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// --- Notes input ---
const notesInput = document.getElementById("notesInput");
const notesStatus = document.getElementById("notesStatus");

notesInput.addEventListener("input", () => {
  notesText = notesInput.value;
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    notesStatus.textContent = "Choose a file first.";
    return;
  }
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  notesStatus.textContent = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    notesText = data.text;
    notesInput.value = notesText;
    notesStatus.textContent = `Loaded ${data.chars} characters.`;
  } catch (err) {
    notesStatus.textContent = `Error: ${err.message}`;
  }
});

function getNotes() {
  return notesInput.value.trim();
}

async function callApi(endpoint, body) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// --- Explain ---
document.getElementById("explainBtn").addEventListener("click", async () => {
  const notes = getNotes();
  const out = document.getElementById("explainOutput");
  if (!notes) { out.textContent = "Add some notes first."; return; }
  out.textContent = "Thinking...";
  try {
    const data = await callApi("explain", { notes, level: document.getElementById("levelSelect").value });
    out.textContent = data.explanation;
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  }
});

// --- Quiz ---
document.getElementById("quizBtn").addEventListener("click", async () => {
  const notes = getNotes();
  const out = document.getElementById("quizOutput");
  if (!notes) { out.textContent = "Add some notes first."; return; }
  out.textContent = "Generating quiz...";
  try {
    const data = await callApi("quiz", {
      notes,
      num_questions: document.getElementById("numQuestions").value,
      difficulty: document.getElementById("difficultySelect").value,
    });
    renderQuiz(data.questions || []);
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  }
});

function renderQuiz(questions) {
  const out = document.getElementById("quizOutput");
  out.innerHTML = "";
  questions.forEach((q, qi) => {
    const wrap = document.createElement("div");
    wrap.className = "quiz-q";
    const p = document.createElement("p");
    p.className = "question";
    p.textContent = `${qi + 1}. ${q.question}`;
    wrap.appendChild(p);

    const explainEl = document.createElement("div");
    explainEl.className = "quiz-explain";

    q.options.forEach((opt, oi) => {
      const b = document.createElement("button");
      b.className = "quiz-opt";
      b.textContent = opt;
      b.addEventListener("click", () => {
        wrap.querySelectorAll(".quiz-opt").forEach((el) => (el.disabled = true));
        if (oi === q.correct_index) {
          b.classList.add("correct");
        } else {
          b.classList.add("incorrect");
          wrap.children[q.correct_index + 1]?.classList.add("correct");
        }
        explainEl.textContent = q.explanation || "";
      });
      wrap.appendChild(b);
    });
    wrap.appendChild(explainEl);
    out.appendChild(wrap);
  });
}

// --- Revision plan ---
document.getElementById("planBtn").addEventListener("click", async () => {
  const notes = getNotes();
  const out = document.getElementById("planOutput");
  if (!notes) { out.textContent = "Add some notes first."; return; }
  out.textContent = "Building your plan...";
  try {
    const data = await callApi("revision-plan", {
      notes,
      days: document.getElementById("planDays").value,
      hours_per_day: document.getElementById("planHours").value,
    });
    renderPlan(data.plan || []);
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  }
});

function renderPlan(plan) {
  const out = document.getElementById("planOutput");
  out.innerHTML = "";
  plan.forEach((d) => {
    const wrap = document.createElement("div");
    wrap.className = "plan-day";
    wrap.innerHTML = `<h3>Day ${d.day} — ${d.est_hours}h</h3>
      <p><strong>Topics:</strong> ${(d.topics || []).join(", ")}</p>
      <p><strong>Tasks:</strong> ${(d.tasks || []).join("; ")}</p>`;
    out.appendChild(wrap);
  });
}

// --- Doubt chat ---
const chatWindow = document.getElementById("chatWindow");
document.getElementById("doubtBtn").addEventListener("click", askDoubt);
document.getElementById("doubtInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") askDoubt();
});

async function askDoubt() {
  const input = document.getElementById("doubtInput");
  const question = input.value.trim();
  const notes = getNotes();
  if (!question) return;
  if (!notes) { addChatMsg("assistant", "Add your notes first so I can ground answers in them."); return; }

  addChatMsg("user", question);
  input.value = "";
  chatHistory.push({ role: "user", content: question });

  try {
    const data = await callApi("doubt", { notes, question, history: chatHistory.slice(0, -1) });
    addChatMsg("assistant", data.answer);
    chatHistory.push({ role: "assistant", content: data.answer });
  } catch (err) {
    addChatMsg("assistant", `Error: ${err.message}`);
  }
}

function addChatMsg(role, text) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
