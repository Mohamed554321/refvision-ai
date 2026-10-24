# RefVision AI — Data Dictionary

## 1. Match Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| `match_id` | string | Unique match simulation identifier (e.g., `MATCH_PL_2026_01`). |
| `home_team` | Team | Home team metadata and active squad roster. |
| `away_team` | Team | Away team metadata and active squad roster. |
| `home_score` | integer | Cumulative goals scored by the home team. |
| `away_score` | integer | Cumulative goals scored by the away team. |
| `current_minute`| integer | Match clock minute (0 to 90+). |
| `current_second`| integer | Match clock second (0 to 59). |
| `status` | string | `SCHEDULED`, `LIVE`, `PAUSED`, `FULL_TIME`. |
| `simulation_seed`| string | Deterministic random seed string ensuring reproducible event stream. |
| `referee_name` | string | Name of on-field human referee (e.g., Marcus Sterling). |
| `var_official_name` | string | Name of VAR official (e.g., David Alpert). |

---

## 2. MatchEvent Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| `event_id` | string | Unique event ID (e.g., `EVT_0018`). |
| `timestamp_seconds` | float | Elapsed seconds from kickoff (0.0 to 5400.0+). |
| `minute` | integer | Match minute. |
| `second` | integer | Match second. |
| `event_type` | string | Category: `KICKOFF`, `PASS`, `TACKLE`, `SHOT`, `GOAL`, `FOUL`, `VAR_REVIEW`, etc. |
| `team_id` | string | Team identifier (`APX` or `CRN`). |
| `player_id` | string? | Initiating player identifier (e.g., `APX_09`). |
| `related_player_id` | string? | Secondary player (e.g., tackled attacker or fouled defender). |
| `coordinates` | object? | Normalized field coordinates `{ x: 0-100, y: 0-100, z?: 0-10 }`. |
| `event_attributes` | object | Specific metadata (e.g., `xg`, `foul_type`, `is_incident_trigger`). |
| `is_noteworthy` | boolean | Flag for key moments (goals, penalties, cards, VAR checks). |

---

## 3. Incident Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| `incident_id` | string | Unique incident ID (e.g., `INC_68_PEN_CHECK`). |
| `minute` | integer | Minute the incident occurred. |
| `incident_type` | string | `PENALTY_AREA_CONTACT`, `POTENTIAL_HANDBALL`, `POTENTIAL_OFFSIDE_GOAL`. |
| `involved_player_ids` | array | List of involved player IDs. |
| `coordinates` | object | Exact coordinates of physical contact `{ x: 83.6, y: 49.2 }`. |
| `initial_flag_reason` | string | Explanation of why the incident was flagged for review. |
| `preliminary_assessment` | string | Grounded analysis of coordinates against IFAB boundaries. |
| `confidence_rating` | float | Confidence metric (0 to 100%). |
| `review_status` | string | `FLAGGED`, `UNDER_VAR_INSPECTION`, `DECISION_RECORDED`, `EXPLANATION_PUBLISHED`. |
| `evidence_items` | array | Synchronized camera evidence viewpoints. |
| `recorded_decision` | object? | Official ruling recorded by the human referee. |
| `structured_explanation`| object? | Multi-tier public explanations (Fan, Analyst, Broadcast). |

---

## 4. CameraEvidence Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| `evidence_id` | string | Unique evidence record ID. |
| `camera_id` | string | Camera feed ID (`CAM_18YD_LEFT`, `CAM_MAIN_BROADCAST`, `CAM_REF_BODY`). |
| `camera_type` | string | Placement type. |
| `visibility_score` | float | Geometric sightline clarity score (0 to 100%). |
| `is_recommended` | boolean | Set to true for the most collinear, least occluded viewpoint. |
| `recommendation_reason` | string | Justification for recommendation. |
| `limitations` | string | Disclosed shutter and resolution limitations (+/- 3cm margin at 60fps). |

---

## 5. ActivePredictionGame Entity

| Field | Type | Description |
| :--- | :--- | :--- |
| `game_id` | string | Unique prediction game ID. |
| `game_type` | string | `NEXT_TOUCH`, `NEXT_EVENT`, `PENALTY_PREDICTOR`, `TACTICAL_SHIFT`. |
| `opened_at_seconds` | float | Timestamp when submissions open. |
| `lock_deadline_seconds` | float | Timestamp when submissions lock strictly. |
| `is_locked` | boolean | True when submissions can no longer be accepted. |
| `is_resolved` | boolean | True when evaluated against the verified event stream. |
| `correct_option_id` | string? | Result determined by code from subsequent match events. |
| `outcome_summary` | string? | Human-readable explanation of how the game was decided. |
