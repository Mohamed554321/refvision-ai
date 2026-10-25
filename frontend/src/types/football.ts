export type Language = 'en' | 'ar';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME' | 'PAUSED';

export type EventType =
  | 'KICKOFF'
  | 'PASS'
  | 'INTERCEPTION'
  | 'TACKLE'
  | 'SHOT'
  | 'SHOT_BLOCKED'
  | 'GOAL'
  | 'FOUL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'OFFSIDE'
  | 'CORNER'
  | 'PENALTY_AWARDED'
  | 'PENALTY_CHECK'
  | 'HANDBALL_CHECK'
  | 'VAR_REVIEW'
  | 'SUBSTITUTION'
  | 'POSSESSION_CHANGE';

export interface Player {
  player_id: string;
  jersey_number: number;
  display_name: string;
  display_name_ar: string;
  team_id: string;
  position: string;
  touches: number;
  shots: number;
  shots_on_target: number;
  passes_completed: number;
  passes_attempted: number;
  fouls_committed: number;
  yellow_cards: number;
  red_cards: number;
}

export interface Team {
  team_id: string;
  name: string;
  name_ar: string;
  short_code: string;
  primary_color: string;
  secondary_color: string;
  players: Player[];
}

export interface MatchEvent {
  event_id: string;
  match_id: string;
  timestamp_seconds: number;
  minute: number;
  second: number;
  event_type: EventType;
  team_id: string;
  player_id?: string;
  related_player_id?: string;
  coordinates?: { x: number; y: number; z?: number };
  event_attributes: Record<string, any>;
  is_noteworthy: boolean;
  source: string;
}

export interface Match {
  match_id: string;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
  current_minute: number;
  current_second: number;
  current_timestamp_seconds: number;
  status: MatchStatus;
  simulation_seed: string;
  stadium_name: string;
  stadium_name_ar: string;
  referee_name: string;
  referee_name_ar: string;
  var_official_name: string;
  var_official_name_ar: string;
}

export type CameraType =
  | 'MAIN_BROADCAST'
  | 'WIDE_TACTICAL'
  | 'EIGHTEEN_YARD_BOX_LEFT'
  | 'EIGHTEEN_YARD_BOX_RIGHT'
  | 'GOAL_LINE_LEFT'
  | 'GOAL_LINE_RIGHT'
  | 'REFEREE_BODY_CAM'
  | 'HIGH_BEHIND_GOAL';

export interface CameraEvidence {
  evidence_id: string;
  incident_id: string;
  camera_id: string;
  camera_name: string;
  camera_name_ar: string;
  camera_type: CameraType;
  timestamp_start_seconds: number;
  timestamp_end_seconds: number;
  field_coverage: string;
  field_coverage_ar: string;
  occlusion_level: string;
  visibility_score: number;
  is_recommended: boolean;
  recommendation_reason: string;
  recommendation_reason_ar: string;
  key_observation: string;
  key_observation_ar: string;
  limitations: string;
  limitations_ar: string;
}

export interface CandidateInterpretation {
  interpretation_id: string;
  title: string;
  title_ar: string;
  likelihood: string;
  supporting_arguments: string[];
  supporting_arguments_ar: string[];
  counter_arguments: string[];
  counter_arguments_ar: string[];
  applicable_law: string;
  applicable_law_ar: string;
}

export interface RecordedDecision {
  decision_id: string;
  incident_id: string;
  recorded_by: string;
  role: string;
  timestamp_recorded_seconds: number;
  official_ruling: string;
  official_ruling_ar: string;
  disciplinary_action: string;
  restart_play: string;
  rationale: string;
  rationale_ar: string;
}

