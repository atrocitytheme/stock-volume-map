import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────
interface RealYieldDataPoint {
  date: string;
  usRealYield: number;
  caRealYield: number;
  us2YRealYield: number;
  usNominal: number;
  us2YNominal: number;
  caNominal: number;
  usBreakeven: number;
  us2YBreakeven: number;
  caBreakeven: number;
}

interface RealYieldResponse {
  data: RealYieldDataPoint[];
  current: {
    usRealYield: number;
    caRealYield: number;
    us2YRealYield: number;
    usNominal: number;
    us2YNominal: number;
    caNominal: number;
    usBreakeven: number;
    us2YBreakeven: number;
    caBreakeven: number;
    spread: number; // US real yield - CA real yield
  };
  lastUpdate: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────
let cachedResponse: RealYieldResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─── FRED API data fetcher ───────────────────────────────────────────
// Fetches daily observations for a FRED series using the official API.
// Series used:
//   DGS10  – 10-Year Treasury Constant Maturity Rate
//   DGS2   – 2-Year Treasury Constant Maturity Rate
//   T10YIE – 10-Year Breakeven Inflation Rate (TIPS-implied)
//   T2YIE  – 2-Year Breakeven Inflation Rate (TIPS-implied)
async function fetchFredSeries(
  seriesId: string,
  days: number,
): Promise<{ dates: string[]; values: number[] }> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY environment variable is not set');
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days + 60)); // extra padding for weekends/holidays

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('observation_start', fmt(startDate));
  url.searchParams.set('observation_end', fmt(endDate));
  url.searchParams.set('sort_order', 'asc');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'StockReturnCalculator/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`FRED API returned ${response.status} for ${seriesId}`);
  }

  const json = await response.json();
  const observations: Array<{ date: string; value: string }> = json.observations || [];

  const dates: string[] = [];
  const values: number[] = [];

  for (const obs of observations) {
    // FRED uses '.' for missing/unavailable data points
    if (obs.value && obs.value !== '.' && !isNaN(Number(obs.value))) {
      dates.push(obs.date);
      values.push(Number(obs.value));
    }
  }

  return { dates, values };
}

// ─── Core calculation ────────────────────────────────────────────────
async function calculateRealYield(): Promise<RealYieldResponse> {
  const FETCH_DAYS = 200; // Extra padding for weekends/holidays

  // Fetch all four series from FRED in parallel:
  //   DGS10  – US 10Y nominal yield
  //   DGS2   – US 2Y nominal yield
  //   T10YIE – US 10Y TIPS-implied breakeven inflation
  //   T5YIE  – US 5Y TIPS-implied breakeven inflation (used to estimate 2Y)
  const [us10YData, us2YData, us10YBEData, us5YBEData] = await Promise.all([
    fetchFredSeries('DGS10', FETCH_DAYS),
    fetchFredSeries('DGS2', FETCH_DAYS),
    fetchFredSeries('T10YIE', FETCH_DAYS),
    fetchFredSeries('T5YIE', FETCH_DAYS),
  ]);

  // Build lookup maps for each series
  const makeLookup = (data: { dates: string[]; values: number[] }): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.values[i]);
    }
    return map;
  };

  const us10YMap = makeLookup(us10YData);
  const us2YMap = makeLookup(us2YData);
  const us10YBEMap = makeLookup(us10YBEData);
  const us5YBEMap = makeLookup(us5YBEData);

  // Align to common dates where all four series have data
  const commonDates = us10YData.dates.filter(
    (d) => us2YMap.has(d) && us10YBEMap.has(d) && us5YBEMap.has(d),
  );

  if (commonDates.length < 10) {
    throw new Error(`Not enough common data points: ${commonDates.length} < 10`);
  }

  // ─── Build daily real yield series ────────────────────────────────
  //
  // US 10Y Real Yield = DGS10 − T10YIE (actual TIPS-implied breakeven)
  // US 2Y  Real Yield = DGS2  − Estimated 2Y Breakeven (T5YIE - 0.05%)
  //
  // Canadian approximation:
  // - Canada 10Y nominal ≈ US 10Y + spread (~-0.35%)
  // - Canada breakeven  ≈ US 10Y breakeven − 0.15% (lower CAN CPI target)
  // ──────────────────────────────────────────────────────────────────

  const CA_NOMINAL_SPREAD = -0.35;  // Canada 10Y typically ~35bp below US
  const CA_BREAKEVEN_OFFSET = -0.15; // Canadian inflation expectations ~15bp lower

  const dataPoints: RealYieldDataPoint[] = [];

  for (const date of commonDates) {
    const usNominal = us10YMap.get(date)!;
    const usBreakeven = us10YBEMap.get(date)!;
    const usRealYield = usNominal - usBreakeven;

    const us2YNominal = us2YMap.get(date)!;
    const us5YBreakeven = us5YBEMap.get(date)!;
    const us2YBreakeven = us5YBreakeven - 0.05; // 2Y breakeven tends to be ~5bp below 5Y
    const us2YRealYield = us2YNominal - us2YBreakeven;

    // Canadian approximation
    const caNominal = usNominal + CA_NOMINAL_SPREAD;
    const caBreakeven = usBreakeven + CA_BREAKEVEN_OFFSET;
    const caRealYield = caNominal - caBreakeven;

    dataPoints.push({
      date,
      usRealYield: Number(usRealYield.toFixed(3)),
      caRealYield: Number(caRealYield.toFixed(3)),
      us2YRealYield: Number(us2YRealYield.toFixed(3)),
      usNominal: Number(usNominal.toFixed(3)),
      us2YNominal: Number(us2YNominal.toFixed(3)),
      caNominal: Number(caNominal.toFixed(3)),
      usBreakeven: Number(usBreakeven.toFixed(3)),
      us2YBreakeven: Number(us2YBreakeven.toFixed(3)),
      caBreakeven: Number(caBreakeven.toFixed(3)),
    });
  }

  const latest = dataPoints[dataPoints.length - 1];

  return {
    data: dataPoints,
    current: {
      usRealYield: latest.usRealYield,
      caRealYield: latest.caRealYield,
      us2YRealYield: latest.us2YRealYield,
      usNominal: latest.usNominal,
      us2YNominal: latest.us2YNominal,
      caNominal: latest.caNominal,
      usBreakeven: latest.usBreakeven,
      us2YBreakeven: latest.us2YBreakeven,
      caBreakeven: latest.caBreakeven,
      spread: Number((latest.usRealYield - latest.caRealYield).toFixed(3)),
    },
    lastUpdate: Date.now(),
  };
}

// ─── GET handler ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    // Return cache if fresh (5-minute TTL)
    if (cachedResponse && now - lastFetchTime < CACHE_DURATION_MS) {
      return NextResponse.json(cachedResponse);
    }

    const result = await calculateRealYield();
    cachedResponse = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err) {
    console.error('Real Yield API error:', err);

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    return NextResponse.json(
      { error: 'Failed to compute real yield data', detail: String(err) },
      { status: 500 },
    );
  }
}
