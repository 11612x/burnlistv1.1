import React from 'react';

const CRT_GREEN = 'rgb(140,185,162)';

const TradeDashboard = () => (
  <div style={{
    fontFamily: 'Courier New',
    color: CRT_GREEN,
    background: 'black',
    minHeight: '100vh',
    padding: 32
  }}>
    <h1 style={{ textAlign: 'right', fontWeight: 700, margin: 0 }}>Trade Dashboard</h1>
    {/* Ticker list/search, trade panel, etc. go here */}
    <div style={{ marginTop: 40, color: '#888' }}>
      Select a ticker to trade, or search for a symbol.
    </div>
  </div>
);

export default TradeDashboard; 