require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ╔═══════════════════════════════════════════════════════════╗
// ║  StupidCMS — JSON API Server                             ║
// ╠═══════════════════════════════════════════════════════════╣
// ║  Route Map:                                              ║
// ║                                                          ║
// ║  AUTH                                                    ║
// ║    POST   /api/login                                     ║
// ║    GET    /api/health                                    ║
// ║    GET    /api/meta          (self-documenting contract)  ║
// ║                                                          ║
// ║  PUBLIC (no token)                                       ║
// ║    GET    /api/public/:site/:collection                  ║
// ║    GET    /api/public/:site/posts/by-author/:authorId    ║
// ║    GET    /api/public/:site/posts/by-category/:catId     ║
// ║    GET    /api/public/:site/:collection/by-category/:id  ║
// ║                                                          ║
// ║  ADMIN CRUD (token required)                             ║
// ║    GET    /api/:site/:collection                         ║
// ║    GET    /api/:site/:collection/:id                     ║
// ║    GET    /api/:site/:collection/by-category/:catId      ║
// ║    POST   /api/:site/upload           (Cloudinary)       ║
// ║    POST   /api/:site/:collection      (create)           ║
// ║    PUT    /api/:site/:collection/:id  (update)           ║
// ║    DELETE /api/:site/:collection/:id  (delete)           ║
// ║                                                          ║
// ║  Data: server/data/site_*/<collection>.json              ║
// ╚═══════════════════════════════════════════════════════════╝

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
const SERVER_BUILD = 'stupidcms-admin-2026-03-24';

// ── Cloudinary ───────────────────────────────────────────
if (process.env.CLOUDINARY_URL) {
  // Support full URL style: cloudinary://<api_key>:<api_secret>@<cloud_name>
  cloudinary.config(process.env.CLOUDINARY_URL);
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } });

// ── Helpers: JSON read/write ─────────────────────────────
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Collection path mapping (key → file path) ───────────
const COLLECTION_PATHS = {
  posts: ['blog', 'posts.json'],
  blog_authors: ['blog', 'authors.json'],
  blog_categories: ['blog', 'categories.json'],
  media: ['media', 'media.json'],
  media_publishers: ['media', 'publishers.json'],
  services: ['services', 'services.json'],
  services_categories: ['services', 'categories.json'],
  team: ['team', 'team.json'],
  team_categories: ['team', 'categories.json'],
  faq: ['faq', 'faq.json'],
  faq_categories: ['faq', 'categories.json'],
  portfolio: ['portfolio', 'portfolio.json'],
  portfolio_categories: ['portfolio', 'categories.json'],
  legal: ['legal.json'],
};

// ── Legacy fallback paths (pre-subfolder structure) ──────
const LEGACY_COLLECTION_PATHS = {
  media: ['media.json'],
  media_publishers: ['media_publishers.json'],
  services: ['services.json'],
  services_categories: ['services_categories.json'],
  team: ['team.json'],
  team_categories: ['team_categories.json'],
  faq: ['faq.json'],
  faq_categories: ['faq_categories.json'],
  portfolio: ['portfolio.json'],
  portfolio_categories: ['portfolio_categories.json'],
};

// ── Path resolver: site + collection → absolute file path
function collectionFile(site, collection) {
  const relativePath = COLLECTION_PATHS[collection];
  if (!relativePath) return null;
  const safe = site.replace(/[^a-zA-Z0-9_-]/g, '');
  const siteDir = path.join(DATA_DIR, safe);
  if (!fs.existsSync(siteDir)) return null;
  const preferredPath = path.join(siteDir, ...relativePath);
  if (fs.existsSync(preferredPath)) return preferredPath;

  const legacyPath = LEGACY_COLLECTION_PATHS[collection];
  if (legacyPath) {
    const legacyFile = path.join(siteDir, ...legacyPath);
    if (fs.existsSync(legacyFile)) return legacyFile;
  }

  return preferredPath;
}

// ── Cloudinary upload folder mapping ─────────────────────
function getUploadFolder(site, requestedCollection) {
  const uploadFolders = {
    posts: 'blog/posts',
    blog_authors: 'blog/authors',
    media: 'media',
    media_publishers: 'media/publishers',
    services: 'services',
    team: 'team',
    faq: 'faq',
    portfolio: 'portfolio',
  };

  if (requestedCollection && uploadFolders[requestedCollection]) {
    return 'stupidcms/' + site + '/' + uploadFolders[requestedCollection];
  }
  return 'stupidcms/' + site;
}

