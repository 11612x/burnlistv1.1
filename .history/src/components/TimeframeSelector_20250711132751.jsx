import React from "react";

const CRT_GREEN = 'rgb(140,185,162)';

const TimeframeSelector = ({ selected, onChange }) => (
  <div style={{ marginTop: 10, marginBottom: 10, display: "flex", gap: 12, alignItems: "center", border: `1px solid ${CRT_GREEN}`, padding: "6px" }}>
    {["D", "W", "M", "YTD", "Y", "MAX"].map((tf) => (
      <button
        key={tf}
        onClick={() => {
          console.log("Selected timeframe:", tf);
          onChange(tf);
        }}
        style={{
          backgroundColor: selected === tf ? CRT_GREEN : "transparent",
          color: selected === tf ? "#000000" : CRT_GREEN,
          border: `1px solid ${CRT_GREEN}`,
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