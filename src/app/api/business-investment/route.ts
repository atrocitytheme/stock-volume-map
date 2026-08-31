import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────
interface BusinessInvestmentDataPoint {
  date: string;          // YYYY-MM-DD (quarter start)
  caGFCF: number;        // Canada GFCF index (2015=100)
  usGFCF: number;        // US GFCF index (2015=100)
  caEmployment: number;  // Canada total employed (thousands)
  caGFCFPerWorker: number; // Canada GFCF index / employment (normalized)
  gap: number;           // US GFCF - CA GFCF (index point gap)
}

interface BusinessInvestmentResponse {
  data: BusinessInvestmentDataPoint[];
  current: {
    caGFCF: number;
    usGFCF: number;
    caGFCFPerWorker: number;
    gap: number;
    caGrowthYoY: number;   // Canada GFCF YoY % change
    usGrowthYoY: number;   // US GFCF YoY % change
  };
  lastUpdate: number;
}

// ─── Cache ───────────────────────────────────────────────────────────
let cachedResponse: BusinessInvestmentResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours – quarterly data

// ─── FRED fetcher ────────────────────────────────────────────────────
async function fetchFredSeries(
  seriesId: string,
  observationStart: string,
): Promise<{ dates: string[]; values: number[] }> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY environment variable is not set');
  }

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('observation_start', observationStart);
  url.searchParams.set('sort_order', 'asc');

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'MacroIndexTracker/1.0' },
  });

  if (!response.ok) {
    throw new Error(`FRED API returned ${response.status} for ${seriesId}`);
  }

  const json = await response.json();
  const observations: Array<{ date: string; value: string }> =
    json.observations || [];

  const dates: string[] = [];
  const values: number[] = [];

  for (const obs of observations) {
    if (obs.value && obs.value !== '.' && !isNaN(Number(obs.value))) {
      dates.push(obs.date);
      values.push(Number(obs.value));
    }
  }

  return { dates, values };
}

// ─── Core calculation ────────────────────────────────────────────────
async function calculateBusinessInvestment(): Promise<BusinessInvestmentResponse> {
  // Fetch ~25 years of data for flexibility (client filters via timeframe)
  const startDate = '2000-01-01';

  const [caGFCFData, usGFCFData, caEmpData] = await Promise.all([
    fetchFredSeries('NAEXKP04CAQ189S', startDate), // Canada GFCF index
    fetchFredSeries('NAEXKP04USQ189S', startDate), // US GFCF index
    fetchFredSeries('LFEMTTTTCAQ647S', startDate), // Canada total employed
  ]);

  // Build lookup maps
  const makeLookup = (
    data: { dates: string[]; values: number[] },
  ): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.values[i]);
    }
    return map;
  };

  const caGFCFMap = makeLookup(caGFCFData);
  const usGFCFMap = makeLookup(usGFCFData);
  const caEmpMap = makeLookup(caEmpData);

  // Find common quarterly dates
  const commonDates = caGFCFData.dates.filter(
    (d) => usGFCFMap.has(d) && caEmpMap.has(d),
  );

  if (commonDates.length < 4) {
    throw new Error(
      `Not enough common quarterly data points: ${commonDates.length}`,
    );
  }

  // Normalize per-worker: divide GFCF index by employment, then rescale
  // so the first available quarter = 100 for readability
  const rawPerWorker = commonDates.map((d) => {
    const gfcf = caGFCFMap.get(d)!;
    const emp = caEmpMap.get(d)!;
    return gfcf / emp;
  });
  const basePerWorker = rawPerWorker[0];

  const dataPoints: BusinessInvestmentDataPoint[] = commonDates.map(
    (date, i) => {
      const caGFCF = caGFCFMap.get(date)!;
      const usGFCF = usGFCFMap.get(date)!;
      const caEmployment = caEmpMap.get(date)!;
      const perWorkerNormalized = (rawPerWorker[i] / basePerWorker) * 100;

      return {
        date,
        caGFCF: Number(caGFCF.toFixed(2)),
        usGFCF: Number(usGFCF.toFixed(2)),
        caEmployment: Number(caEmployment.toFixed(0)),
        caGFCFPerWorker: Number(perWorkerNormalized.toFixed(2)),
        gap: Number((usGFCF - caGFCF).toFixed(2)),
      };
    },
  );

  // Compute YoY growth for the latest quarter
  const latest = dataPoints[dataPoints.length - 1];
  const fourQuartersAgo =
    dataPoints.length > 4
      ? dataPoints[dataPoints.length - 5]
      : dataPoints[0];

  const caGrowthYoY =
    ((latest.caGFCF - fourQuartersAgo.caGFCF) / fourQuartersAgo.caGFCF) * 100;
  const usGrowthYoY =
    ((latest.usGFCF - fourQuartersAgo.usGFCF) / fourQuartersAgo.usGFCF) * 100;

  return {
    data: dataPoints,
    current: {
      caGFCF: latest.caGFCF,
      usGFCF: latest.usGFCF,
      caGFCFPerWorker: latest.caGFCFPerWorker,
      gap: latest.gap,
      caGrowthYoY: Number(caGrowthYoY.toFixed(2)),
      usGrowthYoY: Number(usGrowthYoY.toFixed(2)),
    },
    lastUpdate: Date.now(),
  };
}

// ─── GET handler ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    if (cachedResponse && now - lastFetchTime < CACHE_DURATION_MS) {
      return NextResponse.json(cachedResponse);
    }

    const result = await calculateBusinessInvestment();
    cachedResponse = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err) {
    console.error('Business Investment API error:', err);

    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch business investment data',
        detail: String(err),
      },
      { status: 500 },
    );
  }
}
