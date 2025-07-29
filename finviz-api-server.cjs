const express = require('express');
const { parse } = require('csv-parse/sync');
const cors = require('cors');

// Use environment variable for API token
const FINVIZ_API_TOKEN = process.env.FINVIZ_API_TOKEN || '947b2097-7436-4e8d-bcd9-894fcdebb27b';

const app = express();

// Configure CORS for Render.com deployment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://burnlist-frontend.onrender.com', 'http://localhost:5173']
    : true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/finviz-quote', async (req, res) => {
  const { ticker, timeframe = 'd' } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' });
  }

  const url = `https://elite.finviz.com/quote_export.ashx?t=${ticker}&p=${timeframe}&auth=${FINVIZ_API_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Finviz API error: ${response.status} ${response.statusText}`);
      return res.status(500).json({ 
        error: 'Failed to fetch data from Finviz',
        status: response.status,
        statusText: response.statusText
      });
    }
    const csvText = await response.text();
    
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 Raw CSV from Finviz for ${ticker}:`, csvText.substring(0, 500) + '...');
    }

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 Parsed ${records.length} records for ${ticker}:`, records.slice(0, 3));
    }

    res.json(records);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Burnlist API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 