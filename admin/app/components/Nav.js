// Shared navigation component — moved from admin/components/nav.js
window.Nav = function Nav() {
  const TABS = [
    { label: 'Posts', href: '../blog/blog.html',  countKey: 'posts' },
    { label: 'Team',  href: '../team/team.html',  countKey: 'team'  },
    { label: 'FAQ',   href: '../faq/faq.html',    countKey: 'faq'   },
  ];

  // Detect current page
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  const PAGE_MAP = {
    'blog.html':      'posts',
    'editor.html':    'posts',
    'team.html':      'team',
    'team-editor.html': 'team',
    'faq.html':       'faq',
    'faq-editor.html': 'faq',
  };
  const ACTIVE = PAGE_MAP[page] || null;

  // Determine dashboard link (depends on current page location)
  const isDashboard = page === 'dashboard.html';
  const dashboardLink = isDashboard ? 'dashboard.html' : '../blog/dashboard.html';
  const logoLink = isDashboard ? 'dashboard.html' : '../blog/dashboard.html';

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user.username || '—';

  // Counts — will be replaced with real data after GraphQL connects
  const counts = JSON.parse(localStorage.getItem('nav_counts') || '{}');

  function countBadge(key, isActive) {
    const n = counts[key];
    if (n == null) return '';
    const cls = isActive ? 'text-blue-400' : 'text-gray-300';
    return `<span class="${cls} font-normal">(${n})</span>`;
  }

  const tabsHtml = TABS.map(t => {
    const isActive = t.countKey === ACTIVE;
    return isActive
      ? `<a href="${t.href}" class="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 -mb-px whitespace-nowrap">${t.label} ${countBadge(t.countKey, true)}</a>`
      : `<a href="${t.href}" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition whitespace-nowrap">${t.label} ${countBadge(t.countKey, false)}</a>`;
  }).join('');

  return (
    <>
      <header className="uk-header">
        <div className="uk-container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'1rem',paddingBottom:'1rem'}}>
          <a href={dashboardLink} className="text-sm font-semibold text-gray-900 tracking-tight hover:text-blue-600 transition" style={{textDecoration:'none'}}>StupidCMS</a>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <span className="text-sm text-gray-500">{username}</span>
            <button onClick={navLogout} className="text-sm text-gray-400 hover:text-gray-900 transition" style={{background:'none',border:'none',cursor:'pointer'}}>Sign out</button>
          </div>
        </div>
      </header>
      <div className="uk-container">
        <div style={{display:'flex',gap:'0.25rem',borderBottom:'1px solid #f3f4f6'}} dangerouslySetInnerHTML={{__html: tabsHtml}} />
      </div>
    </>
  );
};
