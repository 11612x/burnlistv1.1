import React, { useState, useEffect, useRef } from "react";
import { fetchManager } from '@data/fetchManager';
import normalizeTicker from "@data/normalizeTicker";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import WatchlistHeader from "@components/WatchlistHeader";
import WatchlistChart from "@components/WatchlistChart";
import TimeframeSelector from "@components/TimeframeSelector";
import TickerTable from "@components/TickerTable";
import AddTickerInput from "@components/AddTickerInput";
import { useAverageReturn } from "@hooks/useAverageReturn";
import { generateFixedMockWatchlist } from "@data/mockTickerGenerator";
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import EditToggleButton from "@components/EditToggleButton";
import MobileChartWrapper from "@components/MobileChartWrapper";
import { useTheme } from '../ThemeContext';
import { calculateETFPrice, calculateTWAP, calculatePortfolioBeta } from '../utils/portfolioUtils';
import useNotification from '../hooks/useNotification';

const CRT_GREEN = 'rgb(140,185,162)';

// Helper function to convert confidence percentage to descriptive label
const getConfidenceLabel = (confidence) => {
  if (confidence >= 90) return 'excellent';
  if (confidence >= 75) return 'good';
  if (confidence >= 50) return 'fair';
  if (confidence >= 25) return 'poor';
  return 'unreliable';
};

// Utility: Check if NYSE is open (Mon-Fri, 9:30am-4:00pm ET)
function isMarketOpen() {
  const now = new Date();
  // Get NY time
  const nyTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const day = nyTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  // Market open: Mon-Fri, 9:30am-4:00pm
  if (day === 0 || day === 6) return false;
  if (hours < 9 || (hours === 9 && minutes < 30)) return false;
  if (hours > 16 || (hours === 16 && minutes > 0)) return false;
  return true;
}

const BurnPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  

  const [watchlist, setWatchlist] = useState(
    process.env.NODE_ENV === 'development' ? generateFixedMockWatchlist() : null
  );
  const [watchlists, setWatchlists] = useState({});
  const [bulkSymbols, setBulkSymbols] = useState("");
  const [buyPrice, setBuyPrice] = useState(null);
  const [buyDate, setBuyDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { notification, notificationType, setNotification, setNotificationType } = useNotification();
  const [editMode, setEditMode] = useState(false);
  const { isInverted } = useTheme();
  const bypassMarketClosedRef = useRef(false);
  const bypassTimeoutRef = useRef(null);

  // Calculate average return for the current watchlist
  const averageReturn = useAverageReturn(watchlist?.items || [], selectedTimeframe);
  
  // Calculate ETF-like average price for the watchlist
  const etfPriceData = calculateETFPrice(watchlist?.items || []);
  const twapData = calculateTWAP(watchlist?.items || []);
  const betaData = calculatePortfolioBeta(watchlist?.items || [], selectedTimeframe);

  // Calculate real stock count for header
  const realStockCount = Array.isArray(watchlist?.items)
    ? watchlist.items.filter(item => item.type === 'real' && !item.isMock).length
    : 0;
  


  // Ref for interval
  const intervalRef = useRef(null);

  // Fetch function using the new fetch manager
  const fetchWatchlistData = async (manual = false, bypassMarketClosed = false) => {
    if (!watchlist || !Array.isArray(watchlist.items)) return;
    
    const result = await fetchManager.startFetch(slug, watchlist.items, (updatedItems, progress) => {
      // Update callback - called after each batch
      const updatedWatchlist = { ...watchlist, items: updatedItems };
      const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
      if (key) {
        const updated = { ...watchlists, [key]: updatedWatchlist };
        handleSetWatchlists(updated);
      }
    }, manual, bypassMarketClosed, selectedTimeframe);

    if (result.success) {
      // Record the last refresh time for countdown timer
      localStorage.setItem(`burnlist_last_refresh_${slug}`, new Date().toISOString());
    } else if (result.message) {
      setNotification(result.message);
      setNotificationType("info");
    }
  };

  // Check if this watchlist fetch is active
  const watchlistFetchStatus = fetchManager.getFetchStatus(slug);
  const isWatchlistFetching = watchlistFetchStatus && watchlistFetchStatus.status === 'active';

  // Manual Refresh Button handler - starts fetch or cancels if active
  const handleManualRefresh = async () => {
    if (isWatchlistFetching) {
      // Cancel the active fetch
      fetchManager.cancelFetch(slug);
      setNotification('Fetch cancelled', 'info');
    } else {
      // Market open check and bypass logic
      if (!isMarketOpen() && !bypassMarketClosedRef.current) {
        setNotification('Market is closed. Click again to force refresh.');
        setNotificationType('error');
        bypassMarketClosedRef.current = true;
        if (bypassTimeoutRef.current) clearTimeout(bypassTimeoutRef.current);
        bypassTimeoutRef.current = setTimeout(() => {
          bypassMarketClosedRef.current = false;
        }, 5000); // 5 seconds to allow bypass
        return;
      }
      const bypass = bypassMarketClosedRef.current;
      bypassMarketClosedRef.current = false;
      await fetchWatchlistData(true, bypass);
    }
  };

  // Load watchlist data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWatchlists(parsed);
          const found = Object.values(parsed).find(w => w.slug === slug);
          if (found) {
            found.items = found.items?.map(normalizeTicker);
            found.items = found.items?.filter(item => {
              const isValid = item && Number(item.buyPrice) > 0 && Array.isArray(item.historicalData) && Number(item.historicalData[0]?.price) > 0;
              if (!isValid) {
                console.warn("🧨 Invalid item detected during hydration:", item);
              }
              return isValid;
            });
          }
          setWatchlist(found || null);
        } catch (e) {
          localStorage.removeItem("burnlist_watchlists");
          setWatchlist(null);
        }
      }
    } catch (error) {
      setWatchlist(null);
    }
  }, [slug]);

  // No automatic fetches - only manual refresh
  // useEffect(() => {
  //   if (!watchlist || !Array.isArray(watchlist.items)) return;
  //   
  //   // Initial fetch only if no active fetch exists
  //   const fetchStatus = fetchManager.getFetchStatus(slug);
  //   if (!fetchStatus || fetchStatus.status !== 'active') {
  //     fetchWatchlistData();
  //   }
  //   
  //   // Set up interval for auto-refresh
  //   intervalRef.current = setInterval(() => {
  //     fetchWatchlistData();
  //   }, 30 * 60 * 1000); // 30 minutes
  //   
  //   return () => {
  //     if (intervalRef.current) clearInterval(intervalRef.current);
  //   };
  // }, [watchlist, slug]);

  // Pause/resume fetch on navigation
  useEffect(() => {
    // When component unmounts (user navigates away)
    return () => {
      // Pause any active fetch for this watchlist
      fetchManager.pauseFetch(slug);
    };
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timeout);
  }, [selectedTimeframe, watchlist]);

  const handleSetWatchlists = (updatedLists) => {
    if (!updatedLists || typeof updatedLists !== "object" || Array.isArray(updatedLists)) return;
    try {
      const newList = Object.values(updatedLists).find(w => w.slug === slug);
      if (newList) setWatchlist(newList);
      const stringified = JSON.stringify(updatedLists);
      localStorage.setItem("burnlist_watchlists", stringified);
      setWatchlists(updatedLists);
    } catch (err) {}
  };

  // Handler to change buy price
  const handleBuyPriceChange = (index, newPrice) => {
    setWatchlist(prev => {
      if (!prev || !Array.isArray(prev.items)) return prev;
      const updatedItems = prev.items.map((item, i) => i === index ? { ...item, buyPrice: newPrice } : item);
      const updated = { ...prev, items: updatedItems };
      // Also update in watchlists and localStorage
      setWatchlists(watchlists => {
        const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
        if (!key) return watchlists;
        const updatedWatchlists = { ...watchlists, [key]: updated };
        localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
        return updatedWatchlists;
      });
      return updated;
    });
  };

  // Handler to change buy date
  const handleBuyDateChange = (index, newDate) => {
    // Only allow dates in the past (not future)
    const today = new Date().toISOString().slice(0, 10);
    if (newDate > today) return;
    setWatchlist(prev => {
      if (!prev || !Array.isArray(prev.items)) return prev;
      const updatedItems = prev.items.map((item, i) => i === index ? { ...item, buyDate: newDate } : item);
      const updated = { ...prev, items: updatedItems };
      setWatchlists(watchlists => {
        const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
        if (!key) return watchlists;
        const updatedWatchlists = { ...watchlists, [key]: updated };
        localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
        return updatedWatchlists;
      });
      return updated;
    });
  };
  // Handler to refresh a ticker's buy price based on historical data
  const handleRefreshTickerPrice = async (index) => {
    if (!watchlist || !Array.isArray(watchlist.items)) return;
    
    const ticker = watchlist.items[index];
    if (!ticker || !ticker.symbol || !ticker.buyDate) {
      console.warn('Cannot refresh: missing symbol or buy date');
      return;
    }

    try {
      console.log(`📊 Fetching fresh historical data for ${ticker.symbol} from buy date ${ticker.buyDate}`);
      
      // Always fetch fresh historical data from Twelve Data API for Max timeframe
      // This ensures we get the most comprehensive data from the manual buy date to now
      const buyDate = new Date(ticker.buyDate);
      const endDate = null; // Use null to get data up to present
      
      console.log(`📡 Fetching historical data from ${buyDate.toISOString()} for ${ticker.symbol}...`);
      
      // Use the same historical data fetching as the rest of the app
      let freshHistoricalData = [];
      try {
        const response = await fetch(`http://localhost:3002/api/twelvedata-historical?symbol=${ticker.symbol}&start_date=${buyDate.toISOString()}&interval=1day`);
        if (response.ok) {
          const data = await response.json();
          if (data.values && Array.isArray(data.values)) {
            freshHistoricalData = data.values.map(item => ({
              timestamp: item.datetime,
              price: parseFloat(item.close),
              open: parseFloat(item.open),
              high: parseFloat(item.high), 
              low: parseFloat(item.low),
              volume: parseInt(item.volume)
            }));
            console.log(`📊 Fetched ${freshHistoricalData.length} historical data points for ${ticker.symbol}`);
          }
        }
      } catch (apiError) {
        console.warn(`📡 Twelve Data API failed for ${ticker.symbol}, using existing data:`, apiError);
        freshHistoricalData = ticker.historicalData || [];
      }

      // If API failed and no existing data, can't proceed
      if (freshHistoricalData.length === 0) {
        console.warn(`No historical data available for ${ticker.symbol}`);
        setNotification(`No historical data found for ${ticker.symbol}`, 'error');
        return;
      }

      // Sort data by timestamp (oldest to newest) to ensure consistent ordering
      const sortedData = [...freshHistoricalData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Find the earliest available price on or before the buy date
      const buyDateTime = buyDate.getTime();
      let bestPrice = null;
      let bestDate = null;
      
      // Look for the earliest data point on or before the buy date
      for (const dataPoint of sortedData) {
        const dataDateTime = new Date(dataPoint.timestamp).getTime();
        
        if (dataDateTime <= buyDateTime) {
          // This data point is on or before the buy date - use it
          bestPrice = dataPoint.price;
          bestDate = dataPoint.timestamp;
          console.log(`📅 Found historical price for ${ticker.symbol}: $${bestPrice} on ${bestDate}`);
        } else {
          // Data point is after buy date - stop searching (since data is sorted)
          break;
        }
      }
      
      // If no data on or before buy date, use the earliest available data point
      if (bestPrice === null && sortedData.length > 0) {
        bestPrice = sortedData[0].price;
        bestDate = sortedData[0].timestamp;
        console.log(`⚠️ No data on buy date for ${ticker.symbol}, using earliest available: $${bestPrice} on ${bestDate}`);
      }
      
      if (bestPrice === null) {
        console.warn(`No valid price data found for ${ticker.symbol}`);
        setNotification(`No valid price data found for ${ticker.symbol}`, 'error');
        return;
      }

      console.log(`📊 Updating ${ticker.symbol} buy price from $${ticker.buyPrice} to $${bestPrice} (date: ${bestDate})`);

      // Update the ticker with the historical price and fresh historical data
      setWatchlist(prev => {
        if (!prev || !Array.isArray(prev.items)) return prev;
        const updatedItems = prev.items.map((item, i) => 
          i === index 
            ? { 
                ...item, 
                buyPrice: bestPrice,
                historicalData: sortedData, // Update with fresh data
                buyDateMetadata: {
                  ...item.buyDateMetadata,
                  manuallySet: true,
                  lastRefreshed: new Date().toISOString()
                }
              } 
            : item
        );
        const updated = { ...prev, items: updatedItems };
        
        // Update in watchlists and localStorage
        setWatchlists(watchlists => {
          const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
          if (!key) return watchlists;
          const updatedWatchlists = { ...watchlists, [key]: updated };
          localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
          return updatedWatchlists;
        });
        
        return updated;
      });

      setNotification(`📊 ${ticker.symbol} buy price updated to $${bestPrice.toFixed(2)}`, 'success');

    } catch (error) {
      console.error(`Error refreshing ${ticker.symbol}:`, error);
      setNotification(`Failed to refresh ${ticker.symbol}: ${error.message}`, 'error');
    }
  };

  // Handler to delete a ticker
  const handleDeleteTicker = (index) => {
    setWatchlist(prev => {
      if (!prev || !Array.isArray(prev.items)) return prev;
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const updated = { ...prev, items: updatedItems };
      setWatchlists(watchlists => {
        const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
        if (!key) return watchlists;
        const updatedWatchlists = { ...watchlists, [key]: updated };
        localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
        return updatedWatchlists;
      });
      return updated;
    });
  };

  if (!watchlist) {
    return (
      <div style={{ backgroundColor: isInverted ? 'rgb(140,185,162)' : '#000000', color: isInverted ? '#000000' : '#ffffff', padding: '20px' }}>
        <h2 style={{ color: '#e31507', fontFamily: "'Courier New', monospace" }}>⚠️ Watchlist not found.</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: isInverted ? 'rgb(140,185,162)' : 'transparent', 
      minHeight: '100vh', 
      color: isInverted ? '#000000' : '#ffffff',
      padding: '0',
      '@media (max-width: 768px)': {
        padding: '0',
        paddingBottom: '80px', // Account for mobile navigation
      },
      '@media (max-width: 480px)': {
        paddingBottom: '80px', // Account for mobile navigation
      }
    }}>
      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: `1px solid ${CRT_GREEN}`,
        background: 'rgba(0,0,0,0.3)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <CustomButton
          onClick={() => navigate('/universes')}
          style={{
            background: location.pathname === '/universes' || location.pathname.startsWith('/universe/') ? CRT_GREEN : 'transparent',
            color: location.pathname === '/universes' || location.pathname.startsWith('/universe/') ? '#000000' : CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
            padding: '9px 18px',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '80px',
            textAlign: 'center'
          }}
        >
          UNIVERSE
        </CustomButton>
        
        <CustomButton
          onClick={() => navigate('/journal')}
          style={{
            background: location.pathname === '/journal' ? CRT_GREEN : 'transparent',
            color: location.pathname === '/journal' ? '#000000' : CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
            padding: '9px 18px',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '80px',
            textAlign: 'center'
          }}
        >
          JOURNAL
        </CustomButton>
        
        <CustomButton
          onClick={() => navigate('/')}
          style={{
            background: location.pathname === '/' || location.pathname.startsWith('/burn/') ? CRT_GREEN : 'transparent',
            color: location.pathname === '/' || location.pathname.startsWith('/burn/') ? '#000000' : CRT_GREEN,
            border: `1px solid ${CRT_GREEN}`,
            padding: '9px 18px',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '80px',
            textAlign: 'center'
          }}
        >
          BURNPAGE
        </CustomButton>
      </div>
      
      {/* ETF Price Banner - Top of Screen */}
      {etfPriceData && etfPriceData.averagePrice > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10002,
          backgroundColor: 'rgba(0,0,0,0.9)',
          borderBottom: `2px solid ${CRT_GREEN}`,
          padding: '8px 20px',
          '@media (max-width: 768px)': {
            padding: '6px 16px',
          },
          '@media (max-width: 480px)': {
            padding: '4px 12px',
          }
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            color: CRT_GREEN,
            '@media (max-width: 768px)': {
              fontSize: '12px',
              gap: '10px',
            },
            '@media (max-width: 480px)': {
              fontSize: '11px',
              gap: '8px',
              flexDirection: 'column',
              alignItems: 'center',
            }
          }}>
            <div style={{ fontWeight: 'bold' }}>
              ETF Price: ${etfPriceData.averagePrice.toFixed(2)}
            </div>
            <div style={{ color: '#888' }}>
              Beta: {betaData.beta} ({getConfidenceLabel(betaData.confidence)})
            </div>
            <div style={{ color: '#888' }}>
              {Number.isFinite(averageReturn) ? `${averageReturn.toFixed(2)}%` : "–%"} ({selectedTimeframe?.toUpperCase() || "N/A"})
            </div>
            <div style={{ 
              color: etfPriceData.totalGainLoss >= 0 ? CRT_GREEN : '#e31507',
              fontWeight: 'bold'
            }}>
              P&L: ${etfPriceData.totalGainLoss.toFixed(2)} ({etfPriceData.averageGainLossPercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      )}
      
      {/* Centralized Notification Banner */}
      {notification && (
        <div style={{ 
          position: 'fixed', 
          top: etfPriceData && etfPriceData.averagePrice > 0 ? 60 : 24, 
          left: 0, 
          right: 0, 
          zIndex: 10001, 
          display: 'flex', 
          justifyContent: 'center', 
          pointerEvents: 'none',
          '@media (max-width: 480px)': {
            top: etfPriceData && etfPriceData.averagePrice > 0 ? 50 : 12,
          }
        }}>
          <div style={{ 
            minWidth: 320, 
            maxWidth: 480, 
            pointerEvents: 'auto',
            '@media (max-width: 480px)': {
              minWidth: '90vw',
              maxWidth: '90vw',
            }
          }}>
            <NotificationBanner
              message={notification}
              type={notificationType}
              onClose={() => setNotification("")}
            />
          </div>
        </div>
      )}
      {/* Header Section */}
      <div style={{ 
        padding: "20px 20px 0 20px", 
        marginBottom: "50px",
        marginTop: etfPriceData && etfPriceData.averagePrice > 0 ? "50px" : "0px",
        '@media (max-width: 768px)': {
          padding: "16px 16px 0 16px",
          marginBottom: "60px",
          marginTop: etfPriceData && etfPriceData.averagePrice > 0 ? "45px" : "0px",
        },
        '@media (max-width: 480px)': {
          padding: "12px 12px 0 12px",
          marginBottom: "40px",
          marginTop: etfPriceData && etfPriceData.averagePrice > 0 ? "40px" : "0px",
        }
      }}>
        <WatchlistHeader
          name={watchlist.name}
          averageReturn={averageReturn}
          selected={selectedTimeframe}
          notification={loading ? "Calculating returns and updating chart..." : null}
          onNotificationClose={() => setLoading(false)}
          onRefresh={handleManualRefresh}
          realStockCount={realStockCount}
          etfPriceData={etfPriceData}
          twapData={twapData}
        />

      </div>
      

      
      {/* Main Content Section - starts after header */}
      <div style={{ 
  padding: "5px 20px 10px 20px", // top right bottom left
  '@media (max-width: 768px)': {
    padding: "4px 16px 8px 16px",
  },
  '@media (max-width: 480px)': {
    padding: "3px 12px 6px 12px",
  }
}}>
        <MobileChartWrapper height={505} style={{
          '@media (max-width: 768px)': {
            height: 'calc(49.5vw / 2 - 5px)',
            width: '100vw',
            marginLeft: '-16px',
            marginRight: '-16px',
          },
          '@media (max-width: 480px)': {
            height: 'calc(49.5vw / 2 - 5px)',
            width: '100vw',
            marginLeft: '-12px',
            marginRight: '-12px',
          }
        }}>
          <WatchlistChart 
            portfolioReturnData={watchlist.items?.map(item => ({
              symbol: item.symbol,
              buyDate: item.buyDate,
              buyPrice: item.buyPrice,
              historicalData: item.historicalData,
              timeframe: selectedTimeframe
            })) || []} 
            showBacktestLine={false} 
            height={500}
            suppressEmptyMessage={true}
          />
        </MobileChartWrapper>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 10,
        flexWrap: 'wrap',
        gap: '8px',
        '@media (max-width: 480px)': {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '12px',
        }
      }}>
        <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} />
        <EditToggleButton editMode={editMode} setEditMode={setEditMode} />
      </div>
      {Array.isArray(watchlist.items) && watchlist.items.length > 0 ? (
        <TickerTable
          items={watchlist.items}
          selectedTimeframe={selectedTimeframe}
          editMode={editMode}
          handleBuyPriceChange={handleBuyPriceChange}
          handleBuyDateChange={handleBuyDateChange}
          handleDelete={handleDeleteTicker}
          handleRefreshPrice={handleRefreshTickerPrice}
        />
      ) : null}
      {/* Only show this message ONCE, below the chart and above AddTickerInput */}
      {(!Array.isArray(watchlist.items) || watchlist.items.length === 0) && (
        <div style={{ 
          fontFamily: "'Courier New', monospace", 
          color: "#999", 
          textAlign: "center", 
          marginTop: "20px",
          '@media (max-width: 480px)': {
            marginTop: "16px",
            fontSize: '14px',
          }
        }}>
          ⚠️ No valid data to display yet.
        </div>
      )}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginTop: "30px",
        '@media (max-width: 768px)': {
          marginTop: "24px",
        },
        '@media (max-width: 480px)': {
          marginTop: "20px",
        }
      }}>
        <AddTickerInput
          watchlists={watchlists}
          setWatchlists={handleSetWatchlists}
          currentSlug={slug}
          bulkSymbols={bulkSymbols}
          setBulkSymbols={setBulkSymbols}
          buyPrice={buyPrice}
          setBuyPrice={setBuyPrice}
          buyDate={buyDate}
          setBuyDate={setBuyDate}
          setNotification={setNotification}
          setNotificationType={setNotificationType}
          handleBulkAdd={async (tickerObjects) => {
            if (!tickerObjects || tickerObjects.length === 0) return;
            try {
              const saved = localStorage.getItem("burnlist_watchlists");
              if (!saved || saved === "undefined") return;
              const parsed = JSON.parse(saved);
              const currentSlug = slug;
              const current = Object.values(parsed).find(w => w.slug === currentSlug);
              if (!current || !Array.isArray(current.items)) return;
              const validTickers = tickerObjects.filter(
                t => t && t.symbol && typeof t.symbol === 'string' && Array.isArray(t.historicalData)
              );
              const existingSymbols = new Set((current.items || []).map(item => item.symbol));
              const newUniqueTickers = validTickers.filter(t => !existingSymbols.has(t.symbol));
              const safeTickers = newUniqueTickers.filter(t => Array.isArray(t.historicalData) && t.historicalData.length > 0);
              current.items.push(...safeTickers);
              const updated = { ...parsed };
              const matchingKey = Object.keys(updated).find(k => updated[k].slug === currentSlug);
              if (matchingKey) {
                updated[matchingKey] = current;
              } else {
                return;
              }
              localStorage.setItem("burnlist_watchlists", JSON.stringify(updated));
              setWatchlists(updated);
            } catch (error) {}
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default BurnPage;