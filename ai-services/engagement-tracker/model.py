"""
Rash EduHub - Student Attention & Safety Monitoring Engine
Live Computer Vision Diagnostic Pipeline (model.py)

Direct Live Webcam OpenCV Diagnostic script for testing Face Detection,
Eye Landmark Geometry, EAR calculation, and YOLO Cell Phone Detection.
"""

import cv2
import math
import os
import sys
import time
import logging
import threading
if sys.platform == 'win32':
    import winsound
    WINSOUND_AVAILABLE = True
else:
    WINSOUND_AVAILABLE = False
from pathlib import Path
import numpy as np
from typing import Dict, Any, Optional, Tuple
from flask import Flask, Response
from flask_cors import CORS

# Step 15: Robust Absolute Base Directory
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

FACE_MODEL_PATH = MODELS_DIR / "face_landmarker.task"
YOLO_MODEL_PATH = MODELS_DIR / "yolov8n.pt"

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] model: %(message)s"
)
logger = logging.getLogger("model")


# =============================================================================
# BEEP & WARNING SYSTEM
# =============================================================================
beep_count = 0
beep_lock = threading.Lock()

sleeping_beep_sent = False
phone_beep_sent = False


def play_beep():
    """
    Plays a 1000 Hz beep for 500 ms using winsound on Windows in a non-blocking daemon thread.
    Increments beep_count and prints diagnostic messages.
    """
    global beep_count
    if not WINSOUND_AVAILABLE:
        print("⚠️ winsound not available on this platform (non-Windows). Beep skipped.")
        return
    try:
        winsound.Beep(1000, 500)
    except Exception as e:
        print(f"❌ winsound Beep failed: {e}")
        return

    with beep_lock:
        beep_count += 1
        current_count = beep_count

    print(f"🔊 BEEP PLAYED (#{current_count})")
    print("Beep success.")
    print(f"Current beep count: {current_count}")


# =============================================================================
# EAR CALCULATION
# =============================================================================
def calculate_ear(p1, p2, p3, p4, p5, p6) -> float:
    """
    Computes Eye Aspect Ratio (EAR) given 6 landmark coordinate pairs.
    EAR = (||p2 - p6|| + ||p3 - p5||) / (2.0 * ||p1 - p4||)
    """
    def dist(pt1, pt2):
        return math.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)

    v1 = dist(p2, p6)
    v2 = dist(p3, p5)
    h = dist(p1, p4)

    if h == 0:
        return 0.0
    return (v1 + v2) / (2.0 * h)


