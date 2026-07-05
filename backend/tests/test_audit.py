import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

def test_audit_invalid_url(client):
    response = client.post("/api/audit", json={"url": "not-a-valid-url"})
    assert response.status_code == 422 # FastAPI Pydantic HttpUrl validation error

def test_audit_unreachable_store(client):
    # Mocking scrape_store to return None
    with patch("app.routers.audit.scrape_store", return_value=None):
        response = client.post("/api/audit", json={"url": "https://non-existent-store.myshopify.com"})
        assert response.status_code == 422
        assert "homepage" in response.json()["detail"].lower()
