# Contributing to Lingwa

Welcome! Lingwa is built by people who want better language learning tools — contributions of every size matter here.

**You do not need to write code to contribute.** The single most impactful contribution is adding a language pack, which is a JSON file.

---

## Good First Issues

| Label | What it means |
|---|---|
| `good first issue` | Small, well-defined, great for first-timers |
| `language pack` | Add or improve a language JSON config |
| `prompt engineering` | Improve an AI tutor's personality or responses |
| `docs` | Fix or improve documentation |
| `bug` | Confirmed bug with reproduction steps |

Browse: [github.com/Astraea-Sixth/lingwa/issues](https://github.com/Astraea-Sixth/lingwa/issues?q=label%3A%22good+first+issue%22)

---

## Ways to Contribute

### 1. Add a Language Pack (No code needed)

The easiest and most valuable contribution. A language pack is a single JSON file.

**Step 1 — Copy an existing pack:**
```bash
git clone https://github.com/YOUR_USERNAME/lingwa
cd lingwa
cp -r languages/es languages/YOUR_LANG_CODE
```

**Step 2 — Edit the config:**

`languages/YOUR_LANG_CODE/config.json`:

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

**Field reference:**

| Field | Type | Description |
|---|---|---|
| `code` | string | ISO language code (e.g. `ms`, `ko`, `ar`) |
| `name` | string | English name |
| `nativeName` | string | Name in the language itself |
| `tutor.name` | string | Tutor's name (culturally fitting) |
| `tutor.nameNative` | string | Tutor's name in target script |
| `tutor.personality` | string | Free-text personality fed to the AI — be specific and vivid |
| `ttsVoice` | string | BCP-47 voice tag for Web Speech API (e.g. `ms-MY`, `ja-JP`) |
| `hasScript` | boolean | `true` if non-Latin script (Japanese, Thai, Arabic, etc.) |
| `tones` | number | Number of tones (Thai=5, Mandarin=4, most=0) |
| `difficulty` | string | `easy`, `medium`, or `hard` |
| `flag` | string | Flag emoji |

**Step 3 — Test it:**
```bash
./start.sh
# Open http://localhost:3004, select your new language in onboarding
```

**Step 4 — Open a PR.** Title: `feat(languages): add [Language Name] pack`

The AI generates all vocabulary, curriculum, and exercises at runtime — you only define the config.

---

### 2. Improve a Tutor Persona (Prompt Engineering)

Tutor personas directly affect learning quality. A well-crafted persona produces warmer, more accurate, more culturally appropriate responses.

**Where prompts live:**
- `api/routers/chat.py` — AI tutor system prompt and conversation logic
- `api/routers/curriculum_gen.py` — curriculum generation prompt
- `languages/*/config.json` — persona personality field

**What makes a great improvement:**
- Culturally specific traits (not just "friendly" — what kind of friendly?)
- Better correction style (encouraging but honest)
- Language-specific nuance (Thai particles, Japanese keigo, Korean formality levels)

**How to contribute:**
1. Branch: `git checkout -b prompt/improve-thai-tutor`
2. Edit the relevant prompt
3. Test with `./start.sh` — run several conversations, compare behavior
4. Document what changed and why in your PR description
5. Include a sample exchange showing the improvement

---

### 3. Fix a Bug

1. Check [open issues](https://github.com/Astraea-Sixth/lingwa/issues)
2. Comment to claim it before starting
3. Branch: `git checkout -b fix/brief-description`
4. Fix, test, PR — reference the issue number

---

### 4. Build a Feature

Open a discussion first for substantial work. Features always welcome:
- Additional exercise types
- Offline TTS (Kokoro ONNX)
- Accessibility improvements
- Mobile PWA support

---

## Development Setup

### Prerequisites
- Node.js 18+, Python 3.10+
- Ollama: `ollama pull mistral:7b`

### Frontend (Next.js, port 3004)
```bash
cd webapp
npm install
npm run dev        # dev server
npm run lint       # ESLint
npm run type-check # TypeScript strict
npm test           # Jest unit tests
```

### Backend (FastAPI, port 5003)
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 5003 --reload
```

### Everything at once
```bash
./start.sh    # starts Ollama check, backend, frontend
./stop.sh     # stops all
```

---

## Testing

Three test layers. All must pass before merge.

| Layer | Command | Count |
|---|---|---|
| Frontend (Jest) | `cd webapp && npm test` | 62 tests |
| Backend (pytest) | `cd api && pytest` | 64 tests |
| E2E (Playwright) | `npx playwright test` | 14 tests |

**Total: 140 tests, all must pass.**

---

## Environment Variables

### Backend (`api/.env`)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server |
| `OLLAMA_MODEL` | `llama3.2:3b` | Chat model |
| `LLM_TIMEOUT` | `30` | Chat request timeout (s) |
| `CURRICULUM_TIMEOUT` | `240` | Curriculum gen timeout (s) |
| `LLM_TIMEOUT` | `30` | Chat timeout (s) |

### Frontend (`webapp/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://localhost:5003` | Backend URL |

---

## Code Style

- **TypeScript:** Strict mode. No `any` without justification.
- **Python:** PEP 8. Type hints on function signatures.
- **Commits:** Short, imperative. One logical change per commit.
- **No telemetry:** PRs adding analytics, tracking, or external data collection will be rejected. Non-negotiable.

---

## PR Checklist

- [ ] All 140 tests pass
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] PR description explains what and why
- [ ] Language pack PRs tested through a full lesson locally

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
