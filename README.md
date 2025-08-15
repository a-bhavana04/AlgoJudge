
AlgoJudge is a minimalist, open-source coding judge with secure Docker sandboxing and instant AI code analysis using a local Phi-4 (3.85B) LLM.

Features
--------
- Secure code execution in Docker containers (no network, memory/time limits)
- Automatic code analysis and optimization feedback after every run
- Streaming AI chat about your code
- Multi-language: Python, C++, C, Java, JavaScript, Go
- Modern React frontend

Quick Start
----------

1. Clone and enter the repo
   git clone <repo-url>
   cd AlgoJudge

2. Setup environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your DB and JWT settings

3. Build and run everything (Docker Compose)
   docker compose up --build

4. Access:
   - Frontend: http://localhost:3000
   - Backend:  http://localhost:8000
   - Docs:     http://localhost:8000/docs

Tech Stack
----------

- Frontend: React (Next.js), Tailwind, Monaco Editor
- Backend: FastAPI, SQLAlchemy, JWT Auth
- AI: Local Phi-4-mini-flash-reasoning (3.85B, transformers)
- Sandbox: Docker (per-language containers, no network)
- Database: PostgreSQL (Docker or AWS RDS)

API Endpoints
-------------

- POST /auth/register — Register user
- POST /auth/login — Login, get JWT
- POST /submit — Run code & get instant AI feedback
- POST /chat — Ask AI about your code (streaming)
- GET /dashboard — List submissions
- GET /healthz — Health check

Sandbox & Security
------------------

- Each run is isolated in Docker, no network, memory/time limits
- JWT authentication for all endpoints
- No user code ever runs on the host

AI Features
-----------

- Automatic code analysis: optimization, complexity, and suggestions after every run
- Streaming chat: ask follow-up questions about your code
- Local, open-source: no external API keys or paid models required

Deployment
----------

- Local: docker compose up --build
- Production: edit deployment/.env.prod, deploy on any VM with Docker (AWS EC2, etc.)
- Requirements: 4GB+ RAM, Docker, Python 3.11+ (for local dev)

Testing
-------

Backend:
   cd backend
   pytest

Frontend:
   cd frontend
   npm test


