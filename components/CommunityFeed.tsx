
import React, { useEffect, useState } from 'react';
import { CommunityEntry } from '../types';
import { fetchPublicEntries, likeEntry as mockLikeEntry } from '../services/mockCommunityService';
import moment from 'moment';
import { FaUsers, FaThumbsUp, FaComment, FaUserCircle } from 'react-icons/fa';

const CommunityFeedComponent: React.FC = () => {
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPublicEntries();
        setEntries(data);
      } catch (error) {
        console.error("Failed to fetch community feed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeed();
  }, []);

  const handleLike = async (id: string) => {
    // Optimistic update
    setEntries(prevEntries =>
      prevEntries.map(e => (e.id === id ? { ...e, likes: (e.likes || 0) + 1, likedByUser: true } : e)) // likedByUser is a temp client-side state
    );
    try {
      await mockLikeEntry(id);
      // If API call fails, revert optimistic update (not shown here for brevity)
    } catch (error) {
      console.error("Failed to like entry:", error);
      // Revert optimistic update
       setEntries(prevEntries =>
        prevEntries.map(e => (e.id === id ? { ...e, likes: Math.max(0, (e.likes || 1) - 1), likedByUser: false } : e))
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-indigo-400"><FaUsers /></span>
        Community Feed (Mock)
      </h2>

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading community feed...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No public entries yet. Be the first to share!</div>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-400"><FaUserCircle size={24} /></span>
                  <span className="font-semibold text-gray-100">{entry.username}</span>
                </div>
                <span className="text-xs text-gray-400">{moment(entry.date).fromNow()}</span>
              </div>

              {entry.strategyTemplate && (
                <p className="text-sm text-gray-300 mb-2 whitespace-pre-line">{entry.strategyTemplate}</p>
              )}

              {entry.pnl !== undefined && (
                <p className={`text-xs font-medium mb-3 ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Day P&L: ${entry.pnl.toFixed(2)}
                </p>
              )}

              <div className="flex items-center space-x-6 pt-2 border-t border-gray-600">
                <button
                  onClick={() => handleLike(entry.id)}
                  className={`flex items-center space-x-1 text-sm transition-colors ${entry.likedByUser ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-400 hover:text-indigo-400'}`}
                  aria-label="Like post"
                >
                  <FaThumbsUp />
                  <span>{entry.likes || 0}</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-gray-400 hover:text-indigo-400 transition-colors" aria-label="Comment on post">
                  <FaComment />
                  <span>{entry.comments?.length || 0}</span>
                </button>
                {/* Add share button or other actions here */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CommunityFeedComponent);
