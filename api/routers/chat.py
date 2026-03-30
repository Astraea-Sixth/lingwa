"""
Lingwa API — AI Chat endpoints

POST /api/chat — main conversation endpoint
POST /api/explain — "Why?" explanations
POST /api/evaluate — answer evaluation
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llm import chat_completion
from services.i18n import get_lang_name

router = APIRouter()

LANG_DIR = Path(__file__).parent.parent.parent / "languages"


# ─────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    lang: str
    message: str
    history: list[ChatMessage] = []
    unit: int = 1
    lesson: int = 1
    mode: str = "chat"  # 'chat' | 'voice_practice'
    key_phrases: list[str] = []
    success_count: int = 0
    level: str = "A1"
    gender: str = "male"  # 'male' | 'female' | 'both'
    chat_mode: str = "free"  # 'free' | 'unit_1'..'unit_5' | 'final'
    native_lang: str = "en"  # user's native language code


class ChatResponse(BaseModel):
    reply: str
    correction: Optional[str] = None


class ExplainRequest(BaseModel):
    lang: str
    level: str = "A1"
    question: str
    context: Optional[str] = None


class EvaluateRequest(BaseModel):
    type: str  # 'translate' | 'reverse_translate'
    user_answer: str
    expected: str
    language: str


# ─────────────────────────────────────────────
# Tutor personas
# ─────────────────────────────────────────────

TUTOR_PERSONAS = {
    "th": {
        "name": "Nong (น้อง)",
        "personality": (
            "You are Nong (น้อง), a warm and patient Thai language tutor. "
            "Your name means 'younger sibling' in Thai — you are affectionate and encouraging. "
            "You use emojis naturally (not excessively). "
            "You gently correct mistakes by weaving the correction into your reply — "
            "never lecturing or breaking the flow. "
            "Occasionally you share a Thai proverb or cultural insight when relevant. "
            "Keep your messages short and conversational. "
            "Use Thai script when speaking Thai, always with romanization for beginners."
        ),
    },
    "es": {
        "name": "Marco",
        "personality": (
            "You are Marco, an enthusiastic Spanish language tutor from Mexico. "
            "You love the language and celebrate small wins loudly. "
            "You use humor naturally and share cultural context (food, festivals, expressions). "
            "You correct mistakes with encouragement — 'Almost! The right form is...' "
            "You keep messages short and energetic. "
            "Mix in common Spanish expressions naturally."
        ),
    },
    "fr": {
        "name": "Camille",
        "personality": (
            "You are Camille, a precise but warm French language tutor from Paris. "
            "You care deeply about pronunciation and beautiful expression. "
            "You gently correct with a Parisian flair — 'Ah, presque! On dit plutôt...' "
            "You appreciate wordplay and the musicality of French. "
            "You explain grammar rules only when asked — otherwise keep it conversational. "
            "Keep messages concise and elegant."
        ),
    },
}

def _get_persona(lang: str) -> dict:
    """Get tutor persona for a language — falls back to a generic persona for unconfigured languages."""
    if lang in TUTOR_PERSONAS:
        return TUTOR_PERSONAS[lang]
    # Generic persona for any language not explicitly configured
    lang_names = {
        "ja": "Japanese", "ko": "Korean", "zh": "Chinese", "de": "German",
        "pt": "Portuguese", "it": "Italian", "ar": "Arabic", "ru": "Russian",
        "hi": "Hindi", "nl": "Dutch", "sv": "Swedish", "pl": "Polish",
        "tr": "Turkish", "vi": "Vietnamese", "id": "Indonesian", "ms": "Malay",
    }
    lang_name = lang_names.get(lang, lang.upper())
    return {
        "name": "Your Tutor",
        "personality": (
            f"You are a warm, patient, and encouraging {lang_name} language tutor. "
            f"You gently correct mistakes by weaving corrections into your reply — "
            f"never lecturing or breaking the flow. You use emojis naturally. "
            f"Keep your messages short and conversational. "
            f"Use {lang_name} script when teaching, with romanization/pronunciation guides for beginners."
        ),
    }

_get_lang_name = get_lang_name

LEVEL_INSTRUCTIONS = {
    "A1": "The student is a complete beginner. Use very simple vocabulary and short sentences. "
          "Translate key words. Speak mostly in the student's native language but introduce target language phrases.",
    "A2": "The student knows basic phrases. Use simple sentences mostly in the target language. "
          "Add explanations in the student's native language for new concepts.",
    "B1": "The student can hold basic conversations. Conduct the conversation mostly in the target language. "
          "Only use the student's native language for corrections and complex explanations.",
    "B2": "The student is upper intermediate. Conduct the full conversation in the target language. "
          "Only switch to the student's native language if explicitly asked.",
}


def load_lang_config(lang: str) -> dict:
    config_path = LANG_DIR / lang / "config.json"
    if config_path.exists():
        return json.loads(config_path.read_text(encoding="utf-8"))
    return {}


def build_system_prompt(
    lang: str,
    level: str,
    unit: int,
    lesson: int,
    is_why: bool = False,
    mode: str = "chat",
    key_phrases: list[str] | None = None,
    gender: str = "male",
    chat_mode: str = "free",
    native_lang: str = "en",
) -> str:
    persona = _get_persona(lang)
    level_inst = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["A1"])
    lang_name = _get_lang_name(lang)
    native_name = _get_lang_name(native_lang) if native_lang != "en" else "English"

    if is_why:
        return (
            f"{persona['personality']}\n\n"
            f"The student is asking you to explain something about {lang_name}. "
            f"Their level is {level}. "
            f"Give a clear, concise explanation in {native_name} (the student's native language). "
            f"Use examples in {lang_name} with romanization and translation. "
            f"Keep it friendly and educational. Don't overwhelm with rules — one concept at a time."
        )

    if mode == "voice_practice":
        phrases_str = ", ".join(key_phrases) if key_phrases else "the lesson vocabulary"
        return (
            f"{persona['personality']}\n\n"
            f"You are doing VOICE PRACTICE with the student. They just learned: {phrases_str}.\n\n"
            f"Your job:\n"
            f"1. Listen to what they say.\n"
            f"2. If they used any target phrase correctly → praise them specifically "
            f"(e.g. 'Great job! Your pronunciation was perfect!' or 'Excellent! That was spot on!')\n"
            f"3. If pronunciation or usage seems off → gently correct "
            f"(e.g. 'Almost! Try saying it like this: [correct form]')\n"
            f"4. After each exchange, encourage them to practice the NEXT phrase from: {phrases_str}.\n"
            f"5. After 3 successful uses → say exactly: "
            f"\"Excellent! You've got it! Lesson complete! 🎉\"\n"
            f"6. Keep ALL responses SHORT — 2-3 sentences max. This is voice, not text.\n"
            f"7. Be warm, encouraging, and conversational.\n"
            f"8. IMPORTANT: Give ALL feedback and corrections in {native_name} (the student's native language). "
            f"They are learning {lang_name} and don't understand {lang_name} explanations yet. "
            f"Only use {lang_name} when:\n"
            f"   - Modeling correct pronunciation (show them the phrase in {lang_name} to repeat)\n"
            f"   - Speaking the target phrase they need to practice\n"
            f"Example response in {native_name}: '[feedback in {native_name}]. Now try: [phrase in {lang_name}]'\n\n"
            f"Student level: {level}. Language: {lang_name}. Student's native language: {native_name}."
        )

    # Unit-specific chat mode
    if chat_mode.startswith("unit_"):
        try:
            unit_num = int(chat_mode.split("_")[1])
        except (IndexError, ValueError):
            unit_num = unit
        topic = f"Unit {unit_num} vocabulary"
        return (
            f"{persona['personality']}\n\n"
            f"You are having a FREE CONVERSATION with the student after they completed Unit {unit_num}.\n"
            f"Topic focus: {topic}\n\n"
            f"Rules:\n"
            f"1. Use ONLY vocabulary from Unit {unit_num} ({topic}). Do not introduce vocabulary from other units.\n"
            f"2. Have a natural, fun conversation — not a quiz. Ask questions, share context, be curious.\n"
            f"3. If the student uses vocabulary correctly → praise them briefly and continue the flow.\n"
            f"4. If the student makes a mistake → correct gently within your reply, then continue.\n"
            f"5. Keep responses SHORT — 2-3 sentences. This is a conversation, not a lecture.\n"
            f"6. Be warm, encouraging, and genuinely interested in what the student says.\n\n"
            f"Student level: {level}. Language: {lang_name}."
        )

    # Final challenge mode
    if chat_mode == "final":
        return (
            f"{persona['personality']}\n\n"
            f"This is the student's FINAL CHALLENGE. They have completed all curriculum units.\n\n"
            f"Rules:\n"
            f"1. Have a comprehensive conversation drawing from ALL curriculum units naturally.\n"
            f"2. NO hints. NO showing phrases. Just talk.\n"
            f"3. Test them naturally — weave all topic areas into the conversation organically.\n"
            f"4. Correct mistakes firmly but kindly — be thorough, this is a final test.\n"
            f"5. Be encouraging but do not let errors slide without correction.\n"
            f"6. At the end (after ~10 exchanges), give them an honest performance summary.\n"
            f"7. Keep responses concise and conversational.\n\n"
            f"Student level: {level}. Language: {lang_name}."
        )

    # Language-agnostic gender context
    gender_context = ""
    if gender and gender != "both":
        gender_context = (
            f"\n\nStudent gender: {gender}\n"
            f"IMPORTANT: This student identifies as {gender}.\n"
            f"- If {lang_name} has gendered speech (pronouns, particles, verb forms, etc.), "
            f"always use the {gender} forms in your examples, corrections, and conversation.\n"
            f"- Never correct the student for using the correct {gender} form.\n"
            f"- Model the correct gendered forms consistently."
        )
    elif gender == "both":
        gender_context = (
            f"\n\nStudent requested: show both gender forms.\n"
            f"If {lang_name} has gendered speech, show both male and female forms where applicable."
        )

    return (
        f"{persona['personality']}\n\n"
        f"Language being learned: {lang_name}\n"
        f"Student level: {level}\n"
        f"Current position: Unit {unit}, Lesson {lesson}\n\n"
        f"Level-specific instructions: {level_inst}\n\n"
        f"Correction style: When the student makes a mistake, correct them naturally within your reply. "
        f"For example: 'Nice try! By the way, you'd say [correct form] — try using it in your next message?'\n\n"
        f"Never list grammar rules unprompted. Never lecture. Keep the conversation moving forward.\n"
        f"The student's native language is {native_name}. Use {native_name} for explanations and corrections.\n"
        f"If the student writes in {native_name}, respond briefly in {native_name} then redirect to {lang_name}."
        f"{gender_context}"
    )


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Main AI conversation endpoint.
    Takes conversation history + user message, returns tutor reply.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    system_prompt = build_system_prompt(
        lang=req.lang,
        level=req.level,
        unit=req.unit,
        lesson=req.lesson,
        mode=req.mode,
        key_phrases=req.key_phrases,
        gender=req.gender,
        chat_mode=req.chat_mode,
        native_lang=req.native_lang,
    )

    # Build message history for LLM
    messages = []
    for msg in req.history[-20:]:  # Last 20 messages for context
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    try:
        reply = await chat_completion(
            system=system_prompt,
            messages=messages,
            max_tokens=300,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {str(e)}")


@router.post("/explain")
async def explain_endpoint(req: ExplainRequest):
    """
    'Why?' explanation endpoint.
    Returns a clear explanation of a grammar/vocabulary question.
    """
    system_prompt = build_system_prompt(
        lang=req.lang,
        level=req.level,
        unit=1,
        lesson=1,
        is_why=True,
    )

    context_note = f"\n\nContext from conversation: {req.context}" if req.context else ""
    user_message = f"Please explain: {req.question}{context_note}"

    try:
        explanation = await chat_completion(
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            max_tokens=400,
        )
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {str(e)}")


@router.post("/evaluate")
async def evaluate_endpoint(req: EvaluateRequest):
    """
    Evaluate a student's translated answer using LLM semantic matching.
    Returns whether it's correct and feedback.
    """
    lang_name = _get_lang_name(req.language)

    system = (
        f"You are evaluating a language learning exercise for {lang_name}. "
        f"The student's answer may be semantically equivalent to the expected answer "
        f"even if not identical. Accept natural paraphrases and valid alternatives. "
        f"Reply in JSON only: {{\"correct\": bool, \"feedback\": string, \"alternatives\": [string]}}"
    )

    prompt = (
        f"Exercise type: {req.type}\n"
        f"Expected answer: {req.expected}\n"
        f"Student's answer: {req.user_answer}\n\n"
        f"Is the student's answer correct or semantically equivalent? "
        f"If correct, give brief positive feedback. "
        f"If wrong, explain what the correct answer should be."
    )

    try:
        result = await chat_completion(
            system=system,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        # Try to parse JSON response
        import re
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        # Fallback if LLM doesn't return valid JSON
        return {"correct": False, "feedback": result, "alternatives": []}
    except Exception as e:
        # Simple string match fallback
        correct = req.user_answer.strip().lower() == req.expected.strip().lower()
        return {
            "correct": correct,
            "feedback": "Correct!" if correct else f"The correct answer is: {req.expected}",
            "alternatives": [],
        }
