
import { ForexSession, ChecklistItem, Strategy } from './types'; // Strategy is now directly imported

export const FOREX_SESSIONS: ForexSession[] = [
  { name: 'Tokyo', utcOpen: 0, utcClose: 9, timezone: 'Asia/Tokyo' }, // 00:00 - 09:00 UTC
  { name: 'London', utcOpen: 7, utcClose: 16, timezone: 'Europe/London' }, // 07:00 - 16:00 UTC (adjust for DST if needed, moment-timezone handles it)
  { name: 'NewYork', utcOpen: 12, utcClose: 21, timezone: 'America/New_York' }, // 12:00 - 21:00 UTC
];

export const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'Confirm major session open/overlap', checked: false },
  { id: '2', text: 'Check economic calendar for high-impact news', checked: false },
  { id: '3', text: 'Risk per trade defined (e.g., < 1-2%)', checked: false },
  { id: '4', text: 'Current market volatility assessed', checked: false },
  { id: '5', text: 'Trading plan for the day reviewed', checked: false },
];

export const STRATEGIES: Strategy[] = [ // Uses imported Strategy type
  { 
    id: 'orb_lite', 
    name: 'Opening Range Breakout (ORB)', 
    description: 'Identify the high/low of the first 15-30 mins of a session. Enter on a breakout of this range. SL typically below/above the range, TP 1:1.5 or 1:2 R:R.',
    typicalPairs: 'EUR/USD, GBP/USD, Major Indices',
    keyIndicators: 'None (Price Action based), Volume (optional)',
    commonRiskParams: 'Stop loss: 5-10 pips below/above range. Risk: 1% of capital.'
  },
  { 
    id: 'vwap_pullback', 
    name: 'VWAP Pullback', 
    description: 'In a trending market, wait for price to pull back to the Volume Weighted Average Price (VWAP). Enter in the direction of the trend. SL based on ATR or recent swing point.',
    typicalPairs: 'EUR/USD, USD/JPY, AUD/USD',
    keyIndicators: 'VWAP, Moving Averages (e.g., 20 EMA, 50 EMA for trend context)',
    commonRiskParams: 'Stop loss: 1x ATR below/above VWAP. Risk: 1-2%.'
  },
  { 
    id: 'ny_reversal', 
    name: 'New York Reversal', 
    description: 'Look for exhaustion moves into the NY open after London session. If a key level is hit or significant divergence appears, look for reversal signals. Often targets mean reversion.',
    typicalPairs: 'GBP/USD, EUR/USD',
    keyIndicators: 'Key Support/Resistance levels, RSI Divergence, Candlestick Patterns (e.g., Engulfing, Pin Bar)',
    commonRiskParams: 'Stop loss: Above/below exhaustion candle. Target: Previous support/resistance or 1:2 R:R.'
  },
  { 
    id: 'pivot_bounce', 
    name: 'Pivot Point Bounce/Break', 
    description: 'Utilize daily or weekly pivot points. Trade bounces off support/resistance pivot levels or breakouts through them, confirming with volume or momentum.',
    typicalPairs: 'All major pairs',
    keyIndicators: 'Daily/Weekly Pivot Points, Volume, Momentum Oscillators (e.g., MACD)',
    commonRiskParams: 'Stop loss: Beyond pivot level. Target: Next pivot level or fixed R:R.'
  },
];

// MOCK_NEWS_EVENTS is now in services/forexFactoryService.ts as part of its mock implementation.
// If constants.ts needs it for other purposes, it can be re-added, but it's not directly used by NewsFeed component anymore.

export const TRADING_STYLES = ['Scalping', 'Day Trading', 'Swing Trading'];

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002'; // If image generation was needed