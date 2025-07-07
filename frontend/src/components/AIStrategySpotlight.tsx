import React, { useState, useEffect, useCallback } from 'react';
import { FaLightbulb, FaSync, FaExclamationCircle, FaBullseye, FaFileAlt, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { generateStrategyIdea } from '../services/geminiService';
import { StrategyIdea, NewsEvent } from '../types';
import { TRADING_STYLES } from '../constants';
import { fetchForexFactoryNews } from '../services/forexFactoryService';
import dayjs from 'dayjs';
// Import dayjs plugins
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);


const AIStrategySpotlight: React.FC = () => {
  const [strategy, setStrategy] = useState<StrategyIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(TRADING_STYLES[1]); // Default to Day Trading
  const [highImpactNews, setHighImpactNews] = useState<NewsEvent[]>([]);

  const checkForHighImpactNews = useCallback(async () => {
    try {
        const allNews = await fetchForexFactoryNews();
        const now = dayjs();
        const relevantNews = allNews.filter(event => {
            if (event.impact !== 'High') return false;
            // Assuming event.time is an ISO string, parse with dayjs
            const eventTime = dayjs(event.time);
            if(!eventTime.isValid()) return false;
            // Check news from last 2 hours to next 6 hours
            return eventTime.isBetween(now.subtract(2, 'hours'), now.add(6, 'hours'), null, '[]');
        });
        setHighImpactNews(relevantNews);
    } catch (e) {
        console.warn("Could not check for high impact news for Strategy Spotlight UI:", e);
        setHighImpactNews([]);
    }
  }, []);


  const fetchStrategy = useCallback(async (style: string) => {
    setIsLoading(true);
    setError(null);
    await checkForHighImpactNews(); // Check for news before generating strategy
    try {
      const result = await generateStrategyIdea(style);
      setStrategy(result);
    } catch (e: unknown) {
      setError("Failed to generate strategy idea.");
      console.error("Strategy generation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [checkForHighImpactNews]);

  useEffect(() => {
    fetchStrategy(selectedStyle);
  }, [fetchStrategy, selectedStyle]);

  const handleNewIdea = () => {
    fetchStrategy(selectedStyle);
  };

  const DetailSection: React.FC<{ title: string; content?: string; icon: React.ReactNode; }> = ({ title, content, icon }) => {
    if (!content) return null;
    return (
        <div className="mt-3">
            <h5 className="text-xs font-semibold text-indigo-400 mb-1 flex items-center">
                {icon} <span className="ml-2">{title}</span>
            </h5>
            <p className="text-xs text-gray-300 whitespace-pre-line bg-gray-700 p-2 rounded-md">{content}</p>
        </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaLightbulb /></span>
          AI Strategy Spotlight
        </h2>
        <div className="flex items-center gap-2">
          <select 
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="bg-gray-700 text-xs text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={isLoading}
          >
            {TRADING_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
          </select>
          <button
            onClick={handleNewIdea}
            disabled={isLoading}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center"
            aria-label="Get new strategy idea"
          >
            <span className={isLoading ? 'animate-spin mr-1' : 'mr-1'}><FaSync /></span> New Idea
          </button>
        </div>
      </div>
      {highImpactNews.length > 0 && (
        <div className="mb-3 mt-1 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md border border-yellow-500/30 flex items-center">
            <span className="mr-2"><FaExclamationTriangle size={14}/></span>
            <span>High-impact news active: {highImpactNews.map(n => `${n.title} (${n.currency})`).join(', ')}. Strategies should account for this.</span>
        </div>
      )}

      {isLoading && (
        <div className="bg-gray-700 p-4 rounded-lg shadow-sm animate-pulse h-60 flex items-center justify-center mt-2">
            <p className="text-gray-400">Generating strategy idea for {selectedStyle}...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-sm flex items-center mt-2">
          <span className="mr-2"><FaExclamationCircle /></span> {error}
        </div>
      )}
      {!isLoading && !error && strategy && (
        <div className="bg-gray-750 p-4 rounded-lg shadow-inner border border-gray-600 mt-2">
          <h3 className="text-md font-bold text-yellow-400 mb-1">{strategy.strategyName}</h3>
          <p className="text-xs text-gray-400 mb-2">Style: {strategy.tradingStyle} | Pairs: {strategy.recommendedPairs} | Timeframes: {strategy.timeframes}</p>
          
          <p className="text-sm text-gray-200 mb-3">{strategy.description}</p>

          <DetailSection icon={<FaBullseye/>} title="Entry Conditions" content={strategy.entryConditions} />
          <DetailSection icon={<FaChartLine/>} title="Exit Conditions" content={strategy.exitConditions} />
          <DetailSection icon={<FaFileAlt/>} title="Core Logic" content={strategy.coreLogic} />
        </div>
      )}
      {!isLoading && !error && !strategy && (
         <p className="text-gray-400 text-center py-4 mt-2">No strategy idea available. Try selecting a style and clicking "New Idea".</p>
      )}
       <p className="text-xs text-gray-500 mt-4 text-center">AI-generated strategies are for educational purposes and require thorough backtesting and risk assessment before use.</p>
    </div>
  );
};

export default AIStrategySpotlight;