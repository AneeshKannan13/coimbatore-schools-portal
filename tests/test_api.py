import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
from app.analytics.engine import generate_student_ai_insights, generate_school_ai_insights

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Coimbatore Corporation" in response.json()["message"]

def test_public_homepage():
    response = client.get("/api/v1/public/homepage")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert data["stats"]["total_schools"] >= 7
    assert len(data["hero_slides"]) >= 1

def test_public_schools():
    response = client.get("/api/v1/public/schools")
    assert response.status_code == 200
    schools = response.json()
    assert len(schools) >= 7
    assert any("R.S. Puram" in s["school_name"] for s in schools)

def test_login_and_rbac():
    # 1. Staff login
    res = client.post("/api/v1/auth/login", data={"username": "teacher_ravi", "password": "Admin@123"})
    assert res.status_code == 200
    token_teacher = res.json()["access_token"]

    # 2. Commissioner login
    res_comm = client.post("/api/v1/auth/login", data={"username": "commissioner", "password": "Admin@123"})
    assert res_comm.status_code == 200
    token_comm = res_comm.json()["access_token"]

    # 3. RBAC check: Teacher cannot access commissioner endpoint
    headers_teacher = {"Authorization": f"Bearer {token_teacher}"}
    res_forbidden = client.get("/api/v1/commissioner/dashboard", headers=headers_teacher)
    assert res_forbidden.status_code == 403

    # 4. Commissioner can access commissioner dashboard
    headers_comm = {"Authorization": f"Bearer {token_comm}"}
    res_allowed = client.get("/api/v1/commissioner/dashboard", headers=headers_comm)
    assert res_allowed.status_code == 200
    assert "kpis" in res_allowed.json()

def test_ai_analytics_engine():
    sample_marks = [
        {"subject_name": "Mathematics", "exam_name": "Quarterly", "total_mark": 78, "max_mark": 100, "is_pass": True},
        {"subject_name": "Science", "exam_name": "Quarterly", "total_mark": 42, "max_mark": 100, "is_pass": True},
        {"subject_name": "English", "exam_name": "Quarterly", "total_mark": 88, "max_mark": 100, "is_pass": True}
    ]
    insights = generate_student_ai_insights("Arun Kumar", sample_marks, 82.5)
    assert "risk_level" in insights
    assert "risk_score" in insights
    assert "recommendations" in insights
    assert insights["overall_average"] > 60
