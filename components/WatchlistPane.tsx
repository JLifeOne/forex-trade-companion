import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { WatchlistItem } from '../types';
import { addSymbolToWatchlist, removeSymbolFromWatchlist, fetchSentimentForSymbol, refreshAllWatchlistSentiments } from '../store/watchlistSlice';
import { FaEye, FaPlus, FaTrash, FaSync, FaSpinner, FaExclamationCircle, FaArrowUp, FaArrowDown, FaMinusCircle } from 'react-icons/fa';
import moment from 'moment';

const WatchlistPaneComponent: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const watchlistItems = useSelector((state: RootState) => state.watchlist.items);
  const globalStatus = useSelector((state: RootState) => state.watchlist.globalStatus);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    // Optionally fetch all sentiments on initial load if desired
    // dispatch(refreshAllWatchlistSentiments());
  }, [dispatch]);

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      dispatch(addSymbolToWatchlist(newSymbol.trim()));
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (id: string) => {
    dispatch(removeSymbolFromWatchlist(id));
  };

  const handleRefreshSymbol = (id: string) => {
    dispatch(fetchSentimentForSymbol(id));
  };
  
  const handleRefreshAll = () => {
    dispatch(refreshAllWatchlistSentiments());
  };

  const getSentimentDisplay = (item: WatchlistItem) => {
    if (item.sentimentStatus === 'loading') {
      return <span className="text-xs text-yellow-400 flex items-center"><span className="animate-spin mr-1"><FaSpinner /></span> Loading...</span>;
    }
    if (item.sentimentStatus === 'failed') {
      return <span className="text-xs text-red-400 flex items-center" title="Failed to load sentiment"><span className="mr-1"><FaExclamationCircle /></span> Error</span>;
    }
    switch (item.aiSentiment) {
      case 'Bullish':
        return <span className="text-xs text-green-400 font-semibold flex items-center"><span className="mr-1"><FaArrowUp /></span>Bullish</span>;
      case 'Bearish':
        return <span className="text-xs text-red-400 font-semibold flex items-center"><span className="mr-1"><FaArrowDown /></span>Bearish</span>;
      case 'Neutral':
        return <span className="text-xs text-gray-400 font-semibold flex items-center"><span className="mr-1"><FaMinusCircle /></span>Neutral</span>;
      default:
        return <span className="text-xs text-gray-500">N/A</span>;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaEye /></span>
          Currency Watchlist
        </h2>
        <button
          onClick={handleRefreshAll}
          disabled={globalStatus === 'loading'}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm flex items-center disabled:opacity-50"
        >
          {globalStatus === 'loading' ? <span className="animate-spin mr-1"><FaSpinner /></span> : <span className="mr-1"><FaSync /></span>}
          Refresh All
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="e.g., EUR/USD, BTC/USD"
          className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        />
        <button
          onClick={handleAddSymbol}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-md shadow-sm flex items-center"
        >
          <span className="mr-1"><FaPlus /></span> Add
        </button>
      </div>

      {watchlistItems.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Your watchlist is empty. Add some currency pairs to track.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {watchlistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-700 p-3 rounded-lg shadow-sm hover:bg-gray-600/70 transition-colors"
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-100">{item.symbol}</span>
                <div className="mt-1">
                    {getSentimentDisplay(item)}
                </div>
                 {item.lastUpdated && item.sentimentStatus !== 'loading' && item.sentimentStatus !== 'failed' && (
                    <p className="text-xs text-gray-500 mt-px">
                        Updated: {moment(item.lastUpdated).fromNow()}
                    </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRefreshSymbol(item.id)}
                  disabled={item.sentimentStatus === 'loading'}
                  className="text-blue-400 hover:text-blue-300 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh sentiment"
                >
                  {item.sentimentStatus === 'loading' ? <span className="animate-spin"><FaSpinner /></span> : <FaSync />}
                </button>
                <button
                  onClick={() => handleRemoveSymbol(item.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Remove from watchlist"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(WatchlistPaneComponent);