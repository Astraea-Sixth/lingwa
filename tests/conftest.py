"""
Lingwa Test Configuration
Shared fixtures for backend tests.
"""

import sys
import os
import pytest

# Add api/ to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))


@pytest.fixture
def sample_profile():
    """A standard user profile for testing."""
    return {
        "targetLang": "Thai",
        "targetLangCode": "th",
        "nativeLang": "English",
        "reason": "travel",
        "topics": ["food", "transport", "shopping"],
        "level": "A1",
        "gender": "male",
    }


@pytest.fixture
def sample_profile_female():
    """A female user profile for testing."""
    return {
        "targetLang": "Spanish",
        "targetLangCode": "es",
        "nativeLang": "English",
        "reason": "partner",
        "topics": ["romance", "social"],
        "level": "A2",
        "gender": "female",
    }


@pytest.fixture
def sample_profile_both():
    """A 'show both' gender profile for testing."""
    return {
        "targetLang": "French",
        "targetLangCode": "fr",
        "nativeLang": "English",
        "reason": "curious",
        "topics": ["food"],
        "level": "B1",
        "gender": "both",
    }


@pytest.fixture
def valid_unit_json():
    """A valid unit JSON structure."""
    return {
        "id": 1,
        "title": "Greetings & Basics",
        "description": "Learn essential Thai greetings",
        "lessons": [
            {
                "id": "1.1",
                "title": "Hello and Goodbye",
                "vocabulary": [
                    {
                        "word": "สวัสดี",
                        "romanization": "sawadee",
                        "meaning": "Hello",
                        "example": "สวัสดีครับ — sawadee khrap — Hello (male)",
                    }
                ],
                "exercises": [
                    {
                        "type": "target_to_native",
                        "word": "สวัสดี",
                        "romanization": "sawadee",
                        "options": ["Hello", "Goodbye", "Thank you", "Sorry"],
                        "correct": 0,
                        "explanation": "สวัสดี is the standard Thai greeting.",
                    }
                ],
            }
        ],
    }


@pytest.fixture
def valid_unit_json_str(valid_unit_json):
    """Valid unit JSON as a string."""
    import json
    return json.dumps(valid_unit_json)
