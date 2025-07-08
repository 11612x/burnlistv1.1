{notification && (
  <div
    style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "black",
      border: "2px solid red",
      color: "red",
      padding: "10px 20px",
      borderRadius: 4,
      fontFamily: "'Courier New', Courier, monospace",
      cursor: "pointer",
      zIndex: 1000,
      userSelect: "none",
    }}
    onClick={handleNotificationClose}
  >
    {notification}
  </div>
)}