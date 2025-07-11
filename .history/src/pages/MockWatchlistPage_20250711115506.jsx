import React, { useState } from 'react';
import WatchlistHeader from '@components/WatchlistHeader';
import WatchlistChart from '@components/WatchlistChart';
import TimeframeSelector from '@components/TimeframeSelector';
import TickerTable from '@components/TickerTable';
import { useAverageReturn } from '@hooks/useAverageReturn';
import { generateFixedMockWatchlist } from '@data/mockTickerGenerator';

const MockWatchlistPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('D');
  const watchlist = generateFixedMockWatchlist();
  const averageReturn = useAverageReturn(watchlist.items, selectedTimeframe);

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: '#FFA500' }}>
      {/* DEV MODE BANNER */}
      <div style={{ background: '#FFA500', color: 'black', fontWeight: 'bold', textAlign: 'center', padding: '12px 0', fontFamily: 'Courier New', letterSpacing: 2 }}>
        DEV MODE: MOCK WATCHLIST (ORANGE = DEV)
      </div>
      {/* Header Section */}
      <div style={{ padding: '20px 20px 0 20px', marginBottom: '100px' }}>
        <WatchlistHeader name={watchlist.name} averageReturn={averageReturn} selected={selectedTimeframe} color="#FFA500" />
      </div>
      {/* Main Content Section - starts after header */}
      <div style={{ padding: '20px' }}>
        {/* Chart height: edit the value below to change the chart size */}
        <WatchlistChart
          portfolioReturnData={watchlist.items.map(item => ({
            symbol: item.symbol,
            buyDate: item.buyDate,
            historicalData: item.historicalData,
            timeframe: selectedTimeframe
          }))}
          showBacktestLine={false}
          height={500}
          lineColor="#FFA500"
          // Optionally, you can add referenceLine={0} to see the zero line
        />
        <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} color="#FFA500" />
        {Array.isArray(watchlist.items) && watchlist.items.length > 0 ? (
          <div style={{ maxWidth: 900, margin: '40px auto 0 auto' }}>
            <TickerTable items={watchlist.items} selectedTimeframe={selectedTimeframe} color="#FFA500" />
          </div>
        ) : (
          <div style={{ fontFamily: 'Courier New, monospace', color: '#999', textAlign: 'center', marginTop: '20px' }}>
            ⚠️ No valid data to display yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MockWatchlistPage; 