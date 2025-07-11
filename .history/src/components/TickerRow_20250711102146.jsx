/**
 * TickerRow.jsx
 * Patch summary:
 * - Update comment on return percentage calculation to clarify that it uses timeframe-sliced historical data.
 * - The return percentage now clearly reflects, "How did this asset perform from the start of the selected timeframe?"
 */
import React from "react";

const TickerRow = ({
  item, index, editMode,
  handleChangeSymbol, handleBuyPriceChange, handleDelete, items, changePercent
}) => {
  console.log("🧩 TickerRow received item:", item);
  console.log("📦 Historical Data:", item.historicalData);

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

  // Always use original buy-in price for Buy Price
  let buy = !isNaN(Number(item.buyPrice))
    ? Number(item.buyPrice)
    : (item.historicalData.length > 0 ? Number(item.historicalData[0]?.price) : NaN);

  // Always use latest price for Current Price
  const latestRaw = item.historicalData.at(-1)?.price;
  const latestPrice = !isNaN(Number(latestRaw)) ? Number(latestRaw) : NaN;

  console.log(`💵 Buy price for ${item.symbol}:`, buy);
  console.log(`📈 Latest price for ${item.symbol}:`, latestPrice);

  if (isNaN(buy)) {
    console.warn(`⛔ Skipping row: No valid buy price resolved for ${item.symbol}`);
    return null;
  }

  // Log the changePercent prop for traceability
  console.log(`📊 [ChangePercent Prop] ${item.symbol}:`, changePercent);
  console.log(`✅ Rendering row for ${item.symbol}`);
  return (
    <tr key={index} style={{ borderBottom: "1px solid #7FBAA1", background: 'black' }}>
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: "#fff" }}>
        {editMode ? (
          <input
            type="text"
            value={item.symbol}
            onChange={(e) => handleChangeSymbol(index, e.target.value)}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: "black",
              border: "1px solid #7FBAA1",
              color: "#7FBAA1",
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
      {/* Buy Price: always original buy-in price */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: "#fff" }}>
        {!isNaN(buy) ? buy.toFixed(2) : "-"}
      </td>
      {/* Current Price: always latest price */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: "#fff" }}>
        {!isNaN(latestPrice) ? latestPrice.toFixed(2) : "-"}
      </td>
      {/* % Change: still updates per timeframe */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: "#fff" }}>
        {
          (() => {
            const parsedChange = Number(changePercent);
            const isValidChange = isFinite(parsedChange);

            return isValidChange ? (
              <span
                title="Simulated return over selected timeframe"
                style={{
                  color: parsedChange >= 0 ? "#7FBAA1" : "#e31507",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {parsedChange.toFixed(2)}%
              </span>
            ) : (
              <>
                {console.warn("⚠️ Missing or invalid changePercent for", item.symbol)}
                <span
                  title="Change % not available"
                  style={{
                    color: "#888888",
                    fontFamily: "'Courier New', Courier, monospace"
                  }}
                >
                  0.00%
                </span>
              </>
            )
          })()
        }
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