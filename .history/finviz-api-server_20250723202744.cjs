const express = require('express');
const { parse } = require('csv-parse/sync');
const cors = require('cors');

const FINVIZ_API_TOKEN = '947b2097-7436-4e8d-bcd9-894fcdebb27b';

const app = express();
app.use(cors());
const PORT = 3001;

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

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 