import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchManager } from '@data/fetchManager';
import NotificationBanner from '@components/NotificationBanner';

const CRT_GREEN = 'rgb(140,185,162)';

const WatchlistHeader = ({ name, averageReturn, selected, setWatchlists, notification, onNotificationClose }) => {
  // Debug: Log the precomputed average return passed as prop
  console.log("📊 WatchlistHeader received averageReturn:", averageReturn);
  const returnPercent = Number.isFinite(averageReturn) ? averageReturn : null;
  if (returnPercent === null) {
    console.warn("⚠️ averageReturn is invalid:", averageReturn);
  }

  const [watchlistName, setWatchlistName] = useState("");
  const { slug } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [fetchProgress, setFetchProgress] = useState(null);

  // Countdown timer for next auto-refresh (30 minutes)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const lastRefresh = localStorage.getItem(`burnlist_last_refresh_${slug}`);
      const lastRefreshTime = lastRefresh ? new Date(lastRefresh) : new Date(now.getTime() - 30 * 60 * 1000);
      const nextRefresh = new Date(lastRefreshTime.getTime() + 30 * 60 * 1000);
      const timeUntilNext = nextRefresh.getTime() - now.getTime();
      
      if (timeUntilNext > 0) {
        const minutes = Math.floor(timeUntilNext / (1000 * 60));
        const seconds = Math.floor((timeUntilNext % (1000 * 60)) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [slug]);

  // Track fetch progress
  useEffect(() => {
    const updateProgress = () => {
      const status = fetchManager.getFetchStatus(slug);
      if (status && status.status === 'active' && status.progress) {
        setFetchProgress(status.progress);
        setIsRefreshing(true);
      } else {
        setFetchProgress(null);
        setIsRefreshing(false);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [slug]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const stored = JSON.parse(localStorage.getItem("burnlist_watchlists"));
      const found = Object.values(stored).find((wl) => wl.slug === slug);
      if (!found) return;
      
      // Use fetch manager instead of direct refresh
      const result = await fetchManager.startFetch(slug, found.items || [], (updatedItems) => {
        found.items = updatedItems;
        localStorage.setItem("burnlist_watchlists", JSON.stringify(stored));
        setWatchlists(stored);
      }, true);
      
      if (result.success) {
        localStorage.setItem(`burnlist_last_refresh_${slug}`, new Date().toISOString());
      }
    } catch (err) {
      console.warn("❌ Failed to refresh data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("📛 Slug from URL:", slug);
    try {
      const stored = localStorage.getItem("burnlist_watchlists");
      console.log("📦 Raw from localStorage:", stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = Object.values(parsed).find((wl) => wl.slug === slug);
        console.log("🧭 Found watchlist:", found);
        if (found && typeof found.name === "string") {
          console.log("✅ Setting name to:", found.name);
          setWatchlistName(found.name);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to load watchlist name in header", err);
    }
  }, [slug]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10000
      }}
    >
      {notification && (
        <NotificationBanner notification={notification} handleNotificationClose={onNotificationClose} />
      )}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem 2rem",
        backgroundColor: "#000000",
        color: CRT_GREEN,
        fontFamily: "'Courier New', Courier, monospace",
        width: "100%"
      }}>
        {/* Left: Back Home Button */}
        <div>
          <a href="/" style={{
            color: CRT_GREEN,
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1rem"
          }}>← home</a>
        </div>
        {/* Right: Watchlist Name and Return */}
        <div style={{ textAlign: "right", paddingRight: "3.5rem", maxWidth: "60%" }}>
          <h1 style={{
            margin: 0,
            fontSize: "2rem",
            whiteSpace: "nowrap",
            color: CRT_GREEN
          }}>
            {watchlistName ? watchlistName : (name || "Untitled Watchlist")}
          </h1>
          <div
            style={{
              fontSize: "1rem",
              marginTop: 4,
              color: returnPercent >= 0 ? CRT_GREEN : "#e31507"
            }}
          >
            {returnPercent !== null ? `${returnPercent.toFixed(2)}%` : "–%"} ({selected?.toUpperCase() || "N/A"})
          </div>
          {/* Countdown timer (green) and progress indicator (red) */}
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
            {fetchProgress ? (
              <span style={{ color: "#e31507", fontWeight: "bold" }}>
                🔄 {fetchProgress}
              </span>
            ) : countdown ? (
              <span style={{ color: CRT_GREEN }}>
                ⏰ {countdown}
              </span>
            ) : null}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: CRT_GREEN,
              background: "transparent",
              border: `1px solid ${CRT_GREEN}`,
              padding: "2px 6px",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.5 : 1,
              fontFamily: "'Courier New', Courier, monospace"
            }}
          >
            {isRefreshing ? "Refreshing..." : "⟳ Refresh Prices"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchlistHeader;