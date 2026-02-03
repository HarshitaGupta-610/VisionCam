"""
Drowsiness detection via Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR),
blink counting, and yawn detection. Uses shared face landmarks; no training.
"""

import numpy as np

from .config import (
    EAR_CLOSED_THRESHOLD,
    MAR_YAWN_THRESHOLD,
    BLINK_CONSEC_FRAMES,
    YAWN_CONSEC_FRAMES,
    DROWSY_BLINK_WINDOW_SEC,
    DROWSY_BLINK_COUNT,
    ASSUMED_FPS,
)
from .utils.face_landmarks import get_face_landmarks


def _dist(a, b):
    return np.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _ear_6pts(pts):
    d1 = _dist(pts[1], pts[5])
    d2 = _dist(pts[2], pts[4])
    d3 = _dist(pts[0], pts[3])
    if d3 < 1e-6:
        return 0.0
    return (d1 + d2) / (2.0 * d3)


def _mar_6pts(pts):
    d1 = _dist(pts[1], pts[5])
    d2 = _dist(pts[2], pts[4])
    d3 = _dist(pts[0], pts[3])
    if d3 < 1e-6:
        return 0.0
    return (d1 + d2) / (2.0 * d3)


class DrowsinessModel:
    def __init__(self):
        self.consec_closed = 0
        self.consec_yawn = 0
        self.blink_count = 0
        self.blink_frames = []
        self.frame_index = 0
        self.window_frames = int(DROWSY_BLINK_WINDOW_SEC * ASSUMED_FPS)

    def process(self, frame, landmarks=None):
        self.frame_index += 1
        out = {
            "drowsy": False,
            "eye_status": "open",
            "blink_count": int(self.blink_count),
            "yawn_detected": False,
            "ear": 0.0,
            "mar": 0.0,
        }

        if landmarks is None:
            landmarks = get_face_landmarks(frame)

        if not landmarks["face_detected"] or not landmarks["left_eye"] or not landmarks["mouth"]:
            self.consec_closed = 0
            self.consec_yawn = 0
            return out

        left = landmarks["left_eye"]
        right = landmarks["right_eye"]
        mouth = landmarks["mouth"]

        ear = float((_ear_6pts(left) + _ear_6pts(right)) / 2.0)
        mar = float(_mar_6pts(mouth))

        out["ear"] = ear
        out["mar"] = mar

        closed = bool(ear < EAR_CLOSED_THRESHOLD)
        if closed:
            self.consec_closed += 1
        else:
            if self.consec_closed >= BLINK_CONSEC_FRAMES:
                self.blink_count += 1
                self.blink_frames.append(self.frame_index)
            self.consec_closed = 0

        cutoff = self.frame_index - self.window_frames
        self.blink_frames = [f for f in self.blink_frames if f > cutoff]
        blinks_in_window = len(self.blink_frames)

        yawning = bool(mar > MAR_YAWN_THRESHOLD)
        if yawning:
            self.consec_yawn += 1
        else:
            self.consec_yawn = 0

        yawn_detected = bool(self.consec_yawn >= YAWN_CONSEC_FRAMES)
        out["yawn_detected"] = yawn_detected

        out["eye_status"] = "closed" if closed else "open"
        out["blink_count"] = int(self.blink_count)
        out["drowsy"] = bool(
            (blinks_in_window >= DROWSY_BLINK_COUNT) or yawn_detected
        )

        return out