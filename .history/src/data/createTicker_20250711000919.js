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
    console.log("📥 Raw quote from API:", quote);
    if (!quote || typeof quote.c === 'undefined') {
      console.warn(`⚠️ Skipping ${symbol}: quote.c is undefined`, quote);
      return null;
    }
    const parsedPrice = Number(quote.c);
    if (!isFinite(parsedPrice) || parsedPrice <= 0) {
      console.warn(`⚠️ Skipping ${symbol}: invalid price parsed from quote.c`, quote);
      return null;
    }

    // ✅ Respect custom buyPrice; fallback to quote.c if not provided
    // ✅ Set buyDate to addedAt unless explicitly passed; use quote.t only for historicalData
    const buyPrice = customBuyPrice !== null && !isNaN(Number(customBuyPrice))
      ? Number(customBuyPrice)
      : Number(quote.c);

    let buyDate = addedAt;
    if (customBuyDate && !isNaN(Date.parse(customBuyDate))) {
      buyDate = customBuyDate;
    }

    const ticker = {
      symbol,
      buyPrice,
      buyDate,
      historicalData: [{
        price: !isNaN(Number(buyPrice)) ? Number(buyPrice) : 0,
        timestamp: quote.t
          ? (() => {
            try {
              return new Date(quote.t * 1000).toISOString();
            } catch (e) {
              console.error("❌ Failed to convert quote.t to ISO:", quote.t, e);
              return addedAt;
            }
          })()
          : addedAt
      }],
      addedAt,
      type: 'real',
      isMock: false
    };

    if (buyPrice === 0) {
      console.warn(`⚠️ Historical entry has price = 0:`, { price: buyPrice, timestamp: addedAt });
    }

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