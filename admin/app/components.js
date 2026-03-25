// Shared React components — Layout, ListPage, EditorPage, QuillEditor
// Change a component here → affects every page automatically.

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
  } catch {
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
  } catch {
    return {
      status: 'offline',
      base,
      supportsUploads: false,
      message: 'Cannot reach backend on ' + base + '.',
    };
  }
}

// Centralized alert utility — replace with professional dialog later
window.showAlert = function showAlert(message, type) {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type || 'error');
    return;
  }
  window.alert(message);
};

// Centralized confirm utility — replace with professional dialog later
window.showConfirm = function showConfirm(message) {
  return window.confirm(message);
};

// ─── Toast System ────────────────────────────────────────
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

window.ToastContainer = function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    return window.__toastSubscribe(setToasts);
  }, []);

  if (!toasts.length) return null;

  const typeStyle = {
    success: { background: '#166534', color: '#fff', borderColor: '#15803d' },
    error:   { background: '#7f1d1d', color: '#fff', borderColor: '#b91c1c' },
    info:    { background: '#1e3a5f', color: '#fff', borderColor: '#2563eb' },
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const s = typeStyle[t.type] || typeStyle.info;
        const isEntering = t.phase === 'enter';
        const isExiting = t.phase === 'exit';
        return (
          <div
            key={t.id}
            style={{
              ...s,
              padding: '0.6rem 1rem',
              borderRadius: '0.6rem',
              fontSize: '0.8rem',
              fontWeight: 400,
              boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
              border: '1px solid ' + s.borderColor,
              maxWidth: '22rem',
              pointerEvents: 'auto',
              opacity: isEntering ? 0 : isExiting ? 0 : 1,
              transform: isEntering ? 'translateY(8px)' : isExiting ? 'translateY(6px)' : 'translateY(0)',
              transition: 'opacity 220ms ease, transform 220ms ease',
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>,
    document.body
  );
};

// Alert Component — accessible alert/confirm dialog (upgrade to modal dialog later)
window.AlertBox = function AlertBox({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', type = 'alert' }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      role="presentation"
      onClick={() => onCancel?.()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          maxWidth: '28rem',
          minWidth: '20rem',
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="alert-title" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
            {title}
          </h2>
        )}
        <p id="alert-message" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {type === 'confirm' && (
            <button
              onClick={() => onCancel?.()}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.background = '#fff')}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => onConfirm?.()}
            autoFocus
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: 'none',
              background: type === 'confirm' ? '#3b82f6' : '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#2563eb')}
            onMouseLeave={(e) => (e.target.style.background = '#3b82f6')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

function OutlineIcon({ name, size = 14, color = '#94a3b8' }) {
  const common = { color, flexShrink: 0 };

  if (name === 'book') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M6 5.5C6 4.67 6.67 4 7.5 4H19V18H7.5C6.67 18 6 18.67 6 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 5.5V19.5C6 20.33 6.67 21 7.5 21H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'person') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 19C5 15.96 7.69 13.5 11 13.5H13C16.31 13.5 19 15.96 19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'question') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.8 9.3C9.95 8.15 10.95 7.3 12.15 7.3C13.45 7.3 14.5 8.25 14.5 9.45C14.5 10.45 13.9 11.05 13.05 11.55C12.3 11.98 12 12.35 12 13.1V13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="16.6" r="0.9" fill="currentColor" />
      </svg>
    );
  }

  if (name === 'news') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M5 6.5C5 5.67 5.67 5 6.5 5H17.5C18.33 5 19 5.67 19 6.5V17.5C19 18.33 18.33 19 17.5 19H6.5C5.67 19 5 18.33 5 17.5V6.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 12H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="14.5" y="11.5" width="2.5" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (name === 'briefcase') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M8 7V6.5C8 5.67 8.67 5 9.5 5H14.5C15.33 5 16 5.67 16 6.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5.5 8H18.5C19.33 8 20 8.67 20 9.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V9.5C4 8.67 4.67 8 5.5 8Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 11.5C6.6 12.87 9.27 13.56 12 13.56C14.73 13.56 17.4 12.87 20 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10.5 12.75H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'code') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M8 8L4 12L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8L20 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 6L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'map') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <circle cx="6" cy="6" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 6.6L16.3 7.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7.1 7.4L10.9 16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.9 9.6L13.1 16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'trash') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.5 3.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7.5 7L8.2 18.5C8.25 19.35 8.95 20 9.8 20H14.2C15.05 20 15.75 19.35 15.8 18.5L16.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 10V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 10V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'layers') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M12 3L21 8L12 13L3 8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 16L12 21L21 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'document') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={common}>
        <path d="M8 4.75H13.75L18.25 9.25V18.25C18.25 19.08 17.58 19.75 16.75 19.75H8C7.17 19.75 6.5 19.08 6.5 18.25V6.25C6.5 5.42 7.17 4.75 8 4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13.5 5V9.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9.25 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.25 15H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

