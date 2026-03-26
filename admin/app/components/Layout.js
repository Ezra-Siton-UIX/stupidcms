// Layout — main app shell
// Main layout shell with header, nav tabs, breadcrumbs, footer

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
            <span style={{ marginLeft: '0.35rem', fontSize: '0.5rem', fontWeight: 600, color: '#fff', background: isLocalHostName(window.location.hostname) ? '#f97316' : '#16a34a', borderRadius: '0.2rem', padding: '0.08rem 0.28rem', letterSpacing: '0.04em', verticalAlign: 'middle', opacity: 0.8 }}>
              {isLocalHostName(window.location.hostname) ? 'LOCAL' : 'LIVE'}
            </span>
            {window.location.port === '3001' && (
              <span style={{ marginLeft: '0.2rem', fontSize: '0.5rem', fontWeight: 700, color: '#f97316', verticalAlign: 'middle', opacity: 0.7 }}>W</span>
            )}
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
