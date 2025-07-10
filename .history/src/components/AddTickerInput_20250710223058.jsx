import React from "react";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';

// ⚠️ Ensure handleBulkAdd validates ticker format:
// should call isValidTicker(ticker) before use.

const AddTickerInput = ({ bulkSymbols, setBulkSymbols, handleBulkAdd, buyDate, setBuyDate, buyPrice, setBuyPrice, setWatchlists, editMode, watchlists }) => (
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

          const slugMatch = window.location.pathname.split("/").pop();
          const existingItems = watchlists && Object.values(watchlists).find(w => w.slug === slugMatch)?.items || [];
          const existingSymbols = new Set(existingItems.map(i => i.symbol));

          const newItems = [];
          for (const rawSymbol of validSymbols) {
            const symbol = normalizeSymbol(rawSymbol);
            if (existingSymbols.has(symbol)) {
              console.warn(`⚠️ Skipping duplicate symbol: ${symbol}`);
              continue;
            }
            // Use buyPrice and buyDate only in editMode, otherwise let API assign defaults
            const price = editMode && typeof buyPrice === 'number' && !isNaN(buyPrice) ? buyPrice : undefined;
            const fallbackFromApi = !editMode && !price;
            const date = editMode && buyDate ? buyDate : undefined;

            const item = await createTicker(
              symbol,
              symbol.startsWith("#") ? "mock" : "real",
              price,
              date
            );
            if (!item) {
              console.warn(`❌ createTicker returned null for symbol: ${symbol}`);
              continue;
            }
            if (fallbackFromApi && item?.historicalData?.[0]?.price) {
              item.buyPrice = Number(item.historicalData[0].price);
            }
            // Skip tickers with invalid buyPrice
            if (typeof item.buyPrice !== 'number' || item.buyPrice === 0) {
              console.warn(`❌ Skipping ${symbol}: buyPrice is still 0 after fetch.`);
              continue;
            }
            if (item) {
              console.log("🔍 Created item buyPrice check:", item.symbol, item.buyPrice);
              newItems.push(item);
            } else {
              console.warn("❌ Failed to create ticker:", symbol);
            }
          }

          if (typeof setWatchlists === 'function') {
            const updatedObject = { ...watchlists };
            for (const id in updatedObject) {
              if (updatedObject[id].slug === slugMatch) {
                updatedObject[id] = {
                  ...updatedObject[id],
                  items: [...(updatedObject[id].items || []), ...newItems.map(i => ({
                    ...i,
                    buyPrice: typeof i.buyPrice === 'number' ? i.buyPrice : 0
                  }))]
                };
                console.log("🔍 Pre-setWatchlists buyPrices:", updatedObject[id].items.map(i => ({ symbol: i.symbol, buyPrice: i.buyPrice })));
              }
            }

            try {
              localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedObject));
            } catch (e) {
              console.error("❌ Failed to save to localStorage:", e);
            }

            if (!updatedObject || typeof updatedObject !== "object") {
              console.error("❌ updatedObject is invalid before calling setWatchlists");
            } else {
              console.log("✅ Final watchlist structure before setWatchlists:", updatedObject);
              setWatchlists(updatedObject);
            }
          }

          for (const item of newItems) {
            if (!item.buyDate || isNaN(new Date(item.buyDate))) {
              console.error("❌ Invalid buyDate in item:", item);
            }
          }

          // Ensure the newItems are reflected in UI by calling optional handler
          if (typeof handleBulkAdd === "function") {
            console.log("🧪 Calling handleBulkAdd with:", newItems);
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
