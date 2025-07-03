
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  openPrice: number;
  closePrice?: number;
  sl?: number;
  tp?: number;
  pnl?: number;
  openTime: string;
  closeTime?: string;
}

export interface JournalEntry {
  mindset: string;
  strategy: string; // Can include strategy notes and applied AI signal details
  strategyTemplate?: string; // Description of a predefined strategy from library
  trades: Trade[];
  emotionTag?: EmotionTag; // AI-generated sentiment
  // any other relevant fields
}

export type EmotionTag = 'Low Emotion' | 'Neutral Emotion' | 'High Emotion' | 'Unknown';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ForexSession {
  name: 'Tokyo' | 'London' | 'NewYork';
  utcOpen: number; // Hour in UTC
  utcClose: number; // Hour in UTC
  timezone: string; // e.g., 'Asia/Tokyo'
}

export interface SessionStatus {
  Tokyo: 'closed' | 'opening_soon' | 'open';
  London: 'closed' | 'opening_soon' | 'open';
  NewYork: 'closed' | 'opening_soon' | 'open';
}

export interface AppSettings {
  cloudSync: boolean; // Mocked for now
  userName?: string;
}

export interface NewsEvent {
  id: string;
  time: string; // e.g., "10:00 AM"
  currency: string; // e.g., "USD"
  title: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  typicalPairs?: string;
  keyIndicators?: string;
  commonRiskParams?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface AISignal {
  id: string;
  title: string;
  description: string;
  confidence?: 'High' | 'Medium' | 'Low';
  pair?: string;
  keyLevels?: string;
  chartPattern?: string;
  confirmationSignals?: string;
  supportingIndicators?: string;
}

export interface VolatilityTrendPoint { // Added for trend display
  time: string; 
  value: number; 
}

export interface VolatilityScore {
  level: 'High' | 'Medium' | 'Low';
  value?: number; // Optional: actual ATR or some metric
  trend?: VolatilityTrendPoint[]; // Added for trend display
}


export interface CommunityEntry {
  id: string;
  username: string;
  date: string; // YYYY-MM-DD
  strategyTemplate?: string;
  pnl?: number;
  likes: number;
  comments?: CommunityComment[];
  likedByUser?: boolean;
}

export interface CommunityComment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface LeaderboardUser {
  userId: string;
  username: string;
  winRate: number; // 0.0 to 1.0
  monthlyPnl: number; // In account currency
}

export interface StrategyIdea {
  id: string;
  strategyName: string;
  description: string;
  entryConditions: string;
  exitConditions: string;
  coreLogic: string;
  tradingStyle: string;
  recommendedPairs: string;
  timeframes: string;
}

export interface MarketCommentary {
    id: string;
    commentary: string;
    timestamp: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  isRead?: boolean; // Added for notification log
}

export interface JournalSaveLogEntry {
  id: string;
  date: string; // Date of the journal entry being saved, YYYY-MM-DD
  timestamp: number; // Timestamp of when the save occurred
  message: string; // e.g., "Entry for YYYY-MM-DD saved."
}

export interface TradingPlan {
  overallStrategy: string;
  maxDailyLossPercent: number;
  riskPerTradePercent: number;
  preferredPairs: string[]; // Stored as an array of strings
  sessionFocus: Array<'Tokyo' | 'London' | 'NewYork'>;
  keyEntryRules: string;
  keyExitRules: string;
  additionalNotes?: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string; // e.g., EUR/USD
  aiSentiment?: 'Bullish' | 'Bearish' | 'Neutral' | 'N/A';
  lastUpdated?: number; // Timestamp of last sentiment update
  sentimentStatus?: 'idle' | 'loading' | 'failed';
}


// Redux state types
export interface SessionState {
  localTime: string;
  timezones: { Tokyo: string; London: string; NewYork: string };
  sessionStatus: SessionStatus;
  lastPrompted: { Tokyo: boolean; London: boolean; NewYork: boolean };
}

export interface JournalState {
  entries: { [date: string]: JournalEntry }; // Date key: YYYY-MM-DD
  saveLog: JournalSaveLogEntry[]; // Log of save actions
}

export interface User {
  uid: string;
  email?: string | null; // Firebase email can be null
  displayName?: string | null; // Firebase displayName can be null
  // photoURL?: string | null; // Optional: if you plan to use user avatars
}

export interface AuthState {
  user: User | null;
  token: string | null; // Firebase manages its own ID tokens; this can be an indicator like "firebase_active" or removed.
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'initializing'; // Added 'initializing' for auth listener
  error: string | null;
  syncing: boolean; 
}

export interface ToastState {
  messages: ToastMessage[];
  notificationLog: ToastMessage[]; // Added for persistent log
}

export interface TradingPlanState {
    plan: TradingPlan;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

export interface WatchlistState {
  items: WatchlistItem[];
  globalStatus: 'idle' | 'loading'; // For global actions like "Refresh All"
  error: string | null; // For global errors
}
