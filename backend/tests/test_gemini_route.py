import pytest
from unittest.mock import patch, MagicMock

def test_gemini_test_missing_key(client):
    with patch("app.config.settings.GEMINI_API_KEY", ""):
        response = client.get("/api/gemini/test")
        assert response.status_code == 400
        assert response.json()["connected"] is False
        assert "not configured" in response.json()["error"].lower()

def test_gemini_test_success(client):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "GEMINI_CONNECTION_OK"
    mock_client.models.generate_content.return_value = mock_response
    
    with patch("app.config.settings.GEMINI_API_KEY", "AQ.somekey"), \
         patch("app.services.gemini_client.get_gemini_client", return_value=mock_client):
        response = client.get("/api/gemini/test")
        assert response.status_code == 200
        assert response.json()["connected"] is True
        assert response.json()["response"] == "GEMINI_CONNECTION_OK"
