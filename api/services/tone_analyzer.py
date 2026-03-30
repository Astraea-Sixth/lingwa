"""
Lingwa — Tone Analyzer

Extracts pitch contour from audio and classifies tones for tonal languages.
Uses librosa PYIN for F0 extraction, semitone normalization for gender independence,
and a slope+mean decision tree for tone classification.

Supports:
- Thai: 5 tones (mid, low, falling, high, rising)
- Chinese: 4 tones + neutral (1=high flat, 2=rising, 3=dipping, 4=falling, 0=neutral)
"""

import io
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Lazy imports to avoid slow startup
_librosa = None
_soundfile = None


def _get_librosa():
    global _librosa
    if _librosa is None:
        import librosa
        _librosa = librosa
    return _librosa


def _get_soundfile():
    global _soundfile
    if _soundfile is None:
        import soundfile
        _soundfile = soundfile
    return _soundfile


# ─── Thai Tone Definitions ───
# Each tone is defined by its pitch contour shape in semitones relative to speaker median.
# slope = linear regression slope of the F0 contour
# mean  = mean F0 in semitones relative to speaker median

THAI_TONES = {
    "mid":     {"slope_range": (-2.5, 2.5), "mean_range": (-2.0, 2.0)},
    "low":     {"slope_range": (-2.5, 2.5), "mean_range": (-999, -2.0)},
    "falling": {"slope_range": (-999, -2.5), "mean_range": (-999, 999)},
    "high":    {"slope_range": (-2.5, 2.5), "mean_range": (2.0, 999)},
    "rising":  {"slope_range": (2.5, 999),  "mean_range": (-999, 999)},
}

# Chinese tones — same slope+mean approach
CHINESE_TONES = {
    "1": {"slope_range": (-2.5, 2.5), "mean_range": (2.0, 999)},    # high flat
    "2": {"slope_range": (2.5, 999),  "mean_range": (-999, 999)},    # rising
    "3": {"is_dipping": True},                                        # dipping (special)
    "4": {"slope_range": (-999, -2.5), "mean_range": (-999, 999)},   # falling
    "0": {"is_neutral": True},                                        # neutral (short, mid)
}


def extract_f0(audio_bytes: bytes, sr: int = 16000) -> tuple[np.ndarray, float]:
    """
    Extract F0 contour from audio bytes.

    Returns:
        (f0_hz, duration_seconds) where f0_hz has NaN for unvoiced frames
    """
    librosa = _get_librosa()
    sf = _get_soundfile()

    # Load audio
    audio_data, file_sr = sf.read(io.BytesIO(audio_bytes))
    if len(audio_data.shape) > 1:
        audio_data = audio_data.mean(axis=1)  # mono

    # Resample if needed
    if file_sr != sr:
        audio_data = librosa.resample(audio_data, orig_sr=file_sr, target_sr=sr)

    duration = len(audio_data) / sr

    # Extract F0 using PYIN (more robust than YIN for noisy speech)
    f0, voiced_flag, voiced_probs = librosa.pyin(
        audio_data,
        fmin=75,    # low male voice
        fmax=500,   # high female voice
        sr=sr,
        frame_length=2048,
        hop_length=512,
    )

    return f0, duration


def normalize_to_semitones(f0: np.ndarray) -> np.ndarray:
    """
    Convert F0 in Hz to semitones relative to speaker's median F0.
    This makes the contour gender-independent.
    """
    voiced = f0[~np.isnan(f0)]
    if len(voiced) < 3:
        return np.array([])

    median_f0 = np.median(voiced)
    if median_f0 <= 0:
        return np.array([])

    # Convert to semitones: 12 * log2(f0 / median)
    semitones = 12 * np.log2(f0 / median_f0)

    # Keep only voiced frames
    semitones = semitones[~np.isnan(semitones)]

    # Median filter to smooth noise (window=5)
    if len(semitones) >= 5:
        from scipy.ndimage import median_filter
        semitones = median_filter(semitones, size=5)

    return semitones


def classify_tone_thai(semitones: np.ndarray) -> tuple[str, float]:
    """
    Classify a Thai tone from a semitone contour.

    Returns:
        (tone_name, confidence) where tone_name is one of: mid, low, falling, high, rising
    """
    if len(semitones) < 3:
        return "mid", 0.3  # too short to classify

    mean_st = float(np.mean(semitones))
    # Linear regression for slope
    x = np.arange(len(semitones))
    slope = float(np.polyfit(x, semitones, 1)[0]) * len(semitones)  # total semitone change

    # Classification by slope first (direction is most distinctive)
    if slope < -2.5:
        return "falling", min(1.0, abs(slope) / 6.0)
    if slope > 2.5:
        return "rising", min(1.0, abs(slope) / 6.0)

    # Flat contour — classify by register
    if mean_st < -2.0:
        return "low", min(1.0, abs(mean_st) / 4.0)
    if mean_st > 2.0:
        return "high", min(1.0, abs(mean_st) / 4.0)

    return "mid", 0.6  # default for flat, near-center pitch


