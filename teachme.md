### STEP 1 — TASK A: WHAT DOES YOUR PROJECT DO? (High-Level)

**What the user does:**
The user connects their GitHub account to the application. They then pick a specific GitHub repository and choose which files they want to analyze. After the AI generates test cases, the user can look at them, make changes if needed, and then decide to create a Pull Request on GitHub with these new tests.

**What the AI does:**
The AI is the smart part that reads the user's code files from GitHub. It figures out what the code does, identifies areas that need testing, and then writes new test cases specifically for those files. It can also summarize code and answer questions about it.

**What GitHub’s API does:**
GitHub's API is like a messenger service that lets our application talk to GitHub. It handles things like securely logging in the user, getting a list of their repositories, fetching the actual code files from those repositories, and finally, creating a Pull Request with the AI-generated tests.

**What your backend does:**
The backend is the server-side brain of the application. It manages user logins through GitHub, talks to the GitHub API to get repository and file information, sends code to the AI for analysis and test generation, and then takes the AI's results to create Pull Requests on GitHub. It also handles all the security and data flow between the frontend and external services.

**What your frontend does:**
The frontend is what the user sees and interacts with in their web browser. It provides the interface for logging in with GitHub, selecting repositories and files, viewing the AI-generated test cases, editing them, and triggering the creation of Pull Requests. It's the user's window into the entire process.

**What final output the user receives:**
The user ultimately receives a Pull Request on their chosen GitHub repository. This Pull Request contains the new, AI-generated test files, ready for review and merging into their codebase.

### STEP 1 — TASK B: DATA FLOW PIPELINE

Explain the flow EXACTLY like this:
Input → Processing → Output → GitHub Action
For example:
User inputs X →
AI receives Y →
AI returns Z →
Backend formats Z →
Backend updates GitHub →
User sees final result

You must fill X, Y, Z with your project’s actual values.

**Input → Processing → Output → GitHub Action**

- **User inputs GitHub credentials** →
- **Backend authenticates with GitHub API** →
- **Backend fetches user's repositories** →
- **Frontend displays repositories** →
- **User selects a repository and files** →
- **Frontend sends selected files to Backend** →
- **Backend sends file content to AI service** →
- **AI service generates test cases** →
- **AI service returns generated test cases to Backend** →
- **Backend formats test cases** →
- **Frontend displays generated test cases for review** →
- **User reviews and approves/edits test cases** →
- **Frontend sends approved test cases to Backend for PR creation** →
- **Backend creates a new branch and commits test files to GitHub via GitHub API** →
- **Backend creates a Pull Request on GitHub** →
- **User sees final Pull Request on GitHub**

### STEP 1 — TASK C: IDENTIFY MAIN COMPONENTS

**Backend Components:**

- `/auth/github` route: Handles GitHub OAuth login flow.
- `/repos` route: Lists authenticated user's repositories.
- `/files` route: Fetches files from a selected repository.
- `/generate-tests` route: AI service endpoint for analyzing repo files and returning test cases.
- `/create-pr` route: Creates a Pull Request with generated test cases.
- GitHub API service: Manages communication with the GitHub API (authentication, fetching data, creating PRs).
- AI service (`llm.service.js`): Orchestrates communication with the chosen LLM provider (Gemini, OpenRouter, OpenAI).
- Project configuration: Environment variables (`.env`) for API keys, URLs, and other settings.
- Authentication/Authorization: Handles user sessions and secure access.
- Error Handling Middleware: Catches and formats errors consistently.

**Frontend Components:**

- `LoginPage`: Handles GitHub OAuth login and redirects.
- `RepoSelector`: Displays a list of GitHub repositories and allows selection.
- `TestGenerator`: Displays, allows review and editing of generated test cases.
- `PRCreator`: Facilitates submitting selected tests as a Pull Request.
- Input forms: For user interaction (e.g., selecting files, editing tests).
- Display areas: To show repository content, generated tests, and status messages.
- API Client (e.g., Axios/fetch): For making requests to the backend.
- Loading states/Spinners: To indicate ongoing processes.

**External Services:**

- OpenRouter (or other LLM Provider like Gemini/OpenAI): Provides the AI model for test generation and code analysis.
- GitHub API: Provides access to GitHub repositories, user data, and Pull Request functionality.
- GitHub OAuth: Handles secure user authentication and authorization with GitHub.
