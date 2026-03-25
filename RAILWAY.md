# Railway Deployment Guide — StupidCMS

## What We Already Set Up In This Repo

This repo already has the first Railway wiring in place.

- Added a root `package.json` so Railway can detect a Node app from the repo root.
- Added `postinstall` at the repo root to install dependencies from `server/`.
- Added a root `start` command that runs `server/server.js`.
- Added `railway.toml` with build/start/healthcheck/restart settings.
- Kept local development on `PORT=3001` inside `server/.env`.
- Documented that Railway should NOT receive a manual `PORT` variable.
- Added a root `.gitignore` so root-level `.env`, `node_modules/`, and `.railway/` stay out of git.

Current deployment assumption:

- Local development stays on port `3001`.
- Railway injects its own runtime port automatically.
- Static files are served from the repo root by `server/server.js`, so `/admin` and other public files remain available when Railway starts from the repo root.

Open caveat:

- Content in `server/data/` is still JSON-file based. On Railway that data is not durable unless you attach a volume or move the write path to MongoDB.

## What is Railway?

Railway is a cloud hosting service. You connect your GitHub repo,
and it automatically deploys your app every time you push code.

Think of it like: **GitHub push → app goes live automatically.**

---

## Project Structure (why it matters)

```
stupidCMS/                  ← Railway deploys from HERE (the repo root)
├── package.json            ← Railway reads THIS first (root)
├── railway.toml            ← Railway config (build + start commands)
├── admin/                  ← Admin panel (static HTML files)
├── beta-testing/           ← Test pages
└── server/
    ├── package.json        ← Actual dependencies (express, etc.)
    ├── server.js           ← The Express server
    ├── .env                ← LOCAL secrets (NOT pushed to Railway)
    └── data/               ← JSON data files
        ├── site_bobby/
        └── site_rami/
```

**The trick:** The root `package.json` is a thin wrapper that tells Railway
to install deps from `/server` and run `server/server.js`.

---

## Setup Steps (one-time)

### 1. Create a Railway account
Go to https://railway.app and sign up with GitHub.

### 2. Create a new project
- Click **"New Project"**
- Choose **"Deploy from GitHub Repo"**
- Select the `stupidcms` repository
- Railway will auto-detect Node.js and use `railway.toml`

### 3. Add Environment Variables
In Railway dashboard → your service → **Variables** tab, add:

| Variable                | Value                              | Notes                        |
|-------------------------|------------------------------------|------------------------------|
| `JWT_SECRET`            | (a long random string)             | CHANGE from local value!     |
| `CLOUDINARY_CLOUD_NAME` | `dfghdeegs`                       | Same as local                |
| `CLOUDINARY_API_KEY`    | (your key)                         | Same as local                |
| `CLOUDINARY_API_SECRET` | (your secret)                      | Same as local                |
| `MONGODB_URI`           | (your MongoDB Atlas connection)    | Same as local                |

> **DO NOT add PORT** — Railway sets it automatically.

### 4. Deploy
Railway deploys automatically when you push to `main`.
You can also trigger a manual deploy from the dashboard.

### 5. Get your public URL
In Railway dashboard → your service → **Settings** → **Networking**:
- Click **"Generate Domain"**
- You'll get something like: `stupidcms-production.up.railway.app`

### 6. Railway Project ID

If Railway shows you a Project ID like `1c61af66-1ffa-458e-a8e0-23bb90de247a`:

- You do **not** need to put it in the app code.
- You do **not** need to add it to `.env` for normal GitHub-based deploys.
- Railway already knows which project to deploy because the GitHub repo is connected in the Railway dashboard.

You usually only need the Project ID for:

- Railway CLI workflows like `railway link`
- API usage against Railway's own platform APIs
- Team/admin/debugging inside the Railway dashboard

For this repo, treat the Project ID as **platform metadata**, not app configuration.

---

## ⚠️ Important: JSON Data Files

Right now, StupidCMS stores data in JSON files (`server/data/`).
On Railway, the filesystem is **ephemeral** — files reset on every deploy.

**What this means:**
- Data in `server/data/` will be included from your Git repo on each deploy
- Any data CREATED through the admin panel AFTER deploy will be LOST on next deploy

**Solutions (pick one later):**
1. **Railway Volume** — Attach a persistent volume to `/app/server/data`
   (In Railway dashboard → service → **Volumes** → Add volume → Mount path: `/app/server/data`)
2. **Move to MongoDB** — Store all data in MongoDB instead of JSON files
   (This is the better long-term solution)

---

## Local vs Railway

| Setting      | Local (.env)                  | Railway (Variables tab)       |
|-------------|-------------------------------|-------------------------------|
| PORT        | `3001`                        | Set automatically by Railway  |
| JWT_SECRET  | dev value                     | Strong random value!          |
| MONGODB_URI | Same Atlas connection string  | Same Atlas connection string  |
| Cloudinary  | Same keys                     | Same keys                     |

---

## Useful Railway Commands (optional CLI)

```bash
# Install Railway CLI (optional, dashboard works fine)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy manually
railway up

# View logs
railway logs
```

---

## Quick Troubleshooting

| Problem                  | Fix                                                    |
|--------------------------|--------------------------------------------------------|
| Build fails              | Check Railway build logs. Usually a missing dependency |
| App crashes on start     | Check Variables tab — did you add all env vars?        |
| "Cannot find module"     | Root package.json postinstall should handle this       |
| Data disappears on deploy| Need a Railway Volume (see section above)              |
| Can't access the site    | Generate a domain in Settings → Networking             |
