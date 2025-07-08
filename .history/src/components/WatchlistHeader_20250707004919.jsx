import React from "react";

const WatchlistHeader = ({ name, timeframe, averageReturn, selected }) => {
  // Debug: log the incoming averageReturn value and warn if invalid
  console.log("📌 Header received return:", averageReturn);
  if (typeof averageReturn !== "number" || isNaN(averageReturn)) {
    console.warn("⚠️ WatchlistHeader: averageReturn is invalid or missing.");
  }

  const returnPercent =
    typeof averageReturn === "number" && isFinite(averageReturn)
      ? averageReturn
      : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: 20,
        width: "fit-content",
        marginRight: 30
      }}
    >
      <div style={{ maxWidth: 200 }}>
        <div>
          <h1 style={{ margin: 0, whiteSpace: "nowrap" }}>{name}</h1>
          {returnPercent !== null && (
            <div
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 16,
                marginTop: 4,
                color: returnPercent >= 0 ? "#0de309" : "#e31507"
              }}
            >
              <span>
                {returnPercent.toFixed(2)}%{" "}
                <span style={{ fontSize: 13, color: "#999" }}>
                  ({selected?.toUpperCase() || "N/A"})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistHeader;