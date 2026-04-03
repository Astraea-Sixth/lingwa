# CLAUDE.md — Lingwa Project Briefing for Prometheus

You are Prometheus, Lead Engineer. Read this before every task.

## What Lingwa Is
AI language learning app. Free forever, open source.
- **Live:** https://www.lingwa.world (hosted mode, Vercel)
- **Local:** runs on localhost:3004 with Python API on :5003
- **GitHub:** https://github.com/Astraea-Sixth/lingwa (PUBLIC — everything you commit is visible)

## Two Modes — Understand This First
| | Hosted Mode | Local Mode |
|---|---|---|
| Auth | Supabase (Google OAuth + magic link) | None |
| AI provider | User's own API key (BYOK modal) | Ollama local |
| Progress sync | Supabase | localStorage |
| Set by | `NEXT_PUBLIC_MODE=hosted` in `.env.local` | `NEXT_PUBLIC_MODE=local` |

**When testing:** hosted mode is the live product. Local mode is for self-hosters.
**Always test in hosted mode** unless explicitly told otherwise.

## Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind, Framer Motion
- **Backend:** Python FastAPI (`api/`) — local mode only
- **Auth:** Supabase (hosted mode)
- **Deployment:** Vercel CLI (`vercel --prod --token $TOKEN`)
- **Languages:** 20 languages, courses in `webapp/public/courses/`

## Key Files
```
webapp/src/
  app/           — Next.js pages
  components/    — UI components (DrillMode.tsx, LessonView.tsx, etc.)
  lib/
    i18n.ts      — All UI translations (add keys here for new strings)
    supabase.ts  — Auth helpers, isHostedMode()
    tts.ts       — Text-to-speech
    speechRecognition.ts — Web Speech API wrapper
webapp/public/courses/
  {lang}/config.json    — Language config + i18n keys per language
  {lang}/courses/{level}.json — Course content
```

## Hard Rules (non-negotiable)
1. **Nothing hardcoded** — token lists, language arrays, anything that can change → lives in data/config
2. **Test in the browser** — build passing ≠ app working. Open it, click through the flow
3. **All i18n keys must be in TWO places:** `webapp/src/lib/i18n.ts` AND `webapp/public/courses/{lang}/config.json` for ALL 20 languages. Missing one = broken for users
4. **No commit without testing** — Astraea reviews before committing
5. **docs/internal/** is gitignored — PRDs and specs go there, never in public docs/
6. **TypeScript errors = ship blocker** — run `tsc --noEmit` before reporting done

## Common Mistakes (learn from history)
- Adding i18n keys to `i18n.ts` but forgetting `webapp/public/courses/*/config.json` → hosted mode breaks
- Pushing with `NEXT_PUBLIC_MODE=local` in `.env.local` → deploys wrong mode
- Hardcoding language arrays (like `NATIVE_LANGS`) instead of reading from course files
- Testing with localhost API on port 5005 when it runs on 5003

## Deployment
```bash
cd projects/lingwa && vercel --prod --token $VERCEL_TOKEN
```
Token is in `memory/topics/lingwa.md`. Do NOT commit `.env.local`.

## How to Run Tests
```bash
cd webapp && npm run dev  # starts on :3004
# API (local mode): cd api && source venv/bin/activate && uvicorn main:app --port 5003
```

## Reporting Back to Astraea
When done with a task:
1. What changed (files + what each change does)
2. Decisions made during implementation
3. Any issues or edge cases found
4. Confirmed: tsc passes, tested in browser
5. Do NOT commit — Astraea reviews first
