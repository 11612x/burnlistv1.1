import React, { useState, useEffect } from 'react';
import CustomButton from './CustomButton';
import { useTheme } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const OptionsTradeForm = ({ 
  item, 
  onSave, 
  onClose, 
  isOpen 
}) => {
  const { isInverted } = useTheme();
  const green = isInverted ? '#000000' : CRT_GREEN;
  const black = isInverted ? CRT_GREEN : '#000000';
  const white = isInverted ? '#000000' : '#ffffff';

  // Options-specific state
  const [optionType, setOptionType] = useState('call');
  const [strikePrice, setStrikePrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [contracts, setContracts] = useState('');
  const [premium, setPremium] = useState('');
  
  // Standard trade state
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [riskPerTrade, setRiskPerTrade] = useState('2');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setEntryPrice(item.entryPrice || '');
      setStopLoss(item.stopLoss || '');
      setTarget(item.target || '');
      setAccountSize(item.accountSize || '');
      setRiskPerTrade(item.riskPerTrade || '2');
      setNotes(item.notes || '');
      
      // Options-specific fields
      setOptionType(item.optionType || 'call');
      setStrikePrice(item.strikePrice || '');
      setExpiryDate(item.expiryDate || '');
      setContracts(item.contracts || '');
      setPremium(item.premium || '');
    }
  }, [item]);

  const handleSave = () => {
    if (!entryPrice || !stopLoss || !target || !strikePrice || !expiryDate || !contracts) {
      alert('Please fill in all required fields');
      return;
    }

    const tradeData = {
      ...item,
      tradeType: 'option',
      optionType,
      strikePrice: parseFloat(strikePrice),
      expiryDate,
      contracts: parseInt(contracts),
      premium: parseFloat(premium) || 0,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      target: parseFloat(target),
      accountSize: parseFloat(accountSize) || 0,
      riskPerTrade: parseFloat(riskPerTrade),
      notes,
      // Calculate risk:reward for options
      riskReward: calculateRiskReward(),
      positionSize: `${contracts} contracts`
    };

    onSave(tradeData);
  };

  const calculateRiskReward = () => {
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const targetPrice = parseFloat(target);
    
    if (!entry || !stop || !targetPrice) return 0;
    
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(targetPrice - entry);
    
    return risk > 0 ? (reward / risk).toFixed(2) : 0;
  };

  const calculateMaxLoss = () => {
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const contracts = parseInt(contracts);
    
    if (!entry || !stop || !contracts) return 0;
    
    const riskPerContract = Math.abs(entry - stop);
    return (riskPerContract * contracts * 100).toFixed(2); // *100 for options
  };

  const calculateMaxProfit = () => {
    const entry = parseFloat(entryPrice);
    const targetPrice = parseFloat(target);
    const contracts = parseInt(contracts);
    
    if (!entry || !targetPrice || !contracts) return 0;
    
    const profitPerContract = Math.abs(targetPrice - entry);
    return (profitPerContract * contracts * 100).toFixed(2); // *100 for options
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: black,
        border: `2px solid ${green}`,
        padding: '20px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: "'Courier New', monospace"
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: `1px solid ${green}`,
          paddingBottom: '10px'
        }}>
          <h2 style={{ color: green, margin: 0, fontSize: '18px' }}>
            OPTIONS TRADE: {item?.symbol}
          </h2>
          <CustomButton
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4444',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ✕
          </CustomButton>
        </div>

        {/* Options-specific fields */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: green, fontSize: '14px', marginBottom: '10px' }}>
            OPTION DETAILS
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Option Type
              </label>
              <select
                value={optionType}
                onChange={(e) => setOptionType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Strike Price
              </label>
              <input
                type="number"
                value={strikePrice}
                onChange={(e) => setStrikePrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Contracts
              </label>
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                placeholder="1"
                min="1"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Premium (Optional)
              </label>
              <input
                type="number"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Trade management fields */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: green, fontSize: '14px', marginBottom: '10px' }}>
            TRADE MANAGEMENT
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Entry Price
              </label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Stop Loss
              </label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Target
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Account Size
              </label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                placeholder="10000"
                step="100"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Risk Per Trade (%)
              </label>
              <input
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                placeholder="2"
                step="0.1"
                min="0.1"
                max="10"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: green,
                  border: `1px solid ${green}`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Calculations */}
        <div style={{ marginBottom: '20px', padding: '10px', border: `1px solid ${green}` }}>
          <h3 style={{ color: green, fontSize: '14px', marginBottom: '10px' }}>
            CALCULATIONS
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: green }}>Risk:Reward:</span>
              <div style={{ color: white, fontWeight: 'bold' }}>
                {calculateRiskReward()}:1
              </div>
            </div>
            
            <div>
              <span style={{ color: green }}>Max Loss:</span>
              <div style={{ color: '#ff4444', fontWeight: 'bold' }}>
                ${calculateMaxLoss()}
              </div>
            </div>
            
            <div>
              <span style={{ color: green }}>Max Profit:</span>
              <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                ${calculateMaxProfit()}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: green, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Trade notes..."
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: green,
              border: `1px solid ${green}`,
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <CustomButton
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              color: green,
              border: `1px solid ${green}`,
              padding: '10px',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </CustomButton>
          
          <CustomButton
            onClick={handleSave}
            style={{
              flex: 1,
              background: green,
              color: black,
              border: `1px solid ${green}`,
              padding: '10px',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            SAVE TRADE
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default OptionsTradeForm; 