export interface StructuredExplanation {
  fan_mode: {
    headline: string;
    headline_ar: string;
    summary: string;
    summary_ar: string;
    key_takeaway: string;
    key_takeaway_ar: string;
  };
  analyst_mode: {
    incident_id: string;
    metric_coordinates: Record<string, number>;
    measured_contact_point: string;
    demarcation_boundary: string;
    delta_distance_cm: string;
    ifab_rule_citation: string;
    ifab_rule_citation_ar: string;
    dogso_vs_spa_assessment: string;
    dogso_vs_spa_assessment_ar: string;
    recommended_camera: string;
  };
  broadcast_mode: {
    on_screen_graphic_header: string;
    on_screen_graphic_header_ar: string;
    ruling_ticker: string;
    ruling_ticker_ar: string;
    short_bullet_1: string;
    short_bullet_1_ar: string;
    short_bullet_2: string;
    short_bullet_2_ar: string;
  };
  uncertainty_statement: string;
  uncertainty_statement_ar: string;
  missing_evidence: string[];
  missing_evidence_ar: string[];
  laws_referenced: string[];
  laws_referenced_ar: string[];
  verification_status: string;
}

export interface Incident {
  incident_id: string;
  id?: string;
  match_id: string;
  minute: number;
  second: number;
  timestamp_seconds: number;
  incident_type: string;
  involved_player_ids: string[];
  involved_team_id: string;
  source_event_ids: string[];
  coordinates: Record<string, number>;
  initial_flag_reason: string;
  initial_flag_reason_ar: string;
  description?: string;
  description_ar?: string;
  is_synthetic?: boolean;
  human_ruling?: string;
  disciplinary_action?: string;
  restart_play?: string;
  rationale?: string;
  preliminary_assessment: string;
  preliminary_assessment_ar: string;
  confidence_rating: number;
  confidence_rationale: string;
  confidence_rationale_ar: string;
  review_status: 'FLAGGED' | 'UNDER_VAR_INSPECTION' | 'ANGLES_COMPARED' | 'DECISION_RECORDED' | 'EXPLANATION_PUBLISHED';
  evidence_items: CameraEvidence[];
  candidate_interpretations: CandidateInterpretation[];
  recorded_decision?: RecordedDecision;
  structured_explanation?: StructuredExplanation;
  created_at_iso: string;
}

export interface EligibleOption {
  id: string;
  label: string;
  label_ar: string;
  subtext?: string;
  points_multiplier: number;
}

export interface ActivePredictionGame {
  game_id: string;
  match_id: string;
  game_type: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  options: EligibleOption[];
  opened_at_seconds: number;
  lock_deadline_seconds: number;
  is_locked: boolean;
  is_resolved: boolean;
  rule_explanation: string;
  rule_explanation_ar: string;
  correct_option_id?: string;
  outcome_summary?: string;
  outcome_summary_ar?: string;
}

export interface PredictionSubmission {
  prediction_id: string;
  game_id: string;
  user_id: string;
  selected_option_id: string;
  submission_timestamp_seconds: number;
  status: 'OPEN' | 'LOCKED' | 'RESOLVED_WON' | 'RESOLVED_LOST' | 'VOIDED';
  points_awarded: number;
}

export interface FanBadge {
  badge_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon_name: string;
  unlocked_at?: string;
  is_unlocked: boolean;
}

