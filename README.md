# 🚀 How to Run

Follow these steps to set up the GitHub Test Case Generator in your local development environment.

## 📋 Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: Local instance or cloud (e.g., Supabase, RDS)
- **Redis**: Local instance or [Upstash](https://upstash.com/) for queue management
- **GitHub App**: You will need to create a GitHub App (see [Configuration](#configuration))

---

## �️ Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/github-testcase-generator-app.git
   cd github-testcase-generator-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

---

## ⚙️ Configuration

### 1. Database & Redis
Ensure your PostgreSQL and Redis services are running. Update the following in `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=github_test_generator

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. GitHub App Credentials
1. Create a GitHub App in your organization/account.
2. Generate a Private Key (`.pem`) and place it in `backend/secrets/github-app.pem`.
3. Update `backend/.env`:
```env
GITHUB_APP_ID=your_app_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Database Migrations
Run the migrations to set up the schema:
```bash
cd backend
npm run db:migrate
```

---

## 🏃 Running the App

### Option A: Manual (Recommended for Dev)

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3: PR Worker**
```bash
cd backend
node src/workers/prAnalysis.worker.js
```

### Option B: Docker (Coming Soon)
```bash
docker-compose up
```

---

## 🧪 Verification
Once running, you can verify the setup by visiting:
- **Frontend**: `http://localhost:5173`
- **Backend Health**: `http://localhost:5000/health`
