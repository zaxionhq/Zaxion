---
description:
globs:
alwaysApply: true
---
# ===================================================================
# Cursor Project Rules — GitHub Test Case Generator (Enterprise SaaS)
# ===================================================================
# This file defines strict guardrails for Cursor AI Agent.
# Treat this as the "senior engineer handbook" for working on this repo.
# ===================================================================

project_overview:
  description: >
    This project is an **AI-powered GitHub Test Case Generator SaaS tool**.
    It integrates with GitHub, analyzes repositories, and generates automated
    unit/integration tests using AI. It can optionally create Pull Requests
    with the generated tests. The system is built with:
      - Backend: Node.js (Express) or Python (FastAPI) + REST APIs
      - Frontend: React (Vite) for UI
      - CI/CD: GitHub Actions (with secure handling of secrets)

  goals:
    - Provide developers with automatically generated test cases.
    - Allow reviewing, editing, and accepting/rejecting generated tests.
    - Enable automated PR creation with generated tests.
    - Improve trustworthiness of AI-generated tests via rationale + confidence score.
    - Keep architecture minimal, clean, and production-ready.

  non_goals:
    - No experimental features outside scope.
    - No demo/stub endpoints or placeholder files.
    - No unnecessary dependencies.
    - No random rewrites of working code.
    - Do not create unrelated pages/components.

# ===================================================================
# Backend Rules
# ===================================================================
backend:
  framework: >
    Either FastAPI (Python) OR Express.js (Node.js). DO NOT mix frameworks.
    If backend already uses one, stick with it. Do not migrate to another
    framework unless explicitly instructed.
  
  core_endpoints:
    - /auth/github        # GitHub OAuth login flow
    - /repos              # List authenticated user's repositories
    - /files              # Fetch files from selected repository
    - /generate-tests     # AI service: analyze repo files and return test cases
    - /create-pr          # Create Pull Request with generated test cases

  must_have_rules:
    - Always validate incoming requests (e.g., repo name, file paths).
    - Always handle errors gracefully (return structured JSON error with code + message).
    - Keep authentication & authorization secure (JWT tokens, refresh, expiry).
    - Use environment variables for secrets (never hardcode).
    - Ensure GitHub tokens are encrypted at rest and masked in logs.
    - Test execution should run in a safe sandbox (time, memory, CPU limited).
    - Write clear logging for debugging (never expose secrets).

  must_not_rules:
    - Do NOT create endpoints not listed above.
    - Do NOT leave unhandled exceptions (must use try/except or middleware).
    - Do NOT add “demo logic” (fake test generation, placeholder data).
    - Do NOT connect directly to databases unless specified (use ORM if needed).
    - Do NOT break API contracts expected by frontend.

# ===================================================================
# Frontend Rules
# ===================================================================
frontend:
  framework: >
    React + Vite (strict requirement). Do not replace with CRA, Next.js, or Angular.
  
  core_components:
    - LoginPage          # GitHub OAuth login
    - RepoSelector       # List and select GitHub repositories
    - TestGenerator      # Display, review, edit generated tests
    - PRCreator          # Submit selected tests as Pull Request

  must_have_rules:
    - Always call backend APIs with Axios/fetch using consistent base URL.
    - Display errors gracefully (error banners, not console spam).
    - Keep UI minimal, clean, and production-ready (no dummy UIs).
    - Always match API contract exactly (do not rename endpoints).
    - Ensure loading states (spinners, disabled buttons) are present where needed.
    - Always sanitize and escape user data before rendering.

  must_not_rules:
    - Do NOT create extra demo pages or playground components.
    - Do NOT add UI libraries unless justified (prefer Tailwind, shadcn/ui).
    - Do NOT hardcode API URLs (must use env variables).
    - Do NOT break OAuth login flow.

# ===================================================================
# Testing Rules
# ===================================================================
testing:
  approach:
    - Use pytest for Python backend OR Jest for Node backend.
    - Mock GitHub API calls (do not hit live GitHub in tests).
    - Ensure tests run fast, isolated, and repeatable.
    - Focus tests on backend API responses and frontend API integration.

  must_have_rules:
    - Each endpoint must have at least one unit/integration test.
    - Coverage report must be generated in CI.
    - Tests must fail on errors (no silent passing).
    - Prefer meaningful test names (describe scenario + expected result).

  must_not_rules:
    - Do NOT generate fake/placeholder tests.
    - Do NOT run destructive tests (never delete live repos, never push to real GitHub).
    - Do NOT depend on developer’s local environment.

# ===================================================================
# Error Fixing & Cleanup Rules
# ===================================================================
fixing_and_cleanup:
  rules:
    - Before making any fix, analyze the entire codebase for context.
    - Fix server errors and runtime issues at root cause, not with hacks.
    - Do NOT break working functionality while fixing errors.
    - Always remove unnecessary logic/files unrelated to scope.
    - Do NOT silently skip fixing; provide a real solution.
    - Always explain what was fixed and why.

  output_requirements:
    - After changes:
        - Backend must start without server errors.
        - Frontend must build successfully and connect to backend.
        - APIs must return valid responses.
    - Provide summary of:
        - Errors fixed
        - Files modified
        - Reason for modification

# ===================================================================
# General Behavior Rules
# ===================================================================
general:
  - Always prefer minimal, safe changes over risky rewrites.
  - Do NOT invent features unless explicitly instructed.
  - Do NOT rename files, functions, or endpoints unless fixing a bug.
  - Always document important changes inline (comments) if needed.
  - Ensure code is clean, readable, and maintainable.

# ===================================================================
# Workflow Expectations
# ===================================================================
workflow:
  - Step 1: Analyze → understand the problem and file context.
  - Step 2: Fix → apply minimal, correct fixes to errors.
  - Step 3: Clean → remove unnecessary logic/files safely.
  - Step 4: Test → verify backend & frontend still work.
  - Step 5: Summarize → explain what was done and why.

