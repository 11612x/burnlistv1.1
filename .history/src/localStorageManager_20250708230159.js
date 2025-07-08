

// localStorageManager.js

const STORAGE_KEY = 'burnlist-watchlists';

/**
 * Load all watchlists from localStorage
 * @returns {Array} Array of watchlists, each with { name, slug, items: [{ symbol, buyPrice, buyDate, historicalData }] }
 */
export function loadWatchlists() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('❌ Failed to load watchlists from localStorage:', err);
    return [];
  }
}

/**
 * Save the full watchlists array to localStorage
 * @param {Array} watchlists - Array of watchlists to persist
 */
export function saveWatchlists(watchlists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
    console.log('💾 Watchlists saved to localStorage:', watchlists);
  } catch (err) {
    console.error('❌ Failed to save watchlists to localStorage:', err);
  }
}

/**
 * Clear all watchlists from localStorage
 */
export function clearWatchlists() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Cleared all watchlists from localStorage');
  } catch (err) {
    console.error('❌ Failed to clear watchlists:', err);
  }
}