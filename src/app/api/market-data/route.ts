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
  
  // Trigger update every 60 seconds
  if (now - lastFetchTime > 60000 && !isFetching) {
    isFetching = true;
    try {
      if (!cachedStocks) {
        // INITIALIZATION: Fetch all 28 symbols at once so the board starts full.
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
        // PER-MINUTE UPDATE: Fetch all symbols since there are only 6 now.
        // 6 calls every 60s uses only 10% of the 60 calls/min limit!
        const newStocksBatch = await fetchInitialStocksStaggered(
          DEFAULT_SYMBOLS,
          token,
          () => {},
          150 // small delay
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
