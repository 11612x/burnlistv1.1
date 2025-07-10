

export default function normalizeTicker(ticker) {
  if (!ticker || typeof ticker !== "object") {
    console.warn("⚠️ normalizeTicker received invalid input:", ticker);
    return {
      symbol: "UNKNOWN",
      buyPrice: 0,
      buyDate: new Date().toISOString(),
      historicalData: [],
      addedAt: new Date().toISOString(),
      type: "real",
      isMock: false,
    };
  }

  const normalizedHistorical = Array.isArray(ticker.historicalData)
    ? ticker.historicalData.map(entry => ({
        price: Number(entry?.price) || 0,
        timestamp: new Date(entry?.timestamp).toISOString(),
      }))
    : [];

  return {
    symbol: String(ticker.symbol || "UNKNOWN").toUpperCase(),
    buyPrice: Number(ticker.buyPrice) || 0,
    buyDate: new Date(ticker.buyDate || ticker.addedAt || Date.now()).toISOString(),
    historicalData: normalizedHistorical,
    addedAt: new Date(ticker.addedAt || Date.now()).toISOString(),
    type: ticker.type || "real",
    isMock: Boolean(ticker.isMock),
  };
}