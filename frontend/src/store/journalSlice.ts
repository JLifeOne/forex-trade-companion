import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { JournalEntry } from "../types";
import { firestore } from "../services/firebase";
import { addToast } from "./toastSlice";
import { RootState } from "./rootReducer";

interface JournalState {
  entries: { [date: string]: JournalEntry };
  isSyncing: boolean;
  lastSync: string | null;
  saveLog: { id: string, message: string, timestamp: string }[];
}

const initialState: JournalState = {
  entries: {},
  isSyncing: false,
  lastSync: null,
  saveLog: [],
};

export const saveJournalEntryToFirestore = createAsyncThunk(
    'journal/saveEntry',
    async (payload: { date: string; data: JournalEntry }, { dispatch, getState }) => {
        const { auth } = getState() as RootState;
        if (!auth.user) {
            dispatch(addToast({ message: 'User not logged in.', type: 'error' }));
            throw new Error('User not logged in.');
        }
        const userId = auth.user.uid;
        const entryRef = firestore.collection('users').doc(userId).collection('journal').doc(payload.date);
        await entryRef.set(payload.data, { merge: true });
        dispatch(addToast({ message: 'Journal entry saved!', type: 'success' }));
        return { date: payload.date, data: payload.data };
    }
);

export const deleteJournalEntryFromFirestore = createAsyncThunk(
    'journal/deleteEntry',
    async (payload: { date: string }, { dispatch, getState }) => {
        const { auth } = getState() as RootState;
        if (!auth.user) {
            dispatch(addToast({ message: 'User not logged in.', type: 'error' }));
            throw new Error('User not logged in.');
        }
        const userId = auth.user.uid;
        const entryRef = firestore.collection('users').doc(userId).collection('journal').doc(payload.date);
        await entryRef.delete();
        dispatch(addToast({ message: 'Journal entry deleted!', type: 'success' }));
        return { date: payload.date };
    }
);

const journalSlice = createSlice({
  name: "journal",
  initialState,
  reducers: {
    addJournalEntry: (state, action: PayloadAction<{ date: string, entry: JournalEntry }>) => {
      state.entries[action.payload.date] = action.payload.entry;
    },
    updateJournalEntry: (state, action: PayloadAction<{ date: string, entry: JournalEntry }>) => {
      state.entries[action.payload.date] = action.payload.entry;
    },
    deleteJournalEntry: (state, action: PayloadAction<string>) => {
      delete state.entries[action.payload];
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    prepareAISignalLog: (state, action: PayloadAction<{ date: string, signal: unknown, userId: string }>) => {
        // This is a placeholder for the actual logic
    },
    clearJournalData: (state) => {
      state.entries = {};
      state.saveLog = [];
      state.lastSync = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveJournalEntryToFirestore.fulfilled, (state, action) => {
        state.entries[action.payload.date] = action.payload.data;
        state.saveLog.unshift({ id: new Date().toISOString(), message: `Saved entry for ${action.payload.date}`, timestamp: new Date().toISOString() });
      })
      .addCase(deleteJournalEntryFromFirestore.fulfilled, (state, action) => {
          delete state.entries[action.payload.date];
          state.saveLog.unshift({ id: new Date().toISOString(), message: `Deleted entry for ${action.payload.date}`, timestamp: new Date().toISOString() });
      })
  }
});

export const {
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  setSyncing,
  setLastSync,
  prepareAISignalLog,
  clearJournalData
} = journalSlice.actions;

export default journalSlice.reducer;