// ─── Layout ──────────────────────────────────────────────
window.Layout = function Layout({ activeTab, breadcrumbs, children }) {
  const user = JSON.parse(getStorageValue('user') || '{}');
  const username = user.username || '—';
  const counts = JSON.parse(localStorage.getItem('nav_counts') || '{}');
  const tabs = getVisibleNavGroups();
  const activeGroup = tabs.find(group => group.collections.some(collection => collection.key === activeTab)) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <header className="uk-header">
        <div className="uk-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.9rem', paddingBottom: '0.9rem' }}>
          <a href="#/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle' }}>
              <circle cx="16" cy="16" r="14" stroke="#2563eb" strokeWidth="3" fill="#f3f4f6" />
              <path d="M10 20c2-4 10-4 12 0" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="13" cy="14" r="1.5" fill="#2563eb" />
              <circle cx="19" cy="14" r="1.5" fill="#2563eb" />
            </svg>
            StupidCMS
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-sm text-gray-500">{username}</span>
            <button
              onClick={() => {
                if (!window.showConfirm('Are you sure you want to sign out?')) return;
                clearAuthStorage();
                window.location.href = '/admin/login.html';
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#9ca3af' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="uk-breadcrumb-bar">
          <div className="uk-container" style={{ paddingTop: '0.7rem', paddingBottom: '0.7rem' }}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      )}

      <section className="uk-section" style={{ flex: 1 }}>
        <div className="uk-container">
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
              {tabs.map(t => {
                const active = !!activeGroup && t.key === activeGroup.key;
                const primaryCount = counts[t.primaryCollection] || 0;
                return (
                  <a
                    key={t.key}
                    href={t.route}
                    style={{ textDecoration: 'none', whiteSpace: 'nowrap', padding: '0.45rem 0.1rem 0.65rem', fontSize: '0.8125rem', fontWeight: 500,
                      color: active ? '#2563eb' : '#9ca3af',
                      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}>
                      <OutlineIcon name={window.UI_ICON_MAP[t.key]} color={active ? '#2563eb' : '#94a3b8'} />
                      <span>{t.label + ' (' + primaryCount + ')'}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            {activeGroup && activeGroup.collections.length > 1 && (
              <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', paddingTop: '0.58rem', paddingBottom: '0.12rem' }}>
                {activeGroup.collections.map(collection => {
                  const active = collection.key === activeTab;
                  const count = counts[collection.key] || 0;
                  return (
                    <a
                      key={collection.key}
                      href={'#/' + collection.key}
                      style={{
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.32rem',
                        padding: '0.18rem 0',
                        fontSize: '0.72rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? '#475569' : '#94a3b8',
                        borderBottom: active ? '1px solid #cbd5e1' : '1px solid transparent',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <OutlineIcon name={window.UI_ICON_MAP[collection.key]} color={active ? '#64748b' : '#cbd5e1'} />
                        <span>{collection.label}</span>
                      </span>
                      <span style={{ color: active ? '#94a3b8' : '#cbd5e1' }}>({count})</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {children}
        </div>
      </section>

      <footer className="uk-section-xs">
        <div className="uk-container">
          <p style={{ fontSize: '0.75rem', color: '#d1d5db', textAlign: 'center' }}>© StupidCMS</p>
        </div>
      </footer>
      <window.ToastContainer />
    </div>
  );
};

window.BackendWarning = function BackendWarning() {
  const [backendStatus, setBackendStatus] = useState(window.__BACKEND_STATUS);

  useEffect(() => {
    let active = true;
    resolveBackendStatus().then(status => {
      window.__BACKEND_STATUS = status;
      if (active) setBackendStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!backendStatus || backendStatus.status === 'ok') return null;

  // Parse message to find and linkify URLs
  const renderMessage = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#991b1b',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="backend-warning"
      data-status={backendStatus.status || 'unknown'}
      style={{
      marginBottom: '1.5rem',
      padding: '0.75rem 0.9rem',
      borderRadius: '0.75rem',
      border: '1px solid #fecaca',
      background: '#fef2f2',
      color: '#991b1b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Backend warning</p>
        <p style={{ fontSize: '0.875rem' }}>{renderMessage(backendStatus.message)} Uploads are disabled until this is fixed.</p>
      </div>
      {backendStatus.suggestedBase && (
        <button
          type="button"
          onClick={() => {
            setApiBaseEverywhere(backendStatus.suggestedBase);
            window.location.reload();
          }}
          style={{
            background: '#991b1b',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.5rem 0.85rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Switch to {backendStatus.suggestedBase}
        </button>
      )}
    </div>
  );
};

// ─── Breadcrumbs ─────────────────────────────────────────
window.Breadcrumbs = function Breadcrumbs({ items }) {
  return (
    <nav className="uk-breadcrumbs" style={{ marginBottom: 0 }}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="uk-breadcrumb-sep">/</span>}
          {item.href
            ? <a href={item.href} className="uk-breadcrumb-link">{item.label}</a>
            : <span className="uk-breadcrumb-current">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
};

// ─── API helper ──────────────────────────────────────────
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
  } catch {
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
  } catch {
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
  } catch {
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
      console.log('%c☁️ Cloudinary upload OK', 'color:#22c55e;font-weight:bold', {
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

// ─── ListPage ────────────────────────────────────────────
window.ListPage = function ListPage({ collection }) {
  const config = COLLECTIONS[collection];
  if (!config) return <div>Collection not found</div>;

  const [items, setItems] = useState([]);
  const [trashItems, setTrashItems] = useState(() => readTrashItems(collection));
  const [loading, setLoading] = useState(true);
  const [devTab, setDevTab] = useState('schema');
  const domain = window.getSiteDomain(getSiteId());
  const rawSchema = (window.COLLECTION_SCHEMAS && window.COLLECTION_SCHEMAS[collection]) || null;
  const schemaPreview = {
    key: config.key,
    label: config.label,
    singular: config.singular,
    hasSinglePage: config.hasSinglePage,
    slugPrefix: rawSchema ? rawSchema.slugPrefix : '',
    navGroup: config.navGroup,
    metadataNote: config.metadataNote,
    fields: config.fields.map((field, index) => ({
      order: index + 1,
      key: field.key,
      label: field.label,
      type: field.type,
      required: !!field.required,
      half: !!field.half,
      sourceCollection: field.sourceCollection || null,
      mirrorKey: field.mirrorKey || null,
      previewMode: field.previewMode || null,
      disabled: !!field.disabled,
    })),
  };
  const jsonPreviewItems = items.slice(0, 10);
  const hasMoreJsonItems = items.length > jsonPreviewItems.length;
  const sitemapPreview = buildCollectionSitemapPreview(config, collection, rawSchema, items, domain);

  useEffect(() => {
    setLoading(true);
    setTrashItems(readTrashItems(collection));
    api.get(collection).then(data => {
      setItems(data);
      updateCollectionCount(collection, data.length);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [collection]);

  function handleDelete(id, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this ' + config.singular.toLowerCase() + '?')) return;
    api.del(collection + '/' + id).then(() => {
      const deletedItemTitle = items.find(i => i.id === id)?.[config.list.title] || config.singular;
      setItems(prev => {
        const deletedItem = prev.find(i => i.id === id);
        const next = prev.filter(i => i.id !== id);
        updateCollectionCount(collection, next.length);
        if (deletedItem) {
          setTrashItems(pushTrashItem(collection, deletedItem, config));
        }
        return next;
      });
      window.showToast('"' + deletedItemTitle + '" moved to recycle bin', 'success');
    });
  }

  function handleRestoreTrash(entry, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!entry || !entry.item) return;

    if (!window.showConfirm('Restore "' + (entry.title || 'this item') + '"?\nThe item will be added back to the list.')) return;
    _doRestoreTrash(entry);
  }

  function _doRestoreTrash(entry) {
    const restorePayload = JSON.parse(JSON.stringify(entry.item));
    delete restorePayload.id;
    delete restorePayload.site_id;
    delete restorePayload.created_at;
    delete restorePayload.updated_at;
    delete restorePayload.createdAt;
    delete restorePayload.updatedAt;

    api.post(collection, restorePayload).then(saved => {
      setItems(prev => {
        const next = [saved].concat(prev);
        updateCollectionCount(collection, next.length);
        return next;
      });
      setTrashItems(removeTrashItem(collection, entry.trashId));
      window.showToast('"' + (entry.title || 'Item') + '" restored', 'success');
    }).catch(error => {
      window.showAlert(error && error.message ? error.message : 'Could not restore item.');
    });
  }

  function handleDeleteTrashForever(trashId, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this item permanently from local recycle bin?')) return;
    const target = trashItems.find(entry => entry.trashId === trashId);
    setTrashItems(removeTrashItem(collection, trashId));
    window.showToast('"' + (target && target.title ? target.title : 'Item') + '" deleted forever', 'success');
  }

  function handleEmptyTrash(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!trashItems.length) return;
    if (!window.confirm('Empty local recycle bin for ' + config.label + '?')) return;
    const removedCount = trashItems.length;
    writeTrashItems(collection, []);
    setTrashItems([]);
    window.showToast('Recycle bin emptied (' + removedCount + ' item' + (removedCount === 1 ? '' : 's') + ')', 'success');
  }

  function handleDuplicate(item, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Duplicate this ' + config.singular.toLowerCase() + '?')) return;
    window.__DUPLICATE_PAYLOAD__ = buildDuplicatePayload(config, item);
    window.location.hash = '#/' + collection + '/new';
  }

  return (
    <div>
      <BackendWarning />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-xl font-semibold text-gray-900" style={{ margin: 0 }}>{config.label}</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
            {loading ? 'Loading items...' : items.length + ' item' + (items.length === 1 ? '' : 's')}
          </p>
        </div>
        <a href={'#/' + collection + '/new'} className="uk-button uk-button-primary" style={{ textDecoration: 'none' }}>
          {config.newLabel}
        </a>
      </div>

      <div className="uk-list">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">{config.emptyMessage}</p>
        ) : items.map(item => {
          const title = item[config.list.title];
          const subtitle = config.list.subtitle(item);
          const image = config.list.image ? item[config.list.image] : null;
          const slug = config.list.slug ? item[config.list.slug] : null;
          const slugField = config.fields.find(f => f.key === config.list.slug);
          const slugPrefix = slugField ? slugField.prefix : '/';

          return (
            <a
              key={item.id}
              href={'#/' + collection + '/edit/' + item.id}
              className="group uk-card"
              style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              {image ? (
                <img src={image} alt="" className="uk-img-avatar" />
              ) : config.list.placeholder ? (
                <div className="uk-img-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '1.125rem', fontWeight: 600 }}>
                  {config.list.placeholder}
                </div>
              ) : null}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="uk-text-headline" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
                <p className="uk-text-meta">
                  {subtitle}
                  {slug && <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', color: '#d1d5db' }}>{slugPrefix}{slug}</span>}
                  {slug && domain && (
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(domain + slugPrefix + slug, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ marginLeft: '0.5rem', color: '#60a5fa', textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      title="View on site"
                    >↗</button>
                  )}
                </p>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button onClick={e => handleDuplicate(item, e)} className="uk-button uk-button-secondary" style={{ marginRight: '0.35rem', fontSize: '12px' }}>Duplicate</button>
                <button onClick={e => handleDelete(item.id, e)} className="uk-button-delete">Delete</button>
              </div>
            </a>
          );
        })}
      </div>

      {trashItems.length > 0 && <details style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <OutlineIcon name={window.UI_ICON_MAP.recycleBin} />
            <span>Recycle bin</span>
          </span>
          <span style={{ marginLeft: '0.45rem', fontWeight: 400, color: '#94a3b8' }}>{trashItems.length} item{trashItems.length === 1 ? '' : 's'}</span>
        </summary>
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.75rem 0 0.55rem' }}>
            Local only. Stored in this browser on this machine.
          </p>

          {trashItems.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Recycle bin is empty.</p>
          ) : (
            <Fragment>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {trashItems.map(entry => (
                  <div key={entry.trashId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.65rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Deleted {formatIsraelDateTime(entry.deletedAt)}</p>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button onClick={e => handleRestoreTrash(entry, e)} className="uk-button uk-button-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Restore</button>
                      <button onClick={e => handleDeleteTrashForever(entry.trashId, e)} className="uk-button-delete" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Delete forever</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleEmptyTrash} className="uk-button uk-button-secondary" style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                  Empty recycle bin
                </button>
              </div>
            </Fragment>
          )}
        </div>
      </details>}

      <div className="uk-section-xxs">
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          Metadata
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.35rem' }}>
          {config.metadataNote}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: config.hasSinglePage ? '#166534' : '#991b1b' }}>
          <span style={{ width: 8, height: 8, borderRadius: '9999px', background: config.hasSinglePage ? '#22c55e' : '#ef4444' }} />
          {config.hasSinglePage ? (
            <span>Published: includes single page</span>
          ) : (
            <span>
              List only, on{' '}
              {domain ? (
                <a
                  href={domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#991b1b', textDecoration: 'underline' }}
                >
                  live website
                </a>
              ) : (
                'live website'
              )}{' '}
              no single page
            </span>
          )}
        </div>

        <details style={{ marginTop: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <OutlineIcon name={window.UI_ICON_MAP.developerDebug} />
              <span>Developer debug</span>
            </span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8' }}>Schema + JSON sample</span>
          </summary>
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.85rem 0 0.75rem' }}>
              Development helper. JSON sample shows up to 10 items from the API response.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setDevTab('schema')}
                className="uk-button uk-button-secondary"
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.75rem',
                  borderColor: devTab === 'schema' ? '#cbd5e1' : '#e5e7eb',
                  background: devTab === 'schema' ? '#f8fafc' : '#fff',
                  color: devTab === 'schema' ? '#0f172a' : '#64748b',
                }}
              >
                Schema
              </button>
              <button
                type="button"
                onClick={() => setDevTab('json')}
                className="uk-button uk-button-secondary"
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.75rem',
                  borderColor: devTab === 'json' ? '#cbd5e1' : '#e5e7eb',
                  background: devTab === 'json' ? '#f8fafc' : '#fff',
                  color: devTab === 'json' ? '#0f172a' : '#64748b',
                }}
              >
                JSON sample
              </button>
            </div>

            {devTab === 'schema' ? (
              <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#dbeafe', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
                {JSON.stringify(schemaPreview, null, 2)}
              </pre>
            ) : (
              <Fragment>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.55rem' }}>
                  Showing {jsonPreviewItems.length} of {items.length} item{items.length === 1 ? '' : 's'}{hasMoreJsonItems ? ' (limited to 10)' : ''}.
                </p>
                <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#fde68a', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
                  {JSON.stringify(jsonPreviewItems, null, 2)}
                </pre>
              </Fragment>
            )}
          </div>
        </details>

        <details style={{ marginTop: '0.85rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <OutlineIcon name={window.UI_ICON_MAP.sitemap} />
              <span>Sitemap preview</span>
            </span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8' }}>{sitemapPreview.entryCount} URL{sitemapPreview.entryCount === 1 ? '' : 's'}</span>
          </summary>
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.85rem 0 0.35rem' }}>
              Expected sitemap endpoint for this collection
            </p>
            <p style={{ fontSize: '0.75rem', color: '#0f172a', marginBottom: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {sitemapPreview.sitemapUrl}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.55rem' }}>
              XML preview generated from the current collection data.
            </p>
            <pre style={{ margin: 0, padding: '0.9rem', background: '#0f172a', color: '#c4f1d4', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55 }}>
              {sitemapPreview.xml}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

// ─── QuillEditor ─────────────────────────────────────────
window.QuillEditor = function QuillEditor({ value, onChange, placeholder, toolbar, siteDir, collection }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isProgrammaticUpdateRef = useRef(false);
  onChangeRef.current = onChange;
  const MAX_RICHTEXT_IMAGE_SIZE = 2 * 1024 * 1024;

  const toolbarConfig = toolbar === 'minimal'
    ? [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']]
    : [[{ header: [2, 3, false] }], ['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['image'], ['clean']];

  useEffect(() => {
    if (quillRef.current || !containerRef.current) return;

    const q = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder || '',
      modules: { toolbar: toolbarConfig },
    });

    if (siteDir) {
      q.root.style.direction = siteDir;
      q.root.style.textAlign = siteDir === 'rtl' ? 'right' : 'left';
    }

    if (value) q.root.innerHTML = value;

    q.on('text-change', () => {
      if (isProgrammaticUpdateRef.current) return;
      onChangeRef.current(q.root.innerHTML);
    });

    const toolbarModule = q.getModule('toolbar');
    if (toolbarModule && toolbarModule.container) {
      const toolbarContainer = toolbarModule.container;
      const setControlLabel = (selector, label) => {
        toolbarContainer.querySelectorAll(selector).forEach(control => {
          control.setAttribute('title', label);
          control.setAttribute('aria-label', label);
        });
      };

      setControlLabel('.ql-header', 'Heading');
      setControlLabel('.ql-bold', 'Bold');
      setControlLabel('.ql-italic', 'Italic');
      setControlLabel('.ql-image', 'Insert image');
      setControlLabel('.ql-clean', 'Clear formatting');

      toolbarContainer.querySelectorAll('.ql-list').forEach(control => {
        const listType = control.getAttribute('value');
        const label = listType === 'ordered' ? 'Numbered list' : 'Bullet list';
        control.setAttribute('title', label);
        control.setAttribute('aria-label', label);
      });
    }

    if (toolbarModule && toolbar !== 'minimal') {
      toolbarModule.addHandler('image', () => {
        const backendStatus = window.__BACKEND_STATUS || { status: 'checking', supportsUploads: false };
        if (backendStatus.status !== 'ok' || !backendStatus.supportsUploads) {
          window.showAlert('Uploads are currently disabled. Connect to the correct backend first.');
          return;
        }

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;

          if (file.size > MAX_RICHTEXT_IMAGE_SIZE) {
            window.showAlert('Image is too large. Max 2MB for content images.');
            return;
          }

          try {
            const uploadCollection = collection || 'posts';
            const result = await api.upload(file, uploadCollection);
            console.log('%c📝 Rich text image inserted', 'color:#8b5cf6;font-weight:bold', { url: result.url, collection: uploadCollection });
            const range = q.getSelection(true);
            const index = range ? range.index : q.getLength();
            q.insertEmbed(index, 'image', result.url, 'user');
            q.setSelection(index + 1, 0, 'silent');
            onChangeRef.current(q.root.innerHTML);
          } catch (error) {
            console.error('%c❌ Rich text image upload failed', 'color:#ef4444;font-weight:bold', error);
            window.showAlert(error && error.message ? error.message : 'Image upload failed.');
          }
        };
      });
    }

    quillRef.current = q;
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;

    const nextValue = value || '';
    if (q.root.innerHTML === nextValue) return;

    isProgrammaticUpdateRef.current = true;
    q.root.innerHTML = nextValue;
    isProgrammaticUpdateRef.current = false;
  }, [value]);

  return <div ref={containerRef} className="bg-white" />;
};

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
  } catch {
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
  } catch {
    return false;
  }
}

function normalizeBooleanValue(value) {

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
    } catch {
      throw new Error('Could not process one of the inline images. Please remove it and upload again.');
    }

    if (blob.size > MAX_INLINE_RICHTEXT_IMAGE_SIZE) {
      throw new Error('One inline content image is too large. Max 2MB per image.');
    }

    const ext = (blob.type || 'image/png').split('/')[1] || 'png';
    const fileName = 'inline-' + Date.now() + '-' + i + '.' + ext.replace(/[^a-zA-Z0-9]/g, '');
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    const uploaded = await api.upload(file, collection || 'posts');
    console.log('%c🖼️ Inline image ' + (i + 1) + '/' + uniqueDataUrls.length + ' uploaded', 'color:#3b82f6;font-weight:bold', {
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

// ─── EditorPage ──────────────────────────────────────────
window.EditorPage = function EditorPage({ collection, itemId }) {
  const config = COLLECTIONS[collection];
  if (!config) return <div>Collection not found</div>;

  const isNew = !itemId;

  const emptyData = React.useMemo(() => {
    const empty = {};
    config.fields.forEach(f => { empty[f.key] = f.defaultValue != null ? f.defaultValue : ''; });
    return empty;
  }, [config]);

  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(!isNew);
  const initialDataRef = useRef(emptyData);

  useEffect(() => {
    if (isNew) {
      if (window.__DUPLICATE_PAYLOAD__) {
        const dupData = normalizeDataByFieldTypes(config.fields, { ...emptyData, ...window.__DUPLICATE_PAYLOAD__ });
        delete window.__DUPLICATE_PAYLOAD__;
        initialDataRef.current = emptyData;
        setData(dupData);
        setIsDirty(true);
        setIsDuplicateDraft(true);
        setTouchedFields({});
      } else {
        initialDataRef.current = emptyData;
        setData(emptyData);
        setIsDirty(false);
        setIsDuplicateDraft(false);
        setTouchedFields({});
      }
      return;
    }

    if (!itemId) return;
    api.get(collection + '/' + itemId).then(item => {
      const normalizedItem = normalizeDataByFieldTypes(config.fields, item);
      initialDataRef.current = normalizedItem;
      setData(normalizedItem);
      setIsDirty(false);
      setIsDuplicateDraft(false);
      setTouchedFields({});
      setLoading(false);
    });
  }, [collection, emptyData, isNew, itemId]);

  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});
  const [uploadState, setUploadState] = useState({});
  const [isDuplicateDraft, setIsDuplicateDraft] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [referenceOptions, setReferenceOptions] = useState({});
  const [devTab, setDevTab] = useState('schema');
  const [revisions, setRevisions] = useState([]);
  const [restorePreview, setRestorePreview] = useState(null);
  const [visibleRevisionCount, setVisibleRevisionCount] = useState(INITIAL_VISIBLE_REVISIONS);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const siteDir = localStorage.getItem('site_dir_' + user.site_id) || 'ltr';
  const domain = window.getSiteDomain(user.site_id || getSiteId());

  function getFieldValidationError(field, value) {
    const normalizedText = typeof value === 'string' ? value.trim() : String(value == null ? '' : value).trim();
    const hasRequiredValue = typeof value === 'boolean' ? true : !!normalizedText;

    if (field.required && !hasRequiredValue) {
      return field.label + ' - is required';
    }
    if ((field.type === 'link' || field.type === 'url') && normalizedText && !isValidLinkValue(normalizedText)) {
      return field.label + ' - Enter a valid link';
    }
    if (field.type === 'email' && normalizedText && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedText)) {
      return field.label + ' - Enter a valid email address';
    }
    if (field.type === 'number' && normalizedText) {
      var numVal = Number(normalizedText);
      if (isNaN(numVal)) return field.label + ' - Enter a valid number';
      if (field.min != null && numVal < field.min) return field.label + ' - Minimum value is ' + field.min;
      if (field.max != null && numVal > field.max) return field.label + ' - Maximum value is ' + field.max;
    }
    if (field.type === 'video' && normalizedText && !isValidLinkValue(normalizedText)) {
      return field.label + ' - Enter a valid video URL';
    }
    return '';
  }

  function isInlineValidationMessage(field, message) {
    if (!message) return false;
    return message === (field.label + ' - is required') || message === (field.label + ' - Enter a valid link') || message === (field.label + ' - Enter a valid email address') || message === (field.label + ' - Enter a valid number') || (message && message.indexOf(field.label + ' - Minimum value') === 0) || (message && message.indexOf(field.label + ' - Maximum value') === 0) || message === (field.label + ' - Enter a valid video URL');
  }

  useEffect(() => {
    const referenceFields = config.fields.filter(field => field.type === 'reference' && field.sourceCollection);

    if (!referenceFields.length) {
      setReferenceOptions({});
      return;
    }

    let active = true;
    Promise.all(referenceFields.map(field => (
      api.get(field.sourceCollection).then(items => [field.sourceCollection, items])
    )))
      .then(entries => {
        if (!active) return;
        setReferenceOptions(entries.reduce((acc, entry) => {
          acc[entry[0]] = entry[1];
          return acc;
        }, {}));
      })
      .catch(() => {
        if (!active) return;
        setReferenceOptions({});
      });

    return () => {
      active = false;
    };
  }, [config.fields]);

  useEffect(() => {
    setRevisions(readRevisions(collection, itemId));
    setVisibleRevisionCount(INITIAL_VISIBLE_REVISIONS);
  }, [collection, itemId]);

  useEffect(() => {
    const touchedKeys = Object.keys(touchedFields).filter(key => touchedFields[key]);
    if (!touchedKeys.length) return;

    setErrors(prev => {
      const next = { ...prev };
      touchedKeys.forEach(key => {
        const field = config.fields.find(f => f.key === key);
        if (!field) return;
        const msg = getFieldValidationError(field, data[key]);
        if (msg) {
          next[key] = msg;
        } else if (isInlineValidationMessage(field, next[key])) {
          delete next[key];
        }
      });
      return next;
    });
  }, [data, touchedFields, config.fields]);

  function handleFieldBlur(key) {
    setTouchedFields(prev => ({ ...prev, [key]: true }));
  }

  // Warn user before closing browser tab/window if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Register global hash navigation guard used by App router
  useEffect(() => {
    window.__EDITOR_UNSAVED_GUARD__ = () => {
      if (!isDirty) return true;
      return window.confirm('Your changes will not be saved. Are you sure you want to leave this page?');
    };

    return () => {
      if (window.__EDITOR_UNSAVED_GUARD__) {
        delete window.__EDITOR_UNSAVED_GUARD__;
      }
    };
  }, [isDirty]);

  function updateField(key, value) {
    setData(prev => {
      const next = { ...prev, [key]: value };
      const currentField = config.fields.find(f => f.key === key);

      if (currentField && currentField.type === 'reference') {
        const options = referenceOptions[currentField.sourceCollection] || [];
        const labelKey = currentField.labelKey || 'name';
        const selected = options.find(option => option.id === value);
        if (currentField.mirrorKey) {
          next[currentField.mirrorKey] = selected ? (selected[labelKey] || '') : '';
        }
      }

      const slugField = config.fields.find(f => f.type === 'slug' && f.autoFrom === key);
      if (slugField && isNew && !slugField.disabled) {
        next[slugField.key] = value
          .toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      setIsDirty(JSON.stringify(next) !== JSON.stringify(initialDataRef.current));
      return next;
    });
  }

  function handleSave() {
    if (!isNew && !isDirty) {
      setErrors({});
      setSaveError('');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
      return;
    }

    setTouchedFields(config.fields.reduce((acc, field) => {
      acc[field.key] = true;
      return acc;
    }, {}));

    const newErrors = {};
    config.fields.forEach(f => {
      const msg = getFieldValidationError(f, data[f.key]);
      if (msg) newErrors[f.key] = msg;
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    const slugField = config.fields.find(f => f.type === 'slug');
    const slugValue = slugField && (data[slugField.key] || '').trim();
    const initialSlugValue = slugField && (initialDataRef.current && initialDataRef.current[slugField.key] ? String(initialDataRef.current[slugField.key]).trim() : '');
    const shouldValidateSlugUniqueness = !!(slugField && slugValue && (isNew || slugValue !== initialSlugValue));

    if (shouldValidateSlugUniqueness) {
      setSaveState('saving');
      api.get(collection).then(items => {
        const currentId = String(itemId || data.id || initialDataRef.current.id || '');
        const duplicate = items.find(item => {
          const itemSlug = String(item[slugField.key] || '').trim();
          const itemIdValue = String(item.id || '');
          return itemSlug === slugValue && itemIdValue !== currentId;
        });
        if (duplicate) {
          setSaveState('idle');
          setErrors({ [slugField.key]: slugField.label + ' - "' + slugValue + '" already exists' });
          return;
        }
        doSave();
      }).catch(() => doSave());
    } else {
      doSave();
    }

    function doSave() {
    setErrors({});
    setSaveError('');
    setSaveState('saving');

    const normalizedSaveData = normalizeDataByFieldTypes(config.fields, data);
    Promise.resolve()
      .then(async () => {
        const preparedData = { ...normalizedSaveData };
        const richtextFields = config.fields.filter(function(f) { return f.type === 'richtext'; });
        for (let ri = 0; ri < richtextFields.length; ri++) {
          const rtKey = richtextFields[ri].key;
          if (typeof preparedData[rtKey] === 'string' && preparedData[rtKey].indexOf('data:image/') !== -1) {
            preparedData[rtKey] = await replaceInlineContentImagesWithCloudinary(preparedData[rtKey], collection);
          }
        }
        return preparedData;
      })
      .then(preparedData => {
        const promise = isNew
          ? api.post(collection, preparedData)
          : api.put(collection + '/' + itemId, preparedData);

        if (!isNew && itemId && initialDataRef.current && isDirty) {
          const nextRevisions = pushRevision(collection, itemId, initialDataRef.current, preparedData, config.fields);
          setRevisions(nextRevisions);
        }

        return promise;
      })
      .then(saved => {
      initialDataRef.current = saved;
      setData(saved);
      setSaveState('saved');
      setIsDirty(false);
      if (isNew && saved.id) {
        incrementCollectionCount(collection, 1);
        if (isDuplicateDraft) {
          const savedTitle = saved[config.list.title] || config.singular;
          window.showToast('"' + savedTitle + '" duplicated successfully', 'success');
        } else {
          window.showToast('Item created successfully', 'success');
        }
        // Navigate to edit mode with the new ID
        window.location.hash = '#/' + collection + '/edit/' + saved.id;
      }
      setIsDuplicateDraft(false);
      setTimeout(() => setSaveState('idle'), 2000);
    }).catch(error => {
      setSaveState('idle');
      setSaveError(error && error.message ? error.message : 'Save failed.');
    });
    } // end doSave
  }

  function handleDuplicateCurrent() {
    if (!window.confirm('Duplicate this ' + config.singular.toLowerCase() + '?')) return;
    window.__DUPLICATE_PAYLOAD__ = buildDuplicatePayload(config, data);
    window.location.hash = '#/' + collection + '/new';
  }

  function handleDeleteCurrent() {
    if (!itemId) return;
    if (!window.showConfirm('Delete this ' + config.singular.toLowerCase() + '?')) return;

    api.del(collection + '/' + itemId)
      .then(() => {
        const deletedItemTitle = data[config.list.title] || config.singular;
        setIsDirty(false);
        incrementCollectionCount(collection, -1);
        window.showToast('"' + deletedItemTitle + '" deleted', 'success');
        window.location.hash = '#/' + collection;
      })
      .catch(error => {
        window.showAlert(error && error.message ? error.message : 'Delete failed.');
      });
  }

  function handleRestoreRevision(entry, restoreLabel) {
    if (!entry || !entry.data || !itemId) return;

    const previewData = JSON.parse(JSON.stringify(entry.data));
    setRestorePreview(prev => ({
      entry,
      label: restoreLabel || 'Restore preview',
      originalData: prev ? prev.originalData : JSON.parse(JSON.stringify(data)),
      originalIsDirty: prev ? prev.originalIsDirty : isDirty,
    }));
    setSaveError('');
    setErrors({});
    setData(previewData);
    setIsDirty(JSON.stringify(previewData) !== JSON.stringify(initialDataRef.current));
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function handleCancelRestorePreview() {
    if (!restorePreview) return;
    setData(restorePreview.originalData);
    setIsDirty(restorePreview.originalIsDirty);
    setSaveError('');
    setRestorePreview(null);
  }

  function handleApplyRestorePreview() {
    if (!restorePreview || !restorePreview.entry || !restorePreview.entry.data || !itemId) return;

    setSaveState('saving');

    if (initialDataRef.current) {
      const nextRevisions = pushRevision(collection, itemId, initialDataRef.current, restorePreview.entry.data, config.fields);
      setRevisions(nextRevisions);
    }

    api.put(collection + '/' + itemId, restorePreview.entry.data).then(saved => {
      initialDataRef.current = saved;
      setData(saved);
      setIsDirty(false);
      setRestorePreview(null);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }).catch(error => {
      setSaveState('idle');
      setSaveError(error && error.message ? error.message : 'Restore failed.');
    });
  }

  // Breadcrumb title
  const titleField = config.fields.find(f => f.type === 'title');
  const itemTitle = (titleField && data[titleField.key]) || ('New ' + config.singular);

  // "View on site" link
  const slugField = config.fields.find(f => f.type === 'slug');
  const slugValue = slugField ? data[slugField.key] : null;
  const slugPrefix = slugField ? slugField.prefix : '';

  const saveBtnLabel = saveState === 'saving'
    ? (isDuplicateDraft && isNew ? 'Saving duplicate...' : 'Saving...')
    : saveState === 'saved'
      ? '✓ Saved'
      : (isDuplicateDraft && isNew ? 'Save duplicate' : (isDirty ? 'Save changes' : 'Save'));

  const saveBtnBg = saveState === 'saved' ? '#16a34a' : '#2563eb';
  const isRestorePreviewing = !!restorePreview;
  const cancelBtnLabel = isRestorePreviewing ? 'Back to current' : 'Back';
  const visibleRevisions = revisions.slice(0, visibleRevisionCount);
  const hasMoreRevisions = revisions.length > visibleRevisionCount;
  const rawSchema = (window.COLLECTION_SCHEMAS && window.COLLECTION_SCHEMAS[collection]) || null;
  const schemaPreview = {
    key: config.key,
    label: config.label,
    singular: config.singular,
    hasSinglePage: config.hasSinglePage,
    slugPrefix: rawSchema ? rawSchema.slugPrefix : '',
    navGroup: config.navGroup,
    metadataNote: config.metadataNote,
    fields: config.fields.map((field, index) => ({
      order: index + 1,
      key: field.key,
      label: field.label,
      type: field.type,
      required: !!field.required,
      half: !!field.half,
      sourceCollection: field.sourceCollection || null,
      mirrorKey: field.mirrorKey || null,
      previewMode: field.previewMode || null,
      disabled: !!field.disabled,
    })),
  };
  const itemJsonPreview = {
    collection,
    itemId: itemId || null,
    mode: isNew ? 'new' : 'edit',
    values: data,
  };
  const restoreChangedFields = isRestorePreviewing
    ? new Set(
        config.fields
          .filter(field => !areFieldValuesEqual((restorePreview.originalData || {})[field.key], data[field.key]))
          .map(field => field.key)
      )
    : null;
  const restorePreviewLabel = saveState === 'saving' ? 'Restoring...'
    : saveState === 'saved' ? '✓ Restored'
    : 'Apply restore';
  const duplicateValidationErrorCount = isDuplicateDraft && isNew
    ? config.fields.reduce((count, field) => {
        const msg = getFieldValidationError(field, data[field.key]);
        return msg ? count + 1 : count;
      }, 0)
    : 0;
  const isDuplicateSaveBlocked = isDuplicateDraft && isNew && duplicateValidationErrorCount > 0;
  const isSaveDisabled = saveState === 'saving' || (isRestorePreviewing ? false : isDuplicateSaveBlocked);

  function handleCancel() {
    if (isDirty && !window.confirm('Your changes will not be saved. Are you sure you want to discard them?')) return;
    setIsDirty(false);
    window.location.hash = '#/' + collection;
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSaveShortcut) return;

      event.preventDefault();
      if (saveState === 'saving') return;
      handleSave();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, saveState]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <BackendWarning />

      {/* Validation errors banner */}
      {Object.keys(errors).length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.875rem' }}>
          <p style={{ color: '#991b1b', fontWeight: 500, marginBottom: '0.5rem' }}>
            {Object.keys(errors).length === 1 ? 'Fix this error:' : 'Fix these errors:'}
          </p>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '1.25rem' }}>
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key} style={{ marginBottom: '0.25rem' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {isRestorePreviewing && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '0.75rem', padding: '1rem' }}>
          <p style={{ color: '#c2410c', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            {restorePreview.label}
          </p>
          <p style={{ color: '#c2410c', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Previewing a previous version from {formatIsraelDateTime(restorePreview.entry.createdAt)}
          </p>
          <p style={{ color: '#9a3412', fontSize: '0.8125rem', margin: 0 }}>
            The old values are loaded into the form, but nothing has been restored yet. Review the fields, then choose Apply restore or Back to current.
          </p>
        </div>
      )}

      {isDuplicateDraft && !isRestorePreviewing && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.85rem 1rem' }}>
          <p style={{ color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Duplicate draft - save required
          </p>
          <p style={{ color: '#1e3a8a', fontSize: '0.82rem', margin: 0 }}>
            This is still a duplicate draft. The new item will be created only after Save.
            {' '}
            <span style={{ color: isDuplicateSaveBlocked ? '#b45309' : '#166534', fontWeight: 600 }}>
              {isDuplicateSaveBlocked ? ('Complete ' + duplicateValidationErrorCount + ' required field' + (duplicateValidationErrorCount === 1 ? '' : 's')) : 'Ready to save'}
            </span>
          </p>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={isRestorePreviewing ? handleCancelRestorePreview : handleCancel}
          className="uk-button uk-button-secondary"
        >
          {!isRestorePreviewing && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', height: '1rem', borderRadius: '9999px', border: '1px solid #cbd5e1', fontSize: '0.65rem', marginRight: '0.35rem', lineHeight: 1 }}>
              X
            </span>
          )}
          {cancelBtnLabel}
        </button>
        <button
          onClick={isRestorePreviewing ? handleApplyRestorePreview : handleSave}
          disabled={isSaveDisabled}
          style={{
            backgroundColor: isSaveDisabled ? '#9ca3af' : saveBtnBg, color: '#fff', padding: '0.5rem 1rem',
            fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem',
            border: 'none', cursor: isSaveDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s',
            opacity: isSaveDisabled ? 0.88 : 1,
          }}
        >
          {isDirty && saveState === 'idle' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
          )}
          {isRestorePreviewing ? restorePreviewLabel : saveBtnLabel}
        </button>
      </div>

      {saveError && (
        <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{saveError}</p>
      )}

      {/* Fields */}
      {renderFields(config.fields, data, errors, siteDir, updateField, handleFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, restoreChangedFields)}

      {/* Bottom action bar */}
      <div className="uk-editor-actions-bottom">
        <button
          onClick={isRestorePreviewing ? handleCancelRestorePreview : handleCancel}
          className="uk-button uk-button-secondary"
        >
          {!isRestorePreviewing && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', height: '1rem', borderRadius: '9999px', border: '1px solid #cbd5e1', fontSize: '0.65rem', marginRight: '0.35rem', lineHeight: 1 }}>
              X
            </span>
          )}
          {cancelBtnLabel}
        </button>
        <button
          onClick={isRestorePreviewing ? handleApplyRestorePreview : handleSave}
          disabled={isSaveDisabled}
          style={{
            backgroundColor: isSaveDisabled ? '#9ca3af' : saveBtnBg, color: '#fff', padding: '0.5rem 1rem',
            fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem',
            border: 'none', cursor: isSaveDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s',
            opacity: isSaveDisabled ? 0.88 : 1,
          }}
        >
          {isDirty && saveState === 'idle' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
          )}
          {isRestorePreviewing ? restorePreviewLabel : saveBtnLabel}
        </button>
      </div>

      <div className="uk-section-xxs" style={{ display: 'grid', gap: '0.8rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Created</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatIsraelDateTime(data.created_at)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Last edited</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatIsraelDateTime(data.updated_at || data.created_at)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Metadata</p>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem', lineHeight: 1.5 }}>{config.metadataNote}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: config.hasSinglePage ? '#16a34a' : '#b91c1c' }}>
            <span style={{ width: 6, height: 6, borderRadius: '9999px', background: config.hasSinglePage ? '#22c55e' : '#ef4444' }} />
            <span>{config.hasSinglePage ? 'Includes single page' : 'List only, no single page'}</span>
          </div>

          <details style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.9rem', background: '#fff' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '0.75rem 0.85rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <OutlineIcon name={window.UI_ICON_MAP.developerDebug} />
                <span>Developer debug</span>
              </span>
              <span style={{ marginLeft: '0.45rem', fontWeight: 400, color: '#94a3b8' }}>Schema + item JSON</span>
            </summary>
            <div style={{ padding: '0 0.85rem 0.85rem', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.75rem 0 0.65rem' }}>
                Development helper. Inspect field keys, order, and the current values loaded in this editor.
              </p>

              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setDevTab('schema')}
                  className="uk-button uk-button-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.72rem',
                    borderColor: devTab === 'schema' ? '#cbd5e1' : '#e5e7eb',
                    background: devTab === 'schema' ? '#f8fafc' : '#fff',
                    color: devTab === 'schema' ? '#0f172a' : '#64748b',
                  }}
                >
                  Schema
                </button>
                <button
                  type="button"
                  onClick={() => setDevTab('json')}
                  className="uk-button uk-button-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.72rem',
                    borderColor: devTab === 'json' ? '#cbd5e1' : '#e5e7eb',
                    background: devTab === 'json' ? '#f8fafc' : '#fff',
                    color: devTab === 'json' ? '#0f172a' : '#64748b',
                  }}
                >
                  Item JSON
                </button>
              </div>

              {devTab === 'schema' ? (
                <pre style={{ margin: 0, padding: '0.8rem', background: '#0f172a', color: '#dbeafe', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {JSON.stringify(schemaPreview, null, 2)}
                </pre>
              ) : (
                <pre style={{ margin: 0, padding: '0.8rem', background: '#0f172a', color: '#fde68a', borderRadius: '0.8rem', overflowX: 'auto', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {JSON.stringify(itemJsonPreview, null, 2)}
                </pre>
              )}
            </div>
          </details>
        </div>
        {!isNew && (
          <div className="uk-divider" />
        )}
        {!isNew && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Actions</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleDuplicateCurrent}
                className="uk-button uk-button-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.7rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '12px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span>Duplicate</span>
              </button>

              <button
                onClick={handleDeleteCurrent}
                className="uk-button-delete"
                style={{ padding: '0.35rem 0.7rem', fontSize: '12px' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
        {!isNew && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>History</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.6rem' }}>Load an older version into the form first, review it, then choose whether to restore it.</p>
            {!revisions.length ? (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No previous versions yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Version</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Changes</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', width: '110px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRevisions.map((entry, idx) => {
                      const changesSummary = Array.isArray(entry.changedKeys) ? entry.changedKeys : [];
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          <td style={{ padding: '0.5rem', color: '#6b7280' }}>
                            <div style={{ display: 'grid', gap: '0.18rem' }}>
                              <span style={{ fontWeight: 600, color: '#c2410c' }}>Restore #{idx + 1}</span>
                              <span>{formatIsraelDateTime(entry.createdAt)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem', color: '#6b7280' }}>
                            {changesSummary.length > 0 ? changesSummary.join(', ') : 'unknown'}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRestoreRevision(entry, 'Restore #' + (idx + 1))}
                              className="uk-button uk-button-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                            >
                              Preview restore
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {hasMoreRevisions && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setVisibleRevisionCount(prev => prev + LOAD_MORE_REVISIONS_STEP)}
                      className="uk-button uk-button-secondary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Field rendering ─────────────────────────────────────
function renderFields(fields, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields) {
  const out = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.half && i + 1 < fields.length && fields[i + 1].half) {
      out.push(
        <div key={'grid-' + i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {renderField(fields[i], data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields)}
          {renderField(fields[i + 1], data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields)}
        </div>
      );
      i += 2;
    } else {
      out.push(renderField(f, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields));
      i++;
    }
  }
  return out;
}

function renderField(field, data, errors, siteDir, updateField, onFieldBlur, domain, collection, uploadState, setUploadState, referenceOptions, changedFields) {
  const val = data[field.key] || '';
  const err = errors[field.key];
  const isChangedField = !!(changedFields && changedFields.has(field.key));

  function wrapField(content) {
    if (!content || !isChangedField) return content;
    return React.cloneElement(content, {
      style: {
        ...(content.props.style || {}),
        border: '1px solid #fdba74',
        background: '#fff7ed',
        borderRadius: '0.85rem',
        padding: '0.85rem',
      },
    });
  }

  function renderLabel() {
    return (
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
        {field.label}
        {field.required && <span className="text-red-400 ml-1 normal-case font-normal tracking-normal">*</span>}
        {isChangedField && (
          <span style={{ marginLeft: '0.5rem', padding: '0.12rem 0.38rem', borderRadius: '9999px', background: '#ffedd5', color: '#c2410c', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            Changed
          </span>
        )}
      </label>
    );
  }

  function renderHint() {
    if (!field.hint) return null;
    return <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{field.hint}</p>;
  }

  switch (field.type) {
    case 'title':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="text" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            className="uk-input"
            style={{
              width: '100%',
              fontSize: '1.375rem',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f8fafc',
              border: err ? '2px solid #dc2626' : '1px solid #cbd5e1',
              borderRadius: '0.9rem',
              padding: '0.95rem 1rem',
              boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'text':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="text" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            maxLength={field.maxLength || undefined}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {field.maxLength && (
            <p style={{ fontSize: '0.72rem', color: val.length >= field.maxLength ? '#f87171' : val.length > field.maxLength * 0.85 ? '#f59e0b' : '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
              {val.length} / {field.maxLength}
            </p>
          )}
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'url':
    case 'link':
      const normalizedLink = normalizeLinkValue(val);
      const isLinkValid = !!val && isValidLinkValue(val);
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="url" value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={e => {
              const normalized = normalizeLinkValue(e.target.value);
              if (normalized !== e.target.value) updateField(field.key, normalized);
              if (onFieldBlur) onFieldBlur(field.key);
            }}
            placeholder={field.placeholder}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {isLinkValid && (
            <a
              href={normalizedLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b', textDecoration: 'underline' }}
            >
              <span>Open link</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'date':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="date" value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'reference':
      const options = referenceOptions[field.sourceCollection] || [];
      const labelKey = field.labelKey || 'name';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <select
            value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={err ? { background: '#fff', borderColor: '#dc2626', borderWidth: '2px' } : { background: '#fff' }}
          >
            <option value="">{field.placeholder || 'Select item...'}</option>
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option[labelKey] || option.id}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            {options.length ? 'Linked to ' + options.length + ' available records.' : 'No records found yet. Create one first in ' + (COLLECTIONS[field.sourceCollection]?.label || 'the linked collection') + '.'}
          </p>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'slug':
      const fullUrl = !field.disabled && domain && val ? (domain + field.prefix + val) : '';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
              <div style={{ display: 'flex', border: err ? '2px solid #dc2626' : '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', opacity: field.disabled ? 0.55 : 1 }}>
                <span style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace', borderRight: err ? '2px solid #dc2626' : '1px solid #e5e7eb', userSelect: 'none' }}>
              {field.prefix}
            </span>
            <input
              type="text" value={val}
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
                  disabled={field.disabled}
              placeholder={field.placeholder || 'my-slug'}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#374151', border: 'none', outline: 'none', background: field.disabled ? '#f9fafb' : '#fff', cursor: field.disabled ? 'not-allowed' : 'text' }}
            />
          </div>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
              <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.25rem' }}>
                {field.disabled ? (field.disabledNote || 'This URL is disabled for this collection.') : ('lowercase, hyphens only — auto-generated from ' + field.autoFrom)}
              </p>
          {fullUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.375rem',
                padding: '0.45rem 0.6rem',
                border: '1px solid #2563eb',
                borderRadius: '0.375rem',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.75rem',
                textDecoration: 'none',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ opacity: 0.7 }}>↗</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullUrl}</span>
            </a>
          )}
        </div>
      );

    case 'prefixed':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', border: err ? '2px solid #dc2626' : '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <span style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', color: '#9ca3af', fontSize: '0.75rem', borderRight: err ? '2px solid #dc2626' : '1px solid #e5e7eb', userSelect: 'none' }}>
              {field.prefix}
            </span>
            <input
              type="text" value={val}
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              placeholder={field.placeholder}
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#374151', border: 'none', outline: 'none' }}
            />
          </div>
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'image':
      const previewMode = field.previewMode || 'cover';
      const imageSize = field.imageSize || (previewMode === 'avatar' ? 'medium' : 'cover');
      const uploadInfo = uploadState[field.key] || { status: 'idle', message: '', folder: '' };
      const imageMeta = uploadInfo.meta && uploadInfo.meta.url === val ? uploadInfo.meta : null;
      const backendStatus = window.__BACKEND_STATUS || { status: 'checking', supportsUploads: false, message: 'Checking backend connection...' };
      const uploadsBlocked = backendStatus.status !== 'ok' || !backendStatus.supportsUploads;
      const sizeConfig = {
        cover: { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' },
        medium: { maxPreviewWidth: '420px', dropzoneMaxWidth: '560px', avatarSize: '7rem', dropzonePadding: '1.2rem' },
        small: { maxPreviewWidth: '240px', dropzoneMaxWidth: '340px', avatarSize: '5rem', dropzonePadding: '0.9rem' },
        // Backward compatibility for older schema values.
        full: { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' },
      }[imageSize] || { maxPreviewWidth: '760px', dropzoneMaxWidth: null, avatarSize: '8rem', dropzonePadding: '1.5rem' };
      const previewStyle = previewMode === 'avatar'
        ? {
            width: sizeConfig.avatarSize,
            height: sizeConfig.avatarSize,
            objectFit: 'cover',
            borderRadius: '9999px',
            margin: '0 auto 0.75rem',
            display: 'block',
            background: '#f3f4f6',
          }
        : {
            width: '100%',
            maxWidth: sizeConfig.maxPreviewWidth,
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '0.75rem',
            margin: '0 auto 0.75rem',
            display: 'block',
          };
      const metaSummary = imageMeta
        ? [
            imageMeta.width && imageMeta.height ? (imageMeta.width + ' x ' + imageMeta.height + ' px') : '',
            imageMeta.bytes ? formatFileSize(imageMeta.bytes) : '',
            imageMeta.format || '',
          ].filter(Boolean).join(' · ')
        : '';

      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div
            onClick={() => {
              if (uploadsBlocked) {
                const hint = backendStatus.suggestedBase ? (' Switch to ' + backendStatus.suggestedBase + ' first.') : '';
                window.showAlert((backendStatus.message || 'Uploads are currently disabled.') + hint);
                return;
              }
              document.getElementById('img-' + field.key)?.click();
            }}
            style={{ position: 'relative', border: '2px dashed ' + (uploadsBlocked ? '#fca5a5' : '#e5e7eb'), borderRadius: '1rem', padding: sizeConfig.dropzonePadding, maxWidth: sizeConfig.dropzoneMaxWidth || '100%', width: '100%', margin: '0 auto', textAlign: 'center', cursor: uploadsBlocked ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s', opacity: uploadsBlocked ? 0.75 : 1 }}
          >
            {val && (
              <button
                type="button"
                aria-label="Remove image"
                title="Remove image"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm('Are you sure you want to remove this image?')) return;
                  updateField(field.key, '');
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'idle', message: '', folder: '' }
                  }));
                }}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.75)',
                  background: 'rgba(17, 24, 39, 0.72)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                }}
              >
                🗑
              </button>
            )}
            {val ? (
              <img
                src={val}
                alt=""
                style={previewStyle}
                onLoad={e => {
                  const width = e.currentTarget.naturalWidth;
                  const height = e.currentTarget.naturalHeight;

                  setUploadState(prev => {
                    const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                    const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                    if (currentMeta.width === width && currentMeta.height === height) return prev;
                    return {
                      ...prev,
                      [field.key]: {
                        ...current,
                        meta: {
                          ...currentMeta,
                          url: val,
                          width,
                          height,
                        },
                      },
                    };
                  });

                  if (!imageMeta || (!imageMeta.bytes && !imageMeta.bytesPending)) {
                    setUploadState(prev => {
                      const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                      const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                      return {
                        ...prev,
                        [field.key]: {
                          ...current,
                          meta: {
                            ...currentMeta,
                            url: val,
                            width,
                            height,
                            bytesPending: true,
                          },
                        },
                      };
                    });

                    fetchRemoteImageMeta(val)
                      .then(remoteMeta => {
                        setUploadState(prev => {
                          const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                          const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                          return {
                            ...prev,
                            [field.key]: {
                              ...current,
                              meta: {
                                ...currentMeta,
                                url: val,
                                width,
                                height,
                                bytes: remoteMeta.bytes,
                                format: remoteMeta.format || currentMeta.format || getImageFormatLabel(val),
                                bytesPending: false,
                              },
                            },
                          };
                        });
                      })
                      .catch(() => {
                        setUploadState(prev => {
                          const current = prev[field.key] || { status: 'idle', message: '', folder: '' };
                          const currentMeta = current.meta && current.meta.url === val ? current.meta : {};
                          return {
                            ...prev,
                            [field.key]: {
                              ...current,
                              meta: {
                                ...currentMeta,
                                url: val,
                                width,
                                height,
                                format: currentMeta.format || getImageFormatLabel(val),
                                bytesPending: false,
                              },
                            },
                          };
                        });
                      });
                  }
                }}
              />
            ) : (
              <p style={{ fontSize: '0.875rem', color: uploadsBlocked ? '#dc2626' : '#9ca3af' }}>{uploadsBlocked ? 'Uploads are temporarily disabled' : 'Click to upload image'}</p>
            )}
            <p style={{ fontSize: '0.75rem', color: uploadsBlocked ? '#f87171' : '#d1d5db', marginTop: '0.25rem' }}>
              {uploadsBlocked ? (
                backendStatus.message || 'Backend check failed.'
              ) : (
                <>
                  Click to upload directly to{' '}
                  <a
                    href={val || 'https://cloudinary.com/' }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Cloudinary
                  </a>
                </>
              )}
            </p>
            <input
              id={'img-' + field.key}
              type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;
                const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
                if (file.size > MAX_IMAGE_SIZE) {
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'error', message: 'Image is too large. Max 2MB.', folder: '' }
                  }));
                  e.target.value = '';
                  return;
                }
                let localMeta = null;
                try {
                  localMeta = await readImageFileMeta(file);
                } catch (metaError) {
                  console.warn(metaError);
                }
                setUploadState(prev => ({
                  ...prev,
                  [field.key]: {
                    status: 'uploading',
                    message: 'Uploading to Cloudinary...',
                    folder: '',
                    meta: localMeta ? { ...localMeta, url: val || '' } : undefined,
                  }
                }));
                try {
                  const result = await api.upload(file, collection);
                  updateField(field.key, result.url);
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: {
                      status: 'uploaded',
                      message: 'Uploaded to Cloudinary',
                      folder: result.folder || '',
                      meta: localMeta ? { ...localMeta, url: result.url } : undefined,
                    }
                  }));
                } catch (error) {
                  console.error('Cloudinary upload failed', {
                    message: error && error.message ? error.message : error,
                    apiBase: window.API_BASE,
                    collection,
                    field: field.key,
                  });
                  setUploadState(prev => ({
                    ...prev,
                    [field.key]: { status: 'error', message: error.message || 'Upload failed', folder: '' }
                  }));
                }
                e.target.value = '';
              }}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: uploadInfo.status === 'error' ? '#ef4444' : '#9ca3af', marginTop: '0.5rem' }}>
            {uploadInfo.message === 'Uploaded to Cloudinary' && val ? (
              <>
                Uploaded to{' '}
                <a
                  href={val}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Cloudinary
                </a>
              </>
            ) : (
              uploadInfo.message || (
                <>
                  Uploads are stored automatically in{' '}
                  <a
                    href={val || 'https://cloudinary.com/' }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Cloudinary
                  </a>
                  .
                </>
              )
            )}
            {uploadInfo.folder ? ' Folder: ' + uploadInfo.folder : ''}
          </p>
          {metaSummary && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{metaSummary}</p>}
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Max file size: 2MB</p>
          <input
            type="text" value={val}
            readOnly
            placeholder="Image URL will appear here"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280', outline: 'none', background: '#f9fafb', cursor: 'default' }}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'richtext':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <QuillEditor
            value={val}
            onChange={v => updateField(field.key, v)}
            placeholder={field.placeholder}
            toolbar={field.toolbar}
            siteDir={siteDir}
            collection={collection}
          />
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'checkbox':
      const isChecked = normalizeBooleanValue(val) === true;
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              padding: '0.6rem 0.85rem',
              borderRadius: '0.6rem',
              border: isChecked ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
              background: isChecked ? '#eff6ff' : '#fff',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={e => updateField(field.key, e.target.checked)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              className="accent-blue-600"
              style={{ flexShrink: 0 }}
            />
            <span className="text-sm text-gray-700">{field.checkboxLabel || field.label}</span>
          </label>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'radio':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.35rem' }}>
            {(field.options || []).map(opt => {
              const normalizedVal = (field.options || []).some(option => typeof option.value === 'boolean') ? normalizeBooleanValue(val) : val;
              const isChecked = normalizedVal === opt.value || (normalizedVal === undefined && opt.value === false);
              return (
                <label
                  key={String(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.6rem',
                    border: isChecked ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
                    background: isChecked ? '#eff6ff' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name={field.key}
                    checked={isChecked}
                    onChange={() => updateField(field.key, opt.value)}
                    onBlur={() => onFieldBlur && onFieldBlur(field.key)}
                    className="accent-blue-600"
                    style={{ flexShrink: 0 }}
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'number':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="number" value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step || 'any'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {field.min != null && field.max != null && (
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>Range: {field.min} – {field.max}</p>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'email':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="email" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder || 'email@example.com'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'phone':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="tel" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder || '+972 50-000-0000'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'textarea':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <textarea
            value={val} dir={siteDir}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            maxLength={field.maxLength || undefined}
            className="uk-input"
            style={Object.assign({ resize: 'vertical', minHeight: '5rem', fontFamily: 'inherit', lineHeight: 1.6, padding: '0.65rem 0.75rem' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
          />
          {field.maxLength && (
            <p style={{ fontSize: '0.72rem', color: val.length >= field.maxLength ? '#f87171' : val.length > field.maxLength * 0.85 ? '#f59e0b' : '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
              {val.length} / {field.maxLength}
            </p>
          )}
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'select':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <select
            value={val}
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={() => onFieldBlur && onFieldBlur(field.key)}
            className="uk-input"
            style={Object.assign({ background: '#fff' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map(opt => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.label}
              </option>
            ))}
          </select>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'color':
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="color" value={val || '#000000'}
              onChange={e => updateField(field.key, e.target.value)}
              style={{ width: '3rem', height: '2.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.15rem', cursor: 'pointer', background: '#fff' }}
            />
            <input
              type="text" value={val} dir="ltr"
              onChange={e => updateField(field.key, e.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur(field.key)}
              placeholder={field.placeholder || '#000000'}
              maxLength={7}
              className="uk-input"
              style={Object.assign({ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }, err ? { borderColor: '#dc2626', borderWidth: '2px' } : {})}
            />
          </div>
          {renderHint()}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    case 'video':
      const normalizedVideoUrl = normalizeLinkValue(val);
      const isVideoValid = !!val && isValidLinkValue(val);
      const videoEmbedUrl = isVideoValid ? getVideoEmbedUrl(normalizedVideoUrl) : '';
      return wrapField(
        <div key={field.key}>
          {renderLabel()}
          <input
            type="url" value={val} dir="ltr"
            onChange={e => updateField(field.key, e.target.value)}
            onBlur={e => {
              const normalized = normalizeLinkValue(e.target.value);
              if (normalized !== e.target.value) updateField(field.key, normalized);
              if (onFieldBlur) onFieldBlur(field.key);
            }}
            placeholder={field.placeholder || 'https://www.youtube.com/watch?v=...'}
            className="uk-input"
            style={err ? { borderColor: '#dc2626', borderWidth: '2px' } : {}}
          />
          {renderHint()}
          {isVideoValid && (
            <a
              href={normalizedVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b', textDecoration: 'underline' }}
            >
              <span>Open video</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {videoEmbedUrl && (
            <div style={{ marginTop: '0.75rem', borderRadius: '0.75rem', overflow: 'hidden', maxWidth: '480px', aspectRatio: '16/9' }}>
              <iframe
                src={videoEmbedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )}
          {err && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>{err}</p>}
        </div>
      );

    default:
      return null;
  }
}
