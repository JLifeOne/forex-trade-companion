import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-timezone';

import OriginalSidebar from './components/Sidebar';
import OriginalTopBar from './components/TopBar';
import SessionClock from './components/SessionClock';
import OriginalCalendarView from './components/CalendarView';
import OriginalJournalPane from './components/JournalPane';
import ChecklistPane from './components/ChecklistPane';
import OriginalNewsFeed from './components/NewsFeed';
import OriginalChatAssistant from './components/ChatAssistant';
import OriginalStrategyLibrary from './components/StrategyLibrary';
import OriginalBacktestModal from './components/BacktestModal';
import OriginalAnalyticsPanel from './components/AnalyticsPanel';
import OriginalSettingsPanel from './components/SettingsPanel';
import OriginalOrderModal from './components/OrderModal';
import OriginalTradeHistory from './components/TradeHistory';
import OriginalAISignals from './components/AISignals';
import OriginalCommunityFeed from './components/CommunityFeed';
import OriginalLeaderboard from './components/Leaderboard';
import OriginalAuthModal from './components/AuthModal';
import AIMarketPulse from './components/AIMarketPulse';
import AIStrategySpotlight from './components/AIStrategySpotlight';
import ToastNotificationsContainer from './components/ToastNotificationsContainer';
import OriginalTradingPlanPage from './components/TradingPlanPage';
import OriginalWatchlistPane from './components/WatchlistPane';

import { AppDispatch, store } from './store';
import { RootState } from './store/rootReducer';
import { updateLocalTime, updateSessionStatus, setSessionPrompted } from './store/sessionSlice';
import { initializeAuthListener } from './store/authSlice';
import { prepareAISignalLog, saveJournalEntryToFirestore } from './store/journalSlice';
import { addToast } from './store/toastSlice';
import { getCoachingPromptForSession } from './utils/timeUtils';
import { SessionStatus, AISignal, Strategy as StrategyType, JournalEntry } from './types';
import { FaExclamationTriangle } from 'react-icons/fa';

const SESSIONS_NAMES_FOR_ITERATION: Array<keyof SessionStatus> = ['Tokyo', 'London', 'NewYork'];

// Memoized versions of components
const Sidebar = React.memo(OriginalSidebar);
const TopBar = React.memo(OriginalTopBar);
const CalendarView = React.memo(OriginalCalendarView);
const JournalPane = React.memo(OriginalJournalPane);
const NewsFeed = React.memo(OriginalNewsFeed);
const ChatAssistant = React.memo(OriginalChatAssistant);
const StrategyLibrary = React.memo(OriginalStrategyLibrary);
const BacktestModal = React.memo(OriginalBacktestModal);
const AnalyticsPanel = React.memo(OriginalAnalyticsPanel);
const SettingsPanel = React.memo(OriginalSettingsPanel);
const OrderModal = React.memo(OriginalOrderModal);
const TradeHistory = React.memo(OriginalTradeHistory);
const AISignals = React.memo(OriginalAISignals);
const CommunityFeed = React.memo(OriginalCommunityFeed);
const Leaderboard = React.memo(OriginalLeaderboard);
const AuthModal = React.memo(OriginalAuthModal);
const TradingPlanPage = React.memo(OriginalTradingPlanPage); 
const WatchlistPane = React.memo(OriginalWatchlistPane);


// --- Define DashboardRouteComponent outside App ---
interface DashboardRouteProps {
  journalPaneDate: string;
  selectedStrategyForJournal?: StrategyType;
  onDateSelect: (date: string) => void;
  onPlanTrade: (signal: AISignal) => void;
  onLogSignalToJournal: (signal: AISignal) => void;
  currentJournalEntryForDate?: JournalEntry;
}

const DashboardRouteComponent: React.FC<DashboardRouteProps> = React.memo(({
  journalPaneDate,
  selectedStrategyForJournal,
  onDateSelect,
  onPlanTrade,
  onLogSignalToJournal,
  currentJournalEntryForDate
}) => {
  return (
    <div className="space-y-6">
      <AIMarketPulse />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <SessionClock />
            <CalendarView onDateSelect={onDateSelect} selectedJournalDate={journalPaneDate} />
        </div>
        <div className="xl:col-span-1 space-y-6">
            <ChecklistPane />
            <WatchlistPane />
        </div>
      </div>
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <JournalPane
            selectedDateProp={journalPaneDate}
            selectedStrategyForJournal={selectedStrategyForJournal}
            journalEntry={currentJournalEntryForDate}
            key={journalPaneDate + (selectedStrategyForJournal?.id || '')} 
          />
          <AISignals onPlanTrade={onPlanTrade} onLogSignalToJournal={onLogSignalToJournal} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewsFeed />
        <AIStrategySpotlight />
      </div>
    </div>
  );
});
// --- End of DashboardRouteComponent ---

type ChatWidgetDisplayMode = 'hidden' | 'collapsed' | 'expanded';

