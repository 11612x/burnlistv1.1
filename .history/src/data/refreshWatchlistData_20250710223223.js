import { fetchQuote } from '@data/finhubAdapter';
import { normalizeTicker } from '@data/normalizeTicker';

/**
 * Refreshes all real tickers in a watchlist by fetching their latest price
 * and appending it to historicalData.
 *
 * @param {Array} items - Array of ticker objects
 * @param {Function} updateFn - Function to call with updated items (e.g., setWatchlists or setItems)
 */
export async function refreshWatchlistData(items, updateFn) {
  const updatedItems = await Promise.all(
    items.map(async (item) => {
      if (item.type !== 'real') return item;

      try {
        const quote = await fetchQuote(item.symbol);
        console.log(`📡 Raw quote from API for ${item.symbol}:`, quote);
        console.log(`🧪 Validating quote.currentPrice for ${item.symbol}:`, quote?.currentPrice);
        if (quote == null || typeof quote.c === 'undefined' || isNaN(Number(quote.c)) || Number(quote.c) <= 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid quote.currentPrice:`, quote);
          return item;
        }

        const price = Number(quote.c);

        const newPoint = {
          price,
          timestamp: new Date().toISOString(),
        };

        const updatedTicker = {
          ...item,
          historicalData: [...(item.historicalData || []), newPoint],
        };

        const normalized = normalizeTicker(updatedTicker);
        return normalized;
      } catch (err) {
        console.error(`❌ Error refreshing ${item.symbol}:`, err);
        return item;
      }
    })
  );

  if (typeof updateFn === 'function') {
    updateFn(updatedItems);
  } else {
    return updatedItems;
  }
}
