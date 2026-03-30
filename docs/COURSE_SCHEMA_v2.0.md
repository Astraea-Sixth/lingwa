# Lingwa — Course Schema v2.0

**Author:** Astraea  
**Date:** 2026-03-25  
**Status:** FINAL — ready for Claude Code implementation

---

## Core Rules (Non-Negotiable)

1. **No typing ever** — every exercise is tap-to-select or tap-word-tiles
2. **Gender at every level** — vocab, exercises, grammar, tutor prompts
3. **Meanings are always native language** — `meanings.en` / `meanings.zh`, fallback to `en`
4. **TTS is always the target language** — audio = Thai/Chinese, options = English/Chinese
5. **One file per language per level** — not one file per unit

---

## 1. File Structure

```
languages/
  {code}/
    config.json                    ← language metadata
    courses/
      a1.json                      ← A1 full course (all units)
      a2/
        general.json               ← A2 general track
        food.json                  ← A2 food track
        travel.json                ← A2 travel track
        work.json                  ← A2 work track
        social.json                ← A2 social track
        romance.json               ← A2 romance track
      b1.json                      ← B1 full course
      b2.json                      ← B2 full course
  agent/
    prompts/
      a1_tutor.txt
      a2_tutor.txt
      b1_tutor.txt
      b2_tutor.txt
```

---

## 2. Language Config (`config.json`)

```json
{
  "code": "th",
  "name": "Thai",
  "nativeName": "ภาษาไทย",
  "flag": "🇹🇭",
  "difficulty": "hard",
  "tonal": true,
  "tones": 5,
  "toneNames": ["mid", "low", "falling", "high", "rising"],
  "hasScript": true,
  "scriptName": "Thai script",
  "rtl": false,
  "cefr_available": ["A1", "A2", "B1", "B2"],
  "shipped_with": "v1",

  "tutor": {
    "name": "Nong",
    "nameNative": "น้อง",
    "personality": "warm, patient, uses emojis naturally, gently corrects mistakes"
  },

  "ttsVoice": "th-TH",

  "gender": {
    "required": true,
    "particles": {
      "male":   { "polite": "ครับ", "romanization": "khrap" },
      "female": { "polite": "ค่ะ",  "romanization": "kha" }
    },
    "pronouns": {
      "male":   { "i": "ผม", "romanization": "phom" },
      "female": { "i": "ฉัน", "romanization": "chan" }
    }
  }
}
```

---

## 3. Course File Root

```json
{
  "lang": "th",
  "level": "A1",
  "track": null,
  "track_label": null,
  "track_emoji": null,
  "unlock_requires": null,
  "nativeLangs": ["en", "zh"],
  "version": "2.0",
  "units": []
}
```

For A2 track files:
```json
{
  "lang": "th",
  "level": "A2",
  "track": "food",
  "track_label": { "en": "Food & Dining", "zh": "餐饮美食" },
  "track_emoji": "🍜",
  "unlock_requires": "a1_complete",
  "nativeLangs": ["en", "zh"],
  "version": "2.0",
  "units": []
}
```

---

## 4. Unit

```json
{
  "id": 1,
  "title": "Greetings & Essentials",
  "description": {
    "en": "Learn to greet and say goodbye",
    "zh": "学习问候和再见"
  },
  "lessons": []
}
```

---

## 5. Lesson Types

Every lesson has a `type` field. App renders different UI per type.

### 5a. Vocabulary Lesson (A1 default)

```json
{
  "id": "1.1",
  "type": "vocabulary",
  "title": "Hello & Goodbye",
  "objectives": {
    "en": ["Greet and say goodbye in Thai", "Use ครับ/ค่ะ politely"],
    "zh": ["用泰语打招呼和道别", "正确使用礼貌助词"]
  },
  "chat_seed": {
    "en": "Greet your tutor Nong and ask how they are.",
    "zh": "用泰语向老师น้อง打招呼，问问她好不好。"
  },
  "vocabulary": [],
  "exercises": []
}
```

### 5b. Grammar Lesson (A2+)

