"""
RASH EduHub — Smart Code Evaluation Microservice
FastAPI Application (Port 5002) providing:
  - Multi-language AST Parsing (Python, Java, C++)
  - Static Code Analysis & Style Quality Checks
  - Big-O Time & Space Complexity Estimation
  - Safe Process Sandbox Test Execution
  - CodeBERT/NLP Semantic Evaluation
  - Structured JSON Output Formatter
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from models.evaluation_result import EvaluationResult
from analyzers.ast_analyzer import ASTAnalyzer
from analyzers.complexity_analyzer import ComplexityAnalyzer
from analyzers.style_checker import StyleChecker
from analyzers.nlp_evaluator import NLPEvaluator
from sandbox.executor import CodeExecutor
from shared.config import ServiceConfig
from shared.logger import get_logger

logger = get_logger("code-evaluator")

app = FastAPI(
    title="RASH EduHub — Smart Code Evaluation Service",
    version="1.0.0",
    description="Evaluates code submissions for pass rate, time/space complexity, logic flaws, and actionable feedback."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ServiceConfig.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize evaluators
ast_analyzer = ASTAnalyzer()
complexity_analyzer = ComplexityAnalyzer()
style_checker = StyleChecker()
nlp_evaluator = NLPEvaluator()
code_executor = CodeExecutor()


class EvaluationRequest(BaseModel):
    code: str = Field(..., description="Source code to evaluate")
    language: str = Field("python", description="Programming language (python, java, cpp)")
    problem_description: Optional[str] = Field("", description="Problem statement for NLP semantic check")
    test_cases: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Test cases array")


@app.get("/api/evaluate/health")
def health_check():
    return {"status": "ok", "service": "code-evaluator", "port": ServiceConfig.CODE_EVALUATOR_PORT}


@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate_code(req: EvaluationRequest):
    """
    Evaluates submitted code and returns structured JSON output.
    """
    if not req.code or not req.code.strip():
        raise HTTPException(status_code=400, detail="Code content cannot be empty.")

    logger.info(f"Evaluating {req.language} submission ({len(req.code)} chars)...")

    # 1. Static AST Analysis
    ast_info = ast_analyzer.analyze(req.code, req.language)

    # 2. Time & Space Complexity Estimation
    time_comp, space_comp = complexity_analyzer.analyze(req.code, ast_info)

    # 3. Style & Logic Flaws Detection
    quality_score, logic_flaws, feedback, style_issues = style_checker.analyze(
        req.code, req.language, ast_info
    )

    # 4. Sandbox Test Execution
    pass_rate, test_results, exec_time_ms = code_executor.run_tests(
        req.code, req.language, req.test_cases or []
    )

    # 5. NLP / CodeBERT evaluation
    if req.problem_description:
        nlp_res = nlp_evaluator.evaluate_semantics(req.code, req.problem_description, req.language)
        if nlp_res.get("semantic_match_score", 1.0) < 0.5:
            feedback.append("Solution semantic match is low compared to problem requirements.")

    # Time complexity feedback check
    if time_comp in ["O(n²)", "O(n³)", "O(2ⁿ)"]:
        feedback.append(f"High time complexity ({time_comp}) detected. Consider optimizing loop structures.")

    return EvaluationResult(
        pass_rate=pass_rate,
        time_complexity=time_comp,
        space_complexity=space_comp,
        logic_flaws=logic_flaws,
        actionable_feedback=feedback,
        code_quality_score=quality_score,
        style_issues=style_issues,
        language=req.language,
        execution_time_ms=exec_time_ms
    )


if __name__ == "__main__":
    import uvicorn
    port = ServiceConfig.CODE_EVALUATOR_PORT
    logger.info(f"🚀 Code Evaluator starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
