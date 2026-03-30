"""
Lingwa Spaced Repetition Service — SM-2 algorithm

Used by the backend to compute review schedules.
The frontend also has a JS implementation (progress.ts) for offline-first use.
This service is for server-side batch processing if needed.
"""

from datetime import date, timedelta
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class WordRecord:
    word: str
    language: str
    english: str
    seen: int = 0
    correct: int = 0
    wrong: int = 0
    interval_days: int = 1
    ease_factor: float = 2.5
    next_review: str = field(default_factory=lambda: str(date.today() + timedelta(days=1)))
    last_seen: str = field(default_factory=lambda: str(date.today()))


def sm2_update(record: WordRecord, quality: int) -> WordRecord:
    """
    Update a word record using the SM-2 spaced repetition algorithm.
    
    quality: 0-5
      0-2: Failed (reset interval)
      3:   Correct, hard to recall
      4:   Correct, moderate effort
      5:   Perfect recall
    
    Returns the updated WordRecord.
    """
    today = date.today()
    record.seen += 1
    record.last_seen = str(today)

    if quality < 3:
        # Wrong answer — reset interval
        record.wrong += 1
        record.interval_days = 1
        record.next_review = str(today + timedelta(days=1))
    else:
        # Correct — advance interval
        record.correct += 1

        if record.interval_days == 1:
            new_interval = 6
        else:
            new_interval = round(record.interval_days * record.ease_factor)

        # Update ease factor (stays above 1.3)
        new_ef = record.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        record.ease_factor = max(1.3, new_ef)
        record.interval_days = new_interval
        record.next_review = str(today + timedelta(days=new_interval))

    return record


def get_due_words(words: list[WordRecord]) -> list[WordRecord]:
    """Return words that are due for review today or earlier."""
    today = str(date.today())
    return [w for w in words if w.next_review <= today]


def get_new_words(words: list[WordRecord], seen_limit: int = 3) -> list[WordRecord]:
    """Return words that haven't been seen much yet (new words to learn)."""
    return [w for w in words if w.seen < seen_limit]


def calculate_retention(words: list[WordRecord]) -> float:
    """Calculate overall retention rate (correct / total seen)."""
    total_seen = sum(w.seen for w in words)
    total_correct = sum(w.correct for w in words)
    if total_seen == 0:
        return 0.0
    return total_correct / total_seen


def estimate_daily_reviews(words: list[WordRecord], days_ahead: int = 7) -> dict[str, int]:
    """
    Estimate how many words are due for review in the next N days.
    Returns a dict of {date_string: count}.
    """
    today = date.today()
    schedule: dict[str, int] = {}

    for i in range(days_ahead + 1):
        day = str(today + timedelta(days=i))
        schedule[day] = sum(1 for w in words if w.next_review <= day)

    return schedule