```json
{
  "id": "1.1",
  "type": "grammar",
  "title": "มี vs เป็น — To Have vs To Be",
  "grammar": {
    "concept": "มี vs เป็น",
    "explanation": {
      "en": "มี means 'to have'. เป็น means 'to be'. Never interchangeable.",
      "zh": "มี表示'有'。เป็น表示'是'。两者不可互换。"
    },
    "pattern": {
      "neutral": "Subject + มี/เป็น + Object",
      "male":    "Subject + มี/เป็น + Object + ครับ",
      "female":  "Subject + มี/เป็น + Object + ค่ะ"
    },
    "examples": [
      {
        "target": "ฉันมีแมว",
        "romanization": "chan mee maew",
        "meanings": { "en": "I have a cat", "zh": "我有一只猫" },
        "gendered": {
          "male":   { "target": "ผมมีแมวครับ",  "romanization": "phom mee maew khrap" },
          "female": { "target": "ฉันมีแมวค่ะ",   "romanization": "chan mee maew kha" }
        }
      }
    ]
  },
  "chat_seed": {
    "en": "Tell your tutor what you have at home using มี.",
    "zh": "用มี告诉老师你家里有什么。"
  },
  "vocabulary": [],
  "exercises": []
}
```

---

## 6. Vocab Item

Used at every level.

```json
{
  "word": "สวัสดี",
  "romanization": "sawadee",
  "meanings": {
    "en": "Hello / Hi",
    "zh": "你好"
  },
  "example": {
    "target": "สวัสดีตอนเช้า",
    "romanization": "sawadee ton chao",
    "meanings": { "en": "Good morning", "zh": "早上好" }
  },
  "gendered": {
    "male":   { "word": "สวัสดีครับ",  "romanization": "sawadee khrap" },
    "female": { "word": "สวัสดีค่ะ",   "romanization": "sawadee kha" }
  },
  "toneClass": "rising"
}
```

**Rules:**
- `word` — base form only, NO romanization in parentheses, NO brackets
- `meanings` — object, minimum `en` always required
- `gendered` — required if `config.gender.required = true`
- `toneClass` — only for tonal languages (th, zh, vi)

---

## 7. Exercise Types

### 7a. `target_to_native` (A1+)
TTS plays target word on tap → pick the native language meaning

```json
{
  "type": "target_to_native",
  "word": "สวัสดี",
  "romanization": "sawadee",
  "gendered_word": {
    "male":   { "word": "สวัสดีครับ",  "romanization": "sawadee khrap" },
    "female": { "word": "สวัสดีค่ะ",   "romanization": "sawadee kha" }
  },
  "options": {
    "en": ["Hello / Hi", "Goodbye", "Thank you", "How are you?"],
    "zh": ["你好", "再见", "谢谢", "你好吗？"]
  },
  "correct": 0
}
```

### 7b. `native_to_target` (A1+)
Show native phrase → pick correct target language word (gender-aware)

```json
{
  "type": "native_to_target",
  "question": {
    "en": "How do you say 'Hello' in Thai?",
    "zh": "泰语中'你好'怎么说？"
  },
  "options": {
    "neutral": ["สวัสดี",    "ลาก่อน",    "ขอบคุณ",    "สบายดีไหม"],
    "male":    ["สวัสดีครับ", "ลาก่อนครับ", "ขอบคุณครับ", "สบายดีไหมครับ"],
    "female":  ["สวัสดีค่ะ",  "ลาก่อนค่ะ",  "ขอบคุณค่ะ",  "สบายดีไหมคะ"]
  },
  "correct": 0
}
```

### 7c. `listening` (A1+)
TTS auto-plays target word → pick the correct native meaning (NOT Thai options)

```json
{
  "type": "listening",
  "audio_text": "สวัสดี",
  "romanization": "sawadee",
  "options": {
    "en": ["Hello / Hi", "Goodbye", "I'm fine", "See you later"],
    "zh": ["你好", "再见", "我很好", "再见了"]
  },
  "correct": 0
}
```

**Rule:** `options` must always be in the native language. Never show Thai options for a listening exercise.

### 7d. `matching` (A1+)
Tap Thai word + tap its native meaning. 4 pairs.

