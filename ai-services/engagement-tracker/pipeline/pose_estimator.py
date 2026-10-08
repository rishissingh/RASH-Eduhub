"""
RASH EduHub — Head Pose Estimator
Uses MediaPipe Face Mesh landmarks to estimate head orientation (yaw, pitch, roll).
Determines if the user's head is in a "normal" forward-facing position or turned away.

Approach:
  We use 6 key facial landmarks and a generic 3D face model to solve a
  Perspective-n-Point (PnP) problem, extracting Euler angles for
  yaw (left-right turn), pitch (up-down nod), and roll (head tilt).

Key landmarks used:
  - Nose tip:       1
  - Chin:           199
  - Left eye outer: 33
  - Right eye outer: 263
  - Left mouth:     61
  - Right mouth:    291
"""

import numpy as np
import cv2


class PoseEstimator:
    """
    Estimates 3D head pose from 2D facial landmarks using PnP solving.
    Returns yaw, pitch, roll angles and a 'normal' classification.
    """

    # MediaPipe Face Mesh landmark indices for PnP
    LANDMARK_INDICES = [1, 199, 33, 263, 61, 291]

    # Generic 3D model points (approximate human face proportions)
    # These are canonical coordinates used by the PnP solver.
    MODEL_POINTS_3D = np.array([
        [0.0, 0.0, 0.0],           # Nose tip
        [0.0, -63.6, -12.5],       # Chin
        [-43.3, 32.7, -26.0],      # Left eye outer corner
        [43.3, 32.7, -26.0],       # Right eye outer corner
        [-28.9, -28.9, -24.1],     # Left mouth corner
        [28.9, -28.9, -24.1],      # Right mouth corner
    ], dtype=np.float64)

    def __init__(self, yaw_threshold=25.0, pitch_threshold=20.0, roll_threshold=25.0):
        """
        Args:
            yaw_threshold: Max absolute yaw (degrees) to be considered 'normal' (facing screen).
            pitch_threshold: Max absolute pitch (degrees) to be considered 'normal'.
            roll_threshold: Max absolute roll (degrees) to be considered 'normal'.
        """
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        self.roll_threshold = roll_threshold

        # Camera matrix placeholder (set per-frame based on image size)
        self._camera_matrix = None
        self._dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    def _build_camera_matrix(self, frame_w, frame_h):
        """Build an approximate camera intrinsic matrix from frame dimensions."""
        focal_length = frame_w  # Approximate focal length
        center = (frame_w / 2.0, frame_h / 2.0)
        return np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float64)

    def _rotation_matrix_to_euler(self, rotation_matrix):
        """
        Convert a 3x3 rotation matrix to Euler angles (pitch, yaw, roll) in degrees.
        Uses the ZYX convention.
        """
        sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)

        singular = sy < 1e-6

        if not singular:
            pitch = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
            yaw = np.arctan2(-rotation_matrix[2, 0], sy)
            roll = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
        else:
            pitch = np.arctan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
            yaw = np.arctan2(-rotation_matrix[2, 0], sy)
            roll = 0.0

        return np.degrees(pitch), np.degrees(yaw), np.degrees(roll)

    def estimate_pose(self, face_landmarks_proto, frame_w, frame_h):
        """
        Estimate head pose from MediaPipe face landmarks.

        Args:
            face_landmarks_proto: MediaPipe FaceLandmark proto (from gaze estimator).
            frame_w: Frame width in pixels.
            frame_h: Frame height in pixels.

        Returns:
            dict with keys:
                - 'detected': bool
                - 'yaw': float (degrees, positive = looking right)
                - 'pitch': float (degrees, positive = looking up)
                - 'roll': float (degrees, positive = tilting right)
                - 'is_normal': bool — head facing screen within thresholds
        """
        if face_landmarks_proto is None:
            return {
                "detected": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "is_normal": False,
            }

        landmarks = face_landmarks_proto

        # Extract 2D image points for the 6 key landmarks
        image_points = np.array([
            [landmarks[idx].x * frame_w, landmarks[idx].y * frame_h]
            for idx in self.LANDMARK_INDICES
        ], dtype=np.float64)

        # Build camera matrix
        camera_matrix = self._build_camera_matrix(frame_w, frame_h)

        # Solve PnP to get rotation and translation vectors
        success, rotation_vec, translation_vec = cv2.solvePnP(
            self.MODEL_POINTS_3D,
            image_points,
            camera_matrix,
            self._dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return {
                "detected": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "is_normal": False,
            }

        # Convert rotation vector to rotation matrix, then to Euler angles
        rotation_matrix, _ = cv2.Rodrigues(rotation_vec)
        pitch, yaw, roll = self._rotation_matrix_to_euler(rotation_matrix)

        # Determine if head pose is "normal" (facing screen)
        is_normal = (
            abs(yaw) <= self.yaw_threshold
            and abs(pitch) <= self.pitch_threshold
            and abs(roll) <= self.roll_threshold
        )

        return {
            "detected": True,
            "yaw": round(yaw, 2),
            "pitch": round(pitch, 2),
            "roll": round(roll, 2),
            "is_normal": is_normal,
        }
