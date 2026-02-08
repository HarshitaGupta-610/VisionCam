"""
FastAPI inference API for VisionCam ML backend.
POST /api/detect with image → drowsiness, distraction, phone_usage.
"""

import time
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from .config import INPUT_HEIGHT, INPUT_WIDTH
from .distraction_model import DistractionModel
from .drowsiness_model import DrowsinessModel

from .utils.face_landmarks import get_face_landmarks


app = FastAPI(title="VisionCam ML API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared stateful models (one face-landmark run per request, then drowsiness + distraction).
_drowsiness = DrowsinessModel()
_distraction = DistractionModel()


# 🔹 NEW: convert NumPy → Python
def _py(x):
    if isinstance(x, np.generic):
        return x.item()
    return x



def _decode_image(raw: bytes) -> np.ndarray:
    buf = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image")
    return img


def _resize_if_needed(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    if (w, h) != (INPUT_WIDTH, INPUT_HEIGHT):
        return cv2.resize(img, (INPUT_WIDTH, INPUT_HEIGHT))
    return img


@app.get("/")
def root():
    return {"service": "VisionCam ML API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/detect")
async def detect(file: UploadFile = File(...)):
    """
    Run drowsiness, distraction, and phone-usage detection on one image.
    Upload as multipart form with key "file" (image file).
    """
    t0 = time.perf_counter()
    raw = await file.read()
    frame = _decode_image(raw)
    frame = _resize_if_needed(frame)

    landmarks = get_face_landmarks(frame)

    drowsiness = _drowsiness.process(frame, landmarks=landmarks)
    distraction = _distraction.process(frame, landmarks=landmarks)
   
    if not landmarks["face_detected"]:
            return {
                "drowsiness": {
                    "drowsy": False,
                    "eye_status": "no_face",
                    "blink_count": 0,
                    "yawn_detected": False,
                    "ear": 0.0,
                    "mar": 0.0,
                    "mar_raw": 0.0,
                    "mar_threshold": None,
                    "mouth_vert_norm": 0.0,
                },
                "distraction": {
                    "distracted": False,
                    "looking_away": False,
                    "head_pose": None,
                },
                "duration_ms": 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    duration_ms = (time.perf_counter() - t0) * 1000
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    drowsiness_payload = {
        "drowsy": _py(drowsiness["drowsy"]),
        "eye_status": drowsiness["eye_status"],
        "blink_count": int(drowsiness["blink_count"]),
        "yawn_detected": _py(drowsiness["yawn_detected"]),
        "ear": _py(drowsiness["ear"]),
        "mar": _py(drowsiness["mar"]),
        "mar_raw": _py(drowsiness.get("mar_raw")) if drowsiness.get("mar_raw") is not None else None,
        "mar_threshold": _py(drowsiness.get("mar_threshold")) if drowsiness.get("mar_threshold") is not None else None,
        "mouth_vert_norm": _py(drowsiness.get("mouth_vert_norm")) if drowsiness.get("mouth_vert_norm") is not None else None,
    }

    return {
        "drowsiness": drowsiness_payload,
        "distraction": {
            "distracted": distraction["distracted"],
            "looking_away": distraction["looking_away"],
            "direction": distraction["direction"],
            "away_duration": distraction.get("away_duration", 0.0),
            "attention_alert": distraction["attention_alert"],
            "away_direction": distraction["away_direction"],
            "calibrated": distraction["calibrated"],
            "head_pose": distraction["head_pose"],
        },
        
        "duration_ms": round(duration_ms, 2),
        "timestamp": ts,
    }
@app.post("/api/overlay")
async def overlay(file: UploadFile = File(...)):
    """Return a jpeg with mouth landmarks and MAR annotations drawn for debugging."""
    raw = await file.read()
    frame = _decode_image(raw)
    frame = _resize_if_needed(frame)

    landmarks = get_face_landmarks(frame)
    if not landmarks["face_detected"]:
        raise HTTPException(status_code=400, detail="No face detected")

    mouth = landmarks["mouth"]
    overlay = frame.copy()

    # Draw mouth landmarks
    for i, pt in enumerate(mouth):
        x, y = int(pt[0]), int(pt[1])
        cv2.circle(overlay, (x, y), 4, (0, 255, 0), -1)
        cv2.putText(
            overlay,
            str(i),
            (x + 6, y - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (0, 255, 0),
            1,
        )

    try:
        left, right = mouth[0], mouth[1]
        top_inner, bottom_inner = mouth[2], mouth[3]
        top_outer, bottom_outer = mouth[4], mouth[5]

        vertical_inner = np.linalg.norm(np.array(top_inner) - np.array(bottom_inner))
        vertical_outer = np.linalg.norm(np.array(top_outer) - np.array(bottom_outer))
        vertical = (vertical_inner + vertical_outer) / 2.0

        horizontal = np.linalg.norm(np.array(left) - np.array(right))
        mar = vertical / max(horizontal, 1e-6)

        cv2.putText(
            overlay,
            f"MAR: {mar:.3f}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2,
        )
    except Exception:
        pass

    ok, buf = cv2.imencode(".jpg", overlay)
    if not ok:
        raise HTTPException(status_code=500, detail="Could not encode overlay")

    return Response(content=buf.tobytes(), media_type="image/jpeg")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.ml_server:app", host="0.0.0.0", port=8000, reload=True)