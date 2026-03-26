# CLAUDE.md — StupidCMS

> This is the source of truth for all AI agents (Claude Code, Copilot, etc.) working in this repo.
> `.github/copilot-instructions.md` points here.

---

## What is this project?

**StupidCMS** — a lean, self-hosted CMS admin panel for managing blog + content across ~10 client portfolio websites (built with Loveable/similar tools). Alternative to Strapi — intentionally minimal, no per-user licensing costs.

- Frontend: Plain JS + React (Babel in-browser, no build step), Quill rich text (CDN)
- Backend: Node.js + Express, JSON file storage (`server/data/`), Cloudinary for images, JWT auth
- Hosting: Railway (push to `main` = auto-deploy)

---

## IMPORTANT: No TypeScript

This project does NOT use TypeScript — only plain JavaScript (including JSX). Do NOT add `.ts`/`.tsx` files or TypeScript syntax.

---

## FILE SIZE RULE — MANDATORY

**No single JS file should exceed ~300 lines.** If it's growing past that, split it.
This project is called StupidCMS for a reason — keep it simple and readable.

---

## COMPONENT ORGANIZATION — MANDATORY

**All shared React components must live as separate files under `admin/app/components/`.**

- Do NOT keep multiple components in a single file.
- Each component gets its own file: `admin/app/components/ToastContainer.js`, etc.
- Each component attaches itself to `window`: `window.ToastContainer = function ToastContainer(...) { ... }`
- Non-component logic (helpers, API, constants) lives in `admin/app/helpers.js`.
- The boot loader in `admin/index.html` loads each file sequentially via Babel.

**Current component files:**
```
admin/app/components/
  OutlineIcon.js
  ToastContainer.js
  AlertBox.js
  Breadcrumbs.js
  BackendWarning.js
  Layout.js
  QuillEditor.js
  FormFields.js
  ListPage.js
  EditorPage.js
  Nav.js
  index.js
```

**If you need a new component, create a new file. Never append to an existing component file.**

---

## COLLECTION SCHEMA ORGANIZATION — MANDATORY

**Each CMS collection schema must live in its own file under `admin/app/collections/`.**

- Do NOT add collection schemas to `collections.js` directly.
- `admin/app/collections.js` = core setup only (API_BASE, `buildCollection`, `FIELD_TYPE_REGISTRY`, `SITE_DOMAINS`).
- Each schema file registers itself: `window.COLLECTION_SCHEMAS.posts = { ... }`
- `admin/app/collections-init.js` runs validation and builds the final `window.COLLECTIONS` object.

**Current schema files:**
```
admin/app/collections/
  posts.js
  blog_authors.js
  blog_categories.js
  media.js
  media_publishers.js
  services.js
  services_categories.js
  team.js
  team_categories.js
  faq.js
  faq_categories.js
  portfolio.js
  portfolio_categories.js
  legal.js
```

**To add a new collection:**
1. Create `admin/app/collections/my_new_collection.js`
2. Add `await load('app/collections/my_new_collection.js?v=' + build);` to the boot loader in `index.html` (before `collections-init.js`)
3. Add matching data file in `server/data/site_*/my_new_collection/` if needed

---

## BOOT LOADER ORDER

The SPA loads files sequentially in `admin/index.html` via an async boot loader.
Order matters — dependencies must load first:

1. `app/collections.js` — core setup, `COLLECTION_SCHEMAS = {}`, `buildCollection`, field registry
2. `app/collections/*.js` — each schema registers itself
3. `app/collections-init.js` — validates + builds `COLLECTIONS`
4. `app/helpers.js` — API layer, utilities, toast system
5. `app/components/*.js` — UI components (dependency order matters)
6. `app/App.js` — SPA router

---

## PROJECT STRUCTURE (current)

```
admin/
  index.html              ← SPA entry point (single HTML file for the admin)
  login.html              ← Login page
  app/
    App.js                ← SPA router
    collections.js        ← Core: API_BASE, buildCollection, field registry, site domains
    collections-init.js   ← Schema validation + final COLLECTIONS build
    helpers.js            ← API layer, utilities, toast system, formatting
    hashManager.js        ← Hash-based routing
    collections/          ← One file per collection schema (14 files)
    components/           ← One file per React component (10+ files)
  styles/
    styles.css
server/
  server.js               ← Express backend (JSON file storage, Cloudinary uploads)
  data/                   ← JSON data files per site
docs/
  project-guidelines.md   ← Stack, auth model, image conventions, field type reference
  railway.md              ← Deployment guide (Railway + env vars)
  architecture.md         ← Collection flow diagram
  ai/best-practices.md
```

**NO MORE MONOLITHIC FILES. NO MORE LEGACY HTML PAGES PER COLLECTION.**

---

## Documentation

- `docs/project-guidelines.md` — full stack details, auth model, image sizing conventions, field types
- `docs/railway.md` — Railway deployment, env vars, JSON storage caveat
- `admin/docs/fields.md` — field types quick guide

Do not store secrets in documentation or code. Use `.env` for local, Railway dashboard for cloud.

---

## Local Startup

```bash
cd server
npm install   # one-time
npm start     # production
npm run dev   # watch mode (nodemon)
```

Server runs on port `3001`. Admin at `/admin/index.html`, health check at `/api/health`.
