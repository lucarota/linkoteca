import pytest
from unittest.mock import patch
from utils import is_safe_url, fetch_metadata_for_url
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_is_safe_url_rejects_private_and_loopback_ips():
    # Loopback
    assert is_safe_url("http://127.0.0.1") is False
    assert is_safe_url("http://127.0.0.1:8000/api") is False
    assert is_safe_url("http://localhost:8000") is False
    assert is_safe_url("http://[::1]:8000") is False

    # Private network ranges (RFC 1918)
    assert is_safe_url("http://10.0.0.1/status") is False
    assert is_safe_url("http://172.16.0.1/admin") is False
    assert is_safe_url("http://192.168.1.1/") is False

    # Cloud metadata / link-local (RFC 3927)
    assert is_safe_url("http://169.254.169.254/latest/meta-data/") is False

    # Non-routable / unspecified
    assert is_safe_url("http://0.0.0.0/") is False

def test_is_safe_url_rejects_non_http_schemes():
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("ftp://example.com/file") is False
    assert is_safe_url("gopher://example.com") is False
    assert is_safe_url("javascript:alert(1)") is False
    assert is_safe_url("") is False
    assert is_safe_url("not_a_url") is False

def test_is_safe_url_accepts_valid_public_domain():
    # Mocking getaddrinfo to return a public IP for testing determinism
    with patch("socket.getaddrinfo") as mock_dns:
        mock_dns.return_value = [
            (2, 1, 6, '', ('93.184.216.34', 443))
        ]
        assert is_safe_url("https://example.com") is True

def test_fetch_metadata_for_url_blocks_unsafe_urls():
    with patch("requests.get") as mock_get:
        result = fetch_metadata_for_url("http://127.0.0.1:8000/api/settings")
        # Ensure requests.get was NEVER called for private IP
        mock_get.assert_not_called()
        assert result == {'title': None, 'description': None, 'image': None, 'favicon': None}

import random
import string

def test_metadata_endpoint_blocks_ssrf():
    # Register unique user and get token for auth
    username = "ssrf_" + "".join(random.choices(string.ascii_lowercase, k=8))
    reg_res = client.post("/api/register", json={"name": username, "password": "password"})
    assert reg_res.status_code == 200
    token = reg_res.json()["token"]

    with patch("requests.get") as mock_get:
        res = client.post(
            "/api/metadata",
            headers={"Authorization": f"Bearer {token}"},
            json={"url": "http://169.254.169.254/latest/meta-data/"}
        )
        assert res.status_code == 200
        mock_get.assert_not_called()
        assert res.json() == {'title': None, 'description': None, 'image': None, 'favicon': None}
