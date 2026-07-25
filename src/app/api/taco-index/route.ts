import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────
interface TacoDataPoint {
  date: string;
  peakStress: number;   // max(|z_i|) across all components
  zEquity: number;      // -z(S&P 500): positive = drawdown stress
  zRates: number;       // z(10Y yield): positive = rate stress
  zEnergy: number;      // z(Brent crude): positive = energy spike
  zVolatility: number;  // z(VIX): positive = fear spike
}

interface TacoResponse {
  data: TacoDataPoint[];
  current: {
    peakStress: number;
    regime: 'NO PIVOT' | 'PIVOT WATCH' | 'PIVOT LIKELY' | 'PIVOT IMMINENT';
    zEquity: number;
    zRates: number;
    zEnergy: number;
    zVolatility: number;
    dominantStressor: string;
  };
  lastUpdate: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────
let cachedResponse: TacoResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─── Yahoo Finance data fetcher ──────────────────────────────────────
async function fetchYahooDaily(symbol: string, days: number): Promise<{ dates: string[]; closes: number[] }> {
  const now = Math.floor(Date.now() / 1000);
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
async function calculateTacoIndex(): Promise<TacoResponse> {
  const PERIOD = 60; // Z-score lookback period (trading days)
  const FETCH_DAYS = 150;

  // Fetch all 4 data series in parallel
  const [spxData, tnxData, brentData, vixData] = await Promise.all([
    fetchYahooDaily('^GSPC', FETCH_DAYS),   // S&P 500
    fetchYahooDaily('^TNX', FETCH_DAYS),    // 10-Year Treasury Yield
    fetchYahooDaily('BZ=F', FETCH_DAYS),    // Brent Crude Oil
    fetchYahooDaily('^VIX', FETCH_DAYS),    // VIX
  ]);

  // Align all series to common dates (use S&P 500 as base)
  const baseDates = spxData.dates;

  const makeLookup = (data: { dates: string[]; closes: number[] }): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.closes[i]);
    }
    return map;
  };

  const spxMap = makeLookup(spxData);
  const tnxMap = makeLookup(tnxData);
  const brentMap = makeLookup(brentData);
  const vixMap = makeLookup(vixData);

  // Filter to dates where ALL series have data
  const commonDates = baseDates.filter(
    (d) => spxMap.has(d) && tnxMap.has(d) && brentMap.has(d) && vixMap.has(d)
  );

  if (commonDates.length < PERIOD) {
    throw new Error(`Not enough common data points: ${commonDates.length} < ${PERIOD}`);
  }

  // Extract aligned series
  const spxSeries = commonDates.map((d) => spxMap.get(d)!);
  const tnxSeries = commonDates.map((d) => tnxMap.get(d)!);
  const brentSeries = commonDates.map((d) => brentMap.get(d)!);
  const vixSeries = commonDates.map((d) => vixMap.get(d)!);

  // Compute z-scores for each component
  // S&P 500: INVERT — falling S&P = positive stress
  const zEquity = computeZScores(spxSeries, PERIOD).map((z) => -z);
  // 10Y Yield: NATURAL — rising yields = stress
  const zRates = computeZScores(tnxSeries, PERIOD);
  // Brent Crude: NATURAL — rising oil = inflationary stress
  const zEnergy = computeZScores(brentSeries, PERIOD);
  // VIX: NATURAL — rising VIX = fear/stress
  const zVolatility = computeZScores(vixSeries, PERIOD);

  // Compute TACO data points
  const dataPoints: TacoDataPoint[] = [];

  for (let i = PERIOD - 1; i < commonDates.length; i++) {
    // Peak stress = max absolute z-score across all components
    const absZ = [
      Math.abs(zEquity[i]),
      Math.abs(zRates[i]),
      Math.abs(zEnergy[i]),
      Math.abs(zVolatility[i]),
    ];
    const peakStress = Math.max(...absZ);

    dataPoints.push({
      date: commonDates[i],
      peakStress: Number(peakStress.toFixed(3)),
      zEquity: Number(zEquity[i].toFixed(3)),
      zRates: Number(zRates[i].toFixed(3)),
      zEnergy: Number(zEnergy[i].toFixed(3)),
      zVolatility: Number(zVolatility[i].toFixed(3)),
    });
  }

  // Current (latest) values
  const latest = dataPoints[dataPoints.length - 1];

  // Determine regime from Signum model thresholds
  const regime: TacoResponse['current']['regime'] =
    latest.peakStress >= 3.4
      ? 'PIVOT IMMINENT'
      : latest.peakStress >= 2.9
        ? 'PIVOT LIKELY'
        : latest.peakStress >= 2.3
          ? 'PIVOT WATCH'
          : 'NO PIVOT';

  // Identify the dominant stressor
  const stressorMap: Record<string, number> = {
    'S&P 500': Math.abs(latest.zEquity),
    '10Y Yield': Math.abs(latest.zRates),
    'Brent Crude': Math.abs(latest.zEnergy),
    'VIX': Math.abs(latest.zVolatility),
  };
  const dominantStressor = Object.entries(stressorMap).sort((a, b) => b[1] - a[1])[0][0];

  return {
    data: dataPoints,
    current: {
      peakStress: latest.peakStress,
      regime,
      zEquity: latest.zEquity,
      zRates: latest.zRates,
      zEnergy: latest.zEnergy,
      zVolatility: latest.zVolatility,
      dominantStressor,
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

    const result = await calculateTacoIndex();
    cachedResponse = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err) {
    console.error('TACO Index API error:', err);

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    return NextResponse.json(
      { error: 'Failed to compute TACO index', detail: String(err) },
      { status: 500 }
    );
  }
}
