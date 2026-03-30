#!/usr/bin/env python3
"""
Lingwa — Expand exercises to cover all vocabulary per lesson.

Reads each lesson's vocabulary and existing exercises, then generates
additional exercises (target_to_native, native_to_target, listening,
matching) so every vocab word appears in at least one exercise.

Output is static JSON — no LLM, no runtime generation.
Run once, review, ship.

Usage:
  python3 scripts/expand_exercises.py            # dry-run (shows stats only)
  python3 scripts/expand_exercises.py --write    # writes changes to JSON files
"""

import json
import sys
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGUAGES_DIR = ROOT / "languages"

# ─── Helpers ───

def get_vocab_words(vocab):
    """Extract base words from vocabulary list."""
    return [v["word"] for v in vocab if isinstance(v, dict)]


def get_covered_words(exercises):
    """Find which vocab words are already covered by existing exercises."""
    covered = set()
    for ex in exercises:
        t = ex.get("type", "")
        if t == "target_to_native":
            covered.add(ex.get("word", ""))
        elif t == "native_to_target":
            opts = ex.get("options", {})
            neutral = opts.get("neutral", [])
            correct = ex.get("correct", 0)
            if neutral and correct < len(neutral):
                covered.add(neutral[correct])
        elif t == "listening":
            covered.add(ex.get("audio_text", ""))
        elif t == "matching":
            for p in ex.get("pairs", []):
                covered.add(p.get("target", ""))
        elif t == "reorder":
            for w in ex.get("correct_order", {}).get("neutral", ex.get("correct_order", [])):
                if isinstance(w, str):
                    covered.add(w)
    return covered


def get_vocab_by_word(vocab, word):
    """Find vocab item by word."""
    for v in vocab:
        if isinstance(v, dict) and v.get("word") == word:
            return v
    return None


def pick_distractors(vocab, exclude_word, count=3):
    """Pick `count` vocab items as wrong answers, excluding the target."""
    candidates = [v for v in vocab if isinstance(v, dict) and v["word"] != exclude_word]
    random.shuffle(candidates)
    return candidates[:count]


def get_meanings(v):
    """Get meanings dict from vocab item (handles both 'meaning' and 'meanings')."""
    if "meanings" in v and isinstance(v["meanings"], dict):
        return v["meanings"]
    if "meaning" in v:
        return {"en": v["meaning"]}
    return {"en": ""}


# ─── Exercise Builders ───

def make_target_to_native(target_vocab, distractors):
    """Build a target_to_native exercise: show target word → pick native meaning."""
    all_items = [target_vocab] + distractors
    meanings_list = [get_meanings(v) for v in all_items]

    # Build multi-lang options
    langs = list(meanings_list[0].keys())
    options = {}
    for lang in langs:
        options[lang] = [m.get(lang, m.get("en", "")) for m in meanings_list]

    ex = {
        "type": "target_to_native",
        "word": target_vocab["word"],
        "romanization": target_vocab.get("romanization", ""),
        "options": options,
        "correct": 0,
    }

    # Add gendered_word if available
    if "gendered" in target_vocab and target_vocab["gendered"]:
        ex["gendered_word"] = target_vocab["gendered"]

    return ex


def make_native_to_target(target_vocab, distractors, lang_name_map):
    """Build a native_to_target exercise: show native meaning → pick target word."""
    all_items = [target_vocab] + distractors
    meanings = get_meanings(target_vocab)

    # Build multi-lang question
    question = {}
    for lang, meaning in meanings.items():
        question[lang] = f"\"{meaning}\""

    # Build options (neutral + gendered)
    options = {
        "neutral": [v["word"] for v in all_items]
    }
    if any(v.get("gendered") for v in all_items):
        options["male"] = [
            v.get("gendered", {}).get("male", {}).get("word", v["word"])
            for v in all_items
        ]
        options["female"] = [
            v.get("gendered", {}).get("female", {}).get("word", v["word"])
            for v in all_items
        ]

    return {
        "type": "native_to_target",
        "question": question,
        "options": options,
        "correct": 0,
    }


def make_listening(target_vocab, distractors):
    """Build a listening exercise: hear target word → pick native meaning."""
    all_items = [target_vocab] + distractors
    meanings_list = [get_meanings(v) for v in all_items]

    langs = list(meanings_list[0].keys())
    options = {}
    for lang in langs:
        options[lang] = [m.get(lang, m.get("en", "")) for m in meanings_list]

    ex = {
        "type": "listening",
        "audio_text": target_vocab["word"],
        "romanization": target_vocab.get("romanization", ""),
        "options": options,
        "correct": 0,
    }

    if "gendered" in target_vocab and target_vocab["gendered"]:
        gendered_audio = {}
        if target_vocab["gendered"].get("male"):
            gendered_audio["male"] = {
                "audio_text": target_vocab["gendered"]["male"]["word"],
                "romanization": target_vocab["gendered"]["male"].get("romanization", ""),
            }
        if target_vocab["gendered"].get("female"):
            gendered_audio["female"] = {
                "audio_text": target_vocab["gendered"]["female"]["word"],
                "romanization": target_vocab["gendered"]["female"].get("romanization", ""),
            }
        if gendered_audio:
            ex["gendered_audio"] = gendered_audio

    return ex


