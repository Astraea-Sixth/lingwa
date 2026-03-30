"""
Tests for API endpoints
Covers: TC-BE-040 through TC-BE-069
"""

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────
# App setup with mocked LLM
# ─────────────────────────────────────────────

@pytest.fixture
def client():
    """Create a test client with mocked LLM service."""
    with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=True), \
         patch("services.llm._chat_ollama", new_callable=AsyncMock, return_value="Hello! สวัสดี"):
        from main import app
        return TestClient(app)


@pytest.fixture
def client_no_llm():
    """Create a test client with LLM unavailable."""
    with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=False):
        from main import app
        return TestClient(app)


# ─────────────────────────────────────────────
# TC-BE-042 to TC-BE-043: Health & Root
# ─────────────────────────────────────────────

class TestCoreEndpoints:
    def test_health(self, client):
        """TC-BE-042: GET /health returns status."""
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "llm" in data

    def test_root(self, client):
        """TC-BE-043: GET / returns API info."""
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Lingwa API"
        assert "version" in data


# ─────────────────────────────────────────────
# TC-BE-044 to TC-BE-048: Chat endpoints
# ─────────────────────────────────────────────

class TestChatEndpoint:
    def test_valid_chat(self, client):
        """TC-BE-044: POST /api/chat with valid request returns reply."""
        r = client.post("/api/chat", json={
            "lang": "th",
            "message": "สวัสดี",
            "history": [],
            "unit": 1,
            "lesson": 1,
        })
        assert r.status_code == 200
        assert "reply" in r.json()

    def test_empty_message(self, client):
        """TC-BE-045: POST /api/chat with empty message returns 400."""
        r = client.post("/api/chat", json={
            "lang": "th",
            "message": "",
            "history": [],
        })
        assert r.status_code == 400

    def test_voice_practice_mode(self, client):
        """TC-BE-046: POST /api/chat voice_practice mode."""
        r = client.post("/api/chat", json={
            "lang": "th",
            "message": "sawadee",
            "history": [],
            "mode": "voice_practice",
            "key_phrases": ["สวัสดี"],
        })
        assert r.status_code == 200
        assert "reply" in r.json()


# ─────────────────────────────────────────────
# TC-BE-049: Explain endpoint
# ─────────────────────────────────────────────

class TestExplainEndpoint:
    def test_explain(self, client):
        """TC-BE-049: POST /api/explain returns explanation."""
        r = client.post("/api/explain", json={
            "lang": "th",
            "level": "A1",
            "question": "Why does Thai use particles?",
        })
        assert r.status_code == 200
        assert "explanation" in r.json()


# ─────────────────────────────────────────────
# TC-BE-050 to TC-BE-051: Evaluate endpoint
# ─────────────────────────────────────────────

class TestEvaluateEndpoint:
    def test_evaluate_correct(self, client):
        """TC-BE-050: POST /api/evaluate with matching answer."""
        r = client.post("/api/evaluate", json={
            "type": "translate",
            "user_answer": "Hello",
            "expected": "Hello",
            "language": "th",
        })
        assert r.status_code == 200
        data = r.json()
        assert "correct" in data

    def test_evaluate_wrong(self, client):
        """TC-BE-051: POST /api/evaluate with wrong answer."""
        r = client.post("/api/evaluate", json={
            "type": "translate",
            "user_answer": "Goodbye",
            "expected": "Hello",
            "language": "th",
        })
        assert r.status_code == 200
        data = r.json()
        assert "correct" in data


# ─────────────────────────────────────────────
# TC-BE-052 to TC-BE-056: Language & Curriculum endpoints
# ─────────────────────────────────────────────

class TestLanguageEndpoints:
    def test_list_languages(self, client):
        """TC-BE-052: GET /api/languages returns list."""
        r = client.get("/api/languages")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # Should have at least th, es, fr
        codes = [c.get("code") for c in data]
        assert "th" in codes

    def test_get_thai_config(self, client):
        """TC-BE-053: GET /api/languages/th/config returns Thai config."""
        r = client.get("/api/languages/th/config")
        assert r.status_code == 200
        data = r.json()
        assert data["code"] == "th"
        assert data["name"] == "Thai"
        assert "tutor" in data
        assert "flag" in data

    def test_unknown_language_404(self, client):
        """TC-BE-054: GET /api/languages/xx/config returns 404."""
        r = client.get("/api/languages/xx/config")
        assert r.status_code == 404