// ── Collection readers + filters ─────────────────────────
function readCollection(site, collection) {
  const file = collectionFile(site, collection);
  if (!file) return null;
  return readJSON(file);
}

function filterPostsByField(site, field, value) {
  const posts = readCollection(site, 'posts');
  if (!posts) return null;
  return posts.filter(post => post[field] === value);
}

function filterCollectionByField(site, collection, field, value) {
  const items = readCollection(site, collection);
  if (!items) return null;
  return items.filter(item => item[field] === value);
}

// ── Users + JWT (hardcoded for now) ──────────────────────
const USERS = {
  'bobby': { site_id: 'site_bobby', password: 'password' },
};

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// ── Auth middleware (JWT verify + site_id check) ─────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── POST /api/login ──────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, site_id: user.site_id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username, site_id: user.site_id });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    build: SERVER_BUILD,
    port: String(process.env.PORT || 3000),
    supportsUploads: true,
    supportsBlogRelations: true,
  });
});

// ── GET /api/meta — self-documenting API contract ────────
app.get('/api/meta', (req, res) => {
  const sites = [...new Set(Object.values(USERS).map(u => u.site_id))];
  const firstSite = sites[0] || ':site';
  const base = req.protocol + '://' + req.get('host');

  res.json({
    name: 'StupidCMS API',
    build: SERVER_BUILD,
    sites: sites,
    collections: Object.keys(COLLECTION_PATHS),
    auth: {
      login: 'POST /api/login',
      body: { username: 'string', password: 'string' },
      response: 'Returns { token, username, site_id }',
      scheme: 'Bearer JWT — send as Authorization: Bearer <token>',
    },
    routes: {
      public: [
        { method: 'GET', path: '/api/public/:site/:collection', description: 'All items in a collection' },
        { method: 'GET', path: '/api/public/:site/:collection/by-category/:categoryId', description: 'Items filtered by category' },
        { method: 'GET', path: '/api/public/:site/posts/by-author/:authorId', description: 'Posts filtered by author' },
        { method: 'GET', path: '/api/public/:site/posts/by-category/:categoryId', description: 'Posts filtered by category' },
      ],
      admin: [
        { method: 'GET', path: '/api/:site/:collection', description: 'All items (auth required)' },
        { method: 'GET', path: '/api/:site/:collection/:id', description: 'Single item by ID' },
        { method: 'GET', path: '/api/:site/:collection/by-category/:categoryId', description: 'Filter by category' },
        { method: 'GET', path: '/api/:site/posts/by-author/:authorId', description: 'Posts by author' },
        { method: 'POST', path: '/api/:site/:collection', description: 'Create new item' },
        { method: 'PUT', path: '/api/:site/:collection/:id', description: 'Update item' },
        { method: 'DELETE', path: '/api/:site/:collection/:id', description: 'Delete item' },
        { method: 'POST', path: '/api/:site/upload', description: 'Upload image (multipart, field: file)' },
      ],
    },
    examples: {
      health: base + '/api/health',
      meta: base + '/api/meta',
      allPosts: base + '/api/public/' + firstSite + '/posts',
      allTeam: base + '/api/public/' + firstSite + '/team',
      allFaq: base + '/api/public/' + firstSite + '/faq',
      teamCategories: base + '/api/public/' + firstSite + '/team_categories',
      postsByCategory: base + '/api/public/' + firstSite + '/posts/by-category/:categoryId',
      postsByAuthor: base + '/api/public/' + firstSite + '/posts/by-author/:authorId',
    },
  });
});

// ══════════════════════════════════════════════════════════
// PUBLIC ROUTES (no token)
// ══════════════════════════════════════════════════════════

// ── PUBLIC: GET /api/public/:site/:collection ─────────────
app.get('/api/public/:site/:collection', (req, res) => {
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(readJSON(file));
});

app.get('/api/public/:site/posts/by-author/:authorId', (req, res) => {
  const posts = filterPostsByField(req.params.site, 'author_id', req.params.authorId);
  if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(posts);
});

app.get('/api/public/:site/posts/by-category/:categoryId', (req, res) => {
  const posts = filterPostsByField(req.params.site, 'category_id', req.params.categoryId);
  if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(posts);
});

