from typing import Dict, Any, List
from app.schemas.incidents import CameraType

class StadiumCameraSystem:
    """
    Simulates stadium camera coordinate geometry and line-of-sight tracking.
    Models real stadium camera placements (Premier League standards):
    - Main Stand Elevated (Parallax-prone for touchline calls)
    - 18-Yard Left/Right Box Line (Collinear for penalty boundary checks)
    - Goal-Line Left/Right (Collinear with goal line)
    - Referee Body Cam (Dynamic POV from official's perspective)
    - High Behind Goal (Tactical depth and player crowding analysis)
    """
    CAMERAS = {
        "CAM_MAIN_BROADCAST": {
            "name": "Main Stadium Broadcast",
            "type": CameraType.MAIN_BROADCAST,
            "position": {"x": 50.0, "y": -25.0, "z": 22.0},  # West stand upper tier
            "focal_length_mm": 50,
            "framerate_fps": 60,
            "has_optical_tracking": True
        },
        "CAM_18YD_LEFT": {
            "name": "18-Yard Box Left Line Camera",
            "type": CameraType.EIGHTEEN_YARD_BOX_LEFT,
            "position": {"x": 83.5, "y": -12.0, "z": 8.0},  # Collinear with X=83.5 boundary
            "focal_length_mm": 85,
            "framerate_fps": 60,
            "has_optical_tracking": True
        },
        "CAM_REF_BODY": {
            "name": "Referee Body-Worn Camera (Ref-Cam)",
            "type": CameraType.REFEREE_BODY_CAM,
            "position": {"dynamic_mount": "Referee Torso"},
            "focal_length_mm": 24,
            "framerate_fps": 60,
            "has_optical_tracking": False
        },
        "CAM_HIGH_BEHIND_GOAL": {
            "name": "High Behind South Goal",
            "type": CameraType.HIGH_BEHIND_GOAL,
            "position": {"x": 105.0, "y": 50.0, "z": 18.0},
            "focal_length_mm": 70,
            "framerate_fps": 60,
            "has_optical_tracking": True
        }
    }

    @classmethod
    def get_all_camera_metadata(cls) -> Dict[str, Any]:
        return cls.CAMERAS