class TestCurriculumEndpoints:
    def test_get_curriculum_th(self, client):
        """TC-BE-055: GET /api/curriculum/th/A1 returns curriculum."""
        # This may return 404 if no curriculum.json exists (it's generated)
        # so we just check it doesn't crash
        r = client.get("/api/curriculum/th/A1")
        assert r.status_code in (200, 404)

    def test_curriculum_missing_lang(self, client):
        """TC-BE-056: GET /api/curriculum/xx/A1 returns 404."""
        r = client.get("/api/curriculum/xx/A1")
        assert r.status_code == 404


# ─────────────────────────────────────────────
# TC-BE-057 to TC-BE-058: TTS endpoints
# ─────────────────────────────────────────────

class TestTTSEndpoints:
    def test_tts_returns_501(self, client):
        """TC-BE-057: GET /api/tts returns 501 not implemented."""
        r = client.get("/api/tts?text=hello&language=th")
        assert r.status_code == 501
        assert r.json()["status"] == "not_implemented"

    def test_tts_voices(self, client):
        """TC-BE-058: GET /api/tts/voices returns voice list."""
        r = client.get("/api/tts/voices")
        assert r.status_code == 200
        data = r.json()
        assert "voices" in data
        assert isinstance(data["voices"], list)


# ─────────────────────────────────────────────
# TC-BE-059 to TC-BE-062: LLM Service
# ─────────────────────────────────────────────

class TestLLMService:
    @pytest.mark.asyncio
    async def test_chat_completion_calls_ollama(self):
        """TC-BE-059: chat_completion calls Ollama."""
        with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=True), \
             patch("services.llm._chat_ollama", new_callable=AsyncMock, return_value="Test reply") as mock_chat:
            from services.llm import chat_completion
            result = await chat_completion("system prompt", [{"role": "user", "content": "hello"}])
            assert result == "Test reply"
            mock_chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_chat_completion_ollama_down(self):
        """TC-BE-060: chat_completion raises RuntimeError when Ollama down."""
        with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=False):
            from services.llm import chat_completion
            with pytest.raises(RuntimeError, match="Ollama is not available"):
                await chat_completion("system", [{"role": "user", "content": "hi"}])

    @pytest.mark.asyncio
    async def test_llm_status_available(self):
        """TC-BE-061: get_llm_status with Ollama available."""
        with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=True):
            from services.llm import get_llm_status
            result = await get_llm_status()
            assert result["active"] == "ollama"

    @pytest.mark.asyncio
    async def test_llm_status_unavailable(self):
        """TC-BE-062: get_llm_status with Ollama unavailable."""
        with patch("services.llm._check_ollama_available", new_callable=AsyncMock, return_value=False):
            from services.llm import get_llm_status
            result = await get_llm_status()
            assert result["active"] == "none"


# ─────────────────────────────────────────────
# TC-BE-063 to TC-BE-069: Chat system prompts
# ─────────────────────────────────────────────

class TestSystemPrompts:
    def test_default_chat_prompt(self):
        """TC-BE-063: Default chat mode includes persona and level."""
        from routers.chat import build_system_prompt
        result = build_system_prompt(lang="th", level="A1", unit=1, lesson=1)
        assert "Nong" in result
        assert "A1" in result

    def test_voice_practice_prompt(self):
        """TC-BE-064: Voice practice includes key phrases."""
        from routers.chat import build_system_prompt
        result = build_system_prompt(
            lang="th", level="A1", unit=1, lesson=1,
            mode="voice_practice", key_phrases=["สวัสดี"]
        )
        assert "VOICE PRACTICE" in result
        assert "สวัสดี" in result

    def test_why_prompt(self):
        """TC-BE-065: Why mode includes explanation instructions."""
        from routers.chat import build_system_prompt
        result = build_system_prompt(lang="th", level="A1", unit=1, lesson=1, is_why=True)
        assert "explain" in result.lower()

    def test_gender_male_context(self):
        """TC-BE-066: Male gender context included."""
        from routers.chat import build_system_prompt
        result = build_system_prompt(lang="th", level="A1", unit=1, lesson=1, gender="male")
        assert "male" in result.lower()

    def test_gender_both_context(self):
        """TC-BE-067: Both gender context included."""
        from routers.chat import build_system_prompt
        result = build_system_prompt(lang="th", level="A1", unit=1, lesson=1, gender="both")
        assert "both" in result.lower()

    def test_thai_persona(self):
        """TC-BE-068: Thai returns Nong persona."""
        from routers.chat import _get_persona
        p = _get_persona("th")
        assert p["name"] == "Nong (น้อง)"

    def test_unknown_persona(self):
        """TC-BE-069: Unknown lang returns generic persona."""
        from routers.chat import _get_persona
        p = _get_persona("xx")
        assert p["name"] == "Your Tutor"
