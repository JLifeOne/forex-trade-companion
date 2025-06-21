import React, { useState } from 'react';
import { STRATEGIES } from '../constants';
import type { Strategy } from '../types'; // Strategy type imported from types.ts
import { FaTimes, FaPlayCircle, FaChartLine } from 'react-icons/fa';

interface BacktestModalProps {
  visible: boolean;
  onClose: () => void;
}

interface BacktestResults {
  winRate: number;
  trades: number;
  avgReturnRatio: number; // e.g., 1.5 for 1:1.5 R:R
  maxDrawdown: number; // Percentage
  profitFactor: number;
}

// Mock backtester function
const runMockBacktest = (strategyId: string): Promise<BacktestResults> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        winRate: Math.random() * 0.3 + 0.4, // 40-70%
        trades: Math.floor(Math.random() * 100) + 50, // 50-150 trades
        avgReturnRatio: Math.random() * 1 + 1, // 1:1 to 1:2 R:R
        maxDrawdown: Math.random() * 0.15 + 0.05, // 5-20%
        profitFactor: Math.random() * 1 + 1, // 1.0 to 2.0
      });
    }, 1500); // Simulate delay
  });
};


const BacktestModalComponent: React.FC<BacktestModalProps> = ({ visible, onClose }) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(STRATEGIES[0]?.id || '');
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunBacktest = async () => {
    if (!selectedStrategyId) return;
    setIsLoading(true);
    setResults(null);
    const res = await runMockBacktest(selectedStrategyId);
    setResults(res);
    setIsLoading(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-gray-800 shadow-2xl rounded-lg w-full max-w-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
            <span className="mr-2 text-indigo-400"><FaChartLine /></span> Strategy Backtester (Mock)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close backtest modal"
          >
            <FaTimes size={20}/>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="strategySelect" className="block text-sm font-medium text-gray-300 mb-1">Select Strategy:</label>
            <select
              id="strategySelect"
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              disabled={isLoading}
            >
              {STRATEGIES.map((s: Strategy) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Placeholder for parameters - this would be complex */}
          <div className="text-sm text-gray-400 p-3 bg-gray-700/50 rounded-md">
            Future: Add parameters like date range, symbol, risk settings. This is a simplified mock.
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isLoading || !selectedStrategyId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="mr-2"><FaPlayCircle /></span>
            )}
            {isLoading ? 'Running Backtest...' : 'Run Backtest'}
          </button>

          {results && !isLoading && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow">
              <h4 className="text-md font-semibold text-indigo-300 mb-3">Backtest Results:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-300">Win Rate:</div>
                <div className="text-white font-medium">{(results.winRate * 100).toFixed(1)}%</div>

                <div className="text-gray-300">Total Trades:</div>
                <div className="text-white font-medium">{results.trades}</div>

                <div className="text-gray-300">Avg. R:R Ratio:</div>
                <div className="text-white font-medium">1 : {results.avgReturnRatio.toFixed(2)}</div>

                <div className="text-gray-300">Max Drawdown:</div>
                <div className="text-white font-medium">{(results.maxDrawdown * 100).toFixed(1)}%</div>

                <div className="text-gray-300">Profit Factor:</div>
                <div className="text-white font-medium">{results.profitFactor.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-700 text-right">
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BacktestModalComponent);