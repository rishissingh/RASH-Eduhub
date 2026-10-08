"""
RASH EduHub — Confidence-Weighted Decay Scoring Engine
Computes composite performance scores using:
  composite_score = (0.80 × direct_performance) + (0.20 × engagement_score)

Direct performance sub-weights:
  - Quiz accuracy:       40%
  - Code evaluation:     35%
  - Completion time:     25%

Engagement signals use time-decay so older sessions carry less weight.
"""

import math
from datetime import datetime, timezone
from typing import Optional

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.config import ServiceConfig


class ScoringEngine:
    """
    Computes composite learning performance scores using a
    confidence-weighted decay model.

    The model prioritizes direct performance metrics (80%) over
    engagement signals (20%) to avoid penalizing students who
    learn differently (e.g., looking away to think).
    """

    def __init__(
        self,
        performance_weight: float = ServiceConfig.PERFORMANCE_WEIGHT,
        engagement_weight: float = ServiceConfig.ENGAGEMENT_WEIGHT,
        quiz_weight: float = ServiceConfig.QUIZ_ACCURACY_WEIGHT,
        code_weight: float = ServiceConfig.CODE_EVAL_WEIGHT,
        time_weight: float = ServiceConfig.COMPLETION_TIME_WEIGHT,
        decay_factor: float = ServiceConfig.ENGAGEMENT_DECAY_FACTOR,
    ):
        self.performance_weight = performance_weight
        self.engagement_weight = engagement_weight
        self.quiz_weight = quiz_weight
        self.code_weight = code_weight
        self.time_weight = time_weight
        self.decay_factor = decay_factor

    def compute_direct_performance(self, profile) -> float:
        """
        Compute direct performance score from quiz accuracy,
        code evaluation scores, and completion time efficiency.

        Args:
            profile: UserPerformanceProfile instance.

        Returns:
            float: Direct performance score (0.0 to 1.0).
        """
        quiz_accuracy = profile.recent_quiz_accuracy
        code_score = profile.recent_code_score

        # Normalize time efficiency to [0, 1] range
        # time_efficiency > 1.0 = faster than expected → good
        # time_efficiency < 1.0 = slower than expected → needs improvement
        raw_efficiency = profile.recent_time_efficiency
        time_factor = self._sigmoid_normalize(raw_efficiency, center=1.0, steepness=3.0)

        direct = (
            self.quiz_weight * quiz_accuracy +
            self.code_weight * code_score +
            self.time_weight * time_factor
        )

        return round(max(0.0, min(1.0, direct)), 4)

    def compute_engagement_score(self, profile) -> float:
        """
        Compute time-decayed engagement score.
        Recent sessions are weighted more heavily than older ones.

        Uses exponential decay: weight_i = decay_factor^(days_since_session)

        Args:
            profile: UserPerformanceProfile instance.

        Returns:
            float: Engagement score (0.0 to 1.0).
        """
        engagement_records = profile.engagement_history
        if not engagement_records:
            return 0.5  # Default neutral score if no engagement data

        now = datetime.now(timezone.utc)
        weighted_sum = 0.0
        weight_total = 0.0

        for record in engagement_records[-20:]:  # Last 20 sessions
            try:
                record_time = datetime.fromisoformat(record.timestamp.replace("Z", "+00:00"))
                days_ago = (now - record_time).total_seconds() / 86400.0
            except (ValueError, AttributeError):
                days_ago = 0.0

            # Exponential decay weight
            weight = self.decay_factor ** days_ago

            # Focus ratio is the primary engagement signal
            # Notes/thinking time counts positively (not penalized)
            effective_focus = record.focus_ratio + record.notes_ratio
            effective_focus = min(1.0, effective_focus)

            weighted_sum += weight * effective_focus
            weight_total += weight

        if weight_total < 1e-6:
            return 0.5

        return round(weighted_sum / weight_total, 4)

    def compute_composite_score(self, profile) -> dict:
        """
        Compute the final composite score combining direct performance
        and engagement signals.

        composite = (0.80 × direct_performance) + (0.20 × engagement_score)

        Args:
            profile: UserPerformanceProfile instance.

        Returns:
            dict with all score components:
                - composite_score: float (0.0 to 1.0)
                - direct_performance: float
                - engagement_score: float
                - quiz_accuracy: float
                - code_score: float
                - time_efficiency: float
                - confidence: float (how reliable the score is based on data volume)
        """
        direct = self.compute_direct_performance(profile)
        engagement = self.compute_engagement_score(profile)

        composite = (
            self.performance_weight * direct +
            self.engagement_weight * engagement
        )
        composite = round(max(0.0, min(1.0, composite)), 4)

        # Confidence: how much data do we have to trust this score?
        # More data → higher confidence (logarithmic scaling)
        data_points = len(profile.quiz_history) + len(profile.code_history)
        confidence = min(1.0, math.log(1 + data_points) / math.log(21))  # 20+ points = full confidence

        return {
            "composite_score": composite,
            "direct_performance": direct,
            "engagement_score": engagement,
            "quiz_accuracy": round(profile.recent_quiz_accuracy, 4),
            "code_score": round(profile.recent_code_score, 4),
            "time_efficiency": round(profile.recent_time_efficiency, 4),
            "focus_ratio": round(profile.recent_focus_ratio, 4),
            "confidence": round(confidence, 3),
            "data_points": data_points,
        }

    @staticmethod
    def _sigmoid_normalize(value: float, center: float = 1.0, steepness: float = 3.0) -> float:
        """
        Normalize a value to [0, 1] using a sigmoid function centered at `center`.
        Values below center → 0..0.5, values above → 0.5..1.0.
        """
        x = steepness * (value - center)
        return 1.0 / (1.0 + math.exp(-x))
