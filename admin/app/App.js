// App — hash router, dashboard page, main render

const { useState: useAppState, useEffect: useAppEffect } = React;

function isLocalHostName(hostname) {
  return /^(localhost|127\.0\.0\.1)$/i.test(hostname || '');
}

function getStorageValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function clearAuthStorage() {
  ['token', 'user', 'site_id', 'api_base'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function toTitleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getClientTitle() {
  const siteId = getStorageValue('site_id') || 'site_bobby';
  return toTitleCase(siteId.replace(/^site[_-]?/i, '')) || 'Client';
}

function getPageTitle(route) {
  if (route.page === 'dashboard') return 'Dashboard';

  const collection = route.collection ? COLLECTIONS[route.collection] : null;
  if (!collection) return 'Dashboard';

  if (route.page === 'list') return collection.label;
  if (route.page === 'editor') return route.itemId ? ('Edit ' + collection.singular) : collection.newLabel.replace(/^\+\s*/, '');

  return 'Dashboard';
}

function updateDocumentTitle(route) {
  const pageTitle = getPageTitle(route);
  const clientTitle = getClientTitle();
  document.title = pageTitle + ' | ' + clientTitle + ' | StupidCMS';
}

// ─── Hash Router ─────────────────────────────────────────
function useRoute() {
  const [hash, setHash] = useAppState(window.location.hash || '#/');
  useAppEffect(() => {
    let currentHash = window.location.hash || '#/';
    let isRestoringHash = false;

    const fn = () => {
      const nextHash = window.location.hash || '#/';

      if (isRestoringHash) {
        isRestoringHash = false;
        currentHash = nextHash;
        setHash(nextHash);
        return;
      }

      const guard = window.__EDITOR_UNSAVED_GUARD__;
      if (typeof guard === 'function' && !guard(nextHash, currentHash)) {
        isRestoringHash = true;
        window.location.hash = currentHash;
        return;
      }

      currentHash = nextHash;
      setHash(nextHash);
    };

    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return hash;
}

function parseRoute(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return { page: 'dashboard' };
  const collection = parts[0];
  if (!(collection in COLLECTIONS)) return { page: 'dashboard' };
  if (parts.length === 1) return { page: 'list', collection };
  if (parts[1] === 'new') return { page: 'editor', collection, itemId: null };
  if (parts[1] === 'edit' && parts[2]) return { page: 'editor', collection, itemId: parts[2] };
  return { page: 'dashboard' };
}

function buildBreadcrumbs(route) {
  if (route.page === 'dashboard') {
    return [{ label: 'Dashboard' }];
  }

  const collection = route.collection ? COLLECTIONS[route.collection] : null;
  if (!collection) return [{ label: 'Dashboard', href: '#/' }];

  if (route.page === 'list') {
    return [
      { label: 'Dashboard', href: '#/' },
      { label: collection.label },
    ];
  }

  return [
    { label: 'Dashboard', href: '#/' },
    { label: collection.label, href: '#/' + route.collection },
    { label: route.itemId ? ('Edit ' + collection.singular) : collection.newLabel.replace(/^\+\s*/, '') },
  ];
}

// ─── Dev Server Card (localhost only) ────────────────────
function DevServerCard() {
  const [copied, setCopied] = useAppState(false);
  const [serverStatus, setServerStatus] = useAppState('checking'); // 'checking' | 'ok' | 'offline'
  const command = 'npm start';

  useAppEffect(() => {
    let active = true;
    window.resolveBackendStatus().then(status => {
      if (active) setServerStatus(status.status === 'ok' ? 'ok' : 'offline');
    });
    return () => { active = false; };
  }, []);

  function copyCmd() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  }

  const statusDot = {
    checking: { color: '#f59e0b', label: 'Checking…' },
    ok:       { color: '#22c55e', label: 'Running' },
    offline:  { color: '#ef4444', label: 'Offline' },
  }[serverStatus];

  const cardBg    = serverStatus === 'ok'      ? '#f0fdf4' : serverStatus === 'offline' ? '#fef2f2' : '#f8fafc';
  const cardBorder= serverStatus === 'ok'      ? '#bbf7d0' : serverStatus === 'offline' ? '#fecaca' : '#e2e8f0';

  return (
    <div>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest" style={{ marginBottom: '1rem' }}>Developer</h2>
      <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <p className="text-sm font-medium text-gray-700">🖥 Local server</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: statusDot.color }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: statusDot.color,
              boxShadow: serverStatus === 'ok' ? '0 0 0 3px #bbf7d0' : 'none',
            }} />
            {statusDot.label}
          </span>
        </div>

        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          Run this in your terminal from the project root:
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <code style={{
            flex: 1,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#0f172a',
            letterSpacing: '0.02em',
          }}>
            {command}
          </code>
          <button
            onClick={copyCmd}
            style={{
              flexShrink: 0,
              background: copied ? '#16a34a' : '#fff',
              color: copied ? '#fff' : '#374151',
              border: '1px solid ' + (copied ? '#16a34a' : '#d1d5db'),
              borderRadius: '0.5rem',
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontWeight: 500,
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        {serverStatus === 'ok' && (
          <p style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.6rem', fontWeight: 500 }}>
            ✓ Server is running. Use npm run dev for auto-restart during development.
          </p>
        )}
        {serverStatus === 'offline' && (
          <p style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.6rem', fontWeight: 500 }}>
            ✗ Server not detected. Run the command above, then refresh.
          </p>
        )}
        <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.35rem' }}>
          Localhost only — not visible in production.
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────
function DashboardPage() {
  const user = JSON.parse(getStorageValue('user') || '{}');
  const siteId = getStorageValue('site_id') || 'site_bobby';
  const domain = window.getSiteDomain(siteId);
  const initialDir = localStorage.getItem('site_dir_' + siteId) || 'ltr';
  const [dir, setDir] = useAppState(initialDir);
  const [savedDir, setSavedDir] = useAppState(initialDir);
  const [showId, setShowId] = useAppState(false);
  const [copyState, setCopyState] = useAppState('idle');
  const [showLogoutConfirm, setShowLogoutConfirm] = useAppState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useAppState(false);
  const [pendingNavigation, setPendingNavigation] = useAppState(null);

  const isDirty = dir !== savedDir;

  function saveDirChanges() {
    localStorage.setItem('site_dir_' + siteId, dir);
    setSavedDir(dir);
    setShowSaveConfirm(false);
    if (pendingNavigation) {
      window.location.hash = pendingNavigation;
      setPendingNavigation(null);
    }
  }

  function discardDirChanges() {
    setDir(savedDir);
    setShowSaveConfirm(false);
    if (pendingNavigation) {
      window.location.hash = pendingNavigation;
      setPendingNavigation(null);
    }
  }

  function changeDirWithConfirm(v) {
    setDir(v);
  }

  // Warn on navigation if direction changed
  useAppEffect(() => {
    const handleHashChange = () => {
      if (isDirty) {
        window.location.hash = window.location.hash; // Restore current hash
        setPendingNavigation(window.location.hash);
        setShowSaveConfirm(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isDirty]);


  async function copyDomain() {
    if (!domain) return;
    try {
      await navigator.clipboard.writeText(domain);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1400);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 1800);
    }
  }

  return (
    <div>
      <div
        style={{
          minHeight: '36svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <h1 className="text-xl font-semibold text-gray-900" style={{ marginBottom: '0.25rem' }}>
          {'Welcome' + (user.username ? ', ' + user.username : '')}
        </h1>
        <p className="text-sm text-gray-400">Manage your website content</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Site ID */}
        <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest" style={{ marginBottom: '1rem', textAlign: 'center' }}>Account</h2>
          <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-sm"><span className="font-medium text-gray-700">Username:</span> <span className="text-gray-600">{user.username}</span></p>
            <p className="text-sm" style={{ marginTop: '0.5rem' }}>
              <span className="font-medium text-gray-700">Secret ID:</span> {' '}
              {showId ? (
                <span className="text-gray-600 font-mono text-xs" style={{ letterSpacing: '0.05em' }}>
                  {user.id || 'N/A'}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">••••••••</span>
              )}
              {' '}
              <button
                onClick={() => setShowId(!showId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  padding: '0 0.25rem',
                }}
              >
                {showId ? 'hide' : 'show'}
              </button>
            </p>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{ marginTop: '1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Domain */}
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest" style={{ marginBottom: '1rem' }}>Site</h2>
          <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '0.5rem' }}>Domain</label>
            <input type="text" value={domain} readOnly className="uk-input" style={{ background: '#f9fafb', color: '#6b7280' }} />
            <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.25rem' }}>
              Defined by developer in config. Clients cannot change this.
            </p>
            {domain && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                <a
                  href={domain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uk-button uk-button-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  Open site ↗
                </a>
                <button onClick={copyDomain} className="uk-button uk-button-secondary">
                  {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy domain'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dev: Start server command (localhost only) */}
        {isLocalHostName(window.location.hostname) && <DevServerCard />}

        {/* Direction */}
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest" style={{ marginBottom: '1rem' }}>Settings</h2>
          <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '0.35rem' }}>Content editing direction</label>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>Does not affect the live site design.</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="dir" value="ltr" checked={dir === 'ltr'} onChange={() => changeDirWithConfirm('ltr')} className="accent-blue-600" />
                <span className="text-sm text-gray-700">LTR <span className="text-gray-400 text-xs">(English)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="dir" value="rtl" checked={dir === 'rtl'} onChange={() => changeDirWithConfirm('rtl')} className="accent-blue-600" />
                <span className="text-sm text-gray-700">RTL <span className="text-gray-400 text-xs">(עברית / ערבית)</span></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save changes dialog */}
      <window.AlertBox
        isOpen={showSaveConfirm}
        title="Save changes?"
        message="You have unsaved direction preference changes. Do you want to save them before leaving?"
        type="confirm"
        confirmText="Save and leave"
        cancelText="Discard"
        onConfirm={saveDirChanges}
        onCancel={discardDirChanges}
      />

      {/* Logout confirmation dialog */}
      <window.AlertBox
        isOpen={showLogoutConfirm}
        title="Sign out?"
        message="Are you sure you want to sign out?"
        type="confirm"
        confirmText="Sign out"
        cancelText="Cancel"
        onConfirm={() => { clearAuthStorage(); window.location.href = '/admin/login.html'; }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────
function App() {
  const hash = useRoute();
  const route = parseRoute(hash);

  const activeTab = (route.page === 'list' || route.page === 'editor') ? route.collection : null;
  const breadcrumbs = buildBreadcrumbs(route);

  useAppEffect(() => {
    updateDocumentTitle(route);
  }, [route.page, route.collection, route.itemId]);

  let content;
  switch (route.page) {
    case 'list':
      content = <ListPage key={route.collection} collection={route.collection} />;
      break;
    case 'editor':
      content = <EditorPage key={route.collection + '-' + route.itemId} collection={route.collection} itemId={route.itemId} />;
      break;
    default:
      content = <DashboardPage />;
  }

  return <Layout activeTab={activeTab} breadcrumbs={breadcrumbs}>{content}</Layout>;
}

// ─── Mount ───────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
