
import React, { useEffect, useState } from 'react';
import { getTradeHistory as fetchMockTradeHistory } from '../services/mockBrokerService'; // Using mock service
import { Trade } from '../types';
import moment from 'moment';
import { FaHistory, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface TradeHistoryProps {
  // Props if this were a modal, for standalone page it might not need these
  // visible?: boolean;
  // onClose?: () => void;
}

const TradeHistoryComponent: React.FC<TradeHistoryProps> = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTradeHistory = async () => {
      setIsLoading(true);
      try {
        const history = await fetchMockTradeHistory();
        setTrades(history);
      } catch (error) {
        console.error("Failed to fetch trade history:", error);
        // Optionally set an error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };
    loadTradeHistory();
  }, []);

  // if (props.visible === false) return null; // For modal usage

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-indigo-400"><FaHistory /></span>
        Trade History (Mock)
      </h2>

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading trade history...</div>
      ) : trades.length === 0 ? (
         <div className="text-center text-gray-400 py-8">No trades found in history.</div>
      ) : (
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full text-sm text-left text-gray-300 table-fixed">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Symbol</th>
                <th className="p-3 font-medium">Side</th>
                <th className="p-3 font-medium text-right">Size</th>
                <th className="p-3 font-medium text-right">Open Price</th>
                <th className="p-3 font-medium text-right">Close Price</th>
                <th className="p-3 font-medium text-right">SL</th>
                <th className="p-3 font-medium text-right">TP</th>
                <th className="p-3 font-medium text-right">P&L ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 whitespace-nowrap">{moment(trade.openTime).format('YYYY-MM-DD HH:mm')}</td>
                  <td className="p-3 font-medium text-indigo-300">{trade.symbol}</td>
                  <td className={`p-3 font-semibold flex items-center ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.side === 'buy' ? <span className="mr-1"><FaArrowUp /></span> : <span className="mr-1"><FaArrowDown /></span>}
                    {trade.side.toUpperCase()}
                  </td>
                  <td className="p-3 text-right">{trade.size.toFixed(2)}</td>
                  <td className="p-3 text-right">{trade.openPrice.toFixed(trade.symbol.toUpperCase().includes('JPY') ? 3: 5)}</td>
                  <td className="p-3 text-right">{trade.closePrice ? trade.closePrice.toFixed(trade.symbol.toUpperCase().includes('JPY') ? 3: 5) : '-'}</td>
                  <td className="p-3 text-right">{trade.sl ? trade.sl.toFixed(trade.symbol.toUpperCase().includes('JPY') ? 3: 5) : '-'}</td>
                  <td className="p-3 text-right">{trade.tp ? trade.tp.toFixed(trade.symbol.toUpperCase().includes('JPY') ? 3: 5) : '-'}</td>
                  <td className={`p-3 font-bold text-right ${ (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl !== undefined ? trade.pnl.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       {/* Add onClose button if used as modal */}
       {/* {props.onClose && (
            <div className="mt-6 text-right">
                <button
                    onClick={props.onClose}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium py-2 px-4 rounded-md shadow-sm"
                >
                    Close
                </button>
            </div>
       )} */}
    </div>
  );
};

export default React.memo(TradeHistoryComponent);
