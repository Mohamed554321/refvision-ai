"""
RefVision AI — Live Video Stream Security & SSRF Protection
Provides strict URL validation, redirect guarding, and HLS playlist segment verification.
Supports an explicit development-only local stream testing mode for loopback HLS streams (e.g. FFmpeg 127.0.0.1:8088).
"""

import os
import re
import socket
import logging
import ipaddress
import urllib.parse
from typing import Tuple, Dict, Any, List, Optional
import requests

logger = logging.getLogger("stream_security")

# ---------------------------------------------------------------------
# SSRF Forbidden Networks (Private, Loopback, Link-Local, Metadata)
# ---------------------------------------------------------------------
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / Cloud metadata (AWS, Azure, GCP)
    ipaddress.ip_network("0.0.0.0/8"),         # This network
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("198.18.0.0/15"),     # Benchmark testing
    ipaddress.ip_network("::1/128"),           # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),         # IPv6 Link-local
]

# ---------------------------------------------------------------------
# Development Local Stream Allowlist Configuration
# ---------------------------------------------------------------------
DEFAULT_DEV_LOCAL_HOST = "127.0.0.1"
DEFAULT_DEV_LOCAL_PORT = 8088

# Allowed HLS file patterns for local test stream
# Matches /live.m3u8, /playlist.m3u8, and /segment_*.ts (or numeric segments)
ALLOWED_DEV_PLAYLIST_PATTERN = re.compile(r"^/([a-zA-Z0-9_\-]+\.m3u8)$")
ALLOWED_DEV_SEGMENT_PATTERN = re.compile(r"^/((segment_)?([a-zA-Z0-9_\-\.]+)\.ts)$")


def get_environment_mode() -> str:
    """Returns current environment mode: 'development' or 'production' (default)."""
    env = os.getenv("REFVISION_ENV") or os.getenv("APP_ENV") or "production"
    return env.strip().lower()


def is_dev_local_stream_enabled() -> bool:
    """
    Returns True ONLY if:
    1. Environment is explicitly 'development'.
    2. REFVISION_ENABLE_DEV_LOCAL_STREAM flag is set to 'true'.
    In 'production' or any other environment, this ALWAYS returns False.
    """
    env = get_environment_mode()
    if env != "development":
        return False

    flag = os.getenv("REFVISION_ENABLE_DEV_LOCAL_STREAM", "false").strip().lower()
    return flag in ("true", "1", "yes")


def get_configured_dev_local_port() -> int:
    """Returns the configured dev local stream port (default: 8088)."""
    try:
        return int(os.getenv("REFVISION_DEV_LOCAL_STREAM_PORT", str(DEFAULT_DEV_LOCAL_PORT)))
    except Exception:
        return DEFAULT_DEV_LOCAL_PORT


def is_allowed_dev_local_stream(parsed: urllib.parse.ParseResult, resolved_ip: str) -> Tuple[bool, str]:
    """
    Validates whether a URL strictly matches the configured dev local test stream:
    - Scheme: http (or https)
    - Host: 127.0.0.1 or localhost (resolving strictly to 127.0.0.1)
    - Port: exact configured port (default 8088)
    - Path: exact allowed playlist (/live.m3u8) or segment (/segment_*.ts)
    - No directory traversal, no query string path injection
    """
    if not is_dev_local_stream_enabled():
        return False, "Development local stream testing mode is DISABLED (requires REFVISION_ENV=development and REFVISION_ENABLE_DEV_LOCAL_STREAM=true)."

    # Verify IP is strictly loopback
    if resolved_ip != "127.0.0.1":
        return False, f"Local test stream origin host must resolve strictly to 127.0.0.1 (got {resolved_ip})."

    # Verify port
    expected_port = get_configured_dev_local_port()
    actual_port = parsed.port if parsed.port is not None else (80 if parsed.scheme == "http" else 443)
    if actual_port != expected_port:
        return False, f"Local test stream port {actual_port} is not permitted (only configured dev port {expected_port} is allowed)."

    # Verify path
    path = parsed.path
    if not path:
        return False, "Local test stream URL missing path."

    # Disallow query strings and fragments on dev local test stream
    if parsed.query or parsed.fragment:
        return False, "Query parameters and URL fragments are not permitted on local test stream."

    # Prevent directory traversal
    if ".." in path or "\\" in path or "//" in path:
        return False, "Directory traversal characters in path are strictly forbidden."

    is_playlist = bool(ALLOWED_DEV_PLAYLIST_PATTERN.match(path))
    is_segment = bool(ALLOWED_DEV_SEGMENT_PATTERN.match(path))

    if not (is_playlist or is_segment):
        return False, f"Path '{path}' is not an allowed HLS playlist (/live.m3u8) or segment (/segment_*.ts) path."

    return True, "Allowed development local HLS test stream."


def validate_stream_url(url: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Main URL validation entry point.
    Returns (is_valid, reason_or_ip, metadata_dict).
    Enforces SSRF protection for all external and user-supplied URLs,
    with an explicit, restricted exception ONLY for the configured local dev HLS test stream.
    """
    try:
        if not url or not isinstance(url, str):
            return False, "Missing or invalid URL.", None

        url = url.strip()
        parsed = urllib.parse.urlparse(url)

        if parsed.scheme not in ("http", "https"):
            return False, f"Unsupported protocol '{parsed.scheme}'. Only http:// and https:// are permitted.", None

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: missing hostname.", None

        # Resolve IP address
        try:
            ip_str = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_str)
        except Exception as e:
            return False, f"Could not resolve domain name '{hostname}': {e}", None

        # Check if this qualifies under the explicit Dev Local Stream allowlist
        is_loopback = (hostname.lower() in ("localhost", "127.0.0.1", "::1") or ip_obj.is_loopback)
        if is_loopback:
            allowed_dev, dev_msg = is_allowed_dev_local_stream(parsed, ip_str)
            if allowed_dev:
                meta = {
                    "is_dev_local_stream": True,
                    "resolved_ip": ip_str,
                    "port": parsed.port or 80,
                    "path": parsed.path
                }
                return True, ip_str, meta
            else:
                # Loopback not permitted
                return False, f"SECURITY_BLOCKED: {dev_msg}", None

        # Check against private / forbidden networks for all other hosts
        for net in PRIVATE_NETWORKS:
            if ip_obj in net:
                return False, f"SECURITY_BLOCKED: Access to private/internal network IP ({ip_str}) is forbidden (SSRF Protection).", None

        meta = {
            "is_dev_local_stream": False,
            "resolved_ip": ip_str,
            "port": parsed.port or (443 if parsed.scheme == "https" else 80),
            "path": parsed.path
        }
        return True, ip_str, meta

    except Exception as e:
        return False, f"URL validation error: {str(e)}", None


def safe_fetch_stream_head(url: str, timeout: int = 5, max_redirects: int = 3) -> requests.Response:
    """
    Fetches HEAD for a stream URL without blindly following redirects.
    Every redirect hop is explicitly validated against validate_stream_url().
    """
    current_url = url
    headers = {"User-Agent": "RefVision-LiveAssistant/2.0 (Officiating Media Checker)"}

    for redirect_hop in range(max_redirects + 1):
        is_safe, detail, meta = validate_stream_url(current_url)
        if not is_safe:
            raise PermissionError(f"SSRF policy blocked URL '{current_url}': {detail}")

        resp = requests.head(current_url, headers=headers, timeout=timeout, allow_redirects=False)

        # If redirect status code
        if resp.status_code in (301, 302, 303, 307, 308):
            loc = resp.headers.get("Location")
            if not loc:
                return resp
            # Resolve relative redirect
            current_url = urllib.parse.urljoin(current_url, loc)
            logger.info(f"Following validated redirect hop {redirect_hop + 1} to: {current_url}")
            continue

        return resp

    raise PermissionError("Too many redirects during stream validation.")


def safe_fetch_stream_content(url: str, timeout: int = 5, max_redirects: int = 3) -> requests.Response:
    """
    Fetches GET response for a stream URL with strict redirect hop validation.
    """
    current_url = url
    headers = {"User-Agent": "RefVision-LiveAssistant/2.0 (Officiating Media Checker)"}

    for redirect_hop in range(max_redirects + 1):
        is_safe, detail, meta = validate_stream_url(current_url)
        if not is_safe:
            raise PermissionError(f"SSRF policy blocked URL '{current_url}': {detail}")

        resp = requests.get(current_url, headers=headers, timeout=timeout, allow_redirects=False, stream=True)

        if resp.status_code in (301, 302, 303, 307, 308):
            loc = resp.headers.get("Location")
            if not loc:
                return resp
            current_url = urllib.parse.urljoin(current_url, loc)
            continue

        return resp

    raise PermissionError("Too many redirects during stream fetch.")


def validate_and_inspect_hls_playlist(playlist_url: str, playlist_text: str) -> Tuple[bool, str, List[str]]:
    """
    Validates HLS playlist content:
    1. Checks for #EXTM3U header.
    2. Extracts all referenced segment URIs.
    3. Resolves each segment to an absolute URL and validates it against validate_stream_url().
    If ANY segment URL fails validation, rejects the entire playlist to prevent HLS SSRF injection.
    """
    if "#EXTM3U" not in playlist_text and "#EXT-X-" not in playlist_text:
        return False, "Not a valid HLS playlist: missing #EXTM3U or #EXT-X header.", []

    validated_segments = []
    lines = [line.strip() for line in playlist_text.splitlines() if line.strip()]

    for line in lines:
        if line.startswith("#"):
            continue

        # This line is a segment URI (e.g. segment_0.ts or http://127.0.0.1:8088/segment_0.ts)
        segment_abs_url = urllib.parse.urljoin(playlist_url, line)
        is_safe, detail, meta = validate_stream_url(segment_abs_url)
        if not is_safe:
            return False, f"SECURITY_BLOCKED: HLS segment '{line}' rejected by SSRF policy: {detail}", []

        validated_segments.append(segment_abs_url)

    return True, f"Valid HLS playlist with {len(validated_segments)} verified segment(s).", validated_segments
