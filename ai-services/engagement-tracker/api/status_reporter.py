"""
RASH EduHub — Status Reporter
Sends engagement status updates to the Node.js backend API.
Batches updates to minimize network overhead.
"""

import time
import json
import threading
from typing import Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class StatusReporter:
    """
    Reports engagement status to the RASH EduHub backend API.

    Status updates are batched and sent at configurable intervals
    to avoid overwhelming the server with per-frame updates.
    """

    def __init__(
        self,
        backend_url="http://localhost:5000",
        report_interval=30,
        user_id=None,
        auth_token=None,
    ):
        """
        Args:
            backend_url: Base URL of the Node.js backend.
            report_interval: Seconds between status reports.
            user_id: Authenticated user ID.
            auth_token: JWT auth token for API requests.
        """
        self.backend_url = backend_url.rstrip("/")
        self.report_interval = report_interval
        self.user_id = user_id
        self.auth_token = auth_token

        self._status_buffer = []
        self._lock = threading.Lock()
        self._reporter_thread = None
        self._running = False
        self._last_report_time = 0

    def _get_headers(self):
        """Build request headers with auth token."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def record_status(self, snapshot):
        """
        Buffer an engagement snapshot for batch reporting.

        Args:
            snapshot: EngagementSnapshot from the decision engine.
        """
        with self._lock:
            self._status_buffer.append({
                "timestamp": snapshot.timestamp,
                "status": snapshot.status.value,
                "gaze_centered": snapshot.gaze_centered,
                "pose_normal": snapshot.pose_normal,
                "is_active": snapshot.is_active,
                "lookaway_duration": snapshot.lookaway_duration,
                "confidence": snapshot.confidence,
            })

    def _send_batch(self):
        """Send buffered status updates to the backend."""
        with self._lock:
            if not self._status_buffer:
                return
            batch = self._status_buffer.copy()
            self._status_buffer.clear()

        if not REQUESTS_AVAILABLE:
            print(f"[StatusReporter] Would send {len(batch)} status updates (requests not installed)")
            return

        payload = {
            "user_id": self.user_id,
            "engagement_data": batch,
            "session_summary": {
                "report_count": len(batch),
                "period_start": batch[0]["timestamp"] if batch else 0,
                "period_end": batch[-1]["timestamp"] if batch else 0,
            },
        }

        try:
            url = f"{self.backend_url}/api/ai/engagement/status"
            response = requests.post(
                url,
                json=payload,
                headers=self._get_headers(),
                timeout=10,
            )
            if response.status_code == 200:
                print(f"[StatusReporter] ✅ Sent {len(batch)} status updates")
            else:
                print(f"[StatusReporter] ⚠ Server returned {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("[StatusReporter] ⚠ Backend not reachable — status updates buffered locally")
        except Exception as e:
            print(f"[StatusReporter] ❌ Error sending status: {e}")

    def _reporter_loop(self):
        """Background loop that sends batches at the configured interval."""
        while self._running:
            time.sleep(self.report_interval)
            self._send_batch()

    def start(self):
        """Start the background reporter thread."""
        if self._running:
            return
        self._running = True
        self._reporter_thread = threading.Thread(target=self._reporter_loop, daemon=True)
        self._reporter_thread.start()

    def stop(self):
        """Stop reporting and flush remaining buffer."""
        self._running = False
        self._send_batch()  # Flush remaining
        if self._reporter_thread:
            self._reporter_thread.join(timeout=5)

    def flush(self):
        """Immediately send any buffered status updates."""
        self._send_batch()
