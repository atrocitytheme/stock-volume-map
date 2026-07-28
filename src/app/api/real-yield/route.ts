import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────
interface RealYieldDataPoint {
  date: string;
  usRealYield: number;
  caRealYield: number;
  usNominal: number;
  caNominal: number;
  usBreakeven: number;
  caBreakeven: number;
}

interface RealYieldResponse {
  data: RealYieldDataPoint[];
  current: {
    usRealYield: number;
    caRealYield: number;
    usNominal: number;
    caNominal: number;
    usBreakeven: number;
    caBreakeven: number;
    spread: number; // US real yield - CA real yield
  };
  lastUpdate: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────
let cachedResponse: RealYieldResponse | null = null;
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

// ─── Core calculation ────────────────────────────────────────────────
async function calculateRealYield(): Promise<RealYieldResponse> {
  const FETCH_DAYS = 200; // Extra padding for weekends/holidays + warmup

  // Fetch US 10Y nominal yield and gold for breakeven estimation
  const [tnxData, goldData] = await Promise.all([
    fetchYahooDaily('^TNX', FETCH_DAYS),
    fetchYahooDaily('GC=F', FETCH_DAYS),
  ]);

  // Build lookup maps
  const makeLookup = (data: { dates: string[]; closes: number[] }): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.closes[i]);
    }
    return map;
  };

  const tnxMap = makeLookup(tnxData);
  const goldMap = makeLookup(goldData);

  // Align to common dates (use TNX as base)
  const commonDates = tnxData.dates.filter(d => goldMap.has(d));

  if (commonDates.length < 30) {
    throw new Error(`Not enough common data points: ${commonDates.length} < 30`);
  }

  const goldSeries = commonDates.map(d => goldMap.get(d)!);

  // ─── Build daily real yield series ────────────────────────────────
  //
  // US Real Yield ≈ US 10Y Nominal (^TNX) − Estimated Breakeven Inflation
  //
  // Breakeven estimation methodology:
  // - Base: 2.35% (recent 10Y US breakeven average)
  // - Dynamic adjustment via 60-day gold price momentum
  //   Gold is a widely-used inflation expectations proxy;
  //   rising gold → rising inflation expectations → higher breakeven
  //
  // Canadian approximation:
  // - Canada 10Y nominal ≈ US 10Y + spread (~-0.35%)
  // - Canada breakeven ≈ US breakeven - 0.15% (lower CAN CPI target)
  // ──────────────────────────────────────────────────────────────────

  const BASE_US_BREAKEVEN = 2.35;
  const CA_NOMINAL_SPREAD = -0.35;  // Canada 10Y typically ~35bp below US
  const CA_BREAKEVEN_OFFSET = -0.15; // Canadian inflation expectations ~15bp lower
  const GOLD_LOOKBACK = 60;         // 60-day gold momentum window
  const GOLD_SENSITIVITY = 0.015;   // Breakeven adjustment per 1% gold move

  const dataPoints: RealYieldDataPoint[] = [];

  for (let i = 0; i < commonDates.length; i++) {
    const usNominal = tnxMap.get(commonDates[i])!;

    // Dynamic breakeven estimation
    let usBreakeven = BASE_US_BREAKEVEN;
    if (i >= GOLD_LOOKBACK) {
      const goldPctChange = ((goldSeries[i] - goldSeries[i - GOLD_LOOKBACK]) / goldSeries[i - GOLD_LOOKBACK]) * 100;
      // Neutral assumption: gold gains ~5% annually → ~2.5% over 60 trading days
      // Deviations from this shift breakeven proportionally
      const goldExcessReturn = goldPctChange - 2.5;
      usBreakeven = BASE_US_BREAKEVEN + goldExcessReturn * GOLD_SENSITIVITY;
      // Clamp to historically reasonable bounds [1.2%, 3.8%]
      usBreakeven = Math.max(1.2, Math.min(3.8, usBreakeven));
    }

    const usRealYield = usNominal - usBreakeven;

    // Canadian approximation
    const caNominal = usNominal + CA_NOMINAL_SPREAD;
    const caBreakeven = usBreakeven + CA_BREAKEVEN_OFFSET;
    const caRealYield = caNominal - caBreakeven;

    dataPoints.push({
      date: commonDates[i],
      usRealYield: Number(usRealYield.toFixed(3)),
      caRealYield: Number(caRealYield.toFixed(3)),
      usNominal: Number(usNominal.toFixed(3)),
      caNominal: Number(caNominal.toFixed(3)),
      usBreakeven: Number(usBreakeven.toFixed(3)),
      caBreakeven: Number(caBreakeven.toFixed(3)),
    });
  }

  const latest = dataPoints[dataPoints.length - 1];

  return {
    data: dataPoints,
    current: {
      usRealYield: latest.usRealYield,
      caRealYield: latest.caRealYield,
      usNominal: latest.usNominal,
      caNominal: latest.caNominal,
      usBreakeven: latest.usBreakeven,
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

    // Return cache if fresh
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
      { status: 500 }
    );
  }
}
