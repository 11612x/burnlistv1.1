// Debug script to test header calculation
const testData = [
  {
    symbol: "AAPL",
    buyPrice: 100,
    buyDate: "2025-01-01T00:00:00.000Z",
    historicalData: [
      { price: 100, timestamp: "2025-01-01T00:00:00.000Z" },
      { price: 150, timestamp: "2025-01-02T00:00:00.000Z" }
    ]
  },
  {
    symbol: "TSLA", 
    buyPrice: 200,
    buyDate: "2025-01-01T00:00:00.000Z",
    historicalData: [
      { price: 200, timestamp: "2025-01-01T00:00:00.000Z" },
      { price: 250, timestamp: "2025-01-02T00:00:00.000Z" }
    ]
  }
];

console.log("Test data:", testData);

// Simulate the calculation
const historicalSnapshots = testData.map(item => ({
  symbol: item.symbol,
  historicalData: item.historicalData,
  buyDate: item.buyDate,
  buyPrice: item.buyPrice
}));

console.log("Historical snapshots:", historicalSnapshots);

// Expected calculation:
// AAPL: (150-100)/100 * 100 = 50%
// TSLA: (250-200)/200 * 100 = 25%
// Average: (50 + 25) / 2 = 37.5%

console.log("Expected average return: 37.5%"); 