# =============================================================================
# SYNTHETIC CAMERA FALLBACK
# =============================================================================
class SyntheticCamera:
    """Fallback synthetic webcam generator when physical camera is unavailable."""

    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        self.frame_count = 0

    def read(self):
        self.frame_count += 1
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (35, 25, 55)  # Soft dark background

        # Draw simulated face oval and eyes
        center_x, center_y = self.width // 2, self.height // 2
        cv2.ellipse(frame, (center_x, center_y), (95, 125), 0, 0, 360, (220, 200, 180), -1)  # Face
        cv2.circle(frame, (center_x - 35, center_y - 20), 14, (255, 255, 255), -1)  # Left Eye
        cv2.circle(frame, (center_x + 35, center_y - 20), 14, (255, 255, 255), -1)  # Right Eye

        # Simulate pupil micro-movements
        offset = int(np.sin(self.frame_count * 0.04) * 4)
        cv2.circle(frame, (center_x - 35 + offset, center_y - 20), 6, (30, 30, 30), -1)
        cv2.circle(frame, (center_x + 35 + offset, center_y - 20), 6, (30, 30, 30), -1)

        # Mouth curve
        cv2.ellipse(frame, (center_x, center_y + 45), (35, 15), 0, 0, 180, (120, 50, 50), 3)

        # Overlay text banner
        cv2.putText(frame, "SIMULATED WEBCAM MODE", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, "Hardware Camera In Use or Offline", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        time.sleep(0.033)  # ~30 FPS delay
        return True, frame

    def get(self, prop_id):
        if prop_id == cv2.CAP_PROP_FRAME_WIDTH:
            return self.width
        if prop_id == cv2.CAP_PROP_FRAME_HEIGHT:
            return self.height
        return 0

    def set(self, prop_id, val):
        pass

    def isOpened(self):
        return True

    def release(self):
        pass


# =============================================================================
# STEP 2: WEBCAM HARDWARE SCANNER
# =============================================================================
def find_working_webcam() -> Tuple[Any, int, str]:
    """
    Scans camera indices 0, 1, 2 across Windows/OS backends (CAP_DSHOW, CAP_MSMF, CAP_ANY).
    Returns (VideoCapture | SyntheticCamera, camera_index, backend_name).
    """
    print("\n" + "=" * 60)
    print(" STEP 2: SCANNING & VERIFYING WEBCAM HARDWARE")
    print("=" * 60)

    indices = [0, 1, 2]
    backends = [
        ("CAP_DSHOW", cv2.CAP_DSHOW),
        ("CAP_MSMF", cv2.CAP_MSMF),
        ("CAP_ANY", cv2.CAP_ANY)
    ] if os.name == 'nt' else [("CAP_ANY", cv2.CAP_ANY)]

    for idx in indices:
        for name, backend in backends:
            print(f"Testing Camera Index: {idx} | Backend: {name} ... ", end="", flush=True)
            try:
                cap = cv2.VideoCapture(idx, backend)
                if cap.isOpened():
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    ret, test_frame = cap.read()
                    if ret and test_frame is not None and test_frame.size > 0:
                        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        fps = cap.get(cv2.CAP_PROP_FPS)
                        print("SUCCESS!")
                        print(f"  -> Camera Index: {idx}")
                        print(f"  -> Backend: {name}")
                        print("  -> Frame Received: True")
                        print(f"  -> Resolution: {w}x{h}")
                        print(f"  -> Hardware FPS: {fps}")
                        print("=" * 60 + "\n")
                        return cap, idx, name
                    else:
                        print("FAILED (Could not grab frame)")
                        cap.release()
                else:
                    print("FAILED (Could not open device)")
            except Exception as e:
                print(f"FAILED ({e})")

    print("\n⚠️ Physical webcam could not be opened. Using SyntheticCamera fallback.")
    print("=" * 60 + "\n")
    return SyntheticCamera(), -1, "SYNTHETIC"


# =============================================================================
# STEP 4 & 5: DIAGNOSTIC FACE LANDMARK DETECTOR
# =============================================================================
class DiagnosticFaceDetector:
    """
    MediaPipe Tasks FaceLandmarker Detector with explicit diagnostic error reporting.
    Separates 'FACE_GENUINELY_NOT_DETECTED' from 'DETECTOR_INITIALIZATION_ERROR'.
    """

    def __init__(self, model_path: Path = FACE_MODEL_PATH):
        self.model_path = model_path
        self.landmarker = None
        self.init_error = None
        self.status = "NOT_INITIALIZED"
        self._init_detector()

    def _init_detector(self):
        print("\n" + "=" * 60)
        print(" STEP 4 & 5: INITIALIZING MEDIAPIPE FACE LANDMARKER")
        print("=" * 60)

        # 1. Check MediaPipe package
        try:
            import mediapipe as mp
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision as mp_vision
            self.mp = mp
            self.mp_vision = mp_vision
            print(" 1. MediaPipe Package: INSTALLED")
        except ImportError as e:
            self.init_error = f"MediaPipe package not installed: {e}"
            self.status = "ERROR"
            print(f" ❌ ERROR: {self.init_error}")
            return

        # 2. Check model file existence
        print(f" 2. Checking model path: {self.model_path}")
        if not self.model_path.exists():
            print(f" ⚠️ Model file missing at {self.model_path}. Attempting automatic download...")
            try:
                import urllib.request
                url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
                urllib.request.urlretrieve(url, str(self.model_path))
                print(f" SUCCESS: Downloaded face_landmarker.task to {self.model_path}")
            except Exception as dl_err:
                self.init_error = f"Model file missing and download failed: {dl_err}"
                self.status = "ERROR"
                print(f" ❌ ERROR: Face landmark model file not found at {self.model_path}")
                return

        # 3. Create FaceLandmarker instance
        try:
            options = self.mp_vision.FaceLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(self.model_path)),
                running_mode=self.mp_vision.RunningMode.IMAGE,
                num_faces=5,
                min_face_detection_confidence=0.3,
                min_face_presence_confidence=0.3,
                min_tracking_confidence=0.3
            )
            self.landmarker = self.mp_vision.FaceLandmarker.create_from_options(options)
            self.status = "OK"
            print(" 3. FaceLandmarker Instance: INITIALIZED SUCCESSFULLY")
            print("=" * 60 + "\n")
        except Exception as e:
            self.init_error = f"FaceLandmarker initialization failed: {e}"
            self.status = "ERROR"
            print(f" ❌ ERROR: {self.init_error}")
            print("=" * 60 + "\n")

    def detect(self, frame: np.ndarray) -> Dict[str, Any]:
        if self.status == "ERROR" or self.landmarker is None:
            return {
                "status": "ERROR",
                "error_msg": self.init_error or "Landmarker not initialized",
                "face_detected": False,
                "face_count": 0,
                "box": None,
                "left_ear": 0.0,
                "right_ear": 0.0,
                "avg_ear": 0.0,
                "eye_state": "EYES_NOT_DETECTED",
                "eye_pts": []
            }

        if frame is None or frame.size == 0:
            return {
                "status": "OK",
                "error_msg": None,
                "face_detected": False,
                "face_count": 0,
                "box": None,
                "left_ear": 0.0,
                "right_ear": 0.0,
                "avg_ear": 0.0,
                "eye_state": "EYES_NOT_DETECTED",
                "eye_pts": []
            }

        h, w = frame.shape[:2]

        try:
            rgb_frame = np.ascontiguousarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            mp_image = self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=rgb_frame)
            result = self.landmarker.detect(mp_image)

            if result.face_landmarks and len(result.face_landmarks) > 0:
                face_count = len(result.face_landmarks)
                first_face = result.face_landmarks[0]

                x_coords = [lm.x * w for lm in first_face]
                y_coords = [lm.y * h for lm in first_face]
                xmin, xmax = max(0, int(min(x_coords))), min(w, int(max(x_coords)))
                ymin, ymax = max(0, int(min(y_coords))), min(h, int(max(y_coords)))
                box = (xmin, ymin, xmax - xmin, ymax - ymin)

                def get_pt(idx):
                    lm = first_face[idx]
                    return (lm.x * w, lm.y * h)

                # Step 7: Landmark indices for EAR
                # Left Eye: 33 (p1), 160 (p2), 158 (p3), 133 (p4), 153 (p5), 144 (p6)
                # Right Eye: 362 (p1), 385 (p2), 387 (p3), 263 (p4), 373 (p5), 380 (p6)
                lp1, lp2, lp3 = get_pt(33), get_pt(160), get_pt(158)
                lp4, lp5, lp6 = get_pt(133), get_pt(153), get_pt(144)
                left_ear = calculate_ear(lp1, lp2, lp3, lp4, lp5, lp6)

                rp1, rp2, rp3 = get_pt(362), get_pt(385), get_pt(387)
                rp4, rp5, rp6 = get_pt(263), get_pt(373), get_pt(380)
                right_ear = calculate_ear(rp1, rp2, rp3, rp4, rp5, rp6)

                avg_ear = (left_ear + right_ear) / 2.0

                # Step 8: Separate states: EYES_OPEN, EYES_CLOSED
                eye_state = "EYES_CLOSED" if avg_ear < 0.22 else "EYES_OPEN"

                eye_pts = [lp1, lp2, lp3, lp4, lp5, lp6, rp1, rp2, rp3, rp4, rp5, rp6]

                return {
                    "status": "OK",
                    "error_msg": None,
                    "face_detected": True,
                    "face_count": face_count,
                    "box": box,
                    "left_ear": round(left_ear, 3),
                    "right_ear": round(right_ear, 3),
                    "avg_ear": round(avg_ear, 3),
                    "eye_state": eye_state,
                    "eye_pts": eye_pts
                }
            else:
                return {
                    "status": "OK",
                    "error_msg": None,
                    "face_detected": False,
                    "face_count": 0,
                    "box": None,
                    "left_ear": 0.0,
                    "right_ear": 0.0,
                    "avg_ear": 0.0,
                    "eye_state": "EYES_NOT_DETECTED",
                    "eye_pts": []
                }
        except Exception as e:
            logger.error(f"MediaPipe detection runtime error: {e}")
            return {
                "status": "ERROR",
                "error_msg": str(e),
                "face_detected": False,
                "face_count": 0,
                "box": None,
                "left_ear": 0.0,
                "right_ear": 0.0,
                "avg_ear": 0.0,
                "eye_state": "EYES_NOT_DETECTED",
                "eye_pts": []
            }


