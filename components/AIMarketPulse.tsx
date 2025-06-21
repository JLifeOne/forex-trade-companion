
import React, { useState, useEffect, useCallback } from 'react';
import { FaBrain, FaSync, FaExclamationCircle } from 'react-icons/fa';
import { getMarketCommentary } from '../services/geminiService';
import { MarketCommentary } from '../types';

const AIMarketPulse: React.FC = () => {
  const [commentary, setCommentary] = useState<MarketCommentary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMarketCommentary();
      setCommentary(result);
    } catch (e: any) {
      setError("Failed to fetch market pulse.");
      console.error("Market Pulse fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommentary();
    const intervalId = setInterval(fetchCommentary, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(intervalId);
  }, [fetchCommentary]);

  return (
    <div className="bg-gray-700 rounded-lg shadow-md p-3 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-indigo-300 flex items-center">
          <span className="mr-2 text-indigo-400"><FaBrain /></span>
          AI Market Pulse
        </h3>
        <button
          onClick={fetchCommentary}
          disabled={isLoading}
          className="text-xs text-gray-400 hover:text-indigo-300 disabled:opacity-50 p-1 rounded hover:bg-gray-600"
          aria-label="Refresh market pulse"
        >
          <span className={isLoading ? 'animate-spin' : ''}><FaSync /></span>
        </button>
      </div>
      {isLoading && !commentary && (
        <p className="text-xs text-gray-400 animate-pulse">Fetching latest pulse...</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center">
          <span className="mr-1"><FaExclamationCircle /></span> {error}
        </p>
      )}
      {!isLoading && !error && commentary && (
        <p className="text-xs text-gray-300 leading-relaxed">
          {commentary.commentary}
          <span className="block text-right text-gray-500 text-[10px] mt-1">
            As of: {new Date(commentary.timestamp).toLocaleTimeString()}
          </span>
        </p>
      )}
      {!isLoading && !error && !commentary && (
         <p className="text-xs text-gray-400">No market pulse data available at the moment.</p>
      )}
    </div>
  );
};

export default AIMarketPulse;
