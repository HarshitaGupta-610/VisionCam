"""
Improved distraction detection using MediaPipe landmarks only.
No solvePnP. More stable for driver monitoring.
"""

import numpy as np
from collections import deque
import time 
YAW_DEADZONE = 6
PITCH_DEADZONE = 8 


from ml.utils.face_landmarks import get_face_landmarks
from .config import (
    YAW_LIMIT_DEG,
    PITCH_LIMIT_DEG,
    LOOK_AWAY_CONSEC_FRAMES,
)

# key landmark indices (MediaPipe)
NOSE = 1
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
CHIN = 152
FOREHEAD = 10


class DistractionModel:
    def __init__(self):
        
        self.consec_look_away = 0
        self.calibrated = False
        self.away_start_time = None
        self.away_alert_seconds = 2.5   # adjust later
        self.away_frame_buffer = 0
        self.away_frame_threshold = 3   # require 3 forward frames to reset
        self.alert_fired = False 
        # smoothing buffers
        self.yaw_hist = deque(maxlen=5)
        self.pitch_hist = deque(maxlen=5)

        # ✅ NEW — calibration + direction smoothing
        self.calib_frames = 30
        self.calib_yaw = []
        self.calib_pitch = []
        self.yaw_offset = 0.0
        self.pitch_offset = 0.0

        self.dir_hist = deque(maxlen=7)   # direction vote smoothing

    def _mean(self, arr):
        return float(sum(arr) / len(arr)) if arr else 0.0

    def _estimate_pose(self, pts):
        nose = pts[NOSE]
        left_eye = pts[LEFT_EYE_OUTER]
        right_eye = pts[RIGHT_EYE_OUTER]
        chin = pts[CHIN]
        forehead = pts[FOREHEAD]

        # ---- normalize by face width ----
        face_width = np.linalg.norm(
            np.array(right_eye) - np.array(left_eye)
        ) + 1e-6

        # eye center
        eye_center = (
            (left_eye[0] + right_eye[0]) / 2,
            (left_eye[1] + right_eye[1]) / 2,
        )

        # ---- YAW (left/right turn) ----
        # nose horizontal offset from eye center
        dist_left = abs(nose[0] - left_eye[0])
        dist_right = abs(right_eye[0] - nose[0])

        yaw_raw = (dist_left - dist_right) / face_width
        yaw_deg = -yaw_raw * 200
        # ---- PITCH (up/down tilt) ----
        face_height = np.linalg.norm(
            np.array(chin) - np.array(forehead)
        ) + 1e-6

        # use mid of forehead–chin as vertical center
        face_mid_y = (forehead[1] + chin[1]) / 2

        pitch_raw = (nose[1] - face_mid_y) / face_height
        pitch_deg = pitch_raw * 260

        # ---- ROLL (head tilt sideways) ----
        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        roll_deg = np.degrees(np.arctan2(dy, dx))

        return yaw_deg, pitch_deg, roll_deg

    def process(self, frame, landmarks=None):
        out = {
            "distracted": False,
            "looking_away": False,
            "direction": "unknown",
            "away_direction": "unknown",
            "attention_alert": False,
            "away_duration": 0.0,      
            "calibrated": self.calibrated,
            "head_pose": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0},
        }

        if landmarks is None:
            landmarks = get_face_landmarks(frame)

        if not landmarks["face_detected"]:
            self.consec_look_away = 0
            self.yaw_hist.clear()
            self.pitch_hist.clear()
            self.away_start_time = None
            self.alert_fired = False
            self.away_frame_buffer = 0
            self.dir_hist.clear()
            return out

        pts = landmarks["all_landmarks"]
        yaw, pitch, roll = self._estimate_pose(pts)

        # ---- smoothing ----
        self.yaw_hist.append(yaw)
        self.pitch_hist.append(pitch)

        yaw_s = self._mean(self.yaw_hist)
        pitch_s = self._mean(self.pitch_hist)
        
        # ✅ --- AUTO CALIBRATION ---
        if len(self.calib_yaw) < self.calib_frames:
            self.calib_yaw.append(yaw_s)
            self.calib_pitch.append(pitch_s)

             # ✅ ADD THIS LINE HERE
            print("CALIB collecting:", len(self.calib_yaw))
            if len(self.calib_yaw) == self.calib_frames:
                self.yaw_offset = sum(self.calib_yaw) / len(self.calib_yaw)
                self.pitch_offset = sum(self.calib_pitch) / len(self.calib_pitch)
                self.calibrated = True
                print("CALIBRATED offsets:", self.yaw_offset, self.pitch_offset)

        # subtract learned forward bias
        yaw_s -= self.yaw_offset
        pitch_s -= self.pitch_offset
        
        # ✅ dead-zone jitter removal
        if abs(yaw_s) < YAW_DEADZONE:
            yaw_s = 0.0

        if abs(pitch_s) < PITCH_DEADZONE:
            pitch_s = 0.0
        
        # ✅ dominant-axis direction decision (MOVE HERE)
        if abs(pitch_s) > abs(yaw_s)+5:
            if pitch_s > PITCH_LIMIT_DEG:
                dir_now = "down"
            elif pitch_s < -PITCH_LIMIT_DEG:
                dir_now = "up"
            else:
                dir_now = "forward"
        else:
            if yaw_s > YAW_LIMIT_DEG:
                dir_now = "right"
            elif yaw_s < -YAW_LIMIT_DEG:
                dir_now = "left"
            else:
                dir_now = "forward"
        
        self.dir_hist.append(dir_now)
        dir_smooth = max(set(self.dir_hist), key=self.dir_hist.count)
        

        away = (dir_smooth != "forward") and self.calibrated

        out["head_pose"]["yaw"] = round(yaw_s, 2)
        out["head_pose"]["pitch"] = round(pitch_s, 2)
        out["head_pose"]["roll"] = round(float(roll), 2)

        # 👇 ADD THIS
        print("Yaw:", yaw_s, "Pitch:", pitch_s)

        # ---- distraction rule ----
        # away_raw = (
        #     abs(yaw_for_alert) > YAW_ALERT_LIMIT or
        #     abs(pitch_for_alert) > PITCH_ALERT_LIMIT
        # )
        # away = away_raw and self.calibrated
        
        

        # ✅ TIME ALERT BLOCK HERE
        now = time.time()

        # ✅ STABLE away buffer logic
        if away:
            self.away_frame_buffer = self.away_frame_threshold

            prev_dir = getattr(self, "away_direction", None)

            # ✅ reset timer + alert if:
            # 1) first away frame
            # 2) direction changed
            if self.away_start_time is None or dir_smooth != prev_dir:
                self.away_start_time = now
                self.away_direction = dir_smooth
                self.alert_fired = False
                print("RESET ALERT — new away direction:", dir_smooth)

        else:
            self.away_frame_buffer = 0
        # clamp
        self.away_frame_buffer = max(0, self.away_frame_buffer)

        # only reset if stable forward
        if not away:
            self.away_start_time = None
            self.alert_fired = False
        out["looking_away"] = away
        out["away_duration"] = (
            now - self.away_start_time
            if self.away_start_time is not None
            else 0.0
        )

        if out["away_duration"] >= self.away_alert_seconds and not self.alert_fired:
            out["attention_alert"] = True
            self.alert_fired = True
        else:
            out["attention_alert"] = False

        if away:
            self.consec_look_away += 1
        else:
            self.consec_look_away = 0

        out["distracted"] = (
            self.consec_look_away >= LOOK_AWAY_CONSEC_FRAMES
        )

       
        # vote smoothing
        out["direction"] = dir_smooth
        out["away_direction"] = getattr(self, "away_direction", dir_now)
        print("DIRECTION:", out["direction"])
        out["calibrated"] = self.calibrated
        return out