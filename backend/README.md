(# GitHub Test Case Generator - Backend

This document outlines the backend architecture, API endpoints, and operational guidelines for the GitHub Test Case Generator.

## 🚀 Technology Stack

The backend is built using **Node.js with Express.js**, providing a robust and scalable foundation for our API services.

## 🔑 Core API Endpoints

The following RESTful API endpoints are central to the application's functionality:

-   `/auth/github`: Handles the GitHub OAuth login flow.
-   `/repos`: Lists the authenticated user's GitHub repositories.
-   `/files`: Fetches file contents from a selected repository.
-   `/generate-tests`: AI service endpoint to analyze repository files and generate automated test cases.
-   `/create-pr`: Creates a Pull Request on GitHub with the generated test cases.

## 🧹 Linting and Code Quality

This project enforces code quality and consistency using ESLint and TypeScript. The linting process helps catch errors early and maintain a high standard of code. To run the linter:

```sh
npm run lint
```

All linting errors have been resolved, ensuring a clean and maintainable codebase.

# Deployment: Render / Vercel environment variables)

This project expects runtime secrets and configuration to be provided via environment variables (process.env). Do NOT commit secrets to the repository. Below are short instructions for deploying to Render or Vercel and how to set env vars.

## Required environment variables (example)

- NODE_ENV=production
- PORT=5000 (Render sets this automatically)
- DATABASE_URL (recommended) or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRETS (comma-separated list) or JWT_SECRET
- JWT_TTL (default token lifetime, e.g. 2h)
- GITHUB_CLIENT_ID (from GitHub OAuth App registration)
- GITHUB_CLIENT_SECRET (from GitHub OAuth App registration)
- GITHUB_REDIRECT_URI (e.g., http://localhost:5000/api/v1/auth/github/callback for local dev)
- FRONTEND_URL (origin used for CORS)
- TOKEN_ENCRYPTION_KEY (optional — used to encrypt tokens at rest)

## Render

1. Create a new Web Service and connect your GitHub repository.
2. In the service settings > Environment, add the environment variables listed above. Use the `DATABASE_URL` value provided by your managed database or set DB_* variables.
3. Set the Start Command to: `npm start` (or keep the default if already configured).
4. For deployment, make sure `NODE_ENV=production` is set.

Notes: Render runs a long-lived Node process which is appropriate for Express with Sequelize. It also provides a secure UI for environment variables.

## Vercel

1. Vercel is serverless-first. Deploying an Express app to Vercel requires using a Serverless Function adapter or deploying only the frontend. Consider using Render for the backend.
2. If you use Vercel, go to Project > Settings > Environment Variables and add the same variables as above for the Production environment.
3. Beware of connection pooling limits with serverless functions — use a serverless-compatible DB connection strategy or an external service (like Render) for the API.

## Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) and click on "New OAuth App".
2. Fill in the application details:
   - Application name: GitHub Test Case Generator (or your preferred name)
   - Homepage URL: http://localhost:8080 (for local development)
   - Authorization callback URL: http://localhost:5000/api/v1/auth/github/callback (for local development)
3. Click "Register application".
4. On the next page, you'll see your Client ID. Click "Generate a new client secret".
5. Copy both the Client ID and Client Secret to your `.env` file:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URI=http://localhost:5000/api/v1/auth/github/callback
   ```

## Local development

1. Create a `.env` file at the repository root (backend/.env) with the variables needed for development. Ensure `.env` is in `.gitignore`.
2. Set up GitHub OAuth credentials as described above.
3. Run locally with:

```powershell
cd backend
npm install
npm run dev
```

## Security checklist

- Do not commit `.env` to the repo.
- Use strong, unique secrets and rotate them regularly.
- Limit access to your deployment provider account and enable 2FA.
- Encrypt tokens at rest (TOKEN_ENCRYPTION_KEY) and rotate keys carefully.
- Use JWT rotation: put current and previous keys in JWT_SECRETS (first signs, all verify). Bump the first key to rotate.
- Apply per-route rate limiting for sensitive endpoints. This project uses stricter limits on `/api/v1/auth`, `/api/v1/github`, `/api/v1/testcases/execute`, and `/api/v1/chatbot/*`.

### Least-privilege database user

Create two users: one admin for migrations and one app user for runtime. Grant only the required permissions to the app user:

```sql
-- run as admin / owner of the database
CREATE USER app_user WITH PASSWORD 'REDACTED';
GRANT CONNECT ON DATABASE your_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;
```

Use this user in `DB_USER`/`DB_PASSWORD`. Keep a separate admin credential for running migrations only.

### Dependency audits

Run dependency audits regularly and pin versions when possible:

```bash
cd backend
npm audit --production
npm audit fix --only=prod
```

Review major updates manually and run tests before deployment.

## Token encryption at rest

GitHub OAuth access tokens are stored encrypted using AES-256-GCM when `TOKEN_ENCRYPTION_KEY` is configured. The format is `ivHex.tagHex.ciphertextHex`. Without a key, values are stored as-is (use only for local dev).

## JWT rotation

Set `JWT_SECRETS` as a comma-separated list. The first secret is used to sign new tokens; all listed secrets are used to verify existing tokens. Example:

```
JWT_SECRETS=prod_key_v2,prod_key_v1
JWT_TTL=2h
```

When rotating, prepend the new key to the list and keep the previous one(s) until old tokens expire.

If you'd like, I can also remove any leftover SDK references or help run an uninstall locally to ensure there are no related packages in node_modules.

## Troubleshooting

### "GitHub token missing" error

If you see this error in the console or UI:

1. Verify that you've set up GitHub OAuth credentials correctly as described in the "Setting up GitHub OAuth" section.
2. Check that your `.env` file contains valid `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` values.
3. Make sure you've completed the GitHub OAuth flow by clicking "Connect GitHub" in the UI.
4. Check the browser console and server logs for additional error details.
5. Try clearing your browser cookies and restarting the authentication process.

### Authentication issues

1. Ensure your `GITHUB_REDIRECT_URI` matches exactly what you registered in your GitHub OAuth App.
2. Check that `FRONTEND_URL` and `FRONTEND_ORIGIN` are set correctly in your `.env` file.
3. Verify that cookies are being set properly (check your browser's developer tools).
4. If using HTTPS locally, ensure your certificates are valid and trusted by your browser.
