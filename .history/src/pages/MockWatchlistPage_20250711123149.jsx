import React, { useState, useEffect } from 'react';
import WatchlistHeader from '@components/WatchlistHeader';
import WatchlistChart from '@components/WatchlistChart';
import TimeframeSelector from '@components/TimeframeSelector';
import TickerTable from '@components/TickerTable';
import { useAverageReturn } from '@hooks/useAverageReturn';
import { generateFixedMockWatchlist } from '@data/mockTickerGenerator';

const MOCK_KEY = 'burnlist_mock_watchlist';

const MockWatchlistPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('D');
  const [watchlist, setWatchlist] = useState(null);

  useEffect(() => {
    // Try to load from localStorage
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(MOCK_KEY));
    } catch (e) {
      stored = null;
    }
    if (stored && stored.items && Array.isArray(stored.items) && stored.items.length > 0) {
      setWatchlist(stored);
    } else {
      // Generate and save new mock watchlist
      const mock = generateFixedMockWatchlist({ numTickers: 4, days: 130, pointsPerDay: 25 });
      setWatchlist(mock);
      localStorage.setItem(MOCK_KEY, JSON.stringify(mock));
    }
  }, []);

  const averageReturn = useAverageReturn(watchlist?.items || [], selectedTimeframe);

  if (!watchlist) {
    return <div style={{ color: '#FFA500', background: 'black', padding: 40, fontFamily: 'Courier New' }}>Loading mock watchlist...</div>;
  }

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