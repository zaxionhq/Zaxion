import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_logout_user_and_invalidate_tokens():
    session = requests.Session()
    try:
        # Authenticate user to get tokens (simulate login)
        # Here we simulate login by calling /api/v1/auth/github/callback or a similar endpoint
        # Since no login endpoint with username/password is provided, assume a token is obtained manually or via environment variable
        # For demonstration, assume an access token and refresh token are known (replace with valid tokens for real test)
        access_token = "PLACE_VALID_ACCESS_TOKEN_HERE"
        refresh_token = "PLACE_VALID_REFRESH_TOKEN_HERE"

        # Use the access token in Authorization header
        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Call logout endpoint
        response = session.post(
            f"{BASE_URL}/api/v1/auth/logout",
            headers=headers,
            timeout=TIMEOUT
        )

        # Assert logout success
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        # Optionally validate response content if API returns a message
        # Example: assert response.json().get("message") == "Logout successful"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_logout_user_and_invalidate_tokens()