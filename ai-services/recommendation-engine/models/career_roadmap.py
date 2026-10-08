"""
RASH EduHub — Career Roadmap Data Model
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class CareerRoadmap:
    id: str
    title: str
    category: str
    market_demand: float
    required_skills: List[str]
    recommended_courses: List[Dict[str, Any]]
    practice_modules: List[Dict[str, Any]]
    recommended_readings: List[str]
