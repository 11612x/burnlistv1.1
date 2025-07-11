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

  const handleUpdateWatchlistReason = (id, newReason) => {
    const updated = {
      ...watchlists,
      [id]: {
        ...watchlists[id],
        reason: newReason
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
            DEBUG:STORAGE
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '15px',
        margin: '15px 0',
        justifyItems: 'center',
        alignItems: 'start',
      }}>
      {Object.values(watchlists).map((item, idx, arr) => {
        const tickers = item.items?.map(ticker => ({
          symbol: ticker.symbol,
          buyDate: ticker.buyDate,
          historicalData: ticker.historicalData,
          timeframe: selectedTimeframe
        })) || [];
        // Calculate average return for color
        const lastReturn = (() => {
          if (!tickers.length) return 0;
          const last = tickers.map(t => {
            const data = t.historicalData;
            if (!Array.isArray(data) || data.length < 2) return 0;
            const start = data[0]?.price;
            const end = data[data.length - 1]?.price;
            if (typeof start !== 'number' || typeof end !== 'number' || start === 0) return 0;
            return ((end - start) / start) * 100;
          });
          return last.reduce((a, b) => a + b, 0) / last.length;
        })();
        const isPositive = lastReturn >= 0;
        const chartColor = isPositive ? '#7FBAA1' : '#e31507';
        const returnColor = chartColor;
        const cardContent = (
          <div style={{
            width: 210,
            height: 140,
            fontFamily: 'Courier New',
            background: 'transparent',
            padding: '10px 8px',
            margin: 0,
            border: '1px solid #7FBAA1',
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
                  fontSize: 15,
                    color: '#7FBAA1',
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
              <div style={{ fontSize: 15, color: '#7FBAA1', fontWeight: 'bold', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name || `PORTFOLIO ${idx + 1}`}
              </div>
            )}
            {/* Reason (editable) */}
            {editMode ? (
              <input
                value={item.reason || ''}
                onChange={e => handleUpdateWatchlistReason(item.id, e.target.value)}
                  style={{
                    fontFamily: 'Courier New',
                  fontSize: 12,
                  color: '#7FBAA1',
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
              <div style={{ fontSize: 12, color: '#7FBAA1', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.reason || 'N/A'}
              </div>
            )}
            {/* Return */}
            <div style={{ fontSize: 16, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
              {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
            </div>
            {/* Sparkline with frame only in graph view */}
            {view === 'graph' && (
              <div style={{ width: 90, height: 28, alignSelf: 'flex-end', border: '1.5px solid #7FBAA1', borderRadius: 0, background: '#101818', padding: 1, marginTop: 2 }}>
                {tickers.length > 0 ? (
                  <WatchlistChart 
                    portfolioReturnData={tickers}
                    showBacktestLine={false}
                    height={24}
                    lineColor={chartColor}
                    hideAxes={true}
                    hideBorder={true}
                  />
                ) : null}
              </div>
            )}
          </div>
        );
        return (
          <div key={item.id} style={{ margin: 0 }}>
            {editMode ? cardContent : (
              <Link to={`/watchlist/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {cardContent}
              </Link>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default HomePage;