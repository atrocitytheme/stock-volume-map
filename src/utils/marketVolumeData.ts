export interface MarketVolumePoint {
  time: string;
  timestamp: number;
  volume: number;
  isMarketHours: boolean;
}

export function generateVolumeData(timeframe: '24h' | '7d' | '30d' | 'ytd'): MarketVolumePoint[] {
  const data: MarketVolumePoint[] = [];
  const now = new Date();
  
  if (timeframe === '24h') {
    let current = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    current.setMinutes(Math.floor(current.getMinutes() / 15) * 15, 0, 0);

    for (let i = 0; i <= 96; i++) {
      const pointTime = new Date(current.getTime() + i * 15 * 60 * 1000);
      const hours = pointTime.getHours();
      const minutes = pointTime.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const timeFloat = hours + minutes / 60;
      const isMarketHours = timeFloat >= 9.5 && timeFloat < 16.0;
      
      let baseVolume = 0;
      if (isMarketHours) {
        if (timeFloat < 10.5) baseVolume = 800000 + Math.random() * 400000;
        else if (timeFloat >= 15.0) baseVolume = 900000 + Math.random() * 500000;
        else baseVolume = 400000 + Math.random() * 200000;
      } else {
        if (timeFloat >= 4.0 && timeFloat < 9.5) baseVolume = 50000 + (timeFloat - 4) * 20000 + Math.random() * 20000;
        else if (timeFloat >= 16.0 && timeFloat < 20.0) baseVolume = 100000 - (timeFloat - 16) * 20000 + Math.random() * 10000;
        else baseVolume = 5000 + Math.random() * 10000;
      }

      data.push({
        time: timeString,
        timestamp: pointTime.getTime(),
        volume: Math.max(0, Math.floor(baseVolume * (1 + (Math.random() - 0.5) * 0.15))),
        isMarketHours
      });
    }
  } else if (timeframe === '7d') {
    let current = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    current.setMinutes(0, 0, 0); // Hourly

    for (let i = 0; i <= 168; i++) {
      const pointTime = new Date(current.getTime() + i * 60 * 60 * 1000);
      const day = pointTime.getDay();
      const isWeekend = day === 0 || day === 6;
      const hours = pointTime.getHours();
      const timeString = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]} ${hours}:00`;
      const isMarketHours = !isWeekend && hours >= 9 && hours < 16;
      
      let baseVolume = isMarketHours ? 2500000 + Math.random() * 1000000 : (isWeekend ? 10000 : 50000);
      
      data.push({
        time: timeString,
        timestamp: pointTime.getTime(),
        volume: Math.max(0, Math.floor(baseVolume * (1 + (Math.random() - 0.5) * 0.2))),
        isMarketHours
      });
    }
  } else if (timeframe === '30d') {
    let current = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    current.setHours(0, 0, 0, 0); // Daily

    for (let i = 0; i <= 30; i++) {
      const pointTime = new Date(current.getTime() + i * 24 * 60 * 60 * 1000);
      const day = pointTime.getDay();
      const isWeekend = day === 0 || day === 6;
      const timeString = `${pointTime.getMonth() + 1}/${pointTime.getDate()}`;
      
      let baseVolume = isWeekend ? 500000 : 35000000 + Math.random() * 15000000;
      
      data.push({
        time: timeString,
        timestamp: pointTime.getTime(),
        volume: Math.max(0, Math.floor(baseVolume * (1 + (Math.random() - 0.5) * 0.1))),
        isMarketHours: !isWeekend
      });
    }
  } else if (timeframe === 'ytd') {
    const currentYear = now.getFullYear();
    let current = new Date(currentYear, 0, 1); // Jan 1st of current year
    current.setHours(0, 0, 0, 0);
    
    // Calculate days from Jan 1 to now
    const daysYTD = Math.ceil((now.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));

    for (let i = 0; i <= daysYTD; i++) {
      const pointTime = new Date(current.getTime() + i * 24 * 60 * 60 * 1000);
      const day = pointTime.getDay();
      const isWeekend = day === 0 || day === 6;
      const timeString = `${pointTime.getMonth() + 1}/${pointTime.getDate()}`;
      
      let baseVolume = isWeekend ? 500000 : 35000000 + Math.random() * 15000000;
      
      // Add macro trend for YTD (e.g., higher volume in certain months)
      const month = pointTime.getMonth();
      if (month === 0 || month === 2) baseVolume *= 1.2; // Jan/Mar volatility
      if (month === 7 || month === 8) baseVolume *= 0.8; // Summer lull
      
      data.push({
        time: timeString,
        timestamp: pointTime.getTime(),
        volume: Math.max(0, Math.floor(baseVolume * (1 + (Math.random() - 0.5) * 0.15))),
        isMarketHours: !isWeekend
      });
    }
  }

  return data;
}

export function generate24hVolumeData(): MarketVolumePoint[] {
  return generateVolumeData('24h');
}
