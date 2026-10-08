"""
RASH EduHub — Code Style & Quality Analyzer
Evaluates code quality, detects code smells, style issues, and logic flaws.
"""

import re
from typing import List, Dict, Any, Tuple
from models.evaluation_result import LogicFlaw


class StyleChecker:
    """
    Performs static checks for code quality, style, naming conventions,
    and common logic flaws across Python, Java, and C++.
    """

    def analyze(self, code: str, language: str, ast_info: Dict[str, Any]) -> Tuple[float, List[LogicFlaw], List[str], List[str]]:
        """
        Returns:
            Tuple[code_quality_score, logic_flaws, actionable_feedback, style_issues]
        """
        flaws: List[LogicFlaw] = []
        feedback: List[str] = []
        style_issues: List[str] = []
        deductions = 0.0

        lines = code.splitlines()

        # Check syntax error
        if not ast_info.get("syntax_valid", True):
            flaws.append(LogicFlaw(
                line=None,
                type="syntax_error",
                description=ast_info.get("error") or "Syntax error in submitted code"
            ))
            feedback.append("Fix syntax errors before running or evaluating solution.")
            return 0.0, flaws, feedback, ["Invalid syntax"]

        # Check line lengths & single char variable names
        for idx, line in enumerate(lines, 1):
            if len(line) > 100:
                style_issues.append(f"Line {idx} exceeds 100 characters ({len(line)} chars).")
                deductions += 2

            # Check single char variable assignments (except standard i, j, k, n, x, y)
            match = re.search(r'\b([a-mo-wz])\s*=', line)
            if match and match.group(1) not in ['i', 'j', 'k', 'n', 'x', 'y']:
                style_issues.append(f"Line {idx}: Single letter variable name '{match.group(1)}' should be descriptive.")
                deductions += 3

        # Check for empty pass or dummy returns
        if "pass" in code and len(lines) <= 3:
            flaws.append(LogicFlaw(
                line=None,
                type="incomplete_implementation",
                description="Function body contains only 'pass' placeholder."
            ))
            feedback.append("Implement the required algorithm logic inside the function.")
            deductions += 40

        # Check for off-by-one indicators in loops
        for idx, line in enumerate(lines, 1):
            if "range(len(" in line and "- 1" not in line and "enumerate" not in line:
                if "i + 1" in code or "j + 1" in code:
                    flaws.append(LogicFlaw(
                        line=idx,
                        type="potential_index_out_of_bounds",
                        description=f"Line {idx}: Accessing i+1 while looping over range(len(...)) may cause IndexError."
                    ))
                    feedback.append(f"Line {idx}: Adjust loop bounds to range(len(...) - 1) when checking next element.")
                    deductions += 15

        # Check for unhandled empty input/edge cases
        if not any(k in code.lower() for k in ["if not", "if len", "if (", "if(null", "== null", "empty()"]):
            flaws.append(LogicFlaw(
                line=1,
                type="missing_edge_case_check",
                description="No boundary or null/empty input checks detected at function entry."
            ))
            feedback.append("Add guard clauses at start of function to handle empty inputs gracefully.")
            deductions += 10

        # Nesting depth feedback
        depth = ast_info.get("max_nesting_depth", 0)
        if depth >= 3:
            style_issues.append(f"High nesting depth ({depth} levels). Consider refactoring or extracting helper functions.")
            feedback.append("Reduce loop nesting to improve readability and time complexity.")
            deductions += 10

        # Final quality score calculation
        quality_score = max(0.0, min(100.0, 100.0 - deductions))

        if not feedback:
            feedback.append("Code structure looks clean and well-structured.")

        return round(quality_score, 1), flaws, feedback, style_issues[:10]
