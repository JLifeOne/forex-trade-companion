
import React, { useState, useEffect } from 'react';
import { placeOrder as placeMockOrder } from '../services/mockBrokerService'; // Using mock service
import { FaTimes, FaPaperPlane, FaDollarSign, FaChartLine as FaStopLoss, FaBullseye as FaTakeProfit } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addToast } from '../store/toastSlice';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  initialSymbol?: string; // For pre-filling symbol from AI Signal
  initialNotes?: string; // For potential notes from AI Signal
}

const OrderModalComponent: React.FC<OrderModalProps> = ({ visible, onClose, initialSymbol = 'EUR/USD', initialNotes }) => {
  const dispatch: AppDispatch = useDispatch();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [size, setSize] = useState<number>(0.01);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [notes, setNotes] = useState(initialNotes || '');

  useEffect(() => {
    if (visible) {
        setSymbol(initialSymbol || 'EUR/USD');
        setNotes(initialNotes || '');
        // Reset other fields if needed, or retain last entry. For now, retain.
        // setSide('buy');
        // setSize(0.01);
        // setStopLoss(0);
        // setTakeProfit(0);
        // setOrderType('market');
        // setLimitPrice(0);
    }
  }, [visible, initialSymbol, initialNotes]);


  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      await placeMockOrder({
        symbol,
        side,
        size,
        sl: stopLoss > 0 ? stopLoss : undefined,
        tp: takeProfit > 0 ? takeProfit : undefined
      });
      dispatch(addToast({ message: `Mock order placed successfully for ${symbol}!`, type: 'success' }));
      onClose();
    } catch (error: any) {
      dispatch(addToast({ message: `Order placement failed: ${error.message}`, type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-gray-800 shadow-2xl rounded-lg w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-300">Place Trade Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close order modal"
          >
            <FaTimes size={20}/>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Symbol */}
           <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              placeholder="e.g. EUR/USD"
            />
          </div>
          {/* Order Type */}
          <div>
            <label htmlFor="orderType" className="block text-sm font-medium text-gray-300 mb-1">Order Type</label>
            <select
              id="orderType"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'market'|'limit'|'stop')}
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            >
              <option value="market">Market Order</option>
              <option value="limit" disabled>Limit Order (WIP)</option>
              <option value="stop" disabled>Stop Order (WIP)</option>
            </select>
          </div>

          {/* Side (Buy/Sell) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Side</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setSide('buy')}
                    className={`py-2 px-4 rounded-md font-medium transition-colors ${side === 'buy' ? 'bg-green-500 text-white ring-2 ring-green-300' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >Buy</button>
                <button
                    onClick={() => setSide('sell')}
                    className={`py-2 px-4 rounded-md font-medium transition-colors ${side === 'sell' ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >Sell</button>
            </div>
          </div>

          {/* Size (Lots) */}
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <span className="mr-1 text-indigo-400"><FaDollarSign /></span> Size (Lots)
            </label>
            <input
              type="number"
              id="size"
              value={size}
              onChange={(e) => setSize(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0.01"
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>

          {(orderType === 'limit' || orderType === 'stop') && (
             <div>
                <label htmlFor="limitPrice" className="block text-sm font-medium text-gray-300 mb-1">Entry Price</label>
                <input
                type="number"
                id="limitPrice"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                step="0.00001"
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
            </div>
          )}

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="mr-1 text-red-400"><FaStopLoss /></span> Stop Loss (Price)
              </label>
              <input
                type="number"
                id="stopLoss"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                step="0.00001"
                placeholder="Optional"
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="mr-1 text-green-400"><FaTakeProfit /></span> Take Profit (Price)
              </label>
              <input
                type="number"
                id="takeProfit"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                step="0.00001"
                placeholder="Optional"
                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>
           {notes && (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (from AI Signal)</label>
                <p className="text-xs text-gray-400 bg-gray-700 p-2 rounded-md">{notes}</p>
            </div>
           )}
           <p className="text-xs text-gray-400 text-center">Mock Broker: Orders are simulated and not sent to a live market.</p>
        </div>

        <div className="p-4 border-t border-gray-700 mt-auto">
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || size <=0 || !symbol}
            className={`w-full font-semibold py-3 px-4 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center
              ${side === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="mr-2"><FaPaperPlane /></span>
            )}
            {isSubmitting ? 'Placing Order...' : `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OrderModalComponent);
    