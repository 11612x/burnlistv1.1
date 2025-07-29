const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());
console.log('CORS enabled for all origins');

// Handle preflight requests
app.options('*', cors());

// Remove any malformed or full-URL route definitions
// Ensure only this valid route exists:
app.get('/api/finviz/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const url = `https://finviz.com/quote.ashx?t=${ticker}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    const snapshot = parseSnapshotTable($);
    const news = parseNews($);

    res.json({ snapshot, news });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from Finviz', details: error.message });
  }
}); 