import React, { useEffect, useState } from 'react';
import WatchlistChart from '@components/WatchlistChart';
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

const HomePage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [view, setView] = useState('terminal'); // 'graph' or 'terminal'
  const [notification, setNotification] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [justClicked, setJustClicked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('burnlist_watchlists');
    if (stored) {
      try {
        setWatchlists(JSON.parse(stored));
      } catch (e) {
        console.error('❌ Failed to parse burnlist_watchlists:', e);
      }
    }
  }, []);

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
          onClick={() => {
            setJustClicked(true);
            setTimeout(() => setJustClicked(false), 150);
            const name = randomNames[Math.floor(Math.random() * randomNames.length)];
            const slug = slugify(name);
            console.log('Creating watchlist with slug:', slug);
            const exists = watchlists.some(w => w.slug === slug);
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
            const updated = [...watchlists, newList];
            setWatchlists(updated);
            localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
            setNotification('');
            console.log('✅ Created new watchlist:', name);
          }}
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
      </div>

      {notification && (
        <div style={{ color: '#e31507', marginBottom: 16 }}>{notification}</div>
      )}

      {watchlists.length === 0 && <p>No watchlists found.</p>}

      {watchlists.map((item, index) => {
        const cardContent = (
          <div style={{ border: '1px solid #7FBAA1', padding: 16, marginBottom: 24 }}>
            {editMode ? (
              <div style={{ marginBottom: 8 }}>
                WATCHLIST: <input
                  value={item.name}
                  onChange={(e) => {
                    const updated = [...watchlists];
                    updated[index].name = e.target.value;
                    updated[index].slug = slugify(e.target.value);
                    setWatchlists(updated);
                    localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
                  }}
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
                  onClick={() => {
                    const filtered = watchlists.filter(w => w.id !== item.id);
                    setWatchlists(filtered);
                    localStorage.setItem('burnlist_watchlists', JSON.stringify(filtered));
                    console.log('🗑️ Deleted watchlist:', item.name);
                  }}
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
              <WatchlistChart historicalSnapshots={item.historicalData} selectedTimeframe="MAX" />
            )}
          </div>
        );
        return (
          <div key={item.id || index}>
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