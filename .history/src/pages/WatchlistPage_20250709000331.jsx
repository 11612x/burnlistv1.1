// ✅ Using Vite alias to resolve portfolio return logic
import { calculatePortfolioReturns } from "@logic/portfolioReturns";
// Filter snapshots by timeframe utility
function filterSnapshotsByTimeframe(snapshots, timeframe) {
  const now = new Date(snapshots[snapshots.length - 1]?.timestamp || Date.now());
  const msPerDay = 24 * 60 * 60 * 1000;
  let earliest;

  switch (timeframe) {
    case "D": // 1 day
      earliest = new Date(now.getTime() - 1 * msPerDay);
      break;
    case "W":
    case "WEEK": // 7 days
      earliest = new Date(now.getTime() - 7 * msPerDay);
      break;
    case "M":
    case "MONTH": // 30 days
      earliest = new Date(now.getTime() - 30 * msPerDay);
      break;
    case "Y":
    case "YEAR": // 365 days
      earliest = new Date(now.getTime() - 365 * msPerDay);
      break;
    case "YTD": {
      const jan1 = new Date(now.getFullYear(), 0, 1);
      earliest = jan1;
      break;
    }
    case "MAX":
    default:
      return snapshots;
  }

  return snapshots.filter((s) => new Date(s.timestamp) >= earliest);
}

import React, { useState, useEffect, useRef, useMemo } from "react";
import WatchlistHeader from "@components/WatchlistHeader";
import TimeframeSelector from "@components/TimeframeSelector";
import TickerTable from "@components/TickerTable";
import { useParams, Link } from "react-router-dom";
import { fetchQuote } from "@data/finhubAdapter";
import WatchlistChart from "@components/WatchlistChart";
import AddTickerInput from "@components/AddTickerInput";
import { createTicker } from "@data/createTicker";

// Toggle to control whether to use mock data or live/localStorage data
const useMock = false; // live mode enabled — using localStorage/watchlists

// Helper function to render symbol with stars for duplicates
function getSymbolWithStars(symbol, index, items) {
  const totalCount = items.filter((it) => it.symbol === symbol).length;
  if (totalCount > 1) {
    const countBefore = items.slice(0, index).filter((it) => it.symbol === symbol).length;
    const stars = "*".repeat(countBefore + 1);
    return symbol + stars;
  }
  return symbol;
}

