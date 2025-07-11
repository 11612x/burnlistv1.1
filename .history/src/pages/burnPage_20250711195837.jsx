import React, { useState, useEffect, useRef } from "react";
import { fetchManager } from '@data/fetchManager';
import normalizeTicker from "@data/normalizeTicker";
import { useParams } from "react-router-dom";
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
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [watchlist, setWatchlist] = useState(
    process.env.NODE_ENV === 'development' ? generateFixedMockWatchlist() : null
  );
  const [watchlists, setWatchlists] = useState({});
  const [bulkSymbols, setBulkSymbols] = useState("");
  const [buyPrice, setBuyPrice] = useState(null);
  const [buyDate, setBuyDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [editMode, setEditMode] = useState(false);

  // Calculate average return for the current watchlist
  const averageReturn = useAverageReturn(watchlist?.items || [], selectedTimeframe);

  // Ref for interval
  const intervalRef = useRef(null);

  // Fetch function using the new fetch manager
  const fetchWatchlistData = async (manual = false) => {
    if (!watchlist || !Array.isArray(watchlist.items)) return;
    
    const result = await fetchManager.startFetch(slug, watchlist.items, (updatedItems, progress) => {
      // Update callback - called after each batch
      const updatedWatchlist = { ...watchlist, items: updatedItems };
      const key = Object.keys(watchlists).find(k => watchlists[k].slug === slug);
      if (key) {
        const updated = { ...watchlists, [key]: updatedWatchlist };
        handleSetWatchlists(updated);
      }
    }, manual);

    if (result.success) {
      // Record the last refresh time for countdown timer
      localStorage.setItem(`burnlist_last_refresh_${slug}`, new Date().toISOString());
    } else if (result.message) {
      setNotification(result.message);
      setNotificationType("info");
    }
  };

  // Manual Refresh Button handler
  const handleManualRefresh = async () => {
    await fetchWatchlistData(true);
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

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!watchlist || !Array.isArray(watchlist.items)) return;
    
    // Initial fetch only if no active fetch exists
    const fetchStatus = fetchManager.getFetchStatus(slug);
    if (!fetchStatus || fetchStatus.status !== 'active') {
      fetchWatchlistData();
    }
    
    // Set up interval for auto-refresh
    intervalRef.current = setInterval(() => {
      fetchWatchlistData();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [watchlist, slug]);

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
      <div style={{ backgroundColor: "#000000", color: "#ffffff", padding: "20px" }}>
        <h2 style={{ color: "#e31507", fontFamily: "'Courier New', monospace" }}>⚠️ Watchlist not found.</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "transparent", minHeight: "100vh", color: "#ffffff" }}>
      {/* Centralized Notification Banner */}
      {notification && (
        <div style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 10001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ minWidth: 320, maxWidth: 480, pointerEvents: 'auto' }}>
            <NotificationBanner
              message={notification}
              type={notificationType}
              onClose={() => setNotification("")}
            />
          </div>
        </div>
      )}
      {/* Header Section */}
      <div style={{ padding: "20px 20px 0 20px", marginBottom: "100px" }}>
        <WatchlistHeader
          name={watchlist.name}
          averageReturn={averageReturn}
          selected={selectedTimeframe}
          notification={loading ? "Calculating returns and updating chart..." : null}
          onNotificationClose={() => setLoading(false)}
        />
        {/* Manual Refresh Button */}
        <CustomButton onClick={handleManualRefresh} style={{ marginTop: 10 }}>
          Refresh
        </CustomButton>
      </div>
      {/* Main Content Section - starts after header */}
      <div style={{ padding: "20px" }}>
        <WatchlistChart 
          portfolioReturnData={watchlist.items?.map(item => ({
            symbol: item.symbol,
            buyDate: item.buyDate,
            historicalData: item.historicalData,
            timeframe: selectedTimeframe
          })) || []} 
          showBacktestLine={false} 
          height={500}
          suppressEmptyMessage={true}
        />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} />
        <EditToggleButton editMode={editMode} setEditMode={setEditMode} />
      </div>
      {Array.isArray(watchlist.items) && watchlist.items.length > 0 ? (
        <TickerTable
          items={watchlist.items}
          selectedTimeframe={selectedTimeframe}
          editMode={editMode}
          handleBuyPriceChange={handleBuyPriceChange}
          handleDelete={handleDeleteTicker}
        />
      ) : null}
      {/* Only show this message ONCE, below the chart and above AddTickerInput */}
      {(!Array.isArray(watchlist.items) || watchlist.items.length === 0) && (
        <div style={{ fontFamily: "'Courier New', monospace", color: "#999", textAlign: "center", marginTop: "20px" }}>
          ⚠️ No valid data to display yet.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
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