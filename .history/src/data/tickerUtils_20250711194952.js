export function normalizeSymbol(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidTicker(symbol) {
  const cleaned = normalizeSymbol(symbol);
  return /^#?\w{1,10}$/.test(cleaned);
}

export function dedupeWatchlist(list) {
  const seen = new Set();
  return list.filter(item => {
    const key = normalizeSymbol(item.symbol);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatDisplayName(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.replace(/^#/, '').toUpperCase();
}

/**
 * Parse watchlist data from a simple text format
 * Expected format: SYMBOL BUY_PRICE CURRENT_PRICE PERCENTAGE_CHANGE%
 * Example: ACMR	29.19	28.63	-1.92%
 * 
 * @param {string} textData - Raw text data with ticker information
 * @returns {Array} Array of ticker objects ready for the application
 */
export function parseWatchlistData(textData) {
  if (!textData || typeof textData !== 'string') {
    console.error('❌ parseWatchlistData: Invalid input data');
    return [];
  }

  const lines = textData.trim().split('\n');
  const tickers = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by tabs or multiple spaces
    const parts = trimmed.split(/\s+/);
    if (parts.length < 4) {
      console.warn(`⚠️ Skipping invalid line: ${trimmed}`);
      continue;
    }

    const [symbol, buyPriceStr, currentPriceStr, percentChangeStr] = parts;
    
    // Clean up the percentage string (remove % sign)
    const cleanPercent = percentChangeStr.replace('%', '');
    
    // Parse numeric values
    const buyPrice = parseFloat(buyPriceStr);
    const currentPrice = parseFloat(currentPriceStr);
    const percentChange = parseFloat(cleanPercent);

    // Validate the data
    if (isNaN(buyPrice) || isNaN(currentPrice) || isNaN(percentChange)) {
      console.warn(`⚠️ Skipping line with invalid numbers: ${trimmed}`);
      continue;
    }

    if (buyPrice <= 0 || currentPrice <= 0) {
      console.warn(`⚠️ Skipping line with non-positive prices: ${trimmed}`);
      continue;
    }

    // Create ticker object in the format expected by the application
    const ticker = {
      symbol: symbol.toUpperCase(),
      buyPrice: buyPrice,
      buyDate: new Date().toISOString(), // Use current date as buy date
      historicalData: [
        {
          price: currentPrice,
          timestamp: new Date().toISOString()
        }
      ],
      addedAt: new Date().toISOString(),
      type: 'real',
      isMock: false,
      incomplete: false
    };

    tickers.push(ticker);
    console.log(`✅ Parsed ticker: ${symbol} - Buy: $${buyPrice}, Current: $${currentPrice}, Change: ${percentChange}%`);
  }

  console.log(`📊 Successfully parsed ${tickers.length} tickers from input data`);
  return tickers;
}

/**
 * Import watchlist data from text format into a specific watchlist
 * 
 * @param {string} textData - Raw text data with ticker information
 * @param {string} watchlistSlug - The slug of the watchlist to import into
 * @param {Object} watchlists - Current watchlists object
 * @param {Function} setWatchlists - Function to update watchlists
 * @returns {Object} Result object with success status and message
 */
export function importWatchlistData(textData, watchlistSlug, watchlists, setWatchlists) {
  try {
    const newTickers = parseWatchlistData(textData);
    
    if (newTickers.length === 0) {
      return {
        success: false,
        message: 'No valid tickers found in the provided data.'
      };
    }

    // Find the target watchlist
    const targetWatchlist = Object.values(watchlists).find(w => w.slug === watchlistSlug);
    
    if (!targetWatchlist) {
      return {
        success: false,
        message: `Watchlist with slug '${watchlistSlug}' not found.`
      };
    }

    // Check for duplicates
    const existingSymbols = new Set((targetWatchlist.items || []).map(item => item.symbol));
    const duplicates = newTickers.filter(ticker => existingSymbols.has(ticker.symbol));
    const uniqueTickers = newTickers.filter(ticker => !existingSymbols.has(ticker.symbol));

    if (uniqueTickers.length === 0) {
      return {
        success: false,
        message: `All tickers already exist in the watchlist.`
      };
    }

    // Update the watchlist with new tickers
    const updatedWatchlists = { ...watchlists };
    for (const [id, wl] of Object.entries(updatedWatchlists)) {
      if (wl.slug === watchlistSlug) {
        updatedWatchlists[id] = {
          ...wl,
          items: [...(wl.items || []), ...uniqueTickers]
        };
        break;
      }
    }

    // Save to localStorage
    try {
      localStorage.setItem("burnlist_watchlists", JSON.stringify(updatedWatchlists));
    } catch (e) {
      console.error("❌ Failed to save to localStorage:", e);
      return {
        success: false,
        message: 'Failed to save to storage. Please try again.'
      };
    }

    // Update state
    setWatchlists(updatedWatchlists);

    const duplicateMessage = duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : '';
    
    return {
      success: true,
      message: `Successfully imported ${uniqueTickers.length} tickers into watchlist.${duplicateMessage}`
    };

  } catch (error) {
    console.error('❌ Error importing watchlist data:', error);
    return {
      success: false,
      message: 'An error occurred while importing the data.'
    };
  }
}