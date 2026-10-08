"""
RASH EduHub — Gaze Estimator
Uses MediaPipe Face Mesh to detect eye/iris landmarks and determine
whether the user's gaze is directed at the screen.

Key landmarks used (MediaPipe Face Mesh 468+10 iris landmarks):
  - Left  eye corners: 33 (outer), 133 (inner)
  - Right eye corners: 362 (outer), 263 (inner)
  - Left  iris center:  468
  - Right iris center:  473
  - Vertical eye bounds for blink detection
"""

import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from pathlib import Path


class GazeEstimator:
    """
    Estimates gaze direction using iris position relative to eye corners.
    Returns a normalized gaze ratio (0 = looking far left, 1 = looking far right)
    and a vertical component for up/down detection.
    """

    # MediaPipe Face Mesh landmark indices
    LEFT_EYE_OUTER = 33
    LEFT_EYE_INNER = 133
    RIGHT_EYE_OUTER = 362
    RIGHT_EYE_INNER = 263

    LEFT_IRIS_CENTER = 468
    RIGHT_IRIS_CENTER = 473

    # Vertical eye landmarks for blink/vertical gaze
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145
    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374

    # Centered gaze thresholds (ratio between 0 and 1, center ≈ 0.5)
    HORIZONTAL_CENTER_MIN = 0.35
    HORIZONTAL_CENTER_MAX = 0.65
    VERTICAL_CENTER_MIN = 0.30
    VERTICAL_CENTER_MAX = 0.70

    # Eye aspect ratio threshold for blink detection
    BLINK_EAR_THRESHOLD = 0.20

    def __init__(self):
        model_path = Path(__file__).resolve().parent.parent / "models" / "face_landmarker.task"
        if not model_path.exists():
            import urllib.request
            model_path.parent.mkdir(exist_ok=True)
            urllib.request.urlretrieve("https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", str(model_path))

        options = mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=mp_vision.RunningMode.IMAGE,
            num_faces=1,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.face_landmarker = mp_vision.FaceLandmarker.create_from_options(options)
        self._last_horizontal_ratio = 0.5
        self._last_vertical_ratio = 0.5
        self._is_blinking = False

    def _get_landmark_coords(self, landmarks, index, frame_w, frame_h):
        """Extract pixel coordinates from a normalized MediaPipe landmark."""
        lm = landmarks[index]
        return np.array([lm.x * frame_w, lm.y * frame_h])

    def _compute_gaze_ratio(self, iris_center, eye_outer, eye_inner):
        """
        Compute horizontal gaze ratio.
        0.0 = looking toward outer corner (away from nose)
        1.0 = looking toward inner corner (toward nose)
        0.5 = centered
        """
        eye_width = np.linalg.norm(eye_inner - eye_outer)
        if eye_width < 1e-6:
            return 0.5

        iris_offset = np.linalg.norm(iris_center - eye_outer)
        ratio = iris_offset / eye_width
        return np.clip(ratio, 0.0, 1.0)

    def _compute_vertical_ratio(self, iris_center, eye_top, eye_bottom):
        """
        Compute vertical gaze ratio.
        0.0 = looking up
        1.0 = looking down
        0.5 = centered
        """
        eye_height = np.linalg.norm(eye_bottom - eye_top)
        if eye_height < 1e-6:
            return 0.5

        iris_offset = np.linalg.norm(iris_center - eye_top)
        ratio = iris_offset / eye_height
        return np.clip(ratio, 0.0, 1.0)

    def _compute_ear(self, eye_top, eye_bottom, eye_outer, eye_inner):
        """
        Compute Eye Aspect Ratio (EAR) for blink detection.
        EAR = vertical_distance / horizontal_distance
        Low EAR → eyes closed (blink).
        """
        vertical = np.linalg.norm(eye_top - eye_bottom)
        horizontal = np.linalg.norm(eye_inner - eye_outer)
        if horizontal < 1e-6:
            return 0.3
        return vertical / horizontal

    def process_frame(self, frame_rgb):
        """
        Process an RGB frame and return gaze estimation results.

        Args:
            frame_rgb: RGB numpy array of the video frame.

        Returns:
            dict with keys:
                - 'detected': bool — whether a face was detected
                - 'is_centered': bool — whether gaze is directed at screen
                - 'horizontal_ratio': float — horizontal gaze (0=left, 1=right)
                - 'vertical_ratio': float — vertical gaze (0=up, 1=down)
                - 'is_blinking': bool — whether eyes are closed
                - 'landmarks': raw landmarks object (for pose estimator reuse)
        """
        h, w, _ = frame_rgb.shape
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        results = self.face_landmarker.detect(mp_image)

        if not results.face_landmarks:
            return {
                "detected": False,
                "is_centered": False,
                "horizontal_ratio": self._last_horizontal_ratio,
                "vertical_ratio": self._last_vertical_ratio,
                "is_blinking": False,
                "landmarks": None,
            }

        face_landmarks = results.face_landmarks[0]

        # ── Extract eye corner and iris coordinates ──
        left_outer = self._get_landmark_coords(face_landmarks, self.LEFT_EYE_OUTER, w, h)
        left_inner = self._get_landmark_coords(face_landmarks, self.LEFT_EYE_INNER, w, h)
        right_outer = self._get_landmark_coords(face_landmarks, self.RIGHT_EYE_OUTER, w, h)
        right_inner = self._get_landmark_coords(face_landmarks, self.RIGHT_EYE_INNER, w, h)

        left_iris = self._get_landmark_coords(face_landmarks, self.LEFT_IRIS_CENTER, w, h)
        right_iris = self._get_landmark_coords(face_landmarks, self.RIGHT_IRIS_CENTER, w, h)

        # Vertical eye landmarks
        left_top = self._get_landmark_coords(face_landmarks, self.LEFT_EYE_TOP, w, h)
        left_bottom = self._get_landmark_coords(face_landmarks, self.LEFT_EYE_BOTTOM, w, h)
        right_top = self._get_landmark_coords(face_landmarks, self.RIGHT_EYE_TOP, w, h)
        right_bottom = self._get_landmark_coords(face_landmarks, self.RIGHT_EYE_BOTTOM, w, h)

        # ── Compute gaze ratios (average of both eyes) ──
        left_h_ratio = self._compute_gaze_ratio(left_iris, left_outer, left_inner)
        right_h_ratio = self._compute_gaze_ratio(right_iris, right_outer, right_inner)
        horizontal_ratio = (left_h_ratio + right_h_ratio) / 2.0

        left_v_ratio = self._compute_vertical_ratio(left_iris, left_top, left_bottom)
        right_v_ratio = self._compute_vertical_ratio(right_iris, right_top, right_bottom)
        vertical_ratio = (left_v_ratio + right_v_ratio) / 2.0

        # ── Blink detection ──
        left_ear = self._compute_ear(left_top, left_bottom, left_outer, left_inner)
        right_ear = self._compute_ear(right_top, right_bottom, right_outer, right_inner)
        avg_ear = (left_ear + right_ear) / 2.0
        is_blinking = avg_ear < self.BLINK_EAR_THRESHOLD

        # ── Determine if gaze is centered on screen ──
        is_centered = (
            self.HORIZONTAL_CENTER_MIN <= horizontal_ratio <= self.HORIZONTAL_CENTER_MAX
            and self.VERTICAL_CENTER_MIN <= vertical_ratio <= self.VERTICAL_CENTER_MAX
            and not is_blinking
        )

        # Cache last known ratios
        self._last_horizontal_ratio = horizontal_ratio
        self._last_vertical_ratio = vertical_ratio
        self._is_blinking = is_blinking

        return {
            "detected": True,
            "is_centered": is_centered,
            "horizontal_ratio": round(horizontal_ratio, 3),
            "vertical_ratio": round(vertical_ratio, 3),
            "is_blinking": is_blinking,
            "landmarks": results.face_landmarks[0],
        }

    def release(self):
        """Release MediaPipe resources."""
        self.face_landmarker.close()
