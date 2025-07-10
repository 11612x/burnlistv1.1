// React core and lifecycle
import React, { useState, useEffect } from "react";
// React Router for routing
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// App pages
import Home from "@pages/HomePage";
import WatchlistPage from "@pages/WatchlistPage";
import BurnPage from "@pages/burnPage";

function App() {
  // Load watchlists from localStorage or default to empty array
  const [watchlists, setWatchlists] = useState(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      console.log("Loaded watchlists from localStorage:", saved);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist watchlists to localStorage on changes
  useEffect(() => {
    console.log("Saving watchlists to localStorage:", watchlists);
    localStorage.setItem("burnlist_watchlists", JSON.stringify(watchlists));
  }, [watchlists]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home watchlists={Object.values(watchlists)} setWatchlists={setWatchlists} />}
        />
        <Route
          path="/watchlist/:slug"
          element={<BurnPage watchlists={watchlists} setWatchlists={setWatchlists} />}
        />
        <Route path="/burn" element={<BurnPage watchlists={watchlists} setWatchlists={setWatchlists} />} />
      </Routes>
    </Router>
  );
}

export default App;