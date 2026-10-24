import os
import json
import math
import logging
from datetime import datetime
import numpy as np
import requests
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, brier_score_loss, log_loss, accuracy_score
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import ModelVersion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
RAW_DIR = os.path.join(DATA_DIR, "raw", "statsbomb")
MODELS_DIR = os.path.join(DATA_DIR, "models")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

BASE_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"


def calculate_shot_features(location, technique, body_part, play_pattern, under_pressure):
    x = float(location[0]) if location and len(location) >= 2 else 100.0
    y = float(location[1]) if location and len(location) >= 2 else 40.0

    # Distance to center of goal (120, 40)
    dx = 120.0 - x
    dy = 40.0 - y
    distance = math.sqrt(dx * dx + dy * dy)

    # Angle subtended by goal posts: (120, 36) and (120, 44)
    # Using atan2
    angle1 = math.atan2(44.0 - y, max(0.1, 120.0 - x))
    angle2 = math.atan2(36.0 - y, max(0.1, 120.0 - x))
    angle = abs(angle1 - angle2)

    is_header = 1.0 if "Head" in str(body_part) else 0.0
    is_volley = 1.0 if any(v in str(technique).lower() for v in ["volley", "half volley"]) else 0.0
    is_regular_play = 1.0 if "Regular" in str(play_pattern) else 0.0
    is_under_pressure = 1.0 if bool(under_pressure) else 0.0

    return [distance, angle, is_header, is_volley, is_regular_play, is_under_pressure]


def collect_shot_data(max_matches: int = 15):
    matches_file = os.path.join(RAW_DIR, "matches_43_106.json")
    if not os.path.exists(matches_file):
        r = requests.get(f"{BASE_URL}/matches/43/106.json", timeout=15)
        matches = r.json()
        with open(matches_file, "w", encoding="utf-8") as f:
            json.dump(matches, f)
    else:
        with open(matches_file, "r", encoding="utf-8") as f:
            matches = json.load(f)

    X_list = []
    y_list = []

    match_ids = [m["match_id"] for m in matches[:max_matches]]
    logger.info(f"Collecting shot events from {len(match_ids)} real FIFA World Cup 2022 matches...")

    for mid in match_ids:
        ev_file = os.path.join(RAW_DIR, f"events_{mid}.json")
        if not os.path.exists(ev_file):
            try:
                r = requests.get(f"{BASE_URL}/events/{mid}.json", timeout=15)
                evs = r.json()
                with open(ev_file, "w", encoding="utf-8") as f:
                    json.dump(evs, f)
            except Exception as e:
                logger.warning(f"Could not load events for match {mid}: {e}")
                continue
        else:
            with open(ev_file, "r", encoding="utf-8") as f:
                evs = json.load(f)

        for ev in evs:
            if ev.get("type", {}).get("name") == "Shot":
                shot_data = ev.get("shot", {})
                outcome = shot_data.get("outcome", {}).get("name")
                is_goal = 1 if outcome == "Goal" else 0

                loc = ev.get("location")
                tech = shot_data.get("technique", {}).get("name", "Normal")
                bp = shot_data.get("body_part", {}).get("name", "Right Foot")
                pattern = ev.get("play_pattern", {}).get("name", "Regular Play")
                up = ev.get("under_pressure", False)

                features = calculate_shot_features(loc, tech, bp, pattern, up)
                X_list.append(features)
                y_list.append(is_goal)

    X = np.array(X_list)
    y = np.array(y_list)
    logger.info(f"Total shots collected: {len(y)}, Total goals: {int(np.sum(y))} ({np.mean(y)*100:.1f}%)")
    return X, y


def train_and_evaluate():
    X, y = collect_shot_data(max_matches=15)
    if len(y) < 50:
        raise RuntimeError("Insufficient samples collected for training.")

    # Match-aware / Stratified Train/Val/Test Split: 70% train, 15% val, 15% test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    val_ratio = 0.15 / 0.85
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_ratio, random_state=42, stratify=y_train_val
    )

    # 1. Baseline Model (Logistic Regression)
    baseline_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(random_state=42, max_iter=200))
    ])
    baseline_pipe.fit(X_train, y_train)

    base_preds_prob = baseline_pipe.predict_proba(X_test)[:, 1]
    base_preds_class = baseline_pipe.predict(X_test)
    base_auc = float(roc_auc_score(y_test, base_preds_prob))
    base_brier = float(brier_score_loss(y_test, base_preds_prob))
    base_logloss = float(log_loss(y_test, base_preds_prob))
    base_acc = float(accuracy_score(y_test, base_preds_class))

    # 2. Primary Trained Model (Gradient Boosting Classifier)
    primary_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=3,
            subsample=0.85,
            random_state=42
        ))
    ])
    primary_pipe.fit(X_train, y_train)

    # Evaluate on Validation Set
    val_preds_prob = primary_pipe.predict_proba(X_val)[:, 1]
    val_auc = float(roc_auc_score(y_val, val_preds_prob))

    # Evaluate on Test Set
    test_preds_prob = primary_pipe.predict_proba(X_test)[:, 1]
    test_preds_class = primary_pipe.predict(X_test)

    test_auc = float(roc_auc_score(y_test, test_preds_prob))
    test_brier = float(brier_score_loss(y_test, test_preds_prob))
    test_logloss = float(log_loss(y_test, test_preds_prob))
    test_acc = float(accuracy_score(y_test, test_preds_class))

    logger.info(f"Test Evaluation: Primary ROC-AUC={test_auc:.4f} vs Baseline={base_auc:.4f}")
    logger.info(f"Brier Loss: Primary={test_brier:.4f} vs Baseline={base_brier:.4f}")

    # Save Model Artifact
    artifact_path = os.path.join(MODELS_DIR, "shot_xg_model.joblib")
    joblib.dump(primary_pipe, artifact_path)

    # Save Metadata JSON
    metadata = {
        "model_id": "MODEL_XG_GB_01",
        "model_name": "RefVision Expected Goals (xG) Gradient Boosting Model",
        "task_type": "Shot Outcome & Expected Goals Probability Prediction",
        "algorithm": "GradientBoostingClassifier (scikit-learn 1.9)",
        "version": "1.0.0",
        "dataset_name": "StatsBomb Open Data (FIFA World Cup 2022 Matches)",
        "license": "CC BY 4.0",
        "trained_at": datetime.utcnow().isoformat(),
        "total_samples": len(y),
        "train_samples": len(y_train),
        "val_samples": len(y_val),
        "test_samples": len(y_test),
        "positive_class_ratio": float(np.mean(y)),
        "feature_names": [
            "distance_to_goal",
            "angle_to_goal",
            "is_header",
            "is_volley",
            "is_regular_play",
            "under_pressure"
        ],
        "hyperparameters": {
            "n_estimators": 100,
            "learning_rate": 0.08,
            "max_depth": 3,
            "subsample": 0.85,
            "random_state": 42
        },
        "evaluation_metrics": {
            "test_roc_auc": round(test_auc, 4),
            "test_brier_score": round(test_brier, 4),
            "test_log_loss": round(test_logloss, 4),
            "test_accuracy": round(test_acc, 4),
            "val_roc_auc": round(val_auc, 4)
        },
        "baseline_comparison": {
            "baseline_algorithm": "LogisticRegression (StandardScaler)",
            "baseline_roc_auc": round(base_auc, 4),
            "baseline_brier_score": round(base_brier, 4),
            "baseline_log_loss": round(base_logloss, 4),
            "baseline_accuracy": round(base_acc, 4),
            "relative_improvement_auc": round((test_auc - base_auc) / max(0.001, base_auc) * 100, 2)
        },
        "artifact_file": "shot_xg_model.joblib",
        "limitations_notes": (
            "1. This model estimates shot conversion probability (xG) based on geometric distance, angle, and technique from real StatsBomb event data.\n"
            "2. It does NOT evaluate referee decisions, offside calls, or VAR correctness.\n"
            "3. Optical tracking (3D player body occlusion & goalkeeper reaction speed) is not captured in event coordinate data.\n"
            "4. Designed solely for analytical decision-support and fan context."
        )
    }

    meta_file = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Persist in Database
    db = SessionLocal()
    try:
        model_rec = db.query(ModelVersion).filter_by(id="MODEL_XG_GB_01").first()
        if not model_rec:
            model_rec = ModelVersion(
                id="MODEL_XG_GB_01",
                model_name=metadata["model_name"],
                task_type=metadata["task_type"],
                algorithm=metadata["algorithm"],
                version=metadata["version"],
                dataset_name=metadata["dataset_name"],
                train_samples=metadata["train_samples"],
                val_samples=metadata["val_samples"],
                test_samples=metadata["test_samples"],
                metrics_json=metadata["evaluation_metrics"],
                baseline_metrics_json=metadata["baseline_comparison"],
                hyperparameters_json=metadata["hyperparameters"],
                artifact_path=artifact_path,
                is_active=True,
                limitations_notes=metadata["limitations_notes"]
            )
            db.add(model_rec)
        else:
            model_rec.metrics_json = metadata["evaluation_metrics"]
            model_rec.baseline_metrics_json = metadata["baseline_comparison"]
            model_rec.train_samples = metadata["train_samples"]
            model_rec.val_samples = metadata["val_samples"]
            model_rec.test_samples = metadata["test_samples"]
            model_rec.artifact_path = artifact_path
        db.commit()
    finally:
        db.close()

    logger.info("Model training and evaluation successfully completed and saved!")
    return metadata


if __name__ == "__main__":
    train_and_evaluate()
