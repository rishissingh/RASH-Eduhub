"""
RASH EduHub — Skill Gap Analyzer
Identifies missing skills and skill gaps by comparing user profile against roadmap requirements.
"""

from typing import Dict, List, Any


class SkillGapAnalyzer:
    """
    Analyzes skill gaps between user demonstrated proficiency and career roadmap requirements.
    """

    def analyze_gaps(self, user_skills: Dict[str, float], required_skills: List[str]) -> Dict[str, Any]:
        """
        Returns:
            Dict containing missing_skills, weak_skills, mastered_skills, and readiness_percentage.
        """
        missing = []
        weak = []
        mastered = []

        for req in required_skills:
            score = user_skills.get(req, 0.0)
            if score == 0.0:
                missing.append(req)
            elif score < 0.65:
                weak.append({"skill": req, "current_score": round(score, 2)})
            else:
                mastered.append(req)

        readiness = (len(mastered) + 0.5 * len(weak)) / max(len(required_skills), 1)

        return {
            "missing_skills": missing,
            "weak_skills": weak,
            "mastered_skills": mastered,
            "readiness_percentage": round(readiness * 100, 1)
        }
