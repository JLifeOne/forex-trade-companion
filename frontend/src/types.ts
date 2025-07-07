export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  openPrice: number;
  openTime: string;
  closePrice?: number;
  closeTime?: string;
  pnl?: number;
  notes?: string;
  sl?: number;
  tp?: number;
}

export type EmotionTag = 'High Emotion' | 'Low Emotion' | 'Neutral Emotion' | 'Unknown';

export interface JournalEntry {
  id: string;
  mindset: string;
  strategy: string;
  strategyTemplate?: string;
  trades: Trade[];
  emotionTag?: EmotionTag;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  typicalPairs?: string;
  keyIndicators?: string;
  commonRiskParams?: string;
}

export interface AISignal {
    id: string;
    title: string;
    description: string;
    pair?: string;
    confidence?: 'High' | 'Medium' | 'Low';
    keyLevels?: string;
    chartPattern?: string;
    confirmationSignals?: string;
    supportingIndicators?: string;
}

export interface SessionStatus {
    Tokyo: 'open' | 'closed' | 'opening_soon';
    London: 'open' | 'closed' | 'opening_soon';
    NewYork: 'open' | 'closed' | 'opening_soon';
}

export interface MarketCommentary {
    commentary: string;
    timestamp: string;
}

export interface NewsEvent {
    title: string;
    time: string;
    impact: 'High' | 'Medium' | 'Low';
    currency: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface CommunityEntry {
    id: string;
    author: string;
    content: string;
    timestamp: string;
}

export interface LeaderboardUser {
    id: string;
    name: string;
    rank: number;
    profit: number;
}

export interface AppSettings {
    cloudSync: boolean;
    theme: 'dark' | 'light';
}

export interface TradingPlan {
    id: string;
    content: string;
}

export interface WatchlistItem {
    id: string;
    symbol: string;
    price: number;
    change: number;
}

export interface ForexSession {
    name: string;
    utcOpen: number;
    utcClose: number;
    timezone: string;
}

export interface VolatilityScore {
    score: number;
    trend: VolatilityTrend;
}

export interface VolatilityTrend {
    level: 'High' | 'Medium' | 'Low';
    value: number;
}

export interface SessionState {
    localTime: string;
    timezones: { [key: string]: string };
    sessionStatus: SessionStatus;
    lastPrompted: { [key: string]: boolean };
}

export interface ToastMessage {
    id: string;
    message: string;
    type: 'info' | 'success' | 'error';
    duration?: number;
}

export interface ToastState {
    messages: ToastMessage[];
}

export interface TradingPlanState {
    plan: TradingPlan | null;
}

export interface WatchlistState {
    items: WatchlistItem[];
}
