# stupidCMS - Project Guidelines

## Project Overview
- Building a simple blog CMS for ~10 portfolio websites
- Each site has its own blog + content managed via Git/AI
- User-focused: clients only edit blog posts
- Admin panel: minimal, just for blog management

## Tech Stack
- Stack decision is intentionally open at this stage; final implementation choices are deferred to project execution.
- Required capability: simple username/password authentication for admin access.
- Required capability: API + data model that can support the defined content collections and editor workflows.
- Required capability: image upload flow must remain compatible with Cloudinary for CMS-managed assets.
- Hosting and database vendors are not locked yet and should be chosen by operational convenience when implementing the real site.

## Architecture Philosophy
- **LEAN**: Only what's needed, no enterprise overhead
- **SIMPLE**: A small set of predefined content patterns, not an open-ended page builder
- **SCALABLE**: Easy to deploy to multiple clients
- **NO STRAPI**: Avoid expensive CMSs - cost per user is crucial
- **FUTURE-FLEXIBLE**: Keep the architecture open to a future external CMS/admin integration if it becomes worth it, without committing to one now

## Data Model (Conceptual Example)
```
Users: username, password_hash, site_id
Sites: name, owner_id
Posts: title, content, image_url, author, date, site_id
```
- This block is a simplified conceptual example.
- The full live model is schema-driven per collection. Each schema lives in its own file under `admin/app/collections/`.

## Authentication Model
- Each user login → JWT token
- Users see ONLY their site's posts
- No licensing per user, just database records

## Workflow
1. User logs in with username/password
2. Sees list of their blog posts
3. Can create/edit/delete posts
4. Images upload to Cloudinary
5. Everything else (pages, team, legal) → Git workflow with AI

## Local Startup
- Working directory for backend commands: `stupidCMS/server`.
- One-time setup (from `stupidCMS/server`): `npm install`.
- Daily startup command (from `stupidCMS/server`): `npm start`.
- Development watch mode (from `stupidCMS/server`): `npm run dev`.
- If your terminal is elsewhere, run: `cd server` and then the command.
- On startup, the server terminal prints both URLs:
	- Admin home: `/admin/index.html`
	- API health: `/api/health`

## Media Rules
- Cloudinary is the single external source of truth for uploaded CMS images.
- Image fields and rich text inline images should always upload through the backend upload flow and never bypass Cloudinary.
- Cloudinary credentials/tokens are operationally important and should be treated as environment-level secrets.
- Debugging image issues should always verify: correct backend, successful Cloudinary response, and returned Cloudinary URL.

## Admin Image Display Modes
- Image fields in the admin support visual sizing modes: `cover`, `medium`, and `small`.
- The sizing mode affects editor preview/dropzone scale only (it does not modify the original Cloudinary file).
- Rule: when adding a logo field, set its image display mode to `small` by default.
- Preview mode guidance:
	- Use `previewMode: avatar` for circular/person/logo-style image previews.
	- Use `previewMode: cover` + `imageSize: cover` for regular images that should appear full-width in the editor (with container margins).
- Recommended defaults by content type:
	- `small`: logos and compact branding assets (for example media publishers).
	- `medium`: profile/team images and similar person-focused visuals.
	- `cover`: cover/main images (for example blog/media/service/portfolio main images).
- Keep sizing choices consistent per template so editors get predictable UI behavior across sites.

## Rich Text Editor Source
- The selected rich text editor is Quill.
- Quill is loaded as an external dependency (CDN), not from a local project folder.
- CDN integration points are in `admin/index.html` (Quill CSS + JS includes).
- Editor integration logic is in `admin/app/components/QuillEditor.js` (`window.QuillEditor`).

## Schema Field Type Reference
All field types available for collection schemas. Defined in `admin/app/collections.js`, rendered in `admin/app/components/FormFields.js`.

### Core fields (auto-generated)
- `title` — Primary text field (large, bold). One per collection.
- `slug` — URL-safe identifier. Auto-generated from title. Disabled for list-only collections.

### Text fields
- `text` — Single-line text input. Supports `maxLength` (with character counter), `half`.
- `textarea` — Multi-line plain text. Supports `rows` (default 4), `maxLength`.
- `email` — Email input with format validation. Always LTR.
- `phone` — Phone input (tel). Always LTR.
- `link` / `url` — URL input with auto-normalization and validation. Shows "Open link" when valid.

### Selection fields
- `reference` — Links to another collection. Properties: `sourceCollection`, `labelKey`, `mirrorKey`, `placeholder`.
- `select` — Predefined options dropdown (no linked collection). Property: `options` (array of `{ label, value }` or plain strings).
- `checkbox` — Boolean toggle. Property: `checkboxLabel`.
- `radio` — Radio group. Property: `options` (array of `{ label, value }`).

### Media fields
- `image` — Cloudinary image upload with drag-drop. Properties: `previewMode` (`avatar` or `cover`), `imageSize` (`cover`, `medium`, `small`).