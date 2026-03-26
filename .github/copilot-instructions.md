# IMPORTANT: This project does NOT use TypeScript — only plain JavaScript (including JSX). Do NOT add TS/TSX files or TypeScript syntax.

# copilot-instructions.md

This file provides persistent instructions for GitHub Copilot and other AI agents working in this repository.

## Documentation Structure
- All project documentation is now located in the `docs/` folder.
- Main guides:
  - `docs/project-guidelines.md` — Project architecture, tech stack, and workflow
  - `docs/railway.md` — Railway deployment and environment setup
- Reference all documentation using the `docs/` path.

## Agent Guidance
- Always look for documentation in `docs/`.
- If you need project conventions, deployment, or architecture info, start with `docs/project-guidelines.md`.
- For Railway/cloud deployment, see `docs/railway.md`.
- If you update documentation, update all internal references accordingly.
- If you add new guides, place them in `docs/` and update this file if needed.

## Special Notes
- Do not store secrets in documentation or code. Use `.env` for local secrets, Railway dashboard for cloud.
- If you are unsure about a convention, check `docs/project-guidelines.md` first.

# COMPONENT ORGANIZATION — URGENT

**All shared React components must be split into separate files under `admin/app/components/`!**

- Do NOT keep 1000+ lines in a single `components.js` file.
- Each component (e.g. ToastContainer, Layout, AlertBox) must be in its own file: `admin/app/components/ToastContainer.js`, etc.
- The main `components/index.js` should export all components to `window` for global access (for legacy HTML usage).
- If you find non-component logic (helpers, constants, etc.), move them to a separate `utils.js` or similar file.
- This is **MANDATORY** for maintainability, debugging, and code clarity.
- Update all HTML/JS to load only the needed component files, or use the index.js for full bundle.

**Example structure:**

admin/app/components/
  ToastContainer.js
  Layout.js
  AlertBox.js
  index.js

**index.js example:**
```js
import ToastContainer from './ToastContainer.js';
import Layout from './Layout.js';
import AlertBox from './AlertBox.js';
window.ToastContainer = ToastContainer;
window.Layout = Layout;
window.AlertBox = AlertBox;
```

**NO MORE MONOLITHIC FILES!**

(If you see this, and the code is not split, you must refactor immediately.)
