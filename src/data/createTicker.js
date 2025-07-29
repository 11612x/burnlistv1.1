import { fetchQuote } from '@data/finhubAdapter';
import { generateFixedMockWatchlist } from '@data/mockTickerGenerator';
import { normalizeSymbol } from '@data/tickerUtils';
import normalizeTicker from '@data/normalizeTicker';

export async function createTicker(symbol, type = 'real', customBuyPrice = null, customBuyDate = null) {
  // Input validation
  if (!symbol || typeof symbol !== 'string') {
    console.error('❌ createTicker: Invalid symbol provided:', symbol);
    return null;
  }

  symbol = normalizeSymbol(symbol);
  const addedAt = new Date().toISOString();

  try {
    // Handle mock tickers or symbols prefixed with #
    if (type === 'mock' || symbol.startsWith('#')) {
      // Always use the first ticker from a fixed mock watchlist for single mock ticker creation
      const mockList = generateFixedMockWatchlist({ numTickers: 1 });
      const mockTicker = mockList.items[0];
      mockTicker.symbol = symbol;
      const firstDataPoint = mockTicker.historicalData?.[0] ?? { price: 100, timestamp: addedAt };
      const buyPrice = Number(customBuyPrice ?? firstDataPoint.price ?? 0);
      const buyDate = customBuyDate ?? firstDataPoint.timestamp;
      if (!mockTicker.historicalData || mockTicker.historicalData.length === 0) {
        mockTicker.historicalData = [{
          price: isNaN(Number(buyPrice)) ? 0 : Number(buyPrice),
          timestamp: buyDate
        }];
      }
      const ticker = {
        symbol: mockTicker.symbol,
        buyPrice,
        buyDate,
        historicalData: Array.isArray(mockTicker.historicalData)
          ? mockTicker.historicalData
          : [mockTicker.historicalData],
        addedAt,
        type: 'mock',
        isMock: true
      };
      console.log("✅ createTicker returning mock:", ticker);
      console.log("📦 Before normalization (mock):", ticker);
      const normalized = normalizeTicker(ticker);
      console.log("✅ After normalization (mock):", normalized);
      return normalized;
    }

    // Handle real ticker via API
    console.log(`🌐 Fetching real ticker data for ${symbol}`);
    const ticker = await fetchQuote(symbol);
    console.log(`📥 fetchQuote result for ${symbol}:`, ticker ? 'success' : 'failed');
    
    if (!ticker || typeof ticker !== 'object' || !ticker.symbol || !ticker.historicalData) {
      console.warn(`⚠️ Skipping ${symbol}: malformed ticker object`, ticker);
      return null;
    }
    
    console.log(`✅ Valid ticker data received for ${symbol}, historicalData length: ${ticker.historicalData.length}`);
    
    // Set buy price: use custom price if provided, otherwise use current market price
    if (customBuyPrice !== null && !isNaN(Number(customBuyPrice))) {
      ticker.buyPrice = Number(customBuyPrice);
      console.log(`💰 Using custom buy price for ${symbol}: $${ticker.buyPrice}`);
    } else {
      // Use current market price as buy price
      const latestDataPoint = ticker.historicalData[ticker.historicalData.length - 1];
      ticker.buyPrice = latestDataPoint.price;
      console.log(`💰 Using current market price as buy price for ${symbol}: $${ticker.buyPrice}`);
    }
    
    // Set buy date: use custom date if provided, otherwise use current market date
    if (customBuyDate && !isNaN(Date.parse(customBuyDate))) {
      ticker.buyDate = customBuyDate;
      console.log(`📅 Using custom buy date for ${symbol}: ${ticker.buyDate}`);
    } else {
      // Use current market date as buy date
      const latestDataPoint = ticker.historicalData[ticker.historicalData.length - 1];
      ticker.buyDate = latestDataPoint.timestamp;
      console.log(`📅 Using current market date as buy date for ${symbol}: ${ticker.buyDate}`);
    }
    
    // Only create additional historical data points when custom buy price/date is provided
    if ((customBuyPrice !== null && !isNaN(Number(customBuyPrice))) || (customBuyDate && !isNaN(Date.parse(customBuyDate)))) {
      // Add buy point as first data point
      const buyPoint = {
        price: ticker.buyPrice,
        timestamp: ticker.buyDate,
        fetchTimestamp: new Date().toISOString(),
        symbol: symbol
      };
      
      // Current market point as second data point
      const currentPoint = ticker.historicalData[ticker.historicalData.length - 1];
      
      // Create historical data with both points
      ticker.historicalData = [buyPoint, currentPoint];
      console.log(`📊 Created 2-point historical data for ${symbol}:`, ticker.historicalData);
    }
    // Otherwise, keep the single API data point as is
    
    ticker.addedAt = addedAt;
    ticker.type = 'real';
    ticker.isMock = false;
    const normalized = normalizeTicker(ticker);
    console.log("✅ createTicker returning real:", normalized);
    return normalized;
  } catch (error) {
    console.error(`❌ createTicker failed for ${symbol}:`, error);
    return null;
  }
}