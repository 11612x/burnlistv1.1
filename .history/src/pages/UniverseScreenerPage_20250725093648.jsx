import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { createTicker } from '@data/createTicker';
import { isValidTicker, normalizeSymbol } from '@data/tickerUtils';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import { useTheme } from '../ThemeContext';
import backButton from '../assets/backbutton.png';
import { calculateBuyScore } from '../data/buyScore';
import { FaEdit, FaCheck, FaTrash } from 'react-icons/fa';
import greenFlag from '../assets/greenflag.png';
import redFlag from '../assets/redflag.png';
import yellowFlag from '../assets/yellowflag.png';
import box from '../assets/box.png';
import checkbox from '../assets/checkbox.png';
import { formatDateEuropean } from '../utils/dateUtils';

const CRT_GREEN = 'rgb(140,185,162)';

// Setup configurations with their specific checklists
const SETUP_CONFIGS = {
  breakout: {
    name: "Breakout",
    checklists: [
      "Horizontal resistance tested at least 2–3 times",
      "Tight consolidation range (3–7 bars) near resistance",
      "No overlapping wicks or indecision candles near breakout zone",
      "Volume increasing into resistance (1-day Relative Volume > 1.5)",
      "RSI between 50–65 and rising",
      "MACD bullish crossover or trending upward",
      "Price within 5% of 52-week high",
      "No major macro event or earnings within next 7 days",
      "Clean air above breakout level (no nearby supply)"
    ],
    newsValidation: [
      "Catalyst present in last 3 days (e.g. earnings beat, analyst upgrade, sector momentum)",
      "Headline or PR confirms why price is reacting",
      "Price action matches news intensity (no fade after news)"
    ]
  },
  pullback: {
    name: "Pullback",
    checklists: [
      "Strong uptrend visible on daily chart",
      "Pullback to support (20 EMA, 50 SMA, or breakout retest)",
      "Low volume during the pullback vs prior rally",
      "Candle structure is clean (no breakdown bars or gaps)",
      "Reversal signal forming (hammer, engulfing, inside bar)",
      "RSI between 35–50, curling up",
      "MACD flattening or turning bullish",
      "Relative Volume (3–5 day avg) > 1.2",
      "No earnings within next 5 days",
      "Pullback has not broken prior swing low"
    ],
    newsValidation: [
      "Recent catalyst (earnings, analyst note, macro driver) caused last rally",
      "Catalyst is still relevant (not priced in / not reversed)",
      "If no news, chart structure alone justifies trade"
    ]
  },
  shortSqueeze: {
    name: "Short Squeeze",
    checklists: [
      "Wide-range breakout candle on high volume",
      "Gap + hold or strong Day 1/Day 2 continuation behavior",
      "Relative Volume (1-day) > 2.0",
      "Beta > 2.0 or Volatility > 4%",
      "RSI between 55–70 (not overbought)",
      "MACD trending upward or freshly crossed",
      "High short float (20%+) confirmed externally (Finviz, Fintel, etc.)",
      "Small float or prior squeeze chart behavior",
      "Room above — no major resistance overhead"
    ],
    newsValidation: [
      "Confirmed event or sentiment driver (e.g. earnings beat, activist, insider buys)",
      "Headline present within last 3 days",
      "If no news: verify price is moving *only* due to float pressure (pure squeeze logic)"
    ]
  },
  postEarnings: {
    name: "Post-Earnings Momentum",
    checklists: [
      "Earnings occurred within last 3 trading days",
      "Large green candle on earnings day with strong close",
      "Price gapped up and held or built above 20 EMA",
      "Day 2 or Day 3 shows continuation or controlled pullback",
      "Relative Volume (1–3 day avg) > 1.5",
      "RSI between 55–70",
      "MACD bullish",
      "No major macro interference (Fed, CPI, etc.) within 3 days",
      "Target zone has room for extension (no hard resistance above)"
    ],
    newsValidation: [
      "Confirm earnings beat — look for revenue + EPS beat and guidance raise",
      "Check press release or SA earnings summary",
      "Ensure market reaction aligns with numbers (not a fake pump)"
    ]
  }
};

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
  const { isInverted } = useTheme();
  const [journalPanelOpen, setJournalPanelOpen] = useState(false);
  const [journalTicker, setJournalTicker] = useState(null);
  const [selectedTradeType, setSelectedTradeType] = useState("");
  const [checklistItems, setChecklistItems] = useState({});
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [accountSize, setAccountSize] = useState("");
  const [riskPerTrade, setRiskPerTrade] = useState("2");
  const [overrideReason, setOverrideReason] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());

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
    setSelectedRows(prev => {
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

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const handleSelectAllRows = () => {
    if (selectedRows.size === (universe?.items?.length || 0)) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set((universe?.items || []).map(item => item.id)));
    }
  };
  const handleMassDelete = () => {
    setUniverse(prev => ({
      ...prev,
      items: (prev?.items || []).filter(item => !selectedRows.has(item.id))
    }));
    setSelectedRows(new Set());
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
      const watchlistName = `Screener ${formatDateEuropean(new Date())}`;
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
    .sort((a, b) => {
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

  const calculateRiskReward = () => {
    if (!entryPrice || !stopLoss || !target) return null;
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const targetPrice = parseFloat(target);
    
    if (entry <= 0 || stop <= 0 || targetPrice <= 0) return null;
    
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(targetPrice - entry);
    
    if (risk === 0) return null;
    
    return (reward / risk).toFixed(2);
  };

  const calculatePositionSize = () => {
    if (!accountSize || !riskPerTrade || !entryPrice || !stopLoss) return null;
    
    const account = parseFloat(accountSize);
    const riskPercent = parseFloat(riskPerTrade) / 100;
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    
    if (account <= 0 || riskPercent <= 0 || entry <= 0 || stop <= 0) return null;
    
    const riskAmount = account * riskPercent;
    const riskPerShare = Math.abs(entry - stop);
    
    if (riskPerShare === 0) return null;
    
    return Math.floor(riskAmount / riskPerShare);
  };

  const getVerdict = () => {
    if (!selectedTradeType || Object.keys(checklistItems).length === 0) return null;
    
    const totalItems = Object.keys(checklistItems).length;
    const checkedItems = Object.values(checklistItems).filter(Boolean).length;
    const failedItems = totalItems - checkedItems;
    
    if (failedItems === 0) return { type: "qualified", text: "Qualified", flag: greenFlag };
    if (failedItems <= 2) return { type: "discretionary", text: "Discretionary", flag: yellowFlag };
    return { type: "blocked", text: "Blocked", flag: redFlag };
  };

  const handleChecklistChange = (item) => {
    setChecklistItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleJournalClick = (item) => {
    setJournalTicker(item);
    setJournalPanelOpen(true);
    // Pre-fill entry price with current price
    setEntryPrice(item.lastPrice ? item.lastPrice.toString() : "");
  };

  const handleJournalPanelClose = () => {
    setJournalPanelOpen(false);
    setJournalTicker(null);
    setSelectedTradeType("");
    setChecklistItems({});
    setEntryPrice("");
    setStopLoss("");
    setTarget("");
    setOverrideReason("");
  };

  const handleJournalPanelSave = () => {
    if (!journalTicker || !selectedTradeType) return;

    const verdict = getVerdict();
    if (!verdict) return;

    // Update the universe item with journal data
    setUniverse(prev => ({
      ...prev,
      items: (prev?.items || []).map(item => {
        if (item.id === journalTicker.id) {
          return {
            ...item,
            tradeType: selectedTradeType,
            tradeTypeName: SETUP_CONFIGS[selectedTradeType].name,
            journalVerdict: verdict.text,
            journalVerdictType: verdict.type,
            journalVerdictFlag: verdict.flag,
            entryPrice: entryPrice,
            stopLoss: stopLoss,
            target: target,
            riskReward: calculateRiskReward(),
            positionSize: calculatePositionSize(),
            checklistItems: { ...checklistItems },
            overrideReason: verdict.type !== "qualified" ? overrideReason : "",
            journaledAt: new Date().toISOString()
          };
        }
        return item;
      })
    }));

    setJournalPanelOpen(false);
    setJournalTicker(null);
    setSelectedTradeType("");
    setChecklistItems({});
    setEntryPrice("");
    setStopLoss("");
    setTarget("");
    setOverrideReason("");
  };

  // Reset checklist when trade type changes
  useEffect(() => {
    if (selectedTradeType && SETUP_CONFIGS[selectedTradeType]) {
      const newChecklist = {};
      SETUP_CONFIGS[selectedTradeType].checklists.forEach(item => {
        newChecklist[item] = false;
      });
      SETUP_CONFIGS[selectedTradeType].newsValidation.forEach(item => {
        newChecklist[item] = false;
      });
      setChecklistItems(newChecklist);
    }
  }, [selectedTradeType]);

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

      {/* Frameless Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link to="/universes" style={{ display: 'inline-flex', alignItems: 'center', border: 'none', background: 'none', padding: 0, margin: 0, textDecoration: 'none' }} aria-label="back to universes">
          <img src={backButton} alt="back" style={{ width: 24, height: 24, filter: isInverted ? 'invert(1)' : 'none' }} />
        </Link>
        <h1 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: 0, marginLeft: 0, textAlign: 'right', flex: 1 }}>
          {universe?.name || 'UNIVERSE SCREENER'}
        </h1>
      </div>

      {/* Settings Panel */}
      <div style={{ 
        border: `1px solid ${CRT_GREEN}`, 
        padding: "15px", 
        marginBottom: "20px",
        backgroundColor: "rgba(0,0,0,0.3)"
      }}>
        <h3 style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", margin: "0 0 15px 0" }}>
          Account Settings
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

            {/* Universe Table */}
   {(universe?.items?.length || 0) > 0 && (
    <div style={{ overflowX: "auto" }}>
      {/* Edit Mode Toggle and Mass Delete */}
{(universe?.items?.length || 0) > 0 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
    <button
      onClick={() => setEditMode(e => !e)}
      style={{
        background: 'none',
        border: 'none',
        color: CRT_GREEN,
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        padding: '2px 8px',
        borderRadius: 0,
        fontWeight: 400,
        textTransform: 'lowercase',
        letterSpacing: 0,
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: 0,
        boxShadow: 'none',
      }}
    >
      {editMode ? 'done' : 'edit'}
    </button>
  </div>
)}
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
               {editMode ? (
        <input
          type="checkbox"
          checked={selectedRows.size === (universe?.items?.length || 0) && (universe?.items?.length || 0) > 0}
          onChange={handleSelectAllRows}
          style={{ accentColor: CRT_GREEN }}
        />
      ) : null}
             </th>
             <th 
               onClick={() => handleSort("symbol")} 
               style={{ padding: "8px", textAlign: "left", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}
             >
               Symbol {renderSortArrow("symbol")}
             </th>
             <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>
               Trade Type
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
             <th style={{ width: 32, padding: '2px 4px', textAlign: 'center', borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>EMA</th>
             <th style={{ width: 32, padding: '2px 4px', textAlign: 'center', borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>SMA</th>
             <th style={{ width: 32, padding: '2px 4px', textAlign: 'center', borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>RSI</th>
             <th style={{ width: 32, padding: '2px 4px', textAlign: 'center', borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>NEWS</th>
             <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>Buy</th>
             <th onClick={() => handleSort("entryPrice")} style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', cursor: "pointer" }}>
               Entry Price {renderSortArrow("entryPrice")}
             </th>
             <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>SL</th>
             <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>TP</th>
             <th style={{ padding: "8px", textAlign: "right", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>Position Size</th>
             <th style={{ padding: "8px", textAlign: "left", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>Notes</th>
             <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>Journal</th>
             <th style={{ padding: "8px", textAlign: "center", borderBottom: `1px solid ${CRT_GREEN}`, background: 'black', fontSize: 15 }}>Actions</th>
           </tr>
         </thead>
                     <tbody>
           {sortedUniverse.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                borderBottom: `1px solid ${CRT_GREEN}`,
                background: (idx % 2 === 0 ? '#0a0a0a' : '#181818'),
                transition: 'background 0.2s',
                boxShadow: 'none',
                outline: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#232323'}
              onMouseLeave={e => e.currentTarget.style.background = (idx % 2 === 0 ? '#0a0a0a' : '#181818')}
              onClick={e => {
                // Prevent row click from triggering when clicking edit/done or delete buttons or checkboxes/inputs
                if (
                  e.target.closest('button') ||
                  e.target.tagName === 'BUTTON' ||
                  e.target.closest('input')
                ) return;
                handleEditClick(item);
              }}
            >
              <td style={{ padding: "8px", textAlign: "center" }}>
                {editMode ? (
          <input
            type="checkbox"
            checked={selectedRows.has(item.id)}
            onChange={() => handleSelectRow(item.id)}
            style={{ accentColor: CRT_GREEN }}
          />
        ) : null}
              </td>
              <td style={{ padding: "8px", textAlign: "left" }}>{item.symbol}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                {editMode ? (
                  <select
                    value={item.tradeType || ""}
                    onChange={(e) => handleItemChange(item.id, 'tradeType', e.target.value)}
                    style={{
                      background: 'black',
                      color: CRT_GREEN,
                      border: `1px solid ${CRT_GREEN}`,
                      padding: '2px 4px',
                      fontFamily: 'Courier New',
                      fontSize: 12
                    }}
                  >
                    <option value="">Select</option>
                    <option value="breakout">Breakout</option>
                    <option value="pullback">Pullback</option>
                    <option value="shortSqueeze">Short Squeeze</option>
                    <option value="postEarnings">Post-Earnings</option>
                  </select>
                ) : (
                  <span style={{ fontSize: 12 }}>
                    {item.tradeTypeName || '-'}
                  </span>
                )}
              </td>
              <td style={{ padding: "8px", textAlign: "right" }}>${item.lastPrice.toFixed(2)}</td>
              <td style={{ padding: "8px", textAlign: "right" }}>
                {item.atr !== undefined && item.atr !== null ? item.atr : '-'}
              </td>
              <td style={{ width: 32, padding: '2px 4px', textAlign: 'center' }}>
                <img src={item.flags.ema ? greenFlag : redFlag} alt="EMA" title="EMA" style={{ width: 13, height: 13, verticalAlign: 'middle', filter: 'drop-shadow(0 0 1px #222)' }} />
              </td>
              <td style={{ width: 32, padding: '2px 4px', textAlign: 'center' }}>
                <img src={item.flags.sma ? greenFlag : redFlag} alt="SMA" title="SMA" style={{ width: 13, height: 13, verticalAlign: 'middle', filter: 'drop-shadow(0 0 1px #222)' }} />
              </td>
              <td style={{ width: 32, padding: '2px 4px', textAlign: 'center' }}>
                <img src={item.flags.rsi ? greenFlag : redFlag} alt="RSI" title="RSI" style={{ width: 13, height: 13, verticalAlign: 'middle', filter: 'drop-shadow(0 0 1px #222)' }} />
              </td>
              <td style={{ width: 32, padding: '2px 4px', textAlign: 'center' }}>
                <img src={item.flags.news ? greenFlag : redFlag} alt="NEWS" title="NEWS" style={{ width: 13, height: 13, verticalAlign: 'middle', filter: 'drop-shadow(0 0 1px #222)' }} />
              </td>
              {(() => {
                const metrics = {
                  epsGrowth: item.epsGrowth,
                  avgVolume: item.avgVolume,
                  relVolume: item.relVolume,
                  technicalFlags: (item.flags.ema || item.flags.rsi || item.flags.sma) ? true : false,
                  earningsDaysAway: item.earningsDaysAway,
                  price: item.lastPrice,
                  pe: item.pe,
                  marketCap: item.marketCap,
                  beta: item.beta,
                  newsFlag: item.flags.news,
                  sectorAlignment: item.sectorAlignment,
                  marketSupport: item.marketSupport,
                  volatilityClear: item.volatilityClear,
                  breadthHealthy: item.breadthHealthy,
                };
                const scoreObj = calculateBuyScore(metrics);
                return [
                  <td key="buy-score" style={{ padding: "8px", textAlign: "center" }}>
                    {scoreObj.totalBuyScore !== undefined && scoreObj.totalBuyScore !== null
                      ? (scoreObj.totalBuyScore / 10).toFixed(2)
                      : '-'}
                  </td>
                ];
              })()}
              <td style={{ padding: "8px", textAlign: "right" }}>
                {item.entryPrice !== undefined && item.entryPrice !== null ? item.entryPrice : '-'}
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
                  {editMode ? (
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                      placeholder="Notes..."
                      style={{
                        backgroundColor: "black",
                        color: CRT_GREEN,
                        borderRadius: 4,
                        border: `1.5px solid ${CRT_GREEN}`,
                        fontSize: 15,
                        boxShadow: item.notes.trim() ? `0 0 4px 0 ${CRT_GREEN}22` : 'none',
                        fontFamily: "'Courier New', monospace",
                        width: "120px"
                      }}
                    />
                  ) : (
                    <span style={{ color: CRT_GREEN, fontFamily: "'Courier New', monospace", fontSize: 15 }}>
                      {item.notes || '-'}
                    </span>
                  )}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {item.journalVerdictFlag ? (
                    <img 
                      src={item.journalVerdictFlag} 
                      alt={item.journalVerdict}
                      style={{ width: 16, height: 16, verticalAlign: 'middle' }}
                      title={`${item.journalVerdict} - ${item.tradeTypeName}`}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: '#666' }}>-</span>
                  )}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {editMode ? (
        <>
          <button
            onClick={() => handleJournalClick(item)}
            style={{
              background: 'none',
              border: 'none',
              color: CRT_GREEN,
              fontFamily: "'Courier New', monospace",
              fontSize: '11px',
              padding: '0 2px',
              marginRight: 6,
              cursor: 'pointer',
              textTransform: 'lowercase',
              fontWeight: 400,
              letterSpacing: 0,
              outline: 'none',
              lineHeight: 1.2,
              minWidth: 0,
            }}
          >
            journal
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            style={{
              background: 'none',
              border: 'none',
              color: CRT_GREEN,
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              fontSize: 15,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
            title="Delete Ticker"
          >
            <FaTrash />
          </button>
        </>
      ) : null}
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
    <TickerEditPanel
      ticker={editTicker}
      open={editPanelOpen}
      onClose={handleEditPanelClose}
      onSave={handleEditPanelSave}
    />
    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    width: 420,
    border: `1.5px solid ${CRT_GREEN}`,
    borderRadius: 6,
    background: 'black',
    padding: '8px 12px',
    boxShadow: '0 2px 8px 0 rgba(140,185,162,0.08)'
  }}>
    <textarea
      value={bulkSymbols}
      onChange={e => setBulkSymbols(e.target.value)}
      placeholder="e.g. AAPL, MSFT, GOOGL, TSLA"
      rows={1}
      style={{
        flex: 1,
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '1rem',
        backgroundColor: 'black',
        border: `1px solid ${CRT_GREEN}`,
        color: CRT_GREEN,
        padding: 8,
        resize: 'none',
        boxSizing: 'border-box',
        minWidth: 0,
        marginRight: 10,
        borderRadius: 4,
        width: 260
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleBulkAdd();
        }
      }}
    />
    <CustomButton
      onClick={handleBulkAdd}
      disabled={isLoading || !bulkSymbols.trim()}
      style={{
        backgroundColor: isLoading ? '#222' : CRT_GREEN,
        color: isLoading ? '#888' : 'black',
        border: `1.5px solid ${CRT_GREEN}`,
        borderRadius: 4,
        padding: '8px 18px',
        fontFamily: "'Courier New', monospace",
        fontWeight: 700,
        fontSize: 15,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        minWidth: 80
      }}
    >
      {isLoading ? "ADDING..." : "ADD"}
    </CustomButton>
  </div>
</div>
    </div>
  );
};

export default UniverseScreenerPage; 