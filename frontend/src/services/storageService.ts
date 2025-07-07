import { ChecklistItem, AppSettings, TradingPlan, WatchlistItem } from '../types';
import { INITIAL_CHECKLIST_ITEMS } from '../constants';

const CHECKLIST_ITEMS_KEY = 'forexChecklistItems';
const APP_SETTINGS_KEY = 'forexAppSettings';
const TRADING_PLAN_KEY = 'forexTradingPlan';
const WATCHLIST_ITEMS_KEY = 'forexWatchlistItems';


// --- Checklist ---
export const getChecklistItems = (): ChecklistItem[] => {
  const raw = localStorage.getItem(CHECKLIST_ITEMS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Ensure items have IDs if migrating from old data
      return Array.isArray(parsed) ? parsed.map((item, index) => ({ ...item, id: item.id || String(index +1) })) : INITIAL_CHECKLIST_ITEMS;
    } catch (error) {
      console.error("Failed to parse checklist items from localStorage", error);
      return INITIAL_CHECKLIST_ITEMS;
    }
  }
  return INITIAL_CHECKLIST_ITEMS;
};

export const saveChecklistItems = (items: ChecklistItem[]): void => {
  localStorage.setItem(CHECKLIST_ITEMS_KEY, JSON.stringify(items));
};

// --- App Settings ---
export const getAppSettings = (): AppSettings => {
  const raw = localStorage.getItem(APP_SETTINGS_KEY);
  const defaultSettings: AppSettings = { cloudSync: false, userName: 'Trader' };
  if (raw) {
    try {
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (error) {
      console.error("Failed to parse app settings from localStorage", error);
      return defaultSettings;
    }
  }
  return defaultSettings;
};

export const saveAppSettings = (settings: AppSettings): void => {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
};

// --- Trading Plan ---
export const getDefaultTradingPlan = (): TradingPlan => ({
  overallStrategy: '',
  maxDailyLossPercent: 2,
  riskPerTradePercent: 1,
  preferredPairs: ['EUR/USD', 'GBP/USD'],
  sessionFocus: ['London', 'NewYork'],
  keyEntryRules: '',
  keyExitRules: '',
  additionalNotes: '',
});

export const getTradingPlan = (): TradingPlan => {
  const raw = localStorage.getItem(TRADING_PLAN_KEY);
  const defaultPlan = getDefaultTradingPlan();
  if (raw) {
    try {
      // Merge with default plan to ensure all fields are present if new ones are added
      return { ...defaultPlan, ...JSON.parse(raw) };
    } catch (error) {
      console.error("Failed to parse trading plan from localStorage", error);
      return defaultPlan;
    }
  }
  return defaultPlan;
};

export const saveTradingPlan = (plan: TradingPlan): void => {
  localStorage.setItem(TRADING_PLAN_KEY, JSON.stringify(plan));
};

// --- Watchlist ---
export const getDefaultWatchlistItems = (): WatchlistItem[] => [
  { id: 'wl-eurusd', symbol: 'EUR/USD', aiSentiment: 'N/A', sentimentStatus: 'idle' },
  { id: 'wl-gbpjpy', symbol: 'GBP/JPY', aiSentiment: 'N/A', sentimentStatus: 'idle' },
  { id: 'wl-audusd', symbol: 'AUD/USD', aiSentiment: 'N/A', sentimentStatus: 'idle' },
];

export const getWatchlistItems = (): WatchlistItem[] => {
  const raw = localStorage.getItem(WATCHLIST_ITEMS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(item => ({ ...item, sentimentStatus: 'idle' })) : getDefaultWatchlistItems();
    } catch (error) {
      console.error("Failed to parse watchlist items from localStorage", error);
      return getDefaultWatchlistItems();
    }
  }
  return getDefaultWatchlistItems();
};

export const saveWatchlistItems = (items: WatchlistItem[]): void => {
  localStorage.setItem(WATCHLIST_ITEMS_KEY, JSON.stringify(items));
};