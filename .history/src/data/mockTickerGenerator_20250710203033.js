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

// Mock tickers simulate real-time and historical market data for different stock behaviors
export function generateMockTicker(symbol) {
  const tag = (symbol.match(/#(\w+)/)?.[1] || 'NORMAL').toUpperCase();
  const profile = BEHAVIOR_PROFILES[tag] || BEHAVIOR_PROFILES.NORMAL;

  const historicalData = [];
  const totalDays = YEARS * 365 + (profile.future ? FUTURE_DAYS : 0);
  const totalPoints = totalDays * POINTS_PER_DAY;
  const endPrice = START_PRICE * (1 + profile.growth);
  const priceStep = (endPrice - START_PRICE) / totalPoints;

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(START_DATE.getTime() + i * (1440 / POINTS_PER_DAY) * 60 * 1000);
    const basePrice = START_PRICE + priceStep * i;
    const wave = 2 * Math.sin(i * 0.03);
    const noise = (Math.random() - 0.5) * profile.volatility;
    const price = basePrice + wave + noise;

    const safePrice = isNaN(price) ? 0 : parseFloat(price.toFixed(2));
    const safeTimestamp = isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();

    historicalData.push({
      timestamp: safeTimestamp,
      price: safePrice
    });
  }

  // 🧠 Constructing the simulated ticker with metadata for backtesting and charting
  const ticker = {
    symbol,
    currentPrice: historicalData[historicalData.length - 1].price,
    buyPrice: historicalData[0].price,
    buyDate: historicalData[0].timestamp,
    historicalData,
    type: 'mock',
    isMock: true,
    hasFutureData: !!profile.future,
    volatility: profile.volatility,
    slope: parseFloat((priceStep * POINTS_PER_DAY).toFixed(4)), // Daily price slope approximation
  };

  if (!historicalData.length || typeof historicalData[0].price !== 'number') {
    console.warn("⚠️ Invalid historicalData generated for", symbol);
  }

  // ⏩ Simulates one more price point into the future, continuing the trend
  ticker.nextTick = () => {
    const last = ticker.historicalData[ticker.historicalData.length - 1];
    const nextTime = new Date(new Date(last.timestamp).getTime() + (1440 / POINTS_PER_DAY) * 60 * 1000);
    const basePrice = last.price + priceStep;
    const wave = 2 * Math.sin(ticker.historicalData.length * 0.03);
    const noise = (Math.random() - 0.5) * profile.volatility;
    const nextPrice = parseFloat((basePrice + wave + noise).toFixed(2));

    ticker.historicalData.push({
      timestamp: nextTime.toISOString(),
      price: nextPrice
    });

    ticker.currentPrice = nextPrice;
  };

  return ticker;
}