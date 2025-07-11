import { getAverageReturn } from '@logic/portfolioUtils';

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

export function calculatePortfolioReturns(snapshots, timeframe, maxPoints = 500) {
  const returns = getAverageReturn(snapshots, timeframe);
  return downsampleData(returns, maxPoints);
}
