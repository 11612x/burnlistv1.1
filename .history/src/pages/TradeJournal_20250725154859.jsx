import React, { useState, useEffect } from "react";
import { useTheme } from '../ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import greenflag from '../assets/greenflag.png';
import yellowflag from '../assets/yellowflag.png';
import redflag from '../assets/redflag.png';
import backbutton from '../assets/backbutton.png';

const CRT_GREEN = 'rgb(140,185,162)';

const TradeJournal = () => {
  const { isInverted } = useTheme();
  const navigate = useNavigate();
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

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(trade => 
      trade.id === id ? { ...trade, ...updates } : trade
    ));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
    setNotification("Trade deleted");
    setNotificationType("success");
    setTimeout(() => setNotification(""), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  return (
    <div style={{ 
      backgroundColor: isInverted ? 'rgb(140,185,162)' : '#000000', 
      color: isInverted ? '#000000' : '#ffffff', 
      minHeight: '100vh',
      padding: '0',
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: `2px solid ${CRT_GREEN}`,
        background: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <CustomButton
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <img 
              src={backbutton} 
              alt="Back" 
              style={{ 
                width: '24px', 
                height: '24px',
                filter: isInverted ? 'invert(1)' : 'none'
              }} 
            />
          </CustomButton>
          <h1 style={{ 
            color: CRT_GREEN, 
            margin: 0, 
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            TRADE JOURNAL
          </h1>
        </div>
        <div style={{ color: CRT_GREEN, fontSize: '14px' }}>
          {trades.length} Trades Logged
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          message={notification}
          type={notificationType}
          onClose={() => setNotification("")}
        />
      )}

      {/* Main Content */}
      <div style={{ padding: '20px' }}>
        {trades.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: CRT_GREEN,
            fontSize: '18px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              📊 No executed trades yet
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Execute trades from the Universe page to see them here
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${CRT_GREEN}`,
              fontSize: '14px',
              tableLayout: 'fixed',
              lineHeight: '24px'
            }}>
                              <thead>
                <tr style={{ 
                  background: 'rgba(140,185,162,0.1)',
                  borderBottom: `2px solid ${CRT_GREEN}`,
                  height: '40px'
                }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Ticker
                  </th>
                  <th style={{ padding: '8px', textAlign: 'left', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Setup
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    R:R
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Verdict
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Outcome
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Entry
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Stop
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Target
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Position
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Date
                  </th>
                  <th style={{ padding: '8px', textAlign: 'center', height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                                 {trades.map((trade, index) => (
                   <tr 
                     key={trade.id}
                     style={{ 
                       borderBottom: `1px solid ${CRT_GREEN}`,
                       background: index % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                       height: '40px'
                     }}
                   >
                                                                  <td style={{ padding: '0px', borderRight: `1px solid ${CRT_GREEN}`, fontWeight: 'bold', height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         {trade.ticker}
                       </td>
                       <td style={{ padding: '0px', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         {trade.setup || trade.setupType || 'Manual'}
                       </td>
                       <td style={{ padding: '0px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         {trade.riskReward ? `${trade.riskReward}:1` : 'N/A'}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '24px', maxHeight: '24px' }}>
                           <img 
                             src={trade.verdictFlag || greenflag} 
                             alt={trade.verdict} 
                             style={{ width: '14px', height: '14px' }} 
                           />
                           <span style={{ fontSize: '12px', lineHeight: '14px' }}>{trade.verdict || 'Qualified'}</span>
                         </div>
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         <select
                           value={trade.outcome || 'Open'}
                           onChange={(e) => updateTrade(trade.id, { outcome: e.target.value })}
                           style={{
                             background: 'transparent',
                             color: CRT_GREEN,
                             border: `1px solid ${CRT_GREEN}`,
                             padding: '2px 4px',
                             fontFamily: "'Courier New', monospace",
                             fontSize: '11px',
                             cursor: 'pointer',
                             height: '35px',
                             maxHeight: '35px',
                             lineHeight: '31px'
                           }}
                         >
                           <option value="Open">Open</option>
                           <option value="Win">Win</option>
                           <option value="Loss">Loss</option>
                           <option value="Break Even">Break Even</option>
                         </select>
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                         ${trade.entryPrice ? trade.entryPrice.toFixed(2) : 'N/A'}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                         ${trade.stopLoss ? trade.stopLoss.toFixed(2) : 'N/A'}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                         ${trade.target ? trade.target.toFixed(2) : 'N/A'}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                         {trade.positionSize ? `${trade.positionSize} shares` : 'N/A'}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', borderRight: `1px solid ${CRT_GREEN}`, height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle' }}>
                         {trade.executedAt ? formatDate(trade.executedAt) : formatDate(trade.date)}
                       </td>
                       <td style={{ padding: '8px', textAlign: 'center', height: '40px', minHeight: '40px', maxHeight: '40px', lineHeight: '24px', boxSizing: 'border-box', verticalAlign: 'middle', overflow: 'hidden' }}>
                         <CustomButton
                           onClick={() => deleteTrade(trade.id)}
                           style={{
                             background: 'none',
                             border: 'none',
                             color: '#ff4444',
                             padding: '2px 4px',
                             fontSize: '10px',
                             cursor: 'pointer',
                             height: '20px',
                             maxHeight: '20px',
                             lineHeight: '16px'
                           }}
                         >
                           DELETE
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