import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Provide a valid OAuth token for authorization here
TOKEN = "your_valid_github_oauth_token"

def test_get_files_from_github_repository():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }

    repo = "octocat/Hello-World"  # Example known public repository
    path = "docs"  # Optional path example that may or may not exist

    # 1. Test response with repo only (root path)
    params = {"repo": repo}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers, params=params, timeout=TIMEOUT)
    assert resp.status_code in (200, 404), f"Expected 200 or 404, got {resp.status_code}"
    if resp.status_code == 200:
        json_data = resp.json()
        assert isinstance(json_data, list), "Response should be a list of files"

    # 2. Test successful response with repo and valid path
    params = {"repo": repo, "path": path}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers, params=params, timeout=TIMEOUT)
    if resp.status_code == 200:
        json_data = resp.json()
        assert isinstance(json_data, list), "Response should be a list of files"
    else:
        # Path may not exist; 404 acceptable here
        assert resp.status_code == 404 or resp.status_code == 200, f"Expected 200 or 404, got {resp.status_code}"

    # 3. Test 404 response for non-existent repo
    params = {"repo": "thisuser/thisrepodoesnotexist1234567890"}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers, params=params, timeout=TIMEOUT)
    assert resp.status_code == 404, f"Expected 404 for non-existent repo, got {resp.status_code}"

    # 4. Test 404 response for non-existent path in a valid repo
    params = {"repo": repo, "path": "nonexistent/path/to/files"}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers, params=params, timeout=TIMEOUT)
    assert resp.status_code == 404, f"Expected 404 for non-existent path, got {resp.status_code}"

    # 5. Test 401 unauthorized with no or invalid token
    headers_unauth = {"Authorization": "Bearer invalidtoken123"}
    params = {"repo": repo}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers_unauth, params=params, timeout=TIMEOUT)
    assert resp.status_code in (401, 404), f"Expected 401 or 404 unauthorized, got {resp.status_code}"

    headers_no_auth = {"Accept": "application/json"}
    resp = requests.get(f"{BASE_URL}/api/v1/github/files", headers=headers_no_auth, params=params, timeout=TIMEOUT)
    assert resp.status_code in (401, 404), f"Expected 401 or 404 without token, got {resp.status_code}"

test_get_files_from_github_repository()
