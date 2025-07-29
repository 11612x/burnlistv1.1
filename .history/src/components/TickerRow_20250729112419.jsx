/**
 * TickerRow.jsx
 * Patch summary:
 * - Update comment on return percentage calculation to clarify that it uses timeframe-sliced historical data.
 * - The return percentage now clearly reflects, "How did this asset perform from the start of the selected timeframe?"
 */
import React from "react";
import { useThemeColor } from '../ThemeContext';
import CustomButton from './CustomButton'; // Added import for CustomButton
import { formatDateEuropean } from '../utils/dateUtils';

const CRT_GREEN = 'rgb(140,185,162)';

const TickerRow = ({
  item, index, editMode,
  handleChangeSymbol, handleBuyPriceChange, handleBuyDateChange, handleDelete, handleRefreshPrice, items, changePercent, lookedUpBuyPrice
}) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  const red = useThemeColor('#e31507');
  console.log("🧩 TickerRow received item:", item);
  console.log("📦 Historical Data:", item.historicalData);

  if (!item || !Array.isArray(item.historicalData)) {
    console.warn("\u26d4 Invalid item or missing historicalData for row", item);
    return null;
  }

  // Always use original buy price for display - never change based on timeframe
  let buy = (!isNaN(Number(item.buyPrice))
    ? Number(item.buyPrice)
    : (item.historicalData.length > 0 ? Number(item.historicalData[0]?.price) : NaN));
  


  // Always use latest price for Current Price
  const latestRaw = item.historicalData.at(-1)?.price;
  const latestPrice = !isNaN(Number(latestRaw)) ? Number(latestRaw) : NaN;

  console.log(`💵 Buy price for ${item.symbol}:`, buy);
  console.log(`📈 Latest price for ${item.symbol}:`, latestPrice);

  if (isNaN(buy)) {
    console.warn(`\u26d4 Skipping row: No valid buy price resolved for ${item.symbol}`);
    return null;
  }

  // Log the changePercent prop for traceability
  console.log(`📊 [ChangePercent Prop] ${item.symbol}:`, changePercent);
  console.log(`✅ Rendering row for ${item.symbol}`);

  // Function to open ticker chart in new tab
  const handleTickerClick = (symbol) => {
    if (!symbol) return;
    const chartUrl = `https://elite.finviz.com/charts?t=${symbol.toUpperCase()}&p=d&l=1h1v`;
    window.open(chartUrl, '_blank');
  };

  return (
    <tr key={index} style={{ borderBottom: `1px solid ${green}`, background: black }}>
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: green, fontSize: 15 }}>
        {editMode ? (
          <input
            type="text"
            value={item.symbol}
            onChange={(e) => handleChangeSymbol(index, e.target.value)}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: black,
              border: `1px solid ${green}`,
              color: green,
              padding: 4,
              width: 80,
              textTransform: "uppercase",
            }}
          />
        ) : (
          <span
            onClick={() => handleTickerClick(item.symbol)}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={`Click to open ${item.symbol} chart in new tab`}
          >
            {(() => {
              const totalCount = items.filter((it) => it.symbol === item.symbol).length;
              if (totalCount > 1) {
                const countBefore = items.slice(0, index).filter((it) => it.symbol === item.symbol).length;
                const stars = "*".repeat(countBefore + 1);
                return item.symbol + stars;
              }
              return item.symbol;
            })()}
          </span>
        )}
      </td>
      {/* Buy Price: always original buy-in price */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: green, fontSize: 15 }}>
        {editMode ? (
          <input
            type="number"
            value={!isNaN(buy) ? buy : ''}
            step="0.01"
            min="0"
            onChange={e => {
              if (typeof handleBuyPriceChange === 'function') {
                handleBuyPriceChange(index, parseFloat(e.target.value));
              }
            }}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1rem",
              backgroundColor: black,
              border: `1px solid ${green}`,
              color: green,
              padding: 4,
              width: 80,
            }}
          />
        ) : (
          !isNaN(buy) ? buy.toFixed(2) : "-"
        )}
      </td>
      {/* Buy Date: editable in edit mode */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: green, fontSize: 15 }}>
        {editMode ? (
          <>
            <input
              type="date"
              value={item.buyDate ? item.buyDate.slice(0, 10) : ''}
              onChange={e => {
                if (typeof handleBuyDateChange === 'function') {
                  handleBuyDateChange(index, e.target.value);
                }
              }}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "1rem",
                backgroundColor: black,
                border: `1px solid ${green}`,
                color: green,
                padding: 4,
                width: 120,
              }}
            />
            <style>
              {`
                input[type="date"]::-webkit-calendar-picker-indicator {
                  filter: invert(1) brightness(0.8) sepia(1) saturate(5) hue-rotate(140deg);
                }
                input[type="date"]::-webkit-clear-button {
                  display: none !important;
                }
                input[type="date"]::-webkit-inner-spin-button {
                  display: none !important;
                }
              `}
            </style>
          </>
        ) : (
          formatDateEuropean(item.buyDate)
        )}
      </td>
      {/* Current Price: always latest price */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: green, fontSize: 15 }}>
        {!isNaN(latestPrice) ? latestPrice.toFixed(2) : "-"}
      </td>
      {/* % Change: still updates per timeframe */}
      <td style={{ padding: 8, fontFamily: "'Courier New', Courier, monospace", color: green, fontSize: 15 }}>
        {
          (() => {
            const parsedChange = Number(changePercent);
            const isValidChange = isFinite(parsedChange);

            return isValidChange ? (
              <span
                title="Simulated return over selected timeframe"
                style={{
                  color: parsedChange >= 0 ? green : red,
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {parsedChange.toFixed(2)}%
              </span>
            ) : (
              <>
                {console.warn("\u26a0\ufe0f Missing or invalid changePercent for", item.symbol)}
                <span
                  title="Change % not available"
                  style={{
                    color: useThemeColor('#888888'),
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <CustomButton
              onClick={() => {
                if (typeof handleRefreshPrice === 'function') {
                  handleRefreshPrice(index);
                }
              }}
              style={{
                background: 'transparent',
                color: green,
                border: `1px solid ${green}`,
                fontFamily: "'Courier New', monospace",
                textTransform: 'lowercase',
                fontWeight: 400,
                letterSpacing: 1,
                boxShadow: 'none',
                borderRadius: 2,
                fontSize: '0.8rem',
                padding: '2px 6px',
              }}
              title="Refresh buy price from historical data"
            >
              🔄
            </CustomButton>
            <CustomButton
              onClick={() => {
                if (typeof handleDelete === 'function') {
                  handleDelete(index);
                }
              }}
              style={{
                background: 'transparent',
                color: green,
                border: `1px solid ${green}`,
                fontFamily: "'Courier New', monospace",
                textTransform: 'lowercase',
                fontWeight: 400,
                letterSpacing: 1,
                boxShadow: 'none',
                borderRadius: 2,
              }}
            >
              delete
            </CustomButton>
          </div>
        </td>
      )}
      <td />
    </tr>
  );
};

export default React.memo(TickerRow);