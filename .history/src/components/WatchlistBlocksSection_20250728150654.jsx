import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import WatchlistBlock from './WatchlistBlock';
import { calculateETFPrice } from '../utils/portfolioUtils';
import { useAverageReturn } from '../hooks/useAverageReturn';

const CRT_GREEN = 'rgb(140,185,162)';

const WatchlistBlocksSection = () => {
  const { isInverted } = useTheme();
  const [watchlists, setWatchlists] = useState({});
  const [showSection, setShowSection] = useState(true);

  // Load watchlists from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWatchlists(parsed);
      }
    } catch (error) {
      console.error("Failed to load watchlists:", error);
    }
  }, []);

  // Get watchlists created from screeners
  const screenerWatchlists = Object.values(watchlists).filter(watchlist => 
    watchlist.reason && watchlist.reason.includes('Created from screener')
  );

  if (screenerWatchlists.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginTop: '40px',
      marginBottom: '40px',
      padding: '20px',
      border: `2px solid ${CRT_GREEN}`,
      borderRadius: '4px',
      backgroundColor: isInverted ? 'rgba(140,185,162,0.05)' : '#0a0a0a'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: `1px solid ${CRT_GREEN}`
      }}>
        <div>
          <h2 style={{
            color: CRT_GREEN,
            margin: 0,
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: "'Courier New', monospace"
          }}>
            SCREENER WATCHLISTS
          </h2>
          <p style={{
            color: '#888',
            margin: '4px 0 0 0',
            fontSize: '12px',
            fontFamily: "'Courier New', monospace"
          }}>
            {screenerWatchlists.length} watchlist{screenerWatchlists.length !== 1 ? 's' : ''} created from screeners
          </p>
        </div>
        <button
          onClick={() => setShowSection(!showSection)}
          style={{
            background: 'none',
            border: 'none',
            color: CRT_GREEN,
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '2px',
            border: `1px solid ${CRT_GREEN}`
          }}
        >
          {showSection ? 'HIDE' : 'SHOW'}
        </button>
      </div>

      {/* Watchlist Blocks Grid */}
      {showSection && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gap: '12px'
          }
        }}>
          {screenerWatchlists.map(watchlist => {
            // Calculate average return for this watchlist
            const averageReturn = useAverageReturn(watchlist.items || [], 'D');
            
            // Calculate ETF price data for this watchlist
            const etfPriceData = calculateETFPrice(watchlist.items || []);

            return (
              <WatchlistBlock
                key={watchlist.id}
                watchlist={watchlist}
                averageReturn={averageReturn}
                etfPriceData={etfPriceData}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WatchlistBlocksSection; 