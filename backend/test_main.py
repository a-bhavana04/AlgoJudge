import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_register_and_login():
    username = "testuser"
    password = "testpass"
    r = client.post("/register", json={"username": username, "password": password})
    assert r.status_code in (200, 409)
    r = client.post("/login", json={"username": username, "password": password})
    assert r.status_code == 200
    assert "token" in r.json()
