import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WatchlistHeader from "@components/WatchlistHeader";
import WatchlistChart from "@components/WatchlistChart";
import TimeframeSelector from "@components/TimeframeSelector";
import TickerTable from "@components/TickerTable";
import AddTickerInput from "@components/AddTickerInput";

const BurnPage = () => {
  const { slug } = useParams();
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [watchlist, setWatchlist] = useState(null);
  const [bulkSymbols, setBulkSymbols] = useState("");
  const [buyPrice, setBuyPrice] = useState(null);
  const [buyDate, setBuyDate] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = Object.values(parsed).find(w => w.slug === slug);
          console.log("📦 Loaded watchlist:", found);
          setWatchlist(found || null);
        } catch (e) {
          console.error("❌ Corrupt JSON in burnlist_watchlists:", e);
          localStorage.removeItem("burnlist_watchlists");
          setWatchlist(null);
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error reading burnlist_watchlists from localStorage:", error);
      setWatchlist(null);
    }
  }, [slug]);

  if (!watchlist) {
    return (
      <div style={{ backgroundColor: "#000000", color: "#ffffff", padding: "20px" }}>
        <h2 style={{ color: "#e31507", fontFamily: "'Courier New', monospace" }}>⚠️ Watchlist not found.</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "transparent", minHeight: "100vh", color: "#ffffff", padding: "20px" }}>
      <WatchlistHeader name={watchlist.name} averageReturn={null} selected={selectedTimeframe} />
      <WatchlistChart items={watchlist.items} selectedTimeframe={selectedTimeframe} />
      <TimeframeSelector selected={selectedTimeframe} onChange={setSelectedTimeframe} />
      <TickerTable items={watchlist.items} selectedTimeframe={selectedTimeframe} />
      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
        <AddTickerInput
          watchlists={[watchlist]}
          setWatchlists={(updatedLists) => {
            if (!updatedLists || typeof updatedLists !== "object") {
              console.error("❌ Invalid updatedLists object passed to setWatchlists.");
              return;
            }

            try {
              const newList = Object.values(updatedLists).find(w => w.slug === slug);
              if (newList) setWatchlist(newList);
              const stringified = JSON.stringify(updatedLists);
              localStorage.setItem("burnlist_watchlists", stringified);
            } catch (err) {
              console.error("❌ Failed to stringify and store burnlist_watchlists:", err);
            }
          }}
          currentSlug={slug}
          bulkSymbols={bulkSymbols}
          setBulkSymbols={setBulkSymbols}
          buyPrice={buyPrice}
          setBuyPrice={setBuyPrice}
          buyDate={buyDate}
          setBuyDate={setBuyDate}
          handleBulkAdd={(tickerObjects) => {
            if (!tickerObjects || tickerObjects.length === 0) return;

            const saved = localStorage.getItem("burnlist_watchlists");
            if (!saved || saved === "undefined") {
              console.error("❌ No valid data found in burnlist_watchlists");
              return;
            }

            let parsed;
            try {
              parsed = JSON.parse(saved);
            } catch (e) {
              console.error("❌ Failed to parse burnlist_watchlists from localStorage:", e);
              localStorage.removeItem("burnlist_watchlists");
              return;
            }

            const currentSlug = slug;
            // Find the current watchlist by slug
            const current = Object.values(parsed).find(w => w.slug === currentSlug);

            if (!current || !Array.isArray(current.items)) return;

            current.items.push(...tickerObjects);
            // Update the parsed object by replacing the object with matching slug
            const updated = Object.fromEntries(
              Object.entries(parsed).map(([key, value]) =>
                value.slug === currentSlug ? [key, current] : [key, value]
              )
            );

            localStorage.setItem("burnlist_watchlists", JSON.stringify(updated));
            setWatchlist(current);
          }}
        />
      </div>
    </div>
  );
};

export default BurnPage;