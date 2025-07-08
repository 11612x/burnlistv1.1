

import React, { useEffect, useState } from 'react';
import WatchlistChart from '@components/WatchlistChart';

const HomePage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [view, setView] = useState('table'); // or 'summary'

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
    <div style={{ padding: 32 }}>
      <h1>📄 Saved Watchlists</h1>
      <button
        onClick={() => setView(view === 'table' ? 'summary' : 'table')}
        style={{
          marginBottom: 16,
          backgroundColor: 'black',
          color: '#0de309',
          border: '1px solid #0de309',
          fontFamily: 'Courier New',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        Toggle View ({view})
      </button>

      {watchlists.length === 0 && <p>No watchlists found.</p>}

      {view === 'table' && (
        <table style={{ width: '100%', fontFamily: 'Courier New', color: 'white', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #0de309' }}>
              <th align="left">Symbol</th>
              <th align="left">Buy Price</th>
              <th align="left">Current Price</th>
              <th align="left">Type</th>
            </tr>
          </thead>
          <tbody>
            {watchlists.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td>{item.symbol}</td>
                <td>{item.buyPrice?.toFixed(2)}</td>
                <td>{item.currentPrice?.toFixed(2)}</td>
                <td>{item.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'summary' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {watchlists.map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #0de309',
                padding: 16,
                width: 280,
                backgroundColor: '#111',
                color: '#0de309'
              }}
            >
              <strong>{item.symbol}</strong>
              <p>Buy: {item.buyPrice?.toFixed(2)}</p>
              <p>Now: {item.currentPrice?.toFixed(2)}</p>
              <p>Type: {item.type}</p>
              <WatchlistChart historicalSnapshots={item.historicalData} selectedTimeframe="MAX" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;