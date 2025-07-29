const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());
console.log('CORS enabled for all origins');

// Handle preflight requests
app.options('*', cors()); 