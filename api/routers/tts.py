"""
Lingwa API — TTS endpoints

GET /api/tts — text-to-speech audio
Currently: returns 501 (not implemented server-side, use Web Speech API in browser)
Future: Kokoro ONNX integration
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/tts")
async def tts_endpoint(
    text: str = Query(..., description="Text to speak"),
    language: str = Query("th", description="Language code (th, es, fr)"),
    speed: float = Query(1.0, ge=0.5, le=2.0, description="Speech rate"),
):
    """
    Text-to-speech endpoint.
    
    Currently returns a note directing to browser Web Speech API.
    Future: Kokoro ONNX for high-quality local TTS.
    """
    # TODO: Integrate Kokoro ONNX
    # For now, the frontend uses Web Speech API directly
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "message": "Server-side TTS not yet implemented. Use Web Speech API in browser.",
            "note": "Kokoro ONNX integration planned for v1.1",
        }
    )


@router.get("/tts/voices")
async def list_voices(language: str = Query(None, description="Filter by language code")):
    """List available TTS voices."""
    # Planned voices for Kokoro ONNX
    voices = [
        {"id": "th_female_1", "name": "Nong", "language": "th", "gender": "female", "available": False},
        {"id": "es_male_1", "name": "Marco", "language": "es", "gender": "male", "available": False},
        {"id": "fr_female_1", "name": "Camille", "language": "fr", "gender": "female", "available": False},
    ]

    if language:
        voices = [v for v in voices if v["language"] == language]

    return {
        "voices": voices,
        "note": "Kokoro ONNX integration planned for v1.1. Currently using browser Web Speech API.",
    }
