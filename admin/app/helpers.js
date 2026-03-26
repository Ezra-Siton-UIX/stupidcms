// helpers.js — shared utility functions, API layer, constants
// Components live in admin/app/components/*.js

const { useState, useEffect, useRef, Fragment } = React;

function getStorageValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function clearAuthStorage() {
  ['token', 'user', 'site_id', 'api_base'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

const EXPECTED_BACKEND_BUILD = 'stupidcms-admin-2026-03-24';
const MAX_REVISIONS = 10;
const INITIAL_VISIBLE_REVISIONS = 4;
const LOAD_MORE_REVISIONS_STEP = 6;

window.__BACKEND_STATUS = window.__BACKEND_STATUS || {
  status: 'checking',
  base: window.API_BASE || '',
  message: 'Checking backend connection...',
  supportsUploads: false,
};

function setApiBaseEverywhere(nextBase) {
  localStorage.setItem('api_base', nextBase);
  sessionStorage.setItem('api_base', nextBase);
}

function isLocalHostName(hostname) {
  return /^(localhost|127\.0\.0\.1)$/i.test(hostname || '');
}

function getLocalAdminUrl(base) {
  return base.replace(/\/$/, '') + '/admin/';
}

function getSuggestedLocalBases(currentBase) {
  const candidates = [];
  const currentOrigin = window.location.origin;

  [currentOrigin, currentBase, 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'].forEach(candidate => {
    if (!candidate || candidates.includes(candidate)) return;
    candidates.push(candidate);
  });

  return candidates;
}

function getPortFromBase(base) {
  try {
    return new URL(base).port || (new URL(base).protocol === 'https:' ? '443' : '80');
  } catch (e) {
    return '';
  }
}

async function probeBackend(base) {
  try {
    const response = await fetch(base + '/api/health', { cache: 'no-store' });
    const { payload, rawText } = await readApiPayload(response);
    const suggestedAdminUrl = getLocalAdminUrl(base);

    if (!response.ok || !payload || !payload.ok) {
      return {
        status: 'mismatch',
        base,
        supportsUploads: false,
        message: 'Backend on ' + base + ' did not return a valid health response. For testing, try ' + suggestedAdminUrl,
        rawText,
      };
    }

    if (payload.build !== EXPECTED_BACKEND_BUILD || !payload.supportsUploads) {
      return {
        status: 'mismatch',
        base,
        supportsUploads: false,
        message: 'Backend on ' + base + ' is reachable, but it is not the expected build for this admin. For testing, try ' + suggestedAdminUrl,
        payload,
      };
    }

    return {
      status: 'ok',
      base,
      supportsUploads: true,
      message: 'Connected to backend on port ' + (payload.port || getPortFromBase(base)) + '.',
      payload,
    };
  } catch (e) {
    return {
      status: 'offline',
      base,
      supportsUploads: false,
      message: 'Cannot reach backend on ' + base + '.',
    };
  }
}

// Centralized alert utility Γאפ replace with professional dialog later
window.showAlert = function showAlert(message, type) {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type || 'error');
    return;
  }
  window.alert(message);
};

// Centralized confirm utility Γאפ replace with professional dialog later
window.showConfirm = function showConfirm(message) {
  return window.confirm(message);
};

// ΓפאΓפאΓפא Toast System ΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפאΓפא
(function initToastSystem() {
  let _toasts = [];
  let _listeners = [];

  function notify() {
    _listeners.forEach(fn => fn([..._toasts]));
  }

  function patchToast(id, patch) {
    _toasts = _toasts.map(t => (t.id === id ? { ...t, ...patch } : t));
    notify();
  }

  window.showToast = function showToast(message, type) {
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    _toasts = [{ id: id, message: message, type: type || 'info', phase: 'enter' }].concat(_toasts).slice(0, 5);
    notify();

    setTimeout(() => patchToast(id, { phase: 'idle' }), 40);
    setTimeout(() => patchToast(id, { phase: 'exit' }), 2650);
    setTimeout(() => {
      _toasts = _toasts.filter(t => t.id !== id);
      notify();
    }, 3200);
  };

  window.__toastSubscribe = function(fn) {
    _listeners.push(fn);
    fn([..._toasts]);
    return function() { _listeners = _listeners.filter(l => l !== fn); };
  };
})();

