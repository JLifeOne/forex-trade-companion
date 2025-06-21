import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js'; // Import the UTC plugin
import axios from 'axios';
import { NewsEvent } from '../types';

dayjs.extend(utc); // Extend dayjs with the UTC plugin

const FF_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

interface RawNewsEvent {
  title: string;
  country: string; // Currency code e.g., "USD"
  date: string;    // Full ISO timestamp e.g., "2024-07-22T02:30:00-04:00"
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast?: string;
  previous?: string;
  actual?: string;
}

// Simple in-memory cache
interface NewsCache {
  data: NewsEvent[] | null;
  timestamp: number;
}
const newsCache: NewsCache = { data: null, timestamp: 0 };
const NEWS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Static fallback mock data with fixed, predictable times
const MOCK_NEWS_EVENTS_STATIC: NewsEvent[] = [
  {
    id: 'mock-static-usd-fomc',
    time: dayjs.utc().set('hour', 18).set('minute', 0).set('second', 0).toISOString(), // Today 18:00 UTC
    currency: 'USD',
    title: 'FOMC Statement (Static Fallback)',
    impact: 'High',
  },
  {
    id: 'mock-static-eur-ecb',
    time: dayjs.utc().add(1, 'day').set('hour', 12).set('minute', 30).set('second', 0).toISOString(), // Tomorrow 12:30 UTC
    currency: 'EUR',
    title: 'ECB Press Conference (Static Fallback)',
    impact: 'High',
  },
  {
    id: 'mock-static-gbp-retail',
    time: dayjs.utc().add(2, 'days').set('hour', 8).set('minute', 30).set('second', 0).toISOString(), // Day after tomorrow 08:30 UTC
    currency: 'GBP',
    title: 'Retail Sales m/m (Static Fallback)',
    impact: 'Medium',
  },
    {
    id: 'mock-static-jpy-boj',
    time: dayjs.utc().add(1, 'day').set('hour', 23).set('minute', 50).set('second', 0).toISOString(), // Tomorrow 23:50 UTC
    currency: 'JPY',
    title: 'BOJ Outlook Report (Static Fallback)',
    impact: 'Medium',
  },
];


export const fetchForexFactoryNews = async (): Promise<NewsEvent[]> => {
  const now = Date.now();
  if (newsCache.data && (now - newsCache.timestamp < NEWS_CACHE_DURATION_MS)) {
    console.info("[ForexFactoryService] Returning cached news data.");
    return newsCache.data;
  }

  try {
    console.info(`[ForexFactoryService] Attempting to fetch live news from: ${FF_CALENDAR_URL}`);
    const response = await axios.get<RawNewsEvent[]>(FF_CALENDAR_URL, {
      headers: { "User-Agent": "ForexTradingCompanion/1.0 (axios)" },
      timeout: 10000, // 10 seconds timeout
    });

    const rawEvents = response.data;
    if (!Array.isArray(rawEvents)) {
        console.warn("[ForexFactoryService] Live news data received is not an array. Will attempt fallback.");
        throw new Error("Invalid data format received from API.");
    }

    const transformedEvents: NewsEvent[] = rawEvents
      .filter(rawEvent => rawEvent.impact !== 'Holiday' && dayjs(rawEvent.date).isValid())
      .map((rawEvent, index) => {
        let impact: 'High' | 'Medium' | 'Low';
        if (rawEvent.impact === 'High' || rawEvent.impact === 'Medium' || rawEvent.impact === 'Low') {
          impact = rawEvent.impact;
        } else {
          impact = 'Low'; 
        }
        
        return {
          id: `ff-${rawEvent.country}-${rawEvent.title.replace(/[\s\W]+/g, '-').toLowerCase()}-${dayjs(rawEvent.date).unix()}-${index}`,
          time: dayjs(rawEvent.date).toISOString(), 
          currency: rawEvent.country,
          title: rawEvent.title,
          impact: impact,
        };
      });
    
    const sortedEvents = transformedEvents.sort((a, b) => 
        dayjs(a.time).valueOf() - dayjs(b.time).valueOf()
    );

    newsCache.data = sortedEvents;
    newsCache.timestamp = now;
    console.info("[ForexFactoryService] Successfully fetched and cached live news.");
    return sortedEvents;

  } catch (error: any) {
    const errorTimestamp = dayjs().format('YYYY-MM-DDTHH:mm:ssZ');
    const logMessagePrefix = `[ForexFactoryService][${errorTimestamp}]`;
    let detailedLogMessage = `${logMessagePrefix} Attempt to fetch live news from ${FF_CALENDAR_URL} failed. `;

    if (axios.isAxiosError(error)) {
        detailedLogMessage += `Axios Error: Message: "${error.message}", Code: ${error.code || 'N/A'}, Status: ${error.response?.status || 'N/A'}. `;
        if (error.response?.status === 429) {
            detailedLogMessage += "The service might be rate-limited. ";
        } else if (error.code === 'ERR_NETWORK' || (error.message && error.message.toLowerCase().includes('network error'))) {
             detailedLogMessage += "This is often due to client-side cross-origin restrictions (CORS) or general internet connectivity issues. The external server may not be configured to allow requests from this application's domain. ";
        }
    } else {
        detailedLogMessage += `Non-Axios Error: Message: "${error.message || 'Unknown fetch error'}". `;
    }

    if (newsCache.data && newsCache.data.length > 0) {
        detailedLogMessage += "Proceeding with STALE CACHED data as a fallback.";
        console.warn(detailedLogMessage);
        return newsCache.data;
    }
    
    detailedLogMessage += "No cached data available. Proceeding with STATIC MOCK example news events as a fallback.";
    console.warn(detailedLogMessage);
    
    // Return static mock data, ensuring time is a valid ISO string
    return MOCK_NEWS_EVENTS_STATIC.map(event => ({
        ...event,
        time: dayjs(event.time).toISOString(), 
    }));
  }
};