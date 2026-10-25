"""
Unit & Integration Tests for RefVision AI Local HLS Stream Testing & SSRF Allowlisting
Proves that:
1. The configured dev local stream (http://127.0.0.1:8088/live.m3u8) is permitted ONLY in development mode.
2. In production mode, local loopback is strictly blocked under all conditions.
3. Arbitrary ports, private IP networks, directory traversals, and non-HLS paths are strictly blocked.
4. HLS playlists containing malicious SSRF segment URLs are detected and rejected.
5. The HLS proxy endpoint re-validates all requests and blocks SSRF probes with 403.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.evidence.stream_security import (
    validate_stream_url,
    is_dev_local_stream_enabled,
    is_allowed_dev_local_stream,
    validate_and_inspect_hls_playlist,
    safe_fetch_stream_head,
    safe_fetch_stream_content,
    get_environment_mode,
    get_configured_dev_local_port
)

client = TestClient(app)


# =====================================================================
# 1. Environment Mode & Flag Checks
# =====================================================================

def test_environment_mode_and_flag_logic(monkeypatch):
    """Test that dev local stream is ONLY enabled when both ENV=development and FLAG=true."""
    # Case A: Production mode with flag true -> MUST BE FALSE
    monkeypatch.setenv("REFVISION_ENV", "production")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")
    assert is_dev_local_stream_enabled() is False

    # Case B: Development mode with flag false -> MUST BE FALSE
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "false")
    assert is_dev_local_stream_enabled() is False

    # Case C: Development mode with unset flag -> MUST BE FALSE
    monkeypatch.delenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", raising=False)
    assert is_dev_local_stream_enabled() is False

    # Case D: Development mode with flag true -> MUST BE TRUE
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")
    assert is_dev_local_stream_enabled() is True


# =====================================================================
# 2. Production SSRF Lockdown (Zero Loopback Allowed)
# =====================================================================

def test_production_strictly_blocks_loopback(monkeypatch):
    """Ensure production mode rejects 127.0.0.1:8088 even if flag is maliciously set."""
    monkeypatch.setenv("REFVISION_ENV", "production")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    # Local stream URL
    safe, reason, meta = validate_stream_url("http://127.0.0.1:8088/live.m3u8")
    assert safe is False
    assert "SECURITY_BLOCKED" in reason

    # Localhost alias
    safe, reason, meta = validate_stream_url("http://localhost:8088/live.m3u8")
    assert safe is False
    assert "SECURITY_BLOCKED" in reason


# =====================================================================
# 3. Development Mode: Strict Allowlist Verification
# =====================================================================

def test_dev_mode_permits_exact_local_hls_stream(monkeypatch):
    """In development mode, exact origin 127.0.0.1:8088 and HLS paths succeed."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    # 1. Main live playlist
    safe, ip, meta = validate_stream_url("http://127.0.0.1:8088/live.m3u8")
    assert safe is True
    assert ip == "127.0.0.1"
    assert meta["is_dev_local_stream"] is True
    assert meta["port"] == 8088
    assert meta["path"] == "/live.m3u8"

    # 2. Standard segment
    safe, ip, meta = validate_stream_url("http://127.0.0.1:8088/segment_0.ts")
    assert safe is True
    assert meta["path"] == "/segment_0.ts"

    # 3. Arbitrary numbered segment
    safe, ip, meta = validate_stream_url("http://127.0.0.1:8088/segment_142.ts")
    assert safe is True

    # 4. Localhost hostname resolving to 127.0.0.1
    safe, ip, meta = validate_stream_url("http://localhost:8088/live.m3u8")
    assert safe is True
    assert meta["is_dev_local_stream"] is True


