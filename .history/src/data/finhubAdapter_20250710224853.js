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
    const timestamp = new Date(Number(data.t) * 1000).toISOString();

    if (isNaN(currentPrice) || isNaN(new Date(timestamp).getTime())) {
      console.warn(`⚠️ Parsed quote has invalid values for ${symbol}:`, { currentPrice, timestamp });
      return null;
    }

    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${timestamp}`);

    // Fallback historical data for real tickers to match mock shape
    return {
      symbol,
      buyPrice: currentPrice,
      buyDate: timestamp,
      historicalData: [
        {
          price: currentPrice,
          timestamp: timestamp
        }
      ]
    };
  } catch (error) {
    console.error(`❌ fetchQuote error for ${symbol}:`, error);
    return null;
  }
}
