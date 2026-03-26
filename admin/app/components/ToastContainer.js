// ToastContainer component (split from monolith)
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
