# Production Deployment Guide

To deploy the **Multi-Agent Startup Simulator** to production, you will use a hybrid hosting model. This is the industry-standard architecture for Next.js + FastAPI architectures.

---

## 🏗 Deployment Architecture

1. **Frontend (Next.js)**: Hosted on **Vercel** (Serverless, optimized for React).
2. **Backend (FastAPI)**: Hosted on **Railway**, **Render**, or **Fly.io** (Serverful, supports persistent WebSocket connections).
3. **Database (PostgreSQL)**: Hosted on **Neon**, **Supabase**, or **Railway** (SQLite is not suitable for production because serverless/ephemeral instances reset files).

---

## 1. Database Setup (Neon / Supabase)

1. Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string. Make sure it looks like this:
   `postgresql://user:password@ep-host-name.pooler.useast.neon.tech/dbname?sslmode=require`
3. Convert the connection prefix to **`postgresql+asyncpg://...`** for async SQLAlchemy support.

---

## 2. Backend Deployment (Railway or Render)

FastAPI requires a serverful host to maintain persistent WebSockets. We recommend **Railway** (simplest setup) or **Render**.

### Option A: Railway (Recommended)
1. Log in to [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo** -> Select this repository.
3. In settings, set the **Root Directory** to `backend`.
4. Configure the following **Environment Variables**:
   - `DATABASE_URL`: Your `postgresql+asyncpg://...` Neon connection string.
   - `OPENAI_API_KEY`: Your production OpenAI API Key.
   - `TAVILY_API_KEY`: Your Tavily Search API Key.
   - `E2B_API_KEY`: Your E2B Sandbox API Key.
5. Railway will automatically detect the Python environment, install `requirements.txt`, and deploy the server.
6. Copy the generated public URL (e.g. `https://your-backend.up.railway.app`).

---

## 3. Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project** -> Select this repository.
3. Set the **Root Directory** to `frontend`.
4. Set the **Framework Preset** to `Next.js`.
5. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.up.railway.app/api` (The Railway backend URL + `/api`)
   - `NEXT_PUBLIC_WS_URL`: `wss://your-backend.up.railway.app/ws` (Note the **`wss://`** protocol for secure production WebSockets)
6. Click **Deploy**.
