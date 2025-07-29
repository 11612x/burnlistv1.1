import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('info');

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification(message);
    setNotificationType(type);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotification('');
      }, duration);
    }
  }, []);

  const clearNotification = useCallback(() => {
    setNotification('');
  }, []);

  const showError = useCallback((message, duration = 3000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showSuccess = useCallback((message, duration = 3000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showLoading = useCallback((message) => {
    showNotification(message, 'loading', 0); // No auto-clear for loading
  }, [showNotification]);

  return {
    notification,
    notificationType,
    showNotification,
    clearNotification,
    showError,
    showSuccess,
    showLoading,
    setNotification,
    setNotificationType
  };
} 