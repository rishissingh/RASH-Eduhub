"""
RASH EduHub — Code Execution Sandbox Runner
Executes Python, Java, and C++ code against test cases in an isolated process sandbox.
"""

import sys
import time
import subprocess
import tempfile
import os
import re
import ast
from typing import List, Dict, Any, Tuple


class CodeExecutor:
    """
    Executes student code against test inputs with timeout limits and output validation.
    """

    def run_tests(
        self, code: str, language: str, test_cases: List[Dict[str, Any]], timeout_sec: float = 3.0
    ) -> Tuple[float, List[Dict[str, Any]], float]:
        """
        Returns:
            Tuple[pass_rate, test_results, total_execution_time_ms]
        """
        if not test_cases:
            test_cases = [{"input": "", "expected": "", "isHidden": False}]

        lang = language.lower()
        passed_count = 0
        results = []
        start_time = time.time()

        for idx, tc in enumerate(test_cases):
            expected_raw = str(tc.get("expected", "")).strip()
            actual, err, exec_ms = self._execute_single(code, lang, tc.get("input", ""), timeout_sec)

            expected_value = self._normalize_value(expected_raw)
            actual_value = self._normalize_value(actual)

            passed = err is None and actual_value == expected_value
            if passed:
                passed_count += 1

            results.append({
                "test_case": idx + 1,
                "input": tc.get("input"),
                "expected": expected_raw,
                "output": actual.strip() if not tc.get("isHidden") else "[Hidden Test Case]",
                "passed": passed,
                "error": err,
                "execution_time_ms": round(exec_ms, 2),
                "isHidden": tc.get("isHidden", False)
            })

        pass_rate = round(passed_count / max(len(test_cases), 1), 2)
        total_time_ms = round((time.time() - start_time) * 1000, 2)

        return pass_rate, results, total_time_ms

    def _execute_single(self, code: str, language: str, input_data: str, timeout_sec: float) -> Tuple[str, str, float]:
        t0 = time.time()
        lang = language.lower()

        if lang in ["python", "py"]:
            return self._exec_python(code, input_data, timeout_sec, t0)
        if lang in ["java"]:
            return self._exec_java(code, input_data, timeout_sec, t0)
        if lang in ["cpp", "c++", "c"]:
            return self._exec_cpp(code, input_data, timeout_sec, t0)

        return "", f"Unsupported language: {language}", (time.time() - t0) * 1000

    def _exec_python(self, code: str, input_data: str, timeout_sec: float, t0: float) -> Tuple[str, str, float]:
        wrapper_code = self._build_python_wrapper(code)
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
            f.write(wrapper_code)
            temp_path = f.name

        try:
            proc = subprocess.run(
                [sys.executable, temp_path],
                input=str(input_data),
                capture_output=True,
                text=True,
                timeout=timeout_sec
            )
            exec_ms = (time.time() - t0) * 1000
            if proc.returncode == 0:
                return proc.stdout, None, exec_ms
            return proc.stdout, proc.stderr.strip(), exec_ms
        except subprocess.TimeoutExpired:
            return "", f"Time Limit Exceeded (> {timeout_sec}s)", timeout_sec * 1000
        except Exception as e:
            return "", str(e), (time.time() - t0) * 1000
        finally:
            try:
                os.remove(temp_path)
            except Exception:
                pass

    def _exec_java(self, code: str, input_data: str, timeout_sec: float, t0: float) -> Tuple[str, str, float]:
        class_name = self._extract_java_class_name(code) or "Solution"
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = os.path.join(tmpdir, f"{class_name}.java")
            with open(source_path, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                compile_proc = subprocess.run(
                    ["javac", source_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec
                )
            except FileNotFoundError:
                return "", "Java compiler 'javac' not available on PATH.", (time.time() - t0) * 1000
            except subprocess.TimeoutExpired:
                return "", f"Java compilation timed out (> {timeout_sec}s)", timeout_sec * 1000

            if compile_proc.returncode != 0:
                return "", compile_proc.stderr.strip() or compile_proc.stdout.strip(), (time.time() - t0) * 1000

            try:
                run_proc = subprocess.run(
                    ["java", "-cp", tmpdir, class_name],
                    input=str(input_data),
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec
                )
            except FileNotFoundError:
                return "", "Java runtime 'java' not available on PATH.", (time.time() - t0) * 1000
            except subprocess.TimeoutExpired:
                return "", f"Execution timed out (> {timeout_sec}s)", timeout_sec * 1000

            exec_ms = (time.time() - t0) * 1000
            if run_proc.returncode == 0:
                return run_proc.stdout, None, exec_ms
            return run_proc.stdout, run_proc.stderr.strip() or run_proc.stdout.strip(), exec_ms

    def _exec_cpp(self, code: str, input_data: str, timeout_sec: float, t0: float) -> Tuple[str, str, float]:
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = os.path.join(tmpdir, "code.cpp")
            binary_path = os.path.join(tmpdir, "code_exec")
            if os.name == "nt":
                binary_path += ".exe"

            with open(source_path, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                compile_proc = subprocess.run(
                    ["g++", source_path, "-std=c++17", "-O2", "-o", binary_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec
                )
            except FileNotFoundError:
                return "", "C++ compiler 'g++' not available on PATH.", (time.time() - t0) * 1000
            except subprocess.TimeoutExpired:
                return "", f"C++ compilation timed out (> {timeout_sec}s)", timeout_sec * 1000

            if compile_proc.returncode != 0:
                return "", compile_proc.stderr.strip() or compile_proc.stdout.strip(), (time.time() - t0) * 1000

            try:
                run_proc = subprocess.run(
                    [binary_path],
                    input=str(input_data),
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec
                )
            except subprocess.TimeoutExpired:
                return "", f"Execution timed out (> {timeout_sec}s)", timeout_sec * 1000

            exec_ms = (time.time() - t0) * 1000
            if run_proc.returncode == 0:
                return run_proc.stdout, None, exec_ms
            return run_proc.stdout, run_proc.stderr.strip() or run_proc.stdout.strip(), exec_ms

    def _build_python_wrapper(self, code: str) -> str:
        function_name = self._extract_python_function_name(code)
        if function_name is None:
            function_name = "main"

        return f"""
import sys
import json
import ast
import re

{code}

def __eduhub_parse_input(raw_input):
    if not raw_input or not str(raw_input).strip():
        return {{}}

    def parse_assignment(text):
        pattern = re.compile(r'([a-zA-Z_]\w*)\s*=\s*(.+?)(?=(?:,\s*[a-zA-Z_]\w*\s*=)|$)', re.S)
        result = {{}}
        for match in pattern.finditer(text):
            key = match.group(1)
            value_text = match.group(2).strip()
            try:
                result[key] = ast.literal_eval(value_text)
            except Exception:
                if value_text.lower() in ['true', 'false']:
                    result[key] = value_text.lower() == 'true'
                else:
                    result[key] = value_text.strip('"\'')
        return result

    return parse_assignment(raw_input)


def __eduhub_print_result(value):
    try:
        print(json.dumps(value, default=str, separators=(',', ':')))
    except Exception:
        print(str(value))


if __name__ == '__main__':
    raw_input_data = sys.stdin.read()
    kwargs = __eduhub_parse_input(raw_input_data)
    if '{function_name}' in globals() and callable(globals()['{function_name}']):
        result = globals()['{function_name}'](**kwargs)
        __eduhub_print_result(result)
    elif 'main' in globals() and callable(globals()['main']):
        result = globals()['main']()
        __eduhub_print_result(result)
""".strip()

    def _extract_python_function_name(self, code: str) -> str:
        match = re.search(r'^def\s+(\w+)\s*\(', code, re.MULTILINE)
        return match.group(1) if match else None

    def _extract_java_class_name(self, code: str) -> str:
        match = re.search(r'public\s+class\s+(\w+)', code)
        if match:
            return match.group(1)
        match = re.search(r'class\s+(\w+)', code)
        return match.group(1) if match else None

    def _normalize_value(self, value: str) -> "Any":
        if value is None:
            return None

        text = str(value).strip()
        if not text:
            return text

        lowered = text.lower()
        if lowered in ['true', 'false']:
            return lowered == 'true'

        try:
            return ast.literal_eval(text)
        except Exception:
            return text
