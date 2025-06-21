import React, { useEffect, useState, useCallback } from 'react';
import { AISignal, NewsEvent } from '../types';
import { getAISignalRecommendations } from '../services/geminiService';
import { getMockVolatilityTrends, VolatilityTrend, VolatilityTrendPoint } from '../utils/mockData'; // Updated import
import { fetchForexFactoryNews } from '../services/forexFactoryService';
import dayjs from 'dayjs';
// Import dayjs plugins
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

import { FaBolt, FaFire, FaSnowflake, FaChartArea, FaExclamationTriangle, FaLayerGroup, FaWaveSquare, FaBullseye, FaTools, FaEdit, FaClipboardList, FaSync } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';


interface AISignalsComponentProps {
    onPlanTrade: (signal: AISignal) => void;
    onLogSignalToJournal: (signal: AISignal) => void;
}

const AISignalsComponent: React.FC<AISignalsComponentProps> = ({ onPlanTrade, onLogSignalToJournal }) => {
  const [volatilityData, setVolatilityData] = useState<Record<'Tokyo' | 'London' | 'NewYork', VolatilityTrend> | null>(null);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isLoadingVolatility, setIsLoadingVolatility] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highImpactNews, setHighImpactNews] = useState<NewsEvent[]>([]);

  const checkForHighImpactNews = useCallback(async () => {
    try {
        const allNews = await fetchForexFactoryNews();
        const now = dayjs();
        const relevantNews = allNews.filter(event => {
            if (event.impact !== 'High') return false;
            // Assuming event.time is an ISO string, parse with dayjs
            const eventTime = dayjs(event.time); 
            if (!eventTime.isValid()) return false;
            // Check news from last 2 hours to next 6 hours
            return eventTime.isBetween(now.subtract(2, 'hours'), now.add(6, 'hours'), null, '[]');
        });
        setHighImpactNews(relevantNews);
    } catch (e) {
        console.warn("Could not check for high impact news for UI indicator:", e);
        setHighImpactNews([]);
    }
  }, []);


  const fetchSignalsData = useCallback(async () => {
    setIsLoadingSignals(true);
    setError(null);
    await checkForHighImpactNews(); 
    try {
      const marketContext = "Currently observing general market conditions. User is interested in short to medium term opportunities across major pairs. Highlight any developing patterns or S/R interactions.";
      const recommendations = await getAISignalRecommendations(marketContext);
      setSignals(recommendations);
    } catch (err: any) {
      setError(err.message || "Failed to fetch AI signals.");
      setSignals([]);
    } finally {
      setIsLoadingSignals(false);
    }
  }, [checkForHighImpactNews]);

  useEffect(() => {
    const fetchVolatility = async () => {
      setIsLoadingVolatility(true);
      await new Promise(resolve => setTimeout(resolve, 800)); 
      setVolatilityData(getMockVolatilityTrends());
      setIsLoadingVolatility(false);
    };

    fetchVolatility();
    fetchSignalsData();
  }, [fetchSignalsData]);

  const getVolatilityIcon = (level: VolatilityTrend['level']) => {
    if (level === 'High') return <span className="text-red-400" title="High Volatility"><FaFire /></span>;
    if (level === 'Medium') return <span className="text-yellow-400" title="Medium Volatility"><FaChartArea /></span>;
    return <span className="text-blue-400" title="Low Volatility"><FaSnowflake /></span>;
  };
  
  const CustomVolatilityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-600 p-2 border border-gray-500 rounded shadow-lg text-xs">
          <p className="label text-indigo-300">{`Time: ${label}`}</p>
          <p style={{ color: payload[0].stroke }}>{`Volatility: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };


  const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-xs text-gray-400 mt-1">
            <span className="mr-2 pt-px text-indigo-400">{icon}</span>
            <span><strong>{label}:</strong> {value}</span>
        </div>
    );
  };


  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaBolt /></span>
          AI Trading Insights
        </h2>
        <button
            onClick={fetchSignalsData}
            disabled={isLoadingSignals}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50"
            title="Refresh AI signals"
        >
            {isLoadingSignals ? <span className="animate-spin inline-block mr-1"><FaSync/></span> : <span className="inline-block mr-1"><FaSync/></span>}
            {isLoadingSignals ? 'Loading...' : 'Refresh'}
        </button>
      </div>
       {highImpactNews.length > 0 && (
            <div className="mb-3 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md border border-yellow-500/30 flex items-center">
                <span className="mr-2"><FaExclamationTriangle size={14}/></span>
                <span>High-impact news active: {highImpactNews.map(n => `${n.title} (${n.currency})`).join(', ')}. Exercise caution.</span>
            </div>
        )}


      {/* Volatility Section */}
      <div className="mb-6 pt-2 border-t border-gray-700/50">
        <h3 className="text-md font-medium text-gray-300 mb-3">Current Session Volatility Trend (Mock)</h3>
        {isLoadingVolatility ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-gray-700 p-3 rounded-lg shadow-sm animate-pulse h-28"></div>)}
          </div>
        ) : volatilityData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(volatilityData) as [string, VolatilityTrend][]).map(([session, data]) => (
              <div key={session} className="bg-gray-700 p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                    {getVolatilityIcon(data.level)}
                    <div>
                        <span className="font-medium text-gray-100 text-sm">{session}</span>
                        <div className="text-xs text-gray-400">Level: {data.level} (Current: {data.value})</div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={data.trend} margin={{ top: 5, right: 5, left: -35, bottom: -10 }}>
                        <CartesianGrid strokeDasharray="2 2" strokeOpacity={0.3} vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomVolatilityTooltip />} cursor={{ stroke: 'rgba(136, 132, 216, 0.2)', strokeWidth: 1 }}/>
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 2, fill: '#8884d8' }} activeDot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Volatility data unavailable.</p>
        )}
      </div>

      {/* Signals Section */}
      <div>
        <h3 className="text-md font-medium text-gray-300 mb-3">AI Generated Signals</h3>
        {isLoadingSignals ? (
          <div className="space-y-3">
             {[1,2].map(i => <div key={i} className="bg-gray-700 p-4 rounded-lg shadow-sm animate-pulse h-36"></div>)}
          </div>
        ) : error ? (
           <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-sm flex items-center">
            <span className="mr-2"><FaExclamationTriangle /></span> {error}
          </div>
        ) : signals.length === 0 ? (
          <p className="text-gray-400">No AI signals available at the moment. Try refreshing.</p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {signals.map((signal) => (
              <div key={signal.id} className="bg-gray-700 p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-indigo-300 mb-1">{signal.title} ({signal.pair})</h4>
                        <p className="text-sm text-gray-300 mb-2 whitespace-pre-line">{signal.description}</p>
                    </div>
                    {signal.confidence && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            signal.confidence === 'High' ? 'bg-green-500/30 text-green-300' :
                            signal.confidence === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' :
                            'bg-red-500/30 text-red-300'
                        }`}>
                            {signal.confidence}
                        </span>
                    )}
                </div>
                <DetailItem icon={<FaLayerGroup/>} label="Key Levels" value={signal.keyLevels} />
                <DetailItem icon={<FaWaveSquare/>} label="Chart Pattern" value={signal.chartPattern} />
                <DetailItem icon={<FaBullseye/>} label="Confirmation" value={signal.confirmationSignals} />
                <DetailItem icon={<FaTools/>} label="Indicators" value={signal.supportingIndicators} />
                <div className="mt-3 pt-3 border-t border-gray-600 flex space-x-2">
                    <button 
                        onClick={() => onPlanTrade(signal)}
                        title="Open Order Modal with this signal's pair"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md shadow-sm flex items-center"
                    >
                       <span className="mr-1"><FaEdit /></span> Plan Trade
                    </button>
                    <button 
                        onClick={() => onLogSignalToJournal(signal)}
                        title="Add this signal's details to your journal"
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium py-1 px-3 rounded-md shadow-sm flex items-center"
                    >
                       <span className="mr-1"><FaClipboardList /></span> Log to Journal
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AISignalsComponent);