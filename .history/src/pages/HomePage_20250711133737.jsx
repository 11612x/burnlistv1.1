import React, { useEffect, useState } from 'react';
import WatchlistChart from '@components/WatchlistChart';
import TimeframeSelector from '@components/TimeframeSelector';
import { randomNames } from '@data/randomNames';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { generateFixedMockWatchlist } from '@data/mockTickerGenerator';

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const CRT_GREEN = 'rgb(140,185,162)';

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
    setWatchlists((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], name: newName };
        // If the new name starts with '!', inject mock data and overwrite items
        if (typeof newName === 'string' && newName.startsWith('!')) {
          const mock = generateFixedMockWatchlist({ numTickers: 4, days: 130 });
          updated[id].items = mock.items;
        }
      }
      localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
      return updated;
    });
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
    <div style={{ fontFamily: 'Courier New', color: CRT_GREEN, backgroundColor: 'black', minHeight: '100vh', padding: '32px' }}>
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
              color: ${CRT_GREEN} !important;
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
            color: CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
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
            backgroundColor: CRT_GREEN,
            color: 'black',
            border: `1px solid ${CRT_GREEN}`,
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
            backgroundColor: editMode ? CRT_GREEN : 'black',
            color: editMode ? 'black' : CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
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
              color: CRT_GREEN,
              border: `1px solid ${CRT_GREEN}`,
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
        gridTemplateColumns: 'repeat(5, 210px)',
        rowGap: '20px',
        columnGap: '20px',
        margin: '70px 0 1px 0',
        justifyContent: 'center',
        alignItems: 'start',
      }}>
      {Object.values(watchlists).map((item, idx, arr) => {
        // Use the full historicalData for buy/current price, not the timeframe slice
        const tickers = item.items || [];
        // Calculate average return for color (timeframe-dependent, so keep as is)
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
        const chartColor = isPositive ? CRT_GREEN : '#e31507';
        const returnColor = chartColor;
        // Calculate buy/current price for display (show average for the watchlist)
        let avgBuyPrice = 0;
        let avgCurrentPrice = 0;
        if (tickers.length > 0) {
          const buyPrices = tickers.map(t => (typeof t.buyPrice === 'number' ? t.buyPrice : (t.historicalData?.[0]?.price ?? 0)));
          const currentPrices = tickers.map(t => (t.historicalData?.[t.historicalData.length - 1]?.price ?? 0));
          avgBuyPrice = buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length;
          avgCurrentPrice = currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
        }
        const cardContent = (
          <div style={{
            width: 210,
            height: editMode ? 180 : 140,
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
                  fontSize: 15,
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
              <div style={{ fontSize: 15, color: CRT_GREEN, fontWeight: 'bold', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name || `PORTFOLIO ${idx + 1}`}
              </div>
            )}
            {/* Delete button (only in edit mode) */}
            {editMode && (
              <button
                onClick={() => handleDeleteWatchlist(item.id)}
                style={{
                  backgroundColor: '#e31507',
                  color: 'black',
                  border: 'none',
                  padding: '2px 6px',
                  marginBottom: 4,
                  fontSize: 10,
                  fontFamily: 'Courier New',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold'
                }}
              >
                DELETE
              </button>
            )}
            {/* Reason (editable) */}
            {editMode ? (
              <input
                value={item.reason || ''}
                onChange={e => handleUpdateWatchlistReason(item.id, e.target.value)}
                  style={{
                    fontFamily: 'Courier New',
                  fontSize: 12,
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
              <div style={{ fontSize: 12, color: CRT_GREEN, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.reason || 'N/A'}
              </div>
            )}
            {/* Buy/Current Price (average for watchlist) */}
            <div style={{ fontSize: 13, color: '#fff', marginBottom: 2 }}>
              Buy: {avgBuyPrice ? avgBuyPrice.toFixed(2) : '-'} | Now: {avgCurrentPrice ? avgCurrentPrice.toFixed(2) : '-'}
            </div>
            {/* Return */}
            <div style={{ fontSize: 16, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
              {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
            </div>
            {/* Sparkline with frame only in graph view */}
            {view === 'graph' && (
              <div style={{ width: 100, height: 70, alignSelf: 'flex-end', border: `1.5px solid ${CRT_GREEN}`, borderRadius: 0, background: '#101818', padding: 1, marginTop: 2 }}>
                {tickers.length > 0 ? (
                  <WatchlistChart 
                    portfolioReturnData={tickers.map(t => ({
                      symbol: t.symbol,
                      buyDate: t.buyDate,
                      historicalData: t.historicalData,
                      timeframe: selectedTimeframe
                    }))}
                    showBacktestLine={false}
                    height={24}
                    lineColor={chartColor}
                    hideAxes={true}
                    hideBorder={true}
                    showTooltip={false}
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