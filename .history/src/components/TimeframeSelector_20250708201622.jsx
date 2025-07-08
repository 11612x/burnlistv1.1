import React from "react";

const TimeframeSelector = ({ selected, onChange }) => (
  <div style={{ marginTop: 10, marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
    {["D", "W", "M", "YTD", "Y", "MAX"].map((tf) => (
      <button
        key={tf}
        onClick={() => {
          console.log("Selected timeframe:", tf);
          onChange(tf);
        }}
        style={{
          backgroundColor: selected === tf ? "#0de309" : "transparent",
          color: selected === tf ? "black" : "#0de309",
          border: "1px solid #0de309",
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