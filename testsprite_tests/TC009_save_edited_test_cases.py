import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Replace this with a valid auth token for the authorized test
AUTH_TOKEN = "your_valid_jwt_token_here"


def test_save_edited_testcases():
    url = f"{BASE_URL}/api/v1/testcases/save"
    headers_authorized = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    headers_unauthorized = {
        "Content-Type": "application/json"
    }

    # Send empty JSON payload as no schema is specified
    payload = {}

    # Test authorized request - expect 200
    try:
        response = requests.post(url, json=payload, headers=headers_authorized, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"RequestException during authorized request: {e}"
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    # We don't assert on response body because PRD does not specify schema

    # Test unauthorized request - expect 401
    try:
        response_unauth = requests.post(url, json=payload, headers=headers_unauthorized, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"RequestException during unauthorized request: {e}"
    assert response_unauth.status_code == 401, f"Expected status 401 for unauthorized, got {response_unauth.status_code}"


test_save_edited_testcases()
