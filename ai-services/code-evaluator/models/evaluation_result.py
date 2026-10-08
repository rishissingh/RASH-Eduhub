"""
RASH EduHub — Evaluation Result Data Model
Structured response output schema required by the Smart Code Evaluation module.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LogicFlaw(BaseModel):
    line: Optional[int] = Field(None, description="Line number of potential logic flaw")
    type: str = Field(..., description="Flaw category (e.g. off_by_one, edge_case, infinite_loop)")
    description: str = Field(..., description="Actionable summary of the flaw")


class EvaluationResult(BaseModel):
    pass_rate: float = Field(..., ge=0.0, le=1.0, description="Test cases passed ratio")
    time_complexity: str = Field(..., description="Estimated time complexity (e.g., O(n), O(n log n))")
    space_complexity: str = Field(..., description="Estimated space complexity (e.g., O(1), O(n))")
    logic_flaws: List[LogicFlaw] = Field(default_factory=list, description="List of identified logic flaws")
    actionable_feedback: List[str] = Field(default_factory=list, description="Actionable recommendations")
    code_quality_score: float = Field(..., ge=0.0, le=100.0, description="Overall code quality score")
    style_issues: List[str] = Field(default_factory=list, description="Code style & clean code suggestions")
    language: str = Field(..., description="Programming language evaluated (Python, Java, C++)")
    execution_time_ms: float = Field(0.0, description="Sandbox execution duration in milliseconds")
