# PMR Atlas - Medical Education Platform

A comprehensive Medical Education Platform focused on Physical Medicine and Rehabilitation (PMR).

## Features

- 🔐 **Authentication**: JWT-based with role management (Admin/Student)
- 🌍 **Multi-language**: English, Portuguese (PT), Spanish with auto-translation
- 📝 **Inline Editing**: Per-section editing with save & translate options
- 🖼️ **Media Support**: Image/video uploads with alignment options
- 📑 **Collapsible Sections**: Clean dropdown interface
- 📋 **Copy to Clipboard**: Easy content copying for each section
- 🔖 **Bookmarks & Notes**: Personal study tools
- 🔍 **Full-text Search**: Quick disease lookup

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Google Translate via Emergent Integrations

---

## Deployment Guide

### Prerequisites

1. **MongoDB Atlas Account** - [Create free cluster](https://www.mongodb.com/cloud/atlas)
2. **GitHub Account** - For code hosting
3. **Vercel Account** - [Sign up free](https://vercel.com)
4. **Railway Account** - [Sign up free](https://railway.app)

---

### Step 1: Set Up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user (note the username/password)
3. Whitelist all IPs: `0.0.0.0/0` (for Railway access)
4. Get your connection string (looks like `mongodb+srv://...`)

---

### Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select this repository
4. Set **Root Directory**: `backend`
5. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `MONGO_URL` | Your MongoDB Atlas connection string |
| `DB_NAME` | `pmr_medical_edu` |
| `JWT_SECRET` | Generate a random 32+ character string |
| `EMERGENT_LLM_KEY` | Your Emergent LLM key (for translations) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (add after Vercel deploy) |

6. Click **Deploy** - Railway will auto-detect FastAPI
7. Note your Railway URL (e.g., `https://pmr-backend.railway.app`)

---

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → Import this repository
3. Set **Root Directory**: `frontend`
4. Set **Framework Preset**: Create React App
5. Add **Environment Variable**:

| Variable | Value |
|----------|-------|
| `REACT_APP_BACKEND_URL` | Your Railway backend URL (from Step 2) |

6. Click **Deploy**

---

### Step 4: Update CORS

1. Go back to Railway dashboard
2. Update `CORS_ORIGINS` to your Vercel URL (e.g., `https://pmr-atlas.vercel.app`)
3. Railway will auto-redeploy

---

### Step 5: Initialize Database

The app will auto-create collections on first run. To add an admin user:

1. Visit your deployed app
2. Register a new account
3. Use MongoDB Atlas to update the user's `role` to `"admin"`:

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## Test Credentials (Development Only)

- **Admin**: admin@pmr.edu / admin123
- **Viewer**: test@test.com / password

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

---

## Environment Variables Reference

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

### Backend (.env)
```
MONGO_URL=mongodb+srv://...
DB_NAME=pmr_medical_edu
JWT_SECRET=your-secret-key
EMERGENT_LLM_KEY=your-key
CORS_ORIGINS=https://your-frontend.vercel.app
```

---

## License

MIT License
