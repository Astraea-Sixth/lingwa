"""
Lingwa API — Speech-to-Text via faster-whisper

POST /api/stt — transcribe audio to text
POST /api/evaluate-speech — transcribe + evaluate pronunciation (text + tone)
"""

import os
import tempfile
import logging
import math
from difflib import SequenceMatcher
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from services.i18n import t, get_lang_name

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Whisper Model (lazy-loaded singleton) ───

MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
_model = None


def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading Whisper model '{MODEL_SIZE}' (first request — may take a moment)...")
        from faster_whisper import WhisperModel
        _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
        logger.info("Whisper model loaded.")
    return _model


# ─── STT Response ───

class STTResponse(BaseModel):
    transcript: str
    confidence: float  # 0.0 - 1.0
    language: str


@router.post("/stt", response_model=STTResponse)
async def transcribe(
    audio: UploadFile = File(...),
    lang: str = Form(default="th"),
):
    """
    Transcribe audio file to text using Whisper.
    Accepts WebM/WAV from browser microphone.
    """
    model = get_model()

    # Save uploaded audio to temp file
    suffix = ".webm" if "webm" in (audio.content_type or "") else ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Transcribe — force language for accuracy on short phrases
        segments, info = model.transcribe(
            tmp_path,
            language=lang,
            beam_size=5,
            word_timestamps=False,
        )

        # Collect segments and compute confidence
        segment_list = list(segments)
        transcript = " ".join(seg.text.strip() for seg in segment_list)

        # Confidence from average log probability
        if segment_list:
            avg_logprob = sum(seg.avg_logprob for seg in segment_list) / len(segment_list)
            confidence = min(1.0, max(0.0, math.exp(avg_logprob)))
        else:
            confidence = 0.0

        return STTResponse(
            transcript=transcript.strip(),
            confidence=round(confidence, 3),
            language=info.language or lang,
        )
    finally:
        os.unlink(tmp_path)


# ─── Speech Evaluation (text + tone scoring) ───

class SpeechEvalRequest(BaseModel):
    transcript: str          # what Whisper heard
    expected: str            # what the user should have said
    confidence: float = 0.8  # Whisper confidence score
    gender: str = "male"
    level: str = "A1"
    lang: str = "th"
    tone_class: Optional[str] = None  # expected tone from vocab data (e.g. "rising", "3-3")
    native_lang: str = "en"  # student's native language for feedback


class SpeechEvalResponse(BaseModel):
    stars: int               # 1-3
    feedback: str            # teaching feedback from Nong
    correct_form: str        # what they should say
    try_again: bool
    tone_analysis: Optional[dict] = None


@router.post("/evaluate-speech", response_model=SpeechEvalResponse)
async def evaluate_speech(req: SpeechEvalRequest):
    """
    Evaluate user's spoken phrase against expected.

    Scoring:
      3 stars = right words + right tones
      2 stars = right words + wrong/unclear tones
      1 star  = wrong words
    """
    transcript = req.transcript.strip()
    expected = req.expected.strip()

    nl = req.native_lang

    # ─── Step 1: Text comparison ───
    if not transcript:
        return SpeechEvalResponse(
            stars=1,
            feedback=t("cant_hear", nl),
            correct_form=expected,
            try_again=True,
        )

    # Low Whisper confidence = unclear pronunciation
    if req.confidence < 0.25:
        return SpeechEvalResponse(
            stars=1,
            feedback=t("hard_to_catch", nl),
            correct_form=expected,
            try_again=True,
        )

    # Normalize for comparison (strip spaces, Thai zero-width chars, punctuation)
    norm_transcript = _normalize(transcript)
    norm_expected = _normalize(expected)

    # Fuzzy match — Whisper transcribes slightly differently each time
    similarity = _similarity(norm_transcript, norm_expected)
    text_match = similarity >= 0.75
    partial_match = similarity >= 0.5 or norm_expected in norm_transcript or norm_transcript in norm_expected

    # Missing gender particle check
    particle_missing = False
    if not text_match and partial_match:
        for particle in ["ครับ", "ค่ะ", "คะ"]:
            if particle in norm_expected and particle not in norm_transcript:
                particle_missing = True
                break

    if not text_match and not partial_match:
        # Wrong words entirely → 1 star, ask LLM for helpful feedback
        feedback = await _get_llm_feedback(transcript, expected, req.gender, req.level, req.lang, "wrong_words", native_lang=nl)
        return SpeechEvalResponse(
            stars=1,
            feedback=feedback,
            correct_form=expected,
            try_again=True,
        )

    if particle_missing:
        particle = "ครับ" if req.gender == "male" else "ค่ะ"
        return SpeechEvalResponse(
            stars=2,
            feedback=t("particle_missing", nl, particle=particle, word=expected),
            correct_form=expected,
            try_again=True,
        )

    # Words are correct (exact or close match) → 2 or 3 stars depending on tone
    # If no tone data, give 3 stars for correct text
    perfect = t("perfect", nl)
    if not req.tone_class or req.lang not in ("th", "zh"):
        return SpeechEvalResponse(
            stars=3,
            feedback=perfect,
            correct_form=expected,
            try_again=False,
        )

    # ─── Step 2: Tone not yet analysed from audio (text-only endpoint) ───
    # Return 3 stars for now — full tone analysis happens in /api/evaluate-speech-audio
    return SpeechEvalResponse(
        stars=3,
        feedback=perfect,
        correct_form=expected,
        try_again=False,
    )


