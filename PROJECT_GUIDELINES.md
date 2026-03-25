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
- The full live model is schema-driven per collection and defined in `admin/app/collections.js`.

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
- Editor integration logic is in `admin/app/components.js` under `window.QuillEditor`.

## Schema Field Type Reference
All field types available for collection schemas. Defined in `admin/app/collections.js`, rendered in `admin/app/components.js`.

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
- `video` — Video URL input with embed preview for YouTube/Vimeo.
- `color` — Color picker with hex text input.

### Content fields
- `richtext` — Quill-based rich text editor. Property: `toolbar` (`full` or `minimal`).
- `number` — Numeric input. Properties: `min`, `max`, `step`.
- `date` — Native date picker (ISO format).

### Common field properties
- `key` — Field identifier (used in data storage).
- `label` — Display label.
- `required` — Boolean, triggers validation.
- `placeholder` — Input placeholder text.
- `hint` — Help text shown below the field.
- `half` — Boolean, renders at half-width (two fields per row).
- `defaultValue` — Pre-filled value for new items.
- `disabled` — Boolean, makes field non-editable.
- `disabledNote` — Explanation text when disabled.

## SEO and Sitemap
- SEO remains part of the system scope at the structured-output level, not as a heavy marketing suite.
- The project should support predictable SEO-facing outputs such as clean slugs, stable public URLs, and sitemap generation.
- Sitemap behavior should stay simple and deterministic, based on the published public collections/routes we control.
- SEO work should favor repeatable patterns over per-page manual complexity.

## Important Constraints
- No versioning/staging/workflows
- No role-based access control (simple: owner or nothing)
- No publishing workflows
- Direct save to database on edit

## Content Grouping Rules
- Each content type should have one primary list and optional helper lists.
- The primary list is the main editable business content for that type.
- Helper lists are supporting dictionaries/relations and are not the main business list.
- Example:
	- Blog (primary list)
	- Authors (helper list)
	- Categories (helper list)
- The same structure should be used consistently for other content groups (for example Media + Publishers, FAQ + Categories, Team + Categories).
- Navigation/count semantics should treat the primary list as the main indicator of content volume, while helper lists remain supporting data structures.

## Terminology Alignment (Webflow)
- User-facing terminology should follow Webflow mental model when communicating features and tasks.
- `Collection` = a list/data table (the main container of records).
- `Collection Item` = a single record inside that collection.
- In implementation terms, a collection maps to one JSON list (or equivalent storage table), and a collection item maps to one object/row in that list.
- When both terms are used together in discussions or docs, prefer: "Collection (table)" and "Collection Item (single row/object)" for clarity.

### Filter Collection List (Future Logic)
- Support `Filter Collection List` as a first-class list behavior in admin and API planning.
- Meaning: filter a collection list by a field value without changing source data.
- Primary first use-case: filter by category (already supported in API routes for relevant collections).
- Rule: keep filter semantics consistent across collections that have helper relations (for example categories).
- UX expectation: filtering narrows visible items only; it does not edit, delete, or move collection items.
- Implementation expectation: prefer deterministic query params/route patterns and stable field keys.

### Data Folder Layout (JSON)
- Keep each content domain in its own folder inside each site data folder (for example `server/data/site_bobby/team/`).
- Recommended naming pattern:
	- primary list: `<domain>/<domain>.json`
	- helper list: `<domain>/categories.json` (or another helper name like `publishers.json`)
- Existing examples:
	- `team/team.json` + `team/categories.json`
	- `faq/faq.json` + `faq/categories.json`
	- `media/media.json` + `media/publishers.json`

### Adding a New Collection
1. Create the JSON file in the correct domain folder under `server/data/<site_id>/`.
2. If needed, create helper list JSON files in the same domain folder.
3. Add/update the collection path mapping in `server/server.js` under `COLLECTION_PATHS`.
4. Keep collection keys stable (`<domain>` and `<domain>_categories` style) so API routes and admin configs stay predictable.

## Deployment Plan
1. Current mode: local JSON files act as the active content store
2. Admin and public rendering should work directly against the local JSON-backed API
3. Keep data access patterns simple so the storage layer can later be swapped if needed
4. Future option: evaluate an external database/data source only if it provides real operational value, for example MongoDB; any such integration will be implementation-specific to that system

## Beta Workflow
- Before production launch, use a dedicated `beta` folder/environment as the realistic integration surface for lists and content flows.
- In practice, this `beta` layer should behave like the product-facing version of the system before go-live, so testing there should reflect how the real product will communicate and behave.

## Key Decision: What NOT to Build
- Multi-user collaboration features
- Content approval workflows
- SEO optimization tools
- Advanced media management
- CMS for other content types (FAQ, Team, Legal) - those stay in Git + AI

## Recent Admin UX Safety Additions (March 2026)
- Unsaved changes guard on editor route changes (with confirmation before leave)
- Logout confirmation (cancel must never log user out)
- Validation UX improvements (field-level red borders + top validation summary)
- Duplicate item action (available in list and editor)
- Minimal local history for editor (last 3 saved versions, with restore)
- Secondary bottom action bar in editor (`Cancel` / `Save`) for long forms
- Mobile sticky bottom action bar to reduce accidental navigation while editing
- Developer debug view for each list/editor, showing schema and current JSON/data for faster troubleshooting

### Scope Guardrails
- Keep features reversible and simple for non-technical clients
- Prefer lightweight safeguards over enterprise workflow complexity
- Avoid heavy role systems/staging unless real client usage proves the need

## UI Implementation Note
- Prefer `UK classes` and `apply` for the main system skeleton/components, instead of overly atomic styling on every element individually (for example, prefer shared patterns like `uk-label` where appropriate).

## Expected Cost Range
- Database (provider not fixed yet): expected free tier for early stage.
- Hosting/runtime: expected ~$5-10/month (depending on provider/plan).
- Cloudinary Images: free tier is expected to be sufficient in early stage.
- **Expected total (early stage): ~$5-10/month**
