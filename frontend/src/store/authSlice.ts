import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, firestore } from '../services/firebase';
import { addToast } from './toastSlice';
import { clearJournalData, addJournalEntry } from './journalSlice';
import { JournalEntry } from '../types';
import { RootState } from './rootReducer';

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  unsubscribeJournal: (() => void) | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  unsubscribeJournal: null,
};

export const initializeAuthListener = createAsyncThunk(
  'auth/initializeListener',
  async (_, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
          dispatch(setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }));
          dispatch(subscribeToJournalEntries(user.uid));
        } else {
          dispatch(clearUser());
          dispatch(clearJournalData());
        }
        resolve(user);
      }, reject);
    });
  }
);

export const subscribeToJournalEntries = createAsyncThunk(
    'journal/subscribeToEntries',
    async (userId: string, { dispatch }) => {
        const journalRef = firestore.collection('users').doc(userId).collection('journal');
        const unsubscribe = journalRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    dispatch(addJournalEntry({ date: change.doc.id, entry: change.doc.data() as JournalEntry }));
                }
                if (change.type === 'removed') {
                    // You might want to handle deletions differently
                }
            });
        });
        return unsubscribe;
    }
);


export const logoutFromFirebase = createAsyncThunk(
    'auth/logout',
    async (_, { dispatch, getState }) => {
        const { auth } = getState() as RootState;
        if(auth.unsubscribeJournal) {
            auth.unsubscribeJournal();
        }
        await auth.signOut();
        dispatch(addToast({ message: 'Successfully logged out.', type: 'info' }));
    }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setUnsubscribeJournal: (state, action: PayloadAction<(() => void) | null>) => {
        state.unsubscribeJournal = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuthListener.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuthListener.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to initialize auth listener.';
        state.isLoading = false;
      })
      .addCase(logoutFromFirebase.pending, (state) => {
          state.isLoading = true;
      })
      .addCase(logoutFromFirebase.fulfilled, (state) => {
          // Handled by onAuthStateChanged
      })
      .addCase(logoutFromFirebase.rejected, (state, action) => {
          state.error = action.error.message || 'Logout failed.';
          state.isLoading = false;
      })
      .addCase(subscribeToJournalEntries.fulfilled, (state, action) => {
          state.unsubscribeJournal = action.payload;
      })
  }
});

export const { setUser, clearUser, setAuthLoading, setAuthError, setUnsubscribeJournal } = authSlice.actions;

export default authSlice.reducer;