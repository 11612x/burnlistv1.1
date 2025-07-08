/**
 * TickerRow.jsx
 * Patch summary:
 * - Update comment on return percentage calculation to clarify that it uses timeframe-sliced historical data.
 * - The return percentage now clearly reflects, "How did this asset perform from the start of the selected timeframe?"
 */
import React from "react";

const TickerRow = ({
  item, index, editMode, buyPrices, handleChangeSymbol,
  handleBuyPriceChange, handleDelete, items, changePercent
}) => {
  const getSymbolWithStars = (symbol, index) => {
    const totalCount = items.filter((it) => it.symbol === symbol).length;
    if (totalCount > 1) {
      const countBefore = items.slice(0, index).filter((it) => it.symbol === symbol).length;
      const stars = "*".repeat(countBefore + 1);
      return symbol + stars;
    }
    return symbol;
  };

  if (!item || !Array.isArray(item.historicalData)) {
    console.warn("⛔ Invalid item or missing historicalData for row", item);
    return null;
  }

  const userBuy = buyPrices && typeof buyPrices === "object" ? buyPrices[item.symbol] : undefined;
  let buy;

  if (userBuy !== undefined && userBuy !== "") {
    buy = Number(userBuy);
  } else if (typeof item.buyPrice === "number") {
    buy = item.buyPrice;
  } else if (Array.isArray(item.historicalData) && item.historicalData.length > 0) {
    buy = item.historicalData[0].price;
    console.warn(`📦 [Fallback BuyPrice] Using first historical price for ${item.symbol}: ${buy}`);
  } else {
    console.warn(`⚠️ No valid buy price for ${item.symbol}`);
    buy = NaN;
  }

  if (isNaN(buy)) {
    console.warn(`⛔ Skipping row: No valid buy price resolved for ${item.symbol}`);
    return null;
  }

  const latestPrice = item.historicalData.at(-1)?.price;

  console.log(`✅ Rendering row for ${item.symbol}`);
  return (
    <tr key={index} style={{ borderBottom: "1px solid #0de309" }}>
      <td style={{ padding: 8 }}>
        {editMode ? (
          <input
            type="text"
            value={item.symbol}
            onChange={(e) => handleChangeSymbol(index, e.target.value)}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: "black",
              border: "1px solid #0de309",
              color: "#0de309",
              padding: 4,
              width: 80,
              textTransform: "uppercase",
            }}
          />
        ) : (
          <>
            {item.incomplete && <span style={{ marginRight: 4 }}>⚠️</span>}
            {getSymbolWithStars(item.symbol, index)}
          </>
        )}
      </td>
      <td style={{ padding: 8 }}>
        {!isNaN(buy) ? buy.toFixed(2) : "-"}
      </td>
      <td style={{ padding: 8 }}>
        {!isNaN(latestPrice) ? latestPrice.toFixed(2) : "-"}
      </td>
      <td style={{ padding: 8 }}>
        {(typeof changePercent === "number" && isFinite(changePercent)) ? (
          <span title="Simulated return over selected timeframe">
            {changePercent.toFixed(2)}%
          </span>
        ) : (
          (console.warn(`⚠️ Skipping return display for ${item.symbol}: changePercent =`, changePercent), "–")
        )}
      </td>
      {editMode && (
        <td style={{ padding: 8 }}>
          <button
            onClick={() => handleDelete(index)}
            style={{
              backgroundColor: "#e31507",
              color: "black",
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            Delete
          </button>
        </td>
      )}
      <td />
    </tr>
  );
};

export default TickerRow;