import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const WatchlistHeader = ({ name, averageReturn, selected }) => {
  // Debug: Log the precomputed average return passed as prop
  console.log("📊 WatchlistHeader received averageReturn:", averageReturn);
  const returnPercent =
    typeof averageReturn === "number" && isFinite(averageReturn)
      ? averageReturn
      : null;

  const [watchlistName, setWatchlistName] = useState("");
  const { slug } = useParams();

  useEffect(() => {
    console.log("📛 Slug from URL:", slug);

    try {
      const stored = localStorage.getItem("burnlist_watchlists");
      console.log("📦 Raw from localStorage:", stored);

      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((wl) => wl.slug === slug);
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
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem 2rem",
        backgroundColor: "#e31507",
        color: "#000000",
        fontFamily: "'Courier New', Courier, monospace",
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10000
      }}
    >
      {/* Left: Back Home Button */}
      <div>
        <a href="/" style={{
          color: "#000000",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "1rem"
        }}>← home</a>
      </div>

      {/* Right: Watchlist Name and Return */}
      <div style={{ textAlign: "right", paddingRight: "2rem", maxWidth: "90%" }}>
        <h1 style={{
          margin: 0,
          fontSize: "2rem",
          whiteSpace: "nowrap",
          color: "#000000"
        }}>
          {watchlistName ? watchlistName : (name || "Untitled Watchlist")}
        </h1>
        {returnPercent !== null && (
          <div
            style={{
              fontSize: "1rem",
              marginTop: 4,
              color: returnPercent >= 0 ? "rgb(127, 186, 161)" : "#e31507"
            }}
          >
            {returnPercent.toFixed(2)}% ({selected?.toUpperCase() || "N/A"})
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistHeader;