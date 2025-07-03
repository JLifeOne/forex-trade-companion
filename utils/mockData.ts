
import { VolatilityScore, AISignal } from '../types';
// import { FOREX_SESSIONS, MOCK_NEWS_EVENTS as CONST_MOCK_NEWS_EVENTS } from '../constants'; // CONST_MOCK_NEWS_EVENTS is from constants.ts

// MOCK_NEWS_EVENTS is no longer directly used by NewsFeed.tsx. 
// The new services/forexFactoryService.ts provides its own mock news data.
// export const MOCK_NEWS_EVENTS: NewsEvent[] = CONST_MOCK_NEWS_EVENTS; // Kept in constants.ts for now, but NewsFeed uses new service


export interface VolatilityTrendPoint {
  time: string; // e.g., "T-2h", "Now"
  value: number; // e.g., 0-100
}
export interface VolatilityTrend extends VolatilityScore {
  trend: VolatilityTrendPoint[];
}


export const getMockVolatilityTrends = (): Record<'Tokyo' | 'London' | 'NewYork', VolatilityTrend> => {
  const generateTrend = (): VolatilityTrendPoint[] => {
    const points: VolatilityTrendPoint[] = [];
    for (let i = 4; i >= 0; i--) { // 5 points: T-4h, T-3h, T-2h, T-1h, Now
      points.push({
        time: i === 0 ? "Now" : `T-${i}h`,
        value: Math.floor(Math.random() * 70) + 15, // Volatility value between 15 and 85
      });
    }
    return points;
  };

  const determineLevel = (currentValue: number): VolatilityScore['level'] => {
    if (currentValue > 66) return 'High';
    if (currentValue > 33) return 'Medium';
    return 'Low';
  };
  
  const tokyoTrend = generateTrend();
  const londonTrend = generateTrend();
  const newYorkTrend = generateTrend();

  return {
    Tokyo: { 
      level: determineLevel(tokyoTrend[tokyoTrend.length - 1].value), 
      value: tokyoTrend[tokyoTrend.length - 1].value,
      trend: tokyoTrend 
    },
    London: { 
      level: determineLevel(londonTrend[londonTrend.length - 1].value), 
      value: londonTrend[londonTrend.length - 1].value,
      trend: londonTrend
    },
    NewYork: { 
      level: determineLevel(newYorkTrend[newYorkTrend.length - 1].value), 
      value: newYorkTrend[newYorkTrend.length - 1].value,
      trend: newYorkTrend
    },
  };
};


export const getMockAISignals = (): AISignal[] => [
  { id: 'mock-sig-1', title: 'EUR/USD Possible Support Bounce', description: 'EUR/USD is nearing a significant daily support level. Look for bullish price action.', confidence: 'Medium' },
  { id: 'mock-sig-2', title: 'GBP/JPY Momentum Continuation', description: 'Strong bullish momentum observed in GBP/JPY on H4. Consider entries on minor pullbacks.', confidence: 'High' },
  { id: 'mock-sig-3', title: 'USD/CAD Range Trade Opportunity', description: 'USD/CAD appears to be trading within a defined range. Look for fades at range extremes.', confidence: 'Medium'},
];