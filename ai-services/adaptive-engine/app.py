"""
RASH EduHub — Adaptive Learning Engine API
Flask microservice (Port 5001) that provides:
  - Performance profile management
  - Composite scoring with confidence-weighted decay
  - Dynamic difficulty adjustment
  - Personalized study plan generation

Endpoints:
  POST /api/adaptive/profile          — Create/update user performance profile
  GET  /api/adaptive/profile/<id>     — Get user profile
  POST /api/adaptive/record-quiz      — Record a quiz attempt
  POST /api/adaptive/record-code      — Record a code submission
  POST /api/adaptive/record-engagement— Record engagement session
  POST /api/adaptive/recalibrate      — Recalibrate difficulty after new data
  GET  /api/adaptive/study-plan/<id>  — Generate personalized study plan
  GET  /api/adaptive/difficulty/<id>  — Get current difficulty and config
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask, request, jsonify
from flask_cors import CORS

from models.performance_profile import (
    UserPerformanceProfile, ProfileStore,
    QuizAttempt, CodeSubmissionRecord, EngagementRecord,
)
from services.scoring_engine import ScoringEngine
from services.difficulty_adjuster import DifficultyAdjuster
from services.study_plan_generator import StudyPlanGenerator
from shared.config import ServiceConfig
from shared.logger import get_logger

# ── Initialize ──
app = Flask(__name__)
CORS(app, origins=ServiceConfig.CORS_ORIGINS)

logger = get_logger("adaptive-engine")
profile_store = ProfileStore(db_path=os.path.join(os.path.dirname(__file__), "data", "profiles.json"))
scoring_engine = ScoringEngine()
difficulty_adjuster = DifficultyAdjuster()
study_plan_generator = StudyPlanGenerator()


# ── Health Check ──
@app.route("/api/adaptive/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "adaptive-engine", "port": ServiceConfig.ADAPTIVE_ENGINE_PORT})


# ── Get User Profile ──
@app.route("/api/adaptive/profile/<user_id>", methods=["GET"])
def get_profile(user_id):
    profile = profile_store.get_or_create(user_id)
    scores = scoring_engine.compute_composite_score(profile)

    return jsonify({
        "success": True,
        "profile": profile.to_dict(),
        "scores": scores,
    })


# ── Record Quiz Attempt ──
@app.route("/api/adaptive/record-quiz", methods=["POST"])
def record_quiz():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    profile = profile_store.get_or_create(user_id)

    attempt = QuizAttempt(
        quiz_id=data.get("quiz_id", ""),
        topic=data.get("topic", "General"),
        score=data.get("score", 0),
        total_questions=data.get("total_questions", 10),
        correct_answers=data.get("correct_answers", 0),
        time_taken_seconds=data.get("time_taken_seconds", 300),
        expected_time_seconds=data.get("expected_time_seconds", 300),
    )
    profile.add_quiz_attempt(attempt)

    # Recompute scores and check difficulty
    scores = scoring_engine.compute_composite_score(profile)
    profile.composite_score = scores["composite_score"]

    adjustment = difficulty_adjuster.adjust(
        profile.current_difficulty,
        scores["composite_score"],
        scores["confidence"],
    )

    if adjustment["changed"]:
        profile.current_difficulty = adjustment["new_level"]
        logger.info(f"User {user_id} difficulty {adjustment['direction']}: {adjustment['new_level']}")

    profile_store.save(profile)

    return jsonify({
        "success": True,
        "scores": scores,
        "difficulty_adjustment": adjustment,
        "current_difficulty": profile.current_difficulty,
    })


# ── Record Code Submission ──
@app.route("/api/adaptive/record-code", methods=["POST"])
def record_code():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    profile = profile_store.get_or_create(user_id)

    submission = CodeSubmissionRecord(
        challenge_id=data.get("challenge_id", ""),
        language=data.get("language", "python"),
        pass_rate=data.get("pass_rate", 0),
        code_quality_score=data.get("code_quality_score", 50),
        time_complexity_optimal=data.get("time_complexity_optimal", False),
        logic_flaw_count=data.get("logic_flaw_count", 0),
    )
    profile.add_code_submission(submission)

    scores = scoring_engine.compute_composite_score(profile)
    profile.composite_score = scores["composite_score"]

    adjustment = difficulty_adjuster.adjust(
        profile.current_difficulty,
        scores["composite_score"],
        scores["confidence"],
    )

    if adjustment["changed"]:
        profile.current_difficulty = adjustment["new_level"]

    profile_store.save(profile)

    return jsonify({
        "success": True,
        "scores": scores,
        "difficulty_adjustment": adjustment,
        "current_difficulty": profile.current_difficulty,
    })


# ── Record Engagement Session ──
@app.route("/api/adaptive/record-engagement", methods=["POST"])
def record_engagement():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    profile = profile_store.get_or_create(user_id)

    record = EngagementRecord(
        session_id=data.get("session_id", ""),
        focus_ratio=data.get("focus_ratio", 1.0),
        distracted_ratio=data.get("distracted_ratio", 0.0),
        notes_ratio=data.get("notes_ratio", 0.0),
        session_duration_seconds=data.get("session_duration_seconds", 0),
    )
    profile.add_engagement_record(record)
    profile_store.save(profile)

    return jsonify({
        "success": True,
        "message": "Engagement data recorded",
        "engagement_score": scoring_engine.compute_engagement_score(profile),
    })


# ── Recalibrate Difficulty ──
@app.route("/api/adaptive/recalibrate", methods=["POST"])
def recalibrate():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    profile = profile_store.get_or_create(user_id)
    scores = scoring_engine.compute_composite_score(profile)
    profile.composite_score = scores["composite_score"]

    adjustment = difficulty_adjuster.adjust(
        profile.current_difficulty,
        scores["composite_score"],
        scores["confidence"],
    )

    if adjustment["changed"]:
        profile.current_difficulty = adjustment["new_level"]
        profile_store.save(profile)

    return jsonify({
        "success": True,
        "scores": scores,
        "difficulty_adjustment": adjustment,
        "level_config": difficulty_adjuster.get_level_config(profile.current_difficulty),
    })


# ── Generate Study Plan ──
@app.route("/api/adaptive/study-plan/<user_id>", methods=["GET"])
def get_study_plan(user_id):
    profile = profile_store.get_or_create(user_id)
    days = request.args.get("days", 7, type=int)

    plan = study_plan_generator.generate_plan(
        user_id=user_id,
        difficulty=profile.current_difficulty,
        skill_scores=profile.skill_scores,
        topics_mastered=profile.topics_mastered,
        topics_struggling=profile.topics_struggling,
        days=min(days, 30),
    )

    return jsonify({"success": True, "study_plan": plan})


# ── Get Difficulty Info ──
@app.route("/api/adaptive/difficulty/<user_id>", methods=["GET"])
def get_difficulty(user_id):
    profile = profile_store.get_or_create(user_id)
    config = difficulty_adjuster.get_level_config(profile.current_difficulty)

    return jsonify({
        "success": True,
        "current_difficulty": profile.current_difficulty,
        "composite_score": profile.composite_score,
        "config": config,
    })


# ── Run Server ──
if __name__ == "__main__":
    port = ServiceConfig.ADAPTIVE_ENGINE_PORT
    logger.info(f"🚀 Adaptive Learning Engine starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
