import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

function getMomentumScore(price: number, sma: number) {
  const pct = ((price - sma) / sma) * 100;
  if (pct >= 5) return 20;
  if (pct > 0) return 10 + Math.min(10, pct * 2);
  return Math.max(0, 10 + pct * 2);
}

function getYieldScore(val: number) {
  if (val >= 4.5) return 20;
  if (val >= 3.0) return 8 + ((val - 3.0) / 1.5) * 12;
  return Math.max(0, (val / 3.0) * 8);
}

function getVolatilityScore(val: number) {
  if (val < 15) return 20;
  if (val <= 25) return 8 + ((25 - val) / 10) * 12;
  if (val <= 35) return 2 + ((35 - val) / 10) * 6;
  return Math.max(0, 2 - ((val - 35) / 10) * 2);
}

function getCreditScore(z: number) {
  if (z >= 1.5) return 20;
  if (z >= -1.5) return 4 + ((z - -1.5) / 3.0) * 16;
  return Math.max(0, 4 + ((z - -1.5) / 1.5) * 4);
}

function getRecommendation(score: number) {
  if (score >= 75) return 'STRONG BUY';
  if (score >= 60) return 'BUY';
  if (score >= 45) return 'HOLD';
  if (score >= 30) return 'REDUCE';
  return 'SELL';
}

function calculateMean(data: number[]) {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function calculateStdDev(data: number[], mean: number) {
  const sqDiffs = data.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(sqDiffs));
}

let cache: any = null;
let lastUpdate = 0;

export async function GET() {
  const now = Date.now();
  if (cache && now - lastUpdate < 5 * 60 * 1000) {
    return NextResponse.json(cache);
  }

  try {
    const symbols = ['IAK', '^TNX', '^VIX', 'HYG', 'SPY'];
    const fetched = await Promise.all(symbols.map(s => fetchYahooDaily(s, 200)));
    
    const dateMap: Record<string, any> = {};
    symbols.forEach((sym, idx) => {
      const { dates, closes } = fetched[idx];
      dates.forEach((d, i) => {
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d][sym] = closes[i];
      });
    });

    const sortedDates = Object.keys(dateMap).sort();
    const alignedData = sortedDates
      .map(date => ({ date, ...dateMap[date] }))
      .filter(d => d.IAK != null && d['^TNX'] != null && d['^VIX'] != null && d.HYG != null && d.SPY != null);

    const resultData = [];

    for (let i = 60; i < alignedData.length; i++) {
      const current = alignedData[i];
      
      const iakWindow = alignedData.slice(i - 49, i + 1).map(d => d.IAK);
      const iakSma = calculateMean(iakWindow);
      const iakMomentum = getMomentumScore(current.IAK, iakSma);

      const spyWindow = alignedData.slice(i - 49, i + 1).map(d => d.SPY);
      const spySma = calculateMean(spyWindow);
      const marketTrend = getMomentumScore(current.SPY, spySma);

      const hygWindow = alignedData.slice(i - 59, i + 1).map(d => d.HYG);
      const hygMean = calculateMean(hygWindow);
      const hygStd = calculateStdDev(hygWindow, hygMean);
      const hygZ = hygStd > 0 ? (current.HYG - hygMean) / hygStd : 0;
      const creditHealth = getCreditScore(hygZ);

      const yieldEnv = getYieldScore(current['^TNX']);
      const volatility = getVolatilityScore(current['^VIX']);

      const totalScore = iakMomentum + yieldEnv + volatility + creditHealth + marketTrend;
      
      resultData.push({
        date: current.date,
        score: Math.round(totalScore * 10) / 10,
        iakMomentum: Math.round(iakMomentum * 10) / 10,
        yieldEnv: Math.round(yieldEnv * 10) / 10,
        volatility: Math.round(volatility * 10) / 10,
        creditHealth: Math.round(creditHealth * 10) / 10,
        marketTrend: Math.round(marketTrend * 10) / 10,
        iakPrice: Math.round(current.IAK * 100) / 100
      });
    }

    if (resultData.length < 2) {
      throw new Error('Not enough data points calculated');
    }

    const latest = resultData[resultData.length - 1];
    const prev = resultData[resultData.length - 2];
    const iakChange = ((latest.iakPrice - prev.iakPrice) / prev.iakPrice) * 100;

    cache = {
      data: resultData,
      current: {
        score: latest.score,
        recommendation: getRecommendation(latest.score),
        iakPrice: latest.iakPrice,
        iakChange: Math.round(iakChange * 100) / 100,
        iakMomentum: latest.iakMomentum,
        yieldEnv: latest.yieldEnv,
        volatility: latest.volatility,
        creditHealth: latest.creditHealth,
        marketTrend: latest.marketTrend
      },
      lastUpdate: now
    };
    lastUpdate = now;

    return NextResponse.json(cache);
  } catch (error) {
    if (cache) {
      return NextResponse.json(cache);
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
