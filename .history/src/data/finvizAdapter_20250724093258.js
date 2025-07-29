import axios from 'axios';

// Finviz API server endpoint
const FINVIZ_API_BASE = 'http://localhost:3001/api';

export async function fetchQuote(symbol) {
  try {
    symbol = symbol.toUpperCase();
    const url = `${FINVIZ_API_BASE}/finviz-quote?ticker=${symbol}&timeframe=d`;
    console.log(`🌐 Requesting Finviz quote for symbol: ${symbol}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log(`📥 Raw Finviz data for ${symbol}:`, data);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`❗ No data received for ${symbol}:`, data);
      return null;
    }

    // Convert Finviz CSV data to our format
    const historicalData = data.map(row => {
      const date = row.Date || row.date;
      const price = parseFloat(row.Close || row.close || row.Price || row.price);
      
      if (!date || isNaN(price) || price <= 0) {
        console.warn(`⚠️ Invalid data point for ${symbol}:`, row);
        return null;
      }
      
      return {
        price: price,
        timestamp: new Date(date).toISOString()
      };
    }).filter(point => point !== null);

    if (historicalData.length === 0) {
      console.warn(`⚠️ No valid historical data for ${symbol}`);
      return null;
    }

    // Get the most recent price (first entry in the array)
    const currentPrice = historicalData[0].price;
    const marketTimestamp = historicalData[0].timestamp;

    console.log(`📡 fetchQuote → ${symbol}: $${currentPrice} @ ${marketTimestamp}`);

    // Return ticker with current market price as buyPrice (will be overridden by custom price if provided)
    return {
      symbol,
      buyPrice: currentPrice, // Current market price as default
      buyDate: marketTimestamp, // Market timestamp as default
      historicalData: historicalData
    };
  } catch (error) {
    console.error(`❌ fetchQuote error for ${symbol}:`, error);
    return null;
  }
}

// Additional function to get historical data for different timeframes
export async function fetchHistoricalData(symbol, timeframe = 'd') {
  try {
    symbol = symbol.toUpperCase();
    const url = `${FINVIZ_API_BASE}/finviz-quote?ticker=${symbol}&timeframe=${timeframe}`;
    console.log(`🌐 Requesting Finviz historical data for ${symbol} (${timeframe})`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`❗ No historical data received for ${symbol}:`, data);
      return null;
    }

    // Convert to our format
    const historicalData = data.map(row => {
      const date = row.Date || row.date;
      const price = parseFloat(row.Close || row.close || row.Price || row.price);
      
      if (!date || isNaN(price) || price <= 0) {
        return null;
      }
      
      return {
        price: price,
        timestamp: new Date(date).toISOString()
      };
    }).filter(point => point !== null);

    return historicalData;
  } catch (error) {
    console.error(`❌ fetchHistoricalData error for ${symbol}:`, error);
    return null;
  }
} 