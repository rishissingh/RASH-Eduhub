"""
RASH EduHub — Multi-Language AST Analyzer
Performs AST parsing and static analysis for Python, Java, and C++.
"""

import ast
import re
from typing import Dict, Any, List


class ASTAnalyzer:
    """
    Parses code into abstract syntax trees or structural representations
    and extracts metrics such as max nesting depth, loop counts, recursion,
    and control flow flags.
    """

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        lang = language.lower()
        if lang in ["python", "py"]:
            return self._analyze_python(code)
        elif lang in ["java"]:
            return self._analyze_java(code)
        elif lang in ["cpp", "c++", "c"]:
            return self._analyze_cpp(code)
        else:
            return self._analyze_generic(code)

    def _analyze_python(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return {
                "syntax_valid": False,
                "error": f"Syntax error at line {e.lineno}: {e.msg}",
                "max_nesting_depth": 0,
                "loop_count": 0,
                "has_recursion": False,
                "function_count": 0,
                "node_count": 0,
            }

        max_depth = 0
        loop_count = 0
        function_names = set()
        has_recursion = False

        class Visitor(ast.NodeVisitor):
            def __init__(self):
                self.current_depth = 0
                self.max_depth = 0
                self.loop_count = 0
                self.functions = set()
                self.current_func = None
                self.has_recursion = False

            def generic_visit(self, node):
                # Count loop nodes for nesting
                is_loop = isinstance(node, (ast.For, ast.While))
                if is_loop:
                    self.loop_count += 1
                    self.current_depth += 1
                    self.max_depth = max(self.max_depth, self.current_depth)

                super().generic_visit(node)

                if is_loop:
                    self.current_depth -= 1

            def visit_FunctionDef(self, node):
                self.functions.add(node.name)
                prev_func = self.current_func
                self.current_func = node.name
                self.generic_visit(node)
                self.current_func = prev_func

            def visit_Call(self, node):
                if isinstance(node.func, ast.Name):
                    if self.current_func and node.func.id == self.current_func:
                        self.has_recursion = True
                self.generic_visit(node)

        visitor = Visitor()
        visitor.visit(tree)

        return {
            "syntax_valid": True,
            "error": None,
            "max_nesting_depth": visitor.max_depth,
            "loop_count": visitor.loop_count,
            "has_recursion": visitor.has_recursion,
            "function_count": len(visitor.functions),
            "functions": list(visitor.functions),
            "line_count": len(code.splitlines()),
        }

    def _analyze_java(self, code: str) -> Dict[str, Any]:
        # Regex heuristic parser for Java AST structure
        lines = code.splitlines()
        loop_keywords = ["for", "while", "do"]
        max_depth = 0
        current_depth = 0
        loop_count = 0

        for line in lines:
            stripped = line.strip()
            if any(re.search(r'\b' + kw + r'\b', stripped) for kw in loop_keywords):
                loop_count += 1
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            if "}" in stripped:
                current_depth = max(0, current_depth - 1)

        has_recursion = bool(re.search(r'(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\b\1\s*\(', code))

        return {
            "syntax_valid": True,
            "error": None,
            "max_nesting_depth": max_depth,
            "loop_count": loop_count,
            "has_recursion": has_recursion,
            "function_count": len(re.findall(r'(public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*\{', code)),
            "line_count": len(lines),
        }

    def _analyze_cpp(self, code: str) -> Dict[str, Any]:
        lines = code.splitlines()
        loop_keywords = ["for", "while", "do"]
        max_depth = 0
        current_depth = 0
        loop_count = 0

        for line in lines:
            stripped = line.strip()
            if any(re.search(r'\b' + kw + r'\b', stripped) for kw in loop_keywords):
                loop_count += 1
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            if "}" in stripped:
                current_depth = max(0, current_depth - 1)

        has_recursion = bool(re.search(r'(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\b\1\s*\(', code))

        return {
            "syntax_valid": True,
            "error": None,
            "max_nesting_depth": max_depth,
            "loop_count": loop_count,
            "has_recursion": has_recursion,
            "function_count": len(re.findall(r'[\w:<>]+\s+(\w+)\s*\([^)]*\)\s*\{', code)),
            "line_count": len(lines),
        }

    def _analyze_generic(self, code: str) -> Dict[str, Any]:
        lines = code.splitlines()
        return {
            "syntax_valid": True,
            "error": None,
            "max_nesting_depth": 1,
            "loop_count": code.count("for") + code.count("while"),
            "has_recursion": False,
            "function_count": 1,
            "line_count": len(lines),
        }
