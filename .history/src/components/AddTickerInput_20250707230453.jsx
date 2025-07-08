import React from "react";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';

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
        onClick={async () => {
          if (!bulkSymbols.trim()) return;
          if (!buyPrice || !buyDate) {
            console.warn("⚠️ Buy Price and Buy Date are required.");
            return;
          }

          console.log("📦 Adding Tickers:", bulkSymbols);
          console.log("📅 With Buy Date:", buyDate);
          console.log("💵 With Buy Price:", buyPrice);

          const rawSymbols = bulkSymbols.split(",").map((sym) => sym.trim());
          const validSymbols = rawSymbols.filter(isValidTicker);

          const newItems = [];
          for (const rawSymbol of validSymbols) {
            const symbol = normalizeSymbol(rawSymbol);
            const item = await createTicker(symbol, symbol.startsWith("#") ? "mock" : "real", buyPrice, buyDate);
            if (item) {
              newItems.push(item);
            } else {
              console.warn("❌ Failed to create ticker:", symbol);
            }
          }

          localStorage.setItem("burnlist-items", JSON.stringify(newItems));
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
