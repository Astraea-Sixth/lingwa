"""
Lingwa API — Lesson / curriculum endpoints
"""

import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

# Languages directory (relative to api/)
LANG_DIR = Path(__file__).parent.parent.parent / "languages"


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path.name}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {e}")


# ─────────────────────────────────────────────
# Language configs
# ─────────────────────────────────────────────

@router.get("/languages")
async def list_languages():
    """Return all available language configs."""
    configs = []
    for lang_dir in sorted(LANG_DIR.iterdir()):
        if lang_dir.is_dir():
            config_file = lang_dir / "config.json"
            if config_file.exists():
                configs.append(load_json(config_file))
    return configs


@router.get("/languages/{lang}/config")
async def get_language_config(lang: str):
    """Return config for a specific language."""
    if not re.match(r'^[a-z]{2,3}$', lang):
        raise HTTPException(status_code=422, detail=f"Invalid language code: '{lang}'")
    config_path = LANG_DIR / lang / "config.json"
    if not config_path.exists():
        raise HTTPException(status_code=404, detail=f"Language '{lang}' not found")
    return load_json(config_path)


# ─────────────────────────────────────────────
# Curriculum
# ─────────────────────────────────────────────

def _validate_lang_level(lang: str, level: str):
    """Validate lang/level params to prevent path traversal."""
    if not re.match(r'^[a-z]{2,3}$', lang):
        raise HTTPException(status_code=422, detail=f"Invalid language code: '{lang}'")
    if not re.match(r'^[a-z][0-9]$', level.lower()):
        raise HTTPException(status_code=422, detail=f"Invalid level: '{level}'")


@router.get("/courses/{lang}/{level}")
async def get_course(lang: str, level: str = "a1"):
    """Return a pre-built curated course for a language + level."""
    _validate_lang_level(lang, level)
    course_file = _find_course(lang, level)
    if not course_file:
        raise HTTPException(
            status_code=404,
            detail=f"No pre-built course for '{lang}' at level '{level}'. "
                   f"Available languages have courses in languages/{{code}}/courses/",
        )
    return load_json(course_file)


@router.get("/courses")
async def list_courses():
    """List all available pre-built courses."""
    courses = []
    for lang_dir in sorted(LANG_DIR.iterdir()):
        if not lang_dir.is_dir():
            continue
        if lang_dir.name.startswith('_'):  # skip _wordlists etc
            continue
        courses_dir = lang_dir / "courses"
        if not courses_dir.exists():
            continue
        config_path = lang_dir / "config.json"
        try:
            config = load_json(config_path) if config_path.exists() else {}
        except HTTPException:
            config = {}  # skip malformed configs
        for course_file in sorted(courses_dir.glob("*.json")):
            level = course_file.stem.upper()
            courses.append({
                "language": lang_dir.name,
                "languageName": config.get("name", lang_dir.name),
                "flag": config.get("flag", ""),
                "level": level,
                "path": f"/api/courses/{lang_dir.name}/{level.lower()}",
            })
    return courses


def _find_course(lang: str, level: str) -> Path | None:
    """Find course file: flat file first, then folder (general.json → first .json)."""
    # Try flat file (e.g. a1.json)
    flat = LANG_DIR / lang / "courses" / f"{level.lower()}.json"
    if flat.exists():
        return flat

    # Try folder with track files (e.g. a2/general.json)
    folder = LANG_DIR / lang / "courses" / level.lower()
    if folder.is_dir():
        for name in ["general", "default"]:
            track = folder / f"{name}.json"
            if track.exists():
                return track
        # Fallback: first .json in folder
        json_files = sorted(folder.glob("*.json"))
        if json_files:
            return json_files[0]

    return None


@router.get("/curriculum/{lang}/{level}")
async def get_curriculum(lang: str, level: str = "A1"):
    """Return the full curriculum for a language + level.
    Checks pre-built courses (flat file or folder) first, then falls back to legacy curriculum.json."""
    course_file = _find_course(lang, level)
    if course_file:
        return load_json(course_file)

    # Legacy fallback
    curriculum_path = LANG_DIR / lang / "curriculum.json"
    if not curriculum_path.exists():
        raise HTTPException(status_code=404, detail=f"Curriculum for '{lang}' not found")

    return load_json(curriculum_path)


def _load_curriculum(lang: str, level: str) -> dict:
    """Load curriculum from course file or legacy curriculum.json."""
    course_file = _find_course(lang, level)
    if course_file:
        return load_json(course_file)
    curriculum_path = LANG_DIR / lang / "curriculum.json"
    if curriculum_path.exists():
        return load_json(curriculum_path)
    raise HTTPException(status_code=404, detail=f"Curriculum for '{lang}' not found")


@router.get("/curriculum/{lang}/{level}/unit/{unit_id}")
async def get_unit(lang: str, level: str, unit_id: int):
    """Return a specific unit from the curriculum."""
    curriculum = _load_curriculum(lang, level)
    unit = next((u for u in curriculum.get("units", []) if u.get("id", u.get("unit")) == unit_id), None)

    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")

    return unit


@router.get("/curriculum/{lang}/{level}/lesson/{lesson_id}")
async def get_lesson(lang: str, level: str, lesson_id: str):
    """Return a specific lesson by ID (e.g. '1.3')."""
    curriculum = _load_curriculum(lang, level)

    for unit in curriculum.get("units", []):
        lesson = next((l for l in unit.get("lessons", []) if l["id"] == lesson_id), None)
        if lesson:
            return lesson

    raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found")
