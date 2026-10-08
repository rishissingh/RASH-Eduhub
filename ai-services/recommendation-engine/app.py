"""
RASH EduHub — AI Recommendation System Service
Flask Microservice (Port 5003) providing:
  - Skill Gap Identification & Vector Matching
  - Cosine Similarity Matching against Market Career Roadmaps
  - Ranked Recommendations for Courses, Practice Modules, and Readings
"""

import sys
import os
import json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

from services.recommendation_ranker import RecommendationRanker
from shared.config import ServiceConfig
from shared.logger import get_logger

app = Flask(__name__)
CORS(app, origins=ServiceConfig.CORS_ORIGINS)

logger = get_logger("recommendation-engine")
ranker = RecommendationRanker()

# Load career roadmaps knowledge base
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "career_roadmaps.json")
try:
    with open(DATA_PATH, "r") as f:
        ROADMAPS_DATA = json.load(f).get("roadmaps", [])
except Exception as e:
    logger.error(f"Error loading career_roadmaps.json: {e}")
    ROADMAPS_DATA = []


@app.route("/api/recommend/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "recommendation-engine", "port": ServiceConfig.RECOMMENDATION_PORT})


def _fetch_user_skill_scores(user_id):
    """Fetch skill score profile from the Node.js adaptive service."""
    if not user_id:
        return {}

    try:
        resp = requests.get(
            f"{ServiceConfig.NODEJS_BACKEND_URL}/api/ai/adaptive/profile/{user_id}",
            timeout=3
        )
        if resp.status_code == 200:
            return resp.json().get("profile", {}).get("skill_scores", {}) or {}
    except Exception as exc:
        logger.warning(f"Unable to fetch adaptive profile for user {user_id}: {exc}")
    return {}


def _resolve_user_skills(data):
    """Resolve user skill scores from payload or by querying adaptive profile."""
    user_skills = data.get("skill_scores") or {}
    if not isinstance(user_skills, dict):
        user_skills = {}

    if not user_skills and data.get("user_id"):
        user_skills = _fetch_user_skill_scores(data["user_id"])

    return user_skills


@app.route("/api/recommend/career", methods=["POST"])
def recommend_career():
    """
    Returns ranked career roadmaps aligned with user's skill gap profile.
    """
    data = request.json or {}
    user_skills = _resolve_user_skills(data)

    ranked = ranker.rank_roadmaps(user_skills, ROADMAPS_DATA)
    return jsonify({"success": True, "roadmaps": ranked})


@app.route("/api/recommend/practice", methods=["POST"])
def recommend_practice():
    """
    Returns ranked practice modules to bridge identified skill gaps.
    """
    data = request.json or {}
    user_skills = _resolve_user_skills(data)

    practice_mods = ranker.get_practice_recommendations(user_skills, ROADMAPS_DATA)
    return jsonify({"success": True, "practice_modules": practice_mods})


if __name__ == "__main__":
    port = ServiceConfig.RECOMMENDATION_PORT
    logger.info(f"🚀 Recommendation Engine starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
