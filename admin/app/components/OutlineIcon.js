// OutlineIcon — icon component
// SVG icon component used by Layout, ListPage, EditorPage

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

window.OutlineIcon = OutlineIcon;