```json
{
  "type": "matching",
  "pairs": [
    {
      "target": "สวัสดี",
      "romanization": "sawadee",
      "native": { "en": "Hello", "zh": "你好" }
    },
    {
      "target": "ลาก่อน",
      "romanization": "laa gon",
      "native": { "en": "Goodbye", "zh": "再见" }
    },
    {
      "target": "ขอบคุณ",
      "romanization": "khob khun",
      "native": { "en": "Thank you", "zh": "谢谢" }
    },
    {
      "target": "สบายดี",
      "romanization": "sabai dee",
      "native": { "en": "I'm fine", "zh": "我很好" }
    }
  ]
}
```

### 7e. `reorder` (A1+)
Tap word tiles in the correct order. Gender-filtered.

```json
{
  "type": "reorder",
  "prompt": {
    "en": "Say 'Hello' politely",
    "zh": "礼貌地说'你好'"
  },
  "tiles": {
    "male":    ["ครับ", "สวัสดี"],
    "female":  ["ค่ะ",  "สวัสดี"],
    "neutral": ["สวัสดี"]
  },
  "correct_order": {
    "male":    ["สวัสดี", "ครับ"],
    "female":  ["สวัสดี", "ค่ะ"],
    "neutral": ["สวัสดี"]
  }
}
```

**Rule:** App reads `profile.gender` → shows only that gender's tiles. Never show both genders' tiles to one user.

### 7f. `grammar_choice` (A2+)
See sentence with a gap → tap the correct word. NOT typing.

```json
{
  "type": "grammar_choice",
  "sentence": {
    "neutral": "ผม _____ แมว",
    "male":    "ผม _____ แมว ครับ",
    "female":  "ฉัน _____ แมว ค่ะ"
  },
  "hint": {
    "en": "I ___ a cat (have/be)",
    "zh": "我___一只猫（有/是）"
  },
  "options": ["มี", "เป็น", "ไป", "อยู่"],
  "correct": 0,
  "explanation": {
    "en": "มี = to have. Use มี when you possess something.",
    "zh": "มี = 有。当你拥有某物时使用มี。"
  }
}
```

### 7g. `collocation` (B1+)
Which words naturally go together? Tap the correct pairing.

```json
{
  "type": "collocation",
  "collocation_type": "verb_noun",
  "prompt": {
    "en": "Which is correct?",
    "zh": "哪个是正确的？"
  },
  "options": {
    "en": ["make a decision", "do a decision", "take a decision", "have a decision"],
    "zh": ["做出决定", "进行决定", "拥有决定", "带来决定"]
  },
  "correct": 0,
  "explanation": {
    "en": "'Make a decision' is the correct collocation. 'Do', 'take', and 'have' don't work here.",
    "zh": "'Make a decision'是正确的搭配。"
  }
}
```

### 7h. `idiom` (B2+)
What does this expression mean? Tap the correct interpretation.

```json
{
  "type": "idiom",
  "phrase": "in the long run",
  "example": {
    "en": "Saving money is good in the long run.",
    "zh": "从长远来看，存钱是好的。"
  },
  "options": {
    "en": ["over a long period of time", "during a run", "in a long race", "after a long wait"],
    "zh": ["从长远来看", "在长跑中", "在长途赛跑中", "经过长时间等待"]
  },
  "correct": 0,
  "warning": {
    "en": "Don't translate literally — nothing to do with running.",
    "zh": "不要直译——与跑步无关。"
  }
}
```

---

## 8. Exercise Types by Level

| Exercise Type | A1 | A2 | B1 | B2 |
|---|---|---|---|---|
| `target_to_native` | ✅ | ✅ | ✅ | ✅ |
| `native_to_target` | ✅ | ✅ | ✅ | ✅ |
| `listening` | ✅ | ✅ | ✅ | ✅ |
| `matching` | ✅ | ✅ | ✅ | ✅ |
| `reorder` | ✅ | ✅ | ✅ | ✅ |
| `grammar_choice` | — | ✅ | ✅ | ✅ |
| `collocation` | — | — | ✅ | ✅ |
| `idiom` | — | — | — | ✅ |

**No `writing` or `fill_in_the_blank`** — no typing ever.  
**No `pronunciation` scoring** — Web Speech API cannot objectively score pronunciation.

---

## 9. Gender Resolution Rules

