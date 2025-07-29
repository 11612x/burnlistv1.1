import React, { useState, useEffect } from 'react';
import { calculateBuyScore } from '../data/buyScore';

// Helper to get/set toggles in localStorage
function getToggleState(ticker) {
  const data = localStorage.getItem(`universe_toggles_${ticker}`);
  return data ? JSON.parse(data) : {
    technicalFlags: false,
    newsFlag: false,
    sectorAlignment: false,
    marketSupport: false,
    volatilityClear: false,
    breadthHealthy: false,
  };
}
function setToggleState(ticker, state) {
  localStorage.setItem(`universe_toggles_${ticker}` , JSON.stringify(state));
}

// Example tickers data (replace with real data source)
const exampleTickers = [
  {
    symbol: 'AAPL',
    epsGrowth: 25,
    avgVolume: 1200000,
    relVolume: 2.0,
    earningsDaysAway: 10,
    price: 21,
    pe: 18,
    marketCap: 5000000000,
    debtEquity: 0.25,
    pb: 1.1,
    beta: 1.5,
  },
  {
    symbol: 'TSLA',
    epsGrowth: 40,
    avgVolume: 2000000,
    relVolume: 1.5,
    earningsDaysAway: 3,
    price: 45,
    pe: 12,
    marketCap: 30000000000,
    debtEquity: 0.1,
    pb: 0.8,
    beta: 2.0,
  },
];

const tagColors = {
  'Prime Entry': 'bg-green-500',
  'Almost Ready': 'bg-yellow-400',
  'Standby': 'bg-gray-400',
};

export default function UniverseTickerTable() {
  const [tickers, setTickers] = useState(exampleTickers);
  const [toggleStates, setToggleStates] = useState({});

  useEffect(() => {
    // Load toggle states for all tickers
    const states = {};
    tickers.forEach(ticker => {
      states[ticker.symbol] = getToggleState(ticker.symbol);
    });
    setToggleStates(states);
  }, [tickers]);

  const handleToggle = (symbol, field) => {
    const prev = toggleStates[symbol] || {};
    const updated = { ...prev, [field]: !prev[field] };
    setToggleStates({ ...toggleStates, [symbol]: updated });
    setToggleState(symbol, updated);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2">Ticker</th>
            <th className="px-4 py-2">Buy Score</th>
            <th className="px-4 py-2">Tag</th>
            <th className="px-4 py-2">Tech</th>
            <th className="px-4 py-2">News</th>
            <th className="px-4 py-2">Sector</th>
            <th className="px-4 py-2">Market</th>
            <th className="px-4 py-2">Volatility</th>
            <th className="px-4 py-2">Breadth</th>
          </tr>
        </thead>
        <tbody>
          {tickers.map(ticker => {
            const toggles = toggleStates[ticker.symbol] || {};
            const scoreObj = calculateBuyScore({
              ...ticker,
              ...toggles,
            });
            return (
              <tr key={ticker.symbol} className="border-t">
                <td className="px-4 py-2 font-bold">{ticker.symbol}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${tagColors[scoreObj.tag]}`}
                        style={{ width: `${scoreObj.totalBuyScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono">{scoreObj.totalBuyScore}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${tagColors[scoreObj.tag]}`}>{scoreObj.tag}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.technicalFlags} onChange={() => handleToggle(ticker.symbol, 'technicalFlags')} />
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.newsFlag} onChange={() => handleToggle(ticker.symbol, 'newsFlag')} />
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.sectorAlignment} onChange={() => handleToggle(ticker.symbol, 'sectorAlignment')} />
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.marketSupport} onChange={() => handleToggle(ticker.symbol, 'marketSupport')} />
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.volatilityClear} onChange={() => handleToggle(ticker.symbol, 'volatilityClear')} />
                </td>
                <td className="px-4 py-2 text-center">
                  <input type="checkbox" checked={!!toggles.breadthHealthy} onChange={() => handleToggle(ticker.symbol, 'breadthHealthy')} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 