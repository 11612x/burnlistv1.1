const START_PRICE = 100;
const YEARS = 4;
const POINTS_PER_DAY = 10; // ⏱ Change this to simulate more/less frequent fake "fetches"
const FUTURE_DAYS = 365;
const START_DATE = new Date(Date.now() - YEARS * 365 * 24 * 60 * 60 * 1000);

// ⚙️ Behavior profiles simulate different stock personalities
const BEHAVIOR_PROFILES = {
  LOW:    { growth: 1.5, volatility: 0.5 },  // Slow, steady growth with minimal price noise
  STABLE: { growth: 2,   volatility: 1   },  // Conservative performance with moderate stability
  NORMAL: { growth: 2.5, volatility: 1.5 },  // Balanced stock with typical market fluctuations
  HIGH:   { growth: 3.5, volatility: 2.5 },  // Volatile growth stock with high price swings
  FUTURE: { growth: 2,   volatility: 1.5, future: true } // Includes 1 year of future data with normal volatility
};

/**
 * generateFixedMockWatchlist
 * Generates a mock watchlist with a fixed array of timestamps and prices for each ticker.
 * This is suitable for injecting directly into localStorage for persistent, realistic testing.
 * @param {Object} options - { numTickers, days, pointsPerDay, startPrice, volatility }
 * @returns {Object} mock watchlist object
 */
export function generateFixedMockWatchlist({
  numTickers = 4,
  days = 130,
  pointsPerDay = 25,
  startPrice = 100,
  volatility = 8,
  name = 'Fixed Mock Watchlist',
  startDate = null,
} = {}) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const MS_PER_POINT = Math.floor(MS_PER_DAY / pointsPerDay);
  const now = Date.now();
  const baseStart = startDate ? new Date(startDate).getTime() : now - days * MS_PER_DAY;

  function generateTicker(symbol) {
    let price = startPrice + Math.random() * 10;
    const historicalData = [];
    for (let d = 0; d < days; d++) {
      for (let p = 0; p < pointsPerDay; p++) {
        const timestamp = baseStart + d * MS_PER_DAY + p * MS_PER_POINT;
        // Simulate volatility
        const change = (Math.random() - 0.5) * volatility;
        price = Math.max(1, price + change);
        historicalData.push({ price: Number(price.toFixed(2)), timestamp });
      }
    }
    return {
      symbol,
      buyDate: historicalData[0].timestamp,
      buyPrice: historicalData[0].price,
      historicalData,
    };
  }

  const items = Array.from({ length: numTickers }, (_, i) =>
    generateTicker(`MOCK${i + 1}`)
  );

  return {
    id: `mock-${Date.now()}`,
    name,
    items,
    createdAt: baseStart,
    updatedAt: now,
  };
}