async function resolveBackendStatus() {
  const currentBase = window.API_BASE;
  const candidates = isLocalHostName(window.location.hostname)
    ? getSuggestedLocalBases(currentBase)
    : [currentBase];

  const results = [];
  for (const candidate of candidates) {
    results.push(await probeBackend(candidate));
  }

  const currentResult = results.find(result => result.base === currentBase) || results[0];
  const workingResult = results.find(result => result.status === 'ok');

  if (currentResult && currentResult.status === 'ok') {
    return currentResult;
  }

  if (workingResult) {
    return {
      status: 'wrong-base',
      base: currentBase,
      supportsUploads: false,
      suggestedBase: workingResult.base,
      message: 'Admin is connected to the wrong backend. For testing, open ' + getLocalAdminUrl(workingResult.base) + ' instead.',
    };
  }

  if (isLocalHostName(window.location.hostname)) {
    const suggestedPorts = candidates.map(candidate => getPortFromBase(candidate)).filter(Boolean).join(' or ');
    return {
      status: 'offline',
      base: currentBase,
      supportsUploads: false,
      message: 'No working backend was detected. For testing, try the admin on port ' + suggestedPorts + '.',
    };
  }

  return currentResult || {
    status: 'offline',
    base: currentBase,
    supportsUploads: false,
    message: 'No working backend was detected.',
  };
}
window.resolveBackendStatus = resolveBackendStatus;

function getVisibleNavGroups() {
  const grouped = {};

  Object.entries(COLLECTIONS)
    .map(([key, collection]) => ({ key, ...collection }))
    .filter(collection => collection.navVisible !== false)
    .sort((a, b) => {
      if ((a.navOrder || 0) !== (b.navOrder || 0)) return (a.navOrder || 0) - (b.navOrder || 0);
      return a.label.localeCompare(b.label);
    })
    .forEach(collection => {
      const groupKey = collection.navGroup || collection.key;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          key: groupKey,
          label: collection.navGroupLabel || collection.label,
          order: collection.navOrder || 0,
          collections: [],
        };
      }

      grouped[groupKey].collections.push(collection);
      grouped[groupKey].order = Math.min(grouped[groupKey].order, collection.navOrder || 0);
    });

  return Object.values(grouped)
    .map(group => {
      const collections = group.collections.sort((a, b) => {
        if (!!a.navPrimary !== !!b.navPrimary) return a.navPrimary ? -1 : 1;
        if ((a.navOrder || 0) !== (b.navOrder || 0)) return (a.navOrder || 0) - (b.navOrder || 0);
        return a.label.localeCompare(b.label);
      });
      const primaryCollection = collections.find(collection => collection.navPrimary) || collections[0];
      return {
        key: group.key,
        label: group.label,
        order: group.order,
        collections,
        primaryCollection: primaryCollection.key,
        route: '#/' + primaryCollection.key,
      };
    })
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
}

window.UI_ICON_MAP = window.UI_ICON_MAP || {
  blog: 'book',
  media: 'news',
  media_publishers: 'news',
  services: 'briefcase',
  services_categories: 'briefcase',
  team: 'person',
  faq: 'question',
  portfolio: 'layers',
  legal: 'document',
  developerDebug: 'code',
  sitemap: 'map',
  recycleBin: 'trash',
};

function getSiteId() { return getStorageValue('site_id') || 'site_bobby'; }
function getToken() { return getStorageValue('token'); }

