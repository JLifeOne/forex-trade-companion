// IMPORTANT: This service now assumes it's calling secure backend proxy endpoints.
// Your backend service (e.g., Firebase Functions) would handle the actual Gemini API calls
// using an API key configured securely on the server environment.

import { ChatMessage, EmotionTag, AISignal, StrategyIdea, MarketCommentary, NewsEvent, WatchlistItem } from '../types';
// GEMINI_TEXT_MODEL is still useful if the backend needs to know which model to use,
// or if different endpoints on the backend map to different models.
// For now, we assume the backend endpoints are pre-configured for the correct model.
// import { GEMINI_TEXT_MODEL } from '../constants'; 
import { fetchForexFactoryNews } from './forexFactoryService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

// Base URL for your backend proxy. Replace with your actual backend URL.
const PROXY_BASE_URL = '/api/gemini'; // Example: Could be https://your-backend.com/api/gemini

// Utility to handle responses from the backend proxy
async function fetchFromProxy<T>(endpoint: string, body: any, method: string = 'POST'): Promise<T> {
  const response = await fetch(`${PROXY_BASE_URL}${endpoint}`, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from proxy' }));
    console.error(`Error from proxy endpoint ${endpoint}:`, response.status, errorData);
    throw new Error(errorData.message || `Request to AI proxy failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}


// Helper to get relevant high-impact news for prompts (still runs client-side to prepare context for backend)
const getHighImpactNewsContext = async (): Promise<string> => {
    try {
        const allNews = await fetchForexFactoryNews();
        const now = dayjs();
        const relevantNews = allNews.filter(event => {
            if (event.impact !== 'High') return false;
            const eventTime = dayjs(event.time); 
            if (!eventTime.isValid()) return false;
            const startWindow = now.subtract(2, 'hours');
            const endWindow = now.add(6, 'hours');
            return eventTime.isBetween(startWindow, endWindow, null, '[]');
        });

        if (relevantNews.length > 0) {
            const newsTitles = relevantNews.map(e => `${e.title} (${e.currency} at ${dayjs(e.time).format('HH:mm')})`).join(', ');
            return `Context: High-impact news events relevant to the current period include: ${newsTitles}. Please consider their potential impact.`;
        }
    } catch (error) {
        console.warn("Could not fetch news for AI context:", error);
    }
    return "";
};


// --- SENTIMENT ANALYSIS ---
// Backend expects: { journalText: string }
// Backend returns: { emotionTag: EmotionTag }
export const analyzeSentiment = async (text: string): Promise<EmotionTag> => {
  try {
    const response = await fetchFromProxy<{ emotionTag: EmotionTag }>('/sentiment', { journalText: text });
    if (response && response.emotionTag && ['Low Emotion', 'Neutral Emotion', 'High Emotion', 'Unknown'].includes(response.emotionTag)) {
        return response.emotionTag;
    }
    console.warn("Sentiment analysis from proxy returned unexpected format:", response);
    return 'Unknown';
  } catch (error) {
    console.error('Proxy API error during sentiment analysis:', error);
    return 'Unknown';
  }
};

// --- CHAT ASSISTANT ---
// Backend expects: { userMessage: string, history: ChatMessage[] }
// Backend returns: { responseText: string }
export const queryChatAssistant = async (userMessage: string, history: ChatMessage[]): Promise<string> => {
  try {
    const response = await fetchFromProxy<{ responseText: string }>('/chat', { userMessage, history });
    return response.responseText;
  } catch (error: any) {
    console.error('Proxy API error during chat query:', error);
    if (error.message && error.message.includes('429')) { // Assuming proxy might relay 429
      return 'Sorry, the assistant is experiencing high demand. Please try again in a few moments.';
    }
    return 'Sorry, I encountered an error while processing your request via the AI proxy. Please try again.';
  }
};

// --- AI SIGNAL RECOMMENDATIONS ---
interface AISignalsCache { data: AISignal[] | null; timestamp: number; }
const aiSignalsCache: AISignalsCache = { data: null, timestamp: 0 };
const AI_SIGNALS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Backend expects: { marketContext: string }
// Backend returns: { signals: AISignal[] }
export const getAISignalRecommendations = async (marketContextInput?: string): Promise<AISignal[]> => {
  const now = Date.now();
  if (aiSignalsCache.data && (now - aiSignalsCache.timestamp < AI_SIGNALS_CACHE_DURATION_MS)) {
    console.log("Returning cached AI signals (from proxy).");
    return aiSignalsCache.data;
  }
  
  const newsContext = await getHighImpactNewsContext();
  const baseMarketContext = marketContextInput || "General global forex market conditions. Focus on major pairs like EUR/USD, GBP/USD, USD/JPY. User seeks short to medium term opportunities (intraday to few days). Consider current volatility, recent news impact, and common technical patterns.";
  const fullContext = `${baseMarketContext} ${newsContext}`.trim();

  try {
    console.log("Fetching fresh AI signals from proxy with context:", fullContext);
    const response = await fetchFromProxy<{ signals: AISignal[] }>('/signals', { marketContext: fullContext });
    
    if (response && Array.isArray(response.signals)) {
      const validSignals = response.signals.filter(s => s.id && s.title && s.description)
                           .map(s => ({...s, id: `${s.pair?.replace('/','').toLowerCase() || 'sig'}-${Date.now()}-${Math.random().toString(36).substring(7)}`})); // ID generation can be done by backend too
      aiSignalsCache.data = validSignals;
      aiSignalsCache.timestamp = now;
      return validSignals;
    }
    console.warn("AI signal recommendations from proxy returned unexpected format:", response);
    return [{ id: 'proxy-parse-error-signal', title: 'AI Signals FormatError', description: 'Could not understand signals from AI proxy.', confidence: 'Low' }];
  } catch (error) {
    console.error('Proxy API error during AI signal recommendations:', error);
    return [{ id: 'proxy-api-error-signal', title: 'AI Signals API Error', description: 'Error communicating with AI proxy for signals.', confidence: 'Low' }];
  }
};

// --- AI STRATEGY GENERATION ---
interface StrategyIdeaCache { [style: string]: { data: StrategyIdea | null; timestamp: number }; }
const strategyIdeaCache: StrategyIdeaCache = {};
const STRATEGY_IDEA_CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes

// Backend expects: { tradingStyle: string, newsContext: string }
// Backend returns: { strategyIdea: StrategyIdea | null }
export const generateStrategyIdea = async (tradingStyle: string = 'Day Trading'): Promise<StrategyIdea | null> => {
    const now = Date.now();
    if (strategyIdeaCache[tradingStyle] && (now - strategyIdeaCache[tradingStyle].timestamp < STRATEGY_IDEA_CACHE_DURATION_MS)) {
        console.log(`Returning cached strategy idea for ${tradingStyle} (from proxy).`);
        return strategyIdeaCache[tradingStyle].data;
    }

    const newsContext = await getHighImpactNewsContext();

    try {
        console.log(`Fetching new strategy idea for ${tradingStyle} from proxy.`);
        const response = await fetchFromProxy<{ strategyIdea: Omit<StrategyIdea, 'id'> | null }>('/strategy-idea', { tradingStyle, newsContext });
        
        if (response && response.strategyIdea && response.strategyIdea.strategyName) {
            const strategyWithId = { ...response.strategyIdea, id: `${response.strategyIdea.strategyName.replace(/\s+/g, '-')}-${Date.now()}` };
            strategyIdeaCache[tradingStyle] = { data: strategyWithId, timestamp: now };
            return strategyWithId;
        }
        console.warn("Strategy idea generation from proxy returned unexpected format:", response);
        return null;
    } catch (error) {
        console.error('Proxy API error during strategy idea generation:', error);
        return null;
    }
};

// --- AI MARKET COMMENTARY ---
interface MarketCommentaryCache { data: MarketCommentary | null; timestamp: number; }
let marketCommentaryCache: MarketCommentaryCache = { data: null, timestamp: 0 };
const MARKET_COMMENTARY_CACHE_DURATION_MS = 20 * 60 * 1000; // 20 minutes

// Backend expects: { newsContext: string }
// Backend returns: { commentary: MarketCommentary | null }
export const getMarketCommentary = async (): Promise<MarketCommentary | null> => {
    const now = Date.now();
    if (marketCommentaryCache.data && (now - marketCommentaryCache.timestamp < MARKET_COMMENTARY_CACHE_DURATION_MS)) {
        console.log("Returning cached market commentary (from proxy).");
        return marketCommentaryCache.data;
    }
    const newsContext = await getHighImpactNewsContext();
    try {
        console.log("Fetching fresh market commentary from proxy.");
        const response = await fetchFromProxy<{ commentary: { commentaryText: string } | null }>('/market-commentary', { newsContext });
        
        if (response && response.commentary && response.commentary.commentaryText && response.commentary.commentaryText.trim().length > 0) {
            const newCommentary = { id: `commentary-${now}`, commentary: response.commentary.commentaryText.trim(), timestamp: now };
            marketCommentaryCache = { data: newCommentary, timestamp: now };
            return newCommentary;
        }
        console.warn("Market commentary from proxy returned empty or unexpected format:", response);
        return null;
    } catch (error) {
        console.error('Proxy API error during market commentary:', error);
        return null;
    }
};

// --- AI JOURNAL REVIEW ---
// Backend expects: { entriesText: string, periodDescription: string }
// Backend returns: { reviewText: string }
export const getAIJournalReview = async (journalEntries: { [date: string]: import('../types').JournalEntry }, periodDescription: string): Promise<string> => {
    let entriesText = "";
    for (const date in journalEntries) {
        const entry = journalEntries[date];
        const tradesSummary = entry.trades.map(t => `${t.side} ${t.symbol} PnL: ${t.pnl ?? 'N/A'}`).join('; ') || "No trades";
        entriesText += `Date: ${date}\nMindset: ${entry.mindset || 'N/A'}\nStrategy Notes: ${entry.strategy || 'N/A'}\nEmotion Tag: ${entry.emotionTag || 'N/A'}\nTrades: ${tradesSummary}\n---\n`;
    }

    if (!entriesText) {
        return "No journal entries provided for review.";
    }

    try {
        const response = await fetchFromProxy<{ reviewText: string }>('/journal-review', { entriesText, periodDescription });
        return response.reviewText.trim() || "AI proxy could not generate a review at this time.";
    } catch (error: any) {
        console.error('Proxy API error during journal review:', error);
        if (error.message && error.message.includes('429')) {
          return 'Journal review service (via proxy) is experiencing high demand. Please try again.';
        }
        return "Sorry, an error occurred while generating the journal review via the AI proxy.";
    }
};

// --- AI WATCHLIST SYMBOL SENTIMENT ---
// Backend expects: { symbol: string }
// Backend returns: { sentiment: WatchlistItem['aiSentiment'] }
export const getAISymbolSentiment = async (symbol: string): Promise<WatchlistItem['aiSentiment']> => {
    try {
        const response = await fetchFromProxy<{ sentiment: WatchlistItem['aiSentiment'] }>('/symbol-sentiment', { symbol });
        if (response && response.sentiment && ['Bullish', 'Bearish', 'Neutral', 'N/A'].includes(response.sentiment)) {
            return response.sentiment;
        }
        console.warn(`AI symbol sentiment for ${symbol} from proxy returned unexpected format:`, response);
        return 'N/A';
    } catch (error) {
        console.error(`Proxy API error during AI symbol sentiment for ${symbol}:`, error);
        return 'N/A';
    }
};
