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

// Normalize a Finnhub quote response to update our Stock structure
export function normalizeQuote(stock: Stock, quote: FinnhubQuote): Stock {
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
    history: nextHistory
  };
}

// Staggered batch loading function to avoid hitting the 60 calls/minute API limit
export async function fetchAllQuotesStaggered(
  symbols: string[],
  token: string,
  onProgress: (index: number, total: number, symbol: string, quote: FinnhubQuote) => void
): Promise<Record<string, FinnhubQuote>> {
  const results: Record<string, FinnhubQuote> = {};
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    try {
      const quote = await fetchStockQuote(symbol, token);
      results[symbol] = quote;
      onProgress(i + 1, symbols.length, symbol, quote);
    } catch (err) {
      console.error(`Failed to fetch quote for ${symbol} via Finnhub:`, err);
    }

    // Wait 1.2 seconds between fetches to respect 60 calls/min rate limits
    if (i < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
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
