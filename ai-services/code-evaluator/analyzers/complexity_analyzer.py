"""
RASH EduHub — Time & Space Complexity Analyzer
Estimates Big-O time and space complexity based on AST structural features
and algorithmic code patterns.
"""

from typing import Dict, Any, Tuple


class ComplexityAnalyzer:
    """
    Analyzes code structure to infer Big-O complexity.
    Recognizes patterns such as single loops, nested loops, binary search,
    sorting, dynamic programming, space allocations, and recursion.
    """

    def analyze(self, code: str, ast_info: Dict[str, Any]) -> Tuple[str, str]:
        """
        Returns:
            Tuple[time_complexity, space_complexity]
        """
        time_comp = self._estimate_time_complexity(code, ast_info)
        space_comp = self._estimate_space_complexity(code, ast_info)
        return time_comp, space_comp

    def _estimate_time_complexity(self, code: str, ast_info: Dict[str, Any]) -> str:
        depth = ast_info.get("max_nesting_depth", 0)
        has_recursion = ast_info.get("has_recursion", False)

        # Pattern matching for common algorithmic patterns
        code_lower = code.lower()

        # Check for binary search / halving loops (e.g. // 2, >>= 1, high = mid - 1)
        if ("binary" in code_lower or "mid" in code_lower) and ("high" in code_lower or "right" in code_lower):
            if depth == 1:
                return "O(log n)"
            elif depth == 2:
                return "O(n log n)"

        # Check for built-in or explicit sorting (.sort(), sorted(), Arrays.sort, std::sort)
        if any(s in code_lower for s in [".sort(", "sorted(", "arrays.sort", "std::sort"]):
            return "O(n log n)"

        # Nested loops check
        if depth >= 3:
            return "O(n³)"
        elif depth == 2:
            return "O(n²)"
        elif depth == 1:
            return "O(n)"

        # Recursion check
        if has_recursion:
            if "2 *" in code or "* 2" in code or "+ self." in code or "+ solve(" in code:
                return "O(2ⁿ)"
            return "O(n)"

        return "O(1)"

    def _estimate_space_complexity(self, code: str, ast_info: Dict[str, Any]) -> str:
        code_lower = code.lower()
        has_recursion = ast_info.get("has_recursion", False)

        # Check matrix / 2D array allocation
        if "[0] * n" in code or "new int[n][n]" in code or "vector<vector" in code_lower:
            return "O(n²)"

        # Check 1D array / list / hash map allocation
        data_struct_patterns = [
            "[]", "dict()", "set()", "list()", "defaultdict",
            "new int[", "new arraylist", "new hashmap",
            "vector<", "unordered_map", "unordered_set", "std::map"
        ]

        has_allocation = any(p in code_lower for p in data_struct_patterns)

        if has_allocation:
            return "O(n)"

        if has_recursion:
            return "O(n)"  # Recursion call stack

        return "O(1)"
