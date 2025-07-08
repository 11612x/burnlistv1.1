


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