def test_dev_mode_blocks_unauthorized_ports(monkeypatch):
    """In development mode, loopback URLs on any other port must be strictly blocked."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    forbidden_ports = [8000, 8080, 3000, 5000, 22, 443, 80]
    for port in forbidden_ports:
        url = f"http://127.0.0.1:{port}/live.m3u8"
        safe, reason, meta = validate_stream_url(url)
        assert safe is False, f"Port {port} should have been blocked!"
        assert "SECURITY_BLOCKED" in reason
        assert "not permitted" in reason


def test_dev_mode_blocks_unauthorized_paths_and_traversal(monkeypatch):
    """In development mode, non-HLS paths and path traversal tricks must be blocked."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    forbidden_urls = [
        "http://127.0.0.1:8088/admin",
        "http://127.0.0.1:8088/etc/passwd",
        "http://127.0.0.1:8088/api/matches",
        "http://127.0.0.1:8088/index.html",
        "http://127.0.0.1:8088/../secret.m3u8",
        "http://127.0.0.1:8088/live.m3u8/../../etc/shadow",
        "http://127.0.0.1:8088//live.m3u8",
        "http://127.0.0.1:8088/live.m3u8?query=../../secret",
    ]

    for url in forbidden_urls:
        safe, reason, meta = validate_stream_url(url)
        assert safe is False, f"URL '{url}' should have been blocked!"
        assert "SECURITY_BLOCKED" in reason


def test_private_networks_always_blocked_even_in_dev_mode(monkeypatch):
    """Ensure private network IPs are blocked even if dev local stream mode is active."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    private_targets = [
        "http://10.0.0.1:8088/live.m3u8",
        "http://10.255.0.1:8088/live.m3u8",
        "http://192.168.1.1:8088/live.m3u8",
        "http://192.168.0.254:8088/live.m3u8",
        "http://172.16.0.1:8088/live.m3u8",
        "http://169.254.169.254/latest/meta-data",  # Cloud metadata
        "http://0.0.0.0:8088/live.m3u8",
    ]

    for url in private_targets:
        safe, reason, meta = validate_stream_url(url)
        assert safe is False, f"Private target '{url}' should have been blocked!"
        assert "SECURITY_BLOCKED" in reason


# =====================================================================
# 4. HLS Playlist Segment Inspection & SSRF Injection Guard
# =====================================================================

def test_hls_playlist_inspection_safe_playlist(monkeypatch):
    """Valid HLS playlist with relative segment paths passes inspection."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    playlist_content = """#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXTINF:2.000,
segment_0.ts
#EXTINF:2.000,
segment_1.ts
#EXTINF:2.000,
segment_2.ts
"""
    valid, msg, segments = validate_and_inspect_hls_playlist("http://127.0.0.1:8088/live.m3u8", playlist_content)
    assert valid is True
    assert len(segments) == 3
    assert segments[0] == "http://127.0.0.1:8088/segment_0.ts"


def test_hls_playlist_inspection_blocks_injected_ssrf_segment(monkeypatch):
    """HLS playlist containing an SSRF target (e.g. metadata or internal port) is REJECTED."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    # Playlist attempting to target cloud metadata
    malicious_playlist_metadata = """#EXTM3U
#EXT-X-VERSION:3
#EXTINF:2.000,
segment_0.ts
#EXTINF:2.000,
http://169.254.169.254/latest/meta-data
"""
    valid, msg, segments = validate_and_inspect_hls_playlist("http://127.0.0.1:8088/live.m3u8", malicious_playlist_metadata)
    assert valid is False
    assert "SECURITY_BLOCKED" in msg
    assert "rejected by SSRF policy" in msg

    # Playlist attempting to target internal port 8000
    malicious_playlist_port = """#EXTM3U
#EXT-X-VERSION:3
#EXTINF:2.000,
http://127.0.0.1:8000/internal-admin
"""
    valid, msg, segments = validate_and_inspect_hls_playlist("http://127.0.0.1:8088/live.m3u8", malicious_playlist_port)
    assert valid is False
    assert "SECURITY_BLOCKED" in msg


# =====================================================================
# 5. Redirect Hop SSRF Guard
# =====================================================================

