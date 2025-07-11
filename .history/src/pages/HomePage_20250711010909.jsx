import React, { useEffect, useState } from 'react';
import WatchlistChart from '@components/WatchlistChart';
import TimeframeSelector from '@components/TimeframeSelector';
import { randomNames } from '@data/randomNames';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const HomePage = ({ watchlists = {}, setWatchlists }) => {
  const [view, setView] = useState('terminal'); // 'graph' or 'terminal'
  const [notification, setNotification] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  // Add global timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState('MAX');

  const handleCreateWatchlist = () => {
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 150);
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const slug = slugify(name);
    console.log('Creating watchlist with slug:', slug);
    
    // Check if slug already exists in the object
    const exists = Object.values(watchlists).some(w => w.slug === slug);
    if (exists) {
      console.log('🚫 Duplicate watchlist name:', name);
      setNotification('⚠️ Name already exists. Try again.');
      return;
    }
    
    const newList = {
      id: uuidv4(),
      name,
      slug,
      items: [],
      reason: '',
      createdAt: new Date().toISOString(),
    };
    
    const updated = { ...watchlists, [newList.id]: newList };
    setWatchlists(updated);
    localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
    setNotification('');
    console.log('✅ Created new watchlist:', name);
  };

  const handleDeleteWatchlist = (id) => {
    // Find the correct key in the watchlists object that matches this id
    const keyToDelete = Object.keys(watchlists).find(key => watchlists[key].id === id);
    
    if (!keyToDelete) {
      console.log('🗑️ Could not find watchlist with id:', id);
      return;
    }
    
    const { [keyToDelete]: deleted, ...remaining } = watchlists;
    setWatchlists(remaining);
    localStorage.setItem('burnlist_watchlists', JSON.stringify(remaining));
    if (deleted) {
      console.log('🗑️ Deleted watchlist:', deleted.name);
    } else {
      console.log('🗑️ Deleted watchlist with id:', id);
    }
  };

  const handleUpdateWatchlistName = (id, newName) => {
    const updated = {
      ...watchlists,
      [id]: {
        ...watchlists[id],
        name: newName,
        slug: slugify(newName)
      }
    };
    setWatchlists(updated);
    localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
  };

  return (
    <div style={{ fontFamily: 'Courier New', color: '#7FBAA1', backgroundColor: 'black', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <strong style={{ fontSize: '170%' }}>BURNLIST v1.0</strong>
        </div>
        <div>
          ACCOUNT: local
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <style>
          {`
            .clicked-button {
              background-color: black !important;
              color: #7FBAA1 !important;
            }
          `}
        </style>
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
        <button
          onClick={handleCreateWatchlist}
          className={justClicked ? 'clicked-button' : ''}
          style={{
            backgroundColor: '#7FBAA1',
            color: 'black',
            border: '1px solid #7FBAA1',
            padding: '6px 12px',
            fontFamily: 'Courier New',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          +++
        </button>

        <button
          onClick={() => {
            setEditMode(!editMode);
            console.log('🛠️ Edit mode:', !editMode);
          }}
          style={{
            backgroundColor: editMode ? '#7FBAA1' : 'black',
            color: editMode ? 'black' : '#7FBAA1',
            border: '1px solid #7FBAA1',
            padding: '6px 12px',
            fontFamily: 'Courier New',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {editMode ? 'DONE' : 'EDIT'}
        </button>
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => {
              const data = JSON.parse(localStorage.getItem('burnlist_watchlists'));
              console.log('🧪 Current localStorage burnlist_watchlists:', data);
            }}
            style={{
              backgroundColor: 'black',
              color: '#7FBAA1',
              border: '1px solid #7FBAA1',
              padding: '6px 12px',
              fontFamily: 'Courier New',
              cursor: 'pointer',
              marginLeft: '12px'
            }}
          >
            DEBUG STORAGE
          </button>
        )}
      </div>

      {view === 'graph' && (
        <div style={{ marginBottom: 24 }}>
          <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} />
        </div>
      )}

      {notification && (
        <div style={{ color: '#e31507', marginBottom: 16 }}>{notification}</div>
      )}

      {Object.keys(watchlists).length === 0 && <p>No watchlists found.</p>}

      {Object.values(watchlists).map((item) => {
        const tickers = item.items?.map(ticker => ({
          symbol: ticker.symbol,
          buyDate: ticker.buyDate,
          historicalData: ticker.historicalData,
          timeframe: selectedTimeframe
        })) || [];
        console.log(`📊 Watchlist '${item.name}' chart data:`, tickers);
        const cardContent = (
          <div style={{ border: '1px solid #7FBAA1', padding: 16, marginBottom: 24 }}>
            {editMode ? (
              <div style={{ marginBottom: 8 }}>
                WATCHLIST: <input
                  value={item.name}
                  onChange={(e) => handleUpdateWatchlistName(item.id, e.target.value)}
                  style={{
                    fontFamily: 'Courier New',
                    backgroundColor: 'black',
                    color: '#7FBAA1',
                    border: '1px solid #7FBAA1',
                    padding: '2px 6px',
                    width: '100%'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 8 }}>
                WATCHLIST: <strong>{item.name}</strong>
              </div>
            )}
            {editMode && (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => handleDeleteWatchlist(item.id)}
                  style={{
                    backgroundColor: 'black',
                    color: '#e31507',
                    border: '1px solid #e31507',
                    padding: '4px 8px',
                    fontFamily: 'Courier New',
                    cursor: 'pointer',
                    marginBottom: 8
                  }}
                >
                  DELETE
                </button>
              </div>
            )}
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
              <div style={{ width: '100%', height: 300, background: '#111', border: '2px solid #0de309', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tickers.length > 0 ? (
                  <WatchlistChart 
                    portfolioReturnData={tickers}
                    showBacktestLine={false} 
                  />
                ) : (
                  <span style={{ color: '#999', fontFamily: 'Courier New' }}>No tickers in this watchlist.</span>
                )}
              </div>
            )}
          </div>
        );
        return (
          <div key={item.id}>
            {editMode ? cardContent : (
              <Link to={`/watchlist/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {cardContent}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HomePage;