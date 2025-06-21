import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { RootState } from '../store/rootReducer';
import { AppDispatch } from '../store';
import { saveJournalEntryToFirestore, prepareAISignalLog, deleteJournalEntryFromFirestore } from '../store/journalSlice';
import { addToast } from '../store/toastSlice';
import { JournalEntry, EmotionTag, Trade, JournalSaveLogEntry, Strategy, User, AISignal } from '../types';
import { STRATEGIES as predefinedStrategiesConstant } from '../constants'; 
import { analyzeSentiment } from '../services/geminiService';
import { FaSave, FaCalendarDay, FaBrain, FaLightbulb, FaTags, FaPlusCircle, FaTrash, FaHistory, FaCloudUploadAlt, FaCloudDownloadAlt } from 'react-icons/fa';

interface JournalPaneProps {
  selectedDateProp?: string; 
  selectedStrategyForJournal?: Strategy; 
}

const JournalPaneComponent: React.FC<JournalPaneProps> = ({ selectedDateProp, selectedStrategyForJournal }) => {
  const [selectedDate, setSelectedDate] = useState(selectedDateProp || moment().format('YYYY-MM-DD'));
  
  // useSelector to get the specific entry for the selectedDate
  const entryData = useSelector((state: RootState) => state.journal.entries[selectedDate]);
  const saveLog = useSelector((state: RootState) => state.journal.saveLog);
  const authUser = useSelector((state: RootState) => state.auth.user);


  const [mindset, setMindset] = useState('');
  const [strategyNotes, setStrategyNotes] = useState('');
  const [strategyTemplate, setStrategyTemplate] = useState(''); 
  const [trades, setTrades] = useState<Trade[]>([]);
  const [emotionTag, setEmotionTag] = useState<EmotionTag | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAppliedStrategyProp, setHasAppliedStrategyProp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (selectedDateProp) {
      setSelectedDate(selectedDateProp);
      setHasAppliedStrategyProp(false); 
    }
  }, [selectedDateProp]);

  useEffect(() => {
    // If entryData is undefined (no entry for this date in Redux store), initialize with empty values.
    // This handles both new entries and cases where data might not be loaded yet.
    const currentEntry = entryData || { mindset: '', strategy: '', trades: [], emotionTag: undefined, strategyTemplate: '' };
    setMindset(currentEntry.mindset);
    
    let initialStrategyNotes = currentEntry.strategy;
    let initialStrategyTemplate = currentEntry.strategyTemplate || '';

    if (selectedStrategyForJournal && !hasAppliedStrategyProp) {
        initialStrategyTemplate = selectedStrategyForJournal.description; 
        
        let detailsToAppend = `\n\n--- Applied Strategy: ${selectedStrategyForJournal.name} ---\n`;
        if (selectedStrategyForJournal.typicalPairs) detailsToAppend += `Typical Pairs: ${selectedStrategyForJournal.typicalPairs}\n`;
        if (selectedStrategyForJournal.keyIndicators) detailsToAppend += `Key Indicators: ${selectedStrategyForJournal.keyIndicators}\n`;
        if (selectedStrategyForJournal.commonRiskParams) detailsToAppend += `Common Risk Params: ${selectedStrategyForJournal.commonRiskParams}\n`;
        detailsToAppend += `--- End Applied Strategy ---`;

        if (!initialStrategyNotes.includes(`--- Applied Strategy: ${selectedStrategyForJournal.name} ---`)) {
             initialStrategyNotes = initialStrategyNotes 
                                ? `${initialStrategyNotes}${detailsToAppend}`
                                : detailsToAppend.trim();
        }
        setHasAppliedStrategyProp(true); 
    }
    
    setStrategyNotes(initialStrategyNotes);
    setStrategyTemplate(initialStrategyTemplate);
    setTrades(currentEntry.trades || []);
    setEmotionTag(currentEntry.emotionTag);
  }, [selectedDate, entryData, selectedStrategyForJournal, hasAppliedStrategyProp]);

  const handleAnalyzeSentiment = async () => {
    if (!mindset && !strategyNotes) {
      dispatch(addToast({ message: 'Please enter some notes before analyzing sentiment.', type: 'info' }));
      return;
    }
    setIsAnalyzing(true);
    const combinedText = `Mindset: ${mindset}. Strategy: ${strategyNotes}. Trades: ${trades.map(t => `${t.side} ${t.symbol} PnL: ${t.pnl || 'N/A'}`).join(', ')}`;
    try {
      const tag = await analyzeSentiment(combinedText);
      setEmotionTag(tag);
      dispatch(addToast({ message: 'Sentiment analysis complete.', type: 'success' }));
    } catch (e) {
      console.error('Sentiment API error:', e);
      setEmotionTag('Unknown');
      dispatch(addToast({ message: 'Sentiment analysis failed.', type: 'error' }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) {
        dispatch(addToast({message: "Please log in to save your journal.", type: "error"}));
        return;
    }
    setIsSaving(true);
    const journalEntryData: JournalEntry = {
      mindset,
      strategy: strategyNotes,
      strategyTemplate,
      trades,
      emotionTag,
    };
    try {
        await dispatch(saveJournalEntryToFirestore({ date: selectedDate, data: journalEntryData })).unwrap();
        // Toast for success is handled in the thunk or slice now
    } catch (error: any) {
        // Toast for error is handled in the thunk or slice now
        // If specific UI update is needed on error here, add it.
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteEntry = async () => {
      if (!authUser) {
        dispatch(addToast({message: "Please log in to delete journal entries.", type: "error"}));
        return;
      }
      if (confirm(`Are you sure you want to delete the journal entry for ${moment(selectedDate).format('MMM D, YYYY')}? This action cannot be undone.`)) {
          setIsSaving(true); // Re-use saving indicator for delete operation
          try {
              await dispatch(deleteJournalEntryFromFirestore({ date: selectedDate })).unwrap();
              // Reset form fields after successful deletion
              setMindset('');
              setStrategyNotes('');
              setStrategyTemplate('');
              setTrades([]);
              setEmotionTag(undefined);
          } catch (error) {
              // Error toast handled in thunk
          } finally {
              setIsSaving(false);
          }
      }
  };

  const handleAddTrade = () => {
    setTrades([...trades, { id: Date.now().toString(), symbol: 'EUR/USD', side: 'buy', size: 0.01, openPrice: 0, openTime: new Date().toISOString() }]);
  };

  const handleTradeChange = <K extends keyof Trade>(index: number, field: K, value: Trade[K]) => {
    const updatedTrades = trades.map((trade, i) => i === index ? { ...trade, [field]: value } : trade);
    setTrades(updatedTrades);
  };

  const handleRemoveTrade = (index: number) => {
    setTrades(trades.filter((_, i) => i !== index));
  };
  
  const handleStrategyTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDesc = e.target.value;
    setStrategyTemplate(selectedDesc);
    if (selectedDesc) { 
      const chosenStrategy = predefinedStrategiesConstant.find(s => s.description === selectedDesc);
      if (chosenStrategy && !strategyNotes.includes(`Strategy: ${chosenStrategy.name}`)) {
         let detailsToAppend = `\n\n--- Selected Strategy: ${chosenStrategy.name} ---\nDescription: ${chosenStrategy.description}\n`;
        if (chosenStrategy.typicalPairs) detailsToAppend += `Typical Pairs: ${chosenStrategy.typicalPairs}\n`;
        if (chosenStrategy.keyIndicators) detailsToAppend += `Key Indicators: ${chosenStrategy.keyIndicators}\n`;
        if (chosenStrategy.commonRiskParams) detailsToAppend += `Common Risk Params: ${chosenStrategy.commonRiskParams}\n`;
        detailsToAppend += `--- End Selected Strategy ---`;

        setStrategyNotes(prevNotes => prevNotes ? `${prevNotes}${detailsToAppend}` : detailsToAppend.trim());
      }
    }
  };

  const handleLogAISignal = (signal: AISignal) => { // Wrapper for component use
    if (!authUser) {
        dispatch(addToast({ message: "Please log in to log AI signals.", type: "error" }));
        return;
    }
    dispatch(prepareAISignalLog({ date: selectedDate, signal, userId: authUser.uid }));
    // After preparing, user should click "Save Entry" to persist this change with other notes.
    dispatch(addToast({ message: `AI Signal '${signal.title}' added to notes. Remember to save the entry.`, type: 'info', duration: 6000 }));
  };


  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaCalendarDay /></span>
          Trading Journal - {moment(selectedDate).format('MMMM Do, YYYY')}
        </h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        />
      </div>
      
      {!authUser && (
         <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-3 rounded-md mb-4 text-sm">
          Please log in to save or load journal entries from the cloud.
        </div>
      )}

      {emotionTag === 'High Emotion' && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-4 text-sm">
          <strong>Warning:</strong> High emotional state detected in your notes. Consider taking a break or reducing risk.
        </div>
      )}
       {emotionTag === 'Low Emotion' && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-md mb-4 text-sm">
          <strong>Note:</strong> Low emotional state detected. This can be positive if it means calmness and discipline.
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="mindset" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
            <span className="mr-2 text-indigo-400"><FaBrain /></span> Mindset & Emotional State
          </label>
          <textarea
            id="mindset"
            className="w-full h-24 bg-gray-700 rounded-md p-3 text-gray-200 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
            placeholder="How are you feeling? Confident, anxious, disciplined, impulsive?"
            value={mindset}
            onChange={(e) => setMindset(e.target.value)}
            disabled={!authUser || isSaving}
          />
        </div>

        <div>
          <label htmlFor="strategy" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
           <span className="mr-2 text-indigo-400"><FaLightbulb /></span> Strategy & Observations
          </label>
          <textarea
            id="strategy"
            className="w-full h-32 bg-gray-700 rounded-md p-3 text-gray-200 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
            placeholder="What's your plan? Market conditions, setups, execution notes, applied AI signals..."
            value={strategyNotes}
            onChange={(e) => setStrategyNotes(e.target.value)}
            disabled={!authUser || isSaving}
          />
        </div>

        <div>
          <label htmlFor="strategyTemplate" className="block text-sm font-medium text-gray-300 mb-1">Strategy Template Used (from Library)</label>
          <select
            id="strategyTemplate"
            value={strategyTemplate}
            onChange={handleStrategyTemplateChange}
            className="w-full bg-gray-700 rounded-md p-3 text-gray-200 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={!authUser || isSaving}
          >
            <option value="">None</option>
            {predefinedStrategiesConstant.map(s => <option key={s.id} value={s.description}>{s.name}</option>)}
          </select>
          {strategyTemplate && (
             <p className="text-xs text-gray-400 mt-1 p-2 bg-gray-700/50 rounded">{strategyTemplate}</p>
          )}
        </div>

        <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <span className="mr-2 text-indigo-400"><FaTags /></span> Trades Logged
            </h3>
            {trades.map((trade, index) => (
                <div key={trade.id} className="bg-gray-700 p-3 rounded-md mb-2 border border-gray-600 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <input type="text" placeholder="Symbol (e.g. EUR/USD)" value={trade.symbol} onChange={e => handleTradeChange(index, 'symbol', e.target.value.toUpperCase())} className="bg-gray-600 p-1 rounded border border-gray-500 text-gray-200" disabled={!authUser || isSaving}/>
                        <select value={trade.side} onChange={e => handleTradeChange(index, 'side', e.target.value as 'buy'|'sell')} className="bg-gray-600 p-1 rounded border border-gray-500 text-gray-200" disabled={!authUser || isSaving}>
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                        <input type="number" placeholder="Size" value={trade.size} onChange={e => handleTradeChange(index, 'size', parseFloat(e.target.value))} className="bg-gray-600 p-1 rounded border border-gray-500 text-gray-200" disabled={!authUser || isSaving}/>
                        <input type="number" placeholder="PnL" value={trade.pnl || ''} onChange={e => handleTradeChange(index, 'pnl', parseFloat(e.target.value))} className="bg-gray-600 p-1 rounded border border-gray-500 text-gray-200" disabled={!authUser || isSaving}/>
                    </div>
                    <button onClick={() => handleRemoveTrade(index)} className="text-red-400 hover:text-red-300 text-xs flex items-center" disabled={!authUser || isSaving}>
                        <span className="mr-1"><FaTrash /></span> Remove Trade
                    </button>
                </div>
            ))}
            <button onClick={handleAddTrade} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center" disabled={!authUser || isSaving}>
                <span className="mr-1"><FaPlusCircle /></span> Add Trade
            </button>
        </div>


        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="flex items-center">
            <button
              onClick={handleAnalyzeSentiment}
              disabled={isAnalyzing || !authUser || isSaving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center disabled:opacity-50"
            >
              {isAnalyzing ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="mr-2"><FaBrain /></span>
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
            </button>
            {emotionTag && !isAnalyzing && (
              <span className={`ml-3 text-sm font-medium px-3 py-1 rounded-full ${
                emotionTag === 'High Emotion' ? 'bg-red-500/30 text-red-300' :
                emotionTag === 'Low Emotion' ? 'bg-green-500/30 text-green-300' :
                emotionTag === 'Neutral Emotion' ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-500/30 text-gray-300'
              }`}>
                AI Tag: {emotionTag}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {entryData && authUser && ( // Show delete button only if there's an entry and user is logged in
                 <button
                    onClick={handleDeleteEntry}
                    disabled={isSaving || !authUser}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center disabled:opacity-50"
                >
                    <span className="mr-2"><FaTrash /></span> Delete Entry
                </button>
            )}
            <button
                onClick={handleSave}
                disabled={isSaving || !authUser}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md shadow-sm transition-colors duration-150 flex items-center disabled:opacity-50"
            >
                <span className="mr-2">
                    {isSaving ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                : <FaCloudUploadAlt />}
                </span>
                {isSaving ? 'Saving...' : 'Save to Cloud'}
            </button>
          </div>
        </div>

        {saveLog.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
              <span className="mr-2 text-indigo-400"><FaHistory /></span> Recent Sync Log
            </h3>
            <ul className="space-y-1 text-xs text-gray-400 max-h-24 overflow-y-auto">
              {saveLog.map((log) => (
                <li key={log.id} className="bg-gray-700/50 p-1 rounded-sm">
                  {log.message}
                  <span className="ml-2 text-gray-500">({moment(log.timestamp).format('HH:mm:ss')})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
         <p className="text-xs text-gray-500 mt-4 text-center">
            Journal entries are now saved to Firestore for real-time sync when logged in.
            Ensure you have configured Firebase Security Rules in your Firebase project.
         </p>
      </div>
    </div>
  );
};

export default React.memo(JournalPaneComponent);