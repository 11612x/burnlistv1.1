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

  // Validate buyDate: check for missing or invalid date, fallback to first data point or now
  let effectiveBuyDate = buyDate;
  if (!buyDate || new Date(buyDate).toString() === 'Invalid Date') {
    console.warn(`⚠️ [getSlicedData] Invalid or missing buyDate for ${symbol}. Falling back to first data point.`);
    effectiveBuyDate = data[0]?.timestamp || new Date().toISOString();
  }

  const effectiveStart = effectiveBuyDate
    ? timeframeStart
      ? new Date(Math.max(new Date(timeframeStart).getTime(), new Date(effectiveBuyDate).getTime()))
      : new Date(effectiveBuyDate)  // For MAX timeframe, use buy date
    : timeframeStart ?? new Date(effectiveBuyDate || data[0].timestamp);

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

  // Special case: if only two points, use them directly regardless of timeframe
  if (data.length === 2) {
    startPoint = {
      ...data[0],
      price: (buyPrice && !isNaN(buyPrice)) ? Number(buyPrice) : data[0].price
    };
    endPoint = data[1];
    console.log(`✅ Special case: using two points for ${symbol}:`, startPoint, endPoint);
  } else if (data.length === 1) {
    // Only use proportional slicing when we have insufficient historical data
    // For manual entries with limited data, calculate proportional return
    const buyPriceValue = (buyPrice && !isNaN(buyPrice)) ? Number(buyPrice) : data[0].price;
    const currentPrice = data[0].price;
    const totalReturn = ((currentPrice - buyPriceValue) / buyPriceValue) * 100;
    
    // Calculate proportional return based on timeframe
    const now = new Date();
    const buyDateObj = new Date(buyDate || data[0].timestamp);
    const totalDays = (now - buyDateObj) / (1000 * 60 * 60 * 24);
    
    let proportionalReturn = totalReturn;
    if (timeframe === "D") {
      proportionalReturn = totalReturn / Math.max(totalDays, 1);
    } else if (timeframe === "W") {
      proportionalReturn = totalReturn / Math.max(totalDays / 7, 1);
    } else if (timeframe === "M") {
      proportionalReturn = totalReturn / Math.max(totalDays / 30, 1);
    } else if (timeframe === "Y") {
      proportionalReturn = totalReturn / Math.max(totalDays / 365, 1);
    } else if (timeframe === "YTD") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const ytdDays = (now - yearStart) / (1000 * 60 * 60 * 24);
      proportionalReturn = totalReturn / Math.max(totalDays / ytdDays, 1);
    }
    // For MAX timeframe, use full return
    
    const proportionalPrice = buyPriceValue + (buyPriceValue * proportionalReturn / 100);
    
    startPoint = {
      ...data[0],
      price: buyPriceValue
    };
    endPoint = {
      ...data[0],
      price: proportionalPrice
    };
    console.log(`✅ Single point proportional return for ${symbol}: totalReturn=${totalReturn}%, timeframe=${timeframe}, proportionalReturn=${proportionalReturn}%`);
  } else if (data.length > 1) {
    // For historical data, find the closest points to buy date and current date
    const buyDateObj = new Date(buyDate || data[0].timestamp);
    const now = new Date();
    
    // Find closest point to buy date for startPoint
    let closestBuyIdx = 0;
    let minBuyDiff = Math.abs(new Date(data[0].timestamp) - buyDateObj);
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(new Date(data[i].timestamp) - buyDateObj);
      if (diff < minBuyDiff) {
        minBuyDiff = diff;
        closestBuyIdx = i;
      }
    }
    
    // Find closest point to current date for endPoint
    let closestCurrentIdx = data.length - 1;
    let minCurrentDiff = Math.abs(new Date(data[data.length - 1].timestamp) - now);
    for (let i = data.length - 2; i >= 0; i--) {
      const diff = Math.abs(new Date(data[i].timestamp) - now);
      if (diff < minCurrentDiff) {
        minCurrentDiff = diff;
        closestCurrentIdx = i;
      }
    }
    
    // Use buyPrice if provided, otherwise use the closest historical price
    const startPrice = (buyPrice && !isNaN(buyPrice)) ? Number(buyPrice) : data[closestBuyIdx].price;
    const endPrice = data[closestCurrentIdx].price;
    
    startPoint = {
      ...data[closestBuyIdx],
      price: startPrice
    };
    endPoint = {
      ...data[closestCurrentIdx],
      price: endPrice
    };
    
    console.log(`✅ Historical data points for ${symbol}: buyDate=${buyDate}, closestBuyIdx=${closestBuyIdx}, closestCurrentIdx=${closestCurrentIdx}`);
    console.log(`✅ Start point: ${startPrice} @ ${data[closestBuyIdx].timestamp}`);
    console.log(`✅ End point: ${endPrice} @ ${data[closestCurrentIdx].timestamp}`);
  }

  // Find endPoint (latest point <= now) using binary search
  function binarySearchEndIdx(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let bestIdx = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = new Date(arr[mid].timestamp).getTime();
      if (midTime <= target) {
        bestIdx = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return bestIdx;
  }
  const endIdx = binarySearchEndIdx(data, now.getTime());
  endPoint = data[endIdx];

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

