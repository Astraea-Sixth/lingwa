"""
Lingwa LLM Service — Ollama (local) integration

Runs 100% locally with Ollama. No cloud APIs, no API keys, full privacy.
"""

import os
import httpx

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral:7b")
REQUEST_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "30"))


# ─────────────────────────────────────────────
# Ollama (local)
# ─────────────────────────────────────────────

async def _chat_ollama(
    system: str,
    messages: list[dict],
    max_tokens: int = 300,
) -> str:
    """Send a chat request to Ollama (local LLM server)."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": False,
        "options": {
            "num_predict": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9,
        },
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"].strip()


async def _check_ollama_available() -> bool:
    """Check if Ollama is running and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code != 200:
                return False
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            model_base = OLLAMA_MODEL.split(":")[0]
            return any(m.startswith(model_base) for m in models)
    except Exception:
        return False


# ─────────────────────────────────────────────
# Public interface
# ─────────────────────────────────────────────

async def chat_completion(
    system: str,
    messages: list[dict],
    max_tokens: int = 300,
) -> str:
    """
    Get a chat completion from Ollama (local LLM).
    Raises RuntimeError if Ollama is not available.
    """
    ollama_available = await _check_ollama_available()
    if not ollama_available:
        raise RuntimeError(
            "Ollama is not available. Start it with 'ollama serve' "
            f"and pull a model with 'ollama pull {OLLAMA_MODEL}'."
        )

    return await _chat_ollama(system, messages, max_tokens)


async def get_llm_status() -> dict:
    """Return current LLM availability status."""
    ollama_ok = await _check_ollama_available()

    return {
        "ollama": {
            "available": ollama_ok,
            "url": OLLAMA_BASE_URL,
            "model": OLLAMA_MODEL,
        },
        "active": "ollama" if ollama_ok else "none",
    }
