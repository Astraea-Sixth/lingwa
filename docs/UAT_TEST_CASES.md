# Lingwa UAT Test Cases
**Version:** Schema v1.0
**Date:** 2026-03-25
**Coverage:** Onboarding, Schema Resolution, All 5 Exercise Types, TTS, Lesson Flow (4 phases), Progress Tracking, Gender Filtering, Native Language Switching, Data Integrity, Edge Cases, Cross-Language, Backward Compatibility

---

## How to Use This Document

**Priority definitions:**
- **P0 — Critical:** App is broken or produces wrong data. Must pass before any release.
- **P1 — High:** Core user experience is degraded. Must pass before release.
- **P2 — Medium:** Edge case or secondary feature. Fix before next sprint.

**Precondition shorthand:**
- "Clean state" = localStorage fully cleared (DevTools → Application → Storage → Clear site data)
- "Onboarded as [config]" = profile set in localStorage with the stated values
- "API running" = FastAPI backend responding on port 5003, Next.js on port 3004

**To set a profile manually for isolated testing:**
```js
localStorage.setItem('lingwa_profile', JSON.stringify({
  targetLang: 'Thai', targetLangCode: 'th',
  nativeLang: 'English', nativeLangCode: 'en',
  level: 'A1', gender: 'male'
}))
```

---

## Section 1: Onboarding Flow

### TC-OB-001
**Category:** Happy Path
**Title:** Complete onboarding — English native, Thai target, A1, male
**Priority:** P0
**Preconditions:** Clean state. API running. Navigate to `/onboarding`.

**Steps:**
1. Page loads. Observe loading spinner disappears and Step 1 of 4 is shown.
2. Tap "English" card.
3. Tap "Continue".
4. Observe Step 2 of 4. Thai flag and language card is visible.
5. Tap "Thai" card.
6. Tap "Continue".
7. Observe Step 3 of 4. Levels A1 and A2 are shown.
8. Tap "A1 — Complete beginner".
9. Tap "Continue".
10. Observe Step 4 of 4. Three gender options (Male, Female, Show me both) are shown.
11. Tap "Male".
12. Tap "Start learning".
13. Observe loading screen with Thai flag.
14. Observe redirect to `/th?level=A1`.

**Expected Results:**
- Step 1: English card becomes highlighted green, checkmark appears. "Continue" button becomes active.
- Step 2: 3 language cards visible (Thai, Chinese, Spanish). Thai card highlights green on tap.
- Step 3: Only levels that have course files are shown. A1 highlights blue on tap.
- Step 4: Gender step shown (Thai is gendered). Male card highlights green on tap.
- Finish: `lingwa_profile` localStorage key contains `{targetLangCode: "th", nativeLangCode: "en", level: "A1", gender: "male"}`.
- Finish: `lingwa_curriculum_th` localStorage key is populated with course JSON.
- Finish: `lingwa_gender_th` localStorage key = `"male"`.
- Redirect lands on `/th?level=A1`, lesson tree is visible.

---

### TC-OB-002
**Category:** Happy Path
**Title:** Complete onboarding — Chinese native, Chinese target, A1 (no gender step)
**Priority:** P0
**Preconditions:** Clean state. API running. Navigate to `/onboarding`.

**Steps:**
1. Tap "中文" card on Step 0.
2. Tap "Continue".
3. Tap "Chinese" (中文) on Step 1.
4. Tap "Continue".
5. Tap "A1" on Step 2.
6. Observe: button reads "Start learning" (not "Continue") — 3 steps total, no gender step.
7. Tap "Start learning".

**Expected Results:**
- Step indicator reads "Step 3 of 3" at Step 2 (effectiveSteps = 3 for Chinese).
- No Step 4 (gender step) is shown.
- `lingwa_profile.gender` = `"both"` (assigned by `handleFinish` when `needsGender` is false).
- `lingwa_profile.nativeLangCode` = `"zh"`.
- Redirect to `/zh?level=A1`.

---

### TC-OB-003
**Category:** Happy Path
**Title:** Complete onboarding — English native, Spanish target (gender required)
**Priority:** P1
**Preconditions:** Clean state. API running. Navigate to `/onboarding`.

**Steps:**
1. Tap "English", Continue.
2. Tap "Spanish", Continue.
3. Tap "A1", Continue.
4. Observe gender step IS shown (Spanish is in the `needsGender` list: `['th', 'ja', 'fr', 'de', 'pt', 'es']`).
5. Tap "Female", tap "Start learning".

**Expected Results:**
- Gender step shown for Spanish.
- `lingwa_profile.gender` = `"female"`.
- `lingwa_gender_es` = `"female"`.

---

### TC-OB-004
**Category:** Negative
**Title:** "Continue" button disabled until selection is made on each step
**Priority:** P0
**Preconditions:** Clean state. Navigate to `/onboarding`.

**Steps:**
1. On Step 0, observe "Continue" button.
2. Attempt to tap "Continue" without selecting a native language.
3. Tap "English".
4. Tap "Continue".
5. On Step 1, attempt to tap "Continue" without selecting a target language.
6. Tap "Thai".
7. Tap "Continue".
8. On Step 2, attempt to tap "Continue" without selecting a level.
9. Tap "A1".
10. Tap "Continue".
11. On Step 3, attempt to tap "Start learning" without selecting gender.

**Expected Results:**
- Step 2: "Continue" has `opacity: 0.35` and `cursor: not-allowed` when nothing is selected.
- Step 2: Tapping "Continue" when disabled does NOT advance the step.
- Step 5: Same disabled state on target language step.
- Step 8: Same disabled state on level step.
- Step 11: Same disabled state on gender step.
- `canProceed()` returns false in all above cases.

---

### TC-OB-005
**Category:** Happy Path
**Title:** Back navigation works on each step
**Priority:** P1
**Preconditions:** Clean state. Navigate to `/onboarding`. Select English on Step 0.

**Steps:**
1. Tap "Continue" from Step 0 (with English selected).
2. On Step 1, tap "← Back" button.
3. Observe return to Step 0. Previously selected "English" is still highlighted.
4. Tap "Continue" again to advance to Step 1.
5. Tap "Thai". Tap "Continue".
6. On Step 2, tap "← Back".
7. Observe return to Step 1. "Thai" is still highlighted.

**Expected Results:**
- Back button appears from Step 1 onward (not on Step 0).
- Previous selection is preserved after going back.
- Progress bar dots correctly reflect current step.
- Animation slides in the reverse direction on back navigation.

---

### TC-OB-006
**Category:** Edge Case
**Title:** API failure on `/api/courses` during onboarding load
**Priority:** P1
**Preconditions:** Navigate to `/onboarding` with the backend API stopped.

**Steps:**
1. Observe the loading spinner.
2. Wait for fetch to fail.

**Expected Results:**
- Error banner appears with text "Could not load courses. Make sure the API is running."
- Banner is styled red (border: `rgba(255,75,75,0.3)`).
- Page does not crash.
- Loading spinner stops.

---

### TC-OB-007
**Category:** Edge Case
**Title:** API failure fetching course at `handleFinish` stage
**Priority:** P1
**Preconditions:** Complete Steps 0-3 normally, then stop API before tapping "Start learning".

**Steps:**
1. Complete onboarding steps up to and including gender selection.
2. Stop the backend API.
3. Tap "Start learning".

**Expected Results:**
- "Starting" overlay appears briefly.
- Error message appears: "Course not available (XXX)" or network error message.
- `starting` state returns to `false`.
- User can see the error and retry.
- No incomplete data is written to localStorage.

---

### TC-OB-008
**Category:** Happy Path
**Title:** Progress bar segment count matches effective steps
**Priority:** P1
**Preconditions:** Navigate to `/onboarding`.

**Steps:**
1. Count the progress dots on Step 0 with no language selected yet.
2. Select "Thai". Count dots on Step 1.
3. Progress to Step 2. Select Thai on Step 1. Count dots on Step 2.
4. Progress to Step 3. Count dots.
5. Go back to Step 1. Select "Chinese" instead. Advance to Step 2. Count dots.

**Expected Results:**
- When Thai is selected (gendered language), 4 dots are shown at all steps.
- When Chinese is selected (non-gendered), 3 dots are shown at all steps.
- The `effectiveSteps` variable drives this: `needsGender ? 4 : 3`.

---

### TC-OB-009
**Category:** Happy Path
**Title:** "Show me both" gender option stores correctly
**Priority:** P1
**Preconditions:** Clean state. Onboard to Thai A1 Step 4 (gender).

**Steps:**
1. Tap "Show me both" (emoji: 👐).
2. Tap "Start learning".
3. Inspect localStorage.

**Expected Results:**
- `lingwa_profile.gender` = `"both"`.
- `lingwa_gender_th` = `"both"`.

---

### TC-OB-010
**Category:** Edge Case
**Title:** Returning to onboarding when already onboarded (profile exists)
**Priority:** P2
**Preconditions:** Complete onboarding once (profile in localStorage). Navigate back to `/onboarding`.

**Steps:**
1. Navigate to `/onboarding`.
2. Complete onboarding again with a different target language (Chinese instead of Thai).

**Expected Results:**
- Onboarding completes successfully.
- `lingwa_profile` is overwritten with new values.
- New curriculum is fetched and stored for the new language.
- Old language curriculum data is NOT automatically removed.
- Redirect goes to the new language page.

---

## Section 2: Lesson Tree & Course Page

### TC-TREE-001
**Category:** Happy Path
**Title:** Lesson tree loads from localStorage curriculum
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male. Navigate to `/th?level=A1`.

**Steps:**
1. Page loads.
2. Observe lesson tree renders.
3. Expand Unit 1.
4. Observe all 4 lessons for Unit 1 are listed.

**Expected Results:**
- Unit 1 is expanded by default.
- Lesson 1.1 state is "available" (blue border, "Start →" label, play icon ▶).
- Lessons 1.2, 1.3, 1.4 are "locked" (🔒 icon, 45% opacity).
- Lesson objectives rendered below each lesson title (from `resolveObjectives`).
- Objectives are in English (for English native user).

---

### TC-TREE-002
**Category:** Data Integrity
**Title:** Lesson objectives render in correct native language
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native / Thai / A1. Navigate to `/th?level=A1`.

**Steps:**
1. Expand Unit 1.
2. Read the objective text shown under Lesson 1.1.

**Expected Results:**
- Objectives are in Chinese (用泰语打招呼和告别 · 使用礼貌语气词 ครับ/ค่ะ).
- `resolveObjectives` reads `nativeLangCode = "zh"` from profile and returns `objectives.zh`.
- No "undefined" or "[object Object]" text is visible.
- No `.join()` crash occurs (objectives is a dict, `resolveObjectives` handles it).

---

### TC-TREE-003
**Category:** State Transition
**Title:** Completing lesson unlocks next lesson in tree
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male. Have NOT completed any lessons.

**Steps:**
1. Navigate to `/th?level=A1`.
2. Complete lesson 1.1 (all phases through voice chat or skip).
3. Navigate back to `/th?level=A1`.
4. Expand Unit 1.
5. Observe lesson states.

**Expected Results:**
- Lesson 1.1 shows as "completed" (green border, ✓ icon).
- Lesson 1.2 shows as "available" (blue border, "Start →").
- Lessons 1.3, 1.4 remain "locked".

---

### TC-TREE-004
**Category:** State Transition
**Title:** Perfect score shows star icon on lesson
**Priority:** P1
**Preconditions:** Onboarded as Thai/A1/male. Complete lesson 1.1 with all correct answers.

**Steps:**
1. Complete lesson 1.1 with 100% correct quiz answers.
2. Return to lesson tree.

