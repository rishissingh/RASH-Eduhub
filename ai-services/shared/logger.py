"""
RASH EduHub — Structured Logging for AI Microservices
"""

import logging
import sys
from datetime import datetime, timezone


class ColorFormatter(logging.Formatter):
    """Custom formatter with colored output for terminal readability."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[41m",  # Red background
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record):
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        service = getattr(record, "service", "unknown")

        formatted = (
            f"{self.BOLD}[{timestamp}]{self.RESET} "
            f"{color}{record.levelname:<8}{self.RESET} "
            f"\033[35m{service:<20}{self.RESET} "
            f"{record.getMessage()}"
        )
        return formatted


def get_logger(service_name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Create a structured logger for a specific AI service.

    Args:
        service_name: Name of the microservice (e.g., 'adaptive-engine')
        level: Logging level (default: INFO)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(f"rash.{service_name}")
    logger.setLevel(level)

    # Avoid duplicate handlers on repeated calls
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(ColorFormatter())
        logger.addHandler(handler)

    # Attach service name to all records from this logger using a Filter
    # (not setLogRecordFactory, which is global and would be overwritten
    #  by the last service to call get_logger())
    class ServiceNameFilter(logging.Filter):
        def filter(self, record):
            record.service = service_name
            return True

    logger.addFilter(ServiceNameFilter())

    return logger
