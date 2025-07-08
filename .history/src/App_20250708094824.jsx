import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import WatchlistPage from "./WatchlistPage";

function App() {
  const [watchlists, setWatchlists] = useState(() => {
    try {
      const saved = localStorage.getItem("burnlist_watchlists");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("burnlist_watchlists", JSON.stringify(watchlists));
  }, [watchlists]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home watchlists={watchlists} setWatchlists={setWatchlists} />}
        />
        <Route
          path="/watchlist/:slug"
          element={<WatchlistPage watchlists={watchlists} setWatchlists={setWatchlists} />}
        />
      </Routes>
    </Router>
  );
}

export default App;