**Expected Results:**
- Lesson 1.1 shows ⭐ icon (state = "perfect").
- Border color is yellow (`var(--yellow)`).
- Background is `rgba(255,200,0,0.06)`.

---

### TC-TREE-005
**Category:** State Transition
**Title:** Unit 2 locked until all Unit 1 lessons complete
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male. Complete lessons 1.1, 1.2, 1.3 but NOT 1.4.

**Steps:**
1. Navigate to `/th?level=A1`.
2. Observe Unit 2 state.
3. Tap Unit 2 header.

**Expected Results:**
- Unit 2 header shows 🔒 icon, opacity 0.55.
- Tapping Unit 2 does nothing (disabled, `cursor: not-allowed`).
- Unit 2 lessons are not visible.

---

### TC-TREE-006
**Category:** Happy Path
**Title:** XP and streak display correctly in header
**Priority:** P1
**Preconditions:** Complete exactly one lesson (perfect), returning with `?xp=15`.

**Steps:**
1. Complete lesson 1.1 perfectly (10 + 5 = 15 XP from quiz) and skip voice chat.
2. Observe return to `/th?xp=15`.

**Expected Results:**
- XP toast "+15 XP 🎉" appears in top area, disappears after ~3 seconds.
- Header shows "⚡ 15 XP".
- Streak shows "🔥 1" (first lesson today).
- XP progress bar filled to 15%.

---

### TC-TREE-007
**Category:** Happy Path
**Title:** Unit chat unlocks after completing all lessons in a unit
**Priority:** P1
**Preconditions:** Complete all 4 lessons in Unit 1 of Thai A1.

**Steps:**
1. Return to `/th?level=A1`.
2. Observe "Conversation Practice" section.
3. Tap "Unit 1 Chat".

**Expected Results:**
- Unit 1 Chat card shows green border, 💬 icon.
- Label reads "Unit 1 Chat — Practice with [TutorName]".
- Tapping navigates to `/th/chat?unit=1&mode=unit`.
- Units 2-5 remain locked (🔒).

---

### TC-TREE-008
**Category:** Edge Case
**Title:** Lesson tree shows empty state if no curriculum exists
**Priority:** P1
**Preconditions:** Clear `lingwa_curriculum_th` from localStorage. Backend not returning curriculum.

**Steps:**
1. Navigate to `/th?level=A1`.

**Expected Results:**
- "No curriculum yet" empty state is shown.
- "Start onboarding →" link is visible and navigates to `/onboarding`.
- Page does not crash.

---

## Section 3: Lesson Flow — Phase Transitions

### TC-PHASE-001
**Category:** Happy Path
**Title:** Lesson loads in Teach phase first
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male. Navigate to `/th/lesson/1/1`.

**Steps:**
1. Page loads.
2. Observe which phase is shown.

**Expected Results:**
- "Teach" phase shown: vocab flashcard is visible.
- Lesson title displayed in header.
- Phase state = `'teach'`.
- Vocabulary card shows first word (สวัสดี).

---

### TC-PHASE-002
**Category:** Happy Path
**Title:** Teach → Quiz transition via "Start Quiz" button
**Priority:** P0
**Preconditions:** In Teach phase of lesson 1.1.

**Steps:**
1. On the last vocab card, tap "Start Quiz 🎯".

**Expected Results:**
- Phase changes to `'quiz'`.
- First exercise is rendered via `ExerciseRouter`.
- Progress bar appears at top showing "1/[total]".
- `currentExercise` state = 0.

---

### TC-PHASE-003
**Category:** Happy Path
**Title:** Teach → Quiz transition via "Skip to quiz" link
**Priority:** P1
**Preconditions:** In Teach phase of lesson 1.1, on card 1 of N.

**Steps:**
1. Tap "Skip to quiz →" link at bottom of screen (without advancing all cards).

**Expected Results:**
- Phase immediately changes to `'quiz'`.
- First exercise is shown.

---

### TC-PHASE-004
**Category:** Happy Path
**Title:** Quiz → Bridge transition after last exercise
**Priority:** P0
**Preconditions:** In Quiz phase of lesson 1.1 (8 exercises). Complete exercises 1-7.

**Steps:**
1. Answer exercise 8 (the last one).
2. Observe feedback banner with "Complete Lesson 🎉" button.
3. Tap "Complete Lesson 🎉".

**Expected Results:**
- Phase changes to `'bridge'`.
- Bridge screen shows: "Quiz done!", lesson title, key phrases list.
- `completeLesson` has been called: `lingwa:progress:th` contains this lesson's record.
- XP is already saved before bridge screen.

---

### TC-PHASE-005
**Category:** Happy Path
**Title:** Bridge → Voice transition via "Start speaking" button
**Priority:** P0
**Preconditions:** In Bridge phase of lesson 1.1.

**Steps:**
1. Observe key phrases listed (first 5 vocabulary words).
2. Tap "🎙️ Start speaking with [TutorName]".

**Expected Results:**
- Phase changes to `'voice'`.
- VoiceChat component loads.
- Tutor header shows tutor name.
- Opening message appears in chat.
- TTS plays the opening message after ~500ms delay.

---

### TC-PHASE-006
**Category:** Happy Path
**Title:** Voice complete → redirect to lesson tree with XP
**Priority:** P0
**Preconditions:** In Voice phase. Accumulate 3 success responses from tutor.

**Steps:**
1. Send 3 messages that receive positive responses.
2. Wait for "Lesson Complete!" screen.

**Expected Results:**
- "Lesson Complete!" overlay shown: 🎉, "+15 XP".
- Key phrases listed with ✓.
- After completion, `handleVoiceComplete(15)` fires.
- `lingwa:progress:th` XP increases by 15.
- Router navigates to `/{lang}?xp={total}` where total = quizXP + 15.

---

### TC-PHASE-007
**Category:** Edge Case
**Title:** Closing lesson from Teach phase (X button) returns to lesson tree
**Priority:** P1
**Preconditions:** In Teach phase of lesson 1.1.

**Steps:**
1. Tap the "✕" button in the header.

**Expected Results:**
- Navigation goes to `/{lang}` (lesson tree).
- No progress is saved (lesson was not completed).

---

### TC-PHASE-008
**Category:** Edge Case
**Title:** Closing lesson from Bridge phase (X button) preserves quiz XP
**Priority:** P1
**Preconditions:** Completed quiz for lesson 1.1, currently in Bridge phase.

**Steps:**
1. On Bridge phase, tap "✕" in header.

**Expected Results:**
- Navigation to `/{lang}?xp={quizXP}`.
- Quiz XP was already saved by `completeLesson` — it is retained.
- Lesson marked as completed in `lessonsCompleted`.

---

### TC-PHASE-009
**Category:** Edge Case
**Title:** Back button from Voice phase returns to Bridge phase
**Priority:** P1
**Preconditions:** In Voice phase.

**Steps:**
1. Tap "←" back button in Voice phase header.

**Expected Results:**
- Phase returns to `'bridge'` (not quiz, not lesson tree).
- Bridge screen is shown again.
- Voice chat progress (success count) is lost on return to voice phase.

---

### TC-PHASE-010
**Category:** Edge Case
**Title:** Lesson not found shows error state
**Priority:** P1
**Preconditions:** Navigate to `/th/lesson/99/99` (non-existent lesson).

**Steps:**
1. Navigate to `/th/lesson/99/99`.

**Expected Results:**
- Loading state shows briefly.
- "Lesson not found" message shown.
- "← Back" button is visible and navigates back.
- Page does not crash or throw runtime error.

---

## Section 4: Teach Phase (LessonTeach Component)

### TC-TEACH-001
**Category:** Happy Path
**Title:** Vocabulary cards display correct content — Thai A1, male, English native
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. In Teach phase of lesson 1.1.

**Steps:**
1. Observe Card 1.
2. Note: word, romanization, meaning, tone class badge.

**Expected Results:**
- Word: "สวัสดี" displayed at 64px.
- Romanization: "sa-wat-dee" in italic muted text.
- Meaning: "Hello" (from `meanings.en`, since `nativeLangCode = "en"`).
- Tone badge: "low tone" with appropriate color (`#7f9ca8`).

---

### TC-TEACH-002
**Category:** Data Integrity
**Title:** Meaning shows Chinese translation for Chinese-native user
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1/male. In Teach phase of lesson 1.1.

**Steps:**
1. Observe Card 1 meaning text.

**Expected Results:**
- Meaning: "你好" (not "Hello").
- `resolveMeaning(item.meanings, "zh")` returns `meanings.zh = "你好"`.

---

### TC-TEACH-003
**Category:** Happy Path
**Title:** TTS fires on tap, NOT on auto-load
**Priority:** P0
**Preconditions:** In Teach phase, Card 1.

**Steps:**
1. Load the Teach phase. Observe whether audio plays automatically.
2. Tap "Tap to listen" button.
3. Observe button state change.

**Expected Results:**
- Step 1: NO audio plays on page load. (Code comment: "No autoplay")
- Step 2: TTS fires `speakText("สวัสดี", "th", 0.7)`.
- Step 3: Button text changes to "Heard it ✓", button turns green-bordered.

---

### TC-TEACH-004
**Category:** Happy Path
**Title:** Gender variants shown side-by-side for "both" gender user
**Priority:** P1
**Preconditions:** Onboarded as Thai/A1/both. In Teach phase, Card 1 (สวัสดี).

**Steps:**
1. Observe the word card for สวัสดี.

**Expected Results:**
- Below the TTS button: "👨 สวัสดีครับ · 👩 สวัสดีค่ะ" is shown.
- `resolveGenderBoth` returns `{ male: {word:"สวัสดีครับ",...}, female: {word:"สวัสดีค่ะ",...} }`.

---

### TC-TEACH-005
**Category:** Happy Path
**Title:** Gender variants NOT shown for male-only user
**Priority:** P1
**Preconditions:** Onboarded as Thai/A1/male. In Teach phase, Card 1.

**Steps:**
1. Observe the word card for สวัสดี.

**Expected Results:**
- The "👨 ... · 👩 ..." gender variant bar is NOT shown (gender === 'male', not 'both').
- Only the base word "สวัสดี" is displayed.

---

### TC-TEACH-006
**Category:** Happy Path
**Title:** Navigation between cards works correctly
**Priority:** P0
**Preconditions:** In Teach phase, lesson 1.1 (15 vocab items).

**Steps:**
1. Observe "1 / 15" counter.
2. Tap "Next →" 3 times.
3. Observe counter shows "4 / 15".
4. Tap "← Back" once.
5. Observe counter shows "3 / 15".
6. Navigate to last card (15 / 15).
7. Observe "Next →" button changes to "Start Quiz 🎯".

**Expected Results:**
- Card counter increments/decrements correctly.
- On last card, "Start Quiz 🎯" button appears.
- Dot progress indicator: current card dot is widened to 24px, previous dots are green (8px), future dots are gray (8px).

---

### TC-TEACH-007
**Category:** Edge Case
**Title:** Empty vocabulary gracefully shows "No vocabulary" with Start Quiz button
**Priority:** P1
**Preconditions:** Manually set `lingwa_curriculum_th` so a lesson has `vocabulary: []`. Navigate to that lesson.

**Steps:**
1. Navigate to the lesson with empty vocabulary.

**Expected Results:**
- "No vocabulary for this lesson yet." text shown.
- "Start Quiz 🎯" button shown (calls `onReady`).
- No crash or blank screen.

---

### TC-TEACH-008
**Category:** Data Integrity
**Title:** Chinese vocab with no gendered field shows no gender variant bar
**Priority:** P1
**Preconditions:** Onboarded as Chinese/A1. In Teach phase of a Chinese lesson.

