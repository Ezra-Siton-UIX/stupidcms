// AlertBox component (split from monolith)
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
