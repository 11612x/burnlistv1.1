import React from 'react';

const typeStyles = {
  info:   { background: '#222', color: '#8CB9A2', border: '1px solid #8CB9A2' },
  loading:{ background: '#111', color: '#8CB9A2', border: '1px solid #8CB9A2' },
  error:  { background: '#e31507', color: 'black', border: '1px solid #e31507' },
  success:{ background: '#0de309', color: 'black', border: '1px solid #0de309' },
};

const NotificationBanner = ({ message, type = 'info', onClose }) => {
  if (!message) return null;
  const style = typeStyles[type] || typeStyles.info;
  return (
    <div
      style={{
        ...style,
        padding: '10px',
        textAlign: 'center',
        fontFamily: 'Courier New',
        fontSize: 16,
        borderBottom: style.border,
        position: 'relative',
        marginBottom: 8,
        cursor: onClose ? 'pointer' : 'default',
        userSelect: 'none',
        opacity: 1,
      }}
      onClick={onClose}
      aria-label={onClose ? 'Dismiss notification' : undefined}
      tabIndex={onClose ? 0 : undefined}
      role="alert"
    >
      {message}
    </div>
  );
};

export default NotificationBanner;