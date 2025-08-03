You're a top-tier frontend engineer with a keen eye for design. I want you to build a beautiful and functional Chrome extension for ReelCheck — a tool that helps users fact-check reels and shorts (like Instagram Reels or YouTube Shorts).

🧑‍💻 Goal:
Build a polished Chrome extension that integrates with my existing backend and offers a clean, Apple-inspired UI with smooth transitions and a minimal, modern feel. It should be fast, intuitive, and visually satisfying.

🔐 Authentication:
Implement full user authentication using:

Signup: name, email, password

Login: email and password

JWT-based token handling (store tokens securely in extension storage)

Show clear input validations, error messages, and success states

🎬 Core Features:
The extension should allow authenticated users to:

Paste a reel/short URL

Trigger content analysis via POST /analyze

See real-time task progress via GET /status/{task_id}

View past analyses from GET /history

Open detailed result from GET /analysis/{analysis_id}

🔄 Loading / Progress UI:
Include a beautiful loader or progress animation with clean transitions

It should clearly represent the analysis states:

Queued → Processing → Completed

Should match the Apple design language: soft motion, subtle blur, minimalism

🧠 Backend Info (Already Built):
FastAPI with JWT auth, Celery for background tasks, PostgreSQL

Endpoints:

POST /analyze → trigger new analysis (rate-limited to 5/min)

GET /status/{task_id} → check current progress

GET /history → list of past analyses

GET /analysis/{analysis_id} → full analysis

CORS allowed for http://localhost:3000

🛠️ Tech Guidelines:
Use React (preferred) or Vanilla JS + Tailwind

Follow clean code practices and component-based architecture

Use Context API or Redux if needed

UI must support:

Dark/Light mode toggle

Auth token management

Error states, loaders, and feedback messages

Ensure it's accessible, responsive, and performance-optimized

📦 Deliverables:
Full extension folder ready to load into Chrome

manifest.json (Manifest V3)

Popup or sidebar UI

API-integrated and styled loader

Clean folder structure

README with install/setup/run instructions