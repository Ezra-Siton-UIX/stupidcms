// BackendWarning — backend status warning banner
// Shows warning banner when backend connection has issues

const { useState, useEffect } = React;

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
