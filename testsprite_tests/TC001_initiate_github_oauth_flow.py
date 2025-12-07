import requests

def test_initiate_github_oauth_flow():
    base_url = "http://localhost:5000"
    endpoint = "/api/v1/auth/github"
    url = base_url + endpoint
    timeout = 30

    try:
        response = requests.get(url, allow_redirects=False, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request to initiate GitHub OAuth flow failed: {e}"

    # Assert that the response status code is 302 (redirect)
    assert response.status_code == 302, (
        f"Expected status code 302 for redirect but got {response.status_code}"
    )

    # Assert that the Location header is present and points to github.com (authorization page)
    location = response.headers.get("Location")
    assert location is not None, "Redirect response missing Location header"
    assert "github.com/login/oauth/authorize" in location or "github.com" in location, (
        f"Redirect Location header does not appear to be GitHub OAuth URL: {location}"
    )

test_initiate_github_oauth_flow()