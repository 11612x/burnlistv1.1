import React from "react";
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const TimeframeSelector = ({ selected, onChange }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  return (
    <div style={{ marginTop: 10, marginBottom: 10, display: "flex", gap: 12, alignItems: "center", padding: "6px" }}>
      {["D", "W", "M", "YTD", "Y", "MAX"].map((tf) => (
        <button
          key={tf}
          onClick={() => {
            console.log("Selected timeframe:", tf);
            onChange(tf);
          }}
          style={{
            backgroundColor: selected === tf ? green : 'transparent',
            color: selected === tf ? black : green,
            border: `1px solid ${green}`,
            height: "32px",
            width: "40px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "0.9rem",
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;