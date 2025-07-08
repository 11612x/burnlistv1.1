import { getReturnInTimeframe } from '@logic/portfolioUtils';

export function downsampleData(data, maxPoints) {
  if (data.length <= maxPoints) {
    return data;
  }
  const sampled = [];
  const bucketSize = data.length / maxPoints;
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(data[Math.floor(i * bucketSize)]);
  }
  return sampled;
}

export function calculatePortfolioReturns(holdings, prices, timeframe, maxPoints = 500) {
  const portfolioReturn = [];
  const timestamps = Object.keys(prices).map(Number).sort((a, b) => a - b);

  // Log sorted timestamps used for generating returns
  console.log("📅 Sorted timestamps:", timestamps);

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    let totalValue = 0;
    for (const holding of holdings) {
      const priceAtTime = prices[holding.symbol]?.[timestamp];
      if (priceAtTime !== undefined) {
        totalValue += holding.amount * priceAtTime;
      }
    }
    portfolioReturn.push({ timestamp, value: totalValue });
  }

  // Log the constructed raw portfolio return time series
  console.log("📈 Raw portfolioReturn:", portfolioReturn.slice(0, 5), "… total:", portfolioReturn.length);

  const returns = getReturnInTimeframe(portfolioReturn, timeframe);

  // Log the sliced/filtered returns based on timeframe
  console.log("⏱️ Timeframe-filtered returns:", returns.slice(0, 5), "… total:", returns.length);

  return downsampleData(returns, maxPoints);
}
