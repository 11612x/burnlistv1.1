import { fetchQuote } from '@data/finvizAdapter';
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

        // Get ALL historical data from Finviz
        const newHistoricalData = newTicker.historicalData;
        
        if (!newHistoricalData || newHistoricalData.length === 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to no historical data`);
          return item;
        }

        // Merge new historical data with existing data
        const existingHistoricalData = item.historicalData || [];
        const mergedHistoricalData = mergeHistoricalData(existingHistoricalData, newHistoricalData);
        
        console.log(`📊 ${item.symbol}: Merged ${existingHistoricalData.length} existing + ${newHistoricalData.length} new = ${mergedHistoricalData.length} total data points`);

        // Filter out any data points before the buy date
        const buyDate = new Date(item.buyDate);
        const filteredHistoricalData = mergedHistoricalData.filter(point => {
          const pointDate = new Date(point.timestamp);
          return pointDate >= buyDate;
        });

        const updatedTicker = {
          ...item,
          historicalData: filteredHistoricalData,
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
