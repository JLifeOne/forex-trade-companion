
import React, { useEffect, useState } from 'react';
import { LeaderboardUser } from '../types';
import { fetchLeaderboard as fetchMockLeaderboard } from '../services/mockCommunityService';
import { FaTrophy, FaUserCircle } from 'react-icons/fa';

const LeaderboardComponent: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMockLeaderboard();
        setLeaders(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  const getRankColor = (rank: number): string => {
    if (rank === 0) return 'text-yellow-400'; // Gold for 1st
    if (rank === 1) return 'text-gray-300';  // Silver for 2nd
    if (rank === 2) return 'text-yellow-600';// Bronze for 3rd
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-yellow-400"><FaTrophy /></span>
        Trader Leaderboard (Mock)
      </h2>

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>
      ) : leaders.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Leaderboard is empty.</div>
      ) : (
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="p-3 font-medium text-center w-16">Rank</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium text-right">Win Rate</th>
                <th className="p-3 font-medium text-right">Monthly PnL ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leaders.map((leader, index) => (
                <tr key={leader.userId} className="hover:bg-gray-700/50 transition-colors">
                  <td className={`p-3 font-bold text-center ${getRankColor(index)}`}>
                    {index < 3 ? <span className="inline-block mb-1"><FaTrophy /></span> : null} {index + 1}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className={`${getRankColor(index)}`}><FaUserCircle size={20} /></span>
                      <span className="font-medium text-gray-100">{leader.username}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">{(leader.winRate * 100).toFixed(1)}%</td>
                  <td className={`p-3 text-right font-bold font-mono ${leader.monthlyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {leader.monthlyPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default React.memo(LeaderboardComponent);
