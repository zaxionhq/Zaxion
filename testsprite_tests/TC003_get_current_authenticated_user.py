import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_get_current_authenticated_user():
    # Setup: obtain a valid token for testing.
    # Replace the token below with a valid one from your authentication process.
    valid_token = "your_valid_token_here"

    headers_valid = {
        "Authorization": f"Bearer {valid_token}"
    }
    headers_invalid = {
        "Authorization": "Bearer invalid_or_expired_token"
    }

    # 1. Test with valid token (expect 200 and user info)
    try:
        response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers_valid, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        json_data = response.json()
        # Basic validation of user info structure
        assert isinstance(json_data, dict), "Response is not a JSON object"
        assert "id" in json_data or "username" in json_data or "email" in json_data, "User information missing expected fields"
    except requests.RequestException as e:
        assert False, f"Request to /api/v1/auth/me with valid token failed: {e}"

    # 2. Test with no token (expect 401)
    try:
        response_no_token = requests.get(f"{BASE_URL}/api/v1/auth/me", timeout=TIMEOUT)
        assert response_no_token.status_code == 401, f"Expected 401 Unauthorized for no token, got {response_no_token.status_code}"
    except requests.RequestException as e:
        assert False, f"Request to /api/v1/auth/me with no token failed: {e}"

    # 3. Test with invalid token (expect 401)
    try:
        response_invalid_token = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers_invalid, timeout=TIMEOUT)
        assert response_invalid_token.status_code == 401, f"Expected 401 Unauthorized for invalid token, got {response_invalid_token.status_code}"
    except requests.RequestException as e:
        assert False, f"Request to /api/v1/auth/me with invalid token failed: {e}"


test_get_current_authenticated_user()