def make_matching(vocab_items):
    """Build a matching exercise from 4-5 vocab items."""
    pairs = []
    for v in vocab_items:
        pairs.append({
            "target": v["word"],
            "romanization": v.get("romanization", ""),
            "native": get_meanings(v),
        })
    return {
        "type": "matching",
        "pairs": pairs,
    }


# ─── Main Logic ───

def expand_lesson(vocab, exercises, seed_str=""):
    """Add exercises to cover all uncovered vocab words. Returns new exercise list."""
    all_words = get_vocab_words(vocab)
    covered = get_covered_words(exercises)
    missing = [w for w in all_words if w not in covered]

    if not missing:
        return exercises, 0  # all covered already

    # Seed for deterministic output per lesson
    random.seed(hash(seed_str + "".join(all_words)))

    new_exercises = list(exercises)  # keep existing
    random.shuffle(missing)

    # Cycle through exercise types for missing words
    types = ["target_to_native", "native_to_target", "listening"]
    type_idx = 0

    for word in missing:
        v = get_vocab_by_word(vocab, word)
        if not v:
            continue

        distractors = pick_distractors(vocab, word, 3)
        if len(distractors) < 3:
            continue  # need at least 3 distractors

        ex_type = types[type_idx % len(types)]
        type_idx += 1

        if ex_type == "target_to_native":
            new_exercises.append(make_target_to_native(v, distractors))
        elif ex_type == "native_to_target":
            new_exercises.append(make_native_to_target(v, distractors, {}))
        elif ex_type == "listening":
            new_exercises.append(make_listening(v, distractors))

    # Add a second matching exercise if we have enough uncovered words
    existing_matching_words = set()
    for ex in exercises:
        if ex.get("type") == "matching":
            for p in ex.get("pairs", []):
                existing_matching_words.add(p.get("target", ""))

    unmatched = [w for w in all_words if w not in existing_matching_words]
    if len(unmatched) >= 4:
        # Build matching exercises from unmatched words, groups of 4-5
        random.shuffle(unmatched)
        while len(unmatched) >= 4:
            batch = unmatched[:5]
            unmatched = unmatched[5:]
            items = [get_vocab_by_word(vocab, w) for w in batch]
            items = [i for i in items if i]
            if len(items) >= 4:
                new_exercises.append(make_matching(items))

    added = len(new_exercises) - len(exercises)
    return new_exercises, added


def process_file(filepath, write=False):
    """Process a single course JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_added = 0
    total_lessons = 0

    for unit in data.get("units", []):
        for lesson in unit.get("lessons", []):
            vocab = lesson.get("vocabulary", [])
            exercises = lesson.get("exercises", [])
            lesson_id = lesson.get("id", "")

            if not vocab or not exercises:
                continue

            total_lessons += 1
            new_exercises, added = expand_lesson(vocab, exercises, seed_str=lesson_id)
            lesson["exercises"] = new_exercises
            total_added += added

    if write and total_added > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    return total_lessons, total_added


def main():
    write = "--write" in sys.argv

    if write:
        print("MODE: WRITE (modifying JSON files)\n")
    else:
        print("MODE: DRY-RUN (showing stats only, use --write to apply)\n")

    grand_total_lessons = 0
    grand_total_added = 0

    for lang_dir in sorted(LANGUAGES_DIR.iterdir()):
        if not lang_dir.is_dir():
            continue
        courses_dir = lang_dir / "courses"
        if not courses_dir.exists():
            continue

        lang = lang_dir.name
        lang_added = 0
        lang_lessons = 0

        for course_file in sorted(courses_dir.glob("**/*.json")):
            lessons, added = process_file(course_file, write=write)
            lang_lessons += lessons
            lang_added += added

            rel = course_file.relative_to(ROOT)
            if added > 0:
                print(f"  {rel}: {lessons} lessons, +{added} exercises")

        if lang_lessons > 0:
            print(f"[{lang}] {lang_lessons} lessons, +{lang_added} exercises added")
            print()

        grand_total_lessons += lang_lessons
        grand_total_added += lang_added

    print(f"TOTAL: {grand_total_lessons} lessons, +{grand_total_added} exercises")

    if not write and grand_total_added > 0:
        print("\nRun with --write to apply changes.")


if __name__ == "__main__":
    main()
