import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────
interface LeverageDataPoint {
  date: string;
  nfciLeverage: number | null;
  marginDebt: number | null;
}

interface LeverageResponse {
  data: LeverageDataPoint[];
  current: {
    nfciLeverage: number | null;
    marginDebt: number | null;
  };
  lastUpdate: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────
let cachedResponse: LeverageResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ─── FRED API data fetcher ───────────────────────────────────────────
// Fetches observations for a FRED series using the official API.
// Series used:
//   NFCILEVERAGE       - Chicago Fed National Financial Conditions Leverage Subindex (Weekly)
//   BOGZ1FL663067003Q  - Security Brokers and Dealers; Receivables Due from Customers (Margin Loans) (Quarterly)
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
  startDate.setDate(startDate.getDate() - days);

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
    if (obs.value && obs.value !== '.' && !isNaN(Number(obs.value))) {
      dates.push(obs.date);
      values.push(Number(obs.value));
    }
  }

  return { dates, values };
}

// ─── Core calculation ────────────────────────────────────────────────
async function fetchMarketLeverage(): Promise<LeverageResponse> {
  const FETCH_DAYS = 5 * 365; // Fetch up to 5 years to have enough quarterly data

  const [nfciData, marginDebtData] = await Promise.all([
    fetchFredSeries('NFCILEVERAGE', FETCH_DAYS),
    fetchFredSeries('BOGZ1FL663067003Q', FETCH_DAYS),
  ]);

  // Combine dates (we will use NFCI weekly dates as the primary timeline, and carry-forward the quarterly margin debt)
  const marginDebtMap = new Map<string, number>();
  for (let i = 0; i < marginDebtData.dates.length; i++) {
    marginDebtMap.set(marginDebtData.dates[i], marginDebtData.values[i]);
  }

  const dataPoints: LeverageDataPoint[] = [];
  let lastMarginDebt: number | null = null;
  
  // Create a sorted list of all unique dates to merge weekly and quarterly effectively
  const allDatesSet = new Set([...nfciData.dates, ...marginDebtData.dates]);
  const allDates = Array.from(allDatesSet).sort();

  const nfciMap = new Map<string, number>();
  for (let i = 0; i < nfciData.dates.length; i++) {
    nfciMap.set(nfciData.dates[i], nfciData.values[i]);
  }

  let lastNfci: number | null = null;

  for (const date of allDates) {
    const currentNfci: number | null = nfciMap.has(date) ? nfciMap.get(date)! : lastNfci;
    if (currentNfci !== null) lastNfci = currentNfci;

    const currentMd: number | null = marginDebtMap.has(date) ? marginDebtMap.get(date)! : null;
    // Removed `lastMarginDebt = currentMd` to prevent carry-forward (staircase)

    // We only push points if we have at least one valid data point
    if (currentNfci !== null || currentMd !== null) {
      dataPoints.push({
        date,
        nfciLeverage: currentNfci !== null ? Number(currentNfci.toFixed(3)) : null,
        marginDebt: currentMd !== null ? Number((currentMd / 1000).toFixed(2)) : null, // Convert millions to billions if needed, margin debt is in Millions of Dollars. So / 1000 = Billions
      });
    }
  }

  let latestNfci = null;
  let latestMarginDebt = null;
  
  for (let i = dataPoints.length - 1; i >= 0; i--) {
    if (latestNfci === null && dataPoints[i].nfciLeverage !== null) {
      latestNfci = dataPoints[i].nfciLeverage;
    }
    if (latestMarginDebt === null && dataPoints[i].marginDebt !== null) {
      latestMarginDebt = dataPoints[i].marginDebt;
    }
    if (latestNfci !== null && latestMarginDebt !== null) {
      break;
    }
  }

  // Extend the margin debt line to the current date so it doesn't abruptly end
  if (dataPoints.length > 0 && latestMarginDebt !== null && dataPoints[dataPoints.length - 1].marginDebt === null) {
    dataPoints[dataPoints.length - 1].marginDebt = latestMarginDebt;
  }

  return {
    data: dataPoints,
    current: {
      nfciLeverage: latestNfci,
      marginDebt: latestMarginDebt,
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

    const result = await fetchMarketLeverage();
    cachedResponse = result;
    lastFetchTime = now;

    return NextResponse.json(result);
  } catch (err) {
    console.error('Market Leverage API error:', err);

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    return NextResponse.json(
      { error: 'Failed to fetch market leverage data', detail: String(err) },
      { status: 500 },
    );
  }
}