```
profile.gender = "male"   → use gendered.male   || neutral
profile.gender = "female" → use gendered.female  || neutral
profile.gender = "both"   → show both forms side by side
```

For exercises: filter by gender before rendering. Male user should never see a ค่ะ reorder exercise.

---

## 10. Native Language Resolution

```
1. Try meanings[profile.nativeLangCode]  e.g. meanings.zh
2. Fall back to meanings.en
3. Fall back to the raw target word if nothing found
```

---

## 11. AI Tutor (Agent Session)

After each lesson, user speaks with the Ollama AI tutor. This is the core engagement loop.

### Session config (per lesson):
```json
{
  "chat_seed": {
    "en": "Greet your tutor and introduce yourself.",
    "zh": "用泰语向老师打招呼并介绍自己。"
  },
  "vocabulary_in_scope": ["สวัสดี", "ลาก่อน", "ขอบคุณ"],
  "grammar_in_scope": [],
  "minimum_exchanges": 5,
  "tutor_name": "Nong"
}
```

### Correction style by level:

| Level | Style | Example |
|---|---|---|
| A1 | Explicit + repeat | "Almost! Say: 'สวัสดีครับ'. Try again?" |
| A2 | Model + invite | "Got it! So you went to the market — what did you buy?" |
| B1 | Embedded recast | Repeat their sentence correctly in your reply, then ask a follow-up |
| B2 | Meta feedback | "Natural! One thing — 'make a research' should be 'do research'." |

### Prompt templates: `agent/prompts/{level}_tutor.txt`
Use `{{mustache}}` variable injection for `topic_context`, `vocabulary_in_scope`, `grammar_in_scope`, `tutor_name`, `learner_gender`.

---

## 12. User Progress (localStorage)

No user IDs. No backend. All state in browser localStorage.

```json
{
  "targetLang": "Thai",
  "targetLangCode": "th",
  "nativeLang": "English",
  "nativeLangCode": "en",
  "level": "A1",
  "gender": "male"
}
```

Progress key: `lingwa:progress:{langCode}`
```json
{
  "xp": 150,
  "streak": 7,
  "lessonsCompleted": {
    "1.1": { "completed": true, "perfect": false, "xp": 15 },
    "1.2": { "completed": true, "perfect": true,  "xp": 20 }
  },
  "a1Complete": false,
  "currentTrack": null
}
```

---

## 13. Level & Content Roadmap

### A1 — 5 units, 20 lessons, 300 vocab (15 per lesson)
Fixed path. No choices. Everyone does the same foundation.

| Unit | Theme | Key Vocab |
|---|---|---|
| 1 | Greetings & Essentials | Hello, goodbye, please, thank you, yes, no |
| 2 | People & Pronouns | I, you, he, she, family words |
| 3 | Numbers & Time | 1–20, today, tomorrow, days of week |
| 4 | Food & Places | Water, rice, home, market, hospital |
| 5 | Getting Around | Car, bus, left, right, where, how much |

### A2 — 6 tracks, ~5 units each
Unlocked after A1 complete. User picks 1 track.

| Track | Theme |
|---|---|
| `general` | Daily routine, weather, shopping |
| `food` | Ordering, cooking, ingredients, restaurants |
| `travel` | Transport, hotels, directions, sightseeing |
| `work` | Office, jobs, schedules, colleagues |
| `social` | Hobbies, friends, invitations, small talk |
| `romance` | Relationships, compliments, dates |

All tracks converge at B1.

### B1 — Single stream, 40 units
Grammar structures + topic vocab  
New exercise types: `grammar_choice`, `collocation`

### B2 — Single stream, 50 units
Fluency, idioms, nuance  
New exercise type: `idiom`

---

## 14. Launch Scope (v1)

| Item | Status |
|---|---|
| Thai A1 | ✅ Build now |
| Chinese A1 | ✅ Build now |
| English native language | ✅ Build now |
| Chinese native language | ✅ Build now |
| Spanish A1 | ⚠️ Migrate schema |
| A2 track stubs | 🔜 Empty structure |
| B1, B2 | 🔒 Future |
| French, Japanese, Korean, German, Portuguese | 🔒 Future |

---

*Lingwa Course Schema v2.0 — Astraea, 2026-03-25*
