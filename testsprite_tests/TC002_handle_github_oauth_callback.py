import requests
from urllib.parse import urlparse, parse_qs

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_handle_github_oauth_callback():
    """
    Test the GET /api/v1/auth/github/callback endpoint to verify it correctly handles
    the OAuth callback from GitHub, processes the authorization code, and redirects
    to the frontend with a valid authentication token.
    """

    # Simulate an authorization code received from GitHub OAuth redirect
    # For testing, use a dummy 'code' value (in real world, this would be from GitHub).
    dummy_auth_code = "dummy_authorization_code"

    callback_url = f"{BASE_URL}/api/v1/auth/github/callback?code={dummy_auth_code}"

    try:
        response = requests.get(callback_url, timeout=TIMEOUT, allow_redirects=False)
    except requests.RequestException as e:
        raise AssertionError(f"Request to OAuth callback endpoint failed: {e}")

    # The expected behavior:
    # - HTTP 302 status code with Location header redirecting to frontend URL with auth token.
    assert response.status_code == 302, f"Expected status code 302 for redirect, got {response.status_code}"

    location = response.headers.get("Location")
    assert location is not None, "Redirect response missing Location header"

    # Parsing the redirect URL to verify it contains an authentication token (e.g., in query or fragment)
    parsed_url = urlparse(location)
    
    # The frontend URL should be a valid redirect and contain token in query or fragment
    query_params = parse_qs(parsed_url.query)
    fragment_params = parse_qs(parsed_url.fragment)

    token_found = False
    # Check possible locations for an auth token parameter, common param names: token, access_token, auth_token
    for param_set in (query_params, fragment_params):
        for key in ("token", "access_token", "auth_token", "jwt"):
            if key in param_set and param_set[key]:
                token_found = True
                token_value = param_set[key][0]
                # Basic validation: token value should be a non-empty string
                assert isinstance(token_value, str) and len(token_value) > 0, "Authentication token is invalid or empty"
                break
        if token_found:
            break
    
    assert token_found, f"No authentication token found in redirect URL: {location}"

test_handle_github_oauth_callback()