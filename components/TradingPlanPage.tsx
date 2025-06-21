import React, { useState, useEffect, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadPlan, updatePlan, savePlan } from '../store/tradingPlanSlice';
import { TradingPlan } from '../types';
import { FaClipboardList, FaSave, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { addToast } from '../store/toastSlice';

const SESSION_OPTIONS: Array<'Tokyo' | 'London' | 'NewYork'> = ['Tokyo', 'London', 'NewYork'];

const TradingPlanPageComponent: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const plan = useSelector((state: RootState) => state.tradingPlan.plan);
  const status = useSelector((state: RootState) => state.tradingPlan.status);
  const error = useSelector((state: RootState) => state.tradingPlan.error);

  // Local form state to allow for batch updates or revert, though slice updates directly now.
  const [formData, setFormData] = useState<TradingPlan>(plan);

  useEffect(() => {
    dispatch(loadPlan());
  }, [dispatch]);

  useEffect(() => {
    // Sync local form data if Redux state changes (e.g., initial load)
    setFormData(plan);
  }, [plan]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
        const checkbox = e.target as HTMLInputElement;
        const sessionName = checkbox.value as 'Tokyo' | 'London' | 'NewYork';
        const currentSessions = formData.sessionFocus || [];
        const newSessions = checkbox.checked
            ? [...currentSessions, sessionName]
            : currentSessions.filter(s => s !== sessionName);
        setFormData(prev => ({ ...prev, sessionFocus: newSessions }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePreferredPairsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const pairsArray = e.target.value.split(',').map(p => p.trim().toUpperCase()).filter(p => p);
    setFormData(prev => ({ ...prev, preferredPairs: pairsArray }));
  };

  const handleSavePlan = () => {
    dispatch(updatePlan(formData)); // Dispatch all changes from local form
    // The slice now handles saving to localStorage internally on updatePlan or savePlan.
    // We can also dispatch savePlan if we want to show loading state explicitly for save.
    dispatch(savePlan()); 
    dispatch(addToast({ message: 'Trading plan saved!', type: 'success' }));
  };

  const renderTextarea = (name: keyof TradingPlan, label: string, placeholder: string, rows: number = 3) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <textarea
        id={name}
        name={name}
        value={String(formData[name] || '')}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
      />
    </div>
  );

  const renderInput = (name: keyof TradingPlan, label: string, type: string, placeholder?: string, step?: string) => (
     <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={String(formData[name] || (type === 'number' ? 0 : ''))}
        onChange={type === 'number' ? handleChange : handlePreferredPairsChange}
        placeholder={placeholder}
        step={step}
        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
      />
    </div>
  );


  if (status === 'loading' && !formData.overallStrategy) { // Show loading only on initial empty load
    return <div className="text-center text-gray-400 py-8">Loading trading plan...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-indigo-400"><FaClipboardList /></span>
        My Trading Plan
      </h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-4 text-sm flex items-center">
          <span className="mr-2"><FaExclamationTriangle /></span> Error: {error}
        </div>
      )}
      
       <div className="bg-indigo-800/30 border border-indigo-600 text-indigo-200 p-3 rounded-md mb-6 text-sm flex items-start">
            <span className="mr-3 pt-1 text-indigo-400"><FaInfoCircle size={18}/></span>
            <div>
                <p className="font-semibold">This is your personal trading blueprint.</p>
                <p className="mt-1">Define your strategy, risk, and rules. Review and update it regularly. The AI Chat Assistant can help you refine these sections.</p>
            </div>
        </div>


      <div className="space-y-6">
        {renderTextarea('overallStrategy', 'Overall Strategy / Edge', 'Describe your core trading methodology, what makes it profitable?', 4)}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderInput('maxDailyLossPercent', 'Max Daily Loss (% of Capital)', 'number', 'e.g., 2 for 2%', '0.1')}
          {renderInput('riskPerTradePercent', 'Max Risk Per Trade (% of Capital)', 'number', 'e.g., 1 for 1%', '0.1')}
        </div>

        {renderInput('preferredPairs', 'Preferred Currency Pairs (comma-separated)', 'text', 'e.g., EUR/USD, GBP/JPY, AUD/USD')}
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Session Focus</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SESSION_OPTIONS.map(session => (
              <label key={session} className="flex items-center space-x-2 text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="sessionFocus"
                  value={session}
                  checked={(formData.sessionFocus || []).includes(session)}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-400 focus:ring-offset-gray-800"
                />
                <span>{session}</span>
              </label>
            ))}
          </div>
        </div>

        {renderTextarea('keyEntryRules', 'Key Entry Rules', 'Specific conditions or confluences for entering a trade.', 4)}
        {renderTextarea('keyExitRules', 'Key Exit Rules', 'Specific conditions for taking profit or cutting losses (beyond SL/TP).', 4)}
        {renderTextarea('additionalNotes', 'Additional Notes / Reflections', 'Any other important reminders, mindset notes, or areas for improvement.', 3)}

        <button
          onClick={handleSavePlan}
          disabled={status === 'loading'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center justify-center disabled:opacity-50"
        >
          <span className="mr-2"><FaSave /></span>
          {status === 'loading' ? 'Saving...' : 'Save Trading Plan'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TradingPlanPageComponent);