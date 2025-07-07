import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/rootReducer';
import { JournalEntry } from '../types';

const AnalyticsPanel: React.FC = () => {
  const journalEntries = useSelector((state: RootState) => state.journal.entries);

  const totalTrades = Object.values(journalEntries).reduce((acc, entry) => acc + entry.trades.length, 0);
  const winningTrades = Object.values(journalEntries).reduce((acc, entry) => acc + entry.trades.filter(t => t.pnl && t.pnl > 0).length, 0);
  const losingTrades = Object.values(journalEntries).reduce((acc, entry) => acc + entry.trades.filter(t => t.pnl && t.pnl < 0).length, 0);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Performance Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-white">{totalTrades}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Winning Trades</p>
          <p className="text-2xl font-bold text-green-500">{winningTrades}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Losing Trades</p>
          <p className="text-2xl font-bold text-red-500">{losingTrades}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-indigo-400">{winRate.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;