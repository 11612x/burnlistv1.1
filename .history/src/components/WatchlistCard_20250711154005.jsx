import React from 'react';
import WatchlistChart from './WatchlistChart';
import CustomButton from './CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

const WatchlistCard = React.memo(({
  item,
  idx,
  editMode,
  lastReturn,
  chartColor,
  selectedTimeframe,
  handleUpdateWatchlistName,
  handleUpdateWatchlistReason,
  handleDeleteWatchlist,
  view,
}) => {
  const tickers = item.items || [];
  // Risk indicator logic (copied from HomePage)
  let riskIndicator = tickers.length === 0 ? 'None' : 'LOW';
  if (tickers.length > 0) {
    const performances = tickers.map(t => {
      const data = t.historicalData;
      if (!Array.isArray(data) || data.length < 2) return { symbol: t.symbol, return: 0 };
      const start = data[0]?.price;
      const end = data[data.length - 1]?.price;
      if (typeof start !== 'number' || typeof end !== 'number' || start === 0) return { symbol: t.symbol, return: 0 };
      const returnPercent = ((end - start) / start) * 100;
      return { symbol: t.symbol, return: returnPercent };
    });
    const maxLoss = Math.min(...performances.map(p => p.return));
    const maxGain = Math.max(...performances.map(p => p.return));
    const volatility = maxGain - maxLoss;
    if (maxLoss < -20 || volatility > 50) riskIndicator = 'HIGH';
    else if (maxLoss < -10 || volatility > 30) riskIndicator = 'MED';
    else riskIndicator = 'LOW';
  }
  // Last update logic
  let lastUpdate = 'Unknown';
  if (tickers.length > 0) {
    const timestamps = tickers.flatMap(t =>
      t.historicalData?.map(d => new Date(d.timestamp).getTime()) || []
    );
    if (timestamps.length > 0) {
      const latest = Math.max(...timestamps);
      const now = Date.now();
      const diffHours = Math.floor((now - latest) / (1000 * 60 * 60));
      if (diffHours < 1) lastUpdate = 'Just now';
      else if (diffHours < 24) lastUpdate = `${diffHours}h ago`;
      else lastUpdate = `${Math.floor(diffHours / 24)}d ago`;
    }
  }
  const returnColor = lastReturn >= 0 ? CRT_GREEN : '#e31507';
  return (
    <div style={{
      width: 252,
      height: editMode ? 250 : (view === 'graph' ? 220 : 120),
      fontFamily: 'Courier New',
      background: 'transparent',
      padding: '10px 8px',
      margin: 0,
      border: `1px solid ${CRT_GREEN}`,
      borderRadius: 0,
      boxShadow: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Name (editable) */}
      {editMode ? (
        <input
          value={item.name}
          onChange={e => handleUpdateWatchlistName(item.id, e.target.value)}
          style={{
            fontFamily: 'Courier New',
            fontSize: 18,
            color: CRT_GREEN,
            background: 'black',
            border: '1px solid #333',
            marginBottom: 4,
            padding: '2px 4px',
            width: '100%',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />
      ) : (
        <div style={{ fontSize: 18, color: CRT_GREEN, fontWeight: 'bold', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name || `PORTFOLIO ${idx + 1}`}
        </div>
      )}
      {/* Delete button (only in edit mode) */}
      {editMode && (
        <CustomButton
          onClick={() => handleDeleteWatchlist(item.id)}
          style={{
            backgroundColor: 'black',
            color: '#e31507',
            border: '1px solid #e31507',
            fontSize: 12,
            width: '100%',
            fontWeight: 'bold',
            marginBottom: 4,
            marginTop: 2,
          }}
        >
          DELETE
        </CustomButton>
      )}
      {/* Reason (editable) */}
      {editMode ? (
        <input
          value={item.reason || ''}
          onChange={e => handleUpdateWatchlistReason(item.id, e.target.value)}
          style={{
            fontFamily: 'Courier New',
            fontSize: 14,
            color: CRT_GREEN,
            background: 'black',
            border: '1px solid #333',
            marginBottom: 4,
            padding: '2px 4px',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          placeholder="Reason..."
        />
      ) : (
        <div style={{ fontSize: 14, color: CRT_GREEN, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.reason || 'N/A'}
        </div>
      )}
      {/* Portfolio info */}
      <div style={{ fontSize: 13, color: CRT_GREEN, marginBottom: 2 }}>
        {tickers.length} stocks | Risk: {riskIndicator}
      </div>
      {/* Last update */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {lastUpdate}
      </div>
      {/* Return percent in terminal view */}
      {view !== 'graph' && tickers.length > 0 && (
        <div style={{ fontSize: 19, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
          {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
        </div>
      )}
      {/* Sparkline with frame only in graph view */}
      {view === 'graph' && tickers.length > 0 && (
        <>
          {/* Return (moved just above chart) */}
          <div style={{ fontSize: 19, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
            {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
          </div>
          <div style={{
            width: 180,
            height: 94,
            alignSelf: 'flex-end',
            border: `1.5px solid ${CRT_GREEN}`,
            borderRadius: 0,
            background: '#000',
            padding: 1,
            marginTop: 'auto', // push to bottom
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end'
          }}>
            <WatchlistChart
              portfolioReturnData={tickers.map(t => ({
                symbol: t.symbol,
                buyDate: t.buyDate,
                historicalData: t.historicalData,
                timeframe: selectedTimeframe
              }))}
              showBacktestLine={false}
              height={94}
              lineColor={chartColor}
              hideAxes={true}
              hideBorder={true}
              showTooltip={false}
              mini={true}
            />
          </div>
        </>
      )}
    </div>
  );
});

export default WatchlistCard; 