from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.hashing import Hash
from backend.database import User, AnalysisResult, Video, Claim
import pytest

# Setup the test database
@pytest.fixture(scope="module")
def client():
    # Create a fresh, empty test database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as c:
        yield c

    # Teardown the test database
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test user registration
def test_create_user(client):
    response = client.post(
        "/user",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert response.json()["email"] == "test@example.com"

# Test user login
def test_login_user(client):
    response = client.post(
        "/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

# Test login with incorrect password
def test_login_incorrect_password(client):
    response = client.post(
        "/login",
        data={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Incorrect password"

# Test login with non-existent user
def test_login_non_existent_user(client):
    response = client.post(
        "/login",
        data={
            "username": "nonexistent",
            "password": "password"
        }
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid Credentials"

# Test protected endpoint without token
def test_protected_endpoint_no_token(client):
    response = client.post(
        "/analyze",
        json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

# Test protected endpoint with invalid token
def test_protected_endpoint_invalid_token(client):
    response = client.post(
        "/analyze",
        headers={
            "Authorization": "Bearer invalid_token"
        },
        json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

# Test analyze endpoint (requires a running Celery worker for full functionality)
def test_analyze_content(client):
    login_response = client.post(
        "/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    token = login_response.json()["access_token"]

    response = client.post(
        "/analyze",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
    )
    assert response.status_code == 201
    assert response.json()["status"] == "starting"
    assert "task_id" in response.json()
    assert "video" in response.json()
    assert response.json()["video"]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Test get status endpoint
def test_get_status(client):
    # First, create an analysis to get a task_id
    login_response = client.post(
        "/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    token = login_response.json()["access_token"]

    analyze_response = client.post(
        "/analyze",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
    )
    task_id = analyze_response.json()["task_id"]

    response = client.get(
        f"/status/{task_id}",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["task_id"] == task_id
    assert "status" in response.json()
    assert "video" in response.json()
    assert "claims" in response.json()

# Test get history endpoint
def test_get_history(client):
    login_response = client.post(
        "/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    token = login_response.json()["access_token"]

    response = client.get(
        "/history",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if response.json():
        assert "video" in response.json()[0]
        assert "claims" in response.json()[0]

# Test get analysis details endpoint
def test_get_analysis_details(client, db_session):
    # Create a user and an analysis directly in the database for testing
    user = User(username="detailuser", email="detail@example.com", password=Hash.bcrypt("detailpassword"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    video = Video(url="https://test.com/video_detail")
    db_session.add(video)
    db_session.commit()
    db_session.refresh(video)

    analysis = AnalysisResult(task_id="test_analysis_id", owner_id=user.id, video_id=video.id, status="completed", raw_text_extracted="some text", factual_report_json={"report": "some report"}, reliability_score=80.0)
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)

    claim = Claim(claim_text="This is a test claim", analysis_result_id=analysis.id, score=90.0)
    db_session.add(claim)
    db_session.commit()

    login_response = client.post(
        "/login",
        data={
            "username": "detailuser",
            "password": "detailpassword"
        }
    )
    token = login_response.json()["access_token"]

    response = client.get(
        f"/analysis/{analysis.id}",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["raw_text_extracted"] == "some text"
    assert response.json()["video"]["url"] == "https://test.com/video_detail"
    assert len(response.json()["claims"]) == 1
    assert response.json()["claims"][0]["claim_text"] == "This is a test claim"

# Test rate limiting (requires Redis to be running)
# This test might be flaky depending on test execution speed and Redis setup.
# It's better to test rate limiting manually or with a dedicated tool.
# For automated tests, you might need to mock Redis or use a time-based approach.
# def test_rate_limiting(client):
#     login_response = client.post(
#         "/login",
#         data={
#             "username": "testuser",
#             "password": "testpassword"
#         }
#     )
#     token = login_response.json()["access_token"]

#     for _ in range(5):
#         response = client.post(
#             "/analyze",
#             headers={
#                 "Authorization": f"Bearer {token}"
#             },
#             json={
#                 "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
#             }
#         )
#         assert response.status_code == 201

#     response = client.post(
#         "/analyze",
#         headers={
#             "Authorization": f"Bearer {token}"
#         },
#         json={
#             "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
#         }
#     )
#     assert response.status_code == 429 # Too Many Requests
