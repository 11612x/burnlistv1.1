function normalizeTicker(ticker) {
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

  let incomplete = false;

  const normalizedHistorical = Array.isArray(ticker.historicalData)
    ? ticker.historicalData.map(entry => {
        const price = Number(entry?.price);
        const timestamp = new Date(entry?.timestamp).toISOString();
        if (isNaN(price) || !entry?.timestamp) {
          console.warn("⚠️ Malformed historical entry:", entry);
        }
        if (price === 0) {
          console.warn("⚠️ Historical entry has price = 0:", entry);
          incomplete = true;
        }
        return {
          price: isNaN(price) ? 0 : price,
          timestamp,
        };
      })
    : [];

  const buyPrice = Number(ticker.buyPrice);
  if (isNaN(buyPrice)) {
    console.warn("⚠️ Invalid buyPrice in ticker:", ticker);
  }
  if (buyPrice === 0) {
    console.warn("⚠️ Ticker has buyPrice = 0:", ticker);
    incomplete = true;
  }

  const buyDate = new Date(ticker.buyDate || ticker.addedAt || Date.now()).toISOString();
  const addedAt = new Date(ticker.addedAt || Date.now()).toISOString();

  const normalizedTicker = {
    symbol: String(ticker.symbol || "UNKNOWN").toUpperCase(),
    buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
    buyDate,
    historicalData: normalizedHistorical,
    addedAt,
    type: ticker.type || "real",
    isMock: Boolean(ticker.isMock),
    incomplete,
  };

  console.log("🧼 normalizeTicker →", normalizedTicker);
  return normalizedTicker;
}

export default normalizeTicker;
export { normalizeTicker };