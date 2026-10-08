"""
RASH EduHub — Dynamic Study Plan Generator
Generates personalized weekly study plans based on:
  - Current difficulty level
  - Topic skill scores (strengths and weaknesses)
  - Spaced repetition scheduling
  - Prerequisite graph for topic ordering
"""

from typing import Dict, List
from datetime import datetime, timezone, timedelta
import math


# ── Topic Prerequisite Graph ──
# Defines which topics must be learned before others.
TOPIC_PREREQUISITES = {
    "Variables & Data Types": [],
    "Control Flow": ["Variables & Data Types"],
    "Functions": ["Control Flow"],
    "Arrays & Lists": ["Variables & Data Types"],
    "Strings": ["Variables & Data Types"],
    "Recursion": ["Functions"],
    "OOP Basics": ["Functions"],
    "OOP Advanced": ["OOP Basics"],
    "Data Structures": ["Arrays & Lists", "OOP Basics"],
    "Algorithms - Sorting": ["Arrays & Lists", "Functions"],
    "Algorithms - Searching": ["Arrays & Lists"],
    "Algorithms - Graphs": ["Data Structures", "Recursion"],
    "Dynamic Programming": ["Recursion", "Arrays & Lists"],
    "System Design Basics": ["OOP Advanced", "Data Structures"],
    "Database Fundamentals": ["Variables & Data Types"],
    "Web Development Basics": ["Functions", "Strings"],
    "API Development": ["Web Development Basics", "Database Fundamentals"],
    "Testing & Debugging": ["Functions", "OOP Basics"],
    "Version Control": [],
    "Deployment & DevOps": ["API Development", "Testing & Debugging"],
}


