"""
RASH EduHub — Shared Configuration for AI Microservices
"""

import os


class ServiceConfig:
    """Central configuration for all AI microservices."""

    # ── Service Ports ──
    ADAPTIVE_ENGINE_PORT = int(os.getenv("ADAPTIVE_PORT", 5001))
    CODE_EVALUATOR_PORT = int(os.getenv("CODE_EVAL_PORT", 5002))
    RECOMMENDATION_PORT = int(os.getenv("RECOMMEND_PORT", 5003))

    # ── Node.js Backend ──
    NODEJS_BACKEND_URL = os.getenv("NODEJS_BACKEND", "http://localhost:5000")

    # ── CORS Origins ──
    CORS_ORIGINS = [
        "http://localhost:5000",
        "http://localhost:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:3000",
    ]

    # ── JWT Auth (shared secret with Node.js backend) ──
    JWT_SECRET = os.getenv("JWT_SECRET", "rash-eduhub-secret-key-change-in-production")
    JWT_ALGORITHM = "HS256"

    # ── Difficulty Levels ──
    DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"]

    # ── Scoring Weights (Confidence-Weighted Decay) ──
    PERFORMANCE_WEIGHT = 0.80   # 80% direct performance
    ENGAGEMENT_WEIGHT = 0.20    # 20% engagement signals

    # Sub-weights within direct performance
    QUIZ_ACCURACY_WEIGHT = 0.40
    CODE_EVAL_WEIGHT = 0.35
    COMPLETION_TIME_WEIGHT = 0.25

    # Engagement decay factor (per day)
    ENGAGEMENT_DECAY_FACTOR = 0.95

    # ── Difficulty Thresholds ──
    BEGINNER_THRESHOLD = 0.45
    INTERMEDIATE_THRESHOLD = 0.75

    # ── Engagement Tracker Settings ──
    GAZE_AWAY_TIMEOUT_SECONDS = 10
    ACTIVITY_WINDOW_SECONDS = 10
    STATUS_REPORT_INTERVAL_SECONDS = 30
    SOFT_PROMPT_DISPLAY_SECONDS = 8
    GAZE_CENTERED_YAW_THRESHOLD = 25.0   # degrees
    GAZE_CENTERED_PITCH_THRESHOLD = 20.0  # degrees
    ACTIVITY_EVENT_THRESHOLD = 3          # min events in window to count as "active"

    # ── Recommendation Engine ──
    TOP_K_RECOMMENDATIONS = 5
    MIN_SIMILARITY_THRESHOLD = 0.15
