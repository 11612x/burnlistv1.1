import axios from 'axios';

// Use environment variable for API key
const API_KEY = import.meta.env.VITE_FINHUB_API_KEY || 'd1leaapr01qt4thfm1a0d1leaapr01qt4thfm1ag'; // Fallback for development

export async function fetchQuote(symbol, timeframe = 'd') {
  try {
    symbol = symbol.toUpperCase();
    
    // Convert timeframe to Finnhub format
    const finhubTimeframe = {
      'd': 'D', 'w': 'W', 'm': 'M', 'y': 'Y', 'ytd': 'YTD', 'max': 'MAX'
    }[timeframe] || 'D';
    
    console.log(`🌐 Requesting Finnhub quote for symbol: ${symbol} (timeframe: ${timeframe})`);
    
    // Get current quote
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const quoteResponse = await axios.get(quoteUrl);
    const quoteData = quoteResponse.data;
    
    if (!quoteData || typeof quoteData.c !== 'number' || typeof quoteData.t !== 'number') {
      console.warn(`❗ Invalid quote data for ${symbol}:`, quoteData);
      return null;
    }
    
    const currentPrice = Number(quoteData.c);
    const marketTimestamp = new Date(Number(quoteData.t) * 1000).toISOString();
    
    // Get historical data
    const now = Math.floor(Date.now() / 1000);
    let from;
    
    switch (finhubTimeframe) {
      case 'D':
        from = now - (1 * 24 * 60 * 60); // 1 day ago
        break;
      case 'W':
        from = now - (7 * 24 * 60 * 60); // 7 days ago
        break;
      case 'M':
        from = now - (30 * 24 * 60 * 60); // 30 days ago
        break;
      case 'Y':
        from = now - (365 * 24 * 60 * 60); // 1 year ago
        break;
      case 'YTD':
        const currentYear = new Date().getFullYear();
        from = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
        break;
      case 'MAX':
      default:
        from = now - (5 * 365 * 24 * 60 * 60); // 5 years ago
        break;
    }
    
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${API_KEY}`;
    const candleResponse = await axios.get(candleUrl);
    const candleData = candleResponse.data;
    
    console.log(`📥 Raw Finnhub data for ${symbol}:`, candleData);
    console.log(`📊 Data length: ${candleData.t?.length || 0} records`);
    
    if (!candleData || !candleData.t || !Array.isArray(candleData.t) || candleData.t.length === 0) {
      console.warn(`❗ No historical data for ${symbol}:`, candleData);
      return null;
    }
    
    // Convert Finnhub candle data to our format
    const historicalData = candleData.t.map((timestamp, index) => ({
      price: Number(candleData.c[index]),
      timestamp: new Date(timestamp * 1000).toISOString(),
      fetchTimestamp: new Date().toISOString(),
      symbol: symbol
    }));
    
    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${marketTimestamp} (${historicalData.length} data points)`);
    
    return {
      symbol,
      buyPrice: currentPrice,
      buyDate: marketTimestamp,
      historicalData: historicalData
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
  try {
    symbol = symbol.toUpperCase();
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${API_KEY}`;
    
    console.log(`🌐 Requesting historical data for ${symbol} from ${from} to ${to}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.t || !Array.isArray(data.t) || data.t.length === 0) {
      console.warn(`❗ No historical data for ${symbol}:`, data);
      return null;
    }
    
    // Convert to our format
    const historicalData = data.t.map((timestamp, index) => ({
      price: Number(data.c[index]),
      timestamp: new Date(timestamp * 1000).toISOString(),
      fetchTimestamp: new Date().toISOString(),
      symbol: symbol
    }));
    
    console.log(`📡 fetchHistoricalData → ${symbol}: ${historicalData.length} data points`);
    
    return historicalData;
  } catch (error) {
    console.error(`❌ fetchHistoricalData error for ${symbol}:`, error);
    return null;
  }
}
