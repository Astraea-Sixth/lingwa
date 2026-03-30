# Lingwa 🦊

**Learn any language with an AI tutor that actually talks back.**

Structured curriculum, spaced repetition, gender-aware speech, and real conversation practice — in Thai, Korean, Spanish, Chinese, English, and more. Runs 100% locally on your machine. Free forever. No account. No subscription.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/Tests-127%2F127%20passing-brightgreen.svg)](#testing)

---

> **[ Screenshot / Demo GIF — want to contribute one? Open a PR! ]**

---

## Why Lingwa?

Most language apps teach you to tap the right answer. Lingwa teaches you to actually speak.

- 🆓 **Free forever** — no subscription, no account, no paywall
- 💬 **Real AI conversation** — your tutor speaks your target language, corrects you gently, adapts to your level
- 🔒 **100% local** — runs on your machine with Ollama, your data never leaves
- 🌍 **Any language** — Thai, Korean, Spanish, Chinese, English, and growing
- 🔓 **Open source** — MIT license, fork it, own it, extend it
- 📱 **PWA** — install on any phone, no app store needed

---

## Features

- **Conversation-first** — free-form AI chat with your tutor after every unit
- **20+ languages** — Thai, Japanese, Korean, Spanish, French, German, Portuguese, and anything else your LLM knows
- **Personalized curriculum** — answer 6 questions, AI builds your entire course
- **Spaced repetition** — SM-2 algorithm keeps vocabulary fresh
- **Gender-aware speech** — Thai krap/ka, Japanese boku/watashi, French tu/vous — taught correctly from day 1
- **Text-to-speech** — hear every word via Web Speech API, built into every browser
- **4-phase lessons** — Teach → Quiz → Bridge → Voice in every lesson
- **Multiple exercise types** — multiple choice, fill-in-the-blank, sentence reorder, listening, translation, matching pairs
- **Final Challenge** — complete all units and face a real conversation test
- **Runs 100% local** — Ollama, fully private, no API keys needed
- **Zero infrastructure** — no database, no accounts, all state in localStorage

---

## Quickstart

**Prerequisites:** [Node.js](https://nodejs.org) 18+, [Python](https://python.org) 3.10+, [Ollama](https://ollama.ai)

```bash
git clone https://github.com/Astraea-Sixth/lingwa && cd lingwa
ollama pull mistral:7b
./start.sh
```

Open [localhost:3004](http://localhost:3004), answer 6 questions, start learning.

### Docker (one command)

```bash
git clone https://github.com/Astraea-Sixth/lingwa && cd lingwa
docker compose --profile setup run ollama-pull   # one-time model download
docker compose up
```

---

---

## How It Works

```
Answer 6 onboarding questions (language, level, goals, gender)
          |
          v
AI generates your personalized curriculum (~60s)
          |
          v
Lesson: Teach → Quiz → Bridge → Voice
          |
          v
Complete a unit → Unlock free conversation with your tutor
          |
          v
Complete all units → Final Challenge
```

---

## Architecture

```
Browser (Next.js 14 · TypeScript · Tailwind · Framer Motion)
          |
          | HTTP   :3004  →  :5003
          v
FastAPI Backend (Python 3.10+)
          |
          +--→ Ollama (local, any model — fully private)
          |
          +--→ Web Speech API (TTS, browser-native)

Storage: localStorage only. No database. No accounts. No telemetry.
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Framer Motion |
| Backend | Python FastAPI, Pydantic |
| AI | Ollama (local, fully private) |
| Speech | Web Speech API (browser-native) |
| Storage | localStorage — zero infrastructure |

---

## Add a Language in 5 Minutes

No coding required. A language pack is a single JSON file.

```bash
cp -r languages/es languages/ms
```

Edit `languages/ms/config.json`:

```json
{
  "code": "ms",
  "name": "Malay",
  "nativeName": "Bahasa Melayu",
  "tutor": {
    "name": "Nadia",
    "nameNative": "Nadia",
    "personality": "warm, encouraging, mixes in casual Malay phrases naturally"
  },
  "ttsVoice": "ms-MY",
  "hasScript": false,
  "tones": 0,
  "difficulty": "easy",
  "flag": "🇲🇾"
}
```

Open a PR. That's it. The AI handles vocabulary, curriculum, exercises, and conversation using the config you defined. No backend changes. No frontend changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## Project Structure

```
lingwa/
  api/              Python FastAPI backend (port 5003)
    routers/        chat, curriculum_gen, lessons, tts
    services/       LLM service (Ollama), spaced repetition
  webapp/           Next.js 14 frontend (port 3004)
    src/app/        Pages (onboarding, lessons, chat)
    src/components/ UI components (exercises, lesson tree, chat)
    src/lib/        Utilities (progress, TTS, API client)
  languages/        Language packs (JSON configs)
    th/             Thai — Nong
    es/             Spanish — Marco
    fr/             French — Camille
    ja/             Japanese — Yuki
    ko/             Korean — Min
    de/             German — Hans
    pt/             Portuguese — Ana
  tests/            Backend pytest + E2E Playwright
```

---

## Testing

127 tests across 2 layers, all passing.

```bash
cd webapp && npm test          # Jest unit tests (63)
pytest tests/                  # Backend API tests (64)
```

---

## Contributing

All skill levels welcome. The most impactful contributions right now:

- **Add a language pack** — pure JSON, no code
- **Improve a tutor persona** — make conversations more natural
- **Record a demo GIF** — show Lingwa in action
- **Browse issues** — [good first issues](https://github.com/Astraea-Sixth/lingwa/issues?q=label%3A%22good+first+issue%22)

Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

MIT — fork it, ship it, build on it.

*Built by [Astraea](https://github.com/Astraea-Sixth).*
