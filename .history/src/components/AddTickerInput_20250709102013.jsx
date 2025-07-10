import React from "react";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';

// ⚠️ Ensure handleBulkAdd validates ticker format:
// should call isValidTicker(ticker) before use.

const AddTickerInput = ({ bulkSymbols, setBulkSymbols, handleBulkAdd, buyDate, setBuyDate, buyPrice, setBuyPrice, setWatchlists, editMode }) => (
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
          backgroundColor: "#000000",
          border: "1px solid rgb(127, 186, 161)",
          color: "rgb(127, 186, 161)",
          padding: 8,
          resize: "none", // disable resizing
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      />
      {editMode && (
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
            backgroundColor: "#000000",
            border: "1px solid rgb(127, 186, 161)",
            color: "rgb(127, 186, 161)",
            padding: 8,
            cursor: "pointer",
          }}
        />
      )}
      {editMode && (
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
            backgroundColor: "#000000",
            border: "1px solid rgb(127, 186, 161)",
            color: "rgb(127, 186, 161)",
            padding: 8,
            cursor: "pointer",
          }}
        />
      )}
      <button
        onClick={async () => {
          if (!bulkSymbols.trim()) {
            console.warn("⚠️ Please enter at least one ticker symbol.");
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

          const slugMatch = window.location.pathname.split("/").pop();

          setWatchlists((prevWatchlists) => {
            const updated = prevWatchlists.map((w) => {
              if (w.slug === slugMatch) {
                return {
                  ...w,
                  items: [...(w.items || []), ...newItems]
                };
              }
              return w;
            });
            try {
              localStorage.setItem("burnlist_watchlists", JSON.stringify(updated));
              return Array.isArray(updated) ? updated : [];
            } catch (e) {
              console.error("❌ Failed to save to localStorage:", e);
              return [];
            }
          });

          // Ensure the newItems are reflected in UI by calling optional handler
          if (typeof handleBulkAdd === "function") {
            handleBulkAdd(newItems);
          } else {
            console.warn("⚠️ handleBulkAdd is not a function");
          }
        }}
        title="Add ticker(s)"
        style={{
          marginLeft: 8,
          backgroundColor: "rgb(127, 186, 161)",
          color: "black",
          border: "none",
          padding: "8px 16px",
          cursor: "pointer",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1rem",
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgb(127, 186, 161)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgb(127, 186, 161)'}
      >
        +++
      </button>
    </div>
  </div>
);

export default AddTickerInput;
