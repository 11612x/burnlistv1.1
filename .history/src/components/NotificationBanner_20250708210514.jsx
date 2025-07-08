{notification && (
  <div
    style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#000000",
      border: "2px solid #e31507",
      color: "#e31507",
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
)}