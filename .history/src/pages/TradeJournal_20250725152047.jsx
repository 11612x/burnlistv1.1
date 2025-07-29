import React, { useState, useEffect } from "react";
import { useTheme } from '../ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import greenflag from '../assets/greenflag.png';
import yellowflag from '../assets/yellowflag.png';
import redflag from '../assets/redflag.png';
import backbutton from '../assets/backbutton.png';
import box from '../assets/box.png';
import checkbox from '../assets/checkbox.png';

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

const TradeJournal = () => {
  const { isInverted } = useTheme();
  const navigate = useNavigate();
  const [selectedSetup, setSelectedSetup] = useState("");
  const [ticker, setTicker] = useState("");
  const [checklistItems, setChecklistItems] = useState({});
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [accountSize, setAccountSize] = useState("");
  const [riskPerTrade, setRiskPerTrade] = useState("2");
  const [overrideReason, setOverrideReason] = useState("");
  const [trades, setTrades] = useState([]);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);

  // Load trades from localStorage on mount
  useEffect(() => {
    const savedTrades = localStorage.getItem("trade_journal_trades");
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (error) {
        console.error("Error loading trades:", error);
      }
    }
  }, []);

  // Save trades to localStorage whenever trades change
  useEffect(() => {
    localStorage.setItem("trade_journal_trades", JSON.stringify(trades));
  }, [trades]);

  // Reset checklist when setup changes
  useEffect(() => {
    if (selectedSetup && SETUP_CONFIGS[selectedSetup]) {
      const newChecklist = {};
      SETUP_CONFIGS[selectedSetup].checklists.forEach(item => {
        newChecklist[item] = false;
      });
      setChecklistItems(newChecklist);
    }
  }, [selectedSetup]);

  const handleChecklistChange = (item) => {
    setChecklistItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
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
    if (!selectedSetup || Object.keys(checklistItems).length === 0) return null;
    
    const totalItems = Object.keys(checklistItems).length;
    const checkedItems = Object.values(checklistItems).filter(Boolean).length;
    const failedItems = totalItems - checkedItems;
    
    if (failedItems === 0) return { type: "qualified", text: "Qualified", flag: greenflag };
    if (failedItems <= 2) return { type: "discretionary", text: "Discretionary", flag: yellowflag };
    return { type: "blocked", text: "Blocked", flag: redflag };
  };

  const handleSubmit = () => {
    if (!selectedSetup || !entryPrice || !stopLoss || !target) {
      setNotification("Please fill in all required fields");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    const verdict = getVerdict();
    if (!verdict) return;

    const newTrade = {
      id: Date.now(),
      ticker: ticker.toUpperCase(), // Use the ticker from the form
      setupType: SETUP_CONFIGS[selectedSetup].name,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      target: parseFloat(target),
      riskReward: calculateRiskReward(),
      positionSize: calculatePositionSize(),
      verdict: verdict.text,
      verdictType: verdict.type,
      verdictFlag: verdict.flag,
      checklistItems: { ...checklistItems },
      overrideReason: verdict.type !== "qualified" ? overrideReason : "",
      date: new Date().toISOString(),
      notes: "",
      outcome: "pending"
    };

    setTrades(prev => [newTrade, ...prev]);
    
    // Reset form
    setSelectedSetup("");
    setTicker("");
    setChecklistItems({});
    setEntryPrice("");
    setStopLoss("");
    setTarget("");
    setOverrideReason("");
    
    setNotification("Trade logged successfully");
    setNotificationType("success");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleFetchFinviz = async () => {
    if (!ticker) {
      setNotification("Enter a ticker first");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 2000);
      return;
    }
    setIsFetching(true);
    setNotification("Fetching data from Finviz...");
    setNotificationType("info");
    try {
      const res = await fetch(`http://localhost:5001/api/finviz/${ticker}`);
      const data = await res.json();
      setFetchedData(data);
      setNotification("Finviz data loaded!");
      setNotificationType("success");
    } catch (err) {
      setNotification("Failed to fetch from Finviz");
      setNotificationType("error");
    }
    setIsFetching(false);
    setTimeout(() => setNotification(""), 2000);
  };

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(trade => 
      trade.id === id ? { ...trade, ...updates } : trade
    ));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
  };

  const riskReward = calculateRiskReward();
  const positionSize = calculatePositionSize();
  const verdict = getVerdict();

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Courier New',
      color: isInverted ? '#000' : CRT_GREEN,
      background: isInverted ? CRT_GREEN : '#000',
      minHeight: '100vh'
    }}>
      <NotificationBanner 
        message={notification} 
        type={notificationType} 
        onClose={() => setNotification("")}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <CustomButton
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: 'transparent',
            color: CRT_GREEN,
            border: 'none',
            padding: '8px 12px',
            marginRight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={backbutton} 
            alt="Back"
            style={{ 
              width: '20px', 
              height: '20px',
              filter: 'brightness(0) saturate(100%) invert(85%) sepia(15%) saturate(638%) hue-rotate(89deg) brightness(95%) contrast(87%)'
            }}
          />
        </CustomButton>
        <h1 style={{ fontSize: '24px', margin: 0, flex: 1, textAlign: 'center' }}>
          TRADE JOURNAL & EXECUTION FILTER
        </h1>
      </div>





      {/* Entry Details */}
      {selectedSetup && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>3. ENTRY DETAILS</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ticker Symbol:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'transparent',
                    border: `1px solid ${CRT_GREEN}`,
                    color: CRT_GREEN,
                    fontFamily: 'Courier New',
                    textTransform: 'uppercase'
                  }}
                />
                <CustomButton
                  onClick={handleFetchFinviz}
                  disabled={isFetching || !ticker}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  {isFetching ? "Fetching..." : "Fetch from Finviz"}
                </CustomButton>
              </div>
              {fetchedData && (
                <div style={{ marginTop: 10, border: `1px solid ${CRT_GREEN}`, padding: 10 }}>
                  <strong>Finviz Snapshot:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {Object.entries(fetchedData.snapshot || {}).map(([key, value]) => (
                      <div key={key}><strong>{key}:</strong> {value}</div>
                    ))}
                  </div>
                  {fetchedData.news && fetchedData.news.length > 0 && (
                    <>
                      <strong>News:</strong>
                      <ul>
                        {fetchedData.news.slice(0, 3).map((item, idx) => (
                          <li key={idx}><a href={`https://finviz.com${item.url}`} target="_blank" rel="noopener noreferrer">{item.headline}</a></li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Entry Price:</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Stop Loss:</label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Target:</label>
              <input
                type="number"
                step="0.01"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Risk Management */}
      {selectedSetup && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>4. RISK MANAGEMENT</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Account Size ($):</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Risk Per Trade (%):</label>
              <input
                type="number"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New'
                }}
              />
            </div>
          </div>
          
          {/* Calculations Display */}
          <div style={{ 
            marginTop: '15px',
            padding: '15px',
            border: `1px solid ${CRT_GREEN}`,
            background: 'rgba(140,185,162,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <strong>Risk:Reward:</strong> {riskReward ? `${riskReward}:1` : 'N/A'}
              </div>
              <div>
                <strong>Position Size:</strong> {positionSize ? `${positionSize} shares` : 'N/A'}
              </div>
              <div>
                <strong>Risk Amount:</strong> {accountSize && riskPerTrade ? 
                  `$${((parseFloat(accountSize) * parseFloat(riskPerTrade) / 100)).toFixed(2)}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>5. SETUP VERDICT</h2>
          <div style={{
            padding: '15px',
            border: `2px solid ${CRT_GREEN}`,
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            background: verdict.type === 'qualified' ? 'rgba(0,255,0,0.1)' : 
                       verdict.type === 'discretionary' ? 'rgba(255,165,0,0.1)' : 
                       'rgba(255,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <img 
              src={verdict.flag} 
              alt={verdict.text}
              style={{ width: '24px', height: '24px' }}
            />
            {verdict.text}
          </div>
          
          {verdict.type !== 'qualified' && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Override Reason (Required for Discretionary/Blocked):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${CRT_GREEN}`,
                  color: CRT_GREEN,
                  fontFamily: 'Courier New',
                  minHeight: '60px'
                }}
                placeholder="Explain why you're proceeding despite failed criteria..."
              />
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {selectedSetup && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <CustomButton
            onClick={handleSubmit}
            disabled={!ticker || !entryPrice || !stopLoss || !target || (verdict?.type !== 'qualified' && !overrideReason)}
            style={{ fontSize: '16px', padding: '12px 24px' }}
          >
            LOG TRADE
          </CustomButton>
        </div>
      )}

      {/* Trade Log */}
      <div>
        <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>TRADE LOG</h2>
        {trades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
            No trades logged yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${CRT_GREEN}`
            }}>
              <thead>
                <tr style={{ background: 'rgba(140,185,162,0.1)' }}>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>Ticker</th>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>Setup</th>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>R:R</th>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>Verdict</th>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>Outcome</th>
                  <th style={{ padding: '10px', border: `1px solid ${CRT_GREEN}`, textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: `1px solid ${CRT_GREEN}` }}>
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>
                      <input
                        type="text"
                        value={trade.ticker}
                        onChange={(e) => updateTrade(trade.id, { ticker: e.target.value })}
                        placeholder="Ticker"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: CRT_GREEN,
                          fontFamily: 'Courier New',
                          width: '80px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>{trade.setup || trade.setupType}</td>
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>{trade.riskReward}:1</td>
                                         <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                         <img 
                           src={trade.verdictFlag || (trade.verdictType === 'qualified' ? greenflag : 
                                                    trade.verdictType === 'discretionary' ? yellowflag : redflag)} 
                           alt={trade.verdict}
                           style={{ width: '16px', height: '16px' }}
                         />
                         {trade.verdict}
                       </div>
                     </td>
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>
                      <select
                        value={trade.outcome}
                        onChange={(e) => updateTrade(trade.id, { outcome: e.target.value })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: CRT_GREEN,
                          fontFamily: 'Courier New'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                        <option value="breakeven">Breakeven</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>
                      <CustomButton
                        onClick={() => deleteTrade(trade.id)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Delete
                      </CustomButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeJournal; 