def classify_tone_chinese(semitones: np.ndarray) -> tuple[str, float]:
    """
    Classify a Chinese tone from a semitone contour.

    Returns:
        (tone_number, confidence) where tone_number is "1", "2", "3", "4", or "0"
    """
    if len(semitones) < 3:
        return "0", 0.3  # too short

    mean_st = float(np.mean(semitones))
    x = np.arange(len(semitones))
    slope = float(np.polyfit(x, semitones, 1)[0]) * len(semitones)

    # Check for Tone 3 (dipping): V-shape
    if len(semitones) >= 6:
        mid_idx = len(semitones) // 2
        first_half = semitones[:mid_idx]
        second_half = semitones[mid_idx:]
        min_idx = np.argmin(semitones)

        # Dip detected: minimum in middle third, first half falling, second half rising
        if len(semitones) // 3 <= min_idx <= 2 * len(semitones) // 3:
            first_slope = float(np.polyfit(np.arange(len(first_half)), first_half, 1)[0]) * len(first_half)
            second_slope = float(np.polyfit(np.arange(len(second_half)), second_half, 1)[0]) * len(second_half)
            if first_slope < -1.5 and second_slope > 1.5:
                return "3", min(1.0, (abs(first_slope) + abs(second_slope)) / 8.0)

    # Tone 4: falling
    if slope < -2.5:
        return "4", min(1.0, abs(slope) / 6.0)

    # Tone 2: rising
    if slope > 2.5:
        return "2", min(1.0, abs(slope) / 6.0)

    # Tone 1: high flat
    if mean_st > 1.5:
        return "1", min(1.0, abs(mean_st) / 4.0)

    # Tone 3 fallback: low flat (half-third in connected speech)
    if mean_st < -1.5:
        return "3", 0.5

    # Neutral
    return "0", 0.4


def analyze_tone(
    audio_bytes: bytes,
    lang: str,
    expected_tone: str,
) -> dict:
    """
    Full tone analysis pipeline.

    Args:
        audio_bytes: raw audio file bytes (WAV or WebM)
        lang: language code ("th" or "zh")
        expected_tone: expected tone from vocabulary data (e.g. "rising", "3")

    Returns:
        {
            "detected_tone": "rising",
            "expected_tone": "falling",
            "tone_correct": False,
            "confidence": 0.75,
            "feedback": "Your tone went up, but สวัสดี has a falling tone — try going high then dropping down"
        }
    """
    try:
        f0, duration = extract_f0(audio_bytes)
        semitones = normalize_to_semitones(f0)

        if len(semitones) < 3:
            return {
                "detected_tone": "unknown",
                "expected_tone": expected_tone,
                "tone_correct": True,  # benefit of the doubt
                "confidence": 0.0,
                "feedback": "Couldn't analyse tone clearly — try speaking a bit louder",
            }

        if lang == "zh":
            detected, confidence = classify_tone_chinese(semitones)
            # Handle multi-syllable toneClass like "3-3" — check first syllable
            expected_first = expected_tone.split("-")[0] if "-" in expected_tone else expected_tone
            tone_correct = detected == expected_first
        else:
            # Thai (default)
            detected, confidence = classify_tone_thai(semitones)
            tone_correct = detected == expected_tone

        # Generate feedback
        if tone_correct:
            feedback = "Tone is correct!"
        else:
            feedback = _generate_tone_feedback(lang, detected, expected_tone)

        return {
            "detected_tone": detected,
            "expected_tone": expected_tone,
            "tone_correct": tone_correct,
            "confidence": round(confidence, 2),
            "feedback": feedback,
        }

    except Exception as e:
        logger.warning(f"Tone analysis failed: {e}")
        return {
            "detected_tone": "unknown",
            "expected_tone": expected_tone,
            "tone_correct": True,  # benefit of the doubt on error
            "confidence": 0.0,
            "feedback": "",
        }


# ─── Tone Descriptions for Feedback ───

THAI_TONE_DESCRIPTIONS = {
    "mid": "flat and steady in the middle of your range",
    "low": "flat and low",
    "falling": "starting high then dropping down",
    "high": "flat and high",
    "rising": "starting low then going up",
}

CHINESE_TONE_DESCRIPTIONS = {
    "1": "high and flat",
    "2": "rising from middle to high",
    "3": "dipping down then rising back up",
    "4": "sharply falling from high to low",
    "0": "short and neutral",
}


def _generate_tone_feedback(lang: str, detected: str, expected: str) -> str:
    if lang == "zh":
        desc = CHINESE_TONE_DESCRIPTIONS
        expected_first = expected.split("-")[0] if "-" in expected else expected
        exp_desc = desc.get(expected_first, expected_first)
        det_desc = desc.get(detected, detected)
        return f"Your tone sounded {det_desc}, but it should be {exp_desc} (tone {expected_first})"
    else:
        desc = THAI_TONE_DESCRIPTIONS
        exp_desc = desc.get(expected, expected)
        det_desc = desc.get(detected, detected)
        return f"Your tone sounded {det_desc}, but it should be {exp_desc} ({expected} tone)"