app.get('/api/public/:site/:collection/by-category/:categoryId', (req, res) => {
  const collection = req.params.collection;
  if (collection === 'posts') {
    const posts = filterPostsByField(req.params.site, 'category_id', req.params.categoryId);
    if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
    return res.json(posts);
  }
  const items = filterCollectionByField(req.params.site, collection, 'category_id', req.params.categoryId);
  if (!items) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(items);
});

// ══════════════════════════════════════════════════════════
// ADMIN ROUTES (token required)
// ══════════════════════════════════════════════════════════

// ── GET /api/:site/:collection ────────────────────────────
app.get('/api/:site/:collection', authMiddleware, (req, res) => {
  // Verify user's token site_id matches requested site
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(readJSON(file));
});

app.get('/api/:site/posts/by-author/:authorId', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const posts = filterPostsByField(req.params.site, 'author_id', req.params.authorId);
  if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(posts);
});

app.get('/api/:site/posts/by-category/:categoryId', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const posts = filterPostsByField(req.params.site, 'category_id', req.params.categoryId);
  if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(posts);
});

app.get('/api/:site/:collection/by-category/:categoryId', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const collection = req.params.collection;
  if (collection === 'posts') {
    const posts = filterPostsByField(req.params.site, 'category_id', req.params.categoryId);
    if (!posts) return res.status(400).json({ error: 'Invalid site or collection' });
    return res.json(posts);
  }
  const items = filterCollectionByField(req.params.site, collection, 'category_id', req.params.categoryId);
  if (!items) return res.status(400).json({ error: 'Invalid site or collection' });
  res.json(items);
});

// ── GET /api/:site/:collection/:id ───────────────────────
app.get('/api/:site/:collection/:id', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  const items = readJSON(file);
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// ── POST /api/:site/upload (Cloudinary) ──────────────────
app.post('/api/:site/upload', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 2MB.' });
    }
    console.error('[upload] Multer parsing failed:', err);
    return res.status(400).json({ error: 'Upload parsing failed', detail: err.message || 'Unknown multipart error' });
  });
}, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const site = req.params.site.replace(/[^a-zA-Z0-9_-]/g, '');
  const requestedCollection = (req.body.collection || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const folder = getUploadFolder(site, requestedCollection);

  const stream = cloudinary.uploader.upload_stream(
    { folder, resource_type: 'image' },
    (err, result) => {
      if (err) {
        console.error('[upload] Cloudinary upload failed:', err);
        return res.status(500).json({ error: 'Upload failed', detail: err.message || 'Cloudinary error' });
      }
      const optimizedUrl = cloudinary.url(result.public_id, {
        secure: true,
        fetch_format: 'auto',
        quality: 'auto:good',
      });
      res.json({
        url: optimizedUrl,
        original_url: result.secure_url,
        public_id: result.public_id,
        folder,
      });
    }
  );

  stream.end(req.file.buffer);
});

// ── POST /api/:site/:collection (create item) ───────────
app.post('/api/:site/:collection', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  const items = readJSON(file);
  const item = { ...req.body, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  items.push(item);
  writeJSON(file, items);
  res.status(201).json(item);
});

// ── PUT /api/:site/:collection/:id (update item) ────────
app.put('/api/:site/:collection/:id', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  const items = readJSON(file);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id, updated_at: new Date().toISOString() };
  writeJSON(file, items);
  res.json(items[idx]);
});

// ── DELETE /api/:site/:collection/:id (remove item) ─────
app.delete('/api/:site/:collection/:id', authMiddleware, (req, res) => {
  if (req.user.site_id !== req.params.site) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const file = collectionFile(req.params.site, req.params.collection);
  if (!file) return res.status(400).json({ error: 'Invalid site or collection' });
  const items = readJSON(file);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = items.splice(idx, 1)[0];
  writeJSON(file, items);
  res.json(deleted);
});

// ══════════════════════════════════════════════════════════
// STATIC FILES + SERVER START
// ══════════════════════════════════════════════════════════

// ── Serve static files ───────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..')));
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const baseUrl = 'http://localhost:' + PORT;
  console.log('StupidCMS API running on port ' + PORT);
  console.log('');
  console.log('Local URLs');
  console.log('  Admin Home: ' + baseUrl + '/admin/index.html');
  console.log('  API Health: ' + baseUrl + '/api/health');
});
