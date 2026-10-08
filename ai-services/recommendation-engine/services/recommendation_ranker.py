"""
RASH EduHub — Recommendation Ranker Engine
Combines cosine similarity, skill gap urgency, and market demand weights
to produce ranked recommendation outputs.
"""

from typing import List, Dict, Any
from services.similarity_engine import SimilarityEngine
from services.skill_gap_analyzer import SkillGapAnalyzer


class RecommendationRanker:
    """
    Ranks career roadmaps, practice modules, and courses for a student.
    """

    def __init__(self):
        self.similarity_engine = SimilarityEngine()
        self.gap_analyzer = SkillGapAnalyzer()

    def rank_roadmaps(self, user_skills: Dict[str, float], roadmaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ranked = []

        for rm in roadmaps:
            required_skills = rm.get("required_skills", [])
            similarity = self.similarity_engine.compute_similarity(user_skills, required_skills)
            gap_info = self.gap_analyzer.analyze_gaps(user_skills, required_skills)
            market_demand = rm.get("market_demand", 0.8)

            # Combined ranking score: 50% skill similarity, 30% readiness, 20% market demand
            ranking_score = (
                0.50 * similarity +
                0.30 * (gap_info["readiness_percentage"] / 100.0) +
                0.20 * market_demand
            )

            ranked.append({
                "roadmap_id": rm.get("id"),
                "title": rm.get("title"),
                "category": rm.get("category"),
                "match_score_percentage": round(ranking_score * 100, 1),
                "similarity_score": similarity,
                "market_demand": market_demand,
                "readiness_percentage": gap_info["readiness_percentage"],
                "missing_skills": gap_info["missing_skills"],
                "weak_skills": gap_info["weak_skills"],
                "recommended_courses": rm.get("recommended_courses", []),
                "practice_modules": rm.get("practice_modules", []),
                "recommended_readings": rm.get("recommended_readings", [])
            })

        ranked.sort(key=lambda x: x["match_score_percentage"], reverse=True)
        return ranked

    def get_practice_recommendations(self, user_skills: Dict[str, float], roadmaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns ranked list of practice modules targeted at closing user skill gaps.
        """
        ranked_roadmaps = self.rank_roadmaps(user_skills, roadmaps)
        practice_list = []

        for rm in ranked_roadmaps:
            for mod in rm.get("practice_modules", []):
                practice_list.append({
                    "module_title": mod.get("title"),
                    "difficulty": mod.get("difficulty"),
                    "career_alignment": rm["title"],
                    "target_missing_skills": rm["missing_skills"][:2],
                    "priority_score": rm["match_score_percentage"]
                })

        # Sort by priority score
        practice_list.sort(key=lambda x: x["priority_score"], reverse=True)
        return practice_list[:5]
