// Buy Score calculation module for Universe Screener

// Normalization helpers
function normalize(value, min, max) {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
}

function peScore(pe) {
  if (pe <= 15) return 100;
  if (pe <= 30) return 70;
  if (pe <= 50) return 40;
  return 0;
}

function betaScore(beta) {
  return (beta >= 1.2 && beta <= 2.5) ? 100 : 50;
}

// Main calculation function
export function calculateBuyScore({
  epsGrowth,
  avgVolume,
  relVolume,
  technicalFlags,
  earningsDaysAway,
  price,
  pe,
  marketCap,
  beta,
  newsFlag,
  // Context toggles
  sectorAlignment,
  marketSupport,
  volatilityClear,
  breadthHealthy,
} = {}) {
  // Core Setup Score (out of 70)
  let core = 0;
  let totalWeight = 0;
  if (epsGrowth !== undefined && epsGrowth !== null && epsGrowth !== '') {
    core += normalize(epsGrowth, 0, 50) * 0.15;
    totalWeight += 0.15;
  }
  if (avgVolume !== undefined && avgVolume !== null && avgVolume !== '') {
    core += normalize(avgVolume, 500_000, 2_000_000) * 0.12;
    totalWeight += 0.12;
  }
  if (relVolume !== undefined && relVolume !== null && relVolume !== '') {
    core += normalize(relVolume, 1.0, 3.0) * 0.10;
    totalWeight += 0.10;
  }
  if (technicalFlags !== undefined && technicalFlags !== null) {
    core += (technicalFlags ? 100 : 0) * 0.10;
    totalWeight += 0.10;
  }
  if (earningsDaysAway !== undefined && earningsDaysAway !== null && earningsDaysAway !== '') {
    core += (earningsDaysAway > 5 ? 100 : 0) * 0.10;
    totalWeight += 0.10;
  }
  if (price !== undefined && price !== null && price !== '') {
    core += normalize(price, 7, 50) * 0.08;
    totalWeight += 0.08;
  }
  if (pe !== undefined && pe !== null && pe !== '') {
    core += peScore(pe) * 0.08;
    totalWeight += 0.08;
  }
  if (marketCap !== undefined && marketCap !== null && marketCap !== '') {
    core += normalize(marketCap, 500_000_000, 50_000_000_000) * 0.07;
    totalWeight += 0.07;
  }
  if (beta !== undefined && beta !== null && beta !== '') {
    core += betaScore(beta) * 0.05;
    totalWeight += 0.05;
  }
  if (newsFlag !== undefined && newsFlag !== null) {
    core += (newsFlag ? 100 : 0) * 0.02;
    totalWeight += 0.02;
  }
  // Scale core score to 70 pts, but only if totalWeight > 0
  const coreSetupScore = totalWeight > 0 ? (core * (70 / (100 * totalWeight))) : 0;

  // Context Score (out of 30)
  let contextScore = 0;
  if (sectorAlignment) contextScore += 10;
  if (marketSupport) contextScore += 10;
  if (volatilityClear) contextScore += 5;
  if (breadthHealthy) contextScore += 5;

  const totalBuyScore = coreSetupScore + contextScore;

  let tag = "Standby";
  if (totalBuyScore >= 90) tag = "Prime Entry";
  else if (totalBuyScore >= 75) tag = "Almost Ready";

  return {
    coreSetupScore: Math.round(coreSetupScore * 100) / 100,
    contextScore,
    totalBuyScore: Math.round(totalBuyScore * 100) / 100,
    tag,
  };
} 