export interface FanUserProfile {
  user_id: string;
  username: string;
  favorite_team_id: string;
  points: number;
  streak_count: number;
  predictions_count: number;
  accuracy_rate: number;
  badges: FanBadge[];
  prediction_history: PredictionSubmission[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  favorite_team: string;
  points: number;
  accuracy_rate: number;
  streak: number;
}

export interface MomentumDataPoint {
  minute: number;
  second: number;
  timestamp_seconds: number;
  home_momentum: number;
  away_momentum: number;
  trigger_event?: string;
  dominant_team_id: string;
}

export interface TeamStats {
  team_id: string;
  possession_percentage: number;
  total_shots: number;
  shots_on_target: number;
  shots_off_target: number;
  blocked_shots: number;
  passes_attempted: number;
  passes_completed: number;
  pass_accuracy_pct: number;
  fouls_committed: number;
  yellow_cards: number;
  red_cards: number;
  corners: number;
  offsides: number;
  expected_goals_xg: number;
  penalty_box_entries: number;
}

export interface TurningPoint {
  minute: number;
  second: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  impact_level: string;
  related_event_id: string;
}

export interface MatchAnalytics {
  match_id: string;
  current_minute: number;
  home_stats: TeamStats;
  away_stats: TeamStats;
  momentum_series: MomentumDataPoint[];
  turning_points: TurningPoint[];
  tactical_narrative: string;
  tactical_narrative_ar: string;
}

export interface MultiAgentWorkflowExecution {
  workflow_id: string;
  incident_id?: string;
  timestamp_seconds: number;
  agent_outputs: Record<string, {
    agent_name: string;
    role: string;
    status: string;
    summary: string;
    summary_ar: string;
    data_payload: Record<string, any>;
    provenance_event_ids: string[];
  }>;
  quality_gate: {
    is_approved: boolean;
    confidence_score: number;
    violations: string[];
    fact_check_passed: boolean;
    non_authoritative_disclaimer_present: boolean;
    evidence_links_valid: boolean;
    supervisor_notes: string;
    supervisor_notes_ar: string;
  };
  execution_time_ms: number;
  provider_used: string;
}

export interface ExtractedFrame {
  frame_id: string;
  filename: string;
  url: string;
  timestamp_seconds: number;
  frame_index: number;
  sharpness_score: number;
  motion_energy: number;
  is_focal_point: boolean;
  relative_label: string;
}

export interface VideoObservableEvidence {
  inspection_window: string;
  focal_timestamp: number;
  video_resolution: string;
  stream_framerate: string;
  shutter_interval: string;
  spatial_tolerance_margin: string;
  highest_motion_frame_timestamp: number;
  total_frames_extracted: number;
  camera_angle_type: string;
  visual_observations: string[];
  limitations: string[];
}

export interface VideoRuleReference {
  law_number: string;
  law_title: string;
  summary: string;
  official_url: string;
  key_criteria_to_assess: string[];
}

export interface VideoDecisionSupport {
  review_recommendation: string;
  recommendation_label_en: string;
  recommendation_label_ar: string;
  evidence_sufficiency_rating: string;
  confidence_assessment: string;
  factors_supporting_offence: string[];
  factors_against_offence: string[];
  missing_evidence: string[];
  uncertainty_statement: string;
  uncertainty_statement_ar: string;
  human_decision?: {
    ruling: string;
    disciplinary: string;
    restart: string;
    rationale: string;
    reviewed_by: string;
    reviewed_at: string;
  } | null;
}

export interface VideoAnalysisDetail {
  analysis_id: string;
  filename: string;
  stored_file: string;
  file_size_bytes: number;
  video_url: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  incident_timestamp?: number;
  incident_type?: string;
  user_description?: string;
  metadata: {
    duration_seconds: number;
    fps: number;
    width: number;
    height: number;
    frame_count: number;
    shutter_interval_ms: number;
  };
  extracted_frames: ExtractedFrame[];
  observable_evidence?: VideoObservableEvidence;
  rule_references?: VideoRuleReference[];
  decision_support?: VideoDecisionSupport;
  human_decision?: {
    ruling: string;
    disciplinary?: string;
    restart?: string;
    rationale: string;
    reviewed_by?: string;
    reviewed_at?: string;
  } | null;
  created_at?: string;
}

export interface LiveSessionEvent {
  id: string;
  event_type: string;
  minute: number;
  second: number;
  timestamp_seconds: number;
  player_name?: string;
  team_id?: string;
  x?: number;
  y?: number;
  description?: string;
  outcome?: string;
  source?: string;
}

export interface LiveSessionIncident {
  incident_id: string;
  session_id?: string;
  incident_category?: string;
  category_label?: string;
  category_label_ar?: string;
  minute: number;
  second: number;
  timestamp_seconds: number;
  classification?: string;
  category?: string;
  priority: 'CRITICAL_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_reason?: string;
  coordinates: { x: number; y: number };
  description?: string;
  observable_facts?: string[];
  model_inference?: string;
  confidence_score?: number;
  confidence_label?: string;
  stage_1_detected?: boolean;
  stage_2_category?: string;
  stage_3_rule?: {
    law_number: string;
    citation: string;
    citation_ar: string;
    official_url: string;
  };
  applicable_law?: {
    law_number: string;
    title: string;
    title_ar?: string;
    citation: string;
    citation_ar: string;
    official_url: string;
  };
  stage_4_recommendation?: {
    preliminary_ruling: string;
    preliminary_ruling_ar: string;
    recommended_restart: string;
    recommended_card: string;
    uncertainty_notice: string;
    uncertainty_notice_ar: string;
  };
  preliminary_recommendation?: string;
  preliminary_recommendation_ar?: string;
  missing_evidence_and_uncertainty?: string;
  evidence_image_url?: string;
  stage_5_human_status?: 'AWAITING_OFFICIAL_RULING' | 'DECISION_RECORDED' | 'RECOMMEND_REVIEW' | 'EVIDENCE_INSUFFICIENT' | 'PRELIMINARY_RECOMMENDATION_AVAILABLE';
  review_status?: string;
  human_decision?: {
    official_ruling: string;
    official_ruling_ar?: string;
    disciplinary_action: string;
    restart_play: string;
    rationale: string;
    recorded_by: string;
    recorded_at: string;
  } | null;
}

export interface RealtimeVisionTelemetry {
  session_id: string;
  is_running: boolean;
  is_paused: boolean;
  stream_url?: string;
  frames_received: number;
  frames_analyzed: number;
  frames_dropped: number;
  current_fps: number;
  target_fps: number;
  measured_latency_ms: number;
  queue_depth: number;
  current_minute: number;
  current_second: number;
  current_timestamp_seconds: number;
  is_pitch_scene: boolean;
  pitch_grass_ratio: number;
  lines_detected_count: number;
  active_tracks_count: number;
  model_name: string;
  model_operational: boolean;
  new_incidents: any[];
}

export interface VisionDiagnosticStage {
  stage: number;
  name: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  description: string;
  measured_value?: string;
}

export interface SourceCheckResult {
  accessible: boolean;
  status_code: number;
  content_type?: string;
  is_direct_video_stream: boolean;
  is_hls?: boolean;
  segment_count?: number;
  is_dev_local_stream?: boolean;
  proxy_url?: string | null;
  error_reason?: string;
  latency_ms: number;
  checked_at: string;
}

export interface LiveSessionReport {
  session_id: string;
  session_title: string;
  source_type: string;
  source_url?: string;
  match_id?: string;
  status: string;
  generated_at: string;
  duration_minutes: number;
  metrics: {
    total_events_processed: number;
    total_incidents_flagged: number;
    human_decisions_recorded: number;
    average_latency_ms: number;
    failed_segments_count: number;
  };
  incidents_by_category: Record<string, number>;
  capability_disclaimers: string[];
}

export interface LiveSession {
  id: string;
  title: string;
  match_id?: string;
  source_type: 'VIDEO_URL' | 'VIDEO_UPLOAD' | 'EVENT_FEED_SIMULATION' | 'MANUAL';
  source_url?: string;
  video_analysis_id?: string;
  status: 'IDLE' | 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  connection_status: 'CONNECTED' | 'BUFFERING' | 'DISCONNECTED' | 'WARNING_HTML_PAGE' | 'WARNING' | 'ERROR';
  current_minute: number;
  current_second: number;
  current_timestamp_seconds: number;
  events_processed_count: number;
  incidents_flagged_count: number;
  human_decisions_count: number;
  measured_latency_ms: number;
  source_check_result_json?: SourceCheckResult;
  events_log_json?: LiveSessionEvent[];
  incidents_log_json?: LiveSessionIncident[];
  session_report_json?: LiveSessionReport;
  created_at: string;
  updated_at: string;
}

export interface CapabilityMatrixItem {
  capability: string;
  source_type: string;
  status: 'VERIFIED_OPERATIONAL' | 'PARTIALLY_SUPPORTED' | 'UNAVAILABLE';
  description: string;
  verified_in_demo: boolean;
}


