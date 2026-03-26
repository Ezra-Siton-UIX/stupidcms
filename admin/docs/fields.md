# StupidCMS Field Schema - Quick Guide

This file explains how to add and manage fields in the CMS using the schema source of truth.

## Where to edit

Edit collection schemas in:
- `admin/app/collections.js`

Edit per-site domain mapping in the same file:
- `window.SITE_DOMAINS`

Main object:
- `window.COLLECTION_SCHEMAS`

Generated runtime config:
- `window.COLLECTIONS` (auto-built from schemas)

## Source of truth model

Each collection schema includes:
- `primary`: the main field (title/name/question)
- `slugPrefix`: slug base path
- `extraFields`: all additional fields for that collection

Common fields are auto-generated for every collection:
- Primary field (required)
- `slug` field (required, autoFrom primary)

This means you no longer repeat name/title + slug manually in every collection.
Domain is also centralized there (developer-controlled), so clients cannot break site links.

## Basic field types (currently supported)

- `title`
- `text`
- `slug`
- `prefixed`
- `image`
- `richtext`

Useful flags:
- `required: true` -> validates on save and shows required marker in editor
- `half: true` -> two fields can share one row

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

In `COLLECTION_SCHEMAS.posts.extraFields`, add:

```js
{ key: 'reading_time', label: 'Reading Time', type: 'text', placeholder: '5 min' }
```

That is it. Save and reload admin.

## About future field types

Common future needs:
- Number field
- Radio/select field
- Checkbox/toggle field

When needed, extend `renderField` in `admin/app/components/FormFields.js` with new `case` blocks and use the same schema approach.

For now, keep it simple with existing types.
