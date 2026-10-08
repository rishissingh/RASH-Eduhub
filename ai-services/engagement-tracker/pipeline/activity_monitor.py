"""
RASH EduHub — Keyboard/Mouse Activity Monitor
Uses pynput to track keyboard and mouse events in a sliding time window.
Determines if the user is actively interacting with their IDE/computer.

This runs in background threads and is thread-safe.
"""

import time
import threading
from collections import deque

try:
    from pynput import keyboard, mouse
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False


class ActivityMonitor:
    """
    Monitors keyboard and mouse activity using a sliding time window.

    Events are timestamped and stored in a deque. The monitor reports
    whether the user is "active" (enough events in the window) or "idle".
    """

    def __init__(self, window_seconds=10, min_events_threshold=3):
        """
        Args:
            window_seconds: Size of the sliding window (seconds).
            min_events_threshold: Minimum events in the window to classify as "active".
        """
        self.window_seconds = window_seconds
        self.min_events_threshold = min_events_threshold

        # Thread-safe event storage
        self._events = deque()
        self._lock = threading.Lock()

        # Listener threads
        self._keyboard_listener = None
        self._mouse_listener = None
        self._running = False

        # Counters for stats
        self._total_key_events = 0
        self._total_mouse_events = 0

    def _record_event(self, event_type):
        """Record a timestamped event."""
        with self._lock:
            self._events.append((time.time(), event_type))
            if event_type == "key":
                self._total_key_events += 1
            else:
                self._total_mouse_events += 1

    def _prune_old_events(self):
        """Remove events older than the sliding window."""
        cutoff = time.time() - self.window_seconds
        with self._lock:
            while self._events and self._events[0][0] < cutoff:
                self._events.popleft()

    # ── Keyboard callbacks ──
    def _on_key_press(self, key):
        self._record_event("key")

    # ── Mouse callbacks ──
    def _on_mouse_move(self, x, y):
        # Throttle: only record mouse moves every ~0.5s to avoid flood
        with self._lock:
            if self._events:
                last_time, last_type = self._events[-1]
                if last_type == "mouse_move" and (time.time() - last_time) < 0.5:
                    return
        self._record_event("mouse_move")

    def _on_mouse_click(self, x, y, button, pressed):
        if pressed:
            self._record_event("mouse_click")

    def _on_mouse_scroll(self, x, y, dx, dy):
        self._record_event("mouse_scroll")

    def start(self):
        """Start listening for keyboard and mouse events."""
        if not PYNPUT_AVAILABLE:
            print(
                "[ActivityMonitor] WARNING: pynput not installed. "
                "Keyboard/mouse tracking disabled. Install with: pip install pynput"
            )
            return

        if self._running:
            return

        self._running = True

        # Start keyboard listener
        self._keyboard_listener = keyboard.Listener(
            on_press=self._on_key_press,
        )
        self._keyboard_listener.daemon = True
        self._keyboard_listener.start()

        # Start mouse listener
        self._mouse_listener = mouse.Listener(
            on_move=self._on_mouse_move,
            on_click=self._on_mouse_click,
            on_scroll=self._on_mouse_scroll,
        )
        self._mouse_listener.daemon = True
        self._mouse_listener.start()

    def stop(self):
        """Stop all listeners."""
        self._running = False
        if self._keyboard_listener:
            self._keyboard_listener.stop()
        if self._mouse_listener:
            self._mouse_listener.stop()

    @property
    def is_active(self):
        """
        Check if user has been active within the sliding window.

        Returns:
            bool — True if event count >= threshold, else False.
        """
        self._prune_old_events()
        with self._lock:
            return len(self._events) >= self.min_events_threshold

    @property
    def event_count(self):
        """Number of events in the current sliding window."""
        self._prune_old_events()
        with self._lock:
            return len(self._events)

    @property
    def stats(self):
        """Return activity statistics."""
        self._prune_old_events()
        with self._lock:
            window_events = len(self._events)
            window_keys = sum(1 for _, t in self._events if t == "key")
            window_mouse = window_events - window_keys

        return {
            "is_active": window_events >= self.min_events_threshold,
            "window_event_count": window_events,
            "window_key_events": window_keys,
            "window_mouse_events": window_mouse,
            "total_key_events": self._total_key_events,
            "total_mouse_events": self._total_mouse_events,
        }
