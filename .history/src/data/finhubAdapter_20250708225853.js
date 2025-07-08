import axios from 'axios';

const API_KEY = 'd1iiio9r01qhbuvq89c0d1iiio9r01qhbuvq89cg'; // replace with secure method in production

export async function fetchQuote(symbol) {
  try {
    symbol = symbol.toUpperCase();
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const response = await axios.get(url);

    const data = response.data;
    if (!data || typeof data.c !== 'number' || typeof data.t !== 'number') {
      console.warn(`❗ Invalid quote data for ${symbol}:`, data);
      return null;
    }

    const currentPrice = data.c;
    const timestamp = new Date(data.t * 1000).toISOString();

    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${timestamp}`);

    // Fallback historical data for real tickers to match mock shape
    return {
      symbol,
      currentPrice,
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
