import React from 'react';

const NotificationBanner = ({ notification, handleNotificationClose }) => {
  if (!notification) return null;

  return (
  <div
    style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#e31507",
      border: "2px solid #e31507",
      color: "#ffffff",
      padding: "10px 20px",
      borderRadius: 4,
      fontFamily: "'Courier New', Courier, monospace",
      cursor: "pointer",
      zIndex: 1000,
      userSelect: "none",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    }}
    onClick={handleNotificationClose}
  >
    {notification}
  </div>
  );
};

export default NotificationBanner;