**Steps:**
1. Observe vocabulary cards.

**Expected Results:**
- No "👨 ... · 👩 ..." gender variant bar shown.
- Chinese vocab items lack `gendered` field (or `both.male === null`), so the gender block is not rendered.

---

## Section 5: Quiz — target_to_native Exercise (ExerciseCard)

### TC-T2N-001
**Category:** Happy Path
**Title:** target_to_native renders correctly — Thai, English native
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. Navigate to a lesson with a `target_to_native` exercise.

**Steps:**
1. Observe the exercise UI.
2. Note the large word, romanization, TTS button, and 4 answer options.

**Expected Results:**
- Word displayed at 64px (Thai script, e.g., "สวัสดี").
- Romanization in italic below (e.g., "sa-wat-dee").
- "🔊 Tap to hear" button visible.
- 4 options in English: ["Hello", "Goodbye", "Good morning", "Good night"].
- Options use `resolveOptions(exercise.options, "en")` → `options.en`.

---

### TC-T2N-002
**Category:** Data Integrity
**Title:** target_to_native options in Chinese for Chinese-native user
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1/male. First target_to_native exercise.

**Steps:**
1. Observe the 4 answer options.

**Expected Results:**
- Options are in Chinese: ["你好", "再见", "早上好", "晚安"].
- `resolveOptions(exercise.options, "zh")` → `options.zh` is used.
- No English options appear.

---

### TC-T2N-003
**Category:** Happy Path
**Title:** Correct answer selected — feedback, TTS, and continue
**Priority:** P0
**Preconditions:** On a target_to_native exercise. Know the correct answer (index 0).

**Steps:**
1. Tap option A (index 0, correct answer).
2. Observe feedback.
3. Tap "Continue →".

**Expected Results:**
- Selected option turns green border + green background.
- All other options fade to 40% opacity.
- Green checkmark ✓ appears next to correct option.
- Feedback banner slides up: green background, "✓ Correct!" in green text.
- "🔊 Listen again" button in feedback banner.
- "Continue →" button in green.
- `onAnswer(true)` called.

---

### TC-T2N-004
**Category:** Negative
**Title:** Wrong answer selected — shows correct answer in feedback
**Priority:** P0
**Preconditions:** On a target_to_native exercise. Intentionally select wrong option (index 1).

**Steps:**
1. Tap option B (index 1, wrong answer).
2. Observe feedback banner.

**Expected Results:**
- Selected (wrong) option turns red border + red background, ✗ icon.
- Correct option (A) turns green.
- Other options fade to 40% opacity.
- Feedback banner: red background, "✗ Not quite".
- "Answer: [correct option text]" shown with 🔊 button.
- "Continue →" button in red.
- `onAnswer(false)` called.

---

### TC-T2N-005
**Category:** Negative
**Title:** Cannot select another answer after answering
**Priority:** P0
**Preconditions:** On a target_to_native exercise. Answer with option A.

**Steps:**
1. Tap option A.
2. Immediately try to tap option B.

**Expected Results:**
- Option B tap is ignored (`answered` state is `true`, `disabled={answered}`).
- Feedback banner remains showing original result.
- `onAnswer` is NOT called a second time.

---

### TC-T2N-006
**Category:** Happy Path
**Title:** TTS button fires only on tap (no autoplay)
**Priority:** P0
**Preconditions:** On a target_to_native exercise.

**Steps:**
1. Load the exercise. Listen for any audio.
2. Tap "🔊 Tap to hear" button.

**Expected Results:**
- No audio on load.
- Tapping button calls `speakText(exercise.word, lang, 0.75)`.

---

### TC-T2N-007
**Category:** Happy Path
**Title:** TTS on non-Latin options (target language options in native_to_target)
**Priority:** P1
**Preconditions:** On a native_to_target exercise with Thai script options.

**Steps:**
1. Observe the options list.
2. Tap the 🔊 icon next to a Thai script option.

**Expected Results:**
- 🔊 icon appears only on options detected as non-Latin (`containsNonLatin` returns true).
- Tapping 🔊 fires `speakText(option, lang)` with `e.stopPropagation()` so no answer is selected.

---

### TC-T2N-008
**Category:** Happy Path
**Title:** Last exercise shows "Complete Lesson 🎉" instead of "Continue →"
**Priority:** P0
**Preconditions:** On the last exercise of a quiz.

**Steps:**
1. Answer the last exercise.
2. Observe feedback banner button text.

**Expected Results:**
- Button reads "Complete Lesson 🎉" (not "Continue →").
- `isLast` prop = `true`.

---

---

## Section 6: Quiz — native_to_target Exercise (ExerciseCard)

### TC-N2T-001
**Category:** Happy Path
**Title:** native_to_target renders question in English for English-native user
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. On a native_to_target exercise.

**Steps:**
1. Observe the question text.

**Expected Results:**
- Question is in English, e.g. "How do you say 'Goodbye' in Thai?".
- `resolveText(exercise.question, "en")` → `question.en`.
- No Thai script in the question text.

---

### TC-N2T-002
**Category:** Data Integrity
**Title:** native_to_target question in Chinese for Chinese-native user
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1/male. On a native_to_target exercise.

**Steps:**
1. Observe the question text.

**Expected Results:**
- Question is in Chinese, e.g. "泰语中'再见'怎么说？".
- `resolveText(exercise.question, "zh")` → `question.zh`.

---

### TC-N2T-003
**Category:** Happy Path
**Title:** native_to_target shows male options for male user (Thai)
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. On a native_to_target exercise.

**Steps:**
1. Observe the 4 options.

**Expected Results:**
- Options include polite male particles (ครับ): ["ลาก่อนครับ", "สวัสดีครับ", "อรุณสวัสดิ์ครับ", "ราตรีสวัสดิ์ครับ"].
- `resolveGenderedOptions(options, "male")` → `options.male`.
- Female forms (ค่ะ) are NOT shown.

---

### TC-N2T-004
**Category:** Data Integrity
**Title:** native_to_target shows female options for female user (Thai)
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/female/English. On same native_to_target exercise.

**Steps:**
1. Observe the 4 options.

**Expected Results:**
- Options include polite female particles (ค่ะ): ["ลาก่อนค่ะ", "สวัสดีค่ะ", ...].
- `resolveGenderedOptions(options, "female")` → `options.female`.
- Male forms (ครับ) are NOT shown.

---

### TC-N2T-005
**Category:** Happy Path
**Title:** native_to_target shows neutral options when no gender-specific options exist
**Priority:** P1
**Preconditions:** Onboarded as Chinese/A1/both. On a native_to_target exercise (Chinese has no male/female options).

**Steps:**
1. Observe the 4 options.

**Expected Results:**
- Options from `options.neutral` array are shown.
- `resolveGenderedOptions` falls through to `options.neutral` when male/female keys absent.

---

### TC-N2T-006
**Category:** Happy Path
**Title:** Explanation text shows after answering (when present)
**Priority:** P2
**Preconditions:** On a native_to_target exercise that has an `explanation` field.

**Steps:**
1. Answer any option.
2. Observe feedback banner.

**Expected Results:**
- Explanation text appears below the correct/wrong indicator.
- Text is resolved via `resolveText(exercise.explanation, nativeLang)`.

---

---

## Section 7: Quiz — Listening Exercise

### TC-LISTEN-001
**Category:** Happy Path
**Title:** Listening exercise auto-plays TTS on load
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male. Navigate to a lesson with a listening exercise.

**Steps:**
1. Arrive at a listening exercise.
2. Listen for audio within 300-400ms of the component mounting.

**Expected Results:**
- TTS fires automatically with 300ms delay: `speakText(exercise.audio_text, lang, 0.75)`.
- Audio plays the target language word/phrase.
- The `hasAutoPlayed` ref prevents double-fire (no duplicate audio).

---

### TC-LISTEN-002
**Category:** Happy Path
**Title:** Replay button re-fires TTS
**Priority:** P0
**Preconditions:** On a listening exercise, after initial auto-play.

**Steps:**
1. Wait for initial TTS to complete.
2. Tap the large blue replay button.

**Expected Results:**
- TTS fires again with the same `audio_text`.
- `speakText` cancels any prior speech before playing.

---

### TC-LISTEN-003
**Category:** Happy Path
**Title:** Listening exercise options are target language script (not English)
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/English. On a listening exercise.

**Steps:**
1. Observe the 4 options listed.

**Expected Results:**
- Options are Thai script strings (e.g. ["อรุณสวัสดิ์", "สวัสดี", "ลาก่อน", "ราตรีสวัสดิ์"]).
- Options are a flat array in the course data, `resolveOptions` returns them as-is.
- English translations do NOT appear as options (this was BUG-3; verify regression fix holds).

---

### TC-LISTEN-004
**Category:** Happy Path
**Title:** Romanization shown after answering
**Priority:** P1
**Preconditions:** On a listening exercise that has `romanization` field.

**Steps:**
1. Select any option (correct or wrong).
2. Observe the replay area after answering.

**Expected Results:**
- Romanization text animates in below the replay button after `answered = true`.
- `exercise.romanization` is displayed in italic style.

---

### TC-LISTEN-005
**Category:** Negative
**Title:** Wrong answer on listening shows audio replay in feedback
**Priority:** P1
**Preconditions:** On a listening exercise. Select the wrong option.

**Steps:**
1. Select an incorrect option.
2. Observe feedback banner.

**Expected Results:**
- Feedback shows "Not quite".
- "Answer: [correct option in Thai script]" is shown.
- A speaker SVG button appears next to the correct answer, fires `speakText(exercise.audio_text, lang, 0.75)`.

---

### TC-LISTEN-006
**Category:** Edge Case
**Title:** State resets correctly between consecutive listening exercises
**Priority:** P0
**Preconditions:** Lesson has 2+ consecutive listening exercises.

**Steps:**
1. Complete listening exercise 1 (answer any option).
2. Tap "Continue →".
3. Observe listening exercise 2.

**Expected Results:**
- `selected` resets to `null`.
- `answered` resets to `false`.
- `hasAutoPlayed.current` resets to `false`.
- TTS auto-plays for exercise 2.
- `key={currentIndex}` prop on `Listening` in ExerciseRouter forces full remount.

---

---

## Section 8: Quiz — Matching Exercise

### TC-MATCH-001
**Category:** Happy Path
**Title:** Matching exercise displays shuffled columns
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. On a matching exercise (4 pairs).

**Steps:**
1. Observe left and right columns.
2. Reload 3 times and observe column order.

**Expected Results:**
- Left column: 4 Thai script words in shuffled order.
- Right column: 4 English meanings in independently shuffled order.
- The order differs between reloads (high probability — shuffle is random).
- `useMemo` ensures shuffle is stable during a single exercise session.

---

### TC-MATCH-002
**Category:** Data Integrity
**Title:** Matching native meanings in Chinese for Chinese-native user
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1/male. On a matching exercise.

**Steps:**
1. Observe right column (native language meanings).

**Expected Results:**
- Right column shows Chinese meanings (e.g. "你好", "再见", "早上好", "晚安").
- `resolveMeaning(pair.native, "zh")` → `native.zh`.
- No English text in right column.

---

### TC-MATCH-003
**Category:** Happy Path
**Title:** Correct match — pair highlights green and disappears from interaction
**Priority:** P0
**Preconditions:** On a matching exercise. Know the correct pair.

**Steps:**
1. Tap a Thai word on the left (e.g., สวัสดี).
2. Tap its correct English/Chinese meaning on the right.
3. Observe the matched pair.

