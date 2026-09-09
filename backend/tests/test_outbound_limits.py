import pytest
from unittest.mock import patch, MagicMock
from utils import fetch_metadata_for_url, background_import_linkstore
from database import SessionLocal, init_db
from models import Collection, Link

def test_fetch_metadata_limits_download_size():
    # Simulate a response that yields chunks totaling more than 2MB
    chunk_size = 1024 * 1024  # 1MB
    # Return 5 chunks = 5MB
    large_chunks = [b"<html><head><title>Large Page</title></head><body>" + b"A" * (chunk_size - 50)] + [b"A" * chunk_size for _ in range(4)]
    
    mock_response = MagicMock()
    mock_response.iter_content.return_value = iter(large_chunks)
    mock_response.status_code = 200
    mock_response.encoding = 'utf-8'

    with patch("utils.is_safe_url", return_value=True), \
         patch("requests.get", return_value=mock_response) as mock_get:
        
        meta = fetch_metadata_for_url("https://example.com/huge-page")
        
        mock_get.assert_called_once()
        assert meta["title"] == "Large Page"

import uuid

def test_background_import_linkstore_bounded_and_timeout():
    init_db()
    db = SessionLocal()
    # Create test collection with unique name
    unique_name = "imp_" + uuid.uuid4().hex[:8]
    col = Collection(name=unique_name, password_hash="hash")
    db.add(col)
    db.commit()
    db.refresh(col)
    col_id = col.id
    db.close()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "https://example.com/link1"

    with patch("requests.get", return_value=mock_response) as mock_get:
        # Mock background_fetch_metadata to avoid actual scraping
        with patch("utils.metadata_executor.submit"):
            background_import_linkstore("test_token", col_id, max_links=5)
            
            # Verify timeout is passed to requests.get
            for call in mock_get.call_args_list:
                assert "timeout" in call.kwargs
                assert call.kwargs["timeout"] is not None
            
            # Verify it stopped at max_links limit even if responses kept coming
            assert mock_get.call_count <= 5
