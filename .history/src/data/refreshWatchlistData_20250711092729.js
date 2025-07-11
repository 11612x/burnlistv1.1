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
        const newTicker = await fetchQuote(item.symbol);
        console.log(`📡 Raw quote from API for ${item.symbol}:`, newTicker);
        
        // Validate that we got a proper ticker object
        if (!newTicker || typeof newTicker !== 'object' || !newTicker.historicalData || newTicker.historicalData.length === 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid ticker object:`, newTicker);
          return item;
        }

        const latestPrice = newTicker.historicalData[0].price;
        const latestTimestamp = newTicker.historicalData[0].timestamp;

        if (!latestPrice || isNaN(Number(latestPrice)) || Number(latestPrice) <= 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid price:`, latestPrice);
          return item;
        }

        const lastPoint = item.historicalData?.at(-1);
        const lastPrice = lastPoint?.price ?? null;
        const lastTimestamp = lastPoint?.timestamp ?? null;

        if (lastPrice !== null && lastTimestamp !== null) {
          const isSamePrice = Math.abs(Number(lastPrice) - latestPrice) < 0.0001;
          const isOlderTimestamp = new Date(latestTimestamp) <= new Date(lastTimestamp);

          if (isSamePrice && isOlderTimestamp) {
            console.log(`⏭️ Skipped ${item.symbol} update — same price and older timestamp.`, {
              lastPrice,
              lastTimestamp,
              newPrice: latestPrice,
              newTimestamp: latestTimestamp,
            });
            return item;
          }
        }

        const newPoint = { price: latestPrice, timestamp: latestTimestamp };

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
