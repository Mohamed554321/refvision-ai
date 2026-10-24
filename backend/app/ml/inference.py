import os
import json
import math
import joblib
import numpy as np
from typing import Dict, Any, Optional

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "models"))
MODEL_PATH = os.path.join(MODELS_DIR, "shot_xg_model.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

_cached_model = None
_cached_metadata = None


def get_model():
    global _cached_model, _cached_metadata
    if _cached_model is None and os.path.exists(MODEL_PATH):
        try:
            _cached_model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Failed to load ML model from {MODEL_PATH}: {e}")
            _cached_model = None

    if _cached_metadata is None and os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                _cached_metadata = json.load(f)
        except Exception:
            _cached_metadata = None

    return _cached_model, _cached_metadata


def predict_shot_xg(
    x: float,
    y: float,
    technique: str = "Normal",
    body_part: str = "Right Foot",
    play_pattern: str = "Regular Play",
    under_pressure: bool = False
) -> Dict[str, Any]:
    model, metadata = get_model()

    # Calculate spatial features
    dx = 120.0 - float(x)
    dy = 40.0 - float(y)
    distance = math.sqrt(dx * dx + dy * dy)

    angle1 = math.atan2(44.0 - y, max(0.1, 120.0 - x))
    angle2 = math.atan2(36.0 - y, max(0.1, 120.0 - x))
    angle = abs(angle1 - angle2)

    is_header = 1.0 if "head" in body_part.lower() else 0.0
    is_volley = 1.0 if any(v in technique.lower() for v in ["volley", "half"]) else 0.0
    is_regular_play = 1.0 if "regular" in play_pattern.lower() else 0.0
    is_under_pressure = 1.0 if bool(under_pressure) else 0.0

    features = np.array([[distance, angle, is_header, is_volley, is_regular_play, is_under_pressure]])

    if model is not None:
        try:
            prob = float(model.predict_proba(features)[0][1])
            is_predicted_goal = bool(prob >= 0.5)
            status = "MODEL_INFERENCE_SUCCESS"
        except Exception as e:
            # Fallback heuristic calculation if inference error
            prob = max(0.01, min(0.95, math.exp(-0.08 * distance) * math.sin(max(0.1, angle / 2))))
            is_predicted_goal = bool(prob >= 0.5)
            status = f"FALLBACK_HEURISTIC ({e})"
    else:
        # Transparent fallback if model artifact not loaded
        prob = max(0.01, min(0.95, math.exp(-0.08 * distance) * math.sin(max(0.1, angle / 2))))
        is_predicted_goal = bool(prob >= 0.5)
        status = "MODEL_ARTIFACT_UNAVAILABLE_FALLBACK"

    return {
        "model_id": metadata.get("model_id", "MODEL_XG_GB_01") if metadata else "MODEL_XG_GB_01",
        "model_version": metadata.get("version", "1.0.0") if metadata else "1.0.0",
        "algorithm": metadata.get("algorithm", "GradientBoostingClassifier") if metadata else "GradientBoostingClassifier",
        "status": status,
        "input_features": {
            "x": round(float(x), 2),
            "y": round(float(y), 2),
            "calculated_distance_meters": round(distance, 2),
            "calculated_angle_radians": round(angle, 3),
            "technique": technique,
            "body_part": body_part,
            "play_pattern": play_pattern,
            "under_pressure": bool(under_pressure)
        },
        "predicted_xg": round(prob, 4),
        "predicted_outcome": "Goal" if is_predicted_goal else "No Goal",
        "confidence_bracket": (
            "High Probability (Quality Chance)" if prob >= 0.35 else
            "Moderate Probability (Contested Shot)" if prob >= 0.15 else
            "Low Probability (Difficult Angle/Distance)"
        ),
        "limitations": (
            "Estimates statistical shot conversion probability (xG) based on coordinate geometry and technique. "
            "Does not evaluate refereeing accuracy, offside, or goalkeeper positioning."
        )
    }
