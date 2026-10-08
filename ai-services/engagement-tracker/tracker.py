"""
RASH EduHub — Real-Time Multimodal Engagement Tracker
=====================================================
Main entry point for the standalone desktop engagement tracking application.

This script runs the full engagement detection pipeline:
  1. Captures video from webcam
  2. Runs gaze estimation (MediaPipe Face Mesh + iris tracking)
  3. Runs head pose estimation (PnP solving)
  4. Monitors keyboard/mouse activity (pynput)
  5. Classifies engagement status using 3-tier decision logic
  6. Shows non-intrusive soft prompts when distraction is detected
  7. Reports status to the RASH EduHub backend API

Usage:
  python tracker.py [--user-id USER_ID] [--token JWT_TOKEN] [--no-overlay] [--debug]

All webcam processing is done 100% locally — no video data leaves the machine.
Only engagement status labels are sent to the backend.
"""

import sys
import os
import io
import time
import argparse
import cv2
import numpy as np

# Force UTF-8 output on Windows to support emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.gaze_estimator import GazeEstimator
from pipeline.pose_estimator import PoseEstimator
from pipeline.activity_monitor import ActivityMonitor
from pipeline.decision_engine import DecisionEngine, EngagementStatus
from ui.overlay import SoftPromptOverlay
from api.status_reporter import StatusReporter
from shared.config import ServiceConfig


# ── Terminal UI Colors ──
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    DIM = "\033[2m"


STATUS_COLORS = {
    EngagementStatus.FOCUSED: Colors.GREEN,
    EngagementStatus.WRITING_NOTES: Colors.CYAN,
    EngagementStatus.DISTRACTED: Colors.RED,
    EngagementStatus.NO_FACE: Colors.YELLOW,
    EngagementStatus.INITIALIZING: Colors.DIM,
}

STATUS_ICONS = {
    EngagementStatus.FOCUSED: "✅",
    EngagementStatus.WRITING_NOTES: "📝",
    EngagementStatus.DISTRACTED: "⚠️ ",
    EngagementStatus.NO_FACE: "👤",
    EngagementStatus.INITIALIZING: "⏳",
}


def draw_debug_overlay(frame, snapshot, gaze_result, pose_result, activity_stats):
    """
    Draw debug information on the video frame for development/testing.
    Shows gaze direction, head pose angles, activity status, and engagement label.
    """
    h, w = frame.shape[:2]

    # ── Semi-transparent dark header bar ──
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 90), (20, 20, 40), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    # ── Status label ──
    status_text = f"Status: {snapshot.status.value}"
    color_map = {
        EngagementStatus.FOCUSED: (0, 255, 100),
        EngagementStatus.WRITING_NOTES: (255, 200, 0),
        EngagementStatus.DISTRACTED: (0, 0, 255),
        EngagementStatus.NO_FACE: (0, 200, 255),
        EngagementStatus.INITIALIZING: (180, 180, 180),
    }
    status_color = color_map.get(snapshot.status, (255, 255, 255))
    cv2.putText(frame, status_text, (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

    # ── Gaze info ──
    gaze_text = f"Gaze: H={gaze_result.get('horizontal_ratio', 0):.2f}  V={gaze_result.get('vertical_ratio', 0):.2f}"
    centered_text = "CENTERED" if gaze_result.get("is_centered", False) else "AWAY"
    centered_color = (0, 255, 100) if gaze_result.get("is_centered", False) else (0, 100, 255)
    cv2.putText(frame, gaze_text, (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    cv2.putText(frame, centered_text, (320, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, centered_color, 2)

    # ── Pose info ──
    pose_text = f"Pose: Y={pose_result.get('yaw', 0):.1f}  P={pose_result.get('pitch', 0):.1f}  R={pose_result.get('roll', 0):.1f}"
    normal_text = "NORMAL" if pose_result.get("is_normal", False) else "TURNED"
    normal_color = (0, 255, 100) if pose_result.get("is_normal", False) else (0, 100, 255)
    cv2.putText(frame, pose_text, (15, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    cv2.putText(frame, normal_text, (320, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.5, normal_color, 2)

    # ── Activity indicator (bottom bar) ──
    overlay2 = frame.copy()
    cv2.rectangle(overlay2, (0, h - 40), (w, h), (20, 20, 40), -1)
    cv2.addWeighted(overlay2, 0.7, frame, 0.3, 0, frame)

    is_active = activity_stats.get("is_active", False)
    activity_text = f"IDE Activity: {'ACTIVE' if is_active else 'IDLE'}  |  Events: {activity_stats.get('window_event_count', 0)}  |  Lookaway: {snapshot.lookaway_duration:.1f}s"
    activity_color = (0, 255, 100) if is_active else (100, 100, 180)
    cv2.putText(frame, activity_text, (15, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, activity_color, 1)

    return frame


def print_terminal_status(snapshot, activity_stats, frame_count):
    """Print a clean terminal status line (overwrites previous line)."""
    status = snapshot.status
    color = STATUS_COLORS.get(status, Colors.RESET)
    icon = STATUS_ICONS.get(status, "")

    is_active = activity_stats.get("is_active", False)
    events = activity_stats.get("window_event_count", 0)
    lookaway = snapshot.lookaway_duration

    line = (
        f"\r{Colors.BOLD}[RASH EduHub]{Colors.RESET} "
        f"Frame {frame_count:>6}  │  "
        f"{color}{icon} {status.value:<30}{Colors.RESET}  │  "
        f"IDE: {'🟢' if is_active else '🔴'}({events})  │  "
        f"Lookaway: {lookaway:>5.1f}s  │  "
        f"Gaze: H={snapshot.gaze_horizontal:.2f} V={snapshot.gaze_vertical:.2f}  │  "
        f"Head: Y={snapshot.head_yaw:>6.1f}° P={snapshot.head_pitch:>6.1f}°"
    )
    print(line, end="", flush=True)


def print_banner():
    """Print the startup banner."""
    banner = f"""
{Colors.MAGENTA}{Colors.BOLD}
    ╔══════════════════════════════════════════════════════════════╗
    ║        🎓 RASH EduHub — Engagement Tracker v1.0            ║
    ║        Real-Time Multimodal Focus Detection                 ║
    ╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
{Colors.DIM}    ▸ All processing is 100% local — no video leaves your machine
    ▸ Press 'Q' in the video window or Ctrl+C to stop
    ▸ Press 'D' to toggle debug overlay
{Colors.RESET}
"""
    print(banner)


def print_session_summary(decision_engine, start_time):
    """Print session summary when tracker stops."""
    stats = decision_engine.session_stats
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)

    summary = f"""
{Colors.MAGENTA}{Colors.BOLD}
    ╔══════════════════════════════════════════════════════════════╗
    ║                   📊 Session Summary                        ║
    ╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
    ⏱  Duration:        {minutes}m {seconds}s
    📊 Frames Analyzed: {stats['total_frames_analyzed']}

    {Colors.GREEN}✅ Focused:          {stats['focus_ratio']*100:.1f}%{Colors.RESET}
    {Colors.CYAN}📝 Writing Notes:    {stats['notes_ratio']*100:.1f}%{Colors.RESET}
    {Colors.RED}⚠️  Distracted:       {stats['distracted_ratio']*100:.1f}%{Colors.RESET}

    {Colors.DIM}Session ended. Thank you for using RASH EduHub!{Colors.RESET}
"""
    print(summary)


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
        cv2.putText(frame, "Hardware OpenCV Camera Offline / In Use", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

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


def try_open_physical_camera(preferred_index):
    """Attempt to open physical camera across multiple backends and indices."""
    indices = [preferred_index] + [i for i in range(5) if i != preferred_index]
    backends = []

    if sys.platform.startswith("win"):
        dshow = getattr(cv2, "CAP_DSHOW", None)
        msmf = getattr(cv2, "CAP_MSMF", None)
        if dshow is not None:
            backends.append(dshow)
        if msmf is not None:
            backends.append(msmf)
    backends.append(cv2.CAP_ANY)

    for idx in indices:
        for backend in backends:
            try:
                cap = cv2.VideoCapture(idx, backend) if backend != cv2.CAP_ANY else cv2.VideoCapture(idx)
            except Exception:
                continue

            if cap is None:
                continue

            if cap.isOpened():
                # verify the camera can produce a frame
                ret, _ = cap.read()
                if ret:
                    return cap, idx
            cap.release()

    return None, preferred_index


def main():
    """Main entry point for the engagement tracker."""

    # ── Parse Arguments ──
    parser = argparse.ArgumentParser(
        description="RASH EduHub — Real-Time Engagement Tracker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--user-id", type=str, default=None, help="User ID for backend reporting")
    parser.add_argument("--token", type=str, default=None, help="JWT auth token")
    parser.add_argument("--backend", type=str, default="http://localhost:5000", help="Backend URL")
    parser.add_argument("--camera", type=int, default=0, help="Camera device index")
    parser.add_argument("--synthetic", action="store_true", help="Force synthetic simulated camera mode")
    parser.add_argument("--test-camera", action="store_true", help="Probe the selected camera and exit after reporting status")
    parser.add_argument("--no-overlay", action="store_true", help="Disable soft prompt overlay")
    parser.add_argument("--no-video", action="store_true", help="Disable video preview window")
    parser.add_argument("--debug", action="store_true", help="Enable debug overlay on video")
    parser.add_argument(
        "--lookaway-timeout", type=float, default=ServiceConfig.GAZE_AWAY_TIMEOUT_SECONDS,
        help=f"Seconds of look-away before escalation (default: {ServiceConfig.GAZE_AWAY_TIMEOUT_SECONDS})"
    )
    args = parser.parse_args()

    print_banner()

    # ── Initialize Pipeline Components ──
    print(f"  {Colors.DIM}Initializing pipeline...{Colors.RESET}")

    gaze_estimator = GazeEstimator()
    print(f"  {Colors.GREEN}✓{Colors.RESET} Gaze Estimator (MediaPipe Face Mesh + Iris)")

    pose_estimator = PoseEstimator(
        yaw_threshold=ServiceConfig.GAZE_CENTERED_YAW_THRESHOLD,
        pitch_threshold=ServiceConfig.GAZE_CENTERED_PITCH_THRESHOLD,
    )
    print(f"  {Colors.GREEN}✓{Colors.RESET} Pose Estimator (PnP Head Orientation)")

    activity_monitor = ActivityMonitor(
        window_seconds=ServiceConfig.ACTIVITY_WINDOW_SECONDS,
        min_events_threshold=ServiceConfig.ACTIVITY_EVENT_THRESHOLD,
    )
    activity_monitor.start()
    print(f"  {Colors.GREEN}✓{Colors.RESET} Activity Monitor (Keyboard + Mouse)")

    decision_engine = DecisionEngine(
        lookaway_timeout=args.lookaway_timeout,
        status_cooldown=3.0,
        no_face_grace_period=5.0,
    )
    print(f"  {Colors.GREEN}✓{Colors.RESET} Decision Engine (3-Tier Classification)")

    soft_prompt = None
    if not args.no_overlay:
        soft_prompt = SoftPromptOverlay(
            display_seconds=ServiceConfig.SOFT_PROMPT_DISPLAY_SECONDS,
        )
        print(f"  {Colors.GREEN}✓{Colors.RESET} Soft Prompt Overlay")

    status_reporter = StatusReporter(
        backend_url=args.backend,
        report_interval=ServiceConfig.STATUS_REPORT_INTERVAL_SECONDS,
        user_id=args.user_id,
        auth_token=args.token,
    )
    status_reporter.start()
    print(f"  {Colors.GREEN}✓{Colors.RESET} Status Reporter (→ {args.backend})")

    # ── Open Webcam ──
    print(f"\n  {Colors.DIM}Opening camera (preferred index: {args.camera})...{Colors.RESET}")

    cap = None
    if not args.synthetic:
        cap, opened_idx = try_open_physical_camera(args.camera)

    if cap is not None and cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"  {Colors.GREEN}✓{Colors.RESET} Hardware camera index {opened_idx} opened successfully ({actual_w}x{actual_h})")
    else:
        print(f"  {Colors.YELLOW}⚠️ Physical camera not detected or busy — activating Synthetic Camera Mode{Colors.RESET}")
        cap = SyntheticCamera(640, 480)
        print(f"  {Colors.CYAN}✓ Synthetic camera initialized (100% local focus simulation active){Colors.RESET}")

    if args.test_camera:
        if isinstance(cap, SyntheticCamera):
            print(f"  {Colors.YELLOW}⚠ Synthetic camera used. No physical webcam detected on indices 0-4.{Colors.RESET}")
        else:
            print(f"  {Colors.GREEN}✓ Camera test passed. Real webcam attached and producing frames.{Colors.RESET}")
        cap.release()
        activity_monitor.stop()
        status_reporter.stop()
        gaze_estimator.release()
        return

    print(f"\n  {Colors.BOLD}{Colors.GREEN}🚀 Tracker running! Press 'Q' to stop.{Colors.RESET}\n")

    # ── Main Processing Loop ──
    frame_count = 0
    show_debug = args.debug
    start_time = time.time()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"\n  {Colors.YELLOW}⚠ Camera read failed — retrying...{Colors.RESET}")
                time.sleep(0.1)
                continue

            frame_count += 1

            # Convert BGR → RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, _ = frame.shape

            # ── Step 1: Gaze Estimation ──
            gaze_result = gaze_estimator.process_frame(frame_rgb)

            # ── Step 2: Pose Estimation ──
            pose_result = pose_estimator.estimate_pose(
                gaze_result.get("landmarks"),
                w, h,
            )

            # ── Step 3: Activity Check ──
            activity_stats = activity_monitor.stats

            # ── Step 4: Decision Engine Classification ──
            snapshot = decision_engine.classify(
                gaze_centered=gaze_result.get("is_centered", False),
                pose_normal=pose_result.get("is_normal", False),
                ide_active=activity_stats.get("is_active", False),
                face_detected=gaze_result.get("detected", False),
                gaze_horizontal=gaze_result.get("horizontal_ratio", 0.5),
                gaze_vertical=gaze_result.get("vertical_ratio", 0.5),
                head_yaw=pose_result.get("yaw", 0.0),
                head_pitch=pose_result.get("pitch", 0.0),
            )

            # ── Step 5: Handle Soft Prompt ──
            if soft_prompt and decision_engine.soft_prompt_triggered:
                soft_prompt.show(
                    message="Still working? 🤔",
                    sub_message="We noticed you might be away. Click to dismiss.",
                )

            # ── Step 6: Report Status ──
            status_reporter.record_status(snapshot)

            # ── Step 7: Terminal Output ──
            print_terminal_status(snapshot, activity_stats, frame_count)

            # ── Step 8: Video Preview ──
            if not args.no_video:
                display_frame = frame.copy()

                if show_debug:
                    display_frame = draw_debug_overlay(
                        display_frame, snapshot, gaze_result,
                        pose_result, activity_stats,
                    )

                cv2.imshow("RASH EduHub — Engagement Tracker", display_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q") or key == ord("Q"):
                    break
                elif key == ord("d") or key == ord("D"):
                    show_debug = not show_debug
                    print(f"\n  {Colors.CYAN}Debug overlay: {'ON' if show_debug else 'OFF'}{Colors.RESET}")

    except KeyboardInterrupt:
        print(f"\n\n  {Colors.YELLOW}Ctrl+C detected — stopping tracker...{Colors.RESET}")

    finally:
        # ── Cleanup ──
        print(f"\n  {Colors.DIM}Cleaning up...{Colors.RESET}")
        cap.release()
        cv2.destroyAllWindows()
        gaze_estimator.release()
        activity_monitor.stop()
        status_reporter.stop()

        # ── Session Summary ──
        print_session_summary(decision_engine, start_time)


if __name__ == "__main__":
    main()
