import React, { useEffect, useState } from "react";

const CRT_GREEN = "rgb(140,185,162)";

const WatchlistSelector = ({ value, onSelect }) => {
  const [watchlists, setWatchlists] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      if (saved) {
        const parsed = JSON.parse(saved);
        const listArr = Object.values(parsed).map(w => ({ name: w.name, slug: w.slug }));
        setWatchlists(listArr);
      }
    } catch (e) {
      setWatchlists([]);
    }
  }, []);

  return (
    <select
      value={value || ""}
      onChange={e => onSelect && onSelect(e.target.value)}
      style={{
        background: "black",
        color: CRT_GREEN,
        border: `1px solid ${CRT_GREEN}`,
        fontFamily: "Courier New, monospace",
        fontSize: 16,
        padding: "6px 12px",
        borderRadius: 4,
        outline: "none",
        minWidth: 180,
        margin: 0,
      }}
    >
      <option value="" disabled>
        Select Watchlist
      </option>
      {watchlists.map(w => (
        <option key={w.slug} value={w.slug}>
          {w.name}
        </option>
      ))}
    </select>
  );
};

export default WatchlistSelector; 