"""
Lingwa — Backend i18n (Internationalization)

Centralized translation schema for all user-facing feedback strings.
Adding a new language = adding one key to each entry in TRANSLATIONS.

Usage:
    from services.i18n import t
    t("cant_hear", "zh")          → "我听不清楚。试着靠近麦克风说话 🎤"
    t("perfect", "ko")            → "완벽해요! ⭐⭐⭐"
    t("try_again", "ja", word=X)  → "もう一度：X"
"""

# ─── Translation Schema ───
# Each key maps to {lang_code: template_string}
# Templates support {var} interpolation: "Try: {word}" → "Try: สวัสดี"
# English is always the fallback.

TRANSLATIONS: dict[str, dict[str, str]] = {
    # ─── Speech evaluation feedback ───
    "cant_hear": {
        "en": "I couldn't hear you clearly. Try speaking closer to the mic 🎤",
        "zh": "我听不清楚。试着靠近麦克风说话 🎤",
        "th": "ฟังไม่ชัด ลองพูดใกล้ไมค์มากขึ้น 🎤",
        "ja": "よく聞こえませんでした。マイクに近づいて話してください 🎤",
        "ko": "잘 들리지 않았어요. 마이크에 가까이 대고 말해보세요 🎤",
        "es": "No pude escucharte bien. Intenta hablar más cerca del micrófono 🎤",
    },
    "hard_to_catch": {
        "en": "That was hard to catch — try speaking a bit slower and clearer 🎤",
        "zh": "没有听清——试着说慢一点、清楚一点 🎤",
        "th": "ฟังไม่ค่อยชัด ลองพูดช้าๆ ชัดๆ 🎤",
        "ja": "聞き取れませんでした。ゆっくりはっきり話してみてください 🎤",
        "ko": "잘 안 들렸어요. 천천히 또렷하게 말해보세요 🎤",
        "es": "No lo capté bien — intenta hablar un poco más lento y claro 🎤",
    },
    "perfect": {
        "en": "Perfect! ⭐⭐⭐",
        "zh": "完美！⭐⭐⭐",
        "th": "สมบูรณ์แบบ! ⭐⭐⭐",
        "ja": "完璧！⭐⭐⭐",
        "ko": "완벽해요! ⭐⭐⭐",
        "es": "¡Perfecto! ⭐⭐⭐",
    },
    "particle_missing": {
        "en": "Right word! Don't forget {particle} at the end — try: {word}",
        "zh": "词说对了！别忘了在结尾加上{particle}——试试：{word}",
        "th": "คำถูกแล้ว! อย่าลืม{particle}ท้ายประโยค — ลอง: {word}",
        "ja": "正しい言葉です！最後に{particle}を忘れずに——試してみて：{word}",
        "ko": "맞는 단어예요! 끝에 {particle} 잊지 마세요 — 다시: {word}",
        "es": "¡Palabra correcta! No olvides {particle} al final — intenta: {word}",
    },

    # ─── LLM fallback (when Ollama is down) ───
    "fallback_wrong_words": {
        "en": "Almost! We're practising {word} — try again?",
        "zh": "差一点！我们在练习 {word}——再试一次？",
        "th": "เกือบแล้ว! เรากำลังฝึก {word} — ลองอีกครั้ง?",
        "ja": "惜しい！{word}を練習中です——もう一度？",
        "ko": "거의 맞았어요! {word}를 연습 중이에요 — 다시 해볼까요?",
        "es": "¡Casi! Estamos practicando {word} — ¿intentas de nuevo?",
    },
    "fallback_wrong_tone": {
        "en": "Right word! But the tone needs work — {info}. Try again?",
        "zh": "词说对了！但声调需要改进——{info}。再试一次？",
        "th": "คำถูกแล้ว! แต่เสียงวรรณยุกต์ต้องปรับ — {info} ลองอีกครั้ง?",
        "ja": "正しい言葉です！でも声調を直しましょう——{info}。もう一度？",
        "ko": "맞는 단어예요! 하지만 성조를 고쳐야 해요 — {info}. 다시?",
        "es": "¡Palabra correcta! Pero el tono necesita trabajo — {info}. ¿Otra vez?",
    },
    "fallback_try_again": {
        "en": "Try again: {word}",
        "zh": "再试一次：{word}",
        "th": "ลองอีกครั้ง: {word}",
        "ja": "もう一度：{word}",
        "ko": "다시 해보세요: {word}",
        "es": "Inténtalo de nuevo: {word}",
    },
}

# ─── Language name lookup (used in LLM prompts) ───

LANG_NAMES: dict[str, str] = {
    "en": "English", "zh": "Chinese", "th": "Thai", "es": "Spanish",
    "ja": "Japanese", "ko": "Korean", "fr": "French", "de": "German",
    "pt": "Portuguese", "it": "Italian", "ar": "Arabic", "ru": "Russian",
    "hi": "Hindi", "vi": "Vietnamese", "id": "Indonesian", "ms": "Malay",
    "nl": "Dutch", "sv": "Swedish", "pl": "Polish", "tr": "Turkish",
}


def get_lang_name(code: str) -> str:
    """Get human-readable language name from code."""
    return LANG_NAMES.get(code, code.upper())


def t(key: str, native_lang: str = "en", **kwargs: str) -> str:
    """
    Translate a key to the user's native language.

    Supports {var} interpolation:
        t("particle_missing", "zh", particle="ครับ", word="สวัสดีครับ")

    Fallback chain: native_lang → en → key
    """
    entry = TRANSLATIONS.get(key)
    if not entry:
        return key

    text = entry.get(native_lang) or entry.get("en", key)

    for k, v in kwargs.items():
        text = text.replace(f"{{{k}}}", str(v))

    return text
