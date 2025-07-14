import React from 'react';
import { useThemeColor } from '../ThemeContext';

const NotificationBanner = ({ message, type = 'info', onClose }) => {
  if (!message) return null;
  const bg = useThemeColor(type === 'error' ? '#e31507' : type === 'success' ? '#0de309' : type === 'loading' ? '#111' : '#222');
  const fg = useThemeColor(type === 'error' || type === 'success' ? 'black' : '#8CB9A2');
  const border = useThemeColor(type === 'error' ? '#e31507' : type === 'success' ? '#0de309' : '#8CB9A2');
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        padding: '10px',
        textAlign: 'center',
        fontFamily: 'Courier New',
        fontSize: 16,
        borderBottom: `1px solid ${border}`,
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