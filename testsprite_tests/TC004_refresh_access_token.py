import requests

BASE_URL = "http://localhost:5000"
REFRESH_ENDPOINT = "/api/v1/auth/refresh"
TIMEOUT = 30

def test_refresh_access_token():
    valid_refresh_token = "valid-refresh-token-example"
    invalid_refresh_token = "invalid-or-expired-refresh-token"

    headers = {
        "Content-Type": "application/json"
    }

    # Test with valid refresh token
    try:
        response = requests.post(
            BASE_URL + REFRESH_ENDPOINT,
            json={"refreshToken": valid_refresh_token},
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        json_body = response.json()
        assert "accessToken" in json_body and isinstance(json_body["accessToken"], str) and json_body["accessToken"], "New access token missing or invalid in response"
    except requests.RequestException as e:
        assert False, f"Request with valid refresh token failed: {e}"

    # Test with invalid or expired refresh token
    try:
        response = requests.post(
            BASE_URL + REFRESH_ENDPOINT,
            json={"refreshToken": invalid_refresh_token},
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 401, f"Expected 401 Unauthorized for invalid refresh token, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request with invalid refresh token failed: {e}"

test_refresh_access_token()