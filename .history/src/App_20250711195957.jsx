// React core and lifecycle
import React, { useState, useEffect } from "react";
// React Router for routing
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// App pages
import Home from "@pages/HomePage";
import BurnPage from "@pages/burnPage";
import MockWatchlistPage from "@pages/MockWatchlistPage";
// Fetch manager for cleanup
import { fetchManager } from '@data/fetchManager';
// Request status monitoring
import RequestStatus from '@components/RequestStatus';

function App() {
  // Load watchlists from localStorage or default to empty object
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

  // Cleanup fetch manager on app unmount
  useEffect(() => {
    return () => {
      fetchManager.cleanup();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home watchlists={watchlists} setWatchlists={setWatchlists} />}
        />
        <Route
          path="/watchlist/:slug"
          element={<BurnPage watchlists={watchlists} setWatchlists={setWatchlists} />}
        />
        {/* Route for mock watchlist testing - remove when not needed */}
        <Route path="/mockwatchlist" element={<MockWatchlistPage />} />
      </Routes>
      {/* Request status monitor */}
      <RequestStatus />
    </Router>
  );
}

export default App;