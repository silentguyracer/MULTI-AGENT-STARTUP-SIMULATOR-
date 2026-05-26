# 🌌 Antigravity AI Startup OS
### *A Multi-Agent Autonomous Startup Simulator*

AI Startup OS is a futuristic multi-agent sandbox where autonomous agents (CEO, CTO, PM, Designer, Marketer, Investor) collaborate using LangGraph & WebSockets. They brainstorm ideas, manage Kanban boards, compile pitch decks, and write code inside a premium, voice-controlled dashboard.

---

## 🚀 Core Capabilities

*   **Autonomous Brainstorming Loops**: The board debates feasibility, technical complexity, and target markets to refine a raw startup idea.
*   **Kanban Task Orchestration**: The Product Manager agent translates the board's consensus into concrete Kanban tickets.
*   **Code Generation & Execution Sandbox**: The CTO agent designs the system architecture, generates code, and runs compilation tests.
*   **Artifact Generation**: The team collaborates to generate structured documents, including **Market Research**, **System Architectures**, and **Investor Pitch Decks**.
*   **Venture Capital Investor Simulation**: An Investor agent challenges financial viability and decides if the startup deserves venture funding.

---

## 🛠 Tech Stack

*   **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion, Zustand, Socket.io-client.
*   **Backend**: Python 3.12, FastAPI, LangChain, LangGraph, SQLModel/SQLAlchemy.
*   **Database**: PostgreSQL / Neon DB (with SQLite local fallback).

---

## 🚀 How to Run Locally

### 1. Setup Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit the app at `http://localhost:3000`.
