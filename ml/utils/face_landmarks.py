"""
Shared face detection and facial landmark extraction.
Uses MediaPipe Face Mesh; provides landmarks for drowsiness (EAR/MAR) and distraction (head pose).
"""

import cv2
import numpy as np
import mediapipe as mp

from ml.config import INPUT_WIDTH, INPUT_HEIGHT

# Robustly load the MediaPipe face_mesh module across different mediapipe releases.
# Older releases expose `mp.solutions.face_mesh`. Newer releases may expose `mediapipe.tasks`.
import importlib
import types
import os

def _load_face_mesh_module():
    # Preferred: attribute on the mediapipe package
    try:
        return mp.solutions.face_mesh
    except Exception:
        pass

    # Try several known legacy module paths
    for modname in ("mediapipe.solutions.face_mesh", "mediapipe.python.solutions.face_mesh"):
        try:
            return importlib.import_module(modname)
        except Exception:
            continue

    # New (mediapipe >= 0.10) uses the Tasks API: mediapipe.tasks.python.vision.face_landmarker
    try:
        from mediapipe.tasks.python.vision import face_landmarker as fl
        # Image helper lives under the vision.core package
        from mediapipe.tasks.python.vision.core import image as mp_image
        from mediapipe.tasks.python.core import base_options as bo
    except Exception:
        # Nothing matched — provide clear guidance
        raise ImportError(
            "Could not find a compatible MediaPipe FaceMesh module. "
            f"Installed mediapipe version: {getattr(mp, '__version__', 'unknown')}. "
            "Install an older mediapipe that exposes `mp.solutions.face_mesh` or use mediapipe>=0.10 and ensure the Tasks API is available."
        )

    class FaceMeshShim:
        """Compatibility shim exposing a .process(rgb_image) method and returning
        an object with `multi_face_landmarks` similar to the legacy API.
        """

        def __init__(
            self,
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ):
            # Map parameters to FaceLandmarkerOptions where possible. Keep it minimal and
            # tolerant to small API differences between mediapipe releases.
            try:
                running_mode = (
                    fl.FaceLandmarkerOptions.RunningMode.IMAGE
                    if static_image_mode
                    else fl.FaceLandmarkerOptions.RunningMode.VIDEO
                )
                options = fl.FaceLandmarkerOptions(
                    base_options=bo.BaseOptions(),
                    running_mode=running_mode,
                    num_faces=max_num_faces,
                )
            except Exception:
                # Fallback to the minimum required options
                options = fl.FaceLandmarkerOptions(base_options=bo.BaseOptions(), num_faces=max_num_faces)

            try:
                self._landmarker = fl.FaceLandmarker.create_from_options(options)
            except Exception as e:
                raise ImportError(
                    "Failed to create MediaPipe FaceLandmarker. "
                    "This may indicate a missing bundled model or incompatible mediapipe build. "
                    f"Original error: {e}"
                )

        def process(self, image_rgb: "np.ndarray"):
            # Accept an RGB numpy image (H, W, 3) and return an object with
            # a `multi_face_landmarks` list where each item has a `.landmark` list
            # of points with `.x` and `.y` in normalized coords.
            mp_img = mp_image.Image.create_from_array(image_rgb.astype("uint8"))
            result = self._landmarker.detect(mp_img)

            faces = []
            if not getattr(result, "face_landmarks", None):
                return types.SimpleNamespace(multi_face_landmarks=[])

            for flm in result.face_landmarks:
                pts = []
                seq = getattr(flm, "landmark", flm)
                for p in seq:
                    # Ensure float values and compatibility with legacy objects
                    x = float(getattr(p, "x", 0.0))
                    y = float(getattr(p, "y", 0.0))
                    pts.append(types.SimpleNamespace(x=x, y=y))
                faces.append(types.SimpleNamespace(landmark=pts))

            return types.SimpleNamespace(multi_face_landmarks=faces)

    shim_module = types.SimpleNamespace(FaceMesh=FaceMeshShim)
    return shim_module

mp_face_mesh = _load_face_mesh_module()


# MediaPipe Face Mesh indices for EAR (left eye, right eye) and MAR (mouth).
# Left eye: 33, 160, 158, 133, 153, 144 | Right eye: 362, 385, 387, 263, 373, 380
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
# Mouth: 61, 291, 0, 17, 78, 308 (top/bottom lip, corners)
MOUTH_INDICES = [61, 291, 0, 17, 78, 308]


def _get_face_mesh():
    static_image_mode = False
    max_num_faces = 1
    refine_landmarks = True
    min_detection_confidence = 0.5
    min_tracking_confidence = 0.5
    return mp_face_mesh.FaceMesh(
        static_image_mode=static_image_mode,
        max_num_faces=max_num_faces,
        refine_landmarks=refine_landmarks,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )


_face_mesh = None


def get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        _face_mesh = _get_face_mesh()
    return _face_mesh


def get_face_landmarks(frame: np.ndarray):
    """
    Run face detection + landmark extraction on a BGR frame (OpenCV format).

    - Resizes to INPUT_WIDTH x INPUT_HEIGHT for consistent inference.
    - Returns landmarks in image coordinates (resized image).

    Returns:
        dict with:
          - face_detected: bool
          - landmarks: list of (x, y) in image coords, or None
          - left_eye: list of (x, y), or None
          - right_eye: list of (x, y), or None
          - mouth: list of (x, y), or None
          - all_landmarks: list of (x, y) for all 468 points, or None (for head pose)
    """
    resized = cv2.resize(frame, (INPUT_WIDTH, INPUT_HEIGHT))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

    mesh = get_face_mesh()
    results = mesh.process(rgb)

    out = {
        "face_detected": False,
        "landmarks": None,
        "left_eye": None,
        "right_eye": None,
        "mouth": None,
        "all_landmarks": None,
    }

    if not results.multi_face_landmarks:
        return out

    lm = results.multi_face_landmarks[0]
    all_pts = []
    for l in lm.landmark:
        x = l.x * INPUT_WIDTH
        y = l.y * INPUT_HEIGHT
        all_pts.append((float(x), float(y)))

    def pick(indices):
        return [all_pts[i] for i in indices]

    out["face_detected"] = True
    out["all_landmarks"] = all_pts
    out["landmarks"] = all_pts
    out["left_eye"] = pick(LEFT_EYE_INDICES)
    out["right_eye"] = pick(RIGHT_EYE_INDICES)
    out["mouth"] = pick(MOUTH_INDICES)

    # Debug logging: enable with environment variable ML_DEBUG=1
    if os.getenv("ML_DEBUG") == "1":
        try:
            sample_idxs = {
                "nose": 4,
                "chin": 152,
                "left_eye_anchor": LEFT_EYE_INDICES[0],
                "right_eye_anchor": RIGHT_EYE_INDICES[0],
                "mouth_anchor": MOUTH_INDICES[0],
            }
            samples = {k: all_pts[v] for k, v in sample_idxs.items() if v < len(all_pts)}
            print(f"[ml][debug] landmarks_count={len(all_pts)} samples={samples}")
            print(f"[ml][debug] left_eye={out['left_eye']} right_eye={out['right_eye']} mouth={out['mouth']}")
        except Exception as e:
            print("[ml][debug] logging failed:", e)

    return out