function WatchlistPage({ watchlists, setWatchlists }) {

/*
    NOTE on API call limits and performance:
    Currently, the app fetches price data for every ticker in the watchlist individually every 60 seconds.
    With a 60-second update interval, this means up to 60 * number_of_tickers calls per hour.
    For example, with 50 tickers, that is 3000 calls per hour, which greatly exceeds typical API limits.

    Using Finnhub's free tier, you get 5000 API calls per day.
    This means you must either:
      - Limit watchlist size to a small number,
      - Increase the update interval (fetch less frequently),
      - Or switch to batch API calls if supported,
      - Implement caching and conditional fetching to reduce redundant calls.

    Be mindful to avoid hitting rate limits and incurring extra costs.
  */

  const { slug } = useParams();
  const storedWatchlists = localStorage.getItem("burnlist-watchlists");
  const effectiveWatchlists = storedWatchlists ? JSON.parse(storedWatchlists) : (watchlists || []);
  const watchlistIndex = effectiveWatchlists.findIndex((wl) => wl.slug?.toLowerCase() === slug?.toLowerCase());
  const watchlist = watchlistIndex !== -1 ? effectiveWatchlists[watchlistIndex] : null;
  console.log("📦 Effective watchlists:", effectiveWatchlists);
  console.log("🔍 Looking for slug:", slug);
  console.log("🎯 Found watchlist:", watchlist);

  const [items, setItems] = useState([]);
  const [removedSymbols, setRemovedSymbols] = useState([]);
  // Persist removedSymbols to localStorage
  useEffect(() => {
    const storedRemoved = localStorage.getItem("burnlist-removedSymbols");
    if (storedRemoved) {
      setRemovedSymbols(JSON.parse(storedRemoved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("burnlist-removedSymbols", JSON.stringify(removedSymbols));
  }, [removedSymbols]);
  const [editMode, setEditMode] = useState(false);
  const [buyPrices, setBuyPrices] = useState({});
  const [bulkSymbols, setBulkSymbols] = useState("");
  const [notification, setNotification] = useState(null);
  const [timeframe, setTimeframe] = useState("D");
  const updateTimeoutRef = useRef(null);
  // State for portfolio return graph inputs, derived from each ticker's history
  const [historicalSnapshots, setHistoricalSnapshots] = useState([]);

  // Notification auto-clear
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 10000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Load from watchlist
  useEffect(() => {
    (async () => {
      if (!watchlist) {
        setItems([]);
        setBuyPrices({});
        setHistoricalSnapshots([]);
        return;
      }

      // If watchlist exists but has no items, set safe defaults and skip further logic
      if (!watchlist.items || watchlist.items.length === 0) {
        setItems([]);
        setBuyPrices({});
        setHistoricalSnapshots([]);
        console.warn("⚠️ Watchlist is empty. Fallback state set.");
        return;
      }

      if (useMock) {
        const filteredMockList = await Promise.all(
          watchlist.items
            .filter(symbol => symbol.startsWith("#") && !removedSymbols.includes(symbol))
            .map(symbol => createTicker(symbol, { useMock: true }))
        );
        setItems(filteredMockList);
        // Immediately compute normalized snapshots and setHistoricalSnapshots
        const snapshots = filteredMockList.map(item => ({
          symbol: item.symbol,
          buyPrice: item.buyPrice,
          historicalData: item.historicalData || [],
          buyDate: item.buyDate || new Date().toISOString()
        }));
        setHistoricalSnapshots(snapshots);
        const initialBuyPrices = {};
        filteredMockList.forEach((item) => {
          initialBuyPrices[item.symbol] = item.priceBought?.toString() ?? "0";
        });
        setBuyPrices(initialBuyPrices);
        return;
      }
      const initialItems = watchlist.items.map((ticker) => {
        return {
          symbol: ticker.symbol,
          price: ticker.price ?? 0,
          returnPercent: ticker.returnPercent ?? 0,
          buyPrice: ticker.buyPrice ?? 0,
          buyDate: ticker.buyDate ?? new Date().toISOString(),
          historicalData: ticker.historicalData ?? []
        };
      });
      const initialBuyPrices = {};
      initialItems.forEach((item) => {
        initialBuyPrices[item.symbol] = item.buyPrice?.toString() ?? "0";
      });
      setItems(initialItems);
      setBuyPrices(initialBuyPrices);
      setHistoricalSnapshots(initialItems.map((item) => ({
        symbol: item.symbol,
        buyPrice: item.buyPrice,
        buyDate: item.buyDate,
        historicalData: item.historicalData
      })));
    })();
  }, [watchlist, watchlistIndex, removedSymbols]);


  // Debounced update prices
  useEffect(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (items.length === 0) return;
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            if (item.symbol.startsWith("#")) {
              const hist = mockHistoricalData[item.symbol] || [];
              const latestPrice = hist.length ? hist[hist.length - 1].price : item.price;
              const buyPrice = Number(buyPrices[item.symbol]) || latestPrice;
              return { ...item, price: latestPrice, buyPrice, historicalData: hist };
            } else {
              try {
                const quote = await fetchQuote(item.symbol);
                if (!quote) throw new Error("No data");
                const buyPrice = buyPrices?.[item.symbol] ? Number(buyPrices[item.symbol]) : 0;
                return { ...item, price: quote.c, buyPrice, historicalData: quote.historicalData || [] };
              } catch {
                return item;
              }
            }
          })
        );
        setItems(updatedItems);

        const snapshots = updatedItems.map(item => {
          const snapshot = {
            symbol: item.symbol,
            buyPrice: item.buyPrice,
            historicalData: Array.isArray(item.historicalData) ? item.historicalData : [],
            buyDate: item.buyDate || (item.historicalData?.[0]?.timestamp
              ? new Date(item.historicalData[0].timestamp).toISOString()
              : new Date().toISOString())
          };
          console.log(`📅 ${item.symbol} buyDate set to:`, snapshot.buyDate);
          if (
            typeof snapshot.symbol !== "string" ||
            typeof snapshot.buyPrice !== "number" ||
            !Array.isArray(snapshot.historicalData)
          ) {
            console.warn("⚠️ Invalid snapshot structure:", snapshot);
          }
          return snapshot;
        });
        // Validation log before setting historicalSnapshots to confirm normalization of each ticker
        snapshots.forEach((snap, idx) => {
          if (
            typeof snap.symbol !== "string" ||
            typeof snap.buyPrice !== "number" ||
            !Array.isArray(snap.historicalData)
          ) {
            console.warn(
              `⚠️ Snapshot at index ${idx} failed normalization:`,
              snap
            );
          } else {
            console.log(
              `✅ Snapshot at index ${idx} normalized:`,
              snap
            );
          }
        });
        setHistoricalSnapshots(snapshots);
      } catch {}
    }, 60000); // 1 minute delay for fetching latest prices
    return () => clearTimeout(updateTimeoutRef.current);
  }, [items, buyPrices, watchlistIndex]);
  // Edit symbol/buy price
  const handleChangeSymbol = (index, value) => {
    const newItems = [...items];
    newItems[index].symbol = value.toUpperCase();
    setItems(newItems);
  };
  const handleBuyPriceChange = (symbol, value) => {
    if (value === "" || !isNaN(Number(value))) {
      setBuyPrices((prev) => ({
        ...prev,
        [symbol]: value,
      }));
    }
  };
  // Delete
  const handleDelete = (index) => {
    const newItems = [...items];
    const removed = newItems.splice(index, 1)[0];
    setBuyPrices((prev) => {
      const copy = { ...prev };
      delete copy[removed.symbol];
      return copy;
    });
    setItems(newItems);
    setRemovedSymbols(prev => [...prev, removed.symbol]);
    if (setWatchlists) {
      setWatchlists((prev) => {
        const updatedWatchlists = [...prev];
        updatedWatchlists[watchlistIndex] = {
          ...updatedWatchlists[watchlistIndex],
          items: newItems.map((i) => i.symbol),
          slug: updatedWatchlists[watchlistIndex].slug || updatedWatchlists[watchlistIndex].name.toLowerCase().replace(/\s+/g, "-")
        };
        // Persist updated watchlists to localStorage
        localStorage.setItem("burnlist-watchlists", JSON.stringify(updatedWatchlists));
        return updatedWatchlists;
      });
    }
  };
  // Bulk add (supports both mock "#" and real tickers)
  const handleBulkAdd = async () => {
    if (!bulkSymbols.trim()) {
      setNotification("Please enter at least one symbol");
      return;
    }
    const inputSymbols = bulkSymbols
      .split(/[\s,]+/) // split by one or more spaces or commas
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
    if (inputSymbols.length === 0) {
      setNotification("No valid symbols entered");
      return;
    }
    const existingSymbols = new Set(items.map((item) => item.symbol));
    const newItems = [];
    let duplicates = [];
    let notFound = [];
    for (const symbol of inputSymbols) {
      if (existingSymbols.has(symbol)) {
        duplicates.push(symbol);
        continue;
      }
      // Special branch for mock tickers (start with "#")
      if (symbol.startsWith("#")) {
        const hist = mockHistoricalData[symbol];
        if (!hist || hist.length === 0) {
          notFound.push(symbol);
          continue;
        }
        const first = hist[0];
        newItems.push({
          symbol,
          price: first.price,
          buyPrice: first.price,
          buyDate: first.timestamp,
          historicalData: hist,
          returnPercent: 0,
        });
        setBuyPrices((prev) => {
          const newPrices = { ...prev, [symbol]: first.price.toString() };
          localStorage.setItem(`burnlist-buyPrice-${watchlistIndex}-${symbol}`, first.price.toString());
          return newPrices;
        });
        continue;
      }
      // Real ticker branch (with stricter validation and explicit logging)
      try {
        const quote = await fetchQuote(symbol);
        // Stricter validation: must be a valid, finite number and have buyDate
        if (
          quote &&
          typeof quote.currentPrice === "number" &&
          isFinite(quote.currentPrice) &&
          quote.buyDate
        ) {
          newItems.push({
            symbol,
            price: quote.currentPrice,
            buyPrice: quote.currentPrice,
            buyDate: quote.buyDate,
            historicalData: [],
            returnPercent: 0,
          });
          setBuyPrices((prev) => {
            const newPrices = { ...prev, [symbol]: quote.currentPrice.toString() };
            localStorage.setItem(`burnlist-buyPrice-${watchlistIndex}-${symbol}`, quote.currentPrice.toString());
            return newPrices;
          });
          console.log("✅ Added ticker:", { symbol, buyPrice: quote.currentPrice, buyDate: quote.buyDate });
        } else {
          // Explicit logging for rejected ticker
          console.warn("⛔ Rejected ticker due to missing or invalid data:", symbol, quote);
          notFound.push(symbol);
          continue;
        }
      } catch (err) {
        // Explicit logging for fetch failure
        console.warn("⛔ Rejected ticker due to fetch error:", symbol, err);
        notFound.push(symbol);
        continue;
      }
    }
    if (newItems.length > 0) {
      const updatedItems = [...items, ...newItems];
      setItems(updatedItems);
      if (setWatchlists) {
        setWatchlists((prev) => {
          const updatedWatchlists = [...prev];
          updatedWatchlists[watchlistIndex] = {
            ...updatedWatchlists[watchlistIndex],
            items: updatedItems.map((i) => i.symbol),
            slug:
              updatedWatchlists[watchlistIndex].slug ||
              updatedWatchlists[watchlistIndex].name
                .toLowerCase()
                .replace(/\s+/g, "-"),
          };
          // Persist updated watchlists to localStorage after bulk add
          localStorage.setItem("burnlist-watchlists", JSON.stringify(updatedWatchlists));
          return updatedWatchlists;
        });
      }
      // If setWatchlists is not defined, persist anyway (for completeness)
      if (!setWatchlists) {
        const updatedWatchlists = [...watchlists];
        updatedWatchlists[watchlistIndex] = {
          ...updatedWatchlists[watchlistIndex],
          items: updatedItems.map((i) => i.symbol),
          slug:
            updatedWatchlists[watchlistIndex].slug ||
            updatedWatchlists[watchlistIndex].name
              .toLowerCase()
              .replace(/\s+/g, "-"),
        };
        localStorage.setItem("burnlist-watchlists", JSON.stringify(updatedWatchlists));
      }
    }
    let message = "";
    if (duplicates.length > 0) message += `Duplicates: ${duplicates.join(", ")} `;
    if (notFound.length > 0) message += `Not found: ${notFound.join(", ")} `;
    if (message) setNotification(message.trim());
    setBulkSymbols("");
  };
  // Notification close
  const handleNotificationClose = () => setNotification(null);

  // Add single symbol (if present in your codebase elsewhere, update buyPrices assignment as below)
  // If you have a handleAdd function, update its setBuyPrices line per instructions:
  // setBuyPrices((prev) => ({ ...prev, [symbolTrimmed]: prev[symbolTrimmed] !== undefined && prev[symbolTrimmed] !== "" ? prev[symbolTrimmed] : "0" }));

  // Total return (no longer used, removed)
  function getYDomain(data) {
    if (!data.length) return [-10, 10];
    const values = data.map((d) => d.returnPercent);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = 2;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }
  // ✅ Ensure newly created watchlist is persisted to localStorage
  useEffect(() => {
    if (!watchlists || watchlists.length === 0) return;
    localStorage.setItem("burnlist-watchlists", JSON.stringify(watchlists));
  }, [watchlists]);

  // Fallback UI for missing watchlist
  useEffect(() => {
    if (!watchlist) {
      console.warn("⚠️ No watchlist found. Showing placeholder UI.");
    }
  }, [watchlist]);

  if (!watchlist) {
    return (
      <div
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          backgroundColor: "black",
          color: "white",
          minHeight: "100vh",
          padding: "2rem",
          border: "2px solid white",
        }}
      >
        
        <div style={{
          backgroundColor: "black",
          color: "white",
          border: "2px solid white",
          padding: 10,
          marginBottom: 20,
          fontFamily: "'Courier New', Courier, monospace",
          textAlign: "center"
        }}>
          ⚠️ This watchlist is empty or not yet initialized. Add your first asset to get started.
        </div>
        <WatchlistChart portfolioReturnData={[]} showBacktestLine={false} />
        <TimeframeSelector selected={"D"} onChange={() => {}} />
        <TickerTable
          items={[]}
          historicalSnapshots={[]}
          timeframe={"D"}
          editMode={false}
          buyPrices={{}}
          handleChangeSymbol={() => {}}
          handleBuyPriceChange={() => {}}
          handleDelete={() => {}}
          selectedTimeframe={"D"}
        />
      </div>
    );
  }

  // Defensive check: ensure validSnapshots are valid snapshot objects
  const validSnapshots = Array.isArray(historicalSnapshots)
    ? historicalSnapshots.filter(
        snap =>
          Array.isArray(snap.historicalData) &&
          snap.historicalData.length > 0 &&
          typeof snap.buyPrice === "number"
      )
    : [];
  const portfolioReturnData = React.useMemo(() => {
    if (!Array.isArray(validSnapshots)) {
      console.warn("⚠️ Invalid input for calculatePortfolioReturns. Skipping.");
      return [];
    }
    const data = calculatePortfolioReturns(validSnapshots, timeframe);
    console.log("📈 WatchlistPage: Portfolio return data points:", data.length);
    return Array.isArray(data) ? data : [];
  }, [validSnapshots, timeframe]);
  // Average return for header (latest point if available)
  const lastPoint = Array.isArray(portfolioReturnData) && portfolioReturnData.length > 0
    ? portfolioReturnData[portfolioReturnData.length - 1]
    : null;
  const burnreturn = lastPoint?.returnPercent ?? 0;

  return (
    <div
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        backgroundColor: "black",
        color: "white",
        minHeight: "100vh",
        padding: "2rem",
        border: "2px solid white",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "black",
          padding: "1rem",
          borderBottom: "2px solid white"
        }}
      >
        <WatchlistHeader
          name={watchlist?.name}
          averageReturn={burnreturn}
          selected={timeframe}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: "rgb(127, 186, 161)", textDecoration: "underline", fontFamily: "'Courier New', Courier, monospace" }}>
          ← Back to All Watchlists
        </Link>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
      
      </div>

      {isEmptyWatchlist && (
        <div style={{
          backgroundColor: "red",
          color: "white",
          border: "2px solid white",
          padding: 10,
          marginBottom: 20,
          fontFamily: "'Courier New', Courier, monospace",
          textAlign: "center"
        }}>
          ⚠️ This watchlist is empty. Add your first asset to get started.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            backgroundColor: "black",
            color: "#ffffff",
            border: "2px solid white",
            padding: "4px 12px",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          {editMode ? "done" : "➕ add ticker"}
        </button>
      </div>
      <div style={{ border: "2px solid white", padding: 10, marginBottom: 30 }}>
        {Array.isArray(portfolioReturnData) && portfolioReturnData.length > 0 ? (
          <WatchlistChart
            portfolioReturnData={Array.isArray(portfolioReturnData) ? portfolioReturnData : []}
            showBacktestLine={true}
          />
        ) : (
          <div style={{
            backgroundColor: "black",
            color: "white",
            border: "2px solid white",
            padding: 10,
            marginBottom: 20,
            fontFamily: "'Courier New', Courier, monospace",
            textAlign: "center"
          }}>
            ⚠️ Burnlist Warning: No valid snapshot data for chart or return calculation
          </div>
        )}
      </div>
      <TimeframeSelector selected={timeframe} onChange={(tf) => {
        console.log("🕒 Timeframe changed to:", tf);
        setTimeframe(tf);
      }} />

      <TickerTable
        items={isEmptyWatchlist ? [] : items}
        historicalSnapshots={isEmptyWatchlist ? [] : historicalSnapshots}
        timeframe={timeframe}
        editMode={editMode}
        buyPrices={isEmptyWatchlist ? {} : buyPrices}
        handleChangeSymbol={handleChangeSymbol}
        handleBuyPriceChange={handleBuyPriceChange}
        handleDelete={handleDelete}
        selectedTimeframe={timeframe}
      />

      {editMode && (
        <AddTickerInput
          bulkSymbols={bulkSymbols}
          setBulkSymbols={setBulkSymbols}
          handleBulkAdd={handleBulkAdd}
        />
      )}

      <div style={{ marginTop: 20, textAlign: "left" }}>
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            background: "none",
            border: "none",
            color: "rgb(127, 186, 161)",
            cursor: "pointer",
            fontFamily: "'Courier New', Courier, monospace",
            textDecoration: "underline",
            fontSize: "1rem",
            userSelect: "none",
          }}
        >
          {editMode ? "done" : "edit"}
        </button>
      </div>

    </div>
  );
}

export default WatchlistPage;