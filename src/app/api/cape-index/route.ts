import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

interface CapeDataPoint {
  date: string;
  sp500Cape: number;
}

interface CapeResponse {
  data: CapeDataPoint[];
  lastUpdate: number;
}

let cachedResponse: CapeResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to convert decimal year (e.g., 2023.05) to YYYY-MM
function parseFractionalDate(fractionalDate: number): string {
  const year = Math.floor(fractionalDate);
  // The fractional part represents the month. 
  // 0.01 = Jan, 0.02 = Feb, 0.10 = Oct, 0.11 = Nov, 0.12 = Dec
  let month = Math.round((fractionalDate - year) * 100);
  
  if (month < 1 || month > 12) {
      month = 1; // Fallback
  }
  
  const formattedMonth = month.toString().padStart(2, '0');
  return `${year}-${formattedMonth}`;
}

async function fetchRealCapeData(): Promise<CapeDataPoint[]> {
  const url = "http://www.econ.yale.edu/~shiller/data/ie_data.xls";
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Shiller data: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(s => s.toLowerCase() === 'data') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  
  // Filter valid rows (where the first column is a number, representing the date)
  const validRows = data.filter(row => row && typeof row[0] === 'number' && !isNaN(row[0]));
  
  const parsedData: CapeDataPoint[] = [];
  
  for (const row of validRows) {
    const rawDate = row[0];
    const cape = row[12]; // Column M (index 12) is CAPE
    
    // Only include rows that have a valid CAPE number
    if (typeof cape === 'number' && !isNaN(cape)) {
      parsedData.push({
        date: parseFractionalDate(rawDate),
        sp500Cape: Number(cape.toFixed(2))
      });
    }
  }
  
  // We only want the last 20 years (240 months) to keep the chart readable
  return parsedData.slice(-240);
}

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cache if fresh
    if (cachedResponse && (now - lastFetchTime) < CACHE_DURATION_MS) {
      return NextResponse.json(cachedResponse);
    }
    
    const data = await fetchRealCapeData();
    
    cachedResponse = {
      data,
      lastUpdate: now,
    };
    lastFetchTime = now;
    
    return NextResponse.json(cachedResponse);
  } catch (err: any) {
    console.error('CAPE API error:', err);
    
    // Fallback to cache on error if available
    if (cachedResponse) {
        return NextResponse.json(cachedResponse);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch CAPE index data', details: err.message },
      { status: 500 }
    );
  }
}
