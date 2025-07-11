import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import WatchlistChart from '@components/WatchlistChart';
import { randomNames } from '@data/randomNames';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { generateFixedMockWatchlist } from '@data/mockTickerGenerator';
import { fetchQuote } from '@data/finhubAdapter';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';

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
  const [notificationType, setNotificationType] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  // Always use MAX timeframe
  const selectedTimeframe = 'MAX';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch counter state
  const [fetchCount, setFetchCount] = useState(() => {
    const stored = localStorage.getItem('burnlist_fetch_count');
    return stored ? parseInt(stored, 10) : 0;
  });

  // Utility: Check if it's 9:29am ET (reset time)
  function isResetTimeNY() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return nyTime.getHours() === 9 && nyTime.getMinutes() === 29;
  }

  // Reset fetch count at 9:29am ET
  useEffect(() => {
    const interval = setInterval(() => {
      if (isResetTimeNY()) {
        setFetchCount(0);
        localStorage.setItem('burnlist_fetch_count', '0');
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);

  // Helper to increment fetch count
  const incrementFetchCount = () => {
    setFetchCount(prev => {
      const next = prev + 1;
      localStorage.setItem('burnlist_fetch_count', String(next));
      return next;
    });
  };

  // Helper: split array into batches
  function splitIntoBatches(arr, batchSize) {
    const batches = [];
    for (let i = 0; i < arr.length; i += batchSize) {
      batches.push(arr.slice(i, i + batchSize));
    }
    return batches;
  }

  // Staggered batch fetching logic
  useEffect(() => {
    const BATCH_SIZE = 60;
    const uniqueTickers = uniqueRealTickers;
    const batches = splitIntoBatches(uniqueTickers, BATCH_SIZE);
    const batchTimers = [];
    function fetchBatch(batch) {
      setIsLoading(true);
      setError(null);
      (async () => {
        try {
          // Fetch all tickers in this batch
          const tickerDataMap = {};
          await Promise.all(batch.map(async (symbol) => {
            try {
              const data = await fetchQuote(symbol);
              if (data) tickerDataMap[symbol] = data;
            } catch (err) {
              setError(`Failed to fetch data for ${symbol}`);
            }
          }));
          // Update all watchlists with fresh data for these tickers
          const updated = {};
          for (const [id, wl] of Object.entries(watchlists)) {
            updated[id] = {
              ...wl,
              items: (wl.items || []).map(item => {
                const fresh = tickerDataMap[item.symbol?.toUpperCase()];
                if (fresh) {
                  return {
                    ...item,
                    ...fresh,
                    buyPrice: item.buyPrice,
                    buyDate: item.buyDate,
                    type: item.type,
                    isMock: item.isMock,
                    addedAt: item.addedAt,
                  };
                }
                return item;
              })
            };
          }
          setWatchlists(updated);
          try {
            localStorage.setItem("burnlist_watchlists", JSON.stringify(updated));
          } catch {}
          incrementFetchCount();
        } catch (err) {
          setError('Failed to refresh watchlists.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
    // Schedule each batch at its offset within the 30-min window
    batches.forEach((batch, i) => {
      const scheduleBatch = () => {
        fetchBatch(batch);
        // Schedule next run for this batch in 30 minutes
        batchTimers[i] = setTimeout(scheduleBatch, 30 * 60 * 1000);
      };
      // Initial run: staggered by i minutes
      batchTimers[i] = setTimeout(scheduleBatch, i * 60 * 1000);
    });
    return () => {
      batchTimers.forEach(timer => clearTimeout(timer));
    };
    // Only rerun if uniqueRealTickers or watchlists change
  }, [uniqueRealTickers.join(','), Object.keys(watchlists).join(',')]);

  const handleCreateWatchlist = () => {
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 150);
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const slug = slugify(name);
    // Check if name already exists (case-insensitive)
    const exists = Object.values(watchlists).some(w => w.name && w.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setNotification('⚠️ Name already exists');
      setNotificationType('error');
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

  const handleUpdateWatchlistName = useCallback((id, newName) => {
    // Prevent duplicate names (case-insensitive, except for current)
    const duplicate = Object.values(watchlists).some(w => w.id !== id && w.name && w.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
      setNotification('⚠️ Name already exists');
      setNotificationType('error');
      return;
    }
    setWatchlists((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], name: newName, slug: slugify(newName) };
        // If the new name starts with '!', inject mock data and overwrite items
        if (typeof newName === 'string' && newName.startsWith('!')) {
          const mock = generateFixedMockWatchlist({ numTickers: 4, days: 130 });
          updated[id].items = mock.items;
        }
      }
      localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
      return updated;
    });
  }, [setWatchlists, watchlists]);

  const handleUpdateWatchlistReason = useCallback((id, newReason) => {
    const updated = {
      ...watchlists,
      [id]: {
        ...watchlists[id],
        reason: newReason
      }
    };
    setWatchlists(updated);
    localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
  }, [setWatchlists, watchlists]);

  // Track editing state and previous name for each watchlist
  const [editingNames, setEditingNames] = useState({}); // { [id]: { value, prev } }

  // When entering edit mode, initialize editingNames
  useEffect(() => {
    if (editMode) {
      const initial = {};
      Object.values(watchlists).forEach(wl => {
        initial[wl.id] = { value: wl.name, prev: wl.name };
      });
      setEditingNames(initial);
    } else {
      setEditingNames({});
    }
  }, [editMode, watchlists]);

  // Handler for input change (just update local state)
  const handleEditNameInput = (id, value) => {
    setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], value } }));
  };

  // Handler for blur or 'Done' (validate and commit)
  const commitEditName = (id) => {
    const newName = editingNames[id]?.value || '';
    // Prevent duplicate names (case-insensitive, except for current)
    const duplicate = Object.values(watchlists).some(w => w.id !== id && w.name && w.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
      setNotification('⚠️ Name already exists');
      setNotificationType('error');
      // Revert to previous name
      setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], value: prev[id].prev } }));
      return;
    }
    // Commit the name change
    setWatchlists((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], name: newName, slug: slugify(newName) };
        if (typeof newName === 'string' && newName.startsWith('!')) {
          const mock = generateFixedMockWatchlist({ numTickers: 4, days: 130 });
          updated[id].items = mock.items;
        }
      }
      localStorage.setItem('burnlist_watchlists', JSON.stringify(updated));
      return updated;
    });
    setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], prev: newName } }));
  };

  const sortedWatchlists = useMemo(() => Object.values(watchlists), [watchlists]);
  // Memoize lastReturn for each watchlist
  const lastReturns = useMemo(() => {
    return sortedWatchlists.map(wl => {
      const tickers = wl.items || [];
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
    });
  }, [sortedWatchlists]);

  // Calculate unique real tickers across all watchlists
  const uniqueRealTickers = useMemo(() => {
    const all = Object.values(watchlists)
      .flatMap(wl => (wl.items || []).map(item => item.symbol))
      .filter(sym => sym && typeof sym === 'string' && !sym.startsWith('#'));
    return Array.from(new Set(all.map(s => s.toUpperCase())));
  }, [watchlists]);

  return (
    <div style={{ fontFamily: 'Courier New', color: CRT_GREEN, backgroundColor: 'black', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <strong style={{ fontSize: '170%' }}>BURNLIST v1.1</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#e31507', fontWeight: 'bold', fontSize: 12 }}>{uniqueRealTickers.length}</span>
          <span style={{ color: '#8CB9A2', fontWeight: 'bold', fontSize: 12 }}>{fetchCount}</span>
          <span>ACCOUNT: local</span>
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
        <CustomButton
          onClick={() => {
            setView(view === 'terminal' ? 'graph' : 'terminal');
            console.log('🖥️ View toggled to:', view === 'terminal' ? 'graph' : 'terminal');
          }}
        >
          {view === 'terminal' ? 'GRAPH VIEW' : 'TERMINAL VIEW'}
        </CustomButton>
        <CustomButton
          onClick={handleCreateWatchlist}
          className={justClicked ? 'clicked-button' : ''}
          style={{
            backgroundColor: CRT_GREEN,
            color: 'black',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          +++
        </CustomButton>

        <CustomButton
          onClick={() => {
            setEditMode(!editMode);
            console.log('🛠️ Edit mode:', !editMode);
          }}
          style={{
            backgroundColor: editMode ? CRT_GREEN : 'black',
            color: editMode ? 'black' : CRT_GREEN,
          }}
        >
          {editMode ? 'DONE' : 'EDIT'}
        </CustomButton>
        {process.env.NODE_ENV === 'development' && (
          <CustomButton
            onClick={() => {
              const data = JSON.parse(localStorage.getItem('burnlist_watchlists'));
              console.log('🧪 Current localStorage burnlist_watchlists:', data);
            }}
            style={{ marginLeft: '12px' }}
          >
            DEBUG:STORAGE
          </CustomButton>
        )}
      </div>

      {/* Centralized Notification Banner */}
      {notification && (
        <div style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 10001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ minWidth: 320, maxWidth: 480, pointerEvents: 'auto' }}>
            <NotificationBanner
              message={notification}
              type={notificationType}
              onClose={() => setNotification('')}
            />
          </div>
        </div>
      )}

      {/* Loading and error banners */}
      {isLoading && (
        <NotificationBanner 
          message="Loading watchlists..." 
          type="loading" 
        />
      )}
      {error && (
        <NotificationBanner 
          message={error} 
          type="error" 
          onClose={() => setError(null)} 
        />
      )}

      {Object.keys(watchlists).length === 0 && <p>No watchlists found.</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 252px)',
        rowGap: '20px',
        columnGap: '20px',
        margin: '70px 0 1px 0',
        justifyContent: 'center',
        alignItems: 'start',
      }}>
      {sortedWatchlists.map((item, idx, arr) => {
        const tickers = item.items || [];
        const lastReturn = lastReturns[idx];
        const isPositive = lastReturn >= 0;
        const chartColor = isPositive ? CRT_GREEN : '#e31507';
        const returnColor = chartColor;
        // Calculate best/worst performer and risk indicator
        let bestPerformer = null;
        let worstPerformer = null;
        let riskIndicator = tickers.length === 0 ? 'None' : 'LOW';
        
        if (tickers.length > 0) {
          const performances = tickers.map(t => {
            const data = t.historicalData;
            if (!Array.isArray(data) || data.length < 2) return { symbol: t.symbol, return: 0 };
            const start = data[0]?.price;
            const end = data[data.length - 1]?.price;
            if (typeof start !== 'number' || typeof end !== 'number' || start === 0) return { symbol: t.symbol, return: 0 };
            const returnPercent = ((end - start) / start) * 100;
            return { symbol: t.symbol, return: returnPercent };
          });
          
          bestPerformer = performances.reduce((best, current) => 
            current.return > best.return ? current : best, performances[0]);
          worstPerformer = performances.reduce((worst, current) => 
            current.return < worst.return ? current : worst, performances[0]);
          
          // Simple risk indicator: HIGH if any stock >20% loss, MEDIUM if any >10% loss, LOW otherwise
          const maxLoss = Math.min(...performances.map(p => p.return));
          const maxGain = Math.max(...performances.map(p => p.return));
          const volatility = maxGain - maxLoss;
          
          if (maxLoss < -20 || volatility > 50) riskIndicator = 'HIGH';
          else if (maxLoss < -10 || volatility > 30) riskIndicator = 'MED';
          else riskIndicator = 'LOW';
        }
        
        // Get last update time (use the most recent timestamp from historical data)
        let lastUpdate = 'Unknown';
        if (tickers.length > 0) {
          const timestamps = tickers.flatMap(t => 
            t.historicalData?.map(d => new Date(d.timestamp).getTime()) || []
          );
          if (timestamps.length > 0) {
            const latest = Math.max(...timestamps);
            const now = Date.now();
            const diffHours = Math.floor((now - latest) / (1000 * 60 * 60));
            if (diffHours < 1) lastUpdate = 'Just now';
            else if (diffHours < 24) lastUpdate = `${diffHours}h ago`;
            else lastUpdate = `${Math.floor(diffHours / 24)}d ago`;
          }
        }
        const cardContent = (
          <div style={{
            width: 252,
            height: editMode ? 250 : (view === 'graph' ? 220 : 120),
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
                value={editingNames[item.id]?.value ?? item.name}
                onChange={e => handleEditNameInput(item.id, e.target.value)}
                onBlur={() => commitEditName(item.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitEditName(item.id);
                  }
                }}
                style={{
                  fontFamily: 'Courier New',
                  fontSize: 18,
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
              <div style={{ fontSize: 18, color: CRT_GREEN, fontWeight: 'bold', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name || `PORTFOLIO ${idx + 1}`}
              </div>
            )}
            {/* Delete button (only in edit mode) */}
            {editMode && (
              <CustomButton
                onClick={() => handleDeleteWatchlist(item.id)}
                style={{
                  backgroundColor: 'black',
                  color: '#e31507',
                  border: '1px solid #e31507',
                  padding: '2px 6px',
                  marginBottom: 4,
                  fontSize: 10,
                  width: '100%',
                  fontWeight: 'bold'
                }}
              >
                DELETE
              </CustomButton>
            )}
            {/* Reason (editable) */}
            {editMode ? (
              <input
                value={item.reason || ''}
                onChange={e => handleUpdateWatchlistReason(item.id, e.target.value)}
                  style={{
                    fontFamily: 'Courier New',
                  fontSize: 14,
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
              <div style={{ fontSize: 14, color: CRT_GREEN, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.reason || 'N/A'}
              </div>
            )}
            {/* Portfolio info */}
            <div style={{ fontSize: 13, color: CRT_GREEN, marginBottom: 2 }}>
              {tickers.length} stocks | Risk: {riskIndicator}
            </div>
            {/* Last update */}
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
              {lastUpdate}
            </div>
            {/* Return percent in terminal view */}
            {view !== 'graph' && tickers.length > 0 && (
              <div style={{ fontSize: 19, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
                {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
              </div>
            )}
            {/* Sparkline with frame only in graph view */}
            {view === 'graph' && tickers.length > 0 && (
              <>
                {/* Return (moved just above chart) */}
                <div style={{ fontSize: 19, color: returnColor, fontWeight: 'bold', marginBottom: 2 }}>
                  {lastReturn >= 0 ? '+' : ''}{lastReturn.toFixed(2)}%
                </div>
                <div style={{
                  width: 180,
                  height: 94,
                  alignSelf: 'flex-end',
                  border: `1.5px solid ${CRT_GREEN}`,
                  borderRadius: 0,
                  background: '#000',
                  padding: 1,
                  marginTop: 'auto', // push to bottom
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end'
                }}>
                  <WatchlistChart 
                    portfolioReturnData={tickers.map(t => ({
                      symbol: t.symbol,
                      buyDate: t.buyDate,
                      historicalData: t.historicalData,
                      timeframe: selectedTimeframe
                    }))}
                    showBacktestLine={false}
                    height={94}
                    lineColor={chartColor}
                    hideAxes={true}
                    hideBorder={true}
                    showTooltip={false}
                    mini={true}
                  />
                </div>
              </>
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