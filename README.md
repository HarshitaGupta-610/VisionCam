# VisionCam

VisionCam is a driver safety monitoring project with three parts:

- Frontend (React + Vite)
- Backend (Node.js + Express + MongoDB + Telegram alerts)
- ML API (FastAPI)

## What is deployed

- Frontend calls backend using `VITE_BACKEND_API`
- Frontend calls ML API using `VITE_API_BASE`
- Backend sends Telegram messages after warning alarms (for repeated unsafe events)

## 1) Frontend environment

Create `.env` in project root:

```env
VITE_BACKEND_API=https://your-backend-domain.com
VITE_API_BASE=https://your-ml-domain.com
```

Build and run frontend:

```bash
npm install
npm run build
npm run preview
```

## 2) Backend environment

Create `backend/.env`:

```env
PORT=3001
JWT_SECRET=replace_with_strong_secret
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/visioncam
BOT_TOKEN=123456789:replace_with_telegram_bot_token
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:5173
BACKEND_URL=https://your-backend-domain.com
```

Build and run backend:

```bash
cd backend
npm install
npm run build
npm start
```

Health check:

- `GET /health` -> `{ "status": "ok" }`

## 3) ML API deployment

Install dependencies:

```bash
pip install -r ml/requirements.txt
```

Run ML API:

```bash
uvicorn ml.ml_server:app --host 0.0.0.0 --port 8000
```

Endpoints:

- `GET /health`
- `POST /api/detect`

## Telegram alert flow

1. Emergency contact must message your Telegram bot first.
2. On signup, backend links emergency contact to Telegram chat id.
3. Monitor sends warning events to backend when risky behavior is detected.
4. Backend sends Telegram alert after threshold warnings in time window.

## Deployed URL checklist

1. Frontend deployed URL is added in backend `CORS_ORIGIN`.
2. Frontend `.env` has correct backend and ML URLs.
3. Backend has valid `MONGO_URI`, `JWT_SECRET`, and `BOT_TOKEN`.
4. Telegram bot has received at least one message from contact users.
