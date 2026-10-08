"""
RASH EduHub — User Skill Profile Model for Recommendation Engine
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any


@dataclass
class SkillProfile:
    user_id: str
    skill_scores: Dict[str, float] = field(default_factory=dict)
    topics_mastered: List[str] = field(default_factory=list)
    topics_struggling: List[str] = field(default_factory=list)
    target_career: str = ""

    def get_known_skills(self) -> List[str]:
        return [skill for skill, score in self.skill_scores.items() if score >= 0.50]
