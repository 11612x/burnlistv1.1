

import { fetchQuote } from '@data/finhubAdapter';
import { generateMockTicker } from '@data/mockTickerGenerator';
import { normalizeSymbol } from '@data/tickerUtils';

export async function createTicker(symbol, type = 'real', customBuyPrice = null, customBuyDate = null) {
  symbol = normalizeSymbol(symbol);
  const addedAt = new Date().toISOString();

  try {
    if (type === 'mock' || symbol.startsWith('#')) {
      const mockTicker = generateMockTicker(symbol);
      const buyPrice = customBuyPrice ?? mockTicker.historicalData[0]?.price ?? 0;
      const buyDate = customBuyDate ?? mockTicker.historicalData[0]?.timestamp ?? addedAt;

      return {
        ...mockTicker,
        buyPrice,
        buyDate,
        addedAt,
        type: 'mock',
        isMock: true
      };
    }

    const quote = await fetchQuote(symbol);
    if (!quote) {
      console.warn(`⚠️ createTicker: No quote returned for symbol ${symbol}`);
      return null;
    }

    const buyPrice = customBuyPrice ?? quote.currentPrice ?? 0;
    const buyDate = customBuyDate ?? quote.buyDate ?? addedAt;

    return {
      symbol,
      currentPrice: quote.currentPrice,
      buyPrice,
      buyDate,
      addedAt,
      historicalData: [], // starts collecting now
      type: 'real',
      isMock: false
    };
  } catch (error) {
    console.error(`❌ createTicker failed for ${symbol}:`, error);
    return null;
  }
}