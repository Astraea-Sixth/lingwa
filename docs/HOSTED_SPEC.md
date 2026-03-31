# Lingwa Hosted Version — lingwa.world

**Date:** 2026-03-31
**Status:** Planning
**Domain:** lingwa.world

---

## Overview

Same codebase as GitHub self-hosted version. Environment variable (`NEXT_PUBLIC_MODE=hosted`) switches behavior. No fork.

---

## Architecture

| Layer | Self-hosted (GitHub) | Hosted (lingwa.world) |
|---|---|---|
| Frontend | Next.js (localhost) | Next.js (Vercel, free tier) |
| Auth | None (recovery codes) | Supabase Auth (Google + email magic link) |
| Database | SQLite (local file) | Supabase PostgreSQL (free tier) |
| AI Chat | Ollama (local, free) | BYOK — user brings own API key |
| Cost | $0 | $0 (Vercel free + Supabase free) |

---

## Auth Flow

- **Login required** to use the app
- Landing page → Sign up / Log in → Onboarding → Learn
- Supabase Auth: Google sign-in + email magic link
- Progress tied to account (no recovery codes needed on hosted)

---

## AI Chat — Bring Your Own Key (BYOK)

Supported providers:
1. **Anthropic** (Claude)
2. **OpenAI** (GPT-4o)
3. **Google** (Gemini)
4. **Groq** (fast + cheap)

### UX Flow

1. User taps "Talk with tutor" (locked by default)
2. First time: prompt to connect AI provider
   - Pick provider (Anthropic / OpenAI / Google / Groq)
   - Paste API key
   - Link to "How to get an API key" guide for each provider
   - Key saved to their Supabase account (encrypted)
3. After setup: goes straight to chat, key remembered
4. Settings page: change provider, update key, disconnect

### Why BYOK
- Zero AI cost for us
- Users choose their preferred model
- Each provider integration = marketing opportunity

---

## Feedback System

- Auth-gated (must be logged in)
- Feedback page/modal in app
- Stores in Supabase `feedback` table
- Fields: user_id, message, timestamp
- We read from Supabase dashboard
- Email notifications optional (later)

---

## Progress Sync

- All progress stored in Supabase PostgreSQL
- Tables: users, progress, vocabulary, feedback
- localStorage as local cache for speed
- Server is source of truth
- Switch devices → log in → everything's there

---

## What's Locked on Hosted (vs Self-hosted)

| Feature | Self-hosted | Hosted |
|---|---|---|
| Lessons & exercises | ✅ | ✅ |
| Progress & streaks | ✅ (SQLite) | ✅ (Supabase) |
| AI tutor chat | ✅ (Ollama, free) | 🔑 BYOK required |
| Feedback | N/A | ✅ (logged in) |
| Auth | Optional (recovery codes) | Required (Supabase) |

---

## Marketing Plan — LLM Integration Tweets

Space one per week. Tag the provider. Each is a "launch moment."

**Week 1:** "Lingwa now supports Ollama — practice any language with a fully local AI tutor. Free, private, open source 🌍" → @ollaborators

**Week 2:** "Lingwa now supports Claude — practice any language with @AnthropicAI's best model. Bring your API key, start talking 🌍"

**Week 3:** "Lingwa now supports GPT-4o — learn languages with @OpenAI. Just plug in your key 🌍"

**Week 4:** "Lingwa now supports Gemini — @GoogleAI joins the Lingwa family. Any language, any model 🌍"

**Week 5:** "Lingwa now supports Groq — blazing fast language practice with @GroqInc. Sub-second responses 🌍"

**Goal:** Get a like/RT from any provider account → thousands of free eyeballs.

---

## Deployment Steps

1. Buy domain: lingwa.world
2. Create Supabase project (free tier)
3. Set up tables: users, progress, vocabulary, feedback
4. Create Vercel project → connect to github.com/Astraea-Sixth/lingwa
5. Set env vars on Vercel:
   - `NEXT_PUBLIC_MODE=hosted`
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
6. Point lingwa.world DNS to Vercel
7. Update README tagline: "Free forever. Open source. Learn any language."
8. Ship

---

## Cost

| Service | Cost |
|---|---|
| Vercel | Free (hobby tier) |
| Supabase | Free (50K MAU, 500MB DB) |
| Domain | ~$10-30/year |
| AI | $0 (users pay their own API) |
| **Total** | **~$10-30/year** |

---

## Open Questions

- [ ] Encrypt stored API keys in Supabase? (yes, but how — server-side encryption?)
- [ ] Rate limit feedback submissions?
- [ ] Add "report a bug" separate from general feedback?
- [ ] Apple sign-in? (later)

---

*Decided by Z + Astraea, 2026-03-31.*
