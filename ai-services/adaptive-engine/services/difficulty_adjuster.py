"""
RASH EduHub — Dynamic Difficulty Adjuster
Adjusts the difficulty level of content served to a student based
on their composite performance score.

Difficulty Levels:
  - Beginner      (score < 0.45): Fundamentals, guided examples, extra hints
  - Intermediate  (0.45 ≤ score < 0.75): Standard problems, moderate hints
  - Advanced      (score ≥ 0.75): Complex challenges, minimal guidance

Includes hysteresis to prevent rapid flickering between levels.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.config import ServiceConfig


class DifficultyAdjuster:
    """
    Dynamically adjusts difficulty levels based on composite scores.
    Uses hysteresis bands to prevent rapid oscillation between levels.
    """

    LEVELS = ServiceConfig.DIFFICULTY_LEVELS  # ["Beginner", "Intermediate", "Advanced"]

    # Promotion thresholds (must exceed to move up)
    PROMOTE_THRESHOLDS = {
        "Beginner": 0.50,       # Need 0.50+ to promote from Beginner
        "Intermediate": 0.78,   # Need 0.78+ to promote from Intermediate
    }

    # Demotion thresholds (must drop below to move down)
    DEMOTE_THRESHOLDS = {
        "Intermediate": 0.40,   # Drop below 0.40 → demote to Beginner
        "Advanced": 0.70,       # Drop below 0.70 → demote to Intermediate
    }

    # Minimum consecutive assessments at a score level before adjusting
    MIN_ASSESSMENTS_FOR_CHANGE = 3

    def __init__(self):
        self._consecutive_above = 0
        self._consecutive_below = 0
        self._last_score = 0.5

    def adjust(self, current_level: str, composite_score: float, confidence: float = 1.0) -> dict:
        """
        Determine if difficulty should be adjusted.

        Args:
            current_level: Current difficulty level ("Beginner", "Intermediate", "Advanced").
            composite_score: Latest composite score (0.0 to 1.0).
            confidence: Score confidence (0.0 to 1.0). Low confidence = no change.

        Returns:
            dict with:
                - new_level: str — the (possibly adjusted) difficulty level
                - changed: bool — whether the level changed
                - direction: str — "promoted", "demoted", or "unchanged"
                - reason: str — human-readable explanation
                - score_zone: str — where the score falls relative to thresholds
        """
        # Don't adjust if confidence is too low (not enough data)
        if confidence < 0.3:
            return {
                "new_level": current_level,
                "changed": False,
                "direction": "unchanged",
                "reason": f"Insufficient data (confidence: {confidence:.0%}). Need more quiz/code submissions.",
                "score_zone": "uncertain",
            }

        # ── Check for promotion ──
        promote_threshold = self.PROMOTE_THRESHOLDS.get(current_level)
        if promote_threshold and composite_score >= promote_threshold:
            self._consecutive_above += 1
            self._consecutive_below = 0

            if self._consecutive_above >= self.MIN_ASSESSMENTS_FOR_CHANGE:
                new_level = self._next_level(current_level)
                self._consecutive_above = 0
                return {
                    "new_level": new_level,
                    "changed": True,
                    "direction": "promoted",
                    "reason": (
                        f"Excellent work! Score of {composite_score:.0%} consistently above "
                        f"{promote_threshold:.0%} threshold. Moving to {new_level} level."
                    ),
                    "score_zone": "above_threshold",
                }
            else:
                return {
                    "new_level": current_level,
                    "changed": False,
                    "direction": "unchanged",
                    "reason": (
                        f"Score {composite_score:.0%} is above promotion threshold. "
                        f"Need {self.MIN_ASSESSMENTS_FOR_CHANGE - self._consecutive_above} more consistent assessments."
                    ),
                    "score_zone": "promotion_pending",
                }

        # ── Check for demotion ──
        demote_threshold = self.DEMOTE_THRESHOLDS.get(current_level)
        if demote_threshold and composite_score < demote_threshold:
            self._consecutive_below += 1
            self._consecutive_above = 0

            if self._consecutive_below >= self.MIN_ASSESSMENTS_FOR_CHANGE:
                new_level = self._prev_level(current_level)
                self._consecutive_below = 0
                return {
                    "new_level": new_level,
                    "changed": True,
                    "direction": "demoted",
                    "reason": (
                        f"Score of {composite_score:.0%} is below {demote_threshold:.0%}. "
                        f"Adjusting to {new_level} for better-matched content and more support."
                    ),
                    "score_zone": "below_threshold",
                }
            else:
                return {
                    "new_level": current_level,
                    "changed": False,
                    "direction": "unchanged",
                    "reason": (
                        f"Score {composite_score:.0%} is below comfort zone. "
                        f"Monitoring for {self.MIN_ASSESSMENTS_FOR_CHANGE - self._consecutive_below} more assessments."
                    ),
                    "score_zone": "demotion_pending",
                }

        # ── Score is in the stable zone ──
        self._consecutive_above = 0
        self._consecutive_below = 0
        return {
            "new_level": current_level,
            "changed": False,
            "direction": "unchanged",
            "reason": f"Score {composite_score:.0%} is within the stable zone for {current_level}.",
            "score_zone": "stable",
        }

    def get_level_config(self, level: str) -> dict:
        """
        Get configuration for a difficulty level.
        Defines what kind of content and support the student receives.
        """
        configs = {
            "Beginner": {
                "level": "Beginner",
                "content_types": ["tutorials", "guided_examples", "video_walkthroughs"],
                "hint_level": "full",
                "problem_complexity": "basic",
                "time_multiplier": 1.5,  # 50% extra time for quizzes
                "max_hints": 5,
                "show_solutions_after_attempt": True,
                "spaced_repetition_interval_days": 1,
                "description": "Fundamentals with guided examples and extra support",
            },
            "Intermediate": {
                "level": "Intermediate",
                "content_types": ["practice_problems", "mini_projects", "code_challenges"],
                "hint_level": "partial",
                "problem_complexity": "moderate",
                "time_multiplier": 1.0,
                "max_hints": 3,
                "show_solutions_after_attempt": False,
                "spaced_repetition_interval_days": 3,
                "description": "Standard problems with moderate guidance",
            },
            "Advanced": {
                "level": "Advanced",
                "content_types": ["complex_challenges", "system_design", "optimization_problems"],
                "hint_level": "minimal",
                "problem_complexity": "hard",
                "time_multiplier": 0.8,  # Tighter time constraints
                "max_hints": 1,
                "show_solutions_after_attempt": False,
                "spaced_repetition_interval_days": 7,
                "description": "Complex challenges with minimal guidance and optimization focus",
            },
        }
        return configs.get(level, configs["Beginner"])

    def _next_level(self, current: str) -> str:
        idx = self.LEVELS.index(current) if current in self.LEVELS else 0
        return self.LEVELS[min(idx + 1, len(self.LEVELS) - 1)]

    def _prev_level(self, current: str) -> str:
        idx = self.LEVELS.index(current) if current in self.LEVELS else 0
        return self.LEVELS[max(idx - 1, 0)]
