import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
  XAxis,
  ReferenceLine,
  Label
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { getSlicedData, getReturnInTimeframe } from '@logic/portfolioUtils';

const UI_GREEN = '#0de309';

const WatchlistChart = ({ portfolioReturnData, height = 300, showTooltip = true }) => {
  // Memoize chart data for performance
  const chartData = useMemo(() => {
    if (!Array.isArray(portfolioReturnData) || portfolioReturnData.length === 0) return [];
    // 1. For each ticker, slice to the selected timeframe
    const sliced = portfolioReturnData.map(entry => {
      if (!entry || !Array.isArray(entry.historicalData) || entry.historicalData.length === 0) return null;
      const { historicalData, buyDate, symbol, timeframe } = entry;
      const validBuyDate = buyDate && new Date(buyDate).toString() !== 'Invalid Date' ? buyDate : null;
      const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, validBuyDate);
      if (!startPoint || !endPoint) return null;
      // Only keep points within the timeframe
      const effectiveStart = new Date(startPoint.timestamp).getTime();
      const effectiveEnd = new Date(endPoint.timestamp).getTime();
      const points = historicalData.filter(p => {
        const t = new Date(p.timestamp).getTime();
        return t >= effectiveStart && t <= effectiveEnd;
      }).map(p => ({ ...p, timestampValue: new Date(p.timestamp).getTime() }));
      return { symbol, points, timeframe, buyDate };
    }).filter(Boolean);
    if (sliced.length === 0) return [];
    // 2. Build a unified, sorted list of timestamps across all tickers
    const allTimestamps = Array.from(new Set(sliced.flatMap(t => t.points.map(p => p.timestampValue)))).sort((a, b) => a - b);
    if (allTimestamps.length === 0) return [];
    // 3. Downsample to 30 evenly spaced points
    const maxPoints = 30;
    const step = allTimestamps.length <= maxPoints ? 1 : Math.floor(allTimestamps.length / maxPoints);
    const sampledTimestamps = allTimestamps.filter((_, i) => i % step === 0);
    // Always include the last point
    if (sampledTimestamps[sampledTimestamps.length - 1] !== allTimestamps[allTimestamps.length - 1]) {
      sampledTimestamps.push(allTimestamps[allTimestamps.length - 1]);
    }
    // 4. For each sampled timestamp, calculate average return across all tickers
    const points = sampledTimestamps.map(ts => {
      const returns = sliced.map(ticker => {
        // For each ticker, find the closest point <= ts
        const idx = ticker.points.findIndex(p => p.timestampValue >= ts);
        const point = idx === -1 ? ticker.points[ticker.points.length - 1] : ticker.points[idx];
        // Calculate return from start of timeframe to this point
        const start = ticker.points[0];
        if (!start || !point || start.price === 0) return 0;
        return ((point.price - start.price) / start.price) * 100;
      });
      const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      return {
        timestampValue: ts,
        returnPercent: avgReturn
      };
    });
    return points;
  }, [portfolioReturnData]);

  // If no data, show empty chart
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#ffffff", fontFamily: "'Courier New'", background: '#000' }}>
        No valid data to display yet.
      </div>
    );
  }

  // Calculate Y axis domain
  const maxAbsReturn = Math.max(10, ...chartData.map(p => Math.abs(p.returnPercent)));

  return (
    <div style={{ width: "100%", height, backgroundColor: '#000', fontFamily: 'Courier New' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          {/* Y Axis with % label */}
          <YAxis
            type="number"
            domain={[-maxAbsReturn, maxAbsReturn]}
            tick={{ fill: UI_GREEN, fontFamily: 'Courier New', fontSize: 12 }}
            axisLine={true}
            tickLine={false}
            stroke={UI_GREEN}
            strokeWidth={1}
          >
            <Label value="%" position="insideTopLeft" offset={-8} fill={UI_GREEN} fontSize={14} />
          </YAxis>
          {/* X Axis with date label */}
          <XAxis
            type="number"
            dataKey="timestampValue"
            domain={['dataMin', 'dataMax']}
            tick={false}
            axisLine={true}
            tickLine={false}
            stroke="#fff"
            strokeWidth={1}
            scale="linear"
          />
          {/* Faint zero line */}
          <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
          {/* Main average return line */}
          <Line
            type="monotone"
            dataKey="returnPercent"
            stroke={UI_GREEN}
            strokeWidth={2}
            dot={{ r: 3, fill: UI_GREEN, stroke: '#000', strokeWidth: 1 }}
            activeDot={{ r: 5, fill: UI_GREEN, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {/* Tooltip only on datapoints */}
          {showTooltip && (
            <Tooltip
              content={CustomTooltip}
              cursor={{ stroke: UI_GREEN, strokeWidth: 1, strokeDasharray: '2 2' }}
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
              filterNull={true}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WatchlistChart;