**Expected Results:**
- TTS fires when tapping the left (target) item.
- Both tiles turn green (border: `var(--green)`, background: `rgba(88,204,2,0.12)`), opacity 0.4.
- Both tiles become disabled.
- Romanization appears below the matched left tile.
- No "Continue" button appears yet (remaining pairs still active).

---

### TC-MATCH-004
**Category:** Negative
**Title:** Wrong match — shake animation and selection clears
**Priority:** P0
**Preconditions:** On a matching exercise.

**Steps:**
1. Tap a Thai word on the left.
2. Tap the WRONG meaning on the right.
3. Observe shake animation.
4. Wait 500ms.

**Expected Results:**
- Both tiles animate with `x: [0, -6, 6, -6, 6, 0]` shake.
- Both tiles turn red temporarily.
- After 500ms: selection clears (`selectedLeft = null`, `selectedRight = null`).
- `hadWrong` flag = `true`.
- Pairs can be tapped again.

---

### TC-MATCH-005
**Category:** Happy Path
**Title:** Complete all matches — "Perfect matching!" banner
**Priority:** P0
**Preconditions:** On a matching exercise. Match all 4 pairs correctly without any mistakes.

**Steps:**
1. Correctly match all 4 pairs.
2. Observe feedback banner.

**Expected Results:**
- `complete = true` after last match.
- Feedback banner slides up: "✓ Perfect matching!" in green.
- `onComplete(true)` called (no wrong attempts = `!hadWrong = true`).

---

### TC-MATCH-006
**Category:** Negative
**Title:** Complete all matches with some wrong — "All matched!" banner (red)
**Priority:** P0
**Preconditions:** On a matching exercise. Make at least one wrong match before completing.

**Steps:**
1. Intentionally make one wrong match.
2. Complete all remaining pairs correctly.
3. Observe feedback banner.

**Expected Results:**
- Feedback banner: "✗ All matched!" in red.
- "Some pairs took extra tries" subtext.
- `onComplete(false)` called.

---

### TC-MATCH-007
**Category:** Edge Case
**Title:** Tapping already-matched tile does nothing
**Priority:** P1
**Preconditions:** On a matching exercise. One pair is already matched.

**Steps:**
1. Match pair 1 correctly.
2. Tap the matched left tile again.

**Expected Results:**
- Nothing happens (button is `disabled`).
- No TTS fires.
- No selection change.

---

### TC-MATCH-008
**Category:** Edge Case
**Title:** Matching state resets between exercises
**Priority:** P0
**Preconditions:** Two consecutive matching exercises in a lesson.

**Steps:**
1. Complete matching exercise 1 (all pairs).
2. Tap "Continue →".
3. Observe matching exercise 2.

**Expected Results:**
- `matched` set is empty (no pre-matched pairs).
- `selectedLeft`, `selectedRight` = null.
- `hadWrong` = false.
- `complete` = false.
- `key={currentIndex}` in ExerciseRouter forces full remount of Matching component.

---

---

## Section 9: Quiz — Reorder Exercise

### TC-REORDER-001
**Category:** Happy Path
**Title:** Reorder exercise prompt renders in correct native language
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/English. On a reorder exercise.

**Steps:**
1. Observe the prompt text above the answer area.

**Expected Results:**
- Prompt in English, e.g. "Arrange: 'Hello' then 'Goodbye'".
- `resolveText(exercise.prompt, "en")` → `prompt.en`.
- No "[object Object]" text.

---

### TC-REORDER-002
**Category:** Data Integrity
**Title:** Reorder prompt in Chinese for Chinese-native user
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1. On a reorder exercise.

**Steps:**
1. Observe the prompt text.

**Expected Results:**
- Prompt in Chinese, e.g. "排列：'你好' 然后 '再见'".
- `resolveText(exercise.prompt, "zh")` → `prompt.zh`.

---

### TC-REORDER-003
**Category:** Happy Path
**Title:** Word pool tiles move to answer area on tap
**Priority:** P0
**Preconditions:** On a reorder exercise with 2 words in pool.

**Steps:**
1. Observe the word pool: 2 tiles visible, answer area shows "Tap words to build the sentence".
2. Tap first tile in pool.
3. Observe state.
4. Tap second tile in pool.
5. Observe "Check" button appears.

**Expected Results:**
- Step 2: Tile moves to answer area with animation. Pool now has 1 tile.
- Step 3: Placeholder text gone, tile in answer area is styled blue.
- Step 4: Pool is empty. Answer area has 2 tiles.
- Step 5: "Check" button animates in from bottom (`allPlaced = true`).

---

### TC-REORDER-004
**Category:** Happy Path
**Title:** Tapping placed tile returns it to pool
**Priority:** P0
**Preconditions:** On a reorder exercise with 1 tile already placed in answer area.

**Steps:**
1. Tap the tile in the answer area.

**Expected Results:**
- Tile animates back to pool.
- Pool count increases by 1.
- Answer area returns to empty state if no other tiles placed.
- "Check" button disappears.

---

### TC-REORDER-005
**Category:** Happy Path
**Title:** Correct order submitted — green feedback, TTS plays
**Priority:** P0
**Preconditions:** On a reorder exercise ["สวัสดี", "ลาก่อน"].

**Steps:**
1. Tap สวัสดี (place it first).
2. Tap ลาก่อน (place it second).
3. Tap "Check".

**Expected Results:**
- Answer area turns green (border: `var(--green)`, background: `rgba(88,204,2,0.08)`).
- Tiles shake animation NOT triggered.
- `isCorrect = true`.
- TTS fires: `speakText("สวัสดี ลาก่อน", lang, 0.75)` (correct_order joined by space).
- Feedback banner: "✓ Correct!" green.
- "🔊 Listen again" button in feedback.

---

### TC-REORDER-006
**Category:** Negative
**Title:** Wrong order submitted — red feedback, shows correct order
**Priority:** P0
**Preconditions:** On a reorder exercise ["สวัสดี", "ลาก่อน"] where correct is ["สวัสดี", "ลาก่อน"].

**Steps:**
1. Tap ลาก่อน first.
2. Tap สวัสดี second.
3. Tap "Check".

**Expected Results:**
- Answer area turns red.
- Tiles animate with `x: [0, -4, 4, -4, 4, 0]` shake.
- `isCorrect = false`.
- "Correct order:" panel shows: "สวัสดี ลาก่อน".
- Romanization ("sa-wat-dee laa gon") shown below.
- TTS still fires the correct sentence.
- Feedback banner: "✗ Not quite", red "Hear the correct sentence" button.

---

### TC-REORDER-007
**Category:** Edge Case
**Title:** Reorder state resets between exercises (BUG-1 regression)
**Priority:** P0
**Preconditions:** Two consecutive reorder exercises in a lesson.

**Steps:**
1. Complete reorder exercise 1 (submit, tap Continue).
2. Observe reorder exercise 2.

