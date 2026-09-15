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

*(fill in after your build session — this section is what the submission
form asks for)*

- Which parts of this repo did you build/refactor with Bob in the loop
  (agent mode, subagents, parallel tasks)?
- Any specific workflow Bob sped up (e.g. scaffolding the Flask routes,
  writing the JSON-schema prompts, debugging the PDF text extraction)?
- Attach/reference your Bob session report if the hackathon asks for one.

## Team

- Name:
- College: PES University, Electronic City Campus
- Team members:
