import React, { useState } from 'react';
import { generateVolatileMockWatchlist } from '@data/mockTickerGenerator';
import WatchlistChart from '@components/WatchlistChart';
import TickerTable from '@components/TickerTable';
import TimeframeSelector from '@components/TimeframeSelector';

// MockWatchlistPage: For testing chart/table with volatile mock data only
const MockWatchlistPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('D');
  const mock = generateVolatileMockWatchlist();

  return (
    <div style={{ background: 'black', color: '#7FBAA1', minHeight: '100vh', fontFamily: 'Courier New', padding: 32 }}>
      <h2 style={{ color: '#7FBAA1', marginBottom: 24 }}>Mock Watchlist Test Page</h2>
      <div style={{ marginBottom: 24 }}>
        <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} />
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', marginBottom: 40 }}>
        <WatchlistChart
          portfolioReturnData={mock.items.map(item => ({
            symbol: item.symbol,
            buyDate: item.buyDate,
            historicalData: item.historicalData,
            timeframe: selectedTimeframe
          }))}
          showBacktestLine={false}
          height={400}
        />
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <TickerTable items={mock.items} selectedTimeframe={selectedTimeframe} />
      </div>
    </div>
  );
};

export default MockWatchlistPage; 