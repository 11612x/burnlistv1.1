import React, { useState } from 'react';
import WatchlistSelector from '../components/WatchlistSelector';

const CRT_GREEN = 'rgb(140,185,162)';
const CRT_RED = '#e31507';

const boxStyle = {
  border: `1.5px solid ${CRT_GREEN}`,
  borderRadius: 4,
  background: 'black',
  color: CRT_GREEN,
  fontFamily: 'Courier New',
  padding: 16,
  marginBottom: 24,
  boxShadow: '0 2px 8px 0 rgba(140,185,162,0.08)'
};

const TradeDashboard = () => {
  const [selectedWatchlist, setSelectedWatchlist] = useState("");

  return (
    <div style={{
      fontFamily: 'Courier New',
      color: CRT_GREEN,
      background: 'black',
      minHeight: '100vh',
      padding: 32
    }}>
      {/* Portfolio Bar */}
      <div style={{ ...boxStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 18 }}>
        <div>Total Equity: $100,000</div>
        <div>Cash: $20,000</div>
        <div>Open P/L: <span style={{ color: CRT_GREEN }}>+$1,200</span></div>
        <div>% Allocated: <span style={{ border: `1px solid ${CRT_GREEN}`, padding: '2px 12px', borderRadius: 2 }}>80%</span></div>
        <div>Exposure: Long 70% / Short 10%</div>
      </div>

      {/* Main Section: Table + Chart/Selector */}
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Positions Table */}
        <div style={{ flex: 2 }}>
          <div style={{ ...boxStyle, minHeight: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Positions</div>
              <button style={{ background: 'none', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, fontFamily: 'Courier New', fontSize: 15, padding: '4px 18px', borderRadius: 2, cursor: 'pointer' }}>Add Position</button>
              <button style={{ background: 'none', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, fontFamily: 'Courier New', fontSize: 15, padding: '4px 18px', borderRadius: 2, cursor: 'pointer' }}>Export .json</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${CRT_GREEN}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Ticker</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Buy</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Current</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>% Return</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>$ Return</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Size</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Held</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Notes</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Trade</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3].map(i => (
                  <tr key={i} style={{ borderBottom: `1px solid #222` }}>
                    <td style={{ padding: 6 }}>AAPL</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>$180.00</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>$185.00</td>
                    <td style={{ padding: 6, textAlign: 'right', color: CRT_GREEN }}>+2.8%</td>
                    <td style={{ padding: 6, textAlign: 'right', color: CRT_GREEN }}>+$50</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>$1,000</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>3d</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>Open</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>📝</td>
                    <td style={{ padding: 6, textAlign: 'center' }}><button style={{ background: 'none', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, fontFamily: 'Courier New', fontSize: 14, padding: '2px 10px', borderRadius: 2, cursor: 'pointer' }}>Trade</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Chart + Watchlist Selector */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Watchlist Selector */}
          <div style={{ ...boxStyle, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WatchlistSelector value={selectedWatchlist} onSelect={setSelectedWatchlist} />
          </div>
          {/* Chart/Indicators */}
          <div style={{ ...boxStyle, minHeight: 180 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Chart & Indicators</div>
            <div style={{ height: 120, background: '#111', borderRadius: 2, marginBottom: 8, border: `1px solid #222` }} />
            <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <span style={{ border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '2px 8px' }}>RSI</span>
              <span style={{ border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '2px 8px' }}>EMA</span>
              <span style={{ border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '2px 8px' }}>SMA</span>
              <span style={{ border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '2px 8px' }}>ATR</span>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Trade Panel (mockup, not functional) */}
      <div style={{ ...boxStyle, maxWidth: 420, margin: '40px auto 0 auto', background: '#181818' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Quick Trade Panel</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <input placeholder="Symbol" style={{ flex: 1, background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New' }} />
          <select style={{ background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New' }}>
            <option>Long</option>
            <option>Short</option>
          </select>
          <input placeholder="Amount" style={{ width: 80, background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <input placeholder="Stop-loss ($ or %)" style={{ flex: 1, background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New' }} />
          <input placeholder="Take-profit ($ or %)" style={{ flex: 1, background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New' }} />
        </div>
        <textarea placeholder="Reason (optional)" style={{ width: '100%', background: 'black', color: CRT_GREEN, border: `1px solid ${CRT_GREEN}`, borderRadius: 2, padding: '4px 8px', fontFamily: 'Courier New', minHeight: 40, marginBottom: 8 }} />
        <button style={{ width: '100%', background: CRT_GREEN, color: 'black', border: 'none', borderRadius: 2, fontFamily: 'Courier New', fontWeight: 700, fontSize: 15, padding: '8px 0', cursor: 'pointer' }}>Submit Trade</button>
      </div>
    </div>
  );
};

export default TradeDashboard; 