import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Replace this with a valid token for authentication
AUTH_TOKEN = "your_valid_jwt_token_here"

def test_generate_test_cases_for_selected_files():
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    valid_payload = {
        "repo": "example-repo",
        "files": [
            "src/module1.py",
            "src/utils/helper.py"
        ]
    }

    # Test success case with valid repo and files
    response = requests.post(
        f"{BASE_URL}/api/v1/testcases/generate",
        json=valid_payload,
        headers=headers,
        timeout=TIMEOUT
    )

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    json_response = response.json()
    assert isinstance(json_response, dict), "Response should be a JSON object"
    # Minimal check: response contains generated test cases key or similar structure
    # This key name is unknown from PRD, so we check if keys exist and response is not empty
    assert json_response, "Response should contain generated test cases data"

    # Test error case: invalid request (missing files)
    invalid_payload = {
        "repo": "example-repo"
        # Missing 'files' key
    }

    response_400 = requests.post(
        f"{BASE_URL}/api/v1/testcases/generate",
        json=invalid_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert response_400.status_code == 400, f"Expected status 400, got {response_400.status_code}"

    # Test error case: unauthorized (no auth header)
    response_401 = requests.post(
        f"{BASE_URL}/api/v1/testcases/generate",
        json=valid_payload,
        timeout=TIMEOUT
    )
    assert response_401.status_code == 401, f"Expected status 401, got {response_401.status_code}"

test_generate_test_cases_for_selected_files()
