import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import { useTheme } from '../ThemeContext';
import { calculateBuyScore } from '../data/buyScore';
import { FaEdit, FaCheck } from 'react-icons/fa';

const CRT_GREEN = 'rgb(140,185,162)';

// Utility function to calculate ATR (Average True Range)
const calculateATR = (high, low, close, period = 14) => {
  // Calculate True Range: max(high-low, abs(high-prevClose), abs(low-prevClose))
  // For simplicity, we'll use a percentage-based approximation
  const trueRange = Math.max(high - low, Math.abs(high - close) * 0.5, Math.abs(low - close) * 0.5);
  const atr = trueRange * 0.015; // Approximate ATR as 1.5% of true range
  return Math.max(atr, 0.01); // Minimum ATR of 0.01
};

// Utility function to calculate SL and TP
const calculateSLandTP = (entryPrice, atr, accountSize, riskPercent) => {
  const riskAmount = accountSize * (riskPercent / 100);
  const slPercent = 3.5;
  const slATR = 1.25 * atr;
  
  // Tighter of 3.5% or 1.25×ATR
  const slDistance = Math.min(entryPrice * (slPercent / 100), slATR);
  const stopLoss = entryPrice - slDistance;
  
  // TP is 2× risk
  const takeProfit = entryPrice + (2 * slDistance);
  
  // Position size based on risk
  const positionSize = riskAmount / slDistance;
  
  return {
    stopLoss: Number(stopLoss.toFixed(5)),
    takeProfit: Number(takeProfit.toFixed(5)),
    positionSize: Number(positionSize.toFixed(5))
  };
};

const UniverseScreenerPage = () => {
  const { slug } = useParams();
  const [universe, setUniverse] = useState(null);
  const [universes, setUniverses] = useState({});
  const [bulkSymbols, setBulkSymbols] = useState("");
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "symbol", direction: "asc" });
  const [screenerSettings, setScreenerSettings] = useState(() => {
    const saved = localStorage.getItem("burnlist_screener_settings");
    return saved ? JSON.parse(saved) : {
      accountSize: 10000,
      riskPercent: 2
    };
  });
  const [minBuyScore, setMinBuyScore] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const { isInverted } = useTheme();

  // Load universes and find the specific universe on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_universes");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUniverses(parsed);
        const found = Object.values(parsed).find(u => u.slug === slug);
        if (found) {
          setUniverse(found);
        }
      }
    } catch (error) {
      console.error("Failed to load universes:", error);
    }
  }, [slug]);

  // Save universe to localStorage when it changes
  useEffect(() => {
    if (universe) {
      const updatedUniverses = { ...universes };
      const key = Object.keys(updatedUniverses).find(k => updatedUniverses[k].id === universe.id);
      if (key) {
        updatedUniverses[key] = universe;
        localStorage.setItem("burnlist_universes", JSON.stringify(updatedUniverses));
        setUniverses(updatedUniverses);
      }
    }
  }, [universe, universes]);

  // Save screener settings when they change
  useEffect(() => {
    localStorage.setItem("burnlist_screener_settings", JSON.stringify(screenerSettings));
  }, [screenerSettings]);

  const handleBulkAdd = async () => {
    if (!bulkSymbols.trim()) {
      setNotification("Please enter ticker symbols");
      setNotificationType("error");
      return;
    }

    setIsLoading(true);
    setNotification("Adding tickers to universe...");
    setNotificationType("loading");

    try {
      const symbols = bulkSymbols
        .split(/[,	\s]+/)
        .map(sym => sym.trim().toUpperCase())
        .filter(Boolean)
        .filter(isValidTicker);

      if (symbols.length === 0) {
        setNotification("No valid ticker symbols found");
        setNotificationType("error");
        return;
      }

      const existingSymbols = new Set((universe?.items || []).map(item => item.symbol));
      const newSymbols = symbols.filter(sym => !existingSymbols.has(sym));

      if (newSymbols.length === 0) {
        setNotification("All symbols already exist in universe");
        setNotificationType("info");
        return;
      }

      const newItems = [];
      for (const symbol of newSymbols) {
        const normalizedSymbol = normalizeSymbol(symbol);
        
        // Create ticker with basic data
        const tickerData = await createTicker(normalizedSymbol, "real");
        
        if (tickerData && tickerData.historicalData && tickerData.historicalData.length > 0) {
          const latestData = tickerData.historicalData[tickerData.historicalData.length - 1];
          const high = latestData.high || latestData.price;
          const low = latestData.low || latestData.price;
          const close = latestData.price;
          
          const atr = calculateATR(high, low, close);
          
          const newItem = {
            id: uuidv4(),
            symbol: normalizedSymbol,
            lastPrice: Number(latestData.price.toFixed(2)),
            atr: Number(atr.toFixed(5)),
            flags: {
              news: false,
              ema: false,
              rsi: false,
              sma: false
            },
            entryPrice: "",
            notes: "",
            stopLoss: "",
            takeProfit: "",
            positionSize: ""
          };
          
          newItems.push(newItem);
        }
      }

      setUniverse(prev => ({
        ...prev,
        items: [...(prev?.items || []), ...newItems]
      }));
      setBulkSymbols("");
      setNotification(`Added ${newItems.length} tickers to universe`);
      setNotificationType("success");

    } catch (error) {
      console.error("Error adding tickers:", error);
      setNotification("Failed to add tickers");
      setNotificationType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (id, field, value) => {
    setUniverse(prev => ({
      ...prev,
      items: (prev?.items || []).map(item => {
        if (item.id === id) {
          const updated = { ...item };
          
          if (field === 'flags') {
            updated.flags = { ...updated.flags, ...value };
          } else {
            updated[field] = value;
          }

          // Auto-calculate SL, TP, and position size when entry price and ATR are available
          if (field === 'entryPrice' || field === 'atr') {
            const entryPrice = field === 'entryPrice' ? parseFloat(value) : updated.entryPrice;
            const atr = field === 'atr' ? parseFloat(value) : updated.atr;
            
            if (entryPrice && atr && entryPrice > 0 && atr > 0) {
              const { stopLoss, takeProfit, positionSize } = calculateSLandTP(
                entryPrice, 
                atr, 
                screenerSettings.accountSize, 
                screenerSettings.riskPercent
              );
              updated.stopLoss = stopLoss.toFixed(2);
              updated.takeProfit = takeProfit.toFixed(2);
              updated.positionSize = positionSize.toFixed(2);
            }
          }

          return updated;
        }
        return item;
      })
    }));
  };

  const handleDeleteItem = (id) => {
    setUniverse(prev => ({
      ...prev,
      items: (prev?.items || []).filter(item => item.id !== id)
    }));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === (universe?.items?.length || 0)) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set((universe?.items || []).map(item => item.id)));
    }
  };

  const handleCreateWatchlist = () => {
    if (selectedItems.size === 0) {
      setNotification("Please select at least one ticker");
      setNotificationType("error");
      return;
    }

    try {
      const selectedUniverseItems = (universe?.items || []).filter(item => selectedItems.has(item.id));
      const watchlists = JSON.parse(localStorage.getItem("burnlist_watchlists") || "{}");
      
      // Create new watchlist
      const watchlistId = uuidv4();
      const watchlistName = `Screener ${new Date().toLocaleDateString()}`;
      const watchlistSlug = watchlistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const newWatchlist = {
        id: watchlistId,
        name: watchlistName,
        slug: watchlistSlug,
        items: selectedUniverseItems.map(item => ({
          symbol: item.symbol,
          buyPrice: parseFloat(item.entryPrice) || 0,
          buyDate: new Date().toISOString(),
          historicalData: [] // Will be populated by the fetch manager
        })),
        reason: `Created from screener with ${selectedUniverseItems.length} tickers`,
        createdAt: new Date().toISOString()
      };

      const updatedWatchlists = { ...watchlists, [watchlistId]: newWatchlist };
      localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
      
      setNotification(`Created watchlist "${watchlistName}" with ${selectedUniverseItems.length} tickers`);
      setNotificationType("success");
      setSelectedItems(new Set());
      
    } catch (error) {
      console.error("Error creating watchlist:", error);
      setNotification("Failed to create watchlist");
      setNotificationType("error");
    }
  };

  const handleSettingsChange = (field, value) => {
    setScreenerSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Sort function
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Get sorted and filtered universe
  const sortedUniverse = [...(universe?.items || [])]
    .map(item => {
      // Prepare metrics for buy score calculation
      const metrics = {
        epsGrowth: item.epsGrowth || 0,
        avgVolume: item.avgVolume || 0,
        relVolume: item.relVolume || 1,
        technicalFlags: (item.flags.ema || item.flags.rsi || item.flags.sma) ? true : false,
        earningsDaysAway: item.earningsDaysAway || 10,
        price: item.lastPrice || 0,
        pe: item.pe || 15,
        marketCap: item.marketCap || 500000000,
        debtEquity: item.debtEquity || 0.25,
        pb: item.pb || 1.1,
        beta: item.beta || 1.5,
        newsFlag: item.flags.news || false,
        sectorAlignment: item.sectorAlignment || false,
        marketSupport: item.marketSupport || false,
        volatilityClear: item.volatilityClear || false,
        breadthHealthy: item.breadthHealthy || false,
      };
      const scoreObj = calculateBuyScore(metrics);
      return { ...item, _buyScore: scoreObj.totalBuyScore, _buyTag: scoreObj.tag };
    })
    .filter(item => item._buyScore >= minBuyScore)
    .sort((a, b) => {
      if (sortConfig.key === "_buyScore") {
        return sortConfig.direction === "asc" ? a._buyScore - b._buyScore : b._buyScore - a._buyScore;
      }
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (sortConfig.key === "symbol") {
        return sortConfig.direction === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    });

  // Render sort arrow
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div style={{ backgroundColor: isInverted ? 'rgb(140,185,162)' : 'transparent', minHeight: '100vh', color: isInverted ? '#000000' : '#ffffff', padding: '20px' }}>
      {/* Notification Banner */}
      {notification && (
        <div style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 10001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ minWidth: 320, maxWidth: 480, pointerEvents: 'auto' }}>
            <NotificationBanner
              message={notification}
              type={notificationType}
              onClose={() => setNotification("")}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h1 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: 0 }}>
            {universe?.name || 'UNIVERSE SCREENER'}
          </h1>
          <Link to="/universes" style={{ textDecoration: "none" }}>
            <CustomButton>← BACK</CustomButton>
          </Link>
        </div>

        {/* Settings Panel */}
        <div style={{ 
          border: `1px solid ${CRT_GREEN}`, 
          padding: "15px", 
          marginBottom: "20px",
          backgroundColor: "rgba(0,0,0,0.3)"
        }}>
          <h3 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: "0 0 15px 0" }}>
            SCREENER SETTINGS
          </h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <label style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: "14px" }}>
                Account Size ($):
              </label>
              <input
                type="number"
                value={screenerSettings.accountSize}
                onChange={(e) => handleSettingsChange('accountSize', e.target.value)}
                style={{
                  backgroundColor: "black",
                  color: CRT_GREEN,
                  border: `1px solid ${CRT_GREEN}`,
                  padding: "5px 10px",
                  fontFamily: "'Courier New', monospace",
                  marginLeft: "10px"
                }}
              />
            </div>
            <div>
              <label style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: "14px" }}>
                Risk %:
              </label>
              <input
                type="number"
                step="0.1"
                value={screenerSettings.riskPercent}
                onChange={(e) => handleSettingsChange('riskPercent', e.target.value)}
                style={{
                  backgroundColor: "black",
                  color: CRT_GREEN,
                  border: `1px solid ${CRT_GREEN}`,
                  padding: "5px 10px",
                  fontFamily: "'Courier New', monospace",
                  marginLeft: "10px"
                }}
              />
            </div>
          </div>
        </div>

        {/* Bulk Add Input */}
        <div style={{ 
          border: `1px solid ${CRT_GREEN}`, 
          padding: "15px", 
          marginBottom: "20px",
          backgroundColor: "rgba(0,0,0,0.3)"
        }}>
          <h3 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: "0 0 15px 0" }}>
            BULK ADD TICKERS
          </h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: "14px", display: "block", marginBottom: "5px" }}>
                Ticker Symbols (comma, space, or tab separated):
              </label>
              <textarea
                value={bulkSymbols}
                onChange={(e) => setBulkSymbols(e.target.value)}
                placeholder="AAPL, MSFT, GOOGL, TSLA..."
                style={{
                  width: "100%",
                  height: "80px",
                  backgroundColor: "black",
                  color: CRT_GREEN,
                  border: `1px solid ${CRT_GREEN}`,
                  padding: "10px",
                  fontFamily: "'Courier New', monospace",
                  resize: "vertical"
                }}
              />
            </div>
            <CustomButton 
              onClick={handleBulkAdd}
              disabled={isLoading || !bulkSymbols.trim()}
            >
              {isLoading ? "ADDING..." : "ADD TICKERS"}
            </CustomButton>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <CustomButton onClick={handleSelectAll}>
            {selectedItems.size === (universe?.items?.length || 0) ? "DESELECT ALL" : "SELECT ALL"}
          </CustomButton>
          <CustomButton 
            onClick={handleCreateWatchlist}
            disabled={selectedItems.size === 0}
          >
            CREATE WATCHLIST FROM SELECTED ({selectedItems.size})
          </CustomButton>
                 </div>
       </div>

       {/* Universe Summary */}
       {(universe?.items?.length || 0) > 0 && (
         <div style={{ 
           border: `1px solid ${CRT_GREEN}`, 
           padding: "15px", 
           marginBottom: "20px",
           backgroundColor: "rgba(0,0,0,0.3)"
         }}>
           <h3 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: "0 0 15px 0" }}>
             UNIVERSE SUMMARY
           </h3>
           <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "14px" }}>
             <div>Total Tickers: <strong>{universe?.items?.length || 0}</strong></div>
             <div>Selected: <strong>{selectedItems.size}</strong></div>
             <div>With Entry Price: <strong>{(universe?.items || []).filter(item => item.entryPrice).length}</strong></div>
             <div>With ATR: <strong>{(universe?.items || []).filter(item => item.atr > 0).length}</strong></div>
             <div>With Notes: <strong>{(universe?.items || []).filter(item => item.notes.trim()).length}</strong></div>
           </div>
         </div>
       )}

              {/* Edit Mode Toggle */}
       {(universe?.items?.length || 0) > 0 && (
         <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
           <button
             onClick={() => setEditMode(e => !e)}
             style={{
               background: editMode ? CRT_GREEN : 'black',
               color: editMode ? 'black' : CRT_GREEN,
               border: `1px solid ${CRT_GREEN}`,
               borderRadius: 4,
               padding: '4px 16px',
               fontFamily: "'Courier New', monospace",
               fontWeight: 700,
               cursor: 'pointer',
               marginRight: 16
             }}
           >
             {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
           </button>
           <label style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: 14 }}>
             Min Buy Score:
             <input
               type="number"
               min={0}
               max={100}
               value={minBuyScore}
               onChange={e => setMinBuyScore(Number(e.target.value) || 0)}
               style={{
                 backgroundColor: "black",
                 color: CRT_GREEN,
                 border: `1px solid ${CRT_GREEN}`,
                 padding: "2px 8px",
                 fontFamily: "'Courier New', monospace",
                 marginLeft: 8,
                 width: 60
               }}
             />
           </label>
         </div>
       )}

              {/* Edit Mode Button and Filter */}
       {(universe?.items?.length || 0) > 0 && (
         <div style={{
           marginBottom: 20,
           display: 'flex',
           alignItems: 'center',
           gap: 32,
           justifyContent: 'flex-start',
           position: 'sticky',
           top: 0,
           zIndex: 10,
           background: 'black',
           padding: '12px 0',
           borderBottom: `2px solid ${CRT_GREEN}`
         }}>
           <button
             onClick={() => setEditMode(e => !e)}
             style={{
               background: editMode ? CRT_GREEN : 'black',
               color: editMode ? 'black' : CRT_GREEN,
               border: `2px solid ${CRT_GREEN}`,
               borderRadius: 6,
               padding: '8px 28px',
               fontFamily: "'Courier New', monospace",
               fontWeight: 700,
               fontSize: 18,
               cursor: 'pointer',
               boxShadow: editMode ? `0 0 8px 2px ${CRT_GREEN}` : 'none',
               display: 'flex',
               alignItems: 'center',
               gap: 10,
               transition: 'all 0.2s',
             }}
             title={editMode ? 'Exit Edit Mode' : 'Edit Buy Score Metrics'}
           >
             {editMode ? <FaCheck /> : <FaEdit />} {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
           </button>
           <label style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
             Min Buy Score:
             <input
               type="number"
               min={0}
               max={100}
               value={minBuyScore}
               onChange={e => setMinBuyScore(Number(e.target.value) || 0)}
               style={{
                 backgroundColor: "black",
                 color: CRT_GREEN,
                 border: `2px solid ${CRT_GREEN}`,
                 padding: "6px 14px",
                 fontFamily: "'Courier New', monospace",
                 borderRadius: 4,
                 width: 70,
                 fontSize: 16
               }}
             />
           </label>
         </div>
       )}

              {/* Universe Table */}
       {(universe?.items?.length || 0) > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            color: CRT_GREEN,
            background: 'black',
            fontFamily: 'Courier New',
            border: `2px solid ${CRT_GREEN}`,
            fontSize: "15px",
            boxShadow: `0 2px 16px 0 rgba(140,185,162,0.08)`
          }}>
                         <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'black', borderBottom: `2px solid ${CRT_GREEN}` }}>
               <tr style={{ borderBottom: `2px solid ${CRT_GREEN}` }}>
                 <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>
                   <input
                     type="checkbox"
                     checked={selectedItems.size === (universe?.items?.length || 0) && (universe?.items?.length || 0) > 0}
                     onChange={handleSelectAll}
                     style={{ accentColor: CRT_GREEN }}
                   />
                 </th>
                 <th 
                   onClick={() => handleSort("symbol")} 
                   style={{ padding: "8px", textAlign: "left", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}
                 >
                   Symbol {renderSortArrow("symbol")}
                 </th>
                 <th 
                   onClick={() => handleSort("lastPrice")} 
                   style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}
                 >
                   Last Price {renderSortArrow("lastPrice")}
                 </th>
                 <th 
                   onClick={() => handleSort("atr")} 
                   style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}
                 >
                   ATR(14) {renderSortArrow("atr")}
                 </th>
                 <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Flags</th>
                 <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: 'pointer' }} onClick={() => handleSort("_buyScore")}>Buy Score {renderSortArrow("_buyScore")}</th>
                 <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Tag</th>
                 {editMode && (
                   <>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>EPS Growth</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Avg Volume</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Rel Volume</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Earnings Days Away</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>P/E</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Market Cap</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Debt/Equity</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>P/B</th>
                     <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Beta</th>
                     <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Sector Align</th>
                     <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Market Support</th>
                     <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Volatility Clear</th>
                     <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Breadth Healthy</th>
                   </>
                 )}
                 <th onClick={() => handleSort("entryPrice")} style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}>
                   Entry Price {renderSortArrow("entryPrice")}
                 </th>
                 <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>SL</th>
                 <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>TP</th>
                 <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Position Size</th>
                 <th style={{ padding: "8px", textAlign: "left", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Notes</th>
                 <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black' }}>Actions</th>
               </tr>
             </thead>
                         <tbody>
               {sortedUniverse.map((item, idx) => (
                <tr key={item.id} style={{
                  borderBottom: `1px solid ${CRT_GREEN}`,
                  background: editMode ? (idx % 2 === 0 ? '#101c18' : '#1a2a24') : (idx % 2 === 0 ? '#0a0a0a' : '#181818'),
                  transition: 'background 0.2s',
                  boxShadow: editMode ? `0 0 8px 0 ${CRT_GREEN}22` : 'none',
                  outline: editMode ? `1.5px solid ${CRT_GREEN}33` : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = editMode ? '#1e2e28' : '#232323'}
                onMouseLeave={e => e.currentTarget.style.background = editMode ? (idx % 2 === 0 ? '#101c18' : '#1a2a24') : (idx % 2 === 0 ? '#0a0a0a' : '#181818')}
                >
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      style={{ accentColor: CRT_GREEN }}
                    />
                  </td>
                  <td style={{ padding: "8px", textAlign: "left" }}>{item.symbol}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>${item.lastPrice.toFixed(2)}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    <input
                      type="number"
                      step="0.00001"
                      value={item.atr}
                      onChange={(e) => handleItemChange(item.id, 'atr', parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: "black",
                        color: CRT_GREEN,
                        border: "none",
                        textAlign: "right",
                        fontFamily: "'Courier New', monospace",
                        width: "80px",
                        borderRadius: 4,
                        border: `1.5px solid ${CRT_GREEN}`,
                        fontSize: 15,
                        boxShadow: item.atr > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                      {Object.entries(item.flags).map(([flag, checked]) => (
                        <label key={flag} style={{ fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleItemChange(item.id, 'flags', { [flag]: e.target.checked })}
                            style={{ accentColor: CRT_GREEN, marginRight: "2px" }}
                          />
                          {flag.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </td>
                  {/* Buy Score Calculation */}
                  {(() => {
                    // Prepare metrics for buy score calculation
                    const metrics = {
                      epsGrowth: item.epsGrowth || 0,
                      avgVolume: item.avgVolume || 0,
                      relVolume: item.relVolume || 1,
                      technicalFlags: (item.flags.ema || item.flags.rsi || item.flags.sma) ? true : false,
                      earningsDaysAway: item.earningsDaysAway || 10,
                      price: item.lastPrice || 0,
                      pe: item.pe || 15,
                      marketCap: item.marketCap || 500000000,
                      debtEquity: item.debtEquity || 0.25,
                      pb: item.pb || 1.1,
                      beta: item.beta || 1.5,
                      newsFlag: item.flags.news || false,
                      // Context toggles (for now, default to false)
                      sectorAlignment: item.sectorAlignment || false,
                      marketSupport: item.marketSupport || false,
                      volatilityClear: item.volatilityClear || false,
                      breadthHealthy: item.breadthHealthy || false,
                    };
                    const scoreObj = calculateBuyScore(metrics);
                    // Color for tag
                    const tagColors = {
                      'Prime Entry': CRT_GREEN,
                      'Almost Ready': '#b5b56b',
                      'Standby': '#888888',
                    };
                    return [
                      <td key="buy-score" style={{ padding: "8px", textAlign: "center" }}>
                        <div style={{ width: 80, background: '#222', borderRadius: 4, height: 12, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}>
                          <div style={{ height: 12, borderRadius: 4, background: tagColors[scoreObj.tag], width: `${scoreObj.totalBuyScore}%`, transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, color: tagColors[scoreObj.tag], marginLeft: 4 }}>{scoreObj.totalBuyScore}</span>
                      </td>,
                      <td key="buy-tag" style={{ padding: "8px", textAlign: "center" }}>
                        <span style={{ background: tagColors[scoreObj.tag], color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{scoreObj.tag}</span>
                      </td>
                    ];
                  })()}
                  {editMode && (
                    <>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.epsGrowth || ''} onChange={e => handleItemChange(item.id, 'epsGrowth', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.epsGrowth > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.avgVolume || ''} onChange={e => handleItemChange(item.id, 'avgVolume', e.target.value)} style={{ width: 90, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.avgVolume > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.relVolume || ''} onChange={e => handleItemChange(item.id, 'relVolume', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.relVolume > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.earningsDaysAway || ''} onChange={e => handleItemChange(item.id, 'earningsDaysAway', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.earningsDaysAway > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.pe || ''} onChange={e => handleItemChange(item.id, 'pe', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.pe > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.marketCap || ''} onChange={e => handleItemChange(item.id, 'marketCap', e.target.value)} style={{ width: 110, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.marketCap > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.debtEquity || ''} onChange={e => handleItemChange(item.id, 'debtEquity', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.debtEquity > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.pb || ''} onChange={e => handleItemChange(item.id, 'pb', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.pb > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <input type="number" value={item.beta || ''} onChange={e => handleItemChange(item.id, 'beta', e.target.value)} style={{ width: 70, background: 'black', color: CRT_GREEN, border: 'none', fontFamily: "'Courier New', monospace", borderRadius: 4, border: `1.5px solid ${CRT_GREEN}`, fontSize: 15, boxShadow: item.beta > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none' }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <input type="checkbox" checked={item.sectorAlignment || false} onChange={e => handleItemChange(item.id, 'sectorAlignment', e.target.checked)} style={{ accentColor: CRT_GREEN }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <input type="checkbox" checked={item.marketSupport || false} onChange={e => handleItemChange(item.id, 'marketSupport', e.target.checked)} style={{ accentColor: CRT_GREEN }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <input type="checkbox" checked={item.volatilityClear || false} onChange={e => handleItemChange(item.id, 'volatilityClear', e.target.checked)} style={{ accentColor: CRT_GREEN }} />
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <input type="checkbox" checked={item.breadthHealthy || false} onChange={e => handleItemChange(item.id, 'breadthHealthy', e.target.checked)} style={{ accentColor: CRT_GREEN }} />
                      </td>
                    </>
                  )}
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.entryPrice}
                      onChange={(e) => handleItemChange(item.id, 'entryPrice', e.target.value)}
                      placeholder="0.00"
                      style={{
                        backgroundColor: "black",
                        color: CRT_GREEN,
                        border: "none",
                        textAlign: "right",
                        fontFamily: "'Courier New', monospace",
                        width: "80px",
                        borderRadius: 4,
                        border: `1.5px solid ${CRT_GREEN}`,
                        fontSize: 15,
                        boxShadow: item.entryPrice > 0 ? `0 0 4px 0 ${CRT_GREEN}22` : 'none'
                      }}
                    />
                  </td>
                                     <td style={{ padding: "8px", textAlign: "right" }}>
                     {item.stopLoss ? `$${item.stopLoss}` : '-'}
                   </td>
                   <td style={{ padding: "8px", textAlign: "right" }}>
                     {item.takeProfit ? `$${item.takeProfit}` : '-'}
                   </td>
                   <td style={{ padding: "8px", textAlign: "right" }}>
                     {item.positionSize ? item.positionSize : '-'}
                   </td>
                  <td style={{ padding: "8px", textAlign: "left" }}>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                      placeholder="Notes..."
                      style={{
                        backgroundColor: "black",
                        color: CRT_GREEN,
                        border: "none",
                        fontFamily: "'Courier New', monospace",
                        width: "120px",
                        borderRadius: 4,
                        border: `1.5px solid ${CRT_GREEN}`,
                        fontSize: 15,
                        boxShadow: item.notes.trim() ? `0 0 4px 0 ${CRT_GREEN}22` : 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <CustomButton
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ padding: "2px 8px", fontSize: "12px" }}
                    >
                      DEL
                    </CustomButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!universe && (
        <div style={{ 
          textAlign: "center", 
          color: "#999", 
          fontFamily: "'Courier New', monospace",
          marginTop: "50px"
        }}>
          ⚠️ Universe not found.
        </div>
      )}
      {universe && (universe?.items?.length || 0) === 0 && (
        <div style={{ 
          textAlign: "center", 
          color: "#999", 
          fontFamily: "'Courier New', monospace",
          marginTop: "50px"
        }}>
          ⚠️ No tickers in universe yet. Add some tickers above to get started.
        </div>
      )}
    </div>
  );
};

export default UniverseScreenerPage; 