import React, { useState, useEffect } from 'react';
const CRT_GREEN = 'rgb(140,185,162)';

export default function TickerEditPanel({ ticker, open, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (ticker) setForm(ticker);
  }, [ticker]);

  if (!open || !ticker) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFlagChange = (flag, value) => {
    setForm(prev => ({ ...prev, flags: { ...prev.flags, [flag]: value } }));
  };

  const handleContextChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDone = () => {
    onSave(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 400,
        height: '100vh',
        background: '#0a0a0a',
        color: CRT_GREEN,
        zIndex: 10010,
        boxShadow: `-4px 0 24px 0 ${CRT_GREEN}33`,
        borderLeft: `2px solid ${CRT_GREEN}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s',
        fontFamily: 'Courier New',
        padding: 0
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Overlay for closing */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 10009
        }}
      />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <h2 style={{ color: CRT_GREEN, marginBottom: 18, fontWeight: 700, fontSize: 24 }}>Edit {ticker.symbol}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label>
            EPS Growth (%)
            <input type="number" value={form.epsGrowth || ''} onChange={e => handleChange('epsGrowth', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Avg Volume
            <input type="number" value={form.avgVolume || ''} onChange={e => handleChange('avgVolume', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Rel Volume
            <input type="number" value={form.relVolume || ''} onChange={e => handleChange('relVolume', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Earnings Days Away
            <input type="number" value={form.earningsDaysAway || ''} onChange={e => handleChange('earningsDaysAway', e.target.value)} style={inputStyle} />
          </label>
          <label>
            P/E Ratio
            <input type="number" value={form.pe || ''} onChange={e => handleChange('pe', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Market Cap
            <input type="number" value={form.marketCap || ''} onChange={e => handleChange('marketCap', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Debt/Equity
            <input type="number" value={form.debtEquity || ''} onChange={e => handleChange('debtEquity', e.target.value)} style={inputStyle} />
          </label>
          <label>
            P/B
            <input type="number" value={form.pb || ''} onChange={e => handleChange('pb', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Beta
            <input type="number" value={form.beta || ''} onChange={e => handleChange('beta', e.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 16 }}>
            {['news', 'ema', 'rsi', 'sma'].map(flag => (
              <label key={flag} style={{ fontSize: 15 }}>
                <input
                  type="checkbox"
                  checked={form.flags?.[flag] || false}
                  onChange={e => handleFlagChange(flag, e.target.checked)}
                  style={{ accentColor: CRT_GREEN, marginRight: 6 }}
                />
                {flag.toUpperCase()}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <label style={{ fontSize: 15 }}>
              <input type="checkbox" checked={form.sectorAlignment || false} onChange={e => handleContextChange('sectorAlignment', e.target.checked)} style={{ accentColor: CRT_GREEN, marginRight: 6 }} />
              Sector Align
            </label>
            <label style={{ fontSize: 15 }}>
              <input type="checkbox" checked={form.marketSupport || false} onChange={e => handleContextChange('marketSupport', e.target.checked)} style={{ accentColor: CRT_GREEN, marginRight: 6 }} />
              Market Support
            </label>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ fontSize: 15 }}>
              <input type="checkbox" checked={form.volatilityClear || false} onChange={e => handleContextChange('volatilityClear', e.target.checked)} style={{ accentColor: CRT_GREEN, marginRight: 6 }} />
              Volatility Clear
            </label>
            <label style={{ fontSize: 15 }}>
              <input type="checkbox" checked={form.breadthHealthy || false} onChange={e => handleContextChange('breadthHealthy', e.target.checked)} style={{ accentColor: CRT_GREEN, marginRight: 6 }} />
              Breadth Healthy
            </label>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: 20, borderTop: `1.5px solid ${CRT_GREEN}`, background: '#111' }}>
        <button onClick={onClose} style={{ ...buttonStyle, background: 'black', color: CRT_GREEN, border: `2px solid ${CRT_GREEN}` }}>Cancel</button>
        <button onClick={handleDone} style={{ ...buttonStyle, background: CRT_GREEN, color: 'black', border: `2px solid ${CRT_GREEN}` }}>Done</button>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'black',
  color: CRT_GREEN,
  border: `1.5px solid ${CRT_GREEN}`,
  borderRadius: 4,
  padding: '6px 12px',
  fontFamily: 'Courier New',
  fontSize: 16,
  marginTop: 6,
  marginBottom: 6,
  width: '100%'
};

const buttonStyle = {
  fontFamily: 'Courier New',
  fontWeight: 700,
  fontSize: 17,
  borderRadius: 4,
  padding: '8px 28px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}; 