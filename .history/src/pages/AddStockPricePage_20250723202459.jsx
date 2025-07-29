import React, { useState } from 'react';

const AddStockPricePage = () => {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchPrice = async () => {
    setLoading(true);
    setError('');
    setPrice(null);
    try {
      const res = await fetch(`http://localhost:3001/api/finviz-quote?ticker=${ticker.toUpperCase()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].Close) {
        setPrice(data[0].Close);
      } else {
        setError('No price data found');
      }
    } catch (err) {
      setError('Error fetching price');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, background: '#111', color: '#C0FFC0', borderRadius: 8, fontFamily: 'monospace' }}>
      <h2 style={{ color: '#C0FFC0' }}>Add Stock & Get Current Price</h2>
      <input
        type="text"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
        placeholder="Enter ticker (e.g. SPY)"
        style={{ width: '100%', padding: 8, fontSize: 18, marginBottom: 12, borderRadius: 4, border: '1px solid #333', background: '#222', color: '#C0FFC0' }}
      />
      <button
        onClick={handleFetchPrice}
        disabled={loading || !ticker}
        style={{ width: '100%', padding: 10, fontSize: 18, background: '#C0FFC0', color: '#111', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Loading...' : 'Get Price'}
      </button>
      {price && (
        <div style={{ marginTop: 24, fontSize: 22, color: '#C0FFC0' }}>
          Current Price: <span style={{ fontWeight: 'bold' }}>{price}</span>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 16, color: '#FF5555' }}>{error}</div>
      )}
    </div>
  );
};

export default AddStockPricePage; 