import { fetchQuote } from '@data/finhubAdapter';
import { generateMockTicker } from '@data/mockTickerGenerator';
import { normalizeSymbol } from '@data/tickerUtils';
import { normalizeTicker } from '@data/normalizeTicker';

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
      // return ticker;
    }

    // Handle real ticker via API
    const quote = await fetchQuote(symbol);
    console.log("📡 Raw quote from API:", quote);
    if (!quote) {
      console.warn(`⚠️ createTicker: No quote returned for symbol ${symbol}`);
      return null;
    }

    const buyPrice = customBuyPrice !== null
  ? Number(customBuyPrice)
  : !isNaN(Number(quote.buyPrice))
    ? Number(quote.buyPrice)
    : 0;
const buyDate = customBuyDate ?? quote.buyDate ?? addedAt;

    const ticker = {
      symbol,
      buyPrice,
      buyDate,
      historicalData: [{
        price: !isNaN(Number(buyPrice)) ? Number(buyPrice) : 0,
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

    console.log("🧠 Real Ticker BuyPrice Type:", typeof buyPrice, "Value:", buyPrice);
    console.log("🧠 Real Ticker HistoricalData:", ticker.historicalData);
    console.log("✅ createTicker returning real:", ticker);
    console.log("🎯 Final ticker object:", ticker);
    console.log("📦 Before normalization (real):", ticker);
    const normalized = normalizeTicker(ticker);
    console.log("✅ After normalization (real):", normalized);
    return normalized;
    // return ticker;

  } catch (error) {
    console.error(`❌ createTicker failed for ${symbol}:`, error);
    return null;
  }
}