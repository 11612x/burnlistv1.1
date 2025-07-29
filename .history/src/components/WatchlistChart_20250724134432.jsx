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
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const WatchlistChart = ({ portfolioReturnData, height = 300, showTooltip = true, mini = false, suppressEmptyMessage = false }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  const gray = useThemeColor('#888');
  // Memoize chart data for performance
  const chartData = useMemo(() => {
    if (!Array.isArray(portfolioReturnData) || portfolioReturnData.length === 0) return [];
    // 1. For each ticker, slice to the selected timeframe
    const sliced = portfolioReturnData.map(entry => {
      if (!entry || !Array.isArray(entry.historicalData) || entry.historicalData.length === 0) return null;
      const { historicalData, buyDate, buyPrice, symbol, timeframe } = entry;
      const validBuyDate = buyDate && new Date(buyDate).toString() !== 'Invalid Date' ? buyDate : null;
      const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, validBuyDate, symbol, buyPrice);
      if (!startPoint || !endPoint) return null;
      // Only keep points within the timeframe
      const effectiveStart = new Date(startPoint.timestamp).getTime();
      const effectiveEnd = new Date(endPoint.timestamp).getTime();
      let points = historicalData.filter(p => {
        const t = new Date(p.timestamp).getTime();
        return t >= effectiveStart && t <= effectiveEnd;
      }).map(p => ({ ...p, timestampValue: new Date(p.timestamp).getTime() }));
      // Insert a synthetic point at the start if needed
      if (points.length > 0 && points[0].timestampValue > effectiveStart) {
        points.unshift({
          ...points[0],
          timestamp: new Date(effectiveStart).toISOString(),
          timestampValue: effectiveStart,
          price: points[0].price
        });
      }
      // Insert a synthetic point at the end if needed
      if (points.length > 0 && points[points.length - 1].timestampValue < effectiveEnd) {
        points.push({
          ...points[points.length - 1],
          timestamp: new Date(effectiveEnd).toISOString(),
          timestampValue: effectiveEnd,
          price: points[points.length - 1].price
        });
      }
      // Store startPoint for correct return calculation
      return { symbol, points, timeframe, buyDate, buyPrice, startPoint };
    }).filter(Boolean);
    if (sliced.length === 0) return [];
    // 2. Build a unified, sorted list of timestamps across all tickers
    const allTimestamps = Array.from(new Set(sliced.flatMap(t => t.points.map(p => p.timestampValue)))).sort((a, b) => a - b);
    if (allTimestamps.length === 0) return [];
    // 3. Downsample to 30 evenly spaced points (or 5 if mini)
    const maxPoints = mini ? 5 : 30;
    const step = allTimestamps.length <= maxPoints ? 1 : Math.floor(allTimestamps.length / maxPoints);
    const sampledTimestamps = allTimestamps.filter((_, i) => i % step === 0);
    // Always include the last point
    if (sampledTimestamps[sampledTimestamps.length - 1] !== allTimestamps[allTimestamps.length - 1]) {
      sampledTimestamps.push(allTimestamps[allTimestamps.length - 1]);
    }
    // 4. For each sampled timestamp, calculate average return across all tickers
    const points = sampledTimestamps.map((ts, i) => {
      const returns = sliced.map(ticker => {
        // For each ticker, find the closest point <= ts
        const idx = ticker.points.findIndex(p => p.timestampValue >= ts);
        const point = idx === -1 ? ticker.points[ticker.points.length - 1] : ticker.points[idx];
        // Always use the startPoint.price for return calculation
        const start = ticker.startPoint;
        if (!start || !point || start.price === 0) return 0;
        const val = ((point.price - start.price) / start.price) * 100;
        return Number.isFinite(val) ? val : 0;
      });
      const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      return {
        timestampValue: ts,
        returnPercent: Number.isFinite(avgReturn) ? avgReturn : 0,
        xIndex: i
      };
    });
    // Debug log
    console.log('Chart data points:', points);
    return points;
  }, [portfolioReturnData, mini, JSON.stringify(portfolioReturnData.map(item => ({
    symbol: item.symbol,
    buyPrice: item.buyPrice,
    buyDate: item.buyDate
  })))]);

  // Find the min and max xIndex for the chart
  const minXIndex = 0;
  const maxXIndex = chartData.length > 0 ? chartData[chartData.length - 1].xIndex : undefined;

  // If no data, show empty chart or nothing if suppressed
  if (!chartData || chartData.length === 0) {
    if (suppressEmptyMessage) return null;
    return (
      <div style={{ textAlign: "center", padding: 40, color: green, fontFamily: "'Courier New'", background: black }}>
        No valid data to display yet.
      </div>
    );
  }

  // Calculate Y axis domain
  const returnPercents = chartData.map(p => Number.isFinite(p.returnPercent) ? p.returnPercent : 0);
  const minReturn = Math.min(...returnPercents);
  const maxReturn = Math.max(...returnPercents);
  const range = maxReturn - minReturn;
  const percentMargin = 0.05; // 5% of the range
  const minMargin = 1;        // at least 1 unit
  const margin = Math.max(range * percentMargin, minMargin);
  let yMin = minReturn - margin;
  let yMax = maxReturn + margin;
  // If all values are the same, add a small buffer
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  return (
    <div style={{ width: "100%", height, backgroundColor: black, fontFamily: 'Courier New', overflow: 'visible' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          {/* Minimalist sparkline if mini */}
          {mini ? (
            <>
              <YAxis hide={true} domain={[yMin, yMax]} padding={{ top: 0, bottom: 0 }} allowDataOverflow={true} />
              <Line
                type="monotone"
                dataKey="returnPercent"
                stroke={green}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </>
          ) : (
            <>
              {/* Y Axis with % label */}
              <YAxis
                type="number"
                domain={[yMin, yMax]}
                tick={{ fill: green, fontFamily: 'Courier New', fontSize: 12 }}
                axisLine={true}
                tickLine={false}
                stroke={green}
                strokeWidth={1}
                tickFormatter={v => v.toFixed(2)}
                allowDataOverflow={false}
              >
                <Label value="%" position="insideTopLeft" offset={-8} fill={green} fontSize={14} />
              </YAxis>
              {/* X Axis with date label */}
              <XAxis
                type="number"
                dataKey="xIndex"
                domain={[minXIndex, maxXIndex]}
                tick={false}
                axisLine={true}
                tickLine={false}
                stroke={green}
                strokeWidth={1}
                scale="linear"
                allowDataOverflow={false}
              />
              {/* Faint zero line */}
              <ReferenceLine y={0} stroke={gray} strokeDasharray="3 3" />
              {/* Main average return line */}
              <Line
                type="monotone"
                dataKey="returnPercent"
                stroke={green}
                strokeWidth={2}
                dot={{ r: 3, fill: green, stroke: black, strokeWidth: 1 }}
                activeDot={{ r: 5, fill: green, stroke: green, strokeWidth: 2 }}
                isAnimationActive={false}
              />
              {/* Tooltip only on datapoints */}
              {showTooltip && (
                <Tooltip
                  content={CustomTooltip}
                  cursor={{ stroke: green, strokeWidth: 1, strokeDasharray: '2 2' }}
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
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WatchlistChart;