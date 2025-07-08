import CustomTooltip from "./CustomTooltip";
import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";
import { getSlicedData } from "../utils/portfolioUtils";
import { getReturnInTimeframe } from '@logic/portfolioUtils';

// 🧠 Normalize input by slicing each asset’s return data from its buyDate forward
const WatchlistChart = ({ portfolioReturnData, showBacktestLine }) => {
  const slicedChartData = portfolioReturnData.map(entry => {
    if (!entry || !entry.symbol || !Array.isArray(entry.historicalData) || entry.historicalData.length === 0) {
      console.log("⚠️ Skipping invalid entry:", entry);
      return null;
    }
    const { historicalData, buyDate, symbol, timeframe } = entry;
    const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, buyDate);
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

  // ✅ Expecting normalized and pre-aggregated input
  // portfolioReturnData is expected to be preprocessed and normalized before being passed in.
  console.log("📈 WatchlistChart received data:", portfolioReturnData);

  if (!Array.isArray(portfolioReturnData) || portfolioReturnData.length === 0) {
    console.log("🟢 WatchlistChart is waiting for portfolio data to load...");
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#888", fontFamily: "'Courier New', Courier, monospace" }}>
        No data yet. Add tickers to get started.
      </div>
    );
  }

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
        const r = getReturnInTimeframe(historicalData, timeframe, buyDate, point.timestamp);
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

  return (
    <div style={{ width: "100%", height: 300, padding: 0, margin: 0, border: '2px solid #0de309', boxSizing: 'border-box' }}>
      <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible", padding: 0, margin: 0 }}>
        <LineChart data={portfolioChartData} margin={{ top: 0, right: 0, left: -61, bottom: -31 }}>
          <YAxis
            type="number"
            domain={getYDomain(slicedChartData)}
            tick={false}
            axisLine={true}
            tickLine={false}
            stroke="#e31507"
            strokeWidth={1}
          />
          <XAxis
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={false}
            axisLine={true}
            tickLine={false}
            stroke="#e31507"
            strokeWidth={1}
            scale="linear"
          />

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

          <Line
            type="linear"
            dataKey="returnPercent"
            stroke="#0de309"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
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