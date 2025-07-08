const START_PRICE = 100;
const YEARS = 4;
const POINTS_PER_DAY = 10; // ⏱ Change this to simulate more/less frequent fake "fetches"
const FUTURE_DAYS = 365;
const START_DATE = new Date(Date.now() - YEARS * 365 * 24 * 60 * 60 * 1000);

// ⚙️ Behavior profiles simulate different stock personalities
const BEHAVIOR_PROFILES = {
  LOW:    { growth: 1.5, volatility: 0.5 },  // Slow grower, low noise
  STABLE: { growth: 2,   volatility: 1   },  // Conservative performance
  NORMAL: { growth: 2.5, volatility: 1.5 },  // Balanced stock
  HIGH:   { growth: 3.5, volatility: 2.5 },  // Volatile growth stock
  FUTURE: { growth: 2,   volatility: 1.5, future: true } // Includes 1 year of future data
};

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

    historicalData.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(price.toFixed(2))
    });
  }

  const ticker = {
    symbol,
    currentPrice: historicalData[historicalData.length - 1].price,
    buyPrice: historicalData[0].price,
    buyDate: historicalData[0].timestamp,
    historicalData,
    type: 'mock',
    isMock: true,
    hasFutureData: !!profile.future
  };

  // 🔁 Generates next simulated data point into the future (used for live backtest)
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