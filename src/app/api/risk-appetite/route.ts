import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────
interface RiskAppetiteDataPoint {
  date: string;
  riskIndex: number;
  zCredit: number;
  zVix: number;
  zSpyIef: number;
  zOilGold: number;
}

interface RiskAppetiteResponse {
  data: RiskAppetiteDataPoint[];
  current: {
    riskIndex: number;
    regime: 'Risk On' | 'Neutral' | 'Risk Off';
    zCredit: number;
    zVix: number;
    zSpyIef: number;
    zOilGold: number;
  };
  lastUpdate: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────
let cachedResponse: RiskAppetiteResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─── Yahoo Finance data fetcher ──────────────────────────────────────
async function fetchYahooDaily(symbol: string, days: number): Promise<{ dates: string[]; closes: number[] }> {
  const now = Math.floor(Date.now() / 1000);
  // Fetch extra days to account for weekends/holidays
  const period1 = now - (days + 60) * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${now}&interval=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned ${response.status} for ${symbol}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);

  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

  const dates: string[] = [];
  const validCloses: number[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close != null && !isNaN(close)) {
      const d = new Date(timestamps[i] * 1000);
      dates.push(d.toISOString().slice(0, 10));
      validCloses.push(close);
    }
  }

  return { dates, closes: validCloses };
}

// ─── Z-Score computation ─────────────────────────────────────────────
function computeZScores(values: number[], period: number): number[] {
  const zScores: number[] = new Array(values.length).fill(0);

  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    zScores[i] = std !== 0 ? (values[i] - mean) / std : 0;
  }

  return zScores;
}

// ─── Core calculation ────────────────────────────────────────────────
async function calculateRiskAppetite(): Promise<RiskAppetiteResponse> {
  const PERIOD = 60; // Z-score lookback period (trading days)
  const FETCH_DAYS = 150; // Extra padding for weekends/holidays

  // Fetch all 6 data series in parallel
  const [vixData, spyData, iefData, hygData, goldData, oilData] = await Promise.all([
    fetchYahooDaily('^VIX', FETCH_DAYS),
    fetchYahooDaily('SPY', FETCH_DAYS),
    fetchYahooDaily('IEF', FETCH_DAYS),
    fetchYahooDaily('HYG', FETCH_DAYS),
    fetchYahooDaily('GC=F', FETCH_DAYS),
    fetchYahooDaily('CL=F', FETCH_DAYS),
  ]);

  // Align all series to a common date set
  // Use SPY dates as the base (most liquid, fewest gaps)
  const baseDates = spyData.dates;
  const dateSet = new Set(baseDates);

  // Build lookup maps
  const makeLookup = (data: { dates: string[]; closes: number[] }): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.closes[i]);
    }
    return map;
  };

  const vixMap = makeLookup(vixData);
  const spyMap = makeLookup(spyData);
  const iefMap = makeLookup(iefData);
  const hygMap = makeLookup(hygData);
  const goldMap = makeLookup(goldData);
  const oilMap = makeLookup(oilData);

  // Filter to dates where ALL series have data
  const commonDates = baseDates.filter(
    (d) => vixMap.has(d) && spyMap.has(d) && iefMap.has(d) && hygMap.has(d) && goldMap.has(d) && oilMap.has(d)
  );

  if (commonDates.length < PERIOD) {
    throw new Error(`Not enough common data points: ${commonDates.length} < ${PERIOD}`);
  }

  // Extract aligned series
  const vixSeries = commonDates.map((d) => vixMap.get(d)!);
  const spySeries = commonDates.map((d) => spyMap.get(d)!);
  const iefSeries = commonDates.map((d) => iefMap.get(d)!);
  const hygSeries = commonDates.map((d) => hygMap.get(d)!);
  const goldSeries = commonDates.map((d) => goldMap.get(d)!);
  const oilSeries = commonDates.map((d) => oilMap.get(d)!);

  // Compute ratios
  const spyIefRatio = spySeries.map((s, i) => (iefSeries[i] !== 0 ? s / iefSeries[i] : 0));
  const oilGoldRatio = oilSeries.map((o, i) => (goldSeries[i] !== 0 ? o / goldSeries[i] : 0));

  // Compute z-scores for each component
  // HYG: positive z-score = tightening spreads = more risk appetite (natural direction)
  const zHyg = computeZScores(hygSeries, PERIOD);
  // VIX: negative z-score → higher VIX = fear
  const zVix = computeZScores(vixSeries, PERIOD).map((z) => -z);
  // SPY/IEF: positive z-score = equities outperforming bonds
  const zSpyIef = computeZScores(spyIefRatio, PERIOD);
  // Oil/Gold: positive z-score = growth assets outperforming safe havens
  const zOilGold = computeZScores(oilGoldRatio, PERIOD);

  // Compute Risk Appetite Index (0-100 scale)
  const dataPoints: RiskAppetiteDataPoint[] = [];

  for (let i = PERIOD - 1; i < commonDates.length; i++) {
    const rawScore = 25 * (zHyg[i] + zVix[i] + zSpyIef[i] + zOilGold[i]);
    const riskIndex = Math.max(0, Math.min(100, rawScore + 50));

    dataPoints.push({
      date: commonDates[i],
      riskIndex: Number(riskIndex.toFixed(1)),
      zCredit: Number(zHyg[i].toFixed(3)),
      zVix: Number(zVix[i].toFixed(3)),
      zSpyIef: Number(zSpyIef[i].toFixed(3)),
      zOilGold: Number(zOilGold[i].toFixed(3)),
    });
  }

  // Current (latest) values
  const latest = dataPoints[dataPoints.length - 1];
  const regime: 'Risk On' | 'Neutral' | 'Risk Off' =
    latest.riskIndex >= 70 ? 'Risk On' : latest.riskIndex <= 30 ? 'Risk Off' : 'Neutral';

  return {
    data: dataPoints,
    current: {
      riskIndex: latest.riskIndex,
      regime,
      zCredit: latest.zCredit,
      zVix: latest.zVix,
      zSpyIef: latest.zSpyIef,
      zOilGold: latest.zOilGold,
    },
    lastUpdate: Date.now(),
  };
}

// ─── GET handler ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    // Return cache if fresh
    if (cachedResponse && now - lastFetchTime < CACHE_DURATION_MS) {
      return NextResponse.json(cachedResponse);
    }

    const result = await calculateRiskAppetite();
    cachedResponse = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err) {
    console.error('Risk Appetite API error:', err);

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    return NextResponse.json(
      { error: 'Failed to compute risk appetite index', detail: String(err) },
      { status: 500 }
    );
  }
}
