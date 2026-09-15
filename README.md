# Study Buddy — AI Learning Companion

Upload your syllabus or notes and get simplified explanations, auto-generated
quiz questions, a day-by-day revision plan, and a doubt-solving chatbot — all
grounded in *your* material, not generic web answers.

Built for the SkillUp Hackathon (IBM SkillsBuild).

## Why this project

Students learn at different paces and in different ways, but most course
material is delivered one way for everyone. This tool lets a student paste in
their own notes and immediately get: a simpler explanation, a self-test, and a
plan for how to actually use the remaining time before an exam — closing the
loop between "I have notes" and "I understand and am prepared."

## Features

| Feature | What it does |
|---|---|
| Explain | "ELI10" / undergrad / exam-crunch simplification of uploaded notes |
| Quiz | Auto-generates multiple-choice questions (Kahoot-style) with instant feedback |
| Revision Plan | Day-by-day plan sized to days-left and hours/day, sequenced hard→easy |
| Doubt Chat | Q&A chatbot that answers strictly from the uploaded notes |

## Architecture

```
frontend/   plain HTML/CSS/JS — no build step, opens directly in a browser
backend/    Flask API, one endpoint per feature, all backed by an
            OpenAI-compatible LLM call (llm_client.py)
```

`llm_client.py` is intentionally the *only* file that talks to the model
provider. It targets any OpenAI-compatible `/chat/completions` endpoint, so
swapping providers (IBM watsonx.ai, OpenAI, etc.) is a `.env` change, not a
code change.

## Running locally

```bash
cd backend
cp .env.example .env        # fill in LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
pip install -r requirements.txt
python app.py                # serves on :5000

# in another terminal
cd frontend
python -m http.server 8000   # serves on :8000
```

Open `http://localhost:8000`.

## Technology Used — IBM Bob

## What Bob built / refactored in this repo

The code is self-documenting about Bob's involvement because every fix was annotated with a `#N fix:` comment. Here's the full breakdown:

### Backend — [`app.py`](study-buddy/backend/app.py) & [`llm_client.py`](study-buddy/backend/llm_client.py)

**Scaffolded entirely in agent mode:**

| File | What Bob built |
|---|---|
| [`app.py`](study-buddy/backend/app.py) | All 5 Flask routes: `/api/health`, `/api/upload`, `/api/explain`, `/api/quiz`, `/api/revision-plan`, `/api/doubt` |
| [`app.py:18`](study-buddy/backend/app.py:18) | `extract_text()` — dual-path PDF (`PyPDF2`) + plaintext fallback |
| [`app.py:52-60`](study-buddy/backend/app.py:52) | The `level_prompts` dict with three tuned system-prompt variants (`eli10`, `eli-undergrad`, `exam-crunch`) |
| [`app.py:74-83`](study-buddy/backend/app.py:74) | The JSON-schema system prompt for the quiz endpoint — exact shape with `correct_index`, `explanation`, plausible-distractor instruction |
| [`app.py:95-103`](study-buddy/backend/app.py:95) | The JSON-schema system prompt for `revision-plan` — day-by-day shape, hard-first sequencing instruction |
| [`llm_client.py`](study-buddy/backend/llm_client.py) | Provider-agnostic thin wrapper; watsonx / OpenAI / Groq switchable via `.env`; `chat_json()` with code-fence-stripping fallback parser |

### Frontend — [`app.js`](study-buddy/frontend/app.js)

**12 numbered bugs fixed (all annotated inline):**

| Fix # | Location | What Bob fixed |
|---|---|---|
| `#1` | [`renderPlan()`](study-buddy/frontend/app.js:187) | XSS: rewrote `innerHTML` injection → `textContent` + `createTextNode` for all API-supplied values |
| `#2` | [`renderQuiz()` option click](study-buddy/frontend/app.js:145) | Wrong answer highlight: replaced broken `wrap.children` index arithmetic with `querySelectorAll(".quiz-opt")[q.correct_index]` |
| `#3` | [Quiz & plan button handlers](study-buddy/frontend/app.js:103) | `parseInt(..., 10)` — `<input type="number">.value` is always a string; the API was receiving a string not a number |
| `#4` | [Upload handler](study-buddy/frontend/app.js:41) | Missing `res.ok` check before `.json()` parse on the upload path |
| `#5` | [`askDoubt()`](study-buddy/frontend/app.js:241) | Unbounded `chatHistory` payload growth — added `MAX_HISTORY_TURNS = 10` sliding window + in-memory trim |
| `#6` | Module level | Dead `notesText` module-level variable removed; `getNotes()` now reads the DOM directly |
| `#7` | [`renderQuiz()`](study-buddy/frontend/app.js:118) | Silent no-op when 0 questions returned → user-visible message |
| `#8` | [`renderPlan()`](study-buddy/frontend/app.js:183) | Same: silent clear → user-visible message when plan is empty |
| `#9` | [Tab click handler](study-buddy/frontend/app.js:19) | `?.classList.add("active")` null-guard when `data-tab` doesn't match any element ID |
| `#10` | [Enter-key handler](study-buddy/frontend/app.js:218) | Documented that `askDoubt()` already guards empty input, no extra check needed |
| `#11` | All 5 action buttons | Button disabled during in-flight async requests to prevent overlapping API calls; re-enabled in `finally` |
| `#12` | `notesInput`, `notesStatus`, `chatWindow` refs | Null-guards on all three eager element references |

### CSS / HTML — [`style.css`](study-buddy/frontend/style.css) & [`index.html`](study-buddy/frontend/index.html)

- Authored the full "ruled-paper notebook" visual theme (`--bg`, `--panel`, `--chalk`, `--rule`, red margin line via `::before` pseudo-element)
- Structured the tabbed layout and all four feature panels in HTML
- Quiz option correct/incorrect state styles (`.quiz-opt.correct`, `.quiz-opt.incorrect`)

---

## Workflows Bob specifically sped up

1. **Flask route scaffolding** — all 5 routes written in a single agent pass, including the `MAX_NOTES_CHARS` truncation guard on every endpoint.

2. **JSON-schema system prompts** — the structured prompts for `/api/quiz` and `/api/revision-plan` (exact JSON shape in the prompt, plausible-distractor wording, hard-first sequencing) were authored and iterated by Bob, saving the back-and-forth of trial-and-error prompt tuning.

3. **PDF text extraction** — [`extract_text()`](study-buddy/backend/app.py:18) with `PyPDF2.PdfReader` + per-page `.extract_text() or ""` null-coalescing was written and debugged directly.

4. **Provider-agnostic `llm_client.py`** — the code-fence-stripping fallback in [`chat_json()`](study-buddy/backend/llm_client.py:53) (`strip('`')`, `if cleaned.startswith("json")`) was a specific debugging step for providers that ignore `response_format`.

5. **Bug sweep on `app.js`** — the 12-fix refactor pass was done in agent mode, reading the entire file, identifying all issues in parallel (XSS, broken index math, `parseInt` omissions, missing `res.ok` guards, payload growth), then applying targeted `apply_diff` patches in a single session rather than manual debugging each one separately.

## Team

- Name:cisco
- College: PES University, Electronic City Campus
- Team members:1
