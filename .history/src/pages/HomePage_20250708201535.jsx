import React, { useEffect, useState } from 'react';
import WatchlistChart from '@components/WatchlistChart';

const HomePage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [view, setView] = useState('terminal'); // 'graph' or 'terminal'

  useEffect(() => {
    const stored = localStorage.getItem('burnlist-items');
    if (stored) {
      try {
        setWatchlists(JSON.parse(stored));
      } catch (e) {
        console.error('❌ Failed to parse burnlist-items:', e);
      }
    }
  }, []);

  return (
    <div style={{ fontFamily: 'Courier New', color: '#7FBAA1', backgroundColor: 'black', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <strong>BURNLIST v1.0</strong>
        </div>
        <div>
          ACCOUNT: local
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            setView(view === 'terminal' ? 'graph' : 'terminal');
            console.log('🖥️ View toggled to:', view === 'terminal' ? 'graph' : 'terminal');
          }}
          style={{
            backgroundColor: 'black',
            color: '#7FBAA1',
            border: '1px solid #7FBAA1',
            padding: '6px 12px',
            fontFamily: 'Courier New',
            cursor: 'pointer'
          }}
        >
          {view === 'terminal' ? 'GRAPH VIEW' : 'TERMINAL VIEW'}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <em>Current View: {view.toUpperCase()}</em>
      </div>

      {watchlists.length === 0 && <p>No watchlists found.</p>}

      {watchlists.map((item, index) => (
        <div key={index} style={{
          border: '1px solid #7FBAA1',
          padding: 16,
          marginBottom: 24
        }}>
          <div style={{ marginBottom: 8 }}>WATCHLIST #{index + 1}</div>
          <div style={{ marginBottom: 4 }}>Reason: {item.reason || 'N/A'}</div>
          <div style={{ marginBottom: 4 }}>
            Net Assets:{' '}
            <span style={{ color: '#7FBAA1' }}>
              ${item.currentPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            Return:{' '}
            <span style={{
              color: item.currentPrice >= item.buyPrice ? '#7FBAA1' : '#e31507'
            }}>
              {item.buyPrice && item.currentPrice
                ? `${(((item.currentPrice - item.buyPrice) / item.buyPrice) * 100).toFixed(2)}%`
                : '0.00%'}
            </span>
          </div>
          {view === 'graph' && (
            <WatchlistChart historicalSnapshots={item.historicalData} selectedTimeframe="MAX" />
          )}
        </div>
      ))}
    </div>
  );
};

export default HomePage;