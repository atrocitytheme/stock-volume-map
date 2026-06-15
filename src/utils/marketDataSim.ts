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

export const DEFAULT_SYMBOLS: string[] = [
  'QQQ', 'SPY', 'VOO', 'IWM', 'SMH', 'XBI'
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
