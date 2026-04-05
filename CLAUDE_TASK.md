# Claude Code Task — Lingwa SRS Review System v1.0

## Context
Lingwa is an AI language learning app. You're building the Spaced Repetition (SRS) Review System.
Working directory: /Users/zworkspace/.openclaw/workspace/projects/lingwa/webapp

## Read These First
1. `docs/internal/PRD_srs_v1.0.md` — Feature spec
2. `docs/internal/TECH_DESIGN_srs_v1.0.md` — Architecture + data structures
3. `docs/COURSE_SCHEMA_v2.0.md` — Source of truth, everything derives from this

## What to Build

### 1. `webapp/src/lib/srs.ts` — SM-2 Algorithm (TypeScript port)
- Port `api/services/spaced_rep.py` to TypeScript
- Export: `sm2Update`, `getDueWords`, `getNewWords`, `calculateRetention`
- WordRecord interface as documented in TECH_DESIGN

### 2. `webapp/src/lib/progress.ts` — Add SRS data helpers
- `loadSRSData(langCode)` — read from localStorage
- `saveSRSData(langCode, data)` — write to localStorage
- `getDueWordCount(langCode)` — return count of due words
- `initializeLessonVocab(langCode, lessonId, words)` — init new words after lesson

### 3. `webapp/src/components/ReviewMode.tsx` — Review Session UI
- Shows words due for review using same ExerciseCard UI
- 4 quality buttons: ☹️ Forgot, 😐 Hard, 🙂 Good, 😊 Easy
- Updates SRS data after each exercise
- Completion screen with summary + retention rate
- Mobile-first, 480px max-width, uses existing CSS variables

### 4. `webapp/src/app/[lang]/page.tsx` — Add Review Button
- Check for due words, show button with count
- Navigate to `/ [lang]/review` (create this route)

### 5. `webapp/src/app/[lang]/review/page.tsx` — Review Route
- New page that loads ReviewMode component
- Passes due words from SRS data

### 6. i18n Keys — ALL 20 Language Configs
Add these keys to `webapp/src/lib/i18n.ts` AND `webapp/public/courses/{lang}/config.json` for ALL 20 languages:
- reviewTitle, reviewSubtitle, reviewButton, dueWordCount
- forgotLabel, hardLabel, goodLabel, easyLabel
- reviewSessionComplete, wordsReviewed, wordsMastered, wordsNeedPractice
- retentionRate, reviewStreak, noWordsToReview
- "Hear yourself" in hosted mode context

## Hard Rules
- **Course schema is source of truth** — all vocabulary comes from `languages/{code}/courses/{level}.json`
- **No new exercise types** — reuse existing `target_to_native` and `native_to_target`
- **All i18n keys in BOTH places** — `i18n.ts` AND ALL 20 `config.json` files
- **Do NOT commit or push** — Astraea will test and push after review
- **0 TypeScript errors** — run `tsc --noEmit` in webapp/
- **Test in browser** at localhost:3004 after build

## After Done, Report:
1. Files changed + what each does
2. Decisions made during implementation
3. Any issues or edge cases found
4. tsc result
