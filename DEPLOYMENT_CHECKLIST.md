# 🎯 Zaxion First-Time Deployment Checklist

Since this is your **first deployment**, I've designed this guide to be your "Safety Net." We will use **Railway** for the Backend/Database and **Vercel** for the Frontend. This is the industry-standard setup for high-performance React apps.

---

## 🛠 Phase 1: Preparation (Do this locally)

### 1. Final Code Check
- [x] Dockerfile updated to `npm start`.
- [x] "Access Console" hidden in [LandingPage.tsx](file:///c:/Users/hamza/OneDrive/Desktop/hamza/github-testcase-generator-app/frontend/src/pages/LandingPage.tsx).
- [ ] Ensure all your changes are committed and pushed to your GitHub repository.

---

## 🚂 Phase 2: Backend Deployment (Railway.app)

Railway will host your **Server**, **PostgreSQL**, and **Redis**.

### 1. Provision Infrastructure
1.  Go to [Railway.app](https://railway.app/) and login with GitHub.
2.  Click **"New Project"** -> **"Provision PostgreSQL"**.
3.  Click **"New"** -> **"Provision Redis"**.

### 2. Deploy the Backend
1.  Click **"New"** -> **"GitHub Repo"** -> Select your Zaxion repository.
2.  When asked for the directory, select **`backend`**.
3.  Railway will start building the Docker image automatically.

### 3. Set Environment Variables
Go to the **"Variables"** tab in your Railway Backend service and add these:
- `PORT`: `5000`
- `NODE_ENV`: `production`
- `JWT_SECRET`: (Generate a random string)
- `FRONTEND_URL`: (You will get this from Vercel in the next phase)
- `DATABASE_URL`: (Railway automatically adds this from your Postgres service)
- `REDIS_URL`: (Railway automatically adds this from your Redis service)

---

## 📐 Phase 3: Frontend Deployment (Vercel)

Vercel is the best home for **React (Vite)** apps.

### 1. Import Project
1.  Go to [Vercel.com](https://vercel.com/) and login with GitHub.
2.  Click **"Add New"** -> **"Project"** -> Import your Zaxion repo.
3.  **Root Directory**: Set this to **`frontend`**.

### 2. Configure Build
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. Set Environment Variables
Under "Environment Variables," add:
- `VITE_API_BASE_URL`: (The URL of your Railway backend + `/api/v1`)
  - *Example: `https://zaxion-production.up.railway.app/api/v1`*

---

## 🧪 Phase 4: The "Smoke Test" (Post-Launch)

Once both are "Green":
1.  Visit your Vercel URL.
2.  Go to the **Waitlist** page.
3.  Sign up with a real email.
4.  Go to Railway -> PostgreSQL -> Data and verify the email is saved in the `Waitlists` table.

---

## 🧑‍🏫 Senior Advice for Your First Launch
- **Don't Panic**: If the build fails, check the "Logs" tab. Usually, it's just a missing environment variable.
- **The "Waitlist" is Live**: Once you verify the email save, the product is officially "in the wild."
- **CORS Errors**: If the frontend can't talk to the backend, make sure the `FRONTEND_URL` in Railway matches your Vercel URL exactly.

**You are ready. Push your code to GitHub and follow Phase 2!**
