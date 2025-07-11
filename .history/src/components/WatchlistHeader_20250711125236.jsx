import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { refreshWatchlistData } from '@data/refreshWatchlistData';
import NotificationBanner from '@components/NotificationBanner';

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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const stored = JSON.parse(localStorage.getItem("burnlist_watchlists"));
      const found = Object.values(stored).find((wl) => wl.slug === slug);
      if (!found) return;
      const updatedItems = await refreshWatchlistData(found.items || []);
      found.items = updatedItems;
      localStorage.setItem("burnlist_watchlists", JSON.stringify(stored));
      setWatchlists(stored);
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
        color: "rgb(127, 186, 161)",
        fontFamily: "'Courier New', Courier, monospace",
        width: "100%"
      }}>
        {/* Left: Back Home Button */}
        <div>
          <a href="/" style={{
            color: "rgb(127, 186, 161)",
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
            color: "rgb(127, 186, 161)"
          }}>
            {watchlistName ? watchlistName : (name || "Untitled Watchlist")}
          </h1>
          <div
            style={{
              fontSize: "1rem",
              marginTop: 4,
              color: returnPercent >= 0 ? "rgb(127, 186, 161)" : "#e31507"
            }}
          >
            {returnPercent !== null ? `${returnPercent.toFixed(2)}%` : "–%"} ({selected?.toUpperCase() || "N/A"})
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "rgb(127, 186, 161)",
              background: "transparent",
              border: "1px solid rgb(127, 186, 161)",
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