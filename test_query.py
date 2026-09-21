from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_query_success():
    response = client.post("/query", json={"question": "What is a stack?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)


def test_query_invalid_input():
    # missing the required "question" field
    response = client.post("/query", json={})
    assert response.status_code == 422