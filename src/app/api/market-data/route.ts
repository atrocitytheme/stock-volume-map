import { NextResponse } from 'next/server';
import { Stock, DEFAULT_SYMBOLS } from '@/utils/marketDataSim';
import { fetchInitialStocksStaggered } from '@/utils/finnhubService';

// In-memory cache variables for the server proxy
let cachedStocks: Stock[] | null = null;
let lastFetchTime = 0;
let isFetching = false;
let updateCursor = 0; // Tracks which batch of 8 stocks to update next
let dataVersion = 0; // Tracks the version of the fetched data

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing FINNHUB_API_KEY environment variable on server.' },
      { status: 500 }
    );
  }

  const now = Date.now();
  
  // Trigger update every 5 seconds
  if (now - lastFetchTime > 5000 && !isFetching) {
    isFetching = true;
    try {
      if (!cachedStocks || cachedStocks.length === 0) {
        // INITIALIZATION: Fetch all symbols at once so the board starts full.
        const stocks = await fetchInitialStocksStaggered(
          DEFAULT_SYMBOLS,
          token,
          () => {}, // Empty progress callback
          150
        );
        if (stocks && stocks.length > 0) {
          cachedStocks = stocks;
          lastFetchTime = Date.now();
          dataVersion++;
        }
      } else {
        // 5s UPDATE: Fetch a rotating batch of 4 symbols.
        // 4 calls every 5s = 48 calls/min, which safely stays under the 60 calls/min limit!
        const batchSize = 4;
        const symbolsToFetch = [];
        for (let i = 0; i < batchSize; i++) {
          symbolsToFetch.push(DEFAULT_SYMBOLS[(updateCursor + i) % DEFAULT_SYMBOLS.length]);
        }
        updateCursor = (updateCursor + batchSize) % DEFAULT_SYMBOLS.length;

        const newStocksBatch = await fetchInitialStocksStaggered(
          symbolsToFetch,
          token,
          () => {},
          50 // small delay
        );

        // Merge newly fetched batch into existing cache
        if (newStocksBatch && newStocksBatch.length > 0) {
          cachedStocks = cachedStocks.map(oldStock => {
            const updatedStock = newStocksBatch.find(s => s.symbol === oldStock.symbol);
            return updatedStock ? updatedStock : oldStock;
          });
          lastFetchTime = Date.now();
          dataVersion++;
        }
      }
    } catch (err) {
      console.error('Backend proxy error fetching Finnhub data:', err);
    } finally {
      isFetching = false;
    }
  }

  return NextResponse.json({
    stocks: cachedStocks || [],
    lastUpdate: lastFetchTime,
    isFetching: isFetching,
    version: dataVersion
  });
}
