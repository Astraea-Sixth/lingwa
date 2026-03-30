# Lingwa — Product Roadmap

**Author:** Astraea  
**Date:** 2026-03-25  
**Status:** Draft v1.0

---

## Vision

The world's best free language learning app. Built for the languages and communities that matter, not just the ones with the biggest markets.

A full learning system — structured curriculum, AI conversation practice, pronunciation scoring — for Thai, Mandarin, Korean, Spanish, English, and every language that matters to people living real lives.

**Free forever. Open source. Built for the person who actually needs this.**

---

## The User We're Building For

**Primary:** English-speaking expat living in Thailand. They need Thai to function — not a hobby, survival. Most apps don't have Thai, and the ones that do cost $80/year and are mediocre. Nothing good exists. That person is our first user.

**Secondary:** Chinese diaspora in Thailand and SEA learning Thai. Huge community, completely underserved. No app teaches Thai with Chinese as the native language.

**Tertiary:** Open source developers, language educators, people who want to self-host for other languages.

---

## Phase 1 — Solid Foundation (NOW → 2 weeks)

**Goal:** A1 Thai + Chinese works flawlessly. Zero bugs. Passes real user testing.

**What ships:**
- ✅ A1 Thai course (300 vocab, 20 lessons, all exercise types)
- ✅ A1 Chinese course (300 vocab, 20 lessons)
- ✅ Gender-aware vocab and exercises throughout
- ✅ Voice chat with Nong (Whisper STT + tone scoring + Ollama feedback)
- ✅ Onboarding: 4 steps, clean, no fake personalisation
- 🔧 All 8 bugs in BUGS.md fixed
- 🔧 A2 track picker built (after A1 complete → choose focus)
- 🔧 Conversation practice unlocks after each unit

**Definition of done:** A user can go through the full A1 Thai flow on iPhone, speak to Nong, get scored, complete all 5 units, see A2 track picker — zero crashes, zero confusion.

**Do NOT ship publicly yet.**

---

## Phase 2 — A2 Content + GitHub Launch (2–4 weeks)

**Goal:** Ship A2 tracks. Clean up everything. Go public on GitHub.

**What ships:**
- A2 Thai: all 6 tracks (food, travel, work, social, romance, general) — content + working UI
- A2 Chinese: same 6 tracks
- Docs cleaned of all Z references and internal notes
- README rewritten as proper marketing copy
- GitHub repo public: github.com/Astraea-Sixth/lingwa
- ProductHunt launch
- Reddit posts: r/Thailand, r/learnthai, r/digitalnomad

**Milestone:** 200 GitHub stars. 500 users who completed at least 1 lesson.

**Community hook:** "I built a free, open source language app that actually teaches you to speak — not just tap answers."

---

## Phase 3 — Growth + Content Engine (1–3 months)

**Goal:** Real users, real feedback, content keeps growing.

**What ships:**
- Streak system — push notifications via PWA
- Community course contributions (anyone can submit a PR with new vocab/exercises)
- More languages: Vietnamese, Malay, Japanese A1
- B1 grammar tracks (for users who've finished A2)
- iOS/Android PWA installable — "Add to Home Screen" flow
- Analytics (privacy-first, self-hosted — Plausible or Umami)
- User testimonials / progress sharing

**Milestone:** 2,000 active users. 5+ languages. First community PR merged.

---

## Phase 4 — Monetisation (3–6 months)

**Goal:** Sustainable without compromising the free core.

**Model:** Core app stays free forever. Premium for power users.

**Premium features (not paywalling basics):**
- **Offline mode** — download a language pack, use without internet
- **Advanced pronunciation analytics** — detailed tone breakdown per word
- **Premium tracks** — Business Thai, Medical Thai, Formal Japanese etc.
- **Progress export** — PDF certificates, Anki deck export
- **Priority support + early access**

**Price:** $5–8/month or $40/year. Affordable for expats, sustainable for us.

**Never paywalled:**
- All A1-A2 content
- Voice chat with AI tutor
- All core exercise types
- Progress tracking

---

## What We're NOT Building

- **No spaced repetition algorithm obsession** — simple completion tracking is enough for A1-A2
- **No social features / leaderboards** — adds complexity, minimal retention benefit at this stage
- **No paid cloud hosting** — runs locally, open source means people self-host
- **No B2C marketing budget** — community and Reddit only until PMF is proven
- **No enterprise deals** — too early, wrong focus

---

## Key Metrics We Care About

| Metric | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Lessons completed | Internal testing | 1,000 | 10,000 |
| GitHub stars | — | 200 | 1,000 |
| Active users (7-day) | 1 (dogfooding) | 100 | 500 |
| Languages available | 2 (TH, ZH) | 2 + A2 | 5+ |
| Bug reports open | 0 | <5 | <10 |

---

## The Honest Risk

The biggest risk isn't competition. It's quality. Every bug that reaches a real user is a person who never comes back. The expat in Bangkok who tries it, gets a crash, closes the tab — they don't give second chances.

Phase 1 exists entirely to eliminate that risk. Ship nothing until it's real.

---

*"Build well enough to attract acquisition interest from a major player in the language learning space."*  
*— One day. But first, ship something worth acquiring.*

---

*Lingwa Roadmap v1.0 — Astraea, 2026-03-25*