@router.post("/evaluate-speech-audio")
async def evaluate_speech_with_audio(
    audio: UploadFile = File(...),
    expected: str = Form(...),
    lang: str = Form(default="th"),
    gender: str = Form(default="male"),
    level: str = Form(default="A1"),
    tone_class: str = Form(default=""),
    native_lang: str = Form(default="en"),
):
    """
    Full speech evaluation: Whisper STT + tone analysis from audio.
    Single endpoint that does everything.
    """
    model = get_model()

    # Save audio — detect format from content_type or filename
    ct = audio.content_type or ""
    fn = audio.filename or ""
    if "webm" in ct or "webm" in fn:
        suffix = ".webm"
    elif "mp4" in ct or "mp4" in fn or "m4a" in ct or "m4a" in fn:
        suffix = ".mp4"
    elif "ogg" in ct or "ogg" in fn:
        suffix = ".ogg"
    elif "wav" in ct or "wav" in fn:
        suffix = ".wav"
    else:
        suffix = ".webm"  # default fallback
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        audio_content = await audio.read()
        tmp.write(audio_content)
        tmp_path = tmp.name

    try:
        # ─── Layer 1: Whisper STT ───
        segments, info = model.transcribe(tmp_path, language=lang, beam_size=5)
        segment_list = list(segments)
        transcript = " ".join(seg.text.strip() for seg in segment_list).strip()

        if segment_list:
            avg_logprob = sum(seg.avg_logprob for seg in segment_list) / len(segment_list)
            confidence = min(1.0, max(0.0, math.exp(avg_logprob)))
        else:
            confidence = 0.0

        if not transcript or confidence < 0.25:
            return {
                "stars": 1,
                "transcript": transcript,
                "feedback": t("cant_hear", native_lang),
                "correct_form": expected,
                "try_again": True,
                "tone_analysis": None,
            }

        # ─── Text comparison (fuzzy) ───
        norm_transcript = _normalize(transcript)
        norm_expected = _normalize(expected)

        similarity = _similarity(norm_transcript, norm_expected)
        text_match = similarity >= 0.75
        partial_match = similarity >= 0.5 or norm_expected in norm_transcript or norm_transcript in norm_expected



        if not text_match and not partial_match:
            feedback = await _get_llm_feedback(transcript, expected, gender, level, lang, "wrong_words", native_lang=native_lang)
            return {
                "stars": 1,
                "transcript": transcript,
                "feedback": feedback,
                "correct_form": expected,
                "try_again": True,
                "tone_analysis": None,
            }

        # Check missing particle
        for particle in ["ครับ", "ค่ะ", "คะ"]:
            if particle in norm_expected and particle not in norm_transcript:
                p = "ครับ" if gender == "male" else "ค่ะ"
                return {
                    "stars": 2,
                    "transcript": transcript,
                    "feedback": t("particle_missing", native_lang, particle=p, word=expected),
                    "correct_form": expected,
                    "try_again": True,
                    "tone_analysis": None,
                }

        # ─── Layer 2: Tone Analysis ───
        tone_result = None
        if tone_class and lang in ("th", "zh"):
            try:
                from services.tone_analyzer import analyze_tone
                tone_result = analyze_tone(audio_content, lang, tone_class)
            except Exception as e:
                logger.warning(f"Tone analysis error: {e}")

        # ─── Scoring ───
        if tone_result and not tone_result.get("tone_correct", True) and tone_result.get("confidence", 0) > 0.4:
            # Words correct, tone wrong
            tone_feedback = tone_result.get("feedback", "")
            feedback = await _get_llm_feedback(
                transcript, expected, gender, level, lang, "wrong_tone",
                tone_info=tone_feedback, native_lang=native_lang,
            )
            return {
                "stars": 2,
                "transcript": transcript,
                "feedback": feedback,
                "correct_form": expected,
                "try_again": True,
                "tone_analysis": tone_result,
            }

        # Everything correct!
        perfect = t("perfect", native_lang)
        return {
            "stars": 3,
            "transcript": transcript,
            "feedback": perfect,
            "correct_form": expected,
            "try_again": False,
            "tone_analysis": tone_result,
        }

    finally:
        os.unlink(tmp_path)