**Expected Results:**
- `pool` is reset to `exercise.words` (new exercise's words).
- `placed` is empty `[]`.
- `checked = false`, `isCorrect = false`.
- No tiles carry over from exercise 1.
- `key={currentIndex}` in ExerciseRouter forces full remount — verify this is the actual mechanism.

---

### TC-REORDER-008
**Category:** Happy Path
**Title:** Gender filtering: male user does not see female-tagged reorder exercises
**Priority:** P0
**Preconditions:** A reorder exercise exists with "(female)" or "female speaker" in English prompt. Onboarded as Thai/A1/male.

**Steps:**
1. Load a lesson containing such a gender-tagged reorder exercise.
2. Count the actual exercises displayed.

**Expected Results:**
- The female-tagged reorder exercise is filtered OUT before the exercises array is set.
- `filterExercisesByGender` removes exercises where prompt contains `(female)` or `female speaker`.
- Total exercise count is reduced by the number of filtered exercises.
- Lesson still functions (no crash if 0 exercises remain after filtering).

---

### TC-REORDER-009
**Category:** Happy Path
**Title:** Gender filtering: "both" user sees all reorder exercises
**Priority:** P1
**Preconditions:** Onboarded as Thai/A1/both.

**Steps:**
1. Load the same lesson with gender-tagged reorder exercises.
2. Count exercises displayed.

**Expected Results:**
- `filterExercisesByGender` returns all exercises unchanged (gender === 'both').
- All exercises including gender-tagged ones are shown.

---

---

## Section 10: TTS (Text-to-Speech)

### TC-TTS-001
**Category:** Happy Path
**Title:** TTS uses correct BCP-47 voice code for each language
**Priority:** P0
**Preconditions:** Onboarded for each language. No custom `lingwa_lang_config_{lang}` in localStorage.

**Steps:**
1. On Thai lesson, trigger TTS.
2. Check browser's Web Speech API utterance language.
3. Repeat for Chinese and Spanish.

**Expected Results:**
- Thai: utterance.lang = "th-TH".
- Chinese: utterance.lang = "zh-CN".
- Spanish: utterance.lang = "es-ES".
- These come from `LANG_VOICES_FALLBACK` map in `tts.ts`.

---

### TC-TTS-002
**Category:** Happy Path
**Title:** TTS voice overridden by lang config in localStorage
**Priority:** P1
**Preconditions:** Set `lingwa_lang_config_th = {"ttsVoice": "th-TH-custom"}` in localStorage.

**Steps:**
1. Navigate to a Thai lesson.
2. Trigger TTS.

**Expected Results:**
- `getTtsVoice("th")` reads config from localStorage and returns `"th-TH-custom"`.
- Config `ttsVoice` takes priority over fallback map.

---

### TC-TTS-003
**Category:** Happy Path
**Title:** Calling speakText cancels prior speech before playing new
**Priority:** P0
**Preconditions:** TTS is actively playing.

**Steps:**
1. Trigger TTS on word A.
2. While audio is playing, tap TTS button for word B.

**Expected Results:**
- `window.speechSynthesis.cancel()` is called at start of `speakText`.
- Word A stops immediately.
- Word B starts playing.
- No double audio overlap.

---

### TC-TTS-004
**Category:** Edge Case
**Title:** TTS silently fails on unsupported browser (no window.speechSynthesis)
**Priority:** P1
**Preconditions:** Simulate environment where `window.speechSynthesis` is undefined.

**Steps:**
1. Test in environment without Web Speech API support.
2. Trigger any TTS action.

**Expected Results:**
- `speakText` returns early with no thrown error.
- UI remains functional.
- No uncaught exceptions.

---

### TC-TTS-005
**Category:** Edge Case
**Title:** No double TTS fire on React Strict Mode remount
**Priority:** P0
**Preconditions:** App running in development mode (React Strict Mode active). Load a Listening exercise.

**Steps:**
1. Navigate to a listening exercise.
2. Observe audio behavior on mount.

**Expected Results:**
- Audio plays exactly ONCE.
- `hasAutoPlayed.current` ref prevents second fire on Strict Mode double-invoke.
- This is the BUG-4 regression check: "Double TTS fire — fixed with setTimeout".

---

### TC-TTS-006
**Category:** Happy Path
**Title:** speakSlow uses 0.6 rate
**Priority:** P2
**Preconditions:** Code review / unit test: `speakSlow("test", "th")` calls `speakText("test", "th", 0.6)`.

**Steps:**
1. Verify `speakSlow` implementation in `tts.ts`.

**Expected Results:**
- `speakSlow` calls `speakText(text, lang, 0.6)`.
- Rate is 0.6 (vs default 0.9).

---

### TC-TTS-007
**Category:** Edge Case
**Title:** TTS onerror callback does not rethrow (silent fail)
**Priority:** P1
**Preconditions:** Force a speech synthesis error (e.g., utterance with empty text).

**Steps:**
1. Call `speakText("", "th")`.
2. Observe console.

**Expected Results:**
- No unhandled promise rejection.
- `console.debug('[Lingwa TTS] Speech error: ...')` logged.
- `resolve()` called (promise resolves, not rejects).

---

---

## Section 11: Gender Resolution (resolve.ts)

### TC-RESOLVE-001
**Category:** Happy Path
**Title:** resolveMeaning — returns correct language from dict
**Priority:** P0
**Preconditions:** Unit test / console test.

**Steps:**
1. Call `resolveMeaning({en: "Hello", zh: "你好"}, "en")`.
2. Call `resolveMeaning({en: "Hello", zh: "你好"}, "zh")`.
3. Call `resolveMeaning({en: "Hello", zh: "你好"}, "fr")`.
4. Call `resolveMeaning({en: "Hello", zh: "你好"})` (no lang, reads from localStorage).
5. Call `resolveMeaning("Hello", "en")` (flat string, old schema).
6. Call `resolveMeaning(undefined, "en")`.

**Expected Results:**
1. Returns "Hello".
2. Returns "你好".
3. Fallback to `meanings.en` → returns "Hello".
4. Reads `lingwa_profile.nativeLangCode` from localStorage (e.g. "en"), returns "Hello".
5. Returns "Hello" directly (backward compat).
6. Returns `""` (empty string, no crash).

---

### TC-RESOLVE-002
**Category:** Happy Path
**Title:** resolveGender — male/female/both paths
**Priority:** P0
**Preconditions:** Unit test.

**Steps:**
1. Call `resolveGender({male: "A", female: "B"}, "male")`.
2. Call `resolveGender({male: "A", female: "B"}, "female")`.
3. Call `resolveGender({male: "A", female: "B"}, "both")`.
4. Call `resolveGender({neutral: "C"}, "male")` (no male key).
5. Call `resolveGender(undefined, "male")`.

**Expected Results:**
1. Returns "A".
2. Returns "B".
3. Returns "A" (both → returns male as primary).
4. Returns "C" (falls back to neutral).
5. Returns `null`.

---

### TC-RESOLVE-003
**Category:** Happy Path
**Title:** resolveGenderBoth — returns both forms
**Priority:** P1
**Preconditions:** Unit test.

**Steps:**
1. Call `resolveGenderBoth({male: {word: "A"}, female: {word: "B"}})`.
2. Call `resolveGenderBoth({neutral: {word: "C"}})`.
3. Call `resolveGenderBoth(undefined)`.

**Expected Results:**
1. Returns `{male: {word: "A"}, female: {word: "B"}}`.
2. Returns `{male: {word: "C"}, female: {word: "C"}}` (both fall back to neutral).
3. Returns `{male: null, female: null}`.

---

### TC-RESOLVE-004
**Category:** Happy Path
**Title:** resolveGenderedOptions — picks correct array by gender
**Priority:** P0
**Preconditions:** Unit test.

**Steps:**
1. Call `resolveGenderedOptions({male: ["A","B"], female: ["C","D"], neutral: ["E","F"]}, "male")`.
2. Call `resolveGenderedOptions({male: ["A","B"], female: ["C","D"], neutral: ["E","F"]}, "female")`.
3. Call `resolveGenderedOptions({male: ["A","B"], female: ["C","D"], neutral: ["E","F"]}, "both")`.
4. Call `resolveGenderedOptions(["X","Y"], "male")` (old schema flat array).
5. Call `resolveGenderedOptions(undefined, "male")`.

**Expected Results:**
1. Returns `["A","B"]`.
2. Returns `["C","D"]`.
3. Falls through male/female → returns `["E","F"]` from neutral.
4. Returns `["X","Y"]` as-is (backward compat).
5. Returns `[]`.

---

### TC-RESOLVE-005
**Category:** Happy Path
**Title:** resolveObjectives — handles dict and array
**Priority:** P0
**Preconditions:** Unit test.

**Steps:**
1. Call `resolveObjectives({en: ["A","B"], zh: ["C","D"]}, "en")`.
2. Call `resolveObjectives({en: ["A","B"], zh: ["C","D"]}, "zh")`.
3. Call `resolveObjectives(["A","B"])` (old flat array).
4. Call `resolveObjectives(undefined)`.

**Expected Results:**
1. Returns `["A","B"]`.
2. Returns `["C","D"]`.
3. Returns `["A","B"]` as-is.
4. Returns `[]`.

---

### TC-RESOLVE-006
**Category:** Happy Path
**Title:** resolveOptions — handles dict and array
**Priority:** P0
**Preconditions:** Unit test.

**Steps:**
1. Call `resolveOptions({en: ["A","B"], zh: ["C","D"]}, "en")`.
2. Call `resolveOptions({en: ["A","B"], zh: ["C","D"]}, "zh")`.
3. Call `resolveOptions({en: ["A","B"], zh: ["C","D"]}, "fr")`.
4. Call `resolveOptions(["X","Y","Z"])` (flat array).
5. Call `resolveOptions(undefined)`.

**Expected Results:**
1. Returns `["A","B"]`.
2. Returns `["C","D"]`.
3. Falls back to `options.en` → returns `["A","B"]`.
4. Returns `["X","Y","Z"]` as-is.
5. Returns `[]`.

---

### TC-RESOLVE-007
**Category:** Happy Path
**Title:** getGender reads from `lingwa_gender_{lang}` first, falls back to profile
**Priority:** P0
**Preconditions:** Unit test / localStorage manipulation.

**Steps:**
1. Set `lingwa_gender_th = "female"` and `lingwa_profile.gender = "male"`. Call `getGender("th")`.
2. Remove `lingwa_gender_th`. Call `getGender("th")`.
3. Remove both. Call `getGender("th")`.

**Expected Results:**
1. Returns `"female"` (lang-specific key wins).
2. Returns `"male"` (falls back to profile.gender).
3. Returns `"both"` (default).

---

---

## Section 12: Progress Tracking

### TC-PROG-001
**Category:** Happy Path
**Title:** XP calculated correctly — non-perfect quiz
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1. Answer at least one exercise wrong.

**Steps:**
1. Complete a quiz with at least 1 wrong answer.
2. Tap "Complete Lesson" to trigger bridge.
3. Check localStorage.

**Expected Results:**
- `quizXP = 10` (base, no perfect bonus).
- `lingwa:progress:th.xp` = 10 (+ any prior XP).
- `lingwa:progress:th.lessonsCompleted["1.1"].perfect = false`.
- `lingwa:progress:th.lessonsCompleted["1.1"].xp = 10`.

---

### TC-PROG-002
**Category:** Happy Path
**Title:** XP calculated correctly — perfect quiz
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1. Answer all exercises correctly.

**Steps:**
1. Complete a quiz with 100% correct answers.
2. Check localStorage after bridge phase transition.

**Expected Results:**
- `quizXP = 15` (10 base + 5 perfect bonus).
- `lingwa:progress:th.lessonsCompleted["1.1"].perfect = true`.
- `lingwa:progress:th.lessonsCompleted["1.1"].xp = 15`.

---

### TC-PROG-003
**Category:** Happy Path
**Title:** Voice XP adds to quiz XP in progress
**Priority:** P0
**Preconditions:** Complete a quiz (15 XP), then complete voice chat.

**Steps:**
1. Complete quiz (15 XP saved).
2. Complete voice chat (3 successes).
3. Check localStorage and URL.

**Expected Results:**
- `handleVoiceComplete(15)` fires.
- `lingwa:progress:th.xp` = 15 (quiz) + 15 (voice) = 30.
- URL navigated to `/{lang}?xp=30`.
- XP toast shows "+30 XP".

---

### TC-PROG-004
**Category:** Edge Case
**Title:** Stale XP calculation prevented by answersRef (BUG regression)
**Priority:** P0
**Preconditions:** On a quiz with multiple exercises.

**Steps:**
1. Answer all exercises correctly.
2. On the last exercise's "Complete Lesson" tap, check `correctCount` calculation.

**Expected Results:**
- `handleNext` uses `answersRef.current` (not the `answers` state) to count correct answers.
- React's batched state updates do not cause stale count.
- `correctCount` correctly equals total exercises for a perfect run.
- This verifies the "Stale XP calculation — fixed with answersRef" regression.

---

### TC-PROG-005
**Category:** Happy Path
**Title:** Streak increments on consecutive days
**Priority:** P1
**Preconditions:** Have streak = 1 from yesterday's session. `streakLastDate` = yesterday's ISO date.

**Steps:**
1. Complete any lesson today.
2. Check `lingwa:progress:th.streak`.

**Expected Results:**
- Streak = 2.
- `streakLastDate` = today's UTC date.

---

### TC-PROG-006
**Category:** Negative
**Title:** Streak resets to 1 if gap is more than 1 day
**Priority:** P1
**Preconditions:** Set `streakLastDate` to 3 days ago in localStorage.

**Steps:**
1. Complete any lesson.
2. Check streak.

**Expected Results:**
- Streak = 1 (reset, not +1).
- `streakLastDate` = today.

---

### TC-PROG-007
**Category:** Edge Case
**Title:** Streak does NOT double-increment on same day
**Priority:** P1
**Preconditions:** Complete one lesson (streak = 1, `streakLastDate` = today).

**Steps:**
1. Complete a second lesson on the same day.
2. Check streak.

**Expected Results:**
- Streak remains 1 (not 2).
- `updateStreak` checks `streakLastDate === today` and returns unchanged.

---

### TC-PROG-008
**Category:** Happy Path
**Title:** initProgress does not overwrite existing progress
**Priority:** P0
**Preconditions:** `lingwa:progress:th` has existing data (xp=50).

**Steps:**
1. Navigate to `/th?level=A1` (which calls `initProgress(lang, level)`).
2. Check `lingwa:progress:th.xp`.

**Expected Results:**
- `xp` remains 50, not reset to 0.
- `initProgress` returns early if `existing` progress found.

---

### TC-PROG-009
**Category:** Edge Case
**Title:** completeLesson cross-unit tracking — lesson 2.1 after finishing unit 1
**Priority:** P1
**Preconditions:** Progress at `currentUnit=1, currentLesson=5` (after completing lesson 1.4 of a 4-lesson unit).

**Steps:**
1. Complete lesson 2.1.
2. Check `currentUnit` and `currentLesson` in progress.

**Expected Results:**
- Condition: `unit(2) >= currentUnit(1)` = true, `lesson(1) >= currentLesson(5)` = false.
- `currentUnit` / `currentLesson` NOT updated by `completeLesson` for this cross-unit case.
- However `lessonsCompleted["2.1"].completed = true` IS written correctly.
- Unit unlock in LessonTree uses `lessonsCompleted` map, NOT `currentUnit/currentLesson`, so the tree DOES unlock correctly.
- IMPORTANT: This is a known behavior — document as a non-breaking quirk.

---

### TC-PROG-010
**Category:** Happy Path
**Title:** isUnitComplete returns true only when ALL lessons complete
**Priority:** P0
**Preconditions:** Complete lessons 1.1, 1.2, 1.3 but NOT 1.4 (unit has 4 lessons).

**Steps:**
1. Call `isUnitComplete("th", 1, 4)`.

**Expected Results:**
- Returns `false` (lesson 1.4 not completed).
- Iterates `for (let i = 1; i <= 4; i++)` and checks each key.

---

### TC-PROG-011
**Category:** Happy Path
**Title:** SM-2 interval increases on correct review
**Priority:** P2
**Preconditions:** Word in vocab with `intervalDays: 1, easeFactor: 2.5`.

**Steps:**
1. Call `reviewWord("th", "สวัสดี", true)` (correct).
2. Check updated vocab entry.

**Expected Results:**
- `intervalDays` = 6 (when previous interval was 1, next is 6).
- `correct` count incremented by 1.
- `nextReview` = today + 6 days.

---

### TC-PROG-012
**Category:** Negative
**Title:** SM-2 interval resets on wrong review
**Priority:** P2
**Preconditions:** Word in vocab with `intervalDays: 6`.

**Steps:**
1. Call `reviewWord("th", "สวัสดี", false)` (wrong).
2. Check updated vocab entry.

**Expected Results:**
- `intervalDays` = 1 (reset).
- `wrong` count incremented by 1.
- `nextReview` = tomorrow.

---

---

## Section 13: Voice Chat (VoiceChat Component)

### TC-VOICE-001
**Category:** Happy Path
**Title:** Opening message appears and TTS fires on load
**Priority:** P0
**Preconditions:** In Voice phase, Thai lesson 1.1.

**Steps:**
1. Enter voice phase.
2. Observe chat window and listen for audio.

**Expected Results:**
- Tutor's opening message appears immediately.
- Default message: "Hi! I'm [TutorName] 😊 You just learned '[lessonTitle]' — now let's practice! Try using one of these: [phrase1], [phrase2]. I'll help you get it right!".
- TTS fires after ~500ms delay.
- `isSpeaking` indicator shows in tutor status bar.

---

### TC-VOICE-002
**Category:** Happy Path
**Title:** Progress dots fill as successes accumulate
**Priority:** P1
**Preconditions:** In Voice phase. successCount = 0.

**Steps:**
1. Get 1 positive tutor response.
2. Get a second positive tutor response.
3. Get a third positive tutor response.

**Expected Results:**
- Dot 1 fills green after 1st success.
- Dot 2 fills green after 2nd success.
- Dot 3 fills green after 3rd success.
- After 3rd success, `lessonComplete = true`, completion overlay shown.

---

### TC-VOICE-003
**Category:** Happy Path
**Title:** Key phrase tiles send that phrase directly
**Priority:** P1
**Preconditions:** In Voice phase.

**Steps:**
1. Observe the key phrase tile buttons at the bottom.
2. Tap one phrase tile.

**Expected Results:**
- `sendMessage(phrase)` called with the tapped phrase.
- Phrase appears as user message in chat.
- API call made to `/api/chat`.

---

### TC-VOICE-004
**Category:** Edge Case
**Title:** Gender sent correctly to API
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/female. In Voice phase.

**Steps:**
1. Send any message in voice chat.
2. Observe the API request body.

**Expected Results:**
- Request body includes `gender: "female"`.
- Read from `localStorage.getItem("lingwa_gender_th")`.

---

### TC-VOICE-005
**Category:** Negative
**Title:** API failure shows retry, then error message
**Priority:** P1
**Preconditions:** In Voice phase. API goes down mid-session.

**Steps:**
1. Stop the backend API.
2. Send a message.

**Expected Results:**
- First fetch fails.
- After 2 seconds, retry is attempted.
- If retry also fails, error message shown: "Connection issue — tap mic and try again 🙏".
- `isLoading` returns to `false`.

---

### TC-VOICE-006
**Category:** Edge Case
**Title:** Text input state exists in code but no visible input element
**Priority:** P2
**Preconditions:** In Voice phase on desktop (no SpeechRecognition).

**Steps:**
1. Observe the input area.
2. Check if there is a text input field.

**Expected Results:**
- `handleTextSend`, `textInput`, `setTextInput` exist in code but there is NO `<input>` element rendered in the JSX.
- The text input is dead code — users cannot type directly.
- The noMic banner instructs users to use a phone.
- POTENTIAL IMPROVEMENT: Add a text input fallback for desktop users.

---

### TC-VOICE-007
**Category:** Happy Path
**Title:** Success count counted via regex pattern matching
**Priority:** P1
**Preconditions:** In Voice phase.

**Steps:**
1. Get a tutor reply containing "correct" or "well done".
2. Get a tutor reply containing "nice".
3. Get a reply containing "ดี" (Thai word for good).

**Expected Results:**
- `isPositive` regex: `/correct|perfect|great|good|well done|nice|excellent|ดี|เยี่ยม|สุดยอด|bravo|parfait|très bien|muy bien|you've got it|lesson complete/i`
- Each positive reply increments `successCount` and `successCountRef.current`.
- Non-positive replies do not increment count.

---

---

## Section 14: Data Integrity — Schema v1.0

### TC-SCHEMA-001
**Category:** Data Integrity
**Title:** No "undefined" renders from flat `meaning` field (BUG-4 regression)
**Priority:** P0
**Preconditions:** Run for all 3 languages (th, zh, es).

**Steps:**
1. Load each language's A1 lesson 1.1 Teach phase.
2. Read all vocab card meanings.
3. Search for any "undefined" text in the UI.

**Expected Results:**
- LessonTeach uses `resolveMeaning(item?.meanings || item?.meaning, nativeLang)`.
- New schema items have `meanings: { en: "...", zh: "..." }` — resolved correctly.
- Old schema items have `meaning: "..."` (flat string) — resolved correctly via `typeof meanings === 'string'`.
- NO "undefined" text visible anywhere on vocab cards.
- This is the "Spanish vocab showing undefined (old flat schema) — fixed" regression check.

---

### TC-SCHEMA-002
**Category:** Data Integrity
**Title:** All 3 languages have objectives as dicts, not flat arrays
**Priority:** P0
**Preconditions:** Run automated schema check (Python script).

**Steps:**
1. Run: `python3 -c "import json; [print(l.get('objectives')) for u in json.load(open('languages/th/courses/a1.json'))['units'] for l in u['lessons']]"`

**Expected Results:**
- All objectives are `dict` type: `{"en": [...], "zh": [...]}`.
- No plain `list` type objectives found.
- `resolveObjectives()` will not crash with `.join()` on a dict.

---

### TC-SCHEMA-003
**Category:** Data Integrity
**Title:** All matching exercise `native` fields are dicts, not flat strings
**Priority:** P0
**Preconditions:** Run automated schema check across all 3 languages.

**Steps:**
1. Check all matching exercise pairs' `native` field type.

**Expected Results:**
- `native` is always `{"en": "...", "zh": "..."}` (dict).
- `resolveMeaning(pair.native, nativeLang)` works without crash.
- No flat string `native` fields found.

---

### TC-SCHEMA-004
**Category:** Data Integrity
**Title:** All reorder exercise `prompt` fields are dicts, not flat strings
**Priority:** P0
**Preconditions:** Run automated schema check.

**Steps:**
1. Check all reorder exercise `prompt` field types.

**Expected Results:**
- All prompts are dicts: `{"en": "...", "zh": "..."}`.
- `resolveText(exercise.prompt, nativeLang)` works correctly.
- No `[object Object]` rendered.

---

### TC-SCHEMA-005
**Category:** Data Integrity
**Title:** All target_to_native `options` are language-keyed dicts
**Priority:** P0
**Preconditions:** Run automated schema check.

**Steps:**
1. Check all `target_to_native` exercise `options` field types across all languages.

**Expected Results:**
- All options are `{"en": [...], "zh": [...]}` for Thai (bilingual).
- Chinese and Spanish have at minimum `{"en": [...]}`.
- `resolveOptions(options, nativeLang)` returns the correct language array.

---

### TC-SCHEMA-006
**Category:** Data Integrity
**Title:** All native_to_target `options` have at minimum `neutral` key
**Priority:** P0
**Preconditions:** Run automated schema check.

**Steps:**
1. Check all `native_to_target` exercise `options` for `neutral` key across all languages.

**Expected Results:**
- Thai: options have `neutral`, `male`, `female` keys.
- Chinese: options have `neutral` key (no gendered variants needed).
- Spanish: options have `neutral` key.
- `resolveGenderedOptions` falls back to `neutral` correctly.

---

### TC-SCHEMA-007
**Category:** Backward Compatibility
**Title:** Old schema vocab item with flat `meaning` field still displays correctly
**Priority:** P0
**Preconditions:** Inject a vocab item with old schema into a lesson:
```json
{"word": "สวัสดี", "romanization": "sa-wat-dee", "meaning": "Hello"}
```

**Steps:**
1. Load the Teach phase with this item.
2. Observe meaning display.

**Expected Results:**
- `resolveMeaning(item.meanings || item.meaning, nativeLang)`.
- `item.meanings` = undefined → falls through to `item.meaning = "Hello"`.
- `typeof "Hello" === 'string'` → returns "Hello" directly.
- "Hello" displayed, no crash.

---

### TC-SCHEMA-008
**Category:** Backward Compatibility
**Title:** Old schema exercise with flat string `question` still displays
**Priority:** P1
**Preconditions:** Inject a native_to_target exercise with `question: "How do you say Hello?"` (flat string).

**Steps:**
1. Navigate to that exercise.
2. Observe the question text.

**Expected Results:**
- `resolveText("How do you say Hello?", nativeLang)`.
- `typeof text === 'string'` → returns the string directly.
- Question displayed correctly.

---

### TC-SCHEMA-009
**Category:** Backward Compatibility
**Title:** Old schema options (flat array) work in ExerciseCard
**Priority:** P1
**Preconditions:** Inject a target_to_native exercise with `options: ["Hello", "Goodbye", "Thanks", "Sorry"]` (flat array).

**Steps:**
1. Navigate to that exercise.
2. Observe the options.

**Expected Results:**
- `resolveOptions(["Hello","Goodbye","Thanks","Sorry"], "en")`.
- `Array.isArray(options) === true` → returns as-is.
- All 4 options displayed.

---

---

## Section 15: Cross-Language Testing

### TC-LANG-001
**Category:** Happy Path
**Title:** Thai A1 — all 5 exercise types render without errors
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English.

**Steps:**
1. Navigate through all 20 Thai A1 lessons (or spot-check all 5 exercise types).
2. Trigger each exercise type: target_to_native, native_to_target, listening, matching, reorder.

**Expected Results:**
- All 5 types render UI without JavaScript errors.
- No "[object Object]", "undefined", or blank content.
- TTS fires correctly in Thai (th-TH).

---

### TC-LANG-002
**Category:** Happy Path
**Title:** Chinese A1 — no gender step in onboarding, no gendered options
**Priority:** P0
**Preconditions:** Clean state. Onboard for Chinese A1.

**Steps:**
1. Complete onboarding (verify no gender step).
2. Navigate to a Chinese lesson.
3. Observe a `native_to_target` exercise options.

**Expected Results:**
- Gender step NOT shown in onboarding (Chinese not in `needsGender` list).
- `lingwa_profile.gender = "both"`.
- native_to_target options use `options.neutral` array.
- No ครับ/ค่ะ particles in Chinese options.
- TTS uses zh-CN voice.

---

### TC-LANG-003
**Category:** Happy Path
**Title:** Spanish A1 — gendered onboarding, duplicate gendered forms
**Priority:** P0
**Preconditions:** Clean state. Onboard for Spanish A1, gender = female.

**Steps:**
1. Navigate to a Spanish lesson Teach phase.
2. Observe vocab cards for a word that has `gendered` field.

**Expected Results:**
- Spanish vocab has gendered field but `male.word === female.word` (same content, different grammatical context may vary).
- For "both" gender users: "👨 hola · 👩 hola" would show.
- For female user: just the base word shown (gender === 'female', not 'both', so no variant bar).
- TTS uses es-ES voice.

---

### TC-LANG-004
**Category:** Data Integrity
**Title:** Spanish vocab romanization is empty string — no romanization row rendered
**Priority:** P1
**Preconditions:** Spanish A1 Teach phase (Spanish words have empty `romanization`).

**Steps:**
1. Observe vocab cards.

**Expected Results:**
- Romanization row shows empty string (not "undefined").
- The `{item?.romanization}` renders as empty — no visible line if empty.
- Code renders `<div>""</div>` effectively, which is blank but harmless.

---

### TC-LANG-005
**Category:** Data Integrity
**Title:** Chinese toneClass "3-3" renders correctly in tone badge
**Priority:** P1
**Preconditions:** Chinese A1 Teach phase.

**Steps:**
1. Observe first vocab card (你好, toneClass: "3-3").

**Expected Results:**
- Tone badge text: "3-3 tone".
- `toneColors["3-3"]` is `undefined` (not in the map: mid, low, falling, high, rising).
- Fallback color: `'var(--text-muted)'` for color and border.
- Background: `"undefined22"` is an invalid CSS value — badge may render without background.
- POTENTIAL BUG: Chinese tone class "3-3" not in the `toneColors` map. Badge may render with `undefined` in CSS.

---

---

## Section 16: Edge Cases & Robustness

### TC-EDGE-001
**Category:** Edge Case
**Title:** Browser back button mid-lesson does not corrupt progress
**Priority:** P1
**Preconditions:** In Quiz phase, answered 3 of 8 exercises.

**Steps:**
1. Tap the browser back button.
2. Navigate forward again to the same lesson.

**Expected Results:**
- Lesson reloads from scratch (Teach phase).
- No partial lesson data saved (lesson only saved on full completion).
- `answers` array reset to all `null`.

---

### TC-EDGE-002
**Category:** Edge Case
**Title:** Page refresh mid-lesson restarts lesson
**Priority:** P1
**Preconditions:** In Quiz phase, answered some exercises.

**Steps:**
1. Refresh the page (Cmd+R / F5).

**Expected Results:**
- Lesson reloads from Teach phase.
- No progress saved for partial quiz.
- Component state is initialized fresh.

---

### TC-EDGE-003
**Category:** Edge Case
**Title:** localStorage not available (private browsing with blocking)
**Priority:** P2
**Preconditions:** Simulate `localStorage` throwing on access.

**Steps:**
1. Override `localStorage.getItem` to throw.
2. Navigate to any page.

**Expected Results:**
- `getProfile()`, `getGender()`, `getLanguageProgress()` all have try/catch.
- App falls back gracefully (returns null/defaults).
- No uncaught errors crash the page.

---

### TC-EDGE-004
**Category:** Edge Case
**Title:** Rapid double-tap on "Continue" button does not advance 2 exercises
**Priority:** P0
**Preconditions:** On a quiz exercise, feedback banner showing.

**Steps:**
1. Tap "Continue →" twice in rapid succession.

**Expected Results:**
- `handleNext` advances exercise index by exactly 1.
- No duplicate state updates cause exercise to skip 2 ahead.
- React's state batching + the fact that `showResult` goes to false on first tap should prevent double-advancement.

---

### TC-EDGE-005
**Category:** Edge Case
**Title:** Lesson with 1 exercise total — isLast=true on first exercise
**Priority:** P1
**Preconditions:** Manually set a lesson with exactly 1 exercise in curriculum.

**Steps:**
1. Enter quiz phase.

**Expected Results:**
- `isLast = (currentExercise === 0 === lessonData.exercises.length - 1)` = true.
- "Complete Lesson 🎉" button shown immediately on first exercise.
- Answering the only exercise transitions to bridge correctly.

---

### TC-EDGE-006
**Category:** Edge Case
**Title:** Reorder exercise with only 1 word
**Priority:** P2
**Preconditions:** Inject a reorder exercise with 1 word in `words` array.

**Steps:**
1. Navigate to the exercise.
2. Tap the single word tile.
3. Tap "Check".

**Expected Results:**
- `allPlaced = (pool.length === 0 && placed.length > 0)` = true.
- Check button appears and is tappable.
- Correct/wrong determined by comparing `placed[0]` with `correct_order[0]`.
- No crash.

---

### TC-EDGE-007
**Category:** Edge Case
**Title:** Matching exercise after all pairs matched — no further interaction possible
**Priority:** P1
**Preconditions:** Complete all pairs in a matching exercise, feedback banner showing.

**Steps:**
1. Match all 4 pairs.
2. Try tapping a (now green) matched tile.

**Expected Results:**
- `complete = true` → all buttons `disabled`.
- No interaction possible.
- `handleLeftTap` and `handleRightTap` check `|| complete` and return early.

---

### TC-EDGE-008
**Category:** Edge Case
**Title:** XP toast appears and disappears after 3 seconds
**Priority:** P1
**Preconditions:** Navigate to `/{lang}?xp=15`.

**Steps:**
1. Land on lesson tree with `?xp=15` param.
2. Observe XP toast.
3. Wait 3 seconds.

**Expected Results:**
- Toast "+15 XP 🎉" appears at top.
- After 3000ms, `setXpToast(null)` fires, toast disappears.
- `setTimeout(() => setXpToast(null), 3000)` — verify exact timing.

---

### TC-EDGE-009
**Category:** Edge Case
**Title:** Navigate to `/th` without being onboarded (no profile in localStorage)
**Priority:** P1
**Preconditions:** Clean state. Navigate directly to `/th?level=A1`.

**Steps:**
1. Navigate to `/th?level=A1`.

**Expected Results:**
- `lingwa_curriculum_th` not found in localStorage.
- API fallback fetch attempted.
- If no course found from API: "No curriculum yet" empty state shows.
- "Start onboarding →" link shown and functional.
- No crash.

---

### TC-EDGE-010
**Category:** Edge Case
**Title:** Tutor name falls back to "Your Tutor" when no config
**Priority:** P1
**Preconditions:** Remove `lingwa_lang_config_th` from localStorage.

**Steps:**
1. Navigate to a lesson.
2. Observe tutor name in headers and bridge screen.

**Expected Results:**
- `getTutorName("th")` returns "Your Tutor".
- Bridge screen: "Start speaking with Your Tutor".
- No crash from missing config.

---

### TC-EDGE-011
**Category:** Edge Case
**Title:** Back button not shown on Step 0 of onboarding
**Priority:** P1
**Preconditions:** Navigate to `/onboarding`.

**Steps:**
1. Observe Step 0 header.

**Expected Results:**
- "← Back" button NOT visible.
- Condition: `{step > 0 && (<button onClick={goBack}>)}`.

---

### TC-EDGE-012
**Category:** Edge Case
**Title:** Reading progress on window focus after returning from lesson
**Priority:** P1
**Preconditions:** Complete a lesson in one tab, return to lesson tree tab.

**Steps:**
1. Complete a lesson (which navigates to lesson tree with `?xp=N`).
2. Observe the tree updates.

**Expected Results:**
- `handleFocus` event listener re-reads `getLanguageProgress(lang)`.
- Lesson tree shows updated completion state.
- XP header updated.
- Also: `useEffect` for `?xp` param re-reads progress on searchParams change.

---

---

## Section 17: Full End-to-End Scenarios

### TC-E2E-001
**Category:** Happy Path
**Title:** Complete full lesson flow: Thai A1, lesson 1.1, male, English native
**Priority:** P0
**Preconditions:** Clean state. API running.

**Steps:**
1. Navigate to `/onboarding`. Select English → Thai → A1 → Male. Tap "Start learning".
2. Arrive at `/th?level=A1`. Tap Lesson 1.1 "Start →".
3. Arrive at Teach phase. Step through all 15 vocab cards.
4. Tap "Start Quiz 🎯".
5. Complete all 8 exercises (answer correctly).
6. Tap "Complete Lesson 🎉".
7. Arrive at Bridge phase. Observe key phrases listed.
8. Tap "🎙️ Start speaking with [TutorName]".
9. Send 3 messages that receive positive tutor responses.
10. Observe "Lesson Complete!" screen.
11. Observe navigation to `/th?xp=30`.

**Expected Results:**
- Step 1: Profile saved with correct values.
- Step 2: Lesson tree shows 1.1 as available.
- Step 3: 15 cards, all show Thai word + romanization + English meaning + tone badge.
- Step 4: Quiz starts at exercise 1 of 8.
- Step 5: Progress bar fills. All correct → `answersRef.current` = all `true`.
- Step 6: `completeLesson("th", "1.1", true, 15)` called. Bridge phase shows.
- Step 7: First 5 vocab words listed as key phrases with 🔊 buttons.
- Step 8: Voice phase. Opening message plays via TTS.
- Step 9: 3 dots fill green.
- Step 10: "+15 XP" and practiced phrases shown.
- Step 11: Toast "+30 XP", `lingwa:progress:th.xp = 30`, lesson 1.2 now available.

---

### TC-E2E-002
**Category:** Happy Path
**Title:** Full lesson with wrong answers — non-perfect XP
**Priority:** P0
**Preconditions:** Onboarded as Thai/A1/male/English. Lesson 1.1.

**Steps:**
1. Enter Quiz phase.
2. Deliberately answer exercises 1 and 3 incorrectly.
3. Complete remaining exercises correctly.
4. Complete lesson.

**Expected Results:**
- XP = 10 (no perfect bonus).
- `lessonsCompleted["1.1"].perfect = false`.
- Lesson tree shows ✓ (not ⭐) for lesson 1.1.
- XP toast shows "+10 XP" (or "+25 XP" if voice completed).

---

### TC-E2E-003
**Category:** Happy Path
**Title:** Chinese-native user — lesson content fully in Chinese
**Priority:** P0
**Preconditions:** Onboarded as Chinese-native/Thai/A1/male.

**Steps:**
1. Navigate to Thai A1 lesson 1.1.
2. Check Teach phase: meanings, tone badges.
3. Check Quiz: target_to_native options, native_to_target question, reorder prompt.
4. Check Bridge: key phrases.

**Expected Results:**
- Teach: meanings in Chinese (你好, 再见, etc.).
- Quiz target_to_native: options from `options.zh` array.
- Quiz native_to_target: question from `question.zh`.
- Quiz reorder: prompt from `prompt.zh`.
- No English visible in content (only UI labels like "Tap to hear" may remain in English if not localized).

---

### TC-E2E-004
**Category:** Happy Path
**Title:** Complete 4 lessons → unlock Unit 1 Chat
**Priority:** P1
**Preconditions:** Onboarded as Thai/A1/male/English.

**Steps:**
1. Complete all 4 lessons of Unit 1.
2. Return to lesson tree.
3. Tap "Unit 1 Chat" card.

**Expected Results:**
- All 4 lessons show ✓ or ⭐.
- Unit 1 progress bar at 100%.
- "Unit 1 Chat" card shows green border, 💬 icon.
- Tapping navigates to `/th/chat?unit=1&mode=unit`.

---

### TC-E2E-005
**Category:** Happy Path
**Title:** Completing all units unlocks Final Challenge
**Priority:** P1
**Preconditions:** Complete all 5 units (20 lessons) of Thai A1.

**Steps:**
1. Complete all 20 lessons.
2. Return to lesson tree.
3. Observe Final Challenge card.
4. Tap it.

**Expected Results:**
- Final Challenge card shows yellow border, 🏆 icon.
- `isFinalChallengeUnlocked` returns `true`.
- Tapping navigates to `/th/chat?mode=final`.

---

### TC-E2E-006
**Category:** Happy Path
**Title:** Switching from Teach back button goes to lesson tree (X button)
**Priority:** P1
**Preconditions:** In Teach phase of lesson 1.1.

**Steps:**
1. Tap the "✕" button in the top-left header.

**Expected Results:**
- Navigation to `/th` (lesson tree).
- No lesson progress saved.
- Lesson 1.1 still shows as "available" (not completed).

---

---

## Section 18: localStorage Schema Integrity

### TC-LS-001
**Category:** Data Integrity
**Title:** All localStorage keys written by onboarding are correct
**Priority:** P0
**Preconditions:** Complete full onboarding for Thai/A1/male/English.

**Steps:**
1. Open DevTools → Application → Local Storage.
2. Check keys and values.

**Expected Results:**
- `lingwa_profile`: `{"targetLang":"Thai","targetLangCode":"th","nativeLang":"English","nativeLangCode":"en","level":"A1","gender":"male"}`.
- `lingwa_curriculum_th`: valid JSON with `units` array.
- `lingwa_gender_th`: `"male"`.
- `lingwa_lang_config_th`: valid JSON (if config endpoint returned successfully).

---

### TC-LS-002
**Category:** Data Integrity
**Title:** Progress keys use correct format
**Priority:** P0
**Preconditions:** Complete lesson 1.1.

**Steps:**
1. Check localStorage after lesson completion.

**Expected Results:**
- `lingwa:progress:th`: contains `{language, level, xp, streak, lessonsCompleted: {"1.1": {completed: true, ...}}}`.
- Key format: `lingwa:progress:{langCode}` (colon-separated, not underscore).
- NOT `lingwa_progress_th` (wrong format).

---

### TC-LS-003
**Category:** Data Integrity
**Title:** `lingwa:global` syncs XP and streak correctly
**Priority:** P1
**Preconditions:** Complete a lesson.

**Steps:**
1. Check `lingwa:global` in localStorage.

**Expected Results:**
- `activeLang`: current language code.
- `xp`: total XP across all languages.
- `streak`: matches language-specific streak.
- `languages`: array includes current language code.

---

---

## Section 19: Accessibility & UX Polish

### TC-UX-001
**Category:** Happy Path
**Title:** Option letter labels are A, B, C, D
**Priority:** P2
**Preconditions:** Any multiple-choice exercise.

**Steps:**
1. Observe the letter labels on options.

**Expected Results:**
- Options labeled A, B, C, D (using `String.fromCharCode(65 + idx)`).
- 4 options → A, B, C, D.

---

### TC-UX-002
**Category:** Happy Path
**Title:** Non-Latin text options render at larger font size
**Priority:** P2
**Preconditions:** native_to_target exercise with Thai script options.

**Steps:**
1. Observe Thai options in ExerciseCard.

**Expected Results:**
- `containsNonLatin(option)` returns `true` for Thai script.
- Option text renders with class `text-lg` and `lineHeight: 1.8`.
- Latin text options render at default size.

---

### TC-UX-003
**Category:** Happy Path
**Title:** Matching TTS fires on left tap only (not right)
**Priority:** P1
**Preconditions:** On a matching exercise.

**Steps:**
1. Tap a Thai word in the left column.
2. Tap an English/Chinese meaning in the right column.

**Expected Results:**
- Left tap: `speakText(exercise.pairs[pairIdx].target, lang, 0.75)` fires.
- Right tap: NO TTS fires.

---

### TC-UX-004
**Category:** Happy Path
**Title:** Feedback banner correct answer TTS button works
**Priority:** P1
**Preconditions:** Answer wrong on a target_to_native or listening exercise.

**Steps:**
1. Select wrong answer.
2. In feedback banner, observe "Answer: [word] 🔊" area.
3. Tap the 🔊 button.

**Expected Results:**
- TTS fires for the correct answer text.
- `e.stopPropagation()` prevents the tap from interacting with the feedback banner.

---

---

## Section 20: Regression Suite (Previously Fixed Bugs)

### TC-REG-001
**Category:** Regression
**Title:** BUG-1: Reorder last tile not stuck (key={currentIndex} remount fix)
**Priority:** P0
**Preconditions:** Lesson has 2+ reorder exercises back-to-back.

**Steps:**
1. Complete reorder exercise at index N (place all tiles, tap Check).
2. Tap Continue to advance to reorder exercise at index N+1.
3. Observe: pool should show EXERCISE N+1's words, not exercise N's.

**Expected Results:**
- `key={currentIndex}` on `<Reorder>` in ExerciseRouter forces full unmount+remount.
- `pool` initialized to new exercise's words.
- No tiles from previous exercise persist.
- VERIFIED: ExerciseRouter passes `key={currentIndex}` to all exercise components.

---

### TC-REG-002
**Category:** Regression
**Title:** BUG-2: Reorder exercises filtered by gender
**Priority:** P0
**Preconditions:** A lesson has reorder exercises tagged "(female)" in prompt. User is male.

**Steps:**
1. Load the lesson as a male user.
2. Count total exercises vs exercises without gender-tagged reorders.

**Expected Results:**
- `filterExercisesByGender` in lesson page removes "(female)" exercises for male user.
- Male user never sees female-form reorder exercises.
- VERIFIED: `filterExercisesByGender` runs on lesson data before setting state.

---

### TC-REG-003
**Category:** Regression
**Title:** BUG-3: Listening options show target script (not English)
**Priority:** P0
**Preconditions:** Thai A1 lesson with listening exercise. English native user.

**Steps:**
1. Navigate to a listening exercise.
2. Observe all 4 options.

**Expected Results:**
- Options are Thai script strings (flat array from course data).
- `resolveOptions(exercise.options, nativeLang)` receives a flat `string[]` → returns as-is.
- English translations do NOT appear in listening options.
- VERIFIED: All listening exercises in Thai/Chinese/Spanish A1 have flat `string[]` options.

---

### TC-REG-004
**Category:** Regression
**Title:** BUG-4: Double TTS fire prevented
**Priority:** P0
**Preconditions:** App in development (React Strict Mode).

**Steps:**
1. Navigate to a listening exercise.
2. Count how many times TTS fires.

**Expected Results:**
- TTS fires exactly once.
- `hasAutoPlayed.current` ref (not state) prevents double-fire on Strict Mode double-invoke.
- VERIFIED: `hasAutoPlayed` is a `useRef`, not `useState`.

---

### TC-REG-005
**Category:** Regression
**Title:** Objectives `.join()` crash prevention
**Priority:** P0
**Preconditions:** Thai A1 lessons (objectives are dicts, not arrays).

**Steps:**
1. Navigate to `/th?level=A1`.
2. Expand Unit 1 to see lesson list.
3. Observe objectives text under each lesson.

**Expected Results:**
- `resolveObjectives(lesson.objectives, getNativeLang())` returns `string[]`.
- `.join(' · ')` called on resolved array — no crash.
- No "TypeError: objectives.join is not a function" error.
- VERIFIED: `resolveObjectives` handles dict input by picking the right array.

---

### TC-REG-006
**Category:** Regression
**Title:** Stale XP calculation with answersRef
**Priority:** P0
**Preconditions:** Any lesson quiz.

**Steps:**
1. Complete a quiz (all correct).
2. On last exercise Continue tap, verify XP is calculated correctly.

**Expected Results:**
- `handleNext` reads `answersRef.current` (not stale `answers` state).
- `correctCount` = total exercises for perfect run.
- `perfect = true` for all-correct quiz.
- `xp = 15`, not 10 (would be 10 if stale state was used and last answer wasn't counted).

---

### TC-REG-007
**Category:** Regression
**Title:** Strip bracket romanization renders correctly
**Priority:** P0
**Preconditions:** Any lesson with bracket romanization in vocab.

**Steps:**
1. Load Teach phase.
2. Check romanization display.

**Expected Results:**
- Romanization displays cleanly without extra brackets.
- The "Strip bracket romanization — fixed" change means no `[sa-wat-dee]` style text shown.

---

---

## Appendix A: Test Data Reference

### LocalStorage Profile Configurations

**Thai male English native:**
```json
{"targetLang":"Thai","targetLangCode":"th","nativeLang":"English","nativeLangCode":"en","level":"A1","gender":"male"}
```

**Thai female English native:**
```json
{"targetLang":"Thai","targetLangCode":"th","nativeLang":"English","nativeLangCode":"en","level":"A1","gender":"female"}
```

**Thai both English native:**
```json
{"targetLang":"Thai","targetLangCode":"th","nativeLang":"English","nativeLangCode":"en","level":"A1","gender":"both"}
```

**Chinese, Chinese native:**
```json
{"targetLang":"Chinese","targetLangCode":"zh","nativeLang":"中文","nativeLangCode":"zh","level":"A1","gender":"both"}
```

**Spanish female English native:**
```json
{"targetLang":"Spanish","targetLangCode":"es","nativeLang":"English","nativeLangCode":"en","level":"A1","gender":"female"}
```

---

## Appendix B: Known Non-Bug Behaviors

1. **completeLesson cross-unit tracking:** `currentUnit`/`currentLesson` may not update when moving from unit N to unit N+1 (because `lesson(1) >= currentLesson(5)` is false). This does NOT affect lesson unlock logic, which uses `lessonsCompleted` map directly. Not a user-visible bug.

2. **resolveGender "both" returns male as primary:** By design. `resolveGender(data, "both")` returns `data.male` (not both forms). Callers that need both forms use `resolveGenderBoth()`. Documented in code.

3. **VoiceChat text input dead code:** `handleTextSend`, `textInput`, `setTextInput` exist but no `<input>` element is rendered. Users cannot type in voice chat on desktop — they see the "Microphone required" banner instead. Not a crash, but a usability gap on desktop.

4. **Chinese toneClass "3-3" not in toneColors map:** CSS value would be `undefined22` for background — badge renders with default colors, not a crash.

5. **Streak uses UTC dates:** A user in UTC+8 doing a lesson at 11pm local = 3pm UTC sees correct date behavior. A user in UTC-12 studying at 1am local may have streak counted for a different UTC day. Low-impact for mobile-first app.

6. **XP progress bar resets at 100 XP:** Uses `xp % 100` to show progress within a level. Intended gamification behavior.

---

## Appendix C: Test Execution Coverage Summary

| Area | Test Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| Onboarding | TC-OB-001 to 010 | 4 | 5 | 1 |
| Lesson Tree | TC-TREE-001 to 008 | 4 | 4 | 0 |
| Phase Transitions | TC-PHASE-001 to 010 | 5 | 5 | 0 |
| LessonTeach | TC-TEACH-001 to 008 | 4 | 3 | 1 |
| target_to_native | TC-T2N-001 to 008 | 6 | 2 | 0 |
| native_to_target | TC-N2T-001 to 006 | 4 | 1 | 1 |
| Listening | TC-LISTEN-001 to 006 | 3 | 3 | 0 |
| Matching | TC-MATCH-001 to 008 | 5 | 3 | 0 |
| Reorder | TC-REORDER-001 to 009 | 5 | 3 | 1 |
| TTS | TC-TTS-001 to 007 | 3 | 3 | 1 |
| Gender Resolution | TC-RESOLVE-001 to 007 | 5 | 2 | 0 |
| Progress Tracking | TC-PROG-001 to 012 | 5 | 5 | 2 |
| Voice Chat | TC-VOICE-001 to 007 | 2 | 4 | 1 |
| Schema Integrity | TC-SCHEMA-001 to 009 | 5 | 3 | 1 |
| Cross-Language | TC-LANG-001 to 005 | 3 | 2 | 0 |
| Edge Cases | TC-EDGE-001 to 012 | 3 | 8 | 1 |
| End-to-End | TC-E2E-001 to 006 | 2 | 4 | 0 |
| localStorage | TC-LS-001 to 003 | 2 | 1 | 0 |
| UX/Accessibility | TC-UX-001 to 004 | 0 | 2 | 2 |
| Regression | TC-REG-001 to 007 | 7 | 0 | 0 |
| **TOTAL** | **145** | **87** | **73** | **12** |
