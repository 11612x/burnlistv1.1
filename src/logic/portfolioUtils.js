export function getAverageReturn(historicalSnapshots, timeframe) {
  console.log('🔍 getAverageReturn called with timeframe:', timeframe, 'snapshots:', historicalSnapshots.length);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  let earliest;

  switch (timeframe) {
    case "D":
      earliest = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "W":
      earliest = new Date(now.getTime() - 7 * msPerDay);
      break;
    case "M":
      earliest = new Date(now.getTime() - 30 * msPerDay);
      break;
    case "Y":
      earliest = new Date(now.getTime() - 365 * msPerDay);
      break;
    case "YTD":
      earliest = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      earliest = null;
  }

  let totalReturn = 0;
  let count = 0;

  for (const snapshot of historicalSnapshots) {
    const symbol = snapshot.symbol || "?";
    const historicalData = snapshot.historicalData;
    const buyDate = snapshot.buyDate;
    const buyPrice = snapshot.buyPrice;
    
    console.log(`[Header Loop] Processing ${symbol}: historicalData length: ${historicalData?.length || 0}, buyDate: ${buyDate}, buyPrice: ${buyPrice}`);

    if (!Array.isArray(historicalData)) {
      continue;
    }

    // Validate buyDate before passing to getSlicedData
    const validBuyDate = buyDate && new Date(buyDate).toString() !== 'Invalid Date' ? buyDate : null;

    const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, validBuyDate, symbol, buyPrice);
    
    console.log(`[Header Debug] ${symbol}: startPoint:`, startPoint, 'endPoint:', endPoint);

    if (
      startPoint &&
      endPoint &&
      typeof startPoint.price === "number" &&
      typeof endPoint.price === "number" &&
      startPoint.price > 0
    ) {
      const individualReturn =
        ((endPoint.price - startPoint.price) / startPoint.price) * 100;

      console.log(`[Header %] ${symbol}:`);
      console.log("Start Point (header):", startPoint);
      console.log("End Point (header):", endPoint);
      console.log("Calculated Return (header):", individualReturn);
      console.log("Running total:", totalReturn, "count:", count);

      totalReturn += individualReturn;
      count++;
    }
  }

  const finalAverage = count > 0 ? totalReturn / count : 0;
  console.log(`[Header Final] Total: ${totalReturn}, Count: ${count}, Average: ${finalAverage}%`);
  return finalAverage;
}

// Returns { startPoint, endPoint } for given data and timeframe.
export function getSlicedData(data, timeframe, buyDate, symbol = "?", buyPrice = null) {
  if (!Array.isArray(data) || data.length === 0) return { startPoint: null, endPoint: null };
  const now = new Date();

  const normalizedTimeframe = {
    D: "D",
    W: "WEEK",
    M: "MONTH",
    Y: "YEAR",
    YTD: "YTD",
    MAX: "MAX"
  }[timeframe] || timeframe;

  let timeframeStart;
  switch (normalizedTimeframe) {
    case "D":
      // Use start of today (midnight) for daily calculations
      timeframeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "WEEK":
      // Use exactly 7 days ago at the same time
      timeframeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "MONTH":
      // Use exactly 31 days ago at the same time
      timeframeStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
      break;
    case "YEAR":
      // Use exactly 365 days ago at the same time
      timeframeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "YTD":
      timeframeStart = new Date(now.getFullYear(), 0, 1);
      break;
    case "MAX":
    default:
      timeframeStart = null;
  }

  // For MAX timeframe: use buy date and buy price
  // For all other timeframes: use the LATER of buy date or timeframe start
  const buyDateObj = new Date(buyDate || data[0]?.timestamp || now);
  
  let startDate;
  let startPrice;
  
  // Sort data by timestamp first to ensure consistent ordering (oldest to newest)
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (timeframe === 'MAX') {
    // MAX timeframe: always use the earliest available data point
    startDate = new Date(sortedData[0]?.timestamp);
    startPrice = Number(sortedData[0]?.price) || 0;
    console.log(`📅 MAX: Using earliest available data for ${symbol} from ${startDate.toISOString()}: $${startPrice}`);
  } else {
    // All other timeframes: use earliest available price within the defined window
    const timeframeStartTime = timeframeStart.getTime();
    let earliestInWindow = null;
    
    // Find the earliest data point within the timeframe window
    for (const point of sortedData) {
      const pointTime = new Date(point.timestamp).getTime();
      if (pointTime >= timeframeStartTime) {
        earliestInWindow = point;
        break;
      }
    }
    
    if (earliestInWindow) {
      // Use the earliest point within the timeframe window
      startDate = new Date(earliestInWindow.timestamp);
      startPrice = Number(earliestInWindow.price) || 0;
      console.log(`📅 ${normalizedTimeframe}: Using earliest data within window for ${symbol} from ${startDate.toISOString()}: $${startPrice}`);
    } else {
      // No data within timeframe window, use the earliest available data overall
      startDate = new Date(sortedData[0]?.timestamp);
      startPrice = Number(sortedData[0]?.price) || 0;
      console.log(`📅 ${normalizedTimeframe}: No data in window, using earliest available for ${symbol} from ${startDate.toISOString()}: $${startPrice}`);
    }
  }
  
  // --- Binary search for startPoint ---
  function binarySearchClosestIdx(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let bestIdx = 0;
    let bestDiff = Math.abs(new Date(arr[0].timestamp) - target);
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = new Date(arr[mid].timestamp).getTime();
      const diff = Math.abs(midTime - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = mid;
      }
      if (midTime < target) {
        left = mid + 1;
      } else if (midTime > target) {
        right = mid - 1;
      } else {
        return mid;
      }
    }
    return bestIdx;
  }

  let startPoint = null;
  let endPoint = null;
  
  // Find the start point data
  const startIdx = binarySearchClosestIdx(data, startDate.getTime());
  startPoint = {
    ...data[startIdx],
    timestamp: startDate.toISOString(),
    price: startPrice
  };
  
  // End point is always the latest available data point
  endPoint = data[data.length - 1];
  
  console.log(`✅ Return calculation for ${symbol} (${timeframe}):`);
  if (timeframe === 'MAX') {
    console.log(`✅ Start: Buy date ${buyDateObj.toISOString()} → Buy Price: ${startPoint.price}`);
  } else {
    console.log(`✅ Buy date: ${buyDateObj.toISOString()}`);
    console.log(`✅ Timeframe start: ${timeframeStart?.toISOString() || 'now'}`);
    console.log(`✅ Effective start: ${startDate.toISOString()} → Price: ${startPoint.price}`);
    if (startDate === buyDateObj) {
      console.log(`✅ Using buy date (more recent than timeframe start)`);
    } else {
      console.log(`✅ Using timeframe start (buy date is older)`);
    }
  }
  console.log(`✅ End: ${endPoint?.timestamp} → Price: ${endPoint?.price}`);
  if (startPoint && endPoint && startPoint.price && endPoint.price) {
    const calculatedReturn = ((endPoint.price - startPoint.price) / startPoint.price * 100);
    console.log(`✅ Return: ${calculatedReturn.toFixed(2)}%`);
    console.log(`🔍 DEBUG: startPoint.price=${startPoint.price}, endPoint.price=${endPoint.price}, difference=${endPoint.price - startPoint.price}`);
    console.log(`🔍 TIMESTAMP DEBUG: startPoint.timestamp=${startPoint.timestamp}, endPoint.timestamp=${endPoint.timestamp}`);
  }

  if (!startPoint) {
    console.warn(`⛔ No valid startPoint found for ${symbol}`);
    return { startPoint: null, endPoint: null };
  }

  if (!endPoint) {
    console.warn(`⛔ No valid endPoint found for ${symbol}`);
    return { startPoint: null, endPoint: null };
  }

  console.log(`Filtered ${data.length} → start = ${startPoint?.price} @ ${startPoint?.timestamp}, end = ${endPoint?.price} @ ${endPoint?.timestamp}, buyDate = ${buyDateObj.toISOString()}`);

  return { startPoint, endPoint };
}

// Returns the percentage change between start and end point in a given timeframe
export function getReturnInTimeframe(data, timeframe, buyDate = null, symbol = "?") {
  const { startPoint, endPoint } = getSlicedData(data, timeframe, buyDate, symbol);
  if (!buyDate) {
    console.warn(`⚠️ [getReturnInTimeframe] No buyDate passed for ${symbol}. Defaulting to timeframe start.`);
  }

  if (
    startPoint &&
    endPoint &&
    typeof startPoint.price === "number" &&
    typeof endPoint.price === "number" &&
    startPoint.price > 0
  ) {
    const percentChange = ((endPoint.price - startPoint.price) / startPoint.price) * 100;

    console.log(`[Return %] ${symbol}:`);
    console.log("Start Point (return %):", startPoint);
    console.log("End Point (return %):", endPoint);
    console.log("Calculated Return (return %):", percentChange);

    return percentChange;
  } else {
    console.warn(`[Return %] Incomplete data for ${symbol}. Returning 0.`);
    return 0;
  }
}