class StudyPlanGenerator:
    """
    Generates adaptive weekly study plans tailored to the student's
    performance profile and current difficulty level.
    """

    # Time allocation per difficulty (minutes per day)
    DAILY_STUDY_MINUTES = {
        "Beginner": 60,
        "Intermediate": 90,
        "Advanced": 120,
    }

    # Activity type distribution by difficulty
    ACTIVITY_MIX = {
        "Beginner": {
            "learn_new": 0.40,      # Video/reading new content
            "practice": 0.30,       # Guided exercises
            "review": 0.20,         # Spaced repetition review
            "challenge": 0.10,      # Light challenge problems
        },
        "Intermediate": {
            "learn_new": 0.25,
            "practice": 0.35,
            "review": 0.15,
            "challenge": 0.25,
        },
        "Advanced": {
            "learn_new": 0.15,
            "practice": 0.25,
            "review": 0.10,
            "challenge": 0.50,
        },
    }

    def __init__(self):
        pass

    def generate_plan(
        self,
        user_id: str,
        difficulty: str,
        skill_scores: Dict[str, float],
        topics_mastered: List[str],
        topics_struggling: List[str],
        days: int = 7,
    ) -> dict:
        """
        Generate a personalized study plan.

        Args:
            user_id: Student ID.
            difficulty: Current difficulty level.
            skill_scores: Topic → score mapping.
            topics_mastered: List of mastered topics.
            topics_struggling: List of struggling topics.
            days: Number of days to plan (default: 7).

        Returns:
            dict containing the full study plan with daily schedules.
        """
        daily_minutes = self.DAILY_STUDY_MINUTES.get(difficulty, 60)
        activity_mix = self.ACTIVITY_MIX.get(difficulty, self.ACTIVITY_MIX["Beginner"])

        # ── Step 1: Determine priority topics ──
        priority_topics = self._prioritize_topics(skill_scores, topics_mastered, topics_struggling)

        # ── Step 2: Identify review topics (spaced repetition) ──
        review_topics = self._select_review_topics(skill_scores, topics_mastered, difficulty)

        # ── Step 3: Identify new topics to learn ──
        new_topics = self._select_new_topics(skill_scores, topics_mastered)

        # ── Step 4: Generate daily schedules ──
        daily_plans = []
        now = datetime.now(timezone.utc)

        for day_offset in range(days):
            day_date = now + timedelta(days=day_offset)
            day_name = day_date.strftime("%A")

            daily_plan = self._generate_daily_plan(
                day_number=day_offset + 1,
                day_name=day_name,
                date=day_date.strftime("%Y-%m-%d"),
                daily_minutes=daily_minutes,
                activity_mix=activity_mix,
                priority_topics=priority_topics,
                review_topics=review_topics,
                new_topics=new_topics,
                difficulty=difficulty,
            )
            daily_plans.append(daily_plan)

        return {
            "user_id": user_id,
            "difficulty": difficulty,
            "generated_at": now.isoformat(),
            "plan_duration_days": days,
            "daily_study_minutes": daily_minutes,
            "focus_areas": {
                "priority_improvement": priority_topics[:3],
                "review_reinforcement": review_topics[:3],
                "new_exploration": new_topics[:2],
            },
            "weekly_goals": self._generate_weekly_goals(
                difficulty, priority_topics, new_topics,
            ),
            "daily_plans": daily_plans,
        }

    def _prioritize_topics(
        self, skill_scores: Dict[str, float],
        mastered: List[str], struggling: List[str],
    ) -> List[str]:
        """
        Order topics by priority: struggling topics first, then by
        prerequisite depth (foundational topics before advanced ones).
        """
        # Score topics by urgency
        scored_topics = []
        for topic, score in skill_scores.items():
            if topic in mastered:
                continue
            # Priority = inverse of score (lower score = higher priority)
            prereq_depth = self._get_prereq_depth(topic)
            urgency = (1.0 - score) * 0.7 + (1.0 / (1.0 + prereq_depth)) * 0.3
            scored_topics.append((topic, urgency))

        # Add struggling topics that might not be in skill_scores yet
        for topic in struggling:
            if topic not in [t for t, _ in scored_topics]:
                scored_topics.append((topic, 0.9))

        scored_topics.sort(key=lambda x: x[1], reverse=True)
        return [t for t, _ in scored_topics]

    def _select_review_topics(
        self, skill_scores: Dict[str, float],
        mastered: List[str], difficulty: str,
    ) -> List[str]:
        """Select topics for spaced repetition review."""
        review = []
        for topic in mastered:
            score = skill_scores.get(topic, 1.0)
            # Even mastered topics decay over time; review if score is drifting
            if score < 0.90:
                review.append(topic)
        return review[:5]

    def _select_new_topics(
        self, skill_scores: Dict[str, float], mastered: List[str],
    ) -> List[str]:
        """Select new topics whose prerequisites are satisfied."""
        new_topics = []
        for topic, prereqs in TOPIC_PREREQUISITES.items():
            if topic in skill_scores:
                continue  # Already started
            # Check if all prerequisites are mastered
            if all(p in mastered or skill_scores.get(p, 0) >= 0.60 for p in prereqs):
                new_topics.append(topic)
        return new_topics[:3]

    def _generate_daily_plan(
        self, day_number, day_name, date, daily_minutes,
        activity_mix, priority_topics, review_topics,
        new_topics, difficulty,
    ) -> dict:
        """Generate a single day's study plan."""
        activities = []

        # Rotate topics across days to maintain variety
        topic_index = (day_number - 1) % max(len(priority_topics), 1)

        # ── Learning new content ──
        learn_minutes = int(daily_minutes * activity_mix["learn_new"])
        if new_topics:
            new_topic = new_topics[(day_number - 1) % len(new_topics)]
            activities.append({
                "type": "learn",
                "topic": new_topic,
                "duration_minutes": learn_minutes,
                "icon": "📖",
                "description": f"Learn: {new_topic}",
                "resources": ["Video tutorial", "Interactive notes"],
            })

        # ── Practice exercises ──
        practice_minutes = int(daily_minutes * activity_mix["practice"])
        if priority_topics:
            practice_topic = priority_topics[topic_index % len(priority_topics)]
            activities.append({
                "type": "practice",
                "topic": practice_topic,
                "duration_minutes": practice_minutes,
                "icon": "💪",
                "description": f"Practice: {practice_topic}",
                "resources": ["Guided exercises", "Code problems"],
            })

        # ── Review (spaced repetition) ──
        review_minutes = int(daily_minutes * activity_mix["review"])
        if review_topics and day_number % 2 == 0:  # Review every other day
            review_topic = review_topics[(day_number - 1) % len(review_topics)]
            activities.append({
                "type": "review",
                "topic": review_topic,
                "duration_minutes": review_minutes,
                "icon": "🔄",
                "description": f"Review: {review_topic}",
                "resources": ["Flashcards", "Quick quiz"],
            })

        # ── Challenge problems ──
        challenge_minutes = int(daily_minutes * activity_mix["challenge"])
        if priority_topics:
            challenge_topic = priority_topics[
                (topic_index + 1) % len(priority_topics)
            ] if len(priority_topics) > 1 else priority_topics[0]
            activities.append({
                "type": "challenge",
                "topic": challenge_topic,
                "duration_minutes": challenge_minutes,
                "icon": "🏆",
                "description": f"Challenge: {challenge_topic}",
                "resources": [f"{difficulty}-level code challenge"],
            })

        return {
            "day_number": day_number,
            "day_name": day_name,
            "date": date,
            "total_minutes": daily_minutes,
            "activities": activities,
        }

    def _generate_weekly_goals(
        self, difficulty: str, priority_topics: List[str], new_topics: List[str],
    ) -> List[str]:
        """Generate motivational weekly goals."""
        goals = []

        if priority_topics:
            goals.append(f"Improve your score in '{priority_topics[0]}' by at least 15%")
        if len(priority_topics) > 1:
            goals.append(f"Complete 5 practice problems in '{priority_topics[1]}'")
        if new_topics:
            goals.append(f"Start learning '{new_topics[0]}' — watch the intro tutorial")

        goals.append("Maintain a daily study streak of 7 days")

        if difficulty == "Advanced":
            goals.append("Solve at least 2 optimization/system design challenges")
        elif difficulty == "Intermediate":
            goals.append("Submit 3 code challenges with >80% test pass rate")
        else:
            goals.append("Complete all guided examples for your focus topics")

        return goals

    def _get_prereq_depth(self, topic: str, visited=None) -> int:
        """Get the depth of the prerequisite chain for a topic."""
        if visited is None:
            visited = set()
        if topic in visited:
            return 0
        visited.add(topic)

        prereqs = TOPIC_PREREQUISITES.get(topic, [])
        if not prereqs:
            return 0
        return 1 + max(self._get_prereq_depth(p, visited) for p in prereqs)
