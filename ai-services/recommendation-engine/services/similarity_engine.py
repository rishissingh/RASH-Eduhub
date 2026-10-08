"""
RASH EduHub — Cosine Similarity Matching Engine
Computes cosine similarity between user skill vectors and career roadmap requirement vectors.
"""

import math
from typing import List, Dict, Any, Tuple


class SimilarityEngine:
    """
    Computes TF-IDF / Cosine Similarity between user skill profiles and career roadmaps.
    """

    def compute_similarity(self, user_skills: Dict[str, float], required_skills: List[str]) -> float:
        """
        Calculates cosine similarity between user demonstrated skills and target required skills.
        """
        if not required_skills:
            return 0.0

        all_features = sorted(list(set(list(user_skills.keys()) + required_skills)))

        # Vector 1: User skill scores
        vec_user = [user_skills.get(skill, 0.0) for skill in all_features]

        # Vector 2: Roadmap binary/weighted requirement (1.0 for required skills)
        vec_roadmap = [1.0 if skill in required_skills else 0.0 for skill in all_features]

        # Compute dot product
        dot_product = sum(u * r for u, r in zip(vec_user, vec_roadmap))

        # Compute magnitudes
        mag_user = math.sqrt(sum(u ** 2 for u in vec_user))
        mag_roadmap = math.sqrt(sum(r ** 2 for r in vec_roadmap))

        if mag_user == 0.0 or mag_roadmap == 0.0:
            return 0.0

        similarity = dot_product / (mag_user * mag_roadmap)
        return round(float(similarity), 4)