# =============================================================================
# STEP 9 & 10: DIAGNOSTIC YOLO PHONE DETECTOR
# =============================================================================
class DiagnosticPhoneDetector:
    """
    Ultralytics YOLO Phone Detector with explicit class index mapping and status logging.
    """

    def __init__(self, model_path: Path = YOLO_MODEL_PATH, conf_threshold: float = 0.30):
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.model = None
        self.target_class_ids = []
        self.status = "NOT_INITIALIZED"
        self.init_error = None
        self._init_model()

    def _init_model(self):
        print("\n" + "=" * 60)
        print(" STEP 9 & 10: INITIALIZING ULTRALYTICS YOLO PHONE DETECTOR")
        print("=" * 60)

        try:
            from ultralytics import YOLO
            print(" Loading YOLO model...")
            self.model = YOLO(str(self.model_path) if self.model_path.exists() else 'yolov8n.pt')
            print(f" Model loaded successfully from: {self.model_path}")

            names = self.model.names
            total_classes = len(names) if names else 0
            print(f" Total classes loaded: {total_classes}")

            # Find cell phone class ID dynamically
            cell_phone_ids = [
                k for k, v in names.items()
                if 'phone' in str(v).lower() or 'cell' in str(v).lower()
            ]

            if cell_phone_ids:
                self.target_class_ids = cell_phone_ids
                cell_name = names[cell_phone_ids[0]]
                print(f" Cell phone class ID: {cell_phone_ids[0]} ('{cell_name}')")
                print("=" * 60 + "\n")
                self.status = "OK"
            else:
                self.init_error = "The loaded YOLO model does not contain a cell phone class."
                self.status = "ERROR"
                print(f" ❌ ERROR: {self.init_error}")
                print("=" * 60 + "\n")

        except Exception as e:
            self.init_error = f"Failed to load YOLO model: {e}"
            self.status = "ERROR"
            print(f" ❌ ERROR: {self.init_error}")
            print("=" * 60 + "\n")

    def detect(self, frame: np.ndarray) -> Dict[str, Any]:
        if self.status == "ERROR" or self.model is None:
            return {
                "status": "ERROR",
                "error_msg": self.init_error or "YOLO model not loaded",
                "phone_detected": False,
                "confidence": 0.0,
                "boxes": []
            }

        if frame is None or frame.size == 0:
            return {
                "status": "OK",
                "error_msg": None,
                "phone_detected": False,
                "confidence": 0.0,
                "boxes": []
            }

        try:
            results = self.model.predict(
                source=frame,
                conf=self.conf_threshold,
                classes=self.target_class_ids,
                verbose=False
            )

            boxes = []
            max_conf = 0.0
            if len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    conf = float(box.conf[0])
                    xywh = box.xywh[0].cpu().numpy()
                    x, y, w, h = int(xywh[0] - xywh[2]/2), int(xywh[1] - xywh[3]/2), int(xywh[2]), int(xywh[3])
                    boxes.append((x, y, w, h))
                    if conf > max_conf:
                        max_conf = conf

            return {
                "status": "OK",
                "error_msg": None,
                "phone_detected": len(boxes) > 0,
                "confidence": round(max_conf, 2),
                "boxes": boxes
            }
        except Exception as e:
            logger.error(f"YOLO prediction error: {e}")
            return {
                "status": "ERROR",
                "error_msg": str(e),
                "phone_detected": False,
                "confidence": 0.0,
                "boxes": []
            }


