import React, { useState, useEffect } from 'react';
import box from '../assets/box.png';
import checkbox from '../assets/checkbox.png';
const CRT_GREEN = 'rgb(140,185,162)';

export default function TickerEditPanel({ ticker, open, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [volume24h, setVolume24h] = useState('');

  useEffect(() => {
    if (ticker) {
      setForm(ticker);
      setVolume24h(ticker.volume24h || '');
    }
  }, [ticker]);

  if (!open || !ticker) return null;

  const recalcRelVolume = (avg, v24) => {
    const avgNum = parseFloat(avg);
    const v24Num = parseFloat(v24);
    if (!isNaN(avgNum) && avgNum > 0 && !isNaN(v24Num) && v24Num > 0) {
      return (v24Num / avgNum).toFixed(2);
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'avgVolume') {
      setForm(prev => ({ ...prev, avgVolume: value, relVolume: recalcRelVolume(value, volume24h) }));
    } else if (field === 'atr') {
      setForm(prev => ({ ...prev, atr: value }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handle24hVolumeChange = (value) => {
    setVolume24h(value);
    setForm(prev => ({ ...prev, relVolume: recalcRelVolume(prev.avgVolume, value) }));
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
    <>
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
          zIndex: 10009,
          pointerEvents: 'auto',
        }}
      />
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
          padding: 0,
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
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
              24h Volume
              <input type="number" value={volume24h} onChange={e => handle24hVolumeChange(e.target.value)} style={inputStyle} />
            </label>
            <label>
              Rel Volume
              <input type="number" value={form.relVolume || ''} readOnly style={{ ...inputStyle, background: '#222' }} />
            </label>
            <label>
              ATR
              <input type="number" value={form.atr || ''} onChange={e => handleChange('atr', e.target.value)} style={inputStyle} />
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
              Beta
              <input type="number" value={form.beta || ''} onChange={e => handleChange('beta', e.target.value)} style={inputStyle} />
            </label>
            <div style={{ display: 'flex', gap: 16 }}>
              {['news', 'ema', 'rsi', 'sma'].map(flag => (
                <label key={flag} style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                  <span
                    onClick={() => handleFlagChange(flag, !form.flags?.[flag])}
                    style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleFlagChange(flag, !form.flags?.[flag]); }}
                    role="checkbox"
                    aria-checked={form.flags?.[flag] || false}
                  >
                    <img
                      src={form.flags?.[flag] ? checkbox : box}
                      alt={form.flags?.[flag] ? 'Checked' : 'Unchecked'}
                      style={{ width: 22, height: 22 }}
                    />
                  </span>
                  {flag.toUpperCase()}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                <span
                  onClick={() => handleContextChange('sectorAlignment', !form.sectorAlignment)}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleContextChange('sectorAlignment', !form.sectorAlignment); }}
                  role="checkbox"
                  aria-checked={form.sectorAlignment || false}
                >
                  <img
                    src={form.sectorAlignment ? checkbox : box}
                    alt={form.sectorAlignment ? 'Checked' : 'Unchecked'}
                    style={{ width: 22, height: 22 }}
                  />
                </span>
                Sector Align
              </label>
              <label style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                <span
                  onClick={() => handleContextChange('marketSupport', !form.marketSupport)}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleContextChange('marketSupport', !form.marketSupport); }}
                  role="checkbox"
                  aria-checked={form.marketSupport || false}
                >
                  <img
                    src={form.marketSupport ? checkbox : box}
                    alt={form.marketSupport ? 'Checked' : 'Unchecked'}
                    style={{ width: 22, height: 22 }}
                  />
                </span>
                Market Support
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                <span
                  onClick={() => handleContextChange('volatilityClear', !form.volatilityClear)}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleContextChange('volatilityClear', !form.volatilityClear); }}
                  role="checkbox"
                  aria-checked={form.volatilityClear || false}
                >
                  <img
                    src={form.volatilityClear ? checkbox : box}
                    alt={form.volatilityClear ? 'Checked' : 'Unchecked'}
                    style={{ width: 22, height: 22 }}
                  />
                </span>
                Volatility Clear
              </label>
              <label style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                <span
                  onClick={() => handleContextChange('breadthHealthy', !form.breadthHealthy)}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleContextChange('breadthHealthy', !form.breadthHealthy); }}
                  role="checkbox"
                  aria-checked={form.breadthHealthy || false}
                >
                  <img
                    src={form.breadthHealthy ? checkbox : box}
                    alt={form.breadthHealthy ? 'Checked' : 'Unchecked'}
                    style={{ width: 22, height: 22 }}
                  />
                </span>
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
    </>
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