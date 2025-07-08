import React from "react";

const TimeframeSelector = ({ selected, onChange }) => (
  <div style={{ marginTop: 10, marginBottom: 10, display: "flex", gap: 12, alignItems: "center", border: "1px solid #ffffff", padding: "6px" }}>
    {["D", "W", "M", "YTD", "Y", "MAX"].map((tf) => (
      <button
        key={tf}
        onClick={() => {
          console.log("Selected timeframe:", tf);
          onChange(tf);
        }}
        style={{
          backgroundColor: selected === tf ? "rgb(13, 227, 9)" : "transparent",
          color: selected === tf ? "#000000" : "rgb(13, 227, 9)",
          border: "1px solid rgb(13, 227, 9)",
          padding: "4px 10px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "0.9rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {tf}
      </button>
    ))}
  </div>
);

export default TimeframeSelector;