const AppContent: React.FC = () => { 
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionStatus, lastPrompted } = useSelector((state: RootState) => state.session);
  const authUser = useSelector((state: RootState) => state.auth.user);
  
  const [journalPaneDate, setJournalPaneDateState] = useState<string>(moment().format('YYYY-MM-DD'));
  const [selectedStrategyObjectForJournal, setSelectedStrategyObjectForJournal] = useState<StrategyType | undefined>(undefined);

  const currentJournalEntryForDate = useSelector((state: RootState) => state.journal.entries[journalPaneDate || moment().format('YYYY-MM-DD')]);


  const [chatWidgetDisplayMode, setChatWidgetDisplayMode] = useState<ChatWidgetDisplayMode>('collapsed');
  const [showStrategyLibraryState, setShowStrategyLibraryState] = useState(false);
  const [showBacktestModalState, setShowBacktestModalState] = useState(false);
  const [showSettingsPanelState, setShowSettingsPanelState] = useState(false);
  
  const [orderModalConfig, setOrderModalConfig] = useState<{ visible: boolean; symbol?: string; notes?: string }>({ visible: false });
  const [showAuthModalState, setShowAuthModalState] = useState(false);

  const [currentSessionTip, setCurrentSessionTip] = useState('');
  const [showSessionTipPopup, setShowSessionTipPopup] = useState(false);


  useEffect(() => {
    dispatch(initializeAuthListener());
  }, [dispatch]);

  const handleToggleChatWidgetExpand = useCallback(() => {
    setChatWidgetDisplayMode(prev => {
      if (prev === 'expanded') return 'collapsed';
      return 'expanded';
    });
  }, []);

  const handleHideChatWidget = useCallback(() => {
    setChatWidgetDisplayMode('hidden');
  }, []);
  
  const handleShowChatWidget = useCallback(() => {
     setChatWidgetDisplayMode(prev => (prev === 'hidden' || prev === 'collapsed' ? 'expanded' : 'collapsed'));
  }, []);


  const handleShowStrategyLibrary = useCallback(() => setShowStrategyLibraryState(true), []);
  const handleCloseStrategyLibrary = useCallback(() => setShowStrategyLibraryState(false), []);
  const handleShowBacktestModal = useCallback(() => setShowBacktestModalState(true), []);
  const handleCloseBacktestModal = useCallback(() => setShowBacktestModalState(false), []);
  const handleShowSettingsPanel = useCallback(() => setShowSettingsPanelState(true), []);
  const handleCloseSettingsPanel = useCallback(() => setShowSettingsPanelState(false), []);
  
  const handleShowOrderModal = useCallback((symbol?: string, notes?: string) => {
    setOrderModalConfig({ visible: true, symbol, notes });
  }, []);
  const handleCloseOrderModal = useCallback(() => setOrderModalConfig(prev => ({ ...prev, visible: false })), []);
  
  const handleShowAuthModal = useCallback(() => setShowAuthModalState(true), []);
  const handleCloseAuthModal = useCallback(() => setShowAuthModalState(false), []);

  const handleDateSelectFromCalendar = useCallback((date: string) => {
    setJournalPaneDateState(date);
    setSelectedStrategyObjectForJournal(undefined); 
    navigate('/journal'); 
  }, [navigate]);

  const handleApplyStrategyToJournal = useCallback((strategy: StrategyType) => { 
    setSelectedStrategyObjectForJournal(strategy);
    const targetDate = moment().format('YYYY-MM-DD'); 
    setJournalPaneDateState(targetDate); 
    dispatch(addToast({ message: `Strategy '${strategy.name}' ready to apply to journal.`, type: 'info' }));
    navigate('/journal');
  }, [navigate, dispatch]);
  
  const handlePlanTradeFromSignal = useCallback((signal: AISignal) => {
    handleShowOrderModal(signal.pair, `AI Signal: ${signal.title}\n${signal.description}`);
  }, [handleShowOrderModal]);

  const handleLogSignalToJournalCallback = useCallback((signal: AISignal) => {
    if (!authUser || !authUser.uid) {
        dispatch(addToast({message: "Please log in to log signals to your journal.", type: "error"}));
        return;
    }
    const dateToLog = journalPaneDate || moment().format('YYYY-MM-DD');
    dispatch(prepareAISignalLog({ date: dateToLog, signal, userId: authUser.uid }));
    
    const currentEntry = store.getState().journal.entries[dateToLog] || { id: dateToLog, mindset: '', strategy: '', trades: [] };
    const signalDetails = `AI Signal Applied: ${signal.title} (${signal.pair || 'N/A'})
Description: ${signal.description}
Confidence: ${signal.confidence || 'N/A'}
Key Levels: ${signal.keyLevels || 'N/A'}
Chart Pattern: ${signal.chartPattern || 'N/A'}
Confirmation: ${signal.confirmationSignals || 'N/A'}
Indicators: ${signal.supportingIndicators || 'N/A'}
---`;
    const updatedStrategyNotes = currentEntry.strategy 
        ? `${currentEntry.strategy}

${signalDetails}` 
        : signalDetails;
    const entryToSave: JournalEntry = {
        ...currentEntry,
        strategy: updatedStrategyNotes,
    };

    dispatch(saveJournalEntryToFirestore({ date: dateToLog, data: entryToSave }));

    setJournalPaneDateState(dateToLog); 
    if(location.pathname !== '/journal') {
        navigate('/journal');
    }
  }, [dispatch, authUser, journalPaneDate, navigate]);


  const checkSessionTips = useCallback(() => {
    SESSIONS_NAMES_FOR_ITERATION.forEach((sessionName) => {
      if (sessionStatus[sessionName] === 'open' && !lastPrompted[sessionName]) {
        const tip = getCoachingPromptForSession(sessionName);
        setCurrentSessionTip(`${sessionName} Session Tip: ${tip}`);
        setShowSessionTipPopup(true);
        dispatch(setSessionPrompted({ sessionName, value: true }));
        setTimeout(() => setShowSessionTipPopup(false), 7000); 
      }
      if (sessionStatus[sessionName] !== 'open' && lastPrompted[sessionName]) {
        dispatch(setSessionPrompted({ sessionName, value: false }));
      }
    });
  }, [dispatch, sessionStatus, lastPrompted]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(updateLocalTime());
      dispatch(updateSessionStatus());
    }, 1000);

    const tipIntervalId = setInterval(checkSessionTips, 5000); 

    return () => {
      clearInterval(intervalId);
      clearInterval(tipIntervalId);
    };
  }, [dispatch, checkSessionTips]);


  return (
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <Sidebar
          onShowAuth={handleShowAuthModal}
          onShowStrategyLibrary={handleShowStrategyLibrary}
          onShowBacktestModal={handleShowBacktestModal}
          onShowOrderModal={() => handleShowOrderModal()} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onHelpClick={handleShowChatWidget}
            onSettingsClick={handleShowSettingsPanel}
            onShowAuth={handleShowAuthModal}
          />
          <ToastNotificationsContainer /> 

          {showSessionTipPopup && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-2xl z-[90] text-sm flex items-center max-w-md print:hidden">
              <span className="mr-3 text-yellow-800 text-xl">
    <FaExclamationTriangle/>
  </span>
              {currentSessionTip}
            </div>
          )}

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-850 p-6"> 
            <Routes>
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardRouteComponent
                  journalPaneDate={journalPaneDate}
                  selectedStrategyForJournal={selectedStrategyObjectForJournal} 
                  onDateSelect={handleDateSelectFromCalendar}
                  onPlanTrade={handlePlanTradeFromSignal}
                  onLogSignalToJournal={handleLogSignalToJournalCallback}
                  currentJournalEntryForDate={currentJournalEntryForDate}
              />} />
              <Route path="/analytics" element={<AnalyticsPanel />} />
              <Route
                path="/journal"
                element={
                  <JournalPane
                    key={journalPaneDate + (selectedStrategyObjectForJournal?.id || '')} 
                    selectedDateProp={journalPaneDate}
                    selectedStrategyForJournal={selectedStrategyObjectForJournal}
                    journalEntry={currentJournalEntryForDate || { id: journalPaneDate, mindset: '', strategy: '', trades: [] }} 
                  />
                }
              />
              <Route path="/trading-plan" element={<TradingPlanPage />} />
              <Route path="/signals" element={<AISignals onPlanTrade={handlePlanTradeFromSignal} onLogSignalToJournal={handleLogSignalToJournalCallback} />} />
              <Route path="/news" element={<NewsFeed />} />
              <Route path="/community" element={<CommunityFeed />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/trades" element={<TradeHistory />} />
              <Route path="/settings" element={<SettingsPanel visible={true} onClose={() => navigate(-1)} />} /> 
              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
          </main>
        </div>

        <ChatAssistant 
            displayMode={chatWidgetDisplayMode}
            onToggleExpand={handleToggleChatWidgetExpand}
            onHideWidget={handleHideChatWidget}
        />
        <StrategyLibrary
            visible={showStrategyLibraryState}
            onClose={handleCloseStrategyLibrary}
            onApplyStrategy={handleApplyStrategyToJournal} 
        />
        <BacktestModal visible={showBacktestModalState} onClose={handleCloseBacktestModal} />
        <SettingsPanel visible={showSettingsPanelState} onClose={handleCloseSettingsPanel} />
        <OrderModal 
            visible={orderModalConfig.visible} 
            onClose={handleCloseOrderModal} 
            initialSymbol={orderModalConfig.symbol}
            initialNotes={orderModalConfig.notes}
        />
        <AuthModal visible={showAuthModalState} onClose={handleCloseAuthModal} />
      </div>
  );
};

const App: React.FC = () => (
    <Router>
        <AppContent />
    </Router>
);

export default App;