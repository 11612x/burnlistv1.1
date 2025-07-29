import axios from 'axios';

// Use environment variable for API key
const API_KEY = import.meta.env.VITE_FINHUB_API_KEY || 'd1leaapr01qt4thfm1a0d1leaapr01qt4thfm1ag'; // Fallback for development

export async function fetchQuote(symbol) {
  try {
    symbol = symbol.toUpperCase();
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`🌐 Requesting quote for symbol: ${symbol}`);
    }
    
    const response = await axios.get(url);

    const data = response.data;
    
    if (import.meta.env.DEV) {
      console.log(`📥 Raw quote data for ${symbol}:`, data);
    }
    
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

    if (import.meta.env.DEV) {
      console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${marketTimestamp}`);
    }

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
