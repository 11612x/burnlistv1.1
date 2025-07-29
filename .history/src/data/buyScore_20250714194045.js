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
  epsGrowth = 0,
  avgVolume = 0,
  relVolume = 1,
  technicalFlags = false,
  earningsDaysAway = 0,
  price = 0,
  pe = 0,
  marketCap = 0,
  debtEquity = 0,
  pb = 0,
  beta = 1,
  newsFlag = false,
  // Context toggles
  sectorAlignment = false,
  marketSupport = false,
  volatilityClear = false,
  breadthHealthy = false,
} = {}) {
  // Core Setup Score (out of 70)
  let core = 0;
  core += normalize(epsGrowth, 0, 50) * 0.15;
  core += normalize(avgVolume, 500_000, 2_000_000) * 0.12;
  core += normalize(relVolume, 1.0, 3.0) * 0.10;
  core += (technicalFlags ? 100 : 0) * 0.10;
  core += (earningsDaysAway > 5 ? 100 : 0) * 0.10;
  core += normalize(price, 7, 50) * 0.08;
  core += peScore(pe) * 0.08;
  core += normalize(marketCap, 500_000_000, 50_000_000_000) * 0.07;
  core += normalize(0.5 - debtEquity, 0, 0.5) * 0.07; // lower is better
  core += normalize(1.5 - pb, 0, 1.0) * 0.06; // lower is better
  core += betaScore(beta) * 0.05;
  core += (newsFlag ? 100 : 0) * 0.02;
  const coreSetupScore = core * (70 / 100); // scale to 70 pts

  // Context Score (out of 30)
  let contextScore = 0;
  contextScore += sectorAlignment ? 10 : 0;
  contextScore += marketSupport ? 10 : 0;
  contextScore += volatilityClear ? 5 : 0;
  contextScore += breadthHealthy ? 5 : 0;

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