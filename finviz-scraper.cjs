const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
console.log('CORS enabled for all origins');
app.options('*', cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 