# =============================================================================
# FLASK APP SETUP & BACKGROUND WORKER
# =============================================================================
app = Flask(__name__)
CORS(app)


class CameraStreamWorker:
    """
    Singleton background thread worker that keeps the webcam open,
    runs Face and Phone detection continuously, and encodes frames to JPEG
    so multiple web clients can stream simultaneously without hardware conflicts.
    """

    def __init__(self):
        self.running = False
        self.thread = None
        self.latest_frame_bytes = None
        self.lock = threading.Lock()
        self.is_ready = False
        self.fps = 0.0
        self.backend_name = "NONE"
        self.camera_idx = -1

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)

    def _run(self):
        print("=" * 70)
        print(" RASH EDUHUB - CAMERA STREAM WORKER INITIALIZING")
        print("=" * 70)

        # 1. Open webcam (with automatic synthetic fallback)
        cap, self.camera_idx, self.backend_name = find_working_webcam()

        # 2. Initialize Detectors
        face_detector = DiagnosticFaceDetector()
        phone_detector = DiagnosticPhoneDetector()

        self.is_ready = True
        print("\n🚀 CAMERA STREAM WORKER ACTIVE — STREAMING FRAMES\n")

        prev_time = time.time()
        frame_count = 0
        sleeping_start_time = None
        phone_start_time = None
        global sleeping_beep_sent, phone_beep_sent
        sleeping_beep_sent = False
        phone_beep_sent = False

        try:
            while self.running:
                t_start = time.time()
                ret, frame = cap.read()
                if not ret or frame is None:
                    time.sleep(0.03)
                    continue

                frame_count += 1
                t_now = time.time()
                if (t_now - prev_time) >= 1.0:
                    self.fps = frame_count / (t_now - prev_time)
                    frame_count = 0
                    prev_time = t_now

                # Run Detectors
                face_res = face_detector.detect(frame)
                phone_res = phone_detector.detect(frame)
                latency_ms = (time.time() - t_start) * 1000.0

                # -------------------------------------------------------------
                # BEEP VIOLATION DETECTION & TIMING LOGIC
                # -------------------------------------------------------------
                # 1. Sleeping violation logic (10 continuous seconds of EYES_CLOSED)
                sleep_dur = 0.0
                if face_res["face_detected"] and face_res["eye_state"] == "EYES_CLOSED":
                    if sleeping_start_time is None:
                        sleeping_start_time = time.time()
                    sleep_dur = time.time() - sleeping_start_time
                    if sleep_dur >= 10.0 and not sleeping_beep_sent:
                        sleeping_beep_sent = True
                        print("Sleeping violation detected. Calling play_beep()...")
                        threading.Thread(target=play_beep, daemon=True).start()
                else:
                    sleeping_start_time = None
                    sleeping_beep_sent = False

                # 2. Phone violation logic (4 continuous seconds of phone detected)
                phone_dur = 0.0
                if phone_res["phone_detected"]:
                    if phone_start_time is None:
                        phone_start_time = time.time()
                    phone_dur = time.time() - phone_start_time
                    if phone_dur >= 4.0 and not phone_beep_sent:
                        phone_beep_sent = True
                        print("Phone violation detected. Calling play_beep()...")
                        threading.Thread(target=play_beep, daemon=True).start()
                else:
                    phone_start_time = None
                    phone_beep_sent = False

                debug_frame = frame.copy()
                h, w = debug_frame.shape[:2]

                # Draw Face Box & Eye Landmarks
                if face_res["status"] == "ERROR":
                    cv2.putText(debug_frame, f"FACE ERROR: {face_res['error_msg']}", (10, 70),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                elif face_res["face_detected"] and face_res["box"] is not None:
                    (fx, fy, fw, fh) = face_res["box"]
                    box_color = (0, 255, 0) if face_res["eye_state"] == "EYES_OPEN" else (0, 165, 255)
                    cv2.rectangle(debug_frame, (fx, fy), (fx + fw, fy + fh), box_color, 2)
                    cv2.putText(debug_frame, f"FACE DETECTED ({face_res['face_count']})", (fx, max(20, fy - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)

                    for pt in face_res.get("eye_pts", []):
                        cv2.circle(debug_frame, (int(pt[0]), int(pt[1])), 3, (255, 255, 0), -1)

                # Draw Phone Box
                if phone_res["status"] == "ERROR":
                    cv2.putText(debug_frame, f"PHONE ERROR: {phone_res['error_msg']}", (10, 95),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                elif phone_res["phone_detected"]:
                    for (px, py, pw, ph) in phone_res.get("boxes", []):
                        cv2.rectangle(debug_frame, (px, py), (px + pw, py + ph), (0, 0, 255), 2)
                        cv2.putText(debug_frame, f"PHONE DETECTED ({phone_res['confidence']})", (px, max(20, py - 10)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

                # Telemetry overlay header
                cv2.rectangle(debug_frame, (0, 0), (w, 65), (15, 15, 25), -1)
                face_txt = f"YES ({face_res['face_count']})" if face_res['face_detected'] else "NO"
                ear_txt = f"L:{face_res['left_ear']} R:{face_res['right_ear']} Avg:{face_res['avg_ear']} [{face_res['eye_state']}]"
                phone_txt = f"YES ({phone_res['confidence']})" if phone_res['phone_detected'] else "NO"

                line1 = f"Camera:{self.backend_name} ({w}x{h}) | FPS:{self.fps:.1f} ({latency_ms:.0f}ms) | Beeps:{beep_count}/5"
                line2 = f"Face:{face_txt} | EAR {ear_txt} | Phone:{phone_txt}"
                line3 = f"Sleep Timer:{sleep_dur:.1f}s/10s | Phone Timer:{phone_dur:.1f}s/4s"

                cv2.putText(debug_frame, line1, (10, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1)
                cv2.putText(debug_frame, line2, (10, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 255) if face_res['face_detected'] else (180, 180, 180), 1)
                cv2.putText(debug_frame, line3, (10, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 255, 150), 1)

                # Encode frame for MJPEG stream
                ret, buffer = cv2.imencode('.jpg', debug_frame)
                if ret:
                    with self.lock:
                        self.latest_frame_bytes = buffer.tobytes()

                # Yield control to keep ~30 FPS
                elapsed = time.time() - t_start
                if elapsed < 0.033:
                    time.sleep(0.033 - elapsed)

        except Exception as loop_err:
            print(f"❌ Error in camera worker loop: {loop_err}")
        finally:
            if cap is not None:
                cap.release()
            print("Webcam hardware released cleanly.")


worker = CameraStreamWorker()


@app.route('/health')
def health():
    return {
        "status": "ok",
        "ready": worker.is_ready,
        "backend": worker.backend_name,
        "fps": round(worker.fps, 1)
    }


@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            frame_bytes = None
            with worker.lock:
                frame_bytes = worker.latest_frame_bytes
            if frame_bytes is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.033)

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == "__main__":
    worker.start()
    app.run(host='0.0.0.0', port=5005, debug=False, threaded=True)
