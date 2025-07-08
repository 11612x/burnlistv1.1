import React from "react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length && payload[0] && payload[0].value != null) {
    let datePart = label;
    let timePart = "";

    if (typeof label === "number") {
      const dt = new Date(label);
      datePart = dt.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      timePart = dt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    return (
      <div
        style={{
          backgroundColor: "",
          border: "0px solid #0de309",
          padding: "8px",
          borderRadius: 0,
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        <p style={{ color: "#0de309", margin: 0 }}>{payload[0].value.toFixed(2)}%</p>
        <p style={{ color: "#055305", margin: 0 }}>{timePart}</p>
        <p style={{ color: "#055305", margin: 0 }}>{datePart}</p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;