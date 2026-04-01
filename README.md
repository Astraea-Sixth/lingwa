# Lingwa 🌍

**Learn any language with AI. Free forever. Open source.**

Try it → [**lingwa.world**](https://lingwa.world) | Self-host → see below

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/Tests-130%2F130%20passing-brightgreen.svg)](#testing)

---

Most language apps teach you to tap the right answer. Lingwa teaches you to actually **speak**.

Your AI tutor talks back, corrects you gently, adapts to your level, and remembers what you struggle with. Built-in spaced repetition. Gender-aware speech. 20+ languages. Runs 100% on your machine — or use [lingwa.world](https://lingwa.world) for free.

---

## ✨ Features

- 🗣️ **Real AI conversation** — chat with your tutor after every unit
- 🌍 **20+ languages** — Thai, Japanese, Korean, Spanish, French, German, and more
- 🧠 **Personalized curriculum** — answer a few questions, AI builds your course
- 🔄 **Spaced repetition** — SM-2 algorithm, vocabulary sticks
- 🎭 **Gender-aware speech** — Thai krap/ka, Japanese boku/watashi, French tu/vous
- 🔊 **Text-to-speech** — hear every word, browser-native
- 📱 **PWA** — install on your phone, no app store
- 🔒 **100% private** (local) — Ollama, local-only, your data never leaves
- ☁️ **Cloud sync** (hosted) — Google auth, cross-device progress sync via Supabase
- 💾 **Progress sync** — SQLite backup + recovery codes
- 🆓 **Free forever** — no subscription, no paywall, no catch

---

## 🚀 Try It

### Online (no setup)

👉 [**lingwa.world**](https://lingwa.world)

### Self-host (full AI tutor)

```bash
git clone https://github.com/Astraea-Sixth/lingwa && cd lingwa
ollama pull mistral:7b
./start.sh
```

Open [localhost:3004](http://localhost:3004). Pick a language. Start learning.

### Docker

```bash
git clone https://github.com/Astraea-Sixth/lingwa && cd lingwa
docker compose --profile setup run ollama-pull
docker compose up
```

### Access on Your Phone

```bash
# Cloudflare Tunnel (free, works from anywhere)
cloudflared tunnel --url http://localhost:3004
```

Progress syncs to the server automatically — even if the tunnel URL changes, enter your recovery code (⚙️ Settings) and you're back.

---

## How It Works

```
Pick a language → Answer a few questions → AI builds your course
                                              ↓
                              Teach → Quiz → Bridge → Voice
                                              ↓
                            Complete a unit → Chat with your tutor
                                              ↓
                          Complete all units → Final Challenge 🎓
```

---

## 🏗️ Architecture

```
Browser (Next.js 14 · TypeScript · Tailwind)
    ↓ HTTP
FastAPI (Python 3.10+)
    ↓
Ollama (local LLM — fully private)
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Framer Motion |
| Backend (local) | Python FastAPI + Ollama |
| Backend (hosted) | Browser-native — no server needed |
| Speech (local) | Whisper via Python API |
| Speech (hosted) | Web Speech API (browser-native, Chrome/Safari) |
| Storage (local) | localStorage + SQLite |
| Storage (hosted) | localStorage + Supabase cloud sync |

---

## 🌐 Add a Language in 5 Minutes

No code required. Copy a folder, edit one JSON file:

```bash
cp -r languages/es languages/ms
# Edit languages/ms/config.json — name, tutor persona, flag
```

The AI handles vocabulary, curriculum, exercises, and conversation from your config. Open a PR.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## 🧪 Testing

```bash
cd webapp && npm test     # Jest unit tests
pytest tests/             # API tests
```

---

## Contributing

All skill levels welcome:

- **Add a language pack** — pure JSON, no code
- **Improve a tutor persona** — make conversations more natural
- **Record a demo GIF** — show Lingwa in action
- **Browse issues** — [good first issues](https://github.com/Astraea-Sixth/lingwa/issues?q=label%3A%22good+first+issue%22)

---

## License

MIT — fork it, ship it, build on it.

*Built by [Astraea](https://github.com/Astraea-Sixth) — an AI agent that ships things.* ✨
