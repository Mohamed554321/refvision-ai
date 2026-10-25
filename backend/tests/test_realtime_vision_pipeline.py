import os
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.evidence.realtime_vision_engine import (
    FootballObjectDetector,
    PitchGeometryDetector,
    MultiObjectTracker,
    OfficiatingIncidentDetector,
    LiveStreamVisionWorker,
    FRAMES_DIR
)

client = TestClient(app)


def create_synthetic_football_frame(width=640, height=360, add_ball=True, add_players=True):
    """Creates a synthetic football frame with green turf, white lines, and simulated players/ball."""
    # Green grass background (HSV roughly H=35-85)
    frame = np.full((height, width, 3), (34, 139, 34), dtype=np.uint8)  # Forest Green BGR

    # White pitch boundary lines
    cv2.rectangle(frame, (40, 30), (width - 40, height - 30), (245, 245, 245), 2)
    # Halfway line
    cv2.line(frame, (width // 2, 30), (width // 2, height - 30), (245, 245, 245), 2)
    # 18-yard penalty box on right
    cv2.rectangle(frame, (width - 140, 90), (width - 40, height - 90), (245, 245, 245), 2)

    if add_players:
        # Player 1 (Red jersey)
        cv2.rectangle(frame, (180, 140), (205, 210), (0, 0, 220), -1)
        # Player 2 (Blue jersey)
        cv2.rectangle(frame, (195, 145), (220, 215), (220, 0, 0), -1)

    if add_ball:
        # Ball (white/black circle)
        cv2.circle(frame, (200, 220), 7, (255, 255, 255), -1)
        cv2.circle(frame, (200, 220), 3, (0, 0, 0), -1)

    return frame


class TestFootballObjectDetector:
    def test_detector_initialization(self):
        detector = FootballObjectDetector()
        assert detector.is_loaded is True
        assert detector.net is not None
        assert "YOLOv5n" in detector.model_name

    def test_detector_detect_on_synthetic_frame(self):
        detector = FootballObjectDetector()
        frame = create_synthetic_football_frame()
        detections = detector.detect(frame)
        assert isinstance(detections, list)
        assert len(detections) >= 1
        first = detections[0]
        assert "entity_type" in first
        assert "bbox" in first
        assert "confidence" in first
        assert "team_label" in first
        assert len(first["bbox"]) == 4


class TestPitchGeometryDetector:
    def test_turf_segmentation(self):
        detector = PitchGeometryDetector()
        frame = create_synthetic_football_frame()
        is_pitch, grass_ratio, mask = detector.detect_pitch_scene(frame)
        assert is_pitch is True
        assert grass_ratio > 0.5  # Green turf is dominant
        assert mask.shape[:2] == frame.shape[:2]

    def test_pitch_line_detection(self):
        detector = PitchGeometryDetector()
        frame = create_synthetic_football_frame()
        _, _, mask = detector.detect_pitch_scene(frame)
        line_info = detector.detect_pitch_lines(frame, mask)
        assert isinstance(line_info, dict)
        assert "lines_count" in line_info
        assert line_info["lines_count"] >= 1
        assert "has_box_line" in line_info
        assert line_info["has_box_line"] is True

    def test_pixel_to_pitch_projection(self):
        detector = PitchGeometryDetector()
        # Top-left corner roughly maps to (0, 0)
        px, py = detector.pixel_to_pitch_meters(0, 0, 640, 360)
        assert 0.0 <= px <= 5.0
        assert 0.0 <= py <= 5.0

        # Center roughly maps to (52.5, 34.0)
        cx, cy = detector.pixel_to_pitch_meters(320, 180, 640, 360)
        assert 45.0 <= cx <= 60.0
        assert 25.0 <= cy <= 45.0


class TestMultiObjectTracker:
    def test_tracker_assignment_and_history(self):
        tracker = MultiObjectTracker(max_history=15)
        detector = FootballObjectDetector()

        frame1 = create_synthetic_football_frame()
        dets1 = detector.detect(frame1)
        tracks1 = tracker.update(dets1, timestamp=1.0)
        assert len(tracks1) >= 1

        # Move slightly for frame 2
        frame2 = create_synthetic_football_frame()
        dets2 = detector.detect(frame2)
        tracks2 = tracker.update(dets2, timestamp=1.33)
        assert len(tracks2) >= 1

        # Check track properties
        first_track = tracks2[0]
        assert "track_id" in first_track
        assert "history" in first_track
        assert len(first_track["history"]) >= 1


class TestOfficiatingIncidentDetector:
    def test_foul_and_misconduct_detection(self):
        detector = OfficiatingIncidentDetector()
        frame = create_synthetic_football_frame()

        tracks = [
            {
                "track_id": 1,
                "entity_type": "PLAYER",
                "label": "TEAM_A Player",
                "team_label": "TEAM_A",
                "bbox": [200, 150, 40, 80],
                "center": (220.0, 190.0),
                "contact_point": (220.0, 230.0),
                "confidence": 0.88,
                "current_speed": 4.0,
                "aspect_ratio": 1.1,  # Collapsed aspect ratio
                "history": [
                    {"timestamp": 1.0, "center": (210.0, 170.0), "aspect_ratio": 2.2, "speed": 18.0},
                    {"timestamp": 1.5, "center": (220.0, 190.0), "aspect_ratio": 1.1, "speed": 4.0}
                ]
            },
            {
                "track_id": 2,
                "entity_type": "PLAYER",
                "label": "TEAM_B Player",
                "team_label": "TEAM_B",
                "bbox": [215, 152, 40, 80],
                "center": (235.0, 192.0),
                "contact_point": (235.0, 232.0),
                "confidence": 0.91,
                "current_speed": 14.0,
                "aspect_ratio": 2.1,
                "history": [
                    {"timestamp": 1.0, "center": (245.0, 175.0), "aspect_ratio": 2.1, "speed": 16.0},
                    {"timestamp": 1.5, "center": (235.0, 192.0), "aspect_ratio": 2.1, "speed": 14.0}
                ]
            }
        ]

        pitch_info = {
            "has_box_line": False,
            "box_line_x": None,
            "grass_ratio": 0.75
        }

        incidents = detector.analyze_frame_events(
            tracks=tracks,
            pitch_info=pitch_info,
            frame_w=640,
            frame_h=360,
            timestamp=2.0,
            session_id="test_sess_01",
            frame_image=frame
        )

        assert isinstance(incidents, list)
        foul_incidents = [i for i in incidents if i.get("incident_category") == "FOULS_AND_MISCONDUCT"]
        assert len(foul_incidents) >= 1
        inc = foul_incidents[0]
        assert "Law 12" in inc["applicable_law"]["law_number"]
        assert inc["preliminary_recommendation"] is not None
        assert inc.get("evidence_image_filename") is not None
        assert os.path.exists(os.path.join(FRAMES_DIR, inc["evidence_image_filename"]))

    def test_ball_out_of_play_detection(self):
        detector = OfficiatingIncidentDetector()
        frame = create_synthetic_football_frame()

        tracks = [
            {
                "track_id": 99,
                "entity_type": "BALL",
                "label": "Match Ball",
                "team_label": "BALL",
                "bbox": [8, 180, 14, 14],
                "center": (15.0, 187.0),  # Near left edge < 25px
                "contact_point": (15.0, 187.0),
                "confidence": 0.9,
                "current_speed": 16.0,
                "aspect_ratio": 1.0,
                "history": [
                    {"timestamp": 1.0, "center": (45.0, 187.0), "aspect_ratio": 1.0, "speed": 18.0},
                    {"timestamp": 1.5, "center": (15.0, 187.0), "aspect_ratio": 1.0, "speed": 16.0}
                ]
            }
        ]

        pitch_info = {
            "has_box_line": False,
            "box_line_x": None,
            "grass_ratio": 0.8
        }

        incidents = detector.analyze_frame_events(
            tracks=tracks,
            pitch_info=pitch_info,
            frame_w=640,
            frame_h=360,
            timestamp=3.0,
            session_id="test_sess_02",
            frame_image=frame
        )

        out_incidents = [i for i in incidents if i.get("incident_category") == "BALL_OUT_OF_PLAY_AND_RESTARTS"]
        assert len(out_incidents) >= 1
        inc = out_incidents[0]
        law_str = inc["applicable_law"]["law_number"]
        assert "Law 15" in law_str or "Law 16" in law_str

    def test_offside_perspective_disclaimer(self):
        detector = OfficiatingIncidentDetector()
        frame = create_synthetic_football_frame()

        tracks = [
            # Attacking team player advanced towards right goal
            {
                "track_id": 11,
                "entity_type": "PLAYER",
                "label": "TEAM_A Player",
                "team_label": "TEAM_A",
                "bbox": [550, 140, 35, 75],
                "center": (567.0, 177.0),
                "contact_point": (567.0, 215.0),
                "confidence": 0.85,
                "current_speed": 12.0,
                "aspect_ratio": 2.1,
                "history": [{"timestamp": 1.0, "center": (550.0, 177.0), "aspect_ratio": 2.1, "speed": 12.0}]
            },
            # Defending team penultimate defender
            {
                "track_id": 22,
                "entity_type": "PLAYER",
                "label": "TEAM_B Player",
                "team_label": "TEAM_B",
                "bbox": [500, 140, 35, 75],
                "center": (517.0, 177.0),
                "contact_point": (517.0, 215.0),
                "confidence": 0.88,
                "current_speed": 4.0,
                "aspect_ratio": 2.1,
                "history": [{"timestamp": 1.0, "center": (510.0, 177.0), "aspect_ratio": 2.1, "speed": 4.0}]
            }
        ]

        pitch_info = {
            "has_box_line": True,
            "box_line_x": 480.0,
            "grass_ratio": 0.85
        }

        incidents = detector.analyze_frame_events(
            tracks=tracks,
            pitch_info=pitch_info,
            frame_w=640,
            frame_h=360,
            timestamp=4.0,
            session_id="test_sess_03",
            frame_image=frame
        )

        offside_incidents = [i for i in incidents if i.get("incident_category") == "OFFSIDE_POSITION_QUALIFIED"]
        if offside_incidents:
            inc = offside_incidents[0]
            assert "Law 11" in inc["applicable_law"]["law_number"]
            assert "Single-camera broadcast perspective" in inc["missing_evidence_and_uncertainty"]


class TestRealtimeVisionEndpoints:
    @pytest.fixture(autouse=True)
    def setup_live_session(self, monkeypatch):
        monkeypatch.setenv("REFVISION_ENV", "development")
        monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")
        # Create a real session to test against
        resp = client.post("/api/live-sessions", json={
            "match_id": "test_vision_match_001",
            "source_type": "VIDEO_URL",
            "source_url": "http://127.0.0.1:8088/live.m3u8",
            "title": "Vision Intelligence Test Match",
            "competition": "Premier League Test"
        })
        assert resp.status_code == 200
        self.session_id = resp.json()["id"]
        yield
        # Teardown session
        client.post(f"/api/live-sessions/{self.session_id}/stop")

    def test_vision_pipeline_lifecycle(self):
        # 1. Start Vision Pipeline
        resp_start = client.post(
            f"/api/live-sessions/{self.session_id}/start-vision-pipeline",
            json={"target_fps": 3}
        )
        assert resp_start.status_code == 200
        data_start = resp_start.json()
        assert data_start["status"] == "VISION_PIPELINE_ACTIVE"
        assert data_start["target_fps"] == 3

        # 2. Query Real-Time Telemetry
        resp_telem = client.get(f"/api/live-sessions/{self.session_id}/realtime-telemetry")
        assert resp_telem.status_code == 200
        data_telem = resp_telem.json()
        assert "is_running" in data_telem
        assert "current_fps" in data_telem
        assert "measured_latency_ms" in data_telem
        assert "frames_analyzed" in data_telem
        assert "active_tracks_count" in data_telem
        assert "pitch_grass_ratio" in data_telem

        # 3. Query Vision Diagnostics
        resp_diag = client.get(f"/api/live-sessions/{self.session_id}/vision-diagnostics")
        assert resp_diag.status_code == 200
        diag_stages = resp_diag.json()
        assert isinstance(diag_stages, list)
        assert len(diag_stages) == 10
        # Check expected stage keys
        stage_names = [s["name"] for s in diag_stages]
        assert "Stream Ingestion" in stage_names
        assert "Player & Ball Object Detection" in stage_names
        assert "Field Line & Demarcation Geometry" in stage_names
        assert "IFAB Laws of the Game Retrieval" in stage_names
        assert "Offside Geometry Qualification" in stage_names

        # 4. Stop Vision Pipeline
        resp_stop = client.post(f"/api/live-sessions/{self.session_id}/stop-vision-pipeline")
        assert resp_stop.status_code == 200
        assert resp_stop.json()["status"] == "VISION_PIPELINE_STOPPED"

    def test_evidence_frame_serving(self):
        # Create a test frame in the upload directory
        frames_dir = FRAMES_DIR
        os.makedirs(frames_dir, exist_ok=True)
        test_filename = "test_focal_frame_001.jpg"
        test_path = os.path.join(frames_dir, test_filename)
        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.imwrite(test_path, dummy_img)

        try:
            resp = client.get(f"/api/live-sessions/{self.session_id}/evidence-frame/{test_filename}")
            assert resp.status_code == 200
            assert resp.headers["content-type"] == "image/jpeg"
        finally:
            if os.path.exists(test_path):
                os.remove(test_path)

        # 404 for non-existent file
        resp_404 = client.get(f"/api/live-sessions/{self.session_id}/evidence-frame/does_not_exist.jpg")
        assert resp_404.status_code == 404