# ─── Helpers ───

def _normalize(text: str) -> str:
    """Normalize text for comparison — strip whitespace, zero-width chars, punctuation."""
    import unicodedata
    text = unicodedata.normalize("NFC", text)
    # Remove zero-width chars common in Thai
    text = text.replace("\u200b", "").replace("\u200c", "").replace("\u200d", "")
    # Remove common punctuation that Whisper may add
    for ch in ".,!?;:\"'()[]{}":
        text = text.replace(ch, "")
    return text.strip().replace(" ", "").lower()


def _similarity(a: str, b: str) -> float:
    """Fuzzy string similarity ratio (0.0 - 1.0)."""
    return SequenceMatcher(None, a, b).ratio()



async def _get_llm_feedback(
    transcript: str,
    expected: str,
    gender: str,
    level: str,
    lang: str,
    error_type: str,
    tone_info: str = "",
    native_lang: str = "en",
) -> str:
    """Get teaching feedback from Ollama in the student's native language."""
    try:
        from services.llm import chat_completion

        lang_name = get_lang_name(lang)
        native_name = get_lang_name(native_lang)

        native_rule = (
            f"CRITICAL: Respond ENTIRELY in {native_name} (the student's native language). "
            f"Only use {lang_name} script when showing the correct target phrase to repeat. "
        )

        if error_type == "wrong_words":
            system = (
                f"You are a {lang_name} language tutor giving feedback on pronunciation practice. "
                f"Student level: {level}. Gender: {gender}. "
                f"The student tried to say: '{expected}' but actually said: '{transcript}'. "
                f"{native_rule}"
                f"Give ONE short encouraging sentence (under 25 words) that: "
                f"1) Acknowledges what they said, "
                f"2) Shows the correct {lang_name} form, "
                f"3) Asks them to try again. "
                f"Be warm, not judgmental."
            )
        elif error_type == "wrong_tone":
            system = (
                f"You are a {lang_name} language tutor giving tone feedback. "
                f"Student level: {level}. Gender: {gender}. "
                f"The student said the right word '{expected}' but with the wrong tone. "
                f"Tone analysis: {tone_info}. "
                f"{native_rule}"
                f"Give ONE short encouraging sentence (under 30 words) that: "
                f"1) Praises them for the right word, "
                f"2) Explains the correct tone with a simple tip, "
                f"3) Asks them to try again. "
                f"Use arrows (↗️ ↘️ →) to show pitch direction. Be warm and specific."
            )
        else:
            system = (
                f"Give brief encouraging feedback for a {lang_name} learner. "
                f"{native_rule}Under 20 words."
            )

        result = await chat_completion(
            system=system,
            messages=[{"role": "user", "content": f"Student said: '{transcript}', expected: '{expected}'"}],
            max_tokens=80,
        )
        return result.strip()

    except Exception as e:
        logger.warning(f"LLM feedback failed: {e}")
        # Fallback — no LLM available
        if error_type == "wrong_words":
            return t("fallback_wrong_words", native_lang, word=expected)
        elif error_type == "wrong_tone":
            return t("fallback_wrong_tone", native_lang, info=tone_info)
        return t("fallback_try_again", native_lang, word=expected)
