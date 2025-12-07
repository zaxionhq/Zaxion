import requests

BASE_URL = "http://localhost:5000"
REPOS_ENDPOINT = "/api/v1/github/repos"
TIMEOUT = 30

# Placeholder token for authenticated requests - replace with a valid token for actual tests
AUTH_TOKEN = "Bearer your_valid_jwt_token_here"

def test_list_authenticated_user_github_repositories():
    headers_auth = {
        "Authorization": AUTH_TOKEN,
        "Accept": "application/json"
    }
    headers_no_auth = {
        "Accept": "application/json"
    }

    # Test case: Authenticated request returns list of repositories
    try:
        response = requests.get(
            BASE_URL + REPOS_ENDPOINT,
            headers=headers_auth,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Authenticated request failed with exception: {e}"

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    # Expect response JSON to be a list or dict with repositories data
    try:
        repos = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(repos, (list, dict)), "Response JSON is not a list or dict of repositories"

    # Test case: Unauthenticated request returns 401 Unauthorized
    try:
        response_unauth = requests.get(
            BASE_URL + REPOS_ENDPOINT,
            headers=headers_no_auth,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Unauthenticated request failed with exception: {e}"

    assert response_unauth.status_code == 401, f"Expected 401 Unauthorized, got {response_unauth.status_code}"

test_list_authenticated_user_github_repositories()