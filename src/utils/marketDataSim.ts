export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  openPrice: number;
  high: number;
  low: number;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  avgVolume: number; // 30-day average
  marketCap: number; // in billions
  relativeVolume: number; // RVOL = Current Volume / (Avg Volume * percentage of day passed)
  lastUpdateDirection: 'up' | 'down' | 'neutral';
  vwap: number;
  history: number[]; // Intraday price history for chart
}

export interface Exchange {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  mapX: number; // SVG coordinates
  mapY: number; // SVG coordinates
  utcOffset: number; // Hours offset from UTC
  openHour: number; // Local time (e.g., 9)
  openMinute: number; // Local time (e.g., 30)
  closeHour: number; // Local time (e.g., 16)
  closeMinute: number; // Local time (e.g., 0)
  volume: number; // in billions
  baseVolume: number;
  topStockSymbol: string;
}

export interface TradeTick {
  id: string;
  symbol: string;
  price: number;
  size: number;
  timestamp: Date;
  side: 'buy' | 'sell';
  isBlockTrade: boolean;
}

export interface OrderBookItem {
  price: number;
  size: number;
  cumulativeSize: number;
}

export interface OrderBook {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
}

export const SECTORS = [
  'Technology',
  'Financials',
  'Healthcare',
  'Consumer Cyclical',
  'Communication Services',
  'Energy',
  'Industrials'
];

