import React from "react";
import { Link } from "react-router-dom";

const BackHomeButton = ({ top = "1rem", left, right }) => {
  const positionStyle = {
    position: "absolute",
    top,
    zIndex: 10,
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
  };

  return (
    <div style={positionStyle}>
      <Link
        to="/"
        style={{
          display: "inline-block",
          lineHeight: "1rem",
          color: "#0de309",
          fontFamily: "'Courier New', Courier, monospace",
          textDecoration: "underline",
          cursor: "pointer",
          userSelect: "none",
          fontSize: "1rem",
        }}
      >
        ← back home
      </Link>
    </div>
  );
};

export default BackHomeButton;