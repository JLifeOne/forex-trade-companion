
import React from 'react';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import { STRATEGIES } from '../constants';
import { JournalEntry, Strategy } from '../types'; // Ensure Strategy type is imported
import { FaTimes, FaBookOpen, FaCheckSquare } from 'react-icons/fa';
import { AppDispatch } from '../store';


interface StrategyLibraryProps {
  visible: boolean;
  onClose: () => void;
  onApplyStrategy: (strategy: Strategy) => void; // Changed to pass full Strategy object
}

const StrategyLibraryComponent: React.FC<StrategyLibraryProps> = ({ visible, onClose, onApplyStrategy }) => {
  const dispatch: AppDispatch = useDispatch();

  const handleApplyToJournal = (strategy: Strategy) => {
    onApplyStrategy(strategy); // Pass the full strategy object
    onClose(); // Close the library
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4 print:hidden">
      <div className="bg-gray-800 shadow-2xl rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
            <span className="mr-2 text-indigo-400"><FaBookOpen /></span> Strategy Library
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close strategy library"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-750">
          {STRATEGIES.length === 0 ? (
            <p className="text-gray-400 text-center">No strategies available in the library.</p>
          ) : (
            STRATEGIES.map((strategy) => (
              <div key={strategy.id} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600 hover:shadow-lg transition-shadow">
                <h4 className="text-md font-semibold text-indigo-300 mb-1">{strategy.name}</h4>
                <p className="text-sm text-gray-300 mb-1 whitespace-pre-line">{strategy.description}</p>
                {strategy.typicalPairs && <p className="text-xs text-gray-400 mt-1"><strong>Typical Pairs:</strong> {strategy.typicalPairs}</p>}
                {strategy.keyIndicators && <p className="text-xs text-gray-400 mt-1"><strong>Key Indicators:</strong> {strategy.keyIndicators}</p>}
                {strategy.commonRiskParams && <p className="text-xs text-gray-400 mt-1"><strong>Risk Params:</strong> {strategy.commonRiskParams}</p>}
                <button
                  onClick={() => handleApplyToJournal(strategy)}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm shadow-sm transition-colors flex items-center"
                >
                  <span className="mr-2"><FaCheckSquare /></span> Apply to Today's Journal
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(StrategyLibraryComponent);