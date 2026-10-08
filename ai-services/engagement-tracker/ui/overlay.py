"""
RASH EduHub — Soft Prompt Overlay
Non-intrusive desktop notification to re-engage distracted students.
Uses tkinter (built into Python) for a lightweight floating prompt.
"""

import threading
import time

try:
    import tkinter as tk
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False


class SoftPromptOverlay:
    """
    Displays a non-intrusive floating prompt window ("Still working?")
    that auto-dismisses after a configurable timeout.

    The overlay appears in the top-right corner of the screen with a
    semi-transparent dark background and smooth fade-in animation.
    """

    def __init__(self, display_seconds=8):
        """
        Args:
            display_seconds: How long the prompt stays visible before auto-dismiss.
        """
        self.display_seconds = display_seconds
        self._is_showing = False
        self._prompt_thread = None

    def show(self, message="Still working? 🤔", sub_message="Click here or start typing to dismiss"):
        """
        Show the soft prompt overlay in a non-blocking thread.

        Args:
            message: Main prompt text.
            sub_message: Secondary helper text.
        """
        if self._is_showing:
            return  # Don't stack prompts

        if not TKINTER_AVAILABLE:
            # Fallback: print to console
            print(f"\n{'='*50}")
            print(f"  💡 {message}")
            print(f"     {sub_message}")
            print(f"{'='*50}\n")
            return

        self._is_showing = True
        self._prompt_thread = threading.Thread(
            target=self._display_prompt,
            args=(message, sub_message),
            daemon=True,
        )
        self._prompt_thread.start()

    def _display_prompt(self, message, sub_message):
        """Create and display the tkinter overlay window."""
        try:
            root = tk.Tk()
            root.title("RASH EduHub")
            root.overrideredirect(True)           # Remove window decorations
            root.attributes("-topmost", True)     # Always on top
            root.attributes("-alpha", 0.0)        # Start transparent (for fade-in)

            # ── Window Sizing & Position (top-right corner) ──
            window_width = 380
            window_height = 120
            screen_width = root.winfo_screenwidth()
            x_pos = screen_width - window_width - 20
            y_pos = 30
            root.geometry(f"{window_width}x{window_height}+{x_pos}+{y_pos}")

            # ── Dark rounded background ──
            root.configure(bg="#1a1a2e")

            # Main frame with padding
            frame = tk.Frame(root, bg="#1a1a2e", padx=20, pady=15)
            frame.pack(fill="both", expand=True)

            # Header with icon
            header = tk.Label(
                frame,
                text=f"📚 RASH EduHub",
                font=("Segoe UI", 10, "bold"),
                fg="#8b5cf6",
                bg="#1a1a2e",
                anchor="w",
            )
            header.pack(anchor="w")

            # Main message
            msg_label = tk.Label(
                frame,
                text=message,
                font=("Segoe UI", 14, "bold"),
                fg="#ffffff",
                bg="#1a1a2e",
                anchor="w",
            )
            msg_label.pack(anchor="w", pady=(5, 2))

            # Sub message
            sub_label = tk.Label(
                frame,
                text=sub_message,
                font=("Segoe UI", 9),
                fg="#94a3b8",
                bg="#1a1a2e",
                anchor="w",
            )
            sub_label.pack(anchor="w")

            # ── Click to dismiss ──
            def dismiss(event=None):
                root.destroy()
                self._is_showing = False

            root.bind("<Button-1>", dismiss)
            frame.bind("<Button-1>", dismiss)
            msg_label.bind("<Button-1>", dismiss)

            # ── Fade-in animation ──
            def fade_in(alpha=0.0):
                if alpha < 0.92:
                    root.attributes("-alpha", alpha)
                    root.after(30, fade_in, alpha + 0.08)
                else:
                    root.attributes("-alpha", 0.92)

            fade_in()

            # ── Auto-dismiss after timeout ──
            root.after(self.display_seconds * 1000, dismiss)

            root.mainloop()

        except Exception as e:
            print(f"[SoftPrompt] Error displaying overlay: {e}")
        finally:
            self._is_showing = False

    @property
    def is_showing(self):
        return self._is_showing
