import axios from 'axios';

// Use environment variable for API key
const API_KEY = import.meta.env.VITE_FINHUB_API_KEY || 'd1leaapr01qt4thfm1a0d1leaapr01qt4thfm1ag'; // Fallback for development

export async function fetchQuote(symbol, timeframe = 'd') {
  try {
    symbol = symbol.toUpperCase();
    
    console.log(`🌐 Requesting Finnhub quote for symbol: ${symbol}`);
    
    // Get current quote only
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const quoteResponse = await axios.get(quoteUrl);
    const quoteData = quoteResponse.data;
    
    if (!quoteData || typeof quoteData.c !== 'number' || typeof quoteData.t !== 'number') {
      console.warn(`❗ Invalid quote data for ${symbol}:`, quoteData);
      return null;
    }
    
    const currentPrice = Number(quoteData.c);
    const marketTimestamp = new Date(Number(quoteData.t) * 1000).toISOString();
    const fetchTimestamp = new Date().toISOString();
    
    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${marketTimestamp}`);
    
    return {
      symbol,
      buyPrice: currentPrice,
      buyDate: marketTimestamp,
      historicalData: [
        {
          price: currentPrice,
          timestamp: marketTimestamp,
          fetchTimestamp: fetchTimestamp,
          symbol: symbol
        }
      ]
    };
  } catch (error) {
    console.error(`❌ fetchQuote error for ${symbol}:`, error);
    if (error.response) {
      console.error(`❌ Server error for ${symbol}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error(`❌ Network error for ${symbol}:`, error.request);
    } else {
      console.error(`❌ Other error for ${symbol}:`, error.message);
    }
    return null;
  }
}

export async function fetchHistoricalData(symbol, from, to) {
  // This function is kept for compatibility but returns null
  // Historical data should only come from manual entries
  console.log(`⚠️ fetchHistoricalData called for ${symbol} - historical data should be manual only`);
  return null;
}
