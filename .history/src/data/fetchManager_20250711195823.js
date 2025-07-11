import { fetchQuote } from '@data/finhubAdapter';
import normalizeTicker from '@data/normalizeTicker';

// Global state to track active fetches per watchlist
const activeFetches = new Map(); // slug -> { status, currentBatch, totalBatches, abortController }

// Utility: Check if NYSE is open (Mon-Fri, 9:30am-4:00pm ET)
function isMarketOpen() {
  const now = new Date();
  // Get NY time
  const nyTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const day = nyTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  // Market open: Mon-Fri, 9:30am-4:00pm
  if (day === 0 || day === 6) return false;
  if (hours < 9 || (hours === 9 && minutes < 30)) return false;
  if (hours > 16 || (hours === 16 && minutes > 0)) return false;
  return true;
}

// Split tickers into batches
function splitIntoBatches(tickers, batchSize = 60) {
  const batches = [];
  for (let i = 0; i < tickers.length; i += batchSize) {
    batches.push(tickers.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Fetch manager that supports pausing, cancelling, and resuming from the middle of a batch
 */
export class FetchManager {
  constructor() {
    this.activeFetches = new Map();
  }

  /**
   * Check if a fetch is currently active for a watchlist
   */
  isFetchActive(slug) {
    const fetch = this.activeFetches.get(slug);
    return fetch && fetch.status === 'active';
  }

  /**
   * Get the current fetch status for a watchlist
   */
  getFetchStatus(slug) {
    const fetch = this.activeFetches.get(slug);
    if (!fetch) return null;
    
    return {
      status: fetch.status,
      currentBatch: fetch.currentBatch,
      totalBatches: fetch.totalBatches,
      progress: fetch.totalBatches > 0 ? `${fetch.currentBatch}/${fetch.totalBatches}` : null
    };
  }

  /**
   * Cancel any active fetch for a watchlist
   */
  cancelFetch(slug) {
    const fetch = this.activeFetches.get(slug);
    if (fetch && fetch.abortController) {
      fetch.abortController.abort();
      fetch.status = 'cancelled';
    }
  }

  /**
   * Pause any active fetch for a watchlist (store current state)
   */
  pauseFetch(slug) {
    const fetch = this.activeFetches.get(slug);
    if (fetch && fetch.status === 'active') {
      fetch.status = 'paused';
      if (fetch.abortController) {
        fetch.abortController.abort();
      }
    }
  }

  /**
   * Resume a paused fetch for a watchlist
   */
  async resumeFetch(slug, items, updateCallback) {
    const fetch = this.activeFetches.get(slug);
    if (!fetch || fetch.status !== 'paused') return;

    // Resume from the current batch
    await this._executeFetch(slug, items, updateCallback, fetch.currentBatch);
  }

  /**
   * Start a new fetch or resume a paused one
   */
  async startFetch(slug, items, updateCallback, isManual = false) {
    // Check if market is open
    if (!isMarketOpen()) {
      if (isManual) {
        return { success: false, message: "Market is closed" };
      }
      return { success: false, message: null };
    }

    // Check if there's already an active fetch
    if (this.isFetchActive(slug)) {
      if (isManual) {
        return { success: false, message: "Fetch already in progress" };
      }
      return { success: false, message: null };
    }

    // Check if there's a paused fetch to resume
    const existingFetch = this.activeFetches.get(slug);
    if (existingFetch && existingFetch.status === 'paused') {
      await this.resumeFetch(slug, items, updateCallback);
      return { success: true, message: null };
    }

    // Start a new fetch
    await this._executeFetch(slug, items, updateCallback, 0);
    return { success: true, message: null };
  }

  /**
   * Execute the actual fetch process
   */
  async _executeFetch(slug, items, updateCallback, startBatchIndex = 0) {
    // Filter for real tickers only
    const realTickers = items.filter(item => item.type === 'real' && !item.isMock);
    if (realTickers.length === 0) return;

    const BATCH_SIZE = 60;
    const batches = splitIntoBatches(realTickers, BATCH_SIZE);
    
    // Create abort controller for this fetch
    const abortController = new AbortController();
    
    // Initialize fetch state
    this.activeFetches.set(slug, {
      status: 'active',
      currentBatch: startBatchIndex,
      totalBatches: batches.length,
      abortController
    });

    try {
      // Process batches starting from startBatchIndex
      for (let batchIndex = startBatchIndex; batchIndex < batches.length; batchIndex++) {
        // Check if fetch was cancelled
        if (abortController.signal.aborted) {
          this.activeFetches.delete(slug);
          return;
        }

        // Update current batch
        const fetch = this.activeFetches.get(slug);
        if (fetch) {
          fetch.currentBatch = batchIndex + 1;
        }

        const batch = batches[batchIndex];
        const updatedItems = await this._processBatch(batch, items, abortController);
        
        // Call update callback with current progress
        if (updateCallback && typeof updateCallback === 'function') {
          updateCallback(updatedItems, {
            currentBatch: batchIndex + 1,
            totalBatches: batches.length,
            progress: `${batchIndex + 1}/${batches.length}`
          });
        }

        // Wait 1 minute between batches (except for the first batch)
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        }
      }

      // Fetch completed successfully
      this.activeFetches.delete(slug);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Fetch was cancelled, clean up
        this.activeFetches.delete(slug);
      } else {
        console.error(`❌ Error in fetch for ${slug}:`, error);
        // Mark as failed but keep state for potential retry
        const fetch = this.activeFetches.get(slug);
        if (fetch) {
          fetch.status = 'failed';
        }
      }
    }
  }

  /**
   * Process a single batch of tickers
   */
  async _processBatch(batch, allItems, abortController) {
    const updatedItems = [...allItems];
    
    for (const item of batch) {
      // Check for cancellation
      if (abortController.signal.aborted) {
        throw new Error('Fetch cancelled');
      }

      try {
        const newTicker = await fetchQuote(item.symbol);
        
        // Validate that we got a proper ticker object
        if (!newTicker || typeof newTicker !== 'object' || !newTicker.historicalData || newTicker.historicalData.length === 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid ticker object:`, newTicker);
          continue;
        }

        const latestPrice = newTicker.historicalData[0].price;
        const latestTimestamp = newTicker.historicalData[0].timestamp;

        if (!latestPrice || isNaN(Number(latestPrice)) || Number(latestPrice) <= 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid price:`, latestPrice);
          continue;
        }

        const lastPoint = item.historicalData?.at(-1);
        const lastPrice = lastPoint?.price ?? null;
        const lastTimestamp = lastPoint?.timestamp ?? null;

        if (lastPrice !== null && lastTimestamp !== null) {
          const isSamePrice = Math.abs(Number(lastPrice) - latestPrice) < 0.0001;
          const isOlderTimestamp = new Date(latestTimestamp) <= new Date(lastTimestamp);

          if (isSamePrice && isOlderTimestamp) {
            console.log(`⏭️ Skipped ${item.symbol} update — same price and older timestamp.`);
            continue;
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

        // Update the item in the array
        const itemIndex = updatedItems.findIndex(i => i.symbol === item.symbol);
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = normalized;
        }

        // Add a 1 second delay between each call to respect 60 requests/minute limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`❌ Error refreshing ${item.symbol}:`, err);
        if (err?.response?.status === 429) {
          // Rate limit - wait 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return updatedItems;
  }

  /**
   * Clean up all active fetches (call on app unmount)
   */
  cleanup() {
    for (const [slug, fetch] of this.activeFetches) {
      if (fetch.abortController) {
        fetch.abortController.abort();
      }
    }
    this.activeFetches.clear();
  }
}

// Export a singleton instance
export const fetchManager = new FetchManager(); 