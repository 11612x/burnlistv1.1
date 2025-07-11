import { fetchQuote } from '@data/finhubAdapter';
import { generateMockTicker } from '@data/mockTickerGenerator';
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
      const mockTicker = generateMockTicker(symbol);
      if (!mockTicker.symbol) {
        mockTicker.symbol = symbol;
      }
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
    const ticker = await fetchQuote(symbol);
    if (!ticker || typeof ticker !== 'object' || !ticker.symbol || !ticker.historicalData) {
      console.warn(`⚠️ Skipping ${symbol}: malformed ticker object`, ticker);
      return null;
    }
    // Apply custom buyPrice and buyDate if provided
    if (customBuyPrice !== null && !isNaN(Number(customBuyPrice))) {
      ticker.buyPrice = Number(customBuyPrice);
      if (ticker.historicalData && ticker.historicalData.length > 0) {
        ticker.historicalData[0].price = Number(customBuyPrice);
      }
    }
    if (customBuyDate && !isNaN(Date.parse(customBuyDate))) {
      ticker.buyDate = customBuyDate;
      if (ticker.historicalData && ticker.historicalData.length > 0) {
        ticker.historicalData[0].timestamp = customBuyDate;
    }
    }
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