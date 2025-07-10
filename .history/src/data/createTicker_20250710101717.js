import { fetchQuote } from '@data/finhubAdapter';
import { generateMockTicker } from '@data/mockTickerGenerator';
import { normalizeSymbol } from '@data/tickerUtils';

export async function createTicker(symbol, type = 'real', customBuyPrice = null, customBuyDate = null) {
  symbol = normalizeSymbol(symbol);
  const addedAt = new Date().toISOString();

  try {
    // Handle mock tickers or symbols prefixed with #
    if (type === 'mock' || symbol.startsWith('#')) {
      const mockTicker = generateMockTicker(symbol);

      // Ensure symbol is present
      if (!mockTicker.symbol) {
        mockTicker.symbol = symbol;
      }

      // Fallback values in case historicalData is missing or empty
      const firstDataPoint = mockTicker.historicalData?.[0] ?? { price: 100, timestamp: addedAt };
      const buyPrice = customBuyPrice ?? firstDataPoint.price;
      const buyDate = customBuyDate ?? firstDataPoint.timestamp;

      if (!mockTicker.historicalData || mockTicker.historicalData.length === 0) {
        mockTicker.historicalData = [{
          price: buyPrice,
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
      return ticker;
    }

    // Handle real ticker via API
    const quote = await fetchQuote(symbol);
    if (!quote) {
      console.warn(`⚠️ createTicker: No quote returned for symbol ${symbol}`);
      return null;
    }

    const buyPrice = customBuyPrice ?? quote.currentPrice ?? 0;
    const buyDate = customBuyDate ?? quote.buyDate ?? addedAt;

    const ticker = {
      symbol,
      buyPrice,
      buyDate,
      historicalData: [{
        price: buyPrice,
        timestamp: buyDate
      }],
      addedAt,
      type: 'real',
      isMock: false
    };

    // Sanity check to confirm historicalData is an array
    if (!Array.isArray(ticker.historicalData)) {
      console.error("❌ historicalData is not an array for:", ticker.symbol);
    }

    console.log("✅ createTicker returning real:", ticker);
    return ticker;

  } catch (error) {
    console.error(`❌ createTicker failed for ${symbol}:`, error);
    return null;
  }
}