export const INITIAL_STOCKS: Stock[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', price: 182.30, openPrice: 181.50, high: 183.10, low: 180.88, lastPrice: 182.30, priceChange: 0.80, priceChangePercent: 0.44, volume: 48500000, avgVolume: 55000000, marketCap: 2850, relativeVolume: 0.88, lastUpdateDirection: 'neutral', vwap: 182.10, history: [] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', industry: 'Software—Infrastructure', price: 415.50, openPrice: 412.00, high: 418.40, low: 411.50, lastPrice: 415.50, priceChange: 3.50, priceChangePercent: 0.85, volume: 21200000, avgVolume: 24000000, marketCap: 3090, relativeVolume: 0.88, lastUpdateDirection: 'neutral', vwap: 415.10, history: [] },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors', price: 875.12, openPrice: 850.00, high: 885.00, low: 840.10, lastPrice: 875.12, priceChange: 25.12, priceChangePercent: 2.96, volume: 38200000, avgVolume: 35000000, marketCap: 2190, relativeVolume: 1.09, lastUpdateDirection: 'neutral', vwap: 868.40, history: [] },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', industry: 'Semiconductors', price: 1395.20, openPrice: 1410.00, high: 1415.00, low: 1388.00, lastPrice: 1395.20, priceChange: -14.80, priceChangePercent: -1.05, volume: 1800000, avgVolume: 2200000, marketCap: 648, relativeVolume: 0.82, lastUpdateDirection: 'neutral', vwap: 1398.50, history: [] },
  { symbol: 'CRM', name: 'Salesforce, Inc.', sector: 'Technology', industry: 'Software—Application', price: 294.60, openPrice: 295.00, high: 298.20, low: 292.80, lastPrice: 294.60, priceChange: -0.40, priceChangePercent: -0.14, volume: 4200000, avgVolume: 5100000, marketCap: 285, relativeVolume: 0.82, lastUpdateDirection: 'neutral', vwap: 294.90, history: [] },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors', price: 178.40, openPrice: 182.10, high: 183.00, low: 175.20, lastPrice: 178.40, priceChange: -3.70, priceChangePercent: -2.03, volume: 54100000, avgVolume: 60000000, marketCap: 288, relativeVolume: 0.90, lastUpdateDirection: 'neutral', vwap: 178.90, history: [] },

  // Financials
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', industry: 'Banks—Diversified', price: 195.40, openPrice: 194.20, high: 196.50, low: 193.80, lastPrice: 195.40, priceChange: 1.20, priceChangePercent: 0.62, volume: 8200000, avgVolume: 9500000, marketCap: 562, relativeVolume: 0.86, lastUpdateDirection: 'neutral', vwap: 195.10, history: [] },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financials', industry: 'Banks—Diversified', price: 37.15, openPrice: 37.40, high: 37.55, low: 36.90, lastPrice: 37.15, priceChange: -0.25, priceChangePercent: -0.67, volume: 32000000, avgVolume: 38000000, marketCap: 292, relativeVolume: 0.84, lastUpdateDirection: 'neutral', vwap: 37.22, history: [] },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials', industry: 'Capital Markets', price: 92.80, openPrice: 91.90, high: 93.40, low: 91.50, lastPrice: 92.80, priceChange: 0.90, priceChangePercent: 0.98, volume: 6800000, avgVolume: 7800000, marketCap: 152, relativeVolume: 0.87, lastUpdateDirection: 'neutral', vwap: 92.60, history: [] },
  { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', industry: 'Capital Markets', price: 412.30, openPrice: 409.80, high: 414.50, low: 408.20, lastPrice: 412.30, priceChange: 2.50, priceChangePercent: 0.61, volume: 2400000, avgVolume: 2800000, marketCap: 138, relativeVolume: 0.86, lastUpdateDirection: 'neutral', vwap: 412.00, history: [] },

  // Healthcare
  { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', industry: 'Drug Manufacturers—General', price: 762.10, openPrice: 752.00, high: 768.40, low: 748.50, lastPrice: 762.10, priceChange: 10.10, priceChangePercent: 1.34, volume: 3200000, avgVolume: 2900000, marketCap: 724, relativeVolume: 1.10, lastUpdateDirection: 'neutral', vwap: 759.80, history: [] },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', industry: 'Healthcare Plans', price: 489.50, openPrice: 492.00, high: 494.20, low: 486.10, lastPrice: 489.50, priceChange: -2.50, priceChangePercent: -0.51, volume: 3400000, avgVolume: 3600000, marketCap: 452, relativeVolume: 0.94, lastUpdateDirection: 'neutral', vwap: 490.20, history: [] },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers—General', price: 158.40, openPrice: 159.20, high: 159.80, low: 157.90, lastPrice: 158.40, priceChange: -0.80, priceChangePercent: -0.50, volume: 7200000, avgVolume: 8500000, marketCap: 381, relativeVolume: 0.85, lastUpdateDirection: 'neutral', vwap: 158.60, history: [] },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', sector: 'Healthcare', industry: 'Drug Manufacturers—General', price: 124.60, openPrice: 123.80, high: 125.40, low: 123.20, lastPrice: 124.60, priceChange: 0.80, priceChangePercent: 0.65, volume: 6100000, avgVolume: 7200000, marketCap: 316, relativeVolume: 0.85, lastUpdateDirection: 'neutral', vwap: 124.40, history: [] },

  // Consumer Cyclical
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer Cyclical', industry: 'Internet Retail', price: 178.15, openPrice: 176.50, high: 179.43, low: 176.10, lastPrice: 178.15, priceChange: 1.65, priceChangePercent: 0.93, volume: 29500000, avgVolume: 35000000, marketCap: 1850, relativeVolume: 0.84, lastUpdateDirection: 'neutral', vwap: 177.90, history: [] },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', price: 171.05, openPrice: 175.40, high: 176.20, low: 169.55, lastPrice: 171.05, priceChange: -4.35, priceChangePercent: -2.48, volume: 88400000, avgVolume: 92000000, marketCap: 545, relativeVolume: 0.96, lastUpdateDirection: 'neutral', vwap: 171.80, history: [] },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Cyclical', industry: 'Home Improvement Retail', price: 376.50, openPrice: 374.00, high: 379.80, low: 373.10, lastPrice: 376.50, priceChange: 2.50, priceChangePercent: 0.67, volume: 3800000, avgVolume: 4200000, marketCap: 373, relativeVolume: 0.90, lastUpdateDirection: 'neutral', vwap: 376.10, history: [] },
  { symbol: 'NKE', name: 'NIKE, Inc.', sector: 'Consumer Cyclical', industry: 'Footwear & Accessories', price: 98.40, openPrice: 99.80, high: 100.20, low: 97.90, lastPrice: 98.40, priceChange: -1.40, priceChangePercent: -1.40, volume: 5900000, avgVolume: 6800000, marketCap: 147, relativeVolume: 0.87, lastUpdateDirection: 'neutral', vwap: 98.70, history: [] },

  // Communication Services
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Communication Services', industry: 'Internet Content & Information', price: 505.10, openPrice: 498.20, high: 510.40, low: 497.50, lastPrice: 505.10, priceChange: 6.90, priceChangePercent: 1.39, volume: 14200000, avgVolume: 18000000, marketCap: 1290, relativeVolume: 0.79, lastUpdateDirection: 'neutral', vwap: 503.80, history: [] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', industry: 'Internet Content & Information', price: 148.45, openPrice: 147.20, high: 149.60, low: 146.90, lastPrice: 148.45, priceChange: 1.25, priceChangePercent: 0.85, volume: 22800000, avgVolume: 27000000, marketCap: 1860, relativeVolume: 0.84, lastUpdateDirection: 'neutral', vwap: 148.10, history: [] },
  { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services', industry: 'Entertainment', price: 610.50, openPrice: 605.00, high: 615.80, low: 602.10, lastPrice: 610.50, priceChange: 5.50, priceChangePercent: 0.91, volume: 2900000, avgVolume: 3500000, marketCap: 263, relativeVolume: 0.83, lastUpdateDirection: 'neutral', vwap: 609.40, history: [] },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication Services', industry: 'Entertainment', price: 112.30, openPrice: 113.10, high: 114.20, low: 111.80, lastPrice: 112.30, priceChange: -0.80, priceChangePercent: -0.71, volume: 6400000, avgVolume: 7500000, marketCap: 206, relativeVolume: 0.85, lastUpdateDirection: 'neutral', vwap: 112.70, history: [] },

  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', industry: 'Oil & Gas Integrated', price: 118.20, openPrice: 116.80, high: 119.50, low: 116.50, lastPrice: 118.20, priceChange: 1.40, priceChangePercent: 1.20, volume: 14800000, avgVolume: 17000000, marketCap: 471, relativeVolume: 0.87, lastUpdateDirection: 'neutral', vwap: 118.10, history: [] },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', industry: 'Oil & Gas Integrated', price: 156.40, openPrice: 155.00, high: 157.80, low: 154.50, lastPrice: 156.40, priceChange: 1.40, priceChangePercent: 0.90, volume: 6200000, avgVolume: 8000000, marketCap: 293, relativeVolume: 0.78, lastUpdateDirection: 'neutral', vwap: 156.20, history: [] },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', industry: 'Oil & Gas E&P', price: 125.80, openPrice: 124.90, high: 126.90, low: 124.20, lastPrice: 125.80, priceChange: 0.90, priceChangePercent: 0.72, volume: 4100000, avgVolume: 5200000, marketCap: 148, relativeVolume: 0.79, lastUpdateDirection: 'neutral', vwap: 125.60, history: [] },

  // Industrials
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', industry: 'Farm & Heavy Construction Machinery', price: 358.20, openPrice: 355.00, high: 360.80, low: 354.20, lastPrice: 358.20, priceChange: 3.20, priceChangePercent: 0.90, volume: 2200000, avgVolume: 2500000, marketCap: 179, relativeVolume: 0.88, lastUpdateDirection: 'neutral', vwap: 357.90, history: [] },
  { symbol: 'GE', name: 'General Electric Co.', sector: 'Industrials', industry: 'Specialty Industrial Machinery', price: 156.50, openPrice: 157.80, high: 158.90, low: 155.10, lastPrice: 156.50, priceChange: -1.30, priceChangePercent: -0.82, volume: 4900000, avgVolume: 5800000, marketCap: 170, relativeVolume: 0.84, lastUpdateDirection: 'neutral', vwap: 156.80, history: [] },
  { symbol: 'HON', name: 'Honeywell International', sector: 'Industrials', industry: 'Conglomerates', price: 202.40, openPrice: 201.50, high: 203.80, low: 200.90, lastPrice: 202.40, priceChange: 0.90, priceChangePercent: 0.45, volume: 2100000, avgVolume: 2600000, marketCap: 132, relativeVolume: 0.81, lastUpdateDirection: 'neutral', vwap: 202.10, history: [] }
];

export const INITIAL_EXCHANGES: Exchange[] = [
  {
    id: 'nyse_nasdaq',
    name: 'NYSE / NASDAQ',
    city: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    mapX: 294.4,
    mapY: 136.9,
    utcOffset: -5,
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    volume: 125.4,
    baseVolume: 120.0,
    topStockSymbol: 'NVDA'
  },
  {
    id: 'lse',
    name: 'London Stock Exchange',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    mapX: 499.7,
    mapY: 106.9,
    utcOffset: 0,
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
    volume: 18.2,
    baseVolume: 17.5,
    topStockSymbol: 'AAPL'
  },
  {
    id: 'tse',
    name: 'Tokyo Stock Exchange',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    mapX: 887.9,
    mapY: 150.9,
    utcOffset: 9,
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 0,
    volume: 32.5,
    baseVolume: 31.0,
    topStockSymbol: 'MSFT'
  },
  {
    id: 'sse',
    name: 'Shanghai Stock Exchange',
    city: 'Shanghai',
    country: 'China',
    latitude: 31.2304,
    longitude: 121.4737,
    mapX: 837.4,
    mapY: 163.2,
    utcOffset: 8,
    openHour: 9,
    openMinute: 30,
    closeHour: 15,
    closeMinute: 0,
    volume: 45.1,
    baseVolume: 43.0,
    topStockSymbol: 'NVDA'
  },
  {
    id: 'hkex',
    name: 'Hong Kong Exchange',
    city: 'Hong Kong',
    country: 'Hong Kong',
    latitude: 22.3193,
    longitude: 114.1694,
    mapX: 817.1,
    mapY: 188.0,
    utcOffset: 8,
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    volume: 22.8,
    baseVolume: 21.0,
    topStockSymbol: 'META'
  },
  {
    id: 'fse',
    name: 'Frankfurt Stock Exchange',
    city: 'Frankfurt',
    country: 'Germany',
    latitude: 50.1109,
    longitude: 8.6821,
    mapX: 524.1,
    mapY: 110.8,
    utcOffset: 1,
    openHour: 8,
    openMinute: 0,
    closeHour: 20,
    closeMinute: 0,
    volume: 12.1,
    baseVolume: 11.5,
    topStockSymbol: 'LLY'
  },
  {
    id: 'nse',
    name: 'National Stock Exchange',
    city: 'Mumbai',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    mapX: 702.4,
    mapY: 197.0,
    utcOffset: 5.5,
    openHour: 9,
    openMinute: 15,
    closeHour: 15,
    closeMinute: 30,
    volume: 15.6,
    baseVolume: 14.8,
    topStockSymbol: 'TSLA'
  },
  {
    id: 'asx',
    name: 'Australian Securities Exchange',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    mapX: 920.0,
    mapY: 344.1,
    utcOffset: 10,
    openHour: 10,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 0,
    volume: 6.4,
    baseVolume: 6.0,
    topStockSymbol: 'XOM'
  }
];

// Seed initial history
INITIAL_STOCKS.forEach(stock => {
  const points = 30;
  let currentVal = stock.price * 0.98;
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.49) * (stock.price * 0.003);
    currentVal += change;
    stock.history.push(Number(currentVal.toFixed(2)));
  }
  stock.history.push(stock.price);
});

// Helper to determine if an exchange is open
export function isExchangeOpen(exchange: Exchange, customTime?: Date): boolean {
  const now = customTime || new Date();
  
  // Convert current UTC time to exchange local time
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utc + 3600000 * exchange.utcOffset);
  
  const day = localTime.getDay();
  // Closed on weekends
  if (day === 0 || day === 6) return false;

  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();

  const startVal = exchange.openHour * 60 + exchange.openMinute;
  const endVal = exchange.closeHour * 60 + exchange.closeMinute;
  const currentVal = hours * 60 + minutes;

  return currentVal >= startVal && currentVal < endVal;
}

// Generate real-time update ticks
export function generateTick(stocks: Stock[]): TradeTick {
  const randomIndex = Math.floor(Math.random() * stocks.length);
  const stock = stocks[randomIndex];

  // Random volatility
  const volatility = stock.sector === 'Technology' ? 0.0018 : 0.0010;
  const changePercent = (Math.random() - 0.495) * volatility; // slightly bullish bias
  const priceDiff = stock.price * changePercent;
  const newPrice = Number((stock.price + priceDiff).toFixed(2));
  
  // Size of the trade
  const isBlockTrade = Math.random() < 0.04; // 4% chance of massive block trade
  const baseSize = stock.avgVolume * 0.00002;
  const size = Math.floor(
    isBlockTrade 
      ? baseSize * (15 + Math.random() * 25) 
      : baseSize * (0.1 + Math.random() * 3.5)
  );

  const side = priceDiff >= 0 ? 'buy' : 'sell';

  return {
    id: Math.random().toString(36).substring(2, 9),
    symbol: stock.symbol,
    price: newPrice,
    size,
    timestamp: new Date(),
    side,
    isBlockTrade
  };
}

// Apply ticks and update stock items
export function applyTick(stocks: Stock[], tick: TradeTick): Stock[] {
  return stocks.map(stock => {
    if (stock.symbol !== tick.symbol) return stock;

    const priceDirection = tick.price > stock.price ? 'up' : tick.price < stock.price ? 'down' : 'neutral';
    const nextVolume = stock.volume + tick.size;
    const nextPrice = tick.price;
    const nextOpenPrice = stock.openPrice;
    const nextPriceChange = Number((nextPrice - nextOpenPrice).toFixed(2));
    const nextPriceChangePercent = Number(((nextPriceChange / nextOpenPrice) * 100).toFixed(2));
    
    // High/Low updates
    const nextHigh = nextPrice > stock.high ? nextPrice : stock.high;
    const nextLow = nextPrice < stock.low ? nextPrice : stock.low;

    // VWAP update
    const previousTotalValue = stock.vwap * stock.volume;
    const currentTotalValue = previousTotalValue + tick.price * tick.size;
    const nextVwap = Number((currentTotalValue / nextVolume).toFixed(2));

    // History update (maintain fixed length of 30 points)
    const nextHistory = [...stock.history];
    // Add point occasionally or replace last
    if (Math.random() < 0.2) {
      nextHistory.push(nextPrice);
      if (nextHistory.length > 30) {
        nextHistory.shift();
      }
    } else {
      nextHistory[nextHistory.length - 1] = nextPrice;
    }

    // Relative volume calculation (assuming 55% of the active trading day is passed on average)
    const activeProgress = 0.55 + (Math.random() - 0.5) * 0.1;
    const nextRelativeVolume = Number((nextVolume / (stock.avgVolume * activeProgress)).toFixed(2));

    return {
      ...stock,
      price: nextPrice,
      lastPrice: stock.price,
      volume: nextVolume,
      priceChange: nextPriceChange,
      priceChangePercent: nextPriceChangePercent,
      high: nextHigh,
      low: nextLow,
      vwap: nextVwap,
      relativeVolume: nextRelativeVolume,
      lastUpdateDirection: priceDirection,
      history: nextHistory
    };
  });
}

// Generate Order Book
export function generateOrderBook(stock: Stock): OrderBook {
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];
  
  const tickSize = 0.05;
  const spread = 0.10;
  
  let cumBidSize = 0;
  let cumAskSize = 0;

  for (let i = 1; i <= 8; i++) {
    const bidPrice = Number((stock.price - (spread / 2) - (i - 1) * tickSize).toFixed(2));
    const askPrice = Number((stock.price + (spread / 2) + (i - 1) * tickSize).toFixed(2));

    const baseVolume = stock.avgVolume * 0.00005;
    const bidSize = Math.floor(baseVolume * (1.5 - i * 0.1 + Math.random() * 0.5));
    const askSize = Math.floor(baseVolume * (1.5 - i * 0.1 + Math.random() * 0.5));

    cumBidSize += bidSize;
    cumAskSize += askSize;

    bids.push({ price: bidPrice, size: bidSize, cumulativeSize: cumBidSize });
    asks.push({ price: askPrice, size: askSize, cumulativeSize: cumAskSize });
  }

  return { bids, asks };
}
