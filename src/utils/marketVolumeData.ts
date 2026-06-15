export interface MarketVolumePoint {
  time: string;
  timestamp: number;
  volume: number;
  isMarketHours: boolean;
}

export function generate24hVolumeData(): MarketVolumePoint[] {
  const data: MarketVolumePoint[] = [];
  const now = new Date();
  
  // Go back exactly 24 hours
  let current = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // Snap to nearest 15-minute interval for clean charting
  current.setMinutes(Math.floor(current.getMinutes() / 15) * 15, 0, 0);

  // Generate 96 points (24 hours * 4 points per hour)
  for (let i = 0; i <= 96; i++) {
    const pointTime = new Date(current.getTime() + i * 15 * 60 * 1000);
    const hours = pointTime.getHours();
    const minutes = pointTime.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // US Market hours: 9:30 AM to 4:00 PM EST (assuming local time roughly aligns or we just use numerical hours for the aesthetic curve)
    const timeFloat = hours + minutes / 60;
    const isMarketHours = timeFloat >= 9.5 && timeFloat < 16.0;
    
    let baseVolume = 0;
    
    if (isMarketHours) {
      if (timeFloat < 10.5) {
        // Morning spike (9:30 - 10:30)
        baseVolume = 800000 + Math.random() * 400000;
      } else if (timeFloat >= 15.0) {
        // Afternoon/Close spike (3:00 - 4:00)
        baseVolume = 900000 + Math.random() * 500000;
      } else {
        // Midday lull
        baseVolume = 400000 + Math.random() * 200000;
      }
    } else {
      if (timeFloat >= 4.0 && timeFloat < 9.5) {
        // Pre-market (ramping up slightly towards open)
        baseVolume = 50000 + (timeFloat - 4) * 20000 + Math.random() * 20000;
      } else if (timeFloat >= 16.0 && timeFloat < 20.0) {
        // After-hours (tapering off)
        baseVolume = 100000 - (timeFloat - 16) * 20000 + Math.random() * 10000;
      } else {
        // Overnight (dead)
        baseVolume = 5000 + Math.random() * 10000;
      }
    }

    // Add some noise
    const noise = (Math.random() - 0.5) * 0.15;
    const finalVolume = Math.max(0, Math.floor(baseVolume * (1 + noise)));

    data.push({
      time: timeString,
      timestamp: pointTime.getTime(),
      volume: finalVolume,
      isMarketHours
    });
  }

  return data;
}
