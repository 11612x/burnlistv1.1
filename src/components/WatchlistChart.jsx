import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CustomTooltip from "./CustomTooltip";
import { getSlicedData, getReturnInTimeframe } from '@logic/portfolioUtils';
import { useThemeColor } from '../ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
    buyDate: item.buyDate,
    timeframe: item.timeframe
  })))]);

  // If no data, show empty chart or nothing if suppressed
  if (!chartData || chartData.length === 0) {
    if (suppressEmptyMessage) return null;
    return (
      <div style={{ textAlign: "center", padding: 40, color: green, fontFamily: "'Courier New'", background: black }}>
        No valid data to display yet.
      </div>
    );
  }

  // Prepare data for Chart.js
  const labels = chartData.map((_, index) => index);
  const data = chartData.map(point => point.returnPercent);

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: showTooltip && !mini,
        mode: 'index',
        intersect: false,
        backgroundColor: black,
        titleColor: green,
        bodyColor: green,
        borderColor: green,
        borderWidth: 1,
        titleFont: {
          family: 'Courier New',
          size: 12
        },
        bodyFont: {
          family: 'Courier New',
          size: 11
        },
        callbacks: {
          label: function(context) {
            return `Return: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: !mini,
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        border: {
          display: true,
          color: green,
          width: 2
        }
      },
      y: {
        display: !mini,
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        border: {
          display: true,
          color: green,
          width: 2
        },
        min: yMin,
        max: yMax
      }
    },
    elements: {
      point: {
        radius: mini ? 0 : 3,
        hoverRadius: mini ? 0 : 5,
        backgroundColor: green,
        borderColor: black,
        borderWidth: 1
      },
      line: {
        borderColor: green,
        borderWidth: 2,
        tension: 0.1
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const chartDataConfig = {
    labels: labels,
    datasets: [
      {
        label: 'Portfolio Return',
        data: data,
        borderColor: green,
        backgroundColor: green,
        fill: false,
        tension: 0.1
      }
    ]
  };

  return (
    <div style={{ width: "100%", height, backgroundColor: 'transparent', fontFamily: 'Courier New', overflow: 'hidden' }}>
      <Line data={chartDataConfig} options={chartOptions} />
    </div>
  );
};

export default WatchlistChart;