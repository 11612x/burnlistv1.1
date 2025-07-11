import CustomTooltip from "./CustomTooltip";
import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
  XAxis,
  ReferenceLine,
} from "recharts";
import { getReturnInTimeframe } from '@logic/portfolioUtils';
import { getSlicedData } from '@logic/portfolioUtils';

// Burnlist Visual Spec: Use pure white (#ffffff) for axes and text, bright green (#0de309) for lines and borders, black background (#000000), minimal styling, no animations or gradients.

console.log("📥 WatchlistChart: Imported getSlicedData from @logic/portfolioUtils");

// ✅ Expecting portfolioReturnData to be structured as [{ symbol, buyDate, historicalData[], timeframe }]
// 🧠 Normalize input by slicing each asset's return data from its buyDate forward
// referenceLine: optional, draws a horizontal test line at y=referenceLine. Remove or set to null to hide.
const WatchlistChart = ({ portfolioReturnData, showBacktestLine, height = 300, lineColor = '#7FBAA1', hideAxes = false, hideBorder = false, showTooltip = true, referenceLine = null }) => {
  // 🚧 Guard clause: Avoid crash when portfolioReturnData is undefined, empty, or all zero prices
  const isEmptyOrZeroData = !Array.isArray(portfolioReturnData) || portfolioReturnData.length === 0 || portfolioReturnData.every(entry => 
    !entry || !Array.isArray(entry.historicalData) || entry.historicalData.length === 0 || entry.historicalData.every(p => Number(p.price) === 0)
  );

  if (isEmptyOrZeroData) {
    console.log("🟢 WatchlistChart has no valid price data to render.");
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#ffffff", fontFamily: "'Courier New'" }}>
        No valid data to display yet.
      </div>
    );
  }

  const slicedChartData = portfolioReturnData.map(entry => {
    if (!entry || !entry.symbol || !Array.isArray(entry.historicalData) || entry.historicalData.length === 0) {
      console.log("⚠️ Skipping invalid entry:", entry);
      return null;
    }
    const { historicalData, buyDate, symbol, timeframe } = entry;
    
    // Validate buyDate before passing to getSlicedData
    const validBuyDate = buyDate && new Date(buyDate).toString() !== 'Invalid Date' ? buyDate : null;
    
    const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, validBuyDate);
    if (!startPoint || !endPoint) {
      console.log(`⚠️ Skipping ${symbol}: invalid slice`);
      return null;
    }

    console.log(`📊 Chart mode: ${showBacktestLine ? "Backtest (full history)" : "Live (from buyDate)"}`);

    const effectiveStartDate = showBacktestLine ? null : buyDate;

    // ⚠️ Filter chart data visually to avoid showing line before buyDate
    const slicedPoints = historicalData
      .filter(p => {
        const pointDate = new Date(p.timestamp);
        return !effectiveStartDate || pointDate >= new Date(effectiveStartDate);
      })
      .map(p => ({ ...p, timestampValue: new Date(p.timestamp).getTime() }));

    if (slicedPoints.length === 0) {
      console.log(`⚠️ Skipping ${symbol}: no data after buyDate`);
      return null;
    }

    console.log(`[Chart Line] ${symbol}: Showing data from ${slicedPoints[0]?.timestamp} to ${slicedPoints[slicedPoints.length - 1]?.timestamp}`);

    return {
      symbol,
      timestampValue: new Date(endPoint.timestamp).getTime(),
      slicedPoints
    };
  }).filter(Boolean);

  // ✅ Expecting data derived from items[].historicalData[] structure
  // portfolioReturnData is expected to be preprocessed and normalized before being passed in.
  console.log("📈 WatchlistChart received data:", portfolioReturnData);

  console.log("✅ Chart line will render from sliced data points only.");

  const chartPointsByTimestamp = {};

  slicedChartData.forEach(entry => {
    entry.slicedPoints.forEach(point => {
      const t = point.timestampValue;
      if (!chartPointsByTimestamp[t]) {
        chartPointsByTimestamp[t] = { timestampValue: t, returns: [] };
      }
      chartPointsByTimestamp[t].returns.push({ symbol: entry.symbol, point });
    });
  });

  const portfolioChartData = Object.values(chartPointsByTimestamp)
    .map(({ timestampValue, returns }) => {
      const returnPercents = returns.map(({ symbol, point }) => {
        const entry = slicedChartData.find(e => e.symbol === symbol);
        if (!entry) return null;
        const timeframe = portfolioReturnData.find(p => p.symbol === symbol)?.timeframe;
        if (!timeframe) return null;
        const buyDate = portfolioReturnData.find(p => p.symbol === symbol)?.buyDate;
        if (!buyDate) return null;
        const historicalData = portfolioReturnData.find(p => p.symbol === symbol)?.historicalData;
        if (!historicalData) return null;
        
        // Validate buyDate before passing to getReturnInTimeframe
        const validBuyDate = buyDate && new Date(buyDate).toString() !== 'Invalid Date' ? buyDate : null;
        
        const r = getReturnInTimeframe(historicalData, timeframe, validBuyDate, point.timestamp);
        if (r === null || r === undefined || isNaN(r)) return null;
        return r;
      }).filter(r => r !== null && r !== undefined && !isNaN(r));

      // If no valid returns at this timestamp, skip the point entirely
      if (returnPercents.length === 0) {
        console.log(`⚠️ Skipping timestamp ${timestampValue}: no valid returns`);
        return null;
      }

      const averageReturn = returnPercents.reduce((acc, val) => acc + val, 0) / returnPercents.length;

      console.log("📊 Graph point @", timestampValue, "=", averageReturn, "from", returnPercents.length, "tickers");

      return {
        timestampValue,
        returnPercent: averageReturn
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestampValue - b.timestampValue);

  if (!portfolioChartData || portfolioChartData.length === 0) {
    console.log("🟡 WatchlistChart skipped rendering: portfolioChartData is empty.");
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#ffffff", fontFamily: "'Courier New'" }}>
        No valid data to display.
      </div>
    );
  }

  // Calculate max absolute return for zero-centered Y axis
  const maxAbsReturn = portfolioChartData && portfolioChartData.length > 0
    ? Math.max(10, ...portfolioChartData.map(p => Math.abs(p.returnPercent)))
    : 10;

  return (
    <div style={{
      width: "100%",
      height: height,
      padding: 0,
      margin: 0,
      borderTop: hideBorder ? 'none' : '2px solid #7FBAA1',
      borderRight: hideBorder ? 'none' : '2px solid #7FBAA1',
      borderBottom: hideBorder ? 'none' : '2px solid #7FBAA1',
      borderLeft: 'none', // <-- Left border removed so Y axis line is the frame
      boxSizing: 'border-box',
      backgroundColor: '#000',
      fontFamily: 'Courier New'
    }}>
      <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible", padding: 0, margin: 0 }}>
        {/* Chart margin: set left to 0 for seamless Y axis */}
        <LineChart data={portfolioChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          {/* Y Axis and X Axis */}
          {/* Zero-centered Y axis: domain is always [-max, max] so 0 is in the middle */}
          {!hideAxes && (
            <YAxis
              type="number"
              domain={[-maxAbsReturn, maxAbsReturn]}
              tick={false}
              axisLine={true}
              tickLine={false}
              stroke="#7FBAA1" // <-- Y axis color matches border for seamless look
              strokeWidth={1}
            />
          )}
          {!hideAxes && (
          <XAxis
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={false}
            axisLine={true}
            tickLine={false}
            stroke="#fff"
            strokeWidth={1}
            scale="linear"
          />
          )}

          {showTooltip && (
            <Tooltip
              content={CustomTooltip}
              wrapperStyle={{
                position: 'absolute',
                bottom: 10,
                right: 20,
                width: 180,
                height: 'auto',
                pointerEvents: 'none',
                zIndex: 10,
                margin: 0,
                padding: 8,
                boxSizing: 'border-box',
              }}
              cursor={false}
            />
          )}

          <Line
            type="linear"
            dataKey="returnPercent"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* Test/Prop Line: Remove this block or set referenceLine to null to hide */}
          {referenceLine !== null && (
            <ReferenceLine
              y={referenceLine}
              stroke="#e31507"
              strokeDasharray="3 3"
              label="Test Line"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomActiveDot = ({ cx, chartHeight }) => {
  if (cx === undefined || chartHeight === undefined) return null;
  return (
    <line
      x1={cx}
      y1={0}
      x2={cx}
      y2={chartHeight}
      stroke="#0de309"
      strokeWidth={2}
    />
  );
};

const getYDomain = (data) => {
  if (!data.length) return [-10, 10];
  const allPrices = data.flatMap(entry => entry.slicedPoints.map(p => p.price));
  if (!allPrices.length) return [-10, 10];
  const sortedPrices = allPrices.slice().sort((a, b) => a - b);
  const lowIndex = Math.floor(sortedPrices.length * 0.05);
  const highIndex = Math.ceil(sortedPrices.length * 0.95);
  const min = sortedPrices[lowIndex] ?? 0;
  const max = sortedPrices[highIndex] ?? 0;
  const padding = Math.max(2, Math.ceil((max - min) * 0.05));
  return [Math.floor(min - padding), Math.ceil(max + padding)];
};

export default WatchlistChart;