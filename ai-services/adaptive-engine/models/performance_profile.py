"""
RASH EduHub — User Performance Profile Model
Data model representing a learner's performance history and current metrics.
Used by the Adaptive Learning Engine to make difficulty decisions.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timezone
import json
import os


@dataclass
class QuizAttempt:
    """A single quiz attempt record."""
    quiz_id: str
    topic: str
    score: float           # 0.0 to 1.0
    total_questions: int
    correct_answers: int
    time_taken_seconds: float
    expected_time_seconds: float
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    @property
    def accuracy(self) -> float:
        return self.correct_answers / max(self.total_questions, 1)

    @property
    def time_efficiency(self) -> float:
        """
        Time efficiency ratio. >1.0 means faster than expected.
        Clamped to [0.2, 2.0] to prevent extreme values.
        """
        if self.time_taken_seconds <= 0:
            return 1.0
        ratio = self.expected_time_seconds / self.time_taken_seconds
        return max(0.2, min(2.0, ratio))


@dataclass
class CodeSubmissionRecord:
    """A code evaluation result record."""
    challenge_id: str
    language: str
    pass_rate: float           # 0.0 to 1.0
    code_quality_score: float  # 0.0 to 100.0
    time_complexity_optimal: bool
    logic_flaw_count: int
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    @property
    def normalized_score(self) -> float:
        """
        Combined code evaluation score (0.0 to 1.0).
        Weighted: 50% pass rate, 30% quality, 20% optimization.
        """
        quality_norm = self.code_quality_score / 100.0
        opt_score = 1.0 if self.time_complexity_optimal else 0.5
        flaw_penalty = max(0.0, 1.0 - (self.logic_flaw_count * 0.15))

        return (
            0.50 * self.pass_rate +
            0.30 * quality_norm * flaw_penalty +
            0.20 * opt_score
        )


@dataclass
class EngagementRecord:
    """Engagement data from the tracker for a study session."""
    session_id: str
    focus_ratio: float        # 0.0 to 1.0
    distracted_ratio: float
    notes_ratio: float
    session_duration_seconds: float
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class UserPerformanceProfile:
    """
    Complete performance profile for a single learner.
    Stores historical quiz attempts, code submissions, and engagement data.
    The Adaptive Engine uses this to compute composite scores and adjust difficulty.
    """
    user_id: str
    current_difficulty: str = "Beginner"
    composite_score: float = 0.5
    topics_mastered: List[str] = field(default_factory=list)
    topics_struggling: List[str] = field(default_factory=list)
    quiz_history: List[QuizAttempt] = field(default_factory=list)
    code_history: List[CodeSubmissionRecord] = field(default_factory=list)
    engagement_history: List[EngagementRecord] = field(default_factory=list)
    skill_scores: Dict[str, float] = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        now = datetime.now(timezone.utc).isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now

    def add_quiz_attempt(self, attempt: QuizAttempt):
        """Add a quiz attempt and update topic skill scores."""
        self.quiz_history.append(attempt)
        self._update_topic_score(attempt.topic, attempt.accuracy)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def add_code_submission(self, submission: CodeSubmissionRecord):
        """Add a code submission record."""
        self.code_history.append(submission)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def add_engagement_record(self, record: EngagementRecord):
        """Add an engagement tracking record."""
        self.engagement_history.append(record)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def _update_topic_score(self, topic: str, new_score: float):
        """Update rolling skill score for a topic using exponential moving average."""
        alpha = 0.3  # Smoothing factor (higher = more reactive to recent scores)
        current = self.skill_scores.get(topic, 0.5)
        self.skill_scores[topic] = alpha * new_score + (1 - alpha) * current

        # Classify topics
        self.topics_mastered = [t for t, s in self.skill_scores.items() if s >= 0.80]
        self.topics_struggling = [t for t, s in self.skill_scores.items() if s < 0.45]

    @property
    def recent_quiz_accuracy(self) -> float:
        """Average accuracy over last 10 quiz attempts."""
        recent = self.quiz_history[-10:]
        if not recent:
            return 0.5
        return sum(q.accuracy for q in recent) / len(recent)

    @property
    def recent_code_score(self) -> float:
        """Average normalized code score over last 10 submissions."""
        recent = self.code_history[-10:]
        if not recent:
            return 0.5
        return sum(c.normalized_score for c in recent) / len(recent)

    @property
    def recent_time_efficiency(self) -> float:
        """Average time efficiency over last 10 quiz attempts."""
        recent = self.quiz_history[-10:]
        if not recent:
            return 1.0
        return sum(q.time_efficiency for q in recent) / len(recent)

    @property
    def recent_focus_ratio(self) -> float:
        """Average focus ratio over last 5 engagement sessions."""
        recent = self.engagement_history[-5:]
        if not recent:
            return 1.0
        return sum(e.focus_ratio for e in recent) / len(recent)

    def to_dict(self) -> dict:
        """Serialize to dictionary for JSON storage."""
        return {
            "user_id": self.user_id,
            "current_difficulty": self.current_difficulty,
            "composite_score": self.composite_score,
            "topics_mastered": self.topics_mastered,
            "topics_struggling": self.topics_struggling,
            "skill_scores": self.skill_scores,
            "quiz_history": [
                {
                    "quiz_id": q.quiz_id, "topic": q.topic, "score": q.score,
                    "total_questions": q.total_questions, "correct_answers": q.correct_answers,
                    "time_taken_seconds": q.time_taken_seconds,
                    "expected_time_seconds": q.expected_time_seconds,
                    "timestamp": q.timestamp,
                }
                for q in self.quiz_history
            ],
            "code_history": [
                {
                    "challenge_id": c.challenge_id, "language": c.language,
                    "pass_rate": c.pass_rate, "code_quality_score": c.code_quality_score,
                    "time_complexity_optimal": c.time_complexity_optimal,
                    "logic_flaw_count": c.logic_flaw_count, "timestamp": c.timestamp,
                }
                for c in self.code_history
            ],
            "engagement_history": [
                {
                    "session_id": e.session_id, "focus_ratio": e.focus_ratio,
                    "distracted_ratio": e.distracted_ratio, "notes_ratio": e.notes_ratio,
                    "session_duration_seconds": e.session_duration_seconds,
                    "timestamp": e.timestamp,
                }
                for e in self.engagement_history
            ],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserPerformanceProfile":
        """Deserialize from dictionary."""
        profile = cls(
            user_id=data["user_id"],
            current_difficulty=data.get("current_difficulty", "Beginner"),
            composite_score=data.get("composite_score", 0.5),
            topics_mastered=data.get("topics_mastered", []),
            topics_struggling=data.get("topics_struggling", []),
            skill_scores=data.get("skill_scores", {}),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
        )

        for q in data.get("quiz_history", []):
            profile.quiz_history.append(QuizAttempt(**q))
        for c in data.get("code_history", []):
            profile.code_history.append(CodeSubmissionRecord(**c))
        for e in data.get("engagement_history", []):
            profile.engagement_history.append(EngagementRecord(**e))

        return profile


class ProfileStore:
    """Simple file-based profile storage (SQLite alternative for simplicity)."""

    def __init__(self, db_path="data/profiles.json"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        if not os.path.exists(db_path):
            self._save_all({})

    def _load_all(self) -> dict:
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save_all(self, data: dict):
        with open(self.db_path, "w") as f:
            json.dump(data, f, indent=2)

    def get(self, user_id: str) -> Optional[UserPerformanceProfile]:
        data = self._load_all()
        if user_id in data:
            return UserPerformanceProfile.from_dict(data[user_id])
        return None

    def save(self, profile: UserPerformanceProfile):
        data = self._load_all()
        data[profile.user_id] = profile.to_dict()
        self._save_all(data)

    def get_or_create(self, user_id: str) -> UserPerformanceProfile:
        profile = self.get(user_id)
        if profile is None:
            profile = UserPerformanceProfile(user_id=user_id)
            self.save(profile)
        return profile
