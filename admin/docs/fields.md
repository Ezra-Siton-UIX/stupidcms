# StupidCMS Field Schema - Quick Guide

This file explains how to add and manage fields in the CMS using the schema source of truth.

## Where to edit

Each collection schema lives in its own file under:
- `admin/app/collections/<collection_name>.js`

Core setup (build helpers, field registry, site domains):
- `admin/app/collections.js`

Schema validation + final build:
- `admin/app/collections-init.js`

Per-site domain mapping:
- `window.SITE_DOMAINS` in `admin/app/collections.js`

Runtime objects (auto-built, do not edit directly):
- `window.COLLECTION_SCHEMAS` — populated by individual schema files
- `window.COLLECTIONS` — built by `collections-init.js`

## Source of truth model

Each collection schema file (e.g. `admin/app/collections/posts.js`) includes:
- `primary`: the main field (title/name/question)
- `slugPrefix`: slug base path
- `extraFields`: all additional fields for that collection

Common fields are auto-generated for every collection:
- Primary field (required)
- `slug` field (required, autoFrom primary)

This means you never repeat name/title + slug manually in every collection.
Domain is also centralized (developer-controlled), so clients cannot break site links.

## How to add a new collection

1. Create `admin/app/collections/my_collection.js` with:
   ```js
   window.COLLECTION_SCHEMAS.my_collection = { key: 'my_collection', ... };
   ```
2. Add `await load('app/collections/my_collection.js?v=' + build);` to the boot loader in `admin/index.html` (before `collections-init.js`)
3. Add matching server data file if needed

## All field types (current)

Defined in `FIELD_TYPE_REGISTRY` in `admin/app/collections.js`.
Rendered by `admin/app/components/FormFields.js`.

### Core fields (auto-generated per collection)
- `title` — Primary text field (large, bold). One per collection. Props: `placeholder`.
- `slug` — URL-safe identifier. Auto-generated from title. Props: `prefix`, `autoFrom`, `disabled`, `disabledNote`.

### Text fields
- `text` — Single-line input. Props: `placeholder`, `maxLength`, `half`.
- `textarea` — Multi-line plain text. Props: `placeholder`, `maxLength`, `rows`, `half`.
- `email` — Email input with validation. Props: `placeholder`, `half`.
- `phone` — Phone input. Props: `placeholder`, `half`.
- `number` — Number input. Props: `placeholder`, `min`, `max`, `step`, `half`.
- `prefixed` — Text with visible prefix. Props: `prefix`, `placeholder`, `half`.

### Selection fields
- `reference` — Links to another collection. Props: `sourceCollection` (required), `labelKey`, `mirrorKey`, `placeholder`, `half`.
- `select` — Dropdown from fixed options. Props: `options` (required), `placeholder`, `half`.
- `checkbox` — Boolean toggle. Props: `checkboxLabel`.
- `radio` — Radio group. Props: `options` (required).

### Media fields
- `image` — Cloudinary upload with drag-drop. Props: `previewMode`, `imageSize`.
- `video` — Video embed URL. Props: `placeholder`.

### Rich text
- `richtext` — Quill editor. Props: `placeholder`, `toolbar` (`full` or `minimal`).

### Other
- `date` — Date picker. Props: `half`.
- `link` / `url` — URL input with validation. Props: `placeholder`, `half`.
- `color` — Color picker. Props: `placeholder`, `half`.

## Add a regular text field

Example inside `extraFields`:

```js
{ key: 'author', label: 'Author', type: 'text', placeholder: 'Bobby' }
```

## Add a required rich text field

```js
{ key: 'content', label: 'Content', type: 'richtext', required: true, toolbar: 'full' }
```

## Add a prefixed field

```js
{ key: 'linkedin', label: 'LinkedIn', type: 'prefixed', prefix: 'linkedin.com/in/' }
```

## Add two side-by-side fields

```js
{ key: 'role', label: 'Role', type: 'text', half: true },
{ key: 'company', label: 'Company', type: 'text', half: true }
```

## Example: adding a new field to Posts

In `admin/app/collections/posts.js`, find the `extraFields` array and add:

```js
{ key: 'reading_time', label: 'Reading Time', type: 'text', placeholder: '5 min' }
```

Save and reload admin.

## Adding new field types

To add a new field type:
1. Add the type to `FIELD_TYPE_REGISTRY` in `admin/app/collections.js`
2. Add a `case` block in `renderField` in `admin/app/components/FormFields.js`
3. Use the same schema-driven approach as existing types
