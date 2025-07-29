import { fetchQuote } from '@data/finvizAdapter';
import normalizeTicker from '@data/normalizeTicker';

// Global state to track active fetches per watchlist
const activeFetches = new Map(); // slug -> { status, currentBatch, totalBatches, abortController }

// Per-watchlist request counters
const watchlistRequestCounts = new Map(); // slug -> { count, resetTime }

// Global request counter to track API calls (for logging only)
let globalRequestCount = 0;
let lastResetTime = Date.now();

// Reset global counter every minute (for logging only)
function resetGlobalRequestCounter() {
  const now = Date.now();
  if (now - lastResetTime >= 60000) { // 1 minute
    globalRequestCount = 0;
    lastResetTime = now;
  }
}

// Always allow requests (no rate limiting)
function canMakeRequest() {
  return true;
}

// Increment global request counter (for logging only)
function incrementGlobalRequestCounter() {
  resetGlobalRequestCounter();
  globalRequestCount++;
  console.log(`📊 Global API Request #${globalRequestCount} (unlimited)`);
}

// Get or initialize watchlist request counter
function getWatchlistRequestCounter(slug) {
  if (!watchlistRequestCounts.has(slug)) {
    watchlistRequestCounts.set(slug, { count: 0, resetTime: Date.now() });
  }
  return watchlistRequestCounts.get(slug);
}

// Increment watchlist request counter
function incrementWatchlistRequestCounter(slug) {
  const counter = getWatchlistRequestCounter(slug);
  counter.count++;
  console.log(`📊 Watchlist ${slug} API Request #${counter.count}`);
}

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
function splitIntoBatches(tickers, batchSize = 100) {
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
      // Reset watchlist request counter when fetch is cancelled
      watchlistRequestCounts.delete(slug);
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
  async startFetch(slug, items, updateCallback, isManual = false, bypassMarketClosed = false) {
    // Check if market is open, unless bypass is requested
    if (!isMarketOpen() && !bypassMarketClosed) {
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

    const BATCH_SIZE = 100; // Increased batch size since no rate limits
    const batches = splitIntoBatches(realTickers, BATCH_SIZE);
    
    // Create abort controller for this fetch
    const abortController = new AbortController();
    
    // Reset watchlist request counter for this fetch
    watchlistRequestCounts.set(slug, { count: 0, resetTime: Date.now() });
    
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
        const updatedItems = await this._processBatch(batch, items, abortController, slug);
        
        // Call update callback with current progress
        if (updateCallback && typeof updateCallback === 'function') {
          // Calculate current ticker index
          const tickersFetched = (batchIndex + 1) * BATCH_SIZE > realTickers.length ? realTickers.length : (batchIndex + 1) * BATCH_SIZE;
          updateCallback(updatedItems, {
            tickersFetched,
            totalTickers: realTickers.length
          });
        }

        // No delay between batches (unlimited requests)
      }

      // Fetch completed successfully
      this.activeFetches.delete(slug);
      // Reset watchlist request counter when fetch completes
      watchlistRequestCounts.delete(slug);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Fetch was cancelled, clean up
        this.activeFetches.delete(slug);
        // Reset watchlist request counter when fetch is cancelled
        watchlistRequestCounts.delete(slug);
      } else {
        console.error(`❌ Error in fetch for ${slug}:`, error);
        // Mark as failed but keep state for potential retry
        const fetch = this.activeFetches.get(slug);
        if (fetch) {
          fetch.status = 'failed';
        }
        // Reset watchlist request counter when fetch fails
        watchlistRequestCounts.delete(slug);
      }
    }
  }

  /**
   * Process a single batch of tickers
   */
  async _processBatch(batch, allItems, abortController, slug) {
    const updatedItems = [...allItems];
    
    for (const item of batch) {
      // Check for cancellation
      if (abortController.signal.aborted) {
        throw new Error('Fetch cancelled');
      }

      try {
        // Check if we can make a request
        if (!canMakeRequest()) {
          console.warn(`⚠️ Rate limit reached for ${item.symbol}. Skipping request.`);
          continue;
        }
        
        incrementGlobalRequestCounter();
        incrementWatchlistRequestCounter(slug);
        const newTicker = await fetchQuote(item.symbol);
        
        // Validate that we got a proper ticker object
        if (!newTicker || typeof newTicker !== 'object' || !newTicker.historicalData || newTicker.historicalData.length === 0) {
          console.warn(`⚠️ Skipping ${item.symbol} due to invalid ticker object:`, newTicker);
          continue;
        }

        // Get only the current market data from Finviz (no historical data)
        const currentFinvizData = newTicker.historicalData[0];
        
        if (!currentFinvizData) {
          console.warn(`⚠️ Skipping ${item.symbol} due to no current data`);
          continue;
        }

        // Check if we have new data by comparing with existing data
        const existingLatestData = item.historicalData?.at(-1); // Get the last entry
        
        if (existingLatestData && currentFinvizData) {
          const isSamePrice = Math.abs(Number(existingLatestData.price) - currentFinvizData.price) < 0.0001;
          const isOlderTimestamp = new Date(currentFinvizData.timestamp) <= new Date(existingLatestData.timestamp);

          if (isSamePrice && isOlderTimestamp) {
            console.log(`⏭️ Skipped ${item.symbol} update — same price and older timestamp.`);
            continue;
          }
        }

        // Filter out any data points before the buy date
        const buyDate = new Date(item.buyDate);
        const filteredHistoricalData = (item.historicalData || []).filter(point => {
          const pointDate = new Date(point.timestamp);
          return pointDate >= buyDate;
        });

        // Append the new current data point
        const updatedHistoricalData = [...filteredHistoricalData, currentFinvizData];

        // Update the ticker with appended data
        const updatedTicker = {
          ...item,
          historicalData: updatedHistoricalData,
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

        // No delay between requests (unlimited)
      } catch (err) {
        console.error(`❌ Error refreshing ${item.symbol}:`, err);
      }
    }

    return updatedItems;
  }

  /**
   * Get current global request count status
   */
  getRequestStatus() {
    resetGlobalRequestCounter();
    return {
      current: globalRequestCount,
      limit: 'unlimited',
      remaining: 'unlimited',
      resetIn: 0
    };
  }

  /**
   * Get current request count status for a specific watchlist
   */
  getWatchlistRequestStatus(slug) {
    const counter = getWatchlistRequestCounter(slug);
    return {
      current: counter.count,
      resetTime: counter.resetTime
    };
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