import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { JournalState, JournalEntry, JournalSaveLogEntry, AISignal, User } from '../types';
import { db, auth } from '../services/firebase'; // Firestore instance
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore'; // For compat types if needed, but direct v9 is better
import moment from 'moment';
import { RootState, AppDispatch } from './index';
import { addToast } from './toastSlice';

const MAX_SAVE_LOG_ENTRIES = 5;

export type JournalUnsubscribeFunction = () => void;

// --- Firestore Thunks for Journal ---

export const subscribeToJournalEntries = createAsyncThunk<
  JournalUnsubscribeFunction, // Return type: the unsubscribe function
  string, // Argument type: userId
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'journal/subscribeToJournalEntries',
  async (userId, { dispatch, rejectWithValue }) => {
    if (!userId) {
      return rejectWithValue("User ID is required to subscribe to journal entries.");
    }
    const journalEntriesCollection = firebase.firestore().collection('users').doc(userId).collection('journalEntries');
    
    try {
      const unsubscribe = journalEntriesCollection.onSnapshot(
        (snapshot) => {
          const entries: { [date: string]: JournalEntry } = {};
          snapshot.forEach((doc) => {
            entries[doc.id] = doc.data() as JournalEntry;
          });
          dispatch(journalSlice.actions.setJournalEntries(entries));
        },
        (error) => {
          console.error("Error subscribing to journal entries:", error);
          dispatch(addToast({ message: `Error syncing journal: ${error.message}`, type: 'error'}));
          dispatch(journalSlice.actions.setJournalError(error.message));
        }
      );
      return unsubscribe; // This is the function to call to stop listening
    } catch (error: any) {
        console.error("Failed to initiate journal subscription:", error);
        return rejectWithValue(error.message || "Failed to subscribe to journal.");
    }
  }
);

export const saveJournalEntryToFirestore = createAsyncThunk<
  void,
  { date: string; data: JournalEntry },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'journal/saveJournalEntryToFirestore',
  async ({ date, data }, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user || !user.uid) {
      dispatch(addToast({message: "You must be logged in to save journal entries.", type: "error"}));
      return rejectWithValue("User not authenticated.");
    }
    try {
      const entryRef = firebase.firestore().collection('users').doc(user.uid).collection('journalEntries').doc(date);
      await entryRef.set(data, { merge: true }); // Use set with merge to create or update
      
      // The onSnapshot listener will update the Redux state.
      // We can dispatch a success toast here.
      const logEntry: JournalSaveLogEntry = {
        id: `log-${Date.now()}`,
        date: date,
        timestamp: Date.now(),
        message: `Entry for ${moment(date).format('MMM D, YYYY')} saved to cloud.`,
      };
      dispatch(journalSlice.actions.addJournalSaveLog(logEntry));
      dispatch(addToast({message: `Journal for ${moment(date).format('MMM D')} saved.`, type: 'success'}));

    } catch (error: any) {
      console.error("Error saving journal entry to Firestore:", error);
      dispatch(addToast({ message: `Failed to save journal: ${error.message}`, type: 'error'}));
      return rejectWithValue(error.message || "Failed to save journal entry.");
    }
  }
);

export const deleteJournalEntryFromFirestore = createAsyncThunk<
  void,
  { date: string },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'journal/deleteJournalEntryFromFirestore',
  async ({ date }, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user || !user.uid) {
      dispatch(addToast({message: "You must be logged in to delete journal entries.", type: "error"}));
      return rejectWithValue("User not authenticated.");
    }
    try {
      const entryRef = firebase.firestore().collection('users').doc(user.uid).collection('journalEntries').doc(date);
      await entryRef.delete();
      // Snapshot listener will update state.
      dispatch(addToast({message: `Journal entry for ${moment(date).format('MMM D')} deleted.`, type: 'info'}));
    } catch (error: any) {
      console.error("Error deleting journal entry from Firestore:", error);
      dispatch(addToast({ message: `Failed to delete journal: ${error.message}`, type: 'error'}));
      return rejectWithValue(error.message || "Failed to delete journal entry.");
    }
  }
);


const initialState: JournalState = {
  entries: {}, // Entries will be populated from Firestore
  saveLog: [],
};

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    setJournalEntries(state, action: PayloadAction<{ [date: string]: JournalEntry }>) {
      state.entries = action.payload;
      // No local saving needed anymore
    },
    clearJournalData(state) {
        state.entries = {};
        state.saveLog = [];
    },
    // Keep logAISignalToJournal but adapt it to save to Firestore
    logAISignalToJournal(state, action: PayloadAction<{ date: string; signal: AISignal; userId: string }>) {
        const { date, signal, userId } = action.payload; // Assuming userId is passed or accessible
        const existingEntry = state.entries[date] || { mindset: '', strategy: '', trades: [] };
        
        const signalDetails = `AI Signal Applied: ${signal.title} (${signal.pair || 'N/A'})
Description: ${signal.description}
Confidence: ${signal.confidence || 'N/A'}
Key Levels: ${signal.keyLevels || 'N/A'}
Chart Pattern: ${signal.chartPattern || 'N/A'}
Confirmation: ${signal.confirmationSignals || 'N/A'}
Indicators: ${signal.supportingIndicators || 'N/A'}
---`;

        const updatedStrategyNotes = existingEntry.strategy 
            ? `${existingEntry.strategy}\n\n${signalDetails}` 
            : signalDetails;

        const updatedEntry = {
            ...existingEntry,
            strategy: updatedStrategyNotes,
        };
        state.entries[date] = updatedEntry; // Optimistic update

        // Dispatch save to Firestore (Thunk will handle user ID internally from auth state)
        // This requires AppDispatch for dispatching thunks.
        // For simplicity here, assuming saveJournalEntryToFirestore is called from component
        // which has access to dispatch.
        // If called from here directly:
        // dispatch(saveJournalEntryToFirestore({ date, data: updatedEntry })); 
        // This line above would need the slice to have access to `dispatch` or be handled differently.
        // It's better to call the thunk from where `dispatch` is available (e.g., component or another thunk).

        const logEntry: JournalSaveLogEntry = {
            id: `log-signal-${Date.now()}`,
            date: date,
            timestamp: Date.now(),
            message: `AI Signal '${signal.title}' prepared for ${moment(date).format('MMM D, YYYY')}. Save entry to persist.`,
        };
        state.saveLog.unshift(logEntry);
        if (state.saveLog.length > MAX_SAVE_LOG_ENTRIES) {
            state.saveLog.pop();
        }
    },
    addJournalSaveLog(state, action: PayloadAction<JournalSaveLogEntry>) {
        state.saveLog.unshift(action.payload);
        if (state.saveLog.length > MAX_SAVE_LOG_ENTRIES) {
            state.saveLog.pop();
        }
    },
    setJournalError(state, action: PayloadAction<string | null>) {
      // Placeholder for handling global journal errors if needed
      console.error("Journal Error Set:", action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
        .addCase(saveJournalEntryToFirestore.pending, (state, action) => {
            // Can add specific loading state for saving an entry if needed
        })
        .addCase(saveJournalEntryToFirestore.rejected, (state, action) => {
            // state.error = action.payload; // Or use a specific error field
            // Revert optimistic update if necessary, or let onSnapshot handle it.
        })
        .addCase(subscribeToJournalEntries.rejected, (state, action) => {
            // state.error = action.payload;
             state.entries = {}; // Clear entries if subscription fails
        })
        .addCase(deleteJournalEntryFromFirestore.rejected, (state,action) => {
            // state.error = action.payload;
        });
  }
});

export const { clearJournalData } = journalSlice.actions;

// Modified logAISignalToJournal to be dispatched from component, which will then call save.
export const { logAISignalToJournal: prepareAISignalLog } = journalSlice.actions;

export default journalSlice.reducer;