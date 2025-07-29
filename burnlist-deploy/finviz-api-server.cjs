const express = require('express');
const { parse } = require('csv-parse/sync');
const cors = require('cors');

// Use environment variable for API token
const FINVIZ_API_TOKEN = process.env.FINVIZ_API_TOKEN || '947b2097-7436-4e8d-bcd9-894fcdebb27b';

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

app.get('/api/finviz-quote', async (req, res) => {
  const { ticker, timeframe = 'd' } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' });
  }

  const url = `https://elite.finviz.com/quote_export.ashx?t=${ticker}&p=${timeframe}&auth=${FINVIZ_API_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch data from Finviz' });
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
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 