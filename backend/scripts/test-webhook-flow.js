import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}/api/v1/webhooks/github`;

if (!WEBHOOK_SECRET) {
  console.error("Error: GITHUB_WEBHOOK_SECRET not found in .env");
  process.exit(1);
}

const payload = {
  action: "opened",
  number: 1,
  pull_request: {
    url: "https://api.github.com/repos/octokit/rest.js/pulls/1",
    id: 1,
    node_id: "MDExOlB1bGxSZXF1ZXN0MQ==",
    html_url: "https://github.com/octokit/rest.js/pull/1",
    diff_url: "https://github.com/octokit/rest.js/pull/1.diff",
    patch_url: "https://github.com/octokit/rest.js/pull/1.patch",
    issue_url: "https://api.github.com/repos/octokit/rest.js/issues/1",
    number: 1,
    state: "open",
    locked: false,
    title: "Test PR for Gate Analysis",
    user: {
      login: "octocat",
      id: 1,
      node_id: "MDQ6VXNlcjE=",
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      gravatar_id: "",
      url: "https://api.github.com/users/octocat",
      html_url: "https://github.com/octocat",
      followers_url: "https://api.github.com/users/octocat/followers",
      following_url: "https://api.github.com/users/octocat/following{/other_user}",
      gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
      starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
      subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
      organizations_url: "https://api.github.com/users/octocat/orgs",
      repos_url: "https://api.github.com/users/octocat/repos",
      events_url: "https://api.github.com/users/octocat/events{/privacy}",
      received_events_url: "https://api.github.com/users/octocat/received_events",
      type: "User",
      site_admin: false
    },
    body: "This is a test PR to trigger the PR Gate Analysis.",
    created_at: "2011-01-26T19:01:12Z",
    updated_at: "2011-01-26T19:01:12Z",
    closed_at: null,
    merged_at: null,
    merge_commit_sha: "e5bd3914e2e596debea16f433f57875b5b90bcd6",
    assignee: null,
    assignees: [],
    requested_reviewers: [],
    requested_teams: [],
    labels: [],
    milestone: null,
    draft: false,
    commits_url: "https://api.github.com/repos/octokit/rest.js/pulls/1/commits",
    review_comments_url: "https://api.github.com/repos/octokit/rest.js/pulls/1/comments",
    review_comment_url: "https://api.github.com/repos/octokit/rest.js/pulls/comments{/number}",
    comments_url: "https://api.github.com/repos/octokit/rest.js/issues/1/comments",
    statuses_url: "https://api.github.com/repos/octokit/rest.js/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e",
    head: {
      label: "new-topic",
      ref: "new-topic",
      sha: "6dcb09b5b57875f334f61aebed695e2e4193db5e",
      user: {
        login: "octocat",
        id: 1,
        node_id: "MDQ6VXNlcjE=",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        gravatar_id: "",
        url: "https://api.github.com/users/octocat",
        html_url: "https://github.com/octocat",
        followers_url: "https://api.github.com/users/octocat/followers",
        following_url: "https://api.github.com/users/octocat/following{/other_user}",
        gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
        starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
        organizations_url: "https://api.github.com/users/octocat/orgs",
        repos_url: "https://api.github.com/users/octocat/repos",
        events_url: "https://api.github.com/users/octocat/events{/privacy}",
        received_events_url: "https://api.github.com/users/octocat/received_events",
        type: "User",
        site_admin: false
      },
      repo: {
        id: 1296269,
        node_id: "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
        name: "rest.js",
        full_name: "octokit/rest.js",
        private: false,
        owner: {
          login: "octokit",
          id: 1,
          node_id: "MDQ6VXNlcjE=",
          avatar_url: "https://github.com/images/error/octocat_happy.gif",
          gravatar_id: "",
          url: "https://api.github.com/users/octocat",
          html_url: "https://github.com/octocat",
          followers_url: "https://api.github.com/users/octocat/followers",
          following_url: "https://api.github.com/users/octocat/following{/other_user}",
          gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
          starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
          organizations_url: "https://api.github.com/users/octocat/orgs",
          repos_url: "https://api.github.com/users/octocat/repos",
          events_url: "https://api.github.com/users/octocat/events{/privacy}",
          received_events_url: "https://api.github.com/users/octocat/received_events",
          type: "User",
          site_admin: false
        },
        html_url: "https://github.com/octokit/rest.js",
        description: "GitHub REST API client for Node.js",
        fork: false,
        url: "https://api.github.com/repos/octokit/rest.js",
        created_at: "2011-01-26T19:01:12Z",
        updated_at: "2011-01-26T19:14:43Z",
        pushed_at: "2011-01-26T19:06:43Z",
        homepage: "https://github.com/octokit/rest.js",
        size: 108,
        stargazers_count: 80,
        watchers_count: 80,
        language: "JavaScript",
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        forks_count: 9,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 0,
        license: {
          key: "mit",
          name: "MIT License",
          spdx_id: "MIT",
          url: "https://api.github.com/licenses/mit",
          node_id: "MDc6TGljZW5zZTEz"
        },
        allow_forking: true,
        is_template: false,
        topics: [],
        visibility: "public",
        forks: 9,
        open_issues: 0,
        watchers: 80,
        default_branch: "master"
      }
    },
    base: {
      label: "master",
      ref: "master",
      sha: "6dcb09b5b57875f334f61aebed695e2e4193db5e",
      user: {
        login: "octokit",
        id: 1,
        node_id: "MDQ6VXNlcjE=",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        gravatar_id: "",
        url: "https://api.github.com/users/octocat",
        html_url: "https://github.com/octocat",
        followers_url: "https://api.github.com/users/octocat/followers",
        following_url: "https://api.github.com/users/octocat/following{/other_user}",
        gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
        starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
        organizations_url: "https://api.github.com/users/octocat/orgs",
        repos_url: "https://api.github.com/users/octocat/repos",
        events_url: "https://api.github.com/users/octocat/events{/privacy}",
        received_events_url: "https://api.github.com/users/octocat/received_events",
        type: "User",
        site_admin: false
      },
      repo: {
        id: 1296269,
        node_id: "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
        name: "rest.js",
        full_name: "octokit/rest.js",
        private: false,
        owner: {
          login: "octokit",
          id: 1,
          node_id: "MDQ6VXNlcjE=",
          avatar_url: "https://github.com/images/error/octocat_happy.gif",
          gravatar_id: "",
          url: "https://api.github.com/users/octocat",
          html_url: "https://github.com/octocat",
          followers_url: "https://api.github.com/users/octocat/followers",
          following_url: "https://api.github.com/users/octocat/following{/other_user}",
          gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
          starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
          organizations_url: "https://api.github.com/users/octocat/orgs",
          repos_url: "https://api.github.com/users/octocat/repos",
          events_url: "https://api.github.com/users/octocat/events{/privacy}",
          received_events_url: "https://api.github.com/users/octocat/received_events",
          type: "User",
          site_admin: false
        },
        html_url: "https://github.com/octokit/rest.js",
        description: "GitHub REST API client for Node.js",
        fork: false,
        url: "https://api.github.com/repos/octokit/rest.js",
        created_at: "2011-01-26T19:01:12Z",
        updated_at: "2011-01-26T19:14:43Z",
        pushed_at: "2011-01-26T19:06:43Z",
        homepage: "https://github.com/octokit/rest.js",
        size: 108,
        stargazers_count: 80,
        watchers_count: 80,
        language: "JavaScript",
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        forks_count: 9,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 0,
        license: {
          key: "mit",
          name: "MIT License",
          spdx_id: "MIT",
          url: "https://api.github.com/licenses/mit",
          node_id: "MDc6TGljZW5zZTEz"
        },
        allow_forking: true,
        is_template: false,
        topics: [],
        visibility: "public",
        forks: 9,
        open_issues: 0,
        watchers: 80,
        default_branch: "master"
      }
    },
    _links: {
      self: {
        href: "https://api.github.com/repos/octokit/rest.js/pulls/1"
      },
      html: {
        href: "https://github.com/octokit/rest.js/pull/1"
      },
      issue: {
        href: "https://api.github.com/repos/octokit/rest.js/issues/1"
      },
      comments: {
        href: "https://api.github.com/repos/octokit/rest.js/issues/1/comments"
      },
      review_comments: {
        href: "https://api.github.com/repos/octokit/rest.js/pulls/1/comments"
      },
      review_comment: {
        href: "https://api.github.com/repos/octokit/rest.js/pulls/comments{/number}"
      },
      commits: {
        href: "https://api.github.com/repos/octokit/rest.js/pulls/1/commits"
      },
      statuses: {
        href: "https://api.github.com/repos/octokit/rest.js/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e"
      }
    },
    author_association: "OWNER",
    auto_merge: null,
    active_lock_reason: null
  },
  repository: {
    id: 1296269,
    node_id: "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
    name: "rest.js",
    full_name: "octokit/rest.js",
    private: false,
    owner: {
      login: "octokit",
      id: 1,
      node_id: "MDQ6VXNlcjE=",
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      gravatar_id: "",
      url: "https://api.github.com/users/octocat",
      html_url: "https://github.com/octocat",
      followers_url: "https://api.github.com/users/octocat/followers",
      following_url: "https://api.github.com/users/octocat/following{/other_user}",
      gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
      starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
      subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
      organizations_url: "https://api.github.com/users/octocat/orgs",
      repos_url: "https://api.github.com/users/octocat/repos",
      events_url: "https://api.github.com/users/octocat/events{/privacy}",
      received_events_url: "https://api.github.com/users/octocat/received_events",
      type: "User",
      site_admin: false
    },
    html_url: "https://github.com/octokit/rest.js",
    description: "GitHub REST API client for Node.js",
    fork: false,
    url: "https://api.github.com/repos/octokit/rest.js",
    created_at: "2011-01-26T19:01:12Z",
    updated_at: "2011-01-26T19:14:43Z",
    pushed_at: "2011-01-26T19:06:43Z",
    homepage: "https://github.com/octokit/rest.js",
    size: 108,
    stargazers_count: 80,
    watchers_count: 80,
    language: "JavaScript",
    has_issues: true,
    has_projects: true,
    has_downloads: true,
    has_wiki: true,
    has_pages: false,
    forks_count: 9,
    mirror_url: null,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: {
      key: "mit",
      name: "MIT License",
      spdx_id: "MIT",
      url: "https://api.github.com/licenses/mit",
      node_id: "MDc6TGljZW5zZTEz"
    },
    allow_forking: true,
    is_template: false,
    topics: [],
    visibility: "public",
    forks: 9,
    open_issues: 0,
    watchers: 80,
    default_branch: "master"
  }
};

// Create Signature
const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
const signature = "sha256=" + hmac.update(JSON.stringify(payload)).digest("hex");

console.log(`Sending webhook to ${URL}...`);

try {
  const response = await axios.post(URL, payload, {
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "pull_request",
      "X-Hub-Signature-256": signature
    }
  });
  console.log("Response:", response.status, response.data);
} catch (error) {
  console.error("Failed:", error.message);
  if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
  } else if (error.request) {
      console.error("No response received");
  }
}