def test_safe_fetch_head_blocks_malicious_redirect(monkeypatch):
    """When a URL redirects to a forbidden private host, safe_fetch_stream_head stops and rejects."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    # Mock response that redirects to 169.254.169.254
    mock_redirect_resp = MagicMock()
    mock_redirect_resp.status_code = 302
    mock_redirect_resp.headers = {"Location": "http://169.254.169.254/secret"}

    with patch("requests.head", return_value=mock_redirect_resp):
        with pytest.raises(PermissionError) as exc_info:
            safe_fetch_stream_head("http://127.0.0.1:8088/live.m3u8")
        assert "SSRF policy blocked URL" in str(exc_info.value)


# =====================================================================
# 6. API Integration: Source-Check & HLS Proxy Endpoints
# =====================================================================

def test_api_source_check_with_dev_stream(monkeypatch):
    """Test POST /api/live-sessions/{id}/source-check in dev mode."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    # Create session
    create_res = client.post("/api/live-sessions", json={
        "title": "Local HLS Session",
        "source_type": "VIDEO_URL"
    })
    session_id = create_res.json()["id"]

    # Mock safe_fetch_stream_head and safe_fetch_stream_content
    mock_head = MagicMock()
    mock_head.status_code = 200
    mock_head.headers = {"Content-Type": "application/vnd.apple.mpegurl"}

    mock_get = MagicMock()
    mock_get.status_code = 200
    mock_get.headers = {"Content-Type": "application/vnd.apple.mpegurl"}
    mock_get.text = "#EXTM3U\n#EXTINF:2.0,\nsegment_0.ts\n"

    with patch("app.api.routes_live_sessions.safe_fetch_stream_head", return_value=mock_head), \
         patch("app.api.routes_live_sessions.safe_fetch_stream_content", return_value=mock_get):

        res = client.post(f"/api/live-sessions/{session_id}/source-check", json={
            "url": "http://127.0.0.1:8088/live.m3u8"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["accessible"] is True
        assert data["is_direct_video_stream"] is True
        assert data["is_hls"] is True
        assert data["is_dev_local_stream"] is True
        assert "hls-proxy" in data["proxy_url"]


def test_api_hls_proxy_blocks_unauthorized_targets(monkeypatch):
    """Test GET /api/live-sessions/{id}/hls-proxy rejects SSRF attempts with 403."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    create_res = client.post("/api/live-sessions", json={"title": "Proxy Test"})
    session_id = create_res.json()["id"]

    # Attempt to proxy cloud metadata
    res = client.get(f"/api/live-sessions/{session_id}/hls-proxy?url=http://169.254.169.254/latest/meta-data")
    assert res.status_code == 403
    assert "SECURITY_BLOCKED" in res.json()["detail"]

    # Attempt to proxy unauthorized port
    res2 = client.get(f"/api/live-sessions/{session_id}/hls-proxy?url=http://127.0.0.1:8000/secret")
    assert res2.status_code == 403
    assert "SECURITY_BLOCKED" in res2.json()["detail"]


def test_api_hls_proxy_rewrites_playlist_and_sets_cors(monkeypatch):
    """Test GET /api/live-sessions/{id}/hls-proxy rewrites segment URLs and adds CORS headers."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    create_res = client.post("/api/live-sessions", json={"title": "Proxy Rewrite Test"})
    session_id = create_res.json()["id"]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"Content-Type": "application/vnd.apple.mpegurl"}
    mock_resp.text = "#EXTM3U\n#EXTINF:2.0,\nsegment_0.ts\n"

    with patch("app.api.routes_live_sessions.safe_fetch_stream_content", return_value=mock_resp):
        res = client.get(f"/api/live-sessions/{session_id}/hls-proxy?url=http://127.0.0.1:8088/live.m3u8")
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == "*"
        assert "hls-proxy" in res.text
        assert "segment_0.ts" in res.text


def test_capability_matrix_reflects_dev_status(monkeypatch):
    """Verify GET /api/live-sessions/capability-matrix reports development local HLS capability."""
    monkeypatch.setenv("REFVISION_ENV", "development")
    monkeypatch.setenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "true")

    res = client.get("/api/live-sessions/capability-matrix")
    assert res.status_code == 200
    caps = res.json()
    hls_cap = next((c for c in caps if "Local HLS" in c["capability"]), None)
    assert hls_cap is not None
    assert hls_cap["status"] == "VERIFIED_OPERATIONAL"