function apiCall(method, path, body = null) {
  const token = getToken();
  if (!token) {
    window.location.href = '/admin/login.html';
    return Promise.reject('No token');
  }
  const opts = {
    method,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(API_BASE + '/api/' + getSiteId() + '/' + path, opts).then(async r => {
    if (r.status === 401 || r.status === 403) {
      clearAuthStorage();
      window.location.href = '/admin/login.html';
    }
    const payload = await r.json().catch(() => null);
    if (!r.ok) {
      const apiMessage = payload && (payload.detail || payload.error);
      throw new Error(apiMessage || ('Request failed (' + r.status + ')'));
    }
    return payload;
  });
}

function updateCollectionCount(collection, nextCount) {
  const counts = JSON.parse(localStorage.getItem('nav_counts') || '{}');
  counts[collection] = nextCount;
  localStorage.setItem('nav_counts', JSON.stringify(counts));
}

function incrementCollectionCount(collection, delta) {
  const counts = JSON.parse(localStorage.getItem('nav_counts') || '{}');
  counts[collection] = (counts[collection] || 0) + delta;
  localStorage.setItem('nav_counts', JSON.stringify(counts));
}

function getTrashStorageKey(collection) {
  return 'stupidcms_trash_' + getSiteId() + '_' + collection;
}

function readTrashItems(collection) {
  try {
    const raw = localStorage.getItem(getTrashStorageKey(collection));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeTrashItems(collection, entries) {
  localStorage.setItem(getTrashStorageKey(collection), JSON.stringify((entries || []).slice(0, 50)));
}

function pushTrashItem(collection, item, config) {
  const titleKey = config && config.list ? config.list.title : '';
  const titleValue = titleKey ? item[titleKey] : '';
  const entry = {
    trashId: 'trash_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    collection,
    deletedAt: new Date().toISOString(),
    title: String(titleValue || item.name || item.question || item.slug || item.id || 'Untitled'),
    item: JSON.parse(JSON.stringify(item)),
  };
  const next = [entry].concat(readTrashItems(collection));
  writeTrashItems(collection, next);
  return next;
}

function removeTrashItem(collection, trashId) {
  const next = readTrashItems(collection).filter(entry => entry.trashId !== trashId);
  writeTrashItems(collection, next);
  return next;
}

function buildDuplicatePayload(config, source) {
  const payload = {};
  config.fields.forEach(field => {
    payload[field.key] = source[field.key] != null ? source[field.key] : '';
  });

  const titleField = config.fields.find(field => field.type === 'title');
  if (titleField && payload[titleField.key]) {
    payload[titleField.key] = String(payload[titleField.key]) + ' (copy)';
  }

  const slugField = config.fields.find(field => field.type === 'slug' && !field.disabled);
  if (slugField && payload[slugField.key]) {
    const baseSlug = String(payload[slugField.key])
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = Date.now().toString(36).slice(-4);
    payload[slugField.key] = (baseSlug ? (baseSlug + '-copy-' + suffix) : ('copy-' + suffix));
  }

  return payload;
}

function getRevisionStorageKey(collection, itemId) {
  return 'stupidcms_revisions_' + getSiteId() + '_' + collection + '_' + itemId;
}

function readRevisions(collection, itemId) {
  if (!itemId) return [];
  try {
    const raw = localStorage.getItem(getRevisionStorageKey(collection, itemId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeRevisions(collection, itemId, entries) {
  if (!itemId) return;
  localStorage.setItem(getRevisionStorageKey(collection, itemId), JSON.stringify(entries.slice(0, MAX_REVISIONS)));
}

function pushRevision(collection, itemId, snapshot, nextSnapshot, fields) {
  if (!itemId || !snapshot) return [];
  const cleanSnapshot = JSON.parse(JSON.stringify(snapshot));
  delete cleanSnapshot.id;
  delete cleanSnapshot.site_id;
  delete cleanSnapshot.createdAt;
  delete cleanSnapshot.updatedAt;
  delete cleanSnapshot.created_at;
  delete cleanSnapshot.updated_at;

  const cleanNextSnapshot = nextSnapshot ? JSON.parse(JSON.stringify(nextSnapshot)) : null;
  if (cleanNextSnapshot) {
    delete cleanNextSnapshot.id;
    delete cleanNextSnapshot.site_id;
    delete cleanNextSnapshot.createdAt;
    delete cleanNextSnapshot.updatedAt;
    delete cleanNextSnapshot.created_at;
    delete cleanNextSnapshot.updated_at;
  }

  const candidateKeys = Array.isArray(fields) && fields.length
    ? fields.map(field => field.key)
    : Array.from(new Set(Object.keys(cleanSnapshot).concat(cleanNextSnapshot ? Object.keys(cleanNextSnapshot) : [])));

  const changedKeys = candidateKeys.filter(key => !areFieldValuesEqual(cleanSnapshot[key], cleanNextSnapshot ? cleanNextSnapshot[key] : undefined));
  const entry = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    data: cleanSnapshot,
    changedKeys,
  };
  const next = [entry].concat(readRevisions(collection, itemId)).slice(0, MAX_REVISIONS);
  writeRevisions(collection, itemId, next);
  return next;
}

function areFieldValuesEqual(left, right) {
  return JSON.stringify(left == null ? '' : left) === JSON.stringify(right == null ? '' : right);
}

async function readApiPayload(response) {
  const rawText = await response.text();
  if (!rawText) return { payload: null, rawText: '' };

  try {
    return { payload: JSON.parse(rawText), rawText };
  } catch (e) {
    return { payload: null, rawText };
  }
}

function buildUploadErrorMessage(response, payload, rawText) {
  const apiMessage = payload && (payload.detail || payload.error);
  if (apiMessage) {
    if (apiMessage === 'Invalid site or collection') {
      return 'Upload endpoint mismatch. This usually means an old backend instance is still running or the app is hitting the wrong port.';
    }
    return 'Upload failed (' + response.status + '): ' + apiMessage;
  }

  if (response.status === 404) {
    return 'Upload endpoint was not found. Check that the backend is running on ' + API_BASE + ' and restart it if needed.';
  }

  if (rawText && rawText.trim().startsWith('<')) {
    return 'Server returned HTML instead of JSON. This usually means the request hit the wrong server or a stale process.';
  }

  return 'Upload failed (' + response.status + ').';
}

window.api = {
  get: function (path) { return apiCall('GET', path); },
  post: function (path, body) { return apiCall('POST', path, body); },
  put: function (path, body) { return apiCall('PUT', path, body); },
  del: function (path) { return apiCall('DELETE', path); },
  upload: function (file, collection) {
    const token = getToken();
    if (!token) {
      window.location.href = '/admin/login.html';
      return Promise.reject('No token');
    }
    const fd = new FormData();
    fd.append('file', file);
    if (collection) fd.append('collection', collection);
    return fetch(API_BASE + '/api/' + getSiteId() + '/upload', { 
      method: 'POST', 
      headers: { 'Authorization': 'Bearer ' + token },
      body: fd 
    }).then(async r => {
      if (r.status === 401 || r.status === 403) {
        clearAuthStorage();
        window.location.href = '/admin/login.html';
      }
      const { payload, rawText } = await readApiPayload(r);
      if (!r.ok) {
        throw new Error(buildUploadErrorMessage(r, payload, rawText));
      }
      if (!payload) {
        throw new Error('Upload succeeded but server returned invalid JSON. Check backend logs.');
      }
      if (!payload.url) {
        throw new Error('Upload succeeded but no image URL returned');
      }
      console.log('%cΓרב∩╕ן Cloudinary upload OK', 'color:#22c55e;font-weight:bold', {
        url: payload.url,
        public_id: payload.public_id,
        folder: payload.folder,
        collection: collection || '(default)',
      });
      return payload;
    }).catch(error => {
      if (error && error.name === 'TypeError') {
        throw new Error('Cannot reach upload server at ' + API_BASE + '. Check that the correct backend is running.');
      }
      throw error;
    });
  },
};

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function formatSitemapLastMod(value) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function buildCollectionSitemapPreview(config, collection, rawSchema, items, domain) {
  const cleanDomain = trimTrailingSlash(domain);
  const slugField = config.fields.find(field => field.type === 'slug');
  const slugPrefix = slugField ? slugField.prefix : (rawSchema && rawSchema.slugPrefix) || '';
  const basePath = slugPrefix ? trimTrailingSlash(slugPrefix) : '';
  const sitemapPath = '/sitemaps/' + collection + '.xml';
  const sitemapUrl = cleanDomain ? cleanDomain + sitemapPath : sitemapPath;
  const canBuildPerItemUrls = !!(cleanDomain && slugPrefix);
  const buildEntryLabel = item => String(
    item.question ||
    item.title ||
    item.name ||
    item.username ||
    item.slug ||
    collection
  ).trim();

  const entries = [];
  const newestItemDate = items.reduce((latest, item) => {
    const candidate = item.updated_at || item.created_at || item.article_date || item.date || '';
    if (!candidate) return latest;
    if (!latest) return candidate;
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
  }, '');

  if (cleanDomain && config.hasSinglePage && basePath) {
    entries.push({
      loc: cleanDomain + basePath,
      lastmod: newestItemDate,
      label: config.label,
    });
  }

  if (canBuildPerItemUrls && config.hasSinglePage) {
    items.forEach(item => {
      const slug = String(item.slug || '').trim();
      if (!slug) return;
      entries.push({
        loc: cleanDomain + slugPrefix + slug,
        lastmod: item.updated_at || item.created_at || item.article_date || item.date || '',
        label: buildEntryLabel(item),
      });
    });
  }

  if (canBuildPerItemUrls && !config.hasSinglePage) {
    items.forEach(item => {
      const slug = String(item.slug || '').trim();
      if (!slug) return;
      entries.push({
        loc: cleanDomain + slugPrefix + slug,
        lastmod: item.updated_at || item.created_at || item.article_date || item.date || '',
        label: buildEntryLabel(item),
      });
    });
  }

  if (!entries.length && cleanDomain && basePath) {
    entries.push({
      loc: cleanDomain + basePath,
      lastmod: newestItemDate,
      label: config.label,
    });
  }

  const xmlBody = entries.length
    ? entries.map(entry => {
        const lastmod = formatSitemapLastMod(entry.lastmod);
        return [
          entry.label ? '  <!-- ' + escapeXml(entry.label) + ' -->' : null,
          '  <url>',
          '    <loc>' + escapeXml(entry.loc) + '</loc>',
          lastmod ? '    <lastmod>' + escapeXml(lastmod) + '</lastmod>' : null,
          '  </url>',
        ].filter(Boolean).join('\n');
      }).join('\n')
    : '  <!-- No public URLs inferred for this collection under the current sitemap rules. -->';

  return {
    sitemapUrl,
    entryCount: entries.length,
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      xmlBody,
      '</urlset>',
    ].join('\n'),
  };
}

function formatIsraelDateTime(value) {
  if (!value) return 'Not saved yet';

  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace(/\.0$/, '') + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + ' MB';
}

function normalizeLinkValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (/^(www\.|[\w-]+\.[a-z]{2,})/i.test(raw)) return 'https://' + raw;
  return raw;
}

function isValidLinkValue(value) {
  const normalized = normalizeLinkValue(value);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return /^https?:$/i.test(parsed.protocol);
  } catch (e) {
    return false;
  }
}

function getVideoEmbedUrl(url) {
  if (!url) return '';
  try {
    var parsed = new URL(url);
    // YouTube
    if (/youtube\.com$/i.test(parsed.hostname) || /www\.youtube\.com$/i.test(parsed.hostname)) {
      var v = parsed.searchParams.get('v');
      if (v) return 'https://www.youtube.com/embed/' + encodeURIComponent(v);
    }
    if (/youtu\.be$/i.test(parsed.hostname)) {
      var id = parsed.pathname.replace(/^\//, '');
      if (id) return 'https://www.youtube.com/embed/' + encodeURIComponent(id);
    }
    // Vimeo
    if (/vimeo\.com$/i.test(parsed.hostname)) {
      var match = parsed.pathname.match(/\/(\d+)/);
      if (match) return 'https://player.vimeo.com/video/' + match[1];
    }
  } catch (e) { /* ignore */ }
  return '';
}

function normalizeBooleanValue(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return value;
  }
  const raw = String(value == null ? '' : value).trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'y') return true;
  if (raw === 'false' || raw === '0' || raw === 'no' || raw === 'n') return false;
  return value;
}

function normalizeDataByFieldTypes(fields, source) {
  const next = { ...(source || {}) };
  (fields || []).forEach(field => {
    const isBooleanRadio = field.type === 'radio' && (field.options || []).some(opt => typeof opt.value === 'boolean');
    const isBooleanCheckbox = field.type === 'checkbox';
    if (isBooleanRadio || isBooleanCheckbox) {
      next[field.key] = normalizeBooleanValue(next[field.key]);
    }
  });
  return next;
}

async function replaceInlineContentImagesWithCloudinary(html, collection) {
  const sourceHtml = String(html || '');
  if (!sourceHtml || sourceHtml.indexOf('data:image/') === -1) return sourceHtml;

  const dataUrlPattern = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = sourceHtml.match(dataUrlPattern);
  if (!matches || !matches.length) return sourceHtml;

  const uniqueDataUrls = Array.from(new Set(matches));
  let nextHtml = sourceHtml;
  const MAX_INLINE_RICHTEXT_IMAGE_SIZE = 2 * 1024 * 1024;

  for (let i = 0; i < uniqueDataUrls.length; i++) {
    const dataUrl = uniqueDataUrls[i];
    let blob;
    try {
      const response = await fetch(dataUrl);
      blob = await response.blob();
    } catch (e) {
      throw new Error('Could not process one of the inline images. Please remove it and upload again.');
    }

    if (blob.size > MAX_INLINE_RICHTEXT_IMAGE_SIZE) {
      throw new Error('One inline content image is too large. Max 2MB per image.');
    }

    const ext = (blob.type || 'image/png').split('/')[1] || 'png';
    const fileName = 'inline-' + Date.now() + '-' + i + '.' + ext.replace(/[^a-zA-Z0-9]/g, '');
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    const uploaded = await api.upload(file, collection || 'posts');
    console.log('%c≡ƒצ╝∩╕ן Inline image ' + (i + 1) + '/' + uniqueDataUrls.length + ' uploaded', 'color:#3b82f6;font-weight:bold', {
      url: uploaded.url,
      sizeKB: Math.round(blob.size / 1024),
      collection: collection || 'posts',
    });
    nextHtml = nextHtml.split(dataUrl).join(uploaded.url);
  }

  return nextHtml;
}

function getImageFormatLabel(source, fallbackName) {
  const mime = typeof source === 'string' && source.includes('/') ? source : '';
  if (mime) {
    const subtype = mime.split('/')[1] || '';
    if (subtype) return subtype.replace(/\+.*/, '').toUpperCase();
  }

  const raw = String(source || fallbackName || '');
  const clean = raw.split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : '';
}

function readImageFileMeta(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = function () {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        bytes: file.size,
        format: getImageFormatLabel(file.type, file.name),
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image dimensions.'));
    };

    image.src = objectUrl;
  });
}

function fetchRemoteImageMeta(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Could not read image size.');
      return response.blob();
    })
    .then(blob => ({
      bytes: blob.size,
      format: getImageFormatLabel(blob.type, url),
    }));
}


console.log("helpers.js loaded");
