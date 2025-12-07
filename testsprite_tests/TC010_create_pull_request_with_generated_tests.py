import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Dummy valid authentication token for authorization header
# Replace with a valid token for actual testing
AUTH_TOKEN = "Bearer your_valid_token_here"

def test_create_pull_request_with_generated_tests():
    url = f"{BASE_URL}/api/v1/github/create-pr"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }

    valid_payload = {
        "repo": "example-repo",
        "branch": "feature/test-generation",
        "title": "Add generated tests for feature X",
        "description": "This pull request adds generated test cases for feature X using AI analysis.",
        "files": [
            {"path": "tests/test_feature_x.py", "content": "def test_feature_x(): assert True"},
            {"path": "tests/test_utils.py", "content": "def test_utils(): assert 1 == 1"}
        ]
    }

    invalid_payload = {
        # Missing repository field to trigger 400
        "branch": "feature/test-generation",
        "title": "Invalid PR",
        "description": "Missing repo field",
        "files": []
    }

    # 1) Test successful pull request creation
    response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_data = response.json()
        # Assuming response contains at least 'id' or 'url' for the created PR
        assert "id" in json_data or "url" in json_data, "Response missing 'id' or 'url' field"
    except Exception:
        # Raise detailed error for debugging
        raise

    # 2) Test invalid request (400) with missing repo field
    response_invalid = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response_invalid.status_code == 400, f"Expected 400 for invalid request, got {response_invalid.status_code}"
    except Exception:
        raise

    # 3) Test unauthorized request (401) with missing or invalid token
    headers_unauth = {
        "Content-Type": "application/json"
    }
    response_unauth = requests.post(url, json=valid_payload, headers=headers_unauth, timeout=TIMEOUT)
    try:
        assert response_unauth.status_code == 401, f"Expected 401 for unauthorized request, got {response_unauth.status_code}"
    except Exception:
        raise


test_create_pull_request_with_generated_tests()