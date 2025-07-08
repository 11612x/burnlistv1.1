import { generatePortfolioTimeSeries } from "./portfolioUtils";
import { useMemo } from "react";

function usePortfolioTimeSeries(tickers, timeframe) {
  return useMemo(() => {
    if (!Array.isArray(tickers) || tickers.length === 0) {
      console.warn("📉 usePortfolioTimeSeries: No valid tickers provided.");
      return [];
    }

    const result = generatePortfolioTimeSeries(tickers, timeframe);
    console.log(`📈 usePortfolioTimeSeries → Generated ${result.length} points for timeframe: ${timeframe}`);
    return result;
  }, [tickers, timeframe]);
}

export { usePortfolioTimeSeries };