export function getAverageReturn(historicalSnapshots, timeframe) {
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

    if (!Array.isArray(historicalData)) {
      continue;
    }

    const { startPoint, endPoint } = getSlicedData(historicalData, timeframe, buyDate);

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

      totalReturn += individualReturn;
      count++;
    }
  }

  return count > 0 ? totalReturn / count : 0;
}

// Returns { startPoint, endPoint } for given data and timeframe.
export function getSlicedData(data, timeframe, buyDate, symbol = "?") {
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

  // Warn if buyDate is missing and fallback to first data point
  if (!buyDate && data.length > 0) {
    console.warn(`⚠️ No buyDate provided. Falling back to first data point: ${data[0].timestamp}`);
  }

  const effectiveStart = buyDate
    ? timeframeStart
      ? new Date(Math.max(new Date(timeframeStart).getTime(), new Date(buyDate).getTime()))
      : new Date(buyDate)
    : timeframeStart ?? new Date(data[0].timestamp);

  console.log("📅 Slicing", symbol, "from", effectiveStart.toISOString(), "to", now.toISOString());

  let startPoint = null;
  let endPoint = null;

  for (let i = 1; i < data.length; i++) {
    const prev = new Date(data[i - 1].timestamp);
    const curr = new Date(data[i].timestamp);

    // Interpolate startPoint
    if (!startPoint && prev <= effectiveStart && curr >= effectiveStart) {
      const ratio = (effectiveStart - prev) / (curr - prev);
      const interpolatedPrice = data[i - 1].price + ratio * (data[i].price - data[i - 1].price);
      startPoint = {
        timestamp: new Date(effectiveStart).toISOString(),
        price: interpolatedPrice
      };
    }

    // Find latest endPoint <= now
    if (curr <= now) {
      endPoint = data[i];
    } else {
      break;
    }
  }

  if (!startPoint) {
    console.warn("⛔ No valid startPoint found for", symbol);
    return { startPoint: null, endPoint: null };
  }

  if (!endPoint) {
    console.warn("⛔ No valid endPoint found for", symbol);
    return { startPoint: null, endPoint: null };
  }

  console.log(`Filtered ${data.length} → start = ${startPoint?.price} @ ${startPoint?.timestamp}, end = ${endPoint?.price} @ ${endPoint?.timestamp}, effectiveStart = ${effectiveStart.toISOString()}`);

  return { startPoint, endPoint };
}
