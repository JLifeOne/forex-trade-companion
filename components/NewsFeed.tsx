import React, { useState, useEffect, useCallback } from 'react';
import { NewsEvent } from '../types';
import { fetchForexFactoryNews } from '../services/forexFactoryService'; 
import { FaNewspaper, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaSync } from 'react-icons/fa';
import dayjs from 'dayjs';
// Import dayjs plugins
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);


const NewsFeedComponent: React.FC = () => {
  const [allEvents, setAllEvents] = useState<NewsEvent[]>([]);
  const [displayEvents, setDisplayEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For critical errors from the service itself
  const [isUsingStaticFallback, setIsUsingStaticFallback] = useState<boolean>(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsUsingStaticFallback(false); 
    try {
      const fetchedEvents = await fetchForexFactoryNews(); // This now aims to always return data or cached/mock
      setAllEvents(fetchedEvents);

      if (fetchedEvents.some(e => e.id.startsWith('mock-static-'))) {
        setIsUsingStaticFallback(true);
      }
    } catch (err: any) { 
      // This catch block is now for truly unexpected errors if fetchForexFactoryNews itself fails catastrophically
      // before its own internal error handling can return mock data.
      console.error("NewsFeed.tsx: Critical error from fetchForexFactoryNews service:", err);
      setError(err.message || "A critical error occurred while loading news.");
      setAllEvents([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    // Optional: set an interval to refresh news periodically
    // const intervalId = setInterval(loadNews, 5 * 60 * 1000); // Refresh every 5 mins
    // return () => clearInterval(intervalId);
  }, [loadNews]);

  useEffect(() => {
    const now = dayjs();
    const upcomingOrRecent = allEvents.filter(event => {
      const eventTime = dayjs(event.time); // event.time is a full ISO string
      if (!eventTime.isValid()) return false;
      return eventTime.isBetween(now.subtract(2, 'hours'), now.add(24, 'hours'), null, '[]'); // inclusive
    });
    const sortedDisplayEvents = upcomingOrRecent.sort((a,b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
    setDisplayEvents(sortedDisplayEvents);
  }, [allEvents]);


  const getImpactIcon = (impact: 'High' | 'Medium' | 'Low') => {
    switch (impact) {
      case 'High':
        return <span title="High Impact"><span className="text-red-400"><FaExclamationTriangle /></span></span>;
      case 'Medium':
        return <span title="Medium Impact"><span className="text-yellow-400"><FaInfoCircle /></span></span>;
      case 'Low':
        return <span title="Low Impact"><span className="text-green-400"><FaCheckCircle /></span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaNewspaper /></span>
          Economic News
        </h2>
        <button
            onClick={loadNews}
            disabled={loading}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50"
            aria-label="Refresh news feed"
        >
            {loading ? (
                <span className="animate-spin"><FaSync /></span>
            ) : (
                <FaSync />
            )}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-4">Loading news...</div>
      ) : null}

      {error && !loading && ( 
        <div className="text-center text-red-400 py-4 px-2 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <div className="flex items-center justify-center mb-1">
                 <span className="mr-2"><FaExclamationTriangle size={16}/></span> 
                 <span>Error Loading News</span>
            </div>
           {error}
        </div>
      )}

      {isUsingStaticFallback && !loading && !error && (
        <div className="text-center text-yellow-300 py-3 px-2 text-sm mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
            <div className="flex items-center justify-center mb-1">
                 <span className="mr-2"><FaExclamationTriangle size={16}/></span> 
                 <span>Live News Unavailable</span>
            </div>
           <p>Could not load live news updates. Displaying static fallback information. This may be due to network issues or temporary service unavailability (e.g. CORS). Please check your connection or try refreshing.</p>
        </div>
      )}
      
      {!loading && displayEvents.length === 0 && !error && !isUsingStaticFallback && (
         <div className="text-center text-gray-400 py-4">No relevant news events found for the current window.</div>
      )}

      {!loading && displayEvents.length > 0 && (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {displayEvents.map((event) => (
            <li key={event.id} className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition-colors duration-150 ${event.id.startsWith('mock-static-') ? 'opacity-80 border-l-2 border-yellow-600' : ''}`}>
              <div className="flex items-center space-x-3">
                {getImpactIcon(event.impact)}
                <span className="font-mono text-sm text-indigo-300 w-20">{dayjs(event.time).format('HH:mm A')}</span>
                <span className="text-sm text-gray-300 w-12">{event.currency}</span>
              </div>
              <span className="text-sm text-gray-100 flex-1 text-right px-2">{event.title}</span>
              {event.id.startsWith('mock-static-') && <span className="text-[10px] text-yellow-400 ml-1">(Fallback)</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500 mt-3 text-center">
        News data sourced from nfs.faireconomy.media. Displaying events for the next 24 hours.
      </p>
    </div>
  );
};

export default React.memo(NewsFeedComponent);