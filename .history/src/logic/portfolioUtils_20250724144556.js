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
      timeframeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "WEEK":
      timeframeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "MONTH":
      timeframeStart = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
      break;
    case "YEAR":
      timeframeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "YTD":
      timeframeStart = new Date(now.getFullYear(), 0, 1);
      break;
    case "MAX":
    default:
      timeframeStart = null;
  }

  // Use timeframe start, but never go before the buy date (buy date is the hard limit)
  const buyDateObj = new Date(buyDate || data[0]?.timestamp || now);
  let effectiveStart;
  
  if (timeframeStart) {
    // Use the later of: timeframe start OR buy date (can't go before buy date)
    effectiveStart = new Date(Math.max(timeframeStart.getTime(), buyDateObj.getTime()));
  } else {
    // For MAX timeframe, use buy date as start
    effectiveStart = buyDateObj;
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

  // Find the closest data point to effectiveStart (respecting buy date limit)
  const startIdx = binarySearchClosestIdx(data, effectiveStart.getTime());
  startPoint = data[startIdx];
  
  // If we're starting from buy date, use the actual buy price if available
  if (effectiveStart.getTime() === buyDateObj.getTime() && buyPrice && !isNaN(buyPrice)) {
    startPoint = {
      ...startPoint,
      price: Number(buyPrice)
    };
  }
  
  // Find the latest data point (end of timeframe - now)
  const endIdx = binarySearchClosestIdx(data, now.getTime());
  endPoint = data[endIdx];
  
  console.log(`✅ Timeframe window for ${symbol} (${timeframe}):`);
  console.log(`✅ Buy date limit: ${buyDateObj.toISOString()}`);
  console.log(`✅ Timeframe start: ${timeframeStart?.toISOString() || 'MAX'}`);
  console.log(`✅ Effective start: ${effectiveStart.toISOString()} → Price: ${startPoint?.price}`);
  console.log(`✅ End: ${now.toISOString()} → Price: ${endPoint?.price}`);
  if (startPoint && endPoint && startPoint.price && endPoint.price) {
    console.log(`✅ Return: ${((endPoint.price - startPoint.price) / startPoint.price * 100).toFixed(2)}%`);
  }

  if (!startPoint) {
    console.warn(`⛔ No valid startPoint found for ${symbol}`);
    return { startPoint: null, endPoint: null };
  }

  if (!endPoint) {
    console.warn(`⛔ No valid endPoint found for ${symbol}`);
    return { startPoint: null, endPoint: null };
  }

  console.log(`Filtered ${data.length} → start = ${startPoint?.price} @ ${startPoint?.timestamp}, end = ${endPoint?.price} @ ${endPoint?.timestamp}, effectiveStart = ${effectiveStart.toISOString()}`);

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

