import React, { useState, useMemo } from "react";
import { useAverageReturn } from "@hooks/useAverageReturn";
import TickerRow from "./TickerRow";
import { useSortedItems } from "../utils/useSortedItems";

const TickerTable = ({
  items,
  editMode,
  handleChangeSymbol,
  handleDelete,
  selectedTimeframe,
}) => {
  if (!Array.isArray(items)) {
    console.warn("⚠️ TickerTable received invalid items prop:", items);
    return null;
  }
  // State to keep track of sorting configuration: key and direction
  const [sortConfig, setSortConfig] = useState({ key: "symbol", direction: "asc" });

  // Toggle sort direction or set new key when a header is clicked
  const handleSort = (key) => {
    console.log(`🧭 handleSort triggered for key: ${key}`);
    setSortConfig((prev) => {
      if (prev.key === key) {
        // If the same key is clicked, toggle the direction
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Otherwise, set new key with ascending direction
      return { key, direction: "asc" };
    });
  };

  // Display sort direction arrow next to the sorted column header
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Get sorted items based on current sort configuration
  const sortedItems = useSortedItems(items, sortConfig);

  // Calculate average return from sorted items using custom hook
  const averageReturn = useAverageReturn(sortedItems);

  // Debug average return value
  console.log("📊 Average return from sortedItems:", averageReturn);

  // If a global setter function exists, update it with the latest average return
  if (typeof window !== "undefined" && typeof window.setWatchlistAverageReturn === "function") {
    window.setWatchlistAverageReturn(averageReturn);
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", color: "#0de309" }}>
      <thead>
        <tr>
          {/* Column headers with clickable sorting functionality */}
          <th onClick={() => handleSort("symbol")} style={{ cursor: "pointer", padding: 8, textAlign: "left" }}>
            Symbol {renderSortArrow("symbol")}
          </th>
          <th onClick={() => handleSort("buyPrice")} style={{ cursor: "pointer", padding: 8, textAlign: "left" }}>
            Buy Price {renderSortArrow("buyPrice")}
          </th>
          <th onClick={() => handleSort("currentPrice")} style={{ cursor: "pointer", padding: 8, textAlign: "left" }}>
            Current Price {renderSortArrow("currentPrice")}
          </th>
          <th onClick={() => handleSort("changePercent")} style={{ cursor: "pointer", padding: 8, textAlign: "left" }}>
            Change % {renderSortArrow("changePercent")}
          </th>
          {/* Show Actions column only if edit mode is enabled */}
          {editMode && <th style={{ padding: 8, textAlign: "left" }}>Actions</th>}
          <th style={{ textAlign: "left" }} />
        </tr>
      </thead>
      <tbody>
        {/* Render each sorted item as a TickerRow component */}
        {sortedItems.map((item, index) => {
          console.log(`🧩 Rendering row for ${item.symbol}`);
          // Safely resolve buyPrice
          let resolvedBuyPrice;
          if (typeof item.buyPrice === "number") {
            resolvedBuyPrice = item.buyPrice;
          } else if (Array.isArray(item.historicalData) && item.historicalData.length > 0) {
            resolvedBuyPrice = item.historicalData[0].price; // likely a mock stock
          } else if (typeof item.currentPrice === "number") {
            resolvedBuyPrice = item.currentPrice; // fallback for real stock on first fetch
          }

          if (typeof resolvedBuyPrice === "undefined") {
            console.warn(`⚠️ Missing resolvedBuyPrice for ${item.symbol}, skipping row.`);
            return null;
          }

          let buyPriceFromStorage;
          try {
            const stored = JSON.parse(localStorage.getItem("burnlist-buyPrices")) || {};
            if (!stored[item.symbol]) {
              stored[item.symbol] = resolvedBuyPrice;
              localStorage.setItem("burnlist-buyPrices", JSON.stringify(stored));
            }
            buyPriceFromStorage = stored[item.symbol] ?? resolvedBuyPrice;
          } catch (e) {
            console.warn(`⚠️ Error accessing buyPrices for ${item.symbol}:`, e);
            buyPriceFromStorage = resolvedBuyPrice;
          }

          return (
            <TickerRow
              key={`${item.symbol}-${index}`}
              item={{ ...item, buyPrice: buyPriceFromStorage }}
              index={index}
              editMode={editMode}
              handleChangeSymbol={handleChangeSymbol}
              handleDelete={handleDelete}
              items={items}
              selectedTimeframe={selectedTimeframe}
            />
          );
        })}
      </tbody>
    </table>
  );
};

export default TickerTable;