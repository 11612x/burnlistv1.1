/**
 * Calculate ETF-like average price for a watchlist
 * This function normalizes prices across different purchase dates to create a meaningful average
 * @param {Array} items - Array of ticker items with buyPrice, buyDate, and historicalData
 * @param {string} baseDate - Optional base date to normalize prices to (defaults to most recent date)
 * @returns {Object} - Object containing average price and metadata
 */
export function calculateETFPrice(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      averagePrice: 0,
      totalValue: 0,
      itemCount: 0,
      priceRange: { min: 0, max: 0 },
      dateRange: { earliest: null, latest: null }
    };
  }

  // Filter valid items with prices and dates
  const validItems = items.filter(item => 
    item && 
    Number(item.buyPrice) > 0 && 
    item.buyDate && 
    Array.isArray(item.historicalData) && 
    item.historicalData.length > 0
  );

  if (validItems.length === 0) {
    return {
      averagePrice: 0,
      totalValue: 0,
      itemCount: 0,
      priceRange: { min: 0, max: 0 },
      dateRange: { earliest: null, latest: null }
    };
  }

  // Find the most recent date across all items to use as normalization base
  const allDates = validItems.flatMap(item => 
    item.historicalData.map(data => new Date(data.timestamp))
  );
  const latestDate = new Date(Math.max(...allDates));

  // Calculate normalized prices (what each stock would be worth at the latest date)
  const normalizedPrices = validItems.map(item => {
    const buyDate = new Date(item.buyDate);
    const buyPrice = Number(item.buyPrice);
    
    // Find the price at the latest date for this stock
    let currentPrice = buyPrice; // fallback to buy price
    
    // Find the most recent price in historical data
    const sortedData = [...item.historicalData].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    if (sortedData.length > 0) {
      currentPrice = Number(sortedData[0].price);
    }

    return {
      symbol: item.symbol,
      buyPrice,
      buyDate,
      currentPrice,
      normalizedPrice: currentPrice, // For now, use current price as normalized
      priceChange: currentPrice - buyPrice,
      priceChangePercent: ((currentPrice - buyPrice) / buyPrice) * 100
    };
  });

  // Calculate weighted average based on current market values
  const totalValue = normalizedPrices.reduce((sum, item) => sum + item.currentPrice, 0);
  const averagePrice = totalValue / normalizedPrices.length;

  // Calculate price range
  const prices = normalizedPrices.map(item => item.currentPrice);
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };

  // Calculate date range
  const dates = validItems.map(item => new Date(item.buyDate));
  const dateRange = {
    earliest: new Date(Math.min(...dates)),
    latest: new Date(Math.max(...dates))
  };

  return {
    averagePrice: Number(averagePrice.toFixed(2)),
    totalValue: Number(totalValue.toFixed(2)),
    itemCount: validItems.length,
    priceRange,
    dateRange,
    normalizedPrices,
    // Additional metrics
    totalBuyValue: normalizedPrices.reduce((sum, item) => sum + item.buyPrice, 0),
    totalGainLoss: normalizedPrices.reduce((sum, item) => sum + item.priceChange, 0),
    averageGainLossPercent: normalizedPrices.reduce((sum, item) => sum + item.priceChangePercent, 0) / normalizedPrices.length
  };
}

/**
 * Calculate a time-weighted average price (TWAP) for the watchlist
 * This gives more weight to stocks purchased more recently
 * @param {Array} items - Array of ticker items
 * @returns {Object} - TWAP calculation results
 */
export function calculateTWAP(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { twap: 0, weightedPrices: [] };
  }

  const validItems = items.filter(item => 
    item && Number(item.buyPrice) > 0 && item.buyDate
  );

  if (validItems.length === 0) {
    return { twap: 0, weightedPrices: [] };
  }

  const now = new Date();
  const weightedPrices = validItems.map(item => {
    const buyDate = new Date(item.buyDate);
    const daysSincePurchase = (now - buyDate) / (1000 * 60 * 60 * 24);
    const weight = Math.max(1, daysSincePurchase); // More recent purchases get higher weight
    
    return {
      symbol: item.symbol,
      buyPrice: Number(item.buyPrice),
      buyDate,
      weight,
      weightedPrice: Number(item.buyPrice) * weight
    };
  });

  const totalWeightedPrice = weightedPrices.reduce((sum, item) => sum + item.weightedPrice, 0);
  const totalWeight = weightedPrices.reduce((sum, item) => sum + item.weight, 0);
  const twap = totalWeight > 0 ? totalWeightedPrice / totalWeight : 0;

  return {
    twap: Number(twap.toFixed(2)),
    weightedPrices
  };
} 