import axios from 'axios';

const API_KEY = 'd1leaapr01qt4thfm1a0d1leaapr01qt4thfm1ag'; // replace with secure method in production

export async function fetchQuote(symbol) {
  try {
    symbol = symbol.toUpperCase();
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    console.log(`🌐 Requesting quote for symbol: ${symbol}`);
    const response = await axios.get(url);

    const data = response.data;
    console.log(`📥 Raw quote data for ${symbol}:`, data);
    if (!data || typeof data.c !== 'number' || typeof data.t !== 'number') {
      console.warn(`❗ Invalid quote data for ${symbol}:`, data);
      return null;
    }

    const currentPrice = Number(data.c);
    const marketTimestamp = new Date(Number(data.t) * 1000).toISOString();
    const addedAt = new Date().toISOString(); // When user adds to watchlist

    if (isNaN(currentPrice) || isNaN(new Date(marketTimestamp).getTime())) {
      console.warn(`⚠️ Parsed quote has invalid values for ${symbol}:`, { currentPrice, marketTimestamp });
      return null;
    }

    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${marketTimestamp}`);

    // Return ticker with buyDate set to when user added it, not market timestamp
    return {
      symbol,
      buyPrice: currentPrice,
      buyDate: addedAt, // When user added to watchlist
      historicalData: [
        {
          price: currentPrice,
          timestamp: marketTimestamp // Market timestamp for historical data
        }
      ]
    };
  } catch (error) {
    console.error(`❌ fetchQuote error for ${symbol}:`, error);
    return null;
  }
}
