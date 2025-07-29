import React, { useState, useMemo } from "react";
import { useAverageReturn } from "@hooks/useAverageReturn";
import TickerRow from "@components/TickerRow";
import { useSortedItems } from "@hooks/useSortedItems";
import { getReturnInTimeframe, getSlicedData } from "@logic/portfolioUtils";
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const TickerTable = ({
  items,
  editMode,
  handleChangeSymbol,
  handleBuyPriceChange,
  handleBuyDateChange,
  handleDelete,
  handleRefreshPrice,
  selectedTimeframe,
}) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  if (!Array.isArray(items)) {
    console.warn("\u26a0\ufe0f TickerTable received invalid items prop:", items);
    return null;
  }
  // State to keep track of sorting configuration: key and direction
  const [sortConfig, setSortConfig] = useState({ key: "symbol", direction: "asc" });

  // Toggle sort direction or set new key when a header is clicked
  const handleSort = (key) => {
    console.log(`\ud83e\udded handleSort triggered for key: ${key}`);
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
    return sortConfig.direction === "asc" ? "\u2191" : "\u2193";
  };

  // Get sorted items based on current sort configuration
  const sortedItems = useSortedItems(items, sortConfig);

  // Calculate average return from sorted items using custom hook
  const averageReturn = useAverageReturn(sortedItems);

  // Debug average return value
  console.log("\ud83d\udcca Average return from sortedItems:", averageReturn);

  // If a global setter function exists, update it with the latest average return
  if (typeof window !== "undefined" && typeof window.setWatchlistAverageReturn === "function") {
    window.setWatchlistAverageReturn(averageReturn);
  }

  return (
    <div style={{
      width: "100%",
      overflowX: "auto",
      border: `1px solid ${green}`,
      background: black,
      fontFamily: 'Courier New',
      '@media (max-width: 768px)': {
        fontSize: '12px',
      },
      '@media (max-width: 480px)': {
        fontSize: '10px',
      }
    }}>
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse", 
        color: green, 
        background: black, 
        fontFamily: 'Courier New',
        minWidth: '600px', // Ensure table doesn't get too cramped
        '@media (max-width: 768px)': {
          minWidth: '500px',
        },
        '@media (max-width: 480px)': {
          minWidth: '400px',
        }
      }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${green}` }}>
            {/* Column headers with clickable sorting functionality */}
            <th onClick={() => handleSort("symbol")} style={{ 
              cursor: "pointer", 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '60px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '50px',
              }
            }}>
              Symbol {renderSortArrow("symbol")}
            </th>
            <th onClick={() => handleSort("buyPrice")} style={{ 
              cursor: "pointer", 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '80px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '60px',
              }
            }}>
              Buy Price {renderSortArrow("buyPrice")}
            </th>
            <th style={{ 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '80px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '60px',
              }
            }}>
              Buy Date
            </th>
            <th onClick={() => handleSort("currentPrice")} style={{ 
              cursor: "pointer", 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '80px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '60px',
              }
            }}>
              Current Price {renderSortArrow("currentPrice")}
            </th>
            <th onClick={() => handleSort("changePercent")} style={{ 
              cursor: "pointer", 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '80px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '60px',
              }
            }}>
              Change % {renderSortArrow("changePercent")}
            </th>
            {/* Show Actions column only if edit mode is enabled */}
            {editMode && <th style={{ 
              padding: '8px 4px', 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              minWidth: '80px',
              '@media (max-width: 480px)': {
                padding: '4px 2px',
                minWidth: '60px',
              }
            }}>Actions</th>}
            <th style={{ 
              textAlign: "left", 
              color: green, 
              borderBottom: `1px solid ${green}`, 
              fontFamily: 'Courier New', 
              background: black,
              width: '20px',
              '@media (max-width: 480px)': {
                width: '10px',
              }
            }} />
          </tr>
        </thead>
        <tbody>
          {/* Render each sorted item as a TickerRow component */}
          {sortedItems.map((item, index) => {
            console.log(`🩹 Rendering row for ${item.symbol}`);
            // Safely resolve buyPrice
            let resolvedBuyPrice;
            if (typeof item.buyPrice === "number") {
              resolvedBuyPrice = item.buyPrice;
            } else if (Array.isArray(item.historicalData) && item.historicalData.length > 0) {
              resolvedBuyPrice = item.historicalData[0].price; // likely a mock stock
            } else if (typeof item.currentPrice === "number") {
              resolvedBuyPrice = item.currentPrice; // fallback for real stock on first fetch
            }

          if (!item.historicalData || item.historicalData.length === 0) {
            return null;
          }

          if (
            typeof resolvedBuyPrice === "undefined" ||
            !item.buyDate ||
            !item.historicalData ||
            !Array.isArray(item.historicalData) ||
            item.historicalData.length === 0
          ) {
            console.warn(`\u26a0\ufe0f Invalid ticker data for ${item.symbol}. Skipping row.`, item);
            return null;
          }

          // Calculate timeframe-based return percentage (same as header)
          const validBuyDate = item.buyDate && new Date(item.buyDate).toString() !== 'Invalid Date' ? item.buyDate : null;
          const { startPoint, endPoint } = getSlicedData(item.historicalData, selectedTimeframe, validBuyDate, item.symbol, item.buyPrice);
          
          let changePercent = 0;
          let lookedUpBuyPrice = item.buyPrice; // Default to original buy price
          

          
          if (startPoint && endPoint && typeof startPoint.price === "number" && typeof endPoint.price === "number" && startPoint.price > 0) {
            changePercent = ((endPoint.price - startPoint.price) / startPoint.price) * 100;
            lookedUpBuyPrice = startPoint.price; // Use the looked-up price
            console.log(`[Table %] ${item.symbol}: startPoint: ${startPoint.price}, endPoint: ${endPoint.price}, changePercent: ${changePercent}%`);
            console.log(`[Table Price] ${item.symbol}: lookedUpBuyPrice: ${lookedUpBuyPrice}`);
          }

                      return (
              <TickerRow
                key={`${item.symbol}-${index}`}
                item={{ ...item }}
                index={index}
                editMode={editMode}
                handleChangeSymbol={handleChangeSymbol}
                handleBuyPriceChange={typeof handleBuyPriceChange === 'function' ? handleBuyPriceChange : undefined}
                handleBuyDateChange={typeof handleBuyDateChange === 'function' ? handleBuyDateChange : undefined}
                handleDelete={typeof handleDelete === 'function' ? handleDelete : undefined}
                handleRefreshPrice={typeof handleRefreshPrice === 'function' ? handleRefreshPrice : undefined}
                items={items}
                selectedTimeframe={selectedTimeframe}
                changePercent={changePercent}
                lookedUpBuyPrice={lookedUpBuyPrice}
              />
            );
        })}
      </tbody>
    </table>
    </div>
  );
};

export default React.memo(TickerTable);