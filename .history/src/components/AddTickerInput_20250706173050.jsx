import React from "react";

// ⚠️ Ensure handleBulkAdd validates ticker format:
// should call isValidTicker(ticker) before use.

const AddTickerInput = ({ bulkSymbols, setBulkSymbols, handleBulkAdd, buyDate, setBuyDate, buyPrice, setBuyPrice }) => (
  <div style={{ marginTop: 20 }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <textarea
        value={bulkSymbols}
        onChange={(e) => setBulkSymbols(e.target.value)}
        placeholder="e.g. SPY, QQQ, UBER"
        rows={1}
        style={{
          flex: 1,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1rem",
          backgroundColor: "black",
          border: "1px solid #0de309",
          color: "#0de309",
          padding: 8,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <input
        type="number"
        placeholder="Buy Price"
        step="0.01"
        onChange={(e) => {
          const price = parseFloat(e.target.value);
          console.log("💵 Entered Buy Price:", price);
          setBuyPrice(price);
        }}
        style={{
          marginLeft: 8,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1rem",
          backgroundColor: "black",
          border: "1px solid #0de309",
          color: "#0de309",
          padding: 8,
        }}
      />
      <input
        type="date"
        onChange={(e) => {
          const selectedDate = e.target.value;
          console.log("🛒 Selected Buy Date:", selectedDate);
          setBuyDate(selectedDate);
        }}
        style={{
          marginLeft: 8,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1rem",
          backgroundColor: "black",
          border: "1px solid #0de309",
          color: "#0de309",
          padding: 8,
        }}
      />
      <button
        onClick={() => {
          if (!bulkSymbols.trim()) return;
          if (!buyPrice || !buyDate) {
            console.warn("⚠️ Buy Price and Buy Date are required.");
            return;
          }

          console.log("📦 Adding Tickers:", bulkSymbols);
          console.log("📅 With Buy Date:", buyDate);
          console.log("💵 With Buy Price:", buyPrice);

          const tickers = bulkSymbols.split(",").map((sym) => sym.trim().toUpperCase()).filter(Boolean);

          const existing = JSON.parse(localStorage.getItem("burnlist-buyPrices") || "{}");
          tickers.forEach((symbol) => {
            existing[symbol] = { price: buyPrice, date: buyDate };
          });
          localStorage.setItem("burnlist-buyPrices", JSON.stringify(existing));

          handleBulkAdd();
        }}
        style={{
          marginLeft: 8,
          backgroundColor: "#0de309",
          color: "black",
          border: "none",
          padding: "8px 16px",
          cursor: "pointer",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1rem",
        }}
      >
        +++
      </button>
    </div>
  </div>
);

export default AddTickerInput;
