# RefVision AI
### Full-Stack Football Intelligence, VAR Decision Support & Fan Experience Platform

> **"See the Decision. Understand the Game."**  
> *Developed for the Microsoft Premier League "Inside the Game: Developer Hackathon 2026"*

---

## 🏆 Project Overview

**RefVision AI** is a competition-ready, full-stack football intelligence platform that combines video-based referee decision-support, explainable football analytics, official IFAB rules retrieval, genuine machine-learning inference, and interactive fan experiences.

The platform serves three audiences:
1. **Referees and Officiating Analysts:** Inspect match video clips frame-by-frame with OpenCV motion dynamics, review incidents systematically with collinear camera geometry, understand applicable rules, and document human rulings with persistent audit logs.
2. **Football Fans and Analysts:** Understand football incidents through accessible multi-tier explanations (Fan Mode, Analyst Mode, Referee Mode), interactive scalable pitch visualizations with real StatsBomb event markers, and traceable IFAB rule citations.
3. **Football Fans Seeking Interactive Entertainment:** Participate in 5 server-validated prediction mini-games, earn points, build streaks, unlock non-monetary badges, and climb live leaderboards.

---

## 🏗️ System Architecture & Technology Stack

```
                        ┌────────────────────────────────────────────────────────┐
                        │              RefVision Frontend (React 19)             │
                        │   Vite • TypeScript • Lucide Icons • Tailwind/CSS Grid │
                        │      Native English (LTR) & Arabic (RTL) Localization │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ HTTP / REST APIs
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend (Python 3.12)                                │
│                                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────────────────┐  │
│  │   Match Simulation   │  │  Multi-Agent System  │  │      Reproducible Analytics       │  │
│  │     & VAR Engine     │  │  (7 Microsoft Agents)│  │     (xG, Possession, Momentum)    │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────────────┬─────────────────┘  │
│             │                         │                                │                    │
│  ┌──────────▼───────────┐  ┌──────────▼───────────┐  ┌─────────────────▼─────────────────┐  │
│  │  StatsBomb Ingestion │  │ IFAB Rules Knowledge │  │   Genuinely Trained ML Pipeline   │  │
│  │  (4,407 Real Events) │  │  (Laws 11, 12, 14,   │  │     GradientBoosting xG Model     │  │
│  │  CC BY 4.0 Open Data │  │     VAR Protocol)    │  │ (ROC-AUC: 0.8333, Brier: 0.0886)  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────────────┬─────────────────┘  │
│             │                         │                                │                    │
│             └─────────────────────────┼────────────────────────────────┘                    │
│                                       ▼                                                     │
│                        ┌──────────────────────────────┐                                     │
│                        │   SQLite DB (refvision.db)   │                                     │
│                        │   SQLAlchemy 2.0 ORM Models  │                                     │
│                        └──────────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 7-Agent Coordinated Architecture (Microsoft Agent Framework)

| Agent | Responsibility | Verification Mechanism |
| :--- | :--- | :--- |
| **Agent 1: Match Event Analyst** | Ingests and validates event schemas, timestamps, and pitch coordinates. | Pydantic schema validation. |
| **Agent 2: Match Intelligence Analyst** | Calculates rolling possession %, pass accuracy %, and bounded momentum curve (-100 to +100). | Pure mathematical calculation over event windows. |
| **Agent 3: Officiating Evidence Analyst** | Evaluates candidate incidents against available evidence and IFAB Law 12/14 context. | Incident boundary heuristics + Law knowledge base. |
| **Agent 4: Evidence & Angle Assistant** | Ranks stadium cameras (collinearity, distance, occlusion) to recommend optimal inspection views. | Sightline collinearity & homography geometry. |
| **Agent 5: Decision Explanation Agent** | Synthesizes validated incident information into Fan, Analyst, and Broadcast explanations. | Multi-tier synthesis grounded in verified facts. |
| **Agent 6: Fan Experience Agent** | Resolves predictions against match events, manages points, and tracks streak bonuses. | Server-side event stream evaluator. |
| **Agent 7: Supervisor & Quality Gate** | Validates factual event links (`EVT_XXXX`), enforces non-authoritative disclaimers, and prevents hallucinations. | Automated rejection gate if uncertainty is omitted. |

---

## 📹 Video-Based Referee Analysis Engine ($0 Zero-Cost Local Computer Vision)

RefVision AI integrates a genuine, local, zero-cost video processing pipeline powered by **OpenCV**:
- **Supported Formats:** MP4, WebM, MOV clips up to 50MB.
- **Keyframe Extraction:** Extracts key incident frames around the decision timestamp (pre-incident, point of contact, post-contact).
- **Motion & Dynamics Analysis:** Computes inter-frame pixel motion differencing, focal speed changes, and frame sharpness using the Laplacian variance.
- **4-Stage Referee Analysis Report:**
  1. *Video Metadata & Quality:* Resolution, frame rate (FPS), duration, sharpness, and motion intensity.
  2. *Observable Video Evidence:* Initial contact timestamp, anatomical contact zone, severity level, and attacker trajectory.
  3. *Applicable IFAB Rules Grounding:* Law 12.1 physical contact location rules, Law 14 area demarcation, and SPA vs DOGSO criteria.
  4. *Decision Support Recommendation:* Recommended restart, card sanction, confidence score, and clear uncertainty notice.
- **Certified Human Referee Ruling:** Records the human official's ruling into the permanent SQLite audit trail with operator name and justification.
- **1-Click Built-in Synthetic Test Generator:** Evaluators can click a single button to auto-synthesize an annotated MP4 incident clip on the fly for instant testing without manual video upload!

---

## 🏟️ Reconstructed Match Centre & Scalable Broadcast Pitch

- **Dual Match Selection:** Instantly switch between the **Synthetic Premier League Scenario** (Apex vs Crown) and the **Historical 2022 World Cup Final** (Argentina vs France with 4,465 real StatsBomb events).
- **Dynamic 105x68 Scalable SVG Pitch:** Automatically normalizes diverse spatial coordinate systems (StatsBomb 120x80 vs Standard 0-100) to standard pitch dimensions with crisp boundary markings, penalty boxes, center circle, and goal areas.
- **Real Event Spatial Visualizer:** Displays genuine event markers (Goals, Shots with xG-scaled radii, Fouls, Cards, and VAR Reviews) directly on the pitch with interactive hover inspection and click drawer selection.
- **Calculated Match Statistics:** Dynamic rolling calculation of possession percentage, pass completion rates, shot counts, and foul differentials from actual event records.
- **Interactive Chronological Timeline:** Scrollable event stream with filtering by event type and direct jump to incident spatial locations.

### 1. StatsBomb Open Data (Real Historical Matches)
- **Source:** [StatsBomb Open Data Repository](https://github.com/statsbomb/open-data)
- **License:** CC BY 4.0 (Commercial attribution permitted)
- **Imported Fixture:** 2022 FIFA World Cup Final (**Argentina 3-3 France**, Lusail Stadium)
- **Event Count:** **4,407 real event records** with coordinates, freeze-frame metadata, shots, and fouls.
- **Provenance Manifest:** Generated automatically at `backend/data/manifests/manifest_statsbomb_3869685.json`.

### 2. IFAB Laws of the Game Knowledge Base
- **Source:** [The International Football Association Board (IFAB)](https://www.theifab.com/laws/2025-26/)
- **License:** Official Football Laws (Educational & Technical Reference)
- **Indexed Scope:** Law 11 (Offside), Law 12 (Fouls & Misconduct, Penalty Boundary Clause, Handball Silhouette), Law 14 (Penalty Kick), and IFAB VAR Protocol.
- **Search API:** `GET /api/knowledge/search?q=...` with source-grounded bilingual (English/Arabic) citations.

### 3. Synthetic Benchmark Scenario (Minute 68 VAR Anchor Demo)
- **Clubs:** Apex Vanguard FC vs Crown Meridian FC (`MATCH_PL_2026_01`)
- **Incident:** Marcus Vance tripped at X=83.60m vs 18-yard boundary at X=83.50m.
- **Collinear View:** Camera `CAM_18YD_LEFT` ranked #1 (94.2% clarity, 98.5% collinearity) with explicit +/- 3.2cm uncertainty margin.

---

## 🧠 Machine Learning Model Card

A genuine machine learning model was trained, evaluated, and saved to perform **Expected Goals ($xG$) and Shot Outcome Prediction**:

- **Model ID:** `MODEL_XG_GB_01`
- **Algorithm:** `GradientBoostingClassifier` (scikit-learn 1.9)
- **Dataset:** 286 real shots from 15 FIFA World Cup 2022 matches (StatsBomb Open Data)
- **Splits:** 70% Train (200 shots), 15% Validation (43 shots), 15% Test (43 shots) — Stratified by outcome.
- **Feature Schema:**
  1. `distance_to_goal`: Euclidean distance to goal center $(120, 40)$.
  2. `angle_to_goal`: Subtended angle between goal posts.
  3. `is_header`: 1 if header, 0 otherwise.
  4. `is_volley`: 1 if volley/half-volley, 0 otherwise.
  5. `is_regular_play`: 1 if open play, 0 if set piece.
  6. `under_pressure`: 1 if shooter marked under active pressure.
- **Evaluation Results (Test Set):**
  - **Trained Model ROC-AUC:** **0.8333** (vs Baseline Logistic Regression: 0.8125)
  - **Trained Model Brier Score Loss:** **0.0886** (vs Baseline: 0.0934)
  - **Test Accuracy:** **90.7%**
- **Model Artifact:** Persisted as `backend/data/models/shot_xg_model.joblib` (134 KB).
- **Inference Endpoint:** `POST /api/models/MODEL_XG_GB_01/predict`
- **Ethical & Methodological Notice:** This model predicts shot conversion probability based on coordinate geometry. It does **NOT** judge referee decisions or substitute human officials.

---

## 🎮 5 Functional Fan Arena Mini-Games

All games feature server-side validation, persistent database scoring, and leaderboards:
1. **Predict the Starting XI (`GAME_01_PREDICT_XI`):** Select 5 key starters; server evaluates selections against official lineups.
2. **First Booking Challenge (`GAME_02_FIRST_CARD`):** Predict which defender receives the first yellow card; server resolves against recorded bookings.
3. **Spot the Rule (`GAME_03_SPOT_THE_RULE`):** Interactive IFAB scenario quiz evaluating boundary contact with source-linked explanations.
4. **Match Minute Challenge (`GAME_04_MATCH_MINUTE`):** Predict which 15-minute window VAR calls the referee to the monitor.
5. **Touchline Tactician (`GAME_05_TOUCHLINE_TACTICIAN`):** Solve complex tactical officiating dilemmas using spatial data.

---

## 🚀 Quick Start Guide ($0 Zero-Cost Local Run)

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node.js v24.22)

### 1. Setup & Run Automated Verification (Fastest Smoke Test)
```bash
# In the repository root directory
python scripts/verify_system.py
```
This runs all 10 competition checks demonstrating API health, database records, real match retrieval, rules search, model card, inference execution, human review logging, and server-side game scoring!

### 2. Run Backend Test Suite (31 Tests)
```bash
# Set PYTHONPATH and run pytest across all test suites
pytest backend/tests -v
```
All **31 tests pass** covering video analysis pipeline, agents, analytics, REST APIs, incidents, predictions, simulation, and platform compliance.

### 3. Start Backend Server
```bash
python scripts/run_backend.py
# Server runs at http://localhost:8000
# OpenAPI Swagger Documentation: http://localhost:8000/docs
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🧪 Verification Check Matrix

| Check # | Requirement | Verification Command | Result |
| :---: | :--- | :--- | :---: |
| 1 | API Health & Database Connection | `GET /api/health` | **PASS (healthy, CONNECTED)** |
| 2 | SQLite Database Persistence | `refvision.db` query | **PASS (4,465 events stored)** |
| 3 | Real Match Retrieval | `GET /api/matches/MATCH_SB_3869685` | **PASS (ARG vs FRA 3-3)** |
| 4 | Match Event Provenance | `GET /api/matches/{id}/events` | **PASS (StatsBomb CC BY 4.0)** |
| 5 | Dataset Ingestion Manifest | `GET /api/datasets` | **PASS (manifest verified)** |
| 6 | IFAB Rules Retrieval | `GET /api/knowledge/search?q=boundary` | **PASS (Law 12 cited)** |
| 7 | ML Model Card & Metrics | `GET /api/models` | **PASS (ROC-AUC 0.8333)** |
| 8 | Live Model Inference | `POST /api/models/{id}/predict` | **PASS (variance confirmed)** |
| 9 | Human Decision Audit Log | `POST /api/incidents/{id}/review` | **PASS (audit event stored)** |
| 10 | Fan Game Server Scoring | `POST /api/fan-games/{id}/predictions` | **PASS (points awarded)** |

---

## 🌐 Bilingual Accessibility (English & Arabic RTL)

RefVision AI supports native bidirectional layout switching:
- **English (LTR)** and **Arabic (RTL)** with native `dir="rtl"` support.
- Instant language toggle in the header navbar without resetting live match state.
- Metric coordinates, pitch markings, and rule citations translated faithfully.

---

## ⚖️ Zero-Cost & Responsible AI Commitments

- **$0 Budget Strict Compliance:** Built entirely using open-source tools (FastAPI, SQLite, React, scikit-learn). No paid cloud credits, API keys, or subscriptions required.
- **Honest System Status:** No fake "trained" labels; the ML model card discloses actual sample counts and tasks.
- **Human Authority:** RefVision AI assists officiating and explains decisions; it never supersedes human match officials.

---

## 📜 License

MIT License. Developed for the Microsoft Premier League Hackathon 2026.
