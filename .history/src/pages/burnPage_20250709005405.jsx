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
    const saved = localStorage.getItem("burnlist_watchlists");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = parsed.find(w => w.slug === slug);
      console.log("📦 Loaded watchlist:", found);
      setWatchlist(found || null);
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
      <TimeframeSelector selected={selectedTimeframe} setSelected={setSelectedTimeframe} />
      <TickerTable items={watchlist.items} selectedTimeframe={selectedTimeframe} />
      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
        <AddTickerInput
          watchlists={[watchlist]}
          setWatchlists={(updatedLists) => {
            const newList = updatedLists.find(w => w.slug === slug);
            if (newList) setWatchlist(newList);
            localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedLists));
          }}
          currentSlug={slug}
          bulkSymbols={bulkSymbols}
          setBulkSymbols={setBulkSymbols}
          buyPrice={buyPrice}
          setBuyPrice={setBuyPrice}
          buyDate={buyDate}
          setBuyDate={setBuyDate}
        />
      </div>
    </div>
  );
};

export default BurnPage;