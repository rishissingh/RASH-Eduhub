"""
RASH EduHub — Engagement Decision Engine
Implements the 3-tier context-aware focus classification logic:

  ┌──────────────────┐
  │  Webcam Stream   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Gaze & Pose      │
  │ Estimation       │
  └────────┬─────────┘
           │
      ┌────┴────┐
      │ Centered │──YES──► STATUS: "Focused" ✓
      │ Normal?  │
      └────┬────┘
           │ NO (>10 sec)
           ▼
  ┌──────────────────┐
  │ Check IDE Inputs │
  │ (keyboard/mouse) │
  └────────┬─────────┘
      ┌────┴──────┐
      │ KB/Mouse  │──YES──► STATUS: "Writing Notes / Deep Thinking" ✓
      │ Active?   │              (NO penalty)
      └────┬──────┘
           │ NO
           ▼
  ┌──────────────────┐
  │ Soft Prompt:     │
  │ "Still working?" │──────► STATUS: "Distracted" ⚠
  └──────────────────┘

Status transitions use a temporal buffer to prevent rapid flickering.
"""

import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List


class EngagementStatus(Enum):
    """Possible engagement states."""
    FOCUSED = "Focused"
    WRITING_NOTES = "Writing Notes / Deep Thinking"
    DISTRACTED = "Distracted"
    NO_FACE = "No Face Detected"
    INITIALIZING = "Initializing..."


@dataclass
class EngagementSnapshot:
    """A single point-in-time engagement measurement."""
    timestamp: float
    status: EngagementStatus
    gaze_centered: bool
    pose_normal: bool
    is_active: bool
    gaze_horizontal: float = 0.5
    gaze_vertical: float = 0.5
    head_yaw: float = 0.0
    head_pitch: float = 0.0
    lookaway_duration: float = 0.0
    confidence: float = 1.0


class DecisionEngine:
    """
    Context-aware engagement classifier implementing the 3-tier decision logic.

    The engine tracks temporal state to handle transitions:
    - A brief look-away (<10 seconds) does NOT trigger distraction.
    - Look-away >10 seconds + keyboard/mouse activity = "Writing Notes"
    - Look-away >10 seconds + no activity = "Distracted" → trigger soft prompt
    """

    def __init__(
        self,
        lookaway_timeout: float = 10.0,
        status_cooldown: float = 3.0,
        no_face_grace_period: float = 5.0,
    ):
        """
        Args:
            lookaway_timeout: Seconds of continuous look-away before escalation.
            status_cooldown: Minimum seconds between status changes (debounce).
            no_face_grace_period: Seconds without face detection before marking "No Face".
        """
        self.lookaway_timeout = lookaway_timeout
        self.status_cooldown = status_cooldown
        self.no_face_grace_period = no_face_grace_period

        # ── Internal State ──
        self._current_status = EngagementStatus.INITIALIZING
        self._last_status_change_time = 0.0
        self._lookaway_start_time: Optional[float] = None
        self._no_face_start_time: Optional[float] = None
        self._soft_prompt_triggered = False

        # History for analytics
        self._history: List[EngagementSnapshot] = []
        self._session_start_time = time.time()

        # Counters
        self._focus_frames = 0
        self._distracted_frames = 0
        self._notes_frames = 0
        self._total_frames = 0

    @property
    def current_status(self) -> EngagementStatus:
        return self._current_status

    @property
    def soft_prompt_triggered(self) -> bool:
        """Check (and clear) if a soft prompt should be shown."""
        if self._soft_prompt_triggered:
            self._soft_prompt_triggered = False
            return True
        return False

    @property
    def focus_ratio(self) -> float:
        """Fraction of total frames classified as 'Focused'."""
        if self._total_frames == 0:
            return 1.0
        return self._focus_frames / self._total_frames

    @property
    def session_stats(self) -> dict:
        """Return session-level engagement statistics."""
        total = max(self._total_frames, 1)
        elapsed = time.time() - self._session_start_time

        return {
            "session_duration_seconds": round(elapsed, 1),
            "total_frames_analyzed": self._total_frames,
            "focus_ratio": round(self._focus_frames / total, 3),
            "distracted_ratio": round(self._distracted_frames / total, 3),
            "notes_ratio": round(self._notes_frames / total, 3),
            "current_status": self._current_status.value,
        }

    def _can_change_status(self) -> bool:
        """Debounce: prevent rapid status flickering."""
        return (time.time() - self._last_status_change_time) >= self.status_cooldown

    def _set_status(self, new_status: EngagementStatus):
        """Set a new status with cooldown tracking."""
        if new_status != self._current_status and self._can_change_status():
            self._current_status = new_status
            self._last_status_change_time = time.time()

    def classify(
        self,
        gaze_centered: bool,
        pose_normal: bool,
        ide_active: bool,
        face_detected: bool = True,
        gaze_horizontal: float = 0.5,
        gaze_vertical: float = 0.5,
        head_yaw: float = 0.0,
        head_pitch: float = 0.0,
    ) -> EngagementSnapshot:
        """
        Run the 3-tier classification logic on a single frame.

        Args:
            gaze_centered: Whether the user's gaze is directed at the screen.
            pose_normal: Whether the user's head is facing the screen.
            ide_active: Whether keyboard/mouse activity was detected.
            face_detected: Whether a face was found in the frame.
            gaze_horizontal: Raw horizontal gaze ratio (for logging).
            gaze_vertical: Raw vertical gaze ratio (for logging).
            head_yaw: Head yaw angle in degrees (for logging).
            head_pitch: Head pitch angle in degrees (for logging).

        Returns:
            EngagementSnapshot with the classified status.
        """
        now = time.time()
        self._total_frames += 1

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # TIER 0: No Face Detected
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if not face_detected:
            if self._no_face_start_time is None:
                self._no_face_start_time = now

            no_face_duration = now - self._no_face_start_time

            if no_face_duration > self.no_face_grace_period:
                # Extended no-face: check IDE activity before assuming distraction
                if ide_active:
                    self._set_status(EngagementStatus.WRITING_NOTES)
                    self._notes_frames += 1
                else:
                    self._set_status(EngagementStatus.NO_FACE)
                    self._distracted_frames += 1
            # else: short no-face, keep current status (grace period)

            return self._create_snapshot(
                gaze_centered=False,
                pose_normal=False,
                is_active=ide_active,
                gaze_h=gaze_horizontal,
                gaze_v=gaze_vertical,
                yaw=head_yaw,
                pitch=head_pitch,
                lookaway_dur=no_face_duration if self._no_face_start_time else 0,
            )

        # Face IS detected — reset no-face timer
        self._no_face_start_time = None

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # TIER 1: Gaze + Pose Centered → "Focused"
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if gaze_centered and pose_normal:
            # User is looking at screen with head facing forward
            self._lookaway_start_time = None  # Reset lookaway timer
            self._set_status(EngagementStatus.FOCUSED)
            self._focus_frames += 1

            return self._create_snapshot(
                gaze_centered=True,
                pose_normal=True,
                is_active=ide_active,
                gaze_h=gaze_horizontal,
                gaze_v=gaze_vertical,
                yaw=head_yaw,
                pitch=head_pitch,
                lookaway_dur=0,
            )

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # User is looking away — start/continue lookaway timer
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if self._lookaway_start_time is None:
            self._lookaway_start_time = now

        lookaway_duration = now - self._lookaway_start_time

        # Brief look-away: still within tolerance, keep "Focused"
        if lookaway_duration < self.lookaway_timeout:
            # Don't change status yet — still in grace period
            self._focus_frames += 1
            return self._create_snapshot(
                gaze_centered=False,
                pose_normal=pose_normal,
                is_active=ide_active,
                gaze_h=gaze_horizontal,
                gaze_v=gaze_vertical,
                yaw=head_yaw,
                pitch=head_pitch,
                lookaway_dur=lookaway_duration,
            )

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # TIER 2: Look-away >10s + IDE Active → "Writing Notes"
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if ide_active:
            self._set_status(EngagementStatus.WRITING_NOTES)
            self._notes_frames += 1

            return self._create_snapshot(
                gaze_centered=False,
                pose_normal=pose_normal,
                is_active=True,
                gaze_h=gaze_horizontal,
                gaze_v=gaze_vertical,
                yaw=head_yaw,
                pitch=head_pitch,
                lookaway_dur=lookaway_duration,
            )

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # TIER 3: Look-away >10s + No Activity → "Distracted"
        #         Trigger soft prompt ("Still working?")
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if self._current_status != EngagementStatus.DISTRACTED:
            self._soft_prompt_triggered = True  # Signal to show prompt

        self._set_status(EngagementStatus.DISTRACTED)
        self._distracted_frames += 1

        return self._create_snapshot(
            gaze_centered=False,
            pose_normal=pose_normal,
            is_active=False,
            gaze_h=gaze_horizontal,
            gaze_v=gaze_vertical,
            yaw=head_yaw,
            pitch=head_pitch,
            lookaway_dur=lookaway_duration,
        )

    def _create_snapshot(
        self, gaze_centered, pose_normal, is_active,
        gaze_h, gaze_v, yaw, pitch, lookaway_dur,
    ) -> EngagementSnapshot:
        """Create and store an engagement snapshot."""
        snapshot = EngagementSnapshot(
            timestamp=time.time(),
            status=self._current_status,
            gaze_centered=gaze_centered,
            pose_normal=pose_normal,
            is_active=is_active,
            gaze_horizontal=gaze_h,
            gaze_vertical=gaze_v,
            head_yaw=yaw,
            head_pitch=pitch,
            lookaway_duration=lookaway_dur,
        )
        self._history.append(snapshot)

        # Keep history manageable (last 1000 snapshots)
        if len(self._history) > 1000:
            self._history = self._history[-500:]

        return snapshot

    def reset(self):
        """Reset all state for a new session."""
        self._current_status = EngagementStatus.INITIALIZING
        self._last_status_change_time = 0.0
        self._lookaway_start_time = None
        self._no_face_start_time = None
        self._soft_prompt_triggered = False
        self._history.clear()
        self._session_start_time = time.time()
        self._focus_frames = 0
        self._distracted_frames = 0
        self._notes_frames = 0
        self._total_frames = 0
