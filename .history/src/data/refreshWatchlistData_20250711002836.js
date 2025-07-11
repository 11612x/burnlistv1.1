import { fetchQuote } from '@data/finhubAdapter';
import normalizeTicker from '@data/normalizeTicker';

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
        console.log(`🧪 Validating quote.c for ${item.symbol}:`, quote?.c);
        // Validate that quote.c exists and is a positive number
        if (quote == null || typeof quote.c === 'undefined' || isNaN(Number(quote.c)) || Number(quote.c) <= 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid quote.c:`, quote);
          return item;
        }

        const price = Number(quote.c);
        const timestamp = new Date().toISOString();

        const lastPoint = item.historicalData?.at(-1);
        const lastPrice = lastPoint?.price ?? null;
        const lastTimestamp = lastPoint?.timestamp ?? null;

        if (lastPrice !== null && lastTimestamp !== null) {
          const isSamePrice = Math.abs(Number(lastPrice) - price) < 0.0001;
          const isOlderTimestamp = new Date(timestamp) <= new Date(lastTimestamp);

          if (isSamePrice && isOlderTimestamp) {
            console.log(`⏭️ Skipped ${item.symbol} update — same price and older timestamp.`, {
              lastPrice,
              lastTimestamp,
              newPrice: price,
              newTimestamp: timestamp,
            });
            return item;
          }
        }

        const newPoint = { price, timestamp };

        const updatedTicker = {
          ...item,
          historicalData: [...(item.historicalData || []), newPoint],
        };

        const normalized = {
          ...normalizeTicker(updatedTicker),
          buyPrice: item.buyPrice,
          buyDate: item.buyDate,
          type: item.type,
          isMock: item.isMock,
          addedAt: item.addedAt,
        };
        console.log(`✅ Final normalized item for ${item.symbol}:`, normalized);
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
