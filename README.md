# VisionCam

![VisionCam workflow](Image.png)

VisionCam is a driver safety monitoring system designed to help detect unsafe driving behavior in real time using a webcam and AI-based analysis. It watches for signs such as drowsiness, distraction, and head movement issues while a driver is on the road, then raises alerts and can notify emergency contacts through Telegram.

The project is split into three connected parts:

- Frontend: React + Vite app for login, signup, dashboard, alerts, and live monitoring
- Backend: Node.js + Express API for authentication, user data, warnings, and emergency alerts
- ML service: Python + FastAPI service that processes camera frames to detect drowsiness and distraction

---

## What VisionCam is about

VisionCam helps create a safer driving experience by combining computer vision with a web dashboard.


## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Vite + JavaScript | User interface, auth screens, dashboard, monitoring page |
| UI styling | CSS / Tailwind-like custom styling | Dashboard and app design |
| Backend | Node.js + Express + TypeScript | Auth, API routes, user management, warning handling |
| Database | MongoDB + Mongoose | Stores users, warnings, emergency events, and contact info |
| ML | Python + FastAPI | Processes webcam frames and predicts drowsiness/distraction |
| CV / AI | OpenCV + MediaPipe / face landmark models | Detects face landmarks, eye state, mouth movement, and head pose |
| Alerts | Telegram Bot API | Sends emergency notifications to family or contacts |
| Auth | JWT + bcrypt | User login and secure token-based session handling |
| Frontend env config | Vite env vars | Connects frontend to local or deployed backend/ML services |

---

## How the parts work together

The app is connected like this:

- The frontend reads values from environment variables such as:
  - `VITE_BACKEND_API`
  - `VITE_API_BASE`
- The webcam monitoring page captures frames and sends them to the Python ML API at `http://localhost:8000/api/detect`.
- The ML API returns analysis such as:
  - eye status
  - drowsiness detection
  - head direction
  - distraction flags
- The web app decides whether to show an alert on screen and trigger a warning event.
- The backend receives warning events at routes like `/api/v1/warning`.
- It stores the event in MongoDB and sends Telegram alert messages if the warning threshold is reached.

So the system is a loop:

Camera feed -> ML detection -> frontend alerting -> backend warning storage -> Telegram contact alert

---

## Run VisionCam on your laptop

Follow these steps from a terminal on your machine.

### 1) Clone the repository

```bash
git clone <https://github.com/HarshitaGupta-610/VisionCam>
cd VisionCam
```

### 2) Install frontend dependencies

```bash
npm install
```

### 3) Set up the frontend environment

Create a `.env` file in the project root:

```env
VITE_BACKEND_API=http://localhost:3001
VITE_API_BASE=http://localhost:8000
```

This tells the frontend where to find the backend and ML API while running locally.

### 4) Install backend dependencies

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
PORT=3001
JWT_SECRET=your_strong_secret_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/VisionCam?retryWrites=true&w=majority&appName=VisionCam
BOT_TOKEN=123456789:replace_with_telegram_bot_token
CORS_ORIGIN=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

> If you are using a local MongoDB instance, replace `MONGO_URI` with your local connection string.

### 5) Start the backend

From the `backend` folder:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:3001
```

You can check health with:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok" }
```

### 6) Start the ML service

Open a new terminal and go back to the project root:

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Then install the ML dependencies:

```bash
pip install -r ml/requirements.txt
```

Start the ML API:

```bash
uvicorn ml.ml_server:app --host 0.0.0.0 --port 8000 --reload
```

The ML service should be available at:

```text
http://localhost:8000
```

### 7) Start the frontend

Open another terminal in the project root:

```bash
npm run dev
```

The frontend should start with Vite and open locally in the browser, usually at:

```text
http://localhost:5173
```

---

## Important local setup notes

- The frontend must be able to reach the backend and ML API over localhost.
- Make sure your browser allows webcam access.
- The backend must have a valid MongoDB connection string.
- The Telegram bot only works if the emergency contact has messaged the bot before signup.
- If `BOT_TOKEN` is missing, Telegram alerts will not be sent.

---





