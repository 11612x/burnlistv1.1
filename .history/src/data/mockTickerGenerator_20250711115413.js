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
 * @param {Object} options - { numTickers, days, startPrice, volatility }
 * @returns {Object} mock watchlist object
 */
export function generateFixedMockWatchlist({
  numTickers = 4,
  days = 90,
  startPrice = 100,
  volatility = 8,
  name = 'Fixed Mock Watchlist',
  slug = 'fixed-mock',
} = {}) {
  // Generate fixed timestamps (one per day, oldest first)
  const now = Date.now();
  const timestamps = [];
  for (let i = 0; i < days; i++) {
    timestamps.push(new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString());
  }

  // Helper to generate a price series for a ticker
  function makePriceSeries(start, volatility) {
    let price = start;
    return timestamps.map(ts => {
      price += (Math.random() - 0.5) * volatility;
      price = Math.max(1, price); // keep price > 0
      return { price: Number(price.toFixed(2)), timestamp: ts };
    });
  }

  // Generate tickers
  const items = Array.from({ length: numTickers }).map((_, i) => {
    const symbol = `MOCK${i + 1}`;
    const series = makePriceSeries(startPrice + i * 20, volatility);
    return {
      symbol,
      buyDate: series[0].timestamp,
      buyPrice: series[0].price,
      historicalData: series,
      type: 'mock',
      isMock: true,
      addedAt: series[0].timestamp,
    };
  });

  return {
    id: slug,
    name,
    slug,
    items,
    reason: 'Fixed mock data for dev/testing',
    createdAt: timestamps[0],
  };
}