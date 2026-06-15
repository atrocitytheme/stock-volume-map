import { Stock, TradeTick } from './marketDataSim';

export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubWSTradeItem {
  p: number;  // Price
  s: string;  // Symbol
  t: number;  // Timestamp (Unix ms)
  v: number;  // Volume (size)
}

export interface FinnhubWSMessage {
  data?: FinnhubWSTradeItem[];
  type: string;
}

// Fetch quote for a single stock from Finnhub API
export async function fetchStockQuote(symbol: string, token: string): Promise<FinnhubQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export interface StockProfile {
  name: string;
  sector: string;
  marketCapB: number;
}

// Memory cache for server-side profile caching
const memoryCache: Record<string, { profile: StockProfile, timestamp: number }> = {};

// Fetch company profile for metadata
export async function fetchStockProfileCached(symbol: string, token: string): Promise<StockProfile | null> {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    const cached = memoryCache[symbol];
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.profile;
    }
  } else {
    const cacheKey = `finnhub_profile_v2_${symbol}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Cache for 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.profile;
        }
      } catch (e) {
        // Ignore cache parse errors
      }
    }
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.marketCapitalization) {
      const profile: StockProfile = {
        name: data.name || symbol,
        sector: data.finnhubIndustry || 'Other',
        marketCapB: data.marketCapitalization / 1000
      };
      
      if (isServer) {
        memoryCache[symbol] = { profile, timestamp: Date.now() };
      } else {
        localStorage.setItem(`finnhub_profile_v2_${symbol}`, JSON.stringify({ profile, timestamp: Date.now() }));
      }
      return profile;
    }
  } catch (err) {
    console.error(`Failed to fetch profile for ${symbol}`, err);
  }
  return null;
}


// Normalize a Finnhub quote response to update our Stock structure
export function normalizeQuote(stock: Stock, quote: FinnhubQuote, marketCapB?: number | null): Stock {
  // Check if we got valid quote numbers (Finnhub returns 0 for invalid symbols or sometimes outside market context)
  if (!quote.c || quote.c === 0) {
    return stock; // Fall back to existing stock data
  }

  const nextPrice = quote.c;
  const nextOpenPrice = quote.o || stock.openPrice;
  const nextHigh = quote.h || Math.max(nextPrice, stock.high);
  const nextLow = quote.l || Math.min(nextPrice, stock.low);
  const nextPriceChange = Number((nextPrice - nextOpenPrice).toFixed(2));
  const nextPriceChangePercent = Number(((nextPriceChange / nextOpenPrice) * 100).toFixed(2));

  // Seed history with standard updates if it's empty, or maintain existing
  const nextHistory = [...stock.history];
  if (nextHistory.length === 0 || nextHistory[nextHistory.length - 1] !== nextPrice) {
    nextHistory.push(nextPrice);
    if (nextHistory.length > 30) {
      nextHistory.shift();
    }
  }

  return {
    ...stock,
    price: nextPrice,
    lastPrice: stock.price,
    openPrice: nextOpenPrice,
    high: nextHigh,
    low: nextLow,
    priceChange: nextPriceChange,
    priceChangePercent: nextPriceChangePercent,
    vwap: stock.vwap === 0 ? nextPrice : stock.vwap, // Baseline if uncalculated
    history: nextHistory,
    marketCap: marketCapB ? marketCapB : stock.marketCap
  };
}

// Build an initial Stock object from live quote and profile
export function buildInitialStock(symbol: string, quote: FinnhubQuote, profile: StockProfile | null): Stock {
  const currentPrice = quote.c || 0;
  const openPrice = quote.o || currentPrice;
  const priceChange = Number((currentPrice - openPrice).toFixed(2));
  const priceChangePercent = openPrice > 0 ? Number(((priceChange / openPrice) * 100).toFixed(2)) : 0;
  
  // Set default fallback values for avgVolume if not available through another API
  const defaultAvgVolume = 5000000;

  return {
    symbol,
    name: profile ? profile.name : symbol,
    sector: profile ? profile.sector : 'Other',
    industry: 'Unknown', // Finnhub profile2 gives finnhubIndustry which maps to our sector conceptually
    price: currentPrice,
    openPrice: openPrice,
    high: quote.h || currentPrice,
    low: quote.l || currentPrice,
    lastPrice: currentPrice,
    priceChange: priceChange,
    priceChangePercent: priceChangePercent,
    volume: 0, // Will be incremented by WS trades
    avgVolume: defaultAvgVolume,
    marketCap: profile ? profile.marketCapB : 0,
    relativeVolume: 0,
    lastUpdateDirection: priceChange >= 0 ? 'up' : 'down',
    vwap: currentPrice,
    history: [currentPrice] // Seed with current price
  };
}

// Staggered batch loading function to avoid hitting the 60 calls/minute API limit
export async function fetchInitialStocksStaggered(
  symbols: string[],
  token: string,
  onProgress: (index: number, total: number, stock: Stock | null) => void,
  delayMs: number = 1500
): Promise<Stock[]> {
  const results: Stock[] = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    try {
      const quote = await fetchStockQuote(symbol, token);
      const profile = await fetchStockProfileCached(symbol, token);
      
      if (quote && quote.c) {
        const stock = buildInitialStock(symbol, quote, profile);
        results.push(stock);
        onProgress(i + 1, symbols.length, stock);
      } else {
        onProgress(i + 1, symbols.length, null);
      }
    } catch (err) {
      console.error(`Failed to fetch quote for ${symbol} via Finnhub:`, err);
      onProgress(i + 1, symbols.length, null);
    }

    // Wait configured delay between fetches to respect rate limits. 
    if (i < symbols.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Normalize a WebSocket trade tick to our standard TradeTick structure
export function normalizeWSTrade(trade: FinnhubWSTradeItem, previousPrice: number, avgVolume: number): TradeTick {
  const isBlockTrade = trade.v >= (avgVolume * 0.0001); // Identify large block trades relative to normal volume
  const side = trade.p >= previousPrice ? 'buy' : 'sell';

  return {
    id: Math.random().toString(36).substring(2, 9),
    symbol: trade.s,
    price: trade.p,
    size: Math.round(trade.v),
    timestamp: new Date(trade.t),
    side,
    isBlockTrade
  };
}
