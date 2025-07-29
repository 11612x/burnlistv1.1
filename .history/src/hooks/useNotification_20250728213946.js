import { useState, useEffect, useCallback } from 'react';

const useNotification = () => {
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [timeoutId, setTimeoutId] = useState(null);

  // Clear any existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Function to set notification with automatic 4-second timeout
  const showNotification = useCallback((message, type = 'info') => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set the notification
    setNotification(message);
    setNotificationType(type);

    // Set up automatic timeout after 4 seconds
    if (message) {
      const newTimeoutId = setTimeout(() => {
        setNotification('');
        setNotificationType('info');
      }, 4000); // 4 seconds
      setTimeoutId(newTimeoutId);
    }
  }, [timeoutId]);

  // Function to manually clear notification
  const clearNotification = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setNotification('');
    setNotificationType('info');
  }, [timeoutId]);

  return {
    notification,
    notificationType,
    setNotification: showNotification,
    setNotificationType,
    clearNotification
  };
};

export default useNotification; 