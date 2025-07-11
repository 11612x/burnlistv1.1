import React from "react";

const CRT_GREEN = 'rgb(140,185,162)';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length && payload[0] && payload[0].value != null) {
    let datePart = label;
    let timePart = "";

    if (typeof label === "number") {
      const dt = new Date(label);
      // Format as DD-MM-YY
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const year = String(dt.getFullYear()).slice(-2);
      datePart = `${day}-${month}-${year}`;
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
          backgroundColor: '#000',
          border: `1px solid ${CRT_GREEN}`,
          padding: '8px',
          borderRadius: 0,
          fontFamily: 'Courier New',
        }}
      >
        <p style={{ color: CRT_GREEN, margin: 0 }}>{payload[0].value.toFixed(2)}%</p>
        <p style={{ color: CRT_GREEN, margin: 0 }}>{timePart}</p>
        <p style={{ color: CRT_GREEN, margin: 0 }}>{datePart}</p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;