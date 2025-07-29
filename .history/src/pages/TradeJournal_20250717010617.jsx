import React, { useState, useEffect } from "react";
import { useTheme } from '../ThemeContext';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import greenflag from '../assets/greenflag.png';
import yellowflag from '../assets/yellowflag.png';
import redflag from '../assets/redflag.png';

const CRT_GREEN = 'rgb(140,185,162)';

// Setup configurations with their specific checklists
const SETUP_CONFIGS = {
  breakout: {
    name: "Breakout",
    checklists: [
      "Price above key resistance level",
      "Volume surge on breakout",
      "Clean breakout (no overlapping candles)",
      "Previous consolidation pattern",
      "No major resistance overhead",
      "RSI not overbought (>70)",
      "Breakout from 20+ day range",
      "Follow-through volume next day",
      "No earnings within 5 days",
      "Stop loss below breakout level"
    ]
  },
  pullback: {
    name: "Pullback",
    checklists: [
      "Pullback to key support level",
      "Volume decreasing on pullback",
      "Bounce from moving average",
      "RSI oversold (<30) or near support",
      "Previous uptrend intact",
      "No breakdown of key support",
      "Candlestick reversal pattern",
      "Volume confirmation on bounce",
      "No major news events",
      "Stop loss below support level"
    ]
  },
  shortSqueeze: {
    name: "Short Squeeze",
    checklists: [
      "High short interest (>20%)",
      "Price above short interest level",
      "Volume explosion",
      "Gap up or strong move",
      "No major resistance overhead",
      "Catalyst-driven move",
      "Short covering evident",
      "Momentum indicators strong",
      "No earnings within 3 days",
      "Stop loss below entry",
      "Risk:Reward at least 1:2"
    ]
  },
  postEarnings: {
    name: "Post-Earnings Momentum",
    checklists: [
      "Earnings beat expectations",
      "Gap up on earnings",
      "Volume surge post-earnings",
      "No gap fill within 2 days",
      "Analyst upgrades",
      "Guidance positive",
      "Sector momentum",
      "No major resistance overhead",
      "RSI not overbought",
      "Stop loss below gap",
      "Risk:Reward at least 1:1.5"
    ]
  }
};

const TradeJournal = () => {
  const { isInverted } = useTheme();
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
      
      <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>
        TRADE JOURNAL & EXECUTION FILTER
      </h1>

      {/* Setup Selection */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>1. SELECT SETUP TYPE</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(SETUP_CONFIGS).map(([key, config]) => (
            <CustomButton
              key={key}
              onClick={() => setSelectedSetup(key)}
              style={{
                background: selectedSetup === key ? CRT_GREEN : 'transparent',
                color: selectedSetup === key ? '#000' : CRT_GREEN,
                border: `2px solid ${CRT_GREEN}`,
                fontWeight: selectedSetup === key ? 'bold' : 'normal'
              }}
            >
              {config.name}
            </CustomButton>
          ))}
        </div>
      </div>

      {/* Checklist */}
      {selectedSetup && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            2. VERIFY SETUP CRITERIA ({SETUP_CONFIGS[selectedSetup].name})
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '10px' 
          }}>
            {SETUP_CONFIGS[selectedSetup].checklists.map((item, index) => (
              <label key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '8px',
                border: `1px solid ${CRT_GREEN}`,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={checklistItems[item] || false}
                  onChange={() => handleChecklistChange(item)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '14px' }}>{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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
            disabled={!entryPrice || !stopLoss || !target || (verdict?.type !== 'qualified' && !overrideReason)}
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
                    <td style={{ padding: '10px', border: `1px solid ${CRT_GREEN}` }}>{trade.setupType}</td>
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