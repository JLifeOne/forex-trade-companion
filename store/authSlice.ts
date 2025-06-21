import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthState, User } from '../types';
import { auth, db } from '../services/firebase'; // Firebase auth instance (now v9 compat)
import firebase from 'firebase/compat/app'; // Required for compat types like firebase.User
import 'firebase/compat/auth'; // Ensure auth compat is loaded for types
import { AppDispatch, RootState } from './index'; // For thunk dispatch typing
import { subscribeToJournalEntries, clearJournalData, JournalUnsubscribeFunction } from './journalSlice'; // Import journal actions
import { addToast } from './toastSlice';

// Firebase compat types
type FirebaseUserType = firebase.User;
type FirebaseAuthError = firebase.auth.AuthError;

// To store the unsubscribe function for Firestore listeners
let journalListenerUnsubscribe: JournalUnsubscribeFunction | null = null;

// Helper to map FirebaseUserType to our User type
const mapFirebaseUserToUser = (firebaseUser: FirebaseUserType): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
});

// --- Async Thunks ---
export const loginWithFirebase = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string; dispatch: AppDispatch }
>(
  'auth/loginWithFirebase',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(authActions.authRequest());
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        return rejectWithValue('Login failed: No user returned from Firebase.');
      }
      const user = mapFirebaseUserToUser(userCredential.user);
      // Firebase manages its own token. We can use a placeholder or remove it.
      return { user, token: 'firebase_managed_token' }; 
    } catch (error: any) {
      const authError = error as FirebaseAuthError;
      return rejectWithValue(authError.message || authError.code || 'Login failed');
    }
  }
);

export const signupWithFirebase = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string; dispatch: AppDispatch }
>(
  'auth/signupWithFirebase',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(authActions.authRequest());
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        return rejectWithValue('Signup failed: No user returned from Firebase.');
      }
      // Send verification email
      try {
        await userCredential.user.sendEmailVerification();
        dispatch(addToast({ message: 'Verification email sent. Please check your inbox.', type: 'info', duration: 7000 }));
      } catch (verificationError) {
        console.error("Failed to send verification email:", verificationError);
        dispatch(addToast({ message: 'Could not send verification email. Please try again later or contact support.', type: 'error' }));
      }
      
      const user = mapFirebaseUserToUser(userCredential.user);
      return { user, token: 'firebase_managed_token' };
    } catch (error: any) {
      const authError = error as FirebaseAuthError;
      return rejectWithValue(authError.message || authError.code || 'Signup failed');
    }
  }
);

export const logoutFromFirebase = createAsyncThunk<
  void, 
  void, 
  { rejectValue: string; dispatch: AppDispatch }
>(
  'auth/logoutFromFirebase',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      dispatch(authActions.authRequest());
      await auth.signOut();
      // Unsubscribe from journal listener on logout
      if (journalListenerUnsubscribe) {
        journalListenerUnsubscribe();
        journalListenerUnsubscribe = null;
      }
      dispatch(clearJournalData()); // Clear journal data from Redux store
    } catch (error: any) {
      const authError = error as FirebaseAuthError;
      return rejectWithValue(authError.message || authError.code || 'Logout failed');
    }
  }
);

export const initializeAuthListener = createAsyncThunk<void, void, { dispatch: AppDispatch; state: RootState }>(
  'auth/initializeAuthListener',
  async (_, { dispatch }) => {
    dispatch(authActions.authInitializing()); 
    return new Promise<void>((resolve, reject) => { 
      const unsubscribe = auth.onAuthStateChanged(
        async (firebaseUser: FirebaseUserType | null) => { 
          if (firebaseUser) {
            const user = mapFirebaseUserToUser(firebaseUser);
            dispatch(authActions.authSuccess({ user, token: 'firebase_managed_token' }));
            
            // Unsubscribe from previous listener if any
            if (journalListenerUnsubscribe) {
              journalListenerUnsubscribe();
            }
            // Subscribe to journal entries for the new user
            const unsubscribeJournal = await dispatch(subscribeToJournalEntries(user.uid));
            if (typeof unsubscribeJournal === 'function') { // Check if it's the actual unsubscribe function
                 journalListenerUnsubscribe = unsubscribeJournal as JournalUnsubscribeFunction;
            } else if ((unsubscribeJournal as any).meta?.requestStatus === 'rejected') {
                 console.error("Failed to subscribe to journal entries after login.");
                 dispatch(addToast({message: "Error syncing journal data. Please try refreshing.", type: "error"}));
            }

          } else {
            dispatch(authActions.authLogout());
            if (journalListenerUnsubscribe) {
              journalListenerUnsubscribe();
              journalListenerUnsubscribe = null;
            }
            dispatch(clearJournalData());
          }
          // Don't unsubscribe onAuthStateChanged itself here, let it run continuously.
          resolve(); 
        }, 
        (error: FirebaseAuthError) => { 
          dispatch(authActions.authFailure(error.message || error.code || "Auth listener error"));
          // unsubscribe(); // This would be the auth.onAuthStateChanged unsubscribe, generally not done here
          reject(error);
        }
      );
      // Storing the onAuthStateChanged unsubscribe is typically done if the app itself unmounts/reloads.
      // For this example, we'll let it persist.
    });
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle', 
  error: null,
  syncing: false, // syncing can be deprecated if status covers it
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authRequest(state) {
        state.status = 'loading';
        state.error = null;
    },
    authInitializing(state) {
      state.status = 'initializing';
      state.syncing = true; // Kept for now, might be redundant with status
    },
    authSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      state.syncing = false;
    },
    authLogout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.syncing = false;
    },
    authFailure(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
      state.user = null;
      state.token = null;
      state.syncing = false;
    },
    setSyncing(state, action: PayloadAction<boolean>) { // Can be deprecated
      state.syncing = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithFirebase.fulfilled, (state, action) => {
        // Handled by onAuthStateChanged via authSuccess
      })
      .addCase(loginWithFirebase.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
        state.user = null;
        state.token = null;
      })
      .addCase(signupWithFirebase.fulfilled, (state, action) => {
        // Handled by onAuthStateChanged via authSuccess
      })
      .addCase(signupWithFirebase.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Signup failed';
        state.user = null;
        state.token = null;
      })
      .addCase(logoutFromFirebase.fulfilled, (state) => {
        // Handled by onAuthStateChanged via authLogout
      })
      .addCase(logoutFromFirebase.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Logout failed';
        // UI should reflect logged out state even if Firebase call fails.
        // onAuthStateChanged might still fire eventually, or we force local logout.
        state.user = null; 
        state.token = null;
      })
      .addCase(initializeAuthListener.pending, (state) => {
        // authInitializing action already dispatched by the thunk itself
      })
      .addCase(initializeAuthListener.fulfilled, (state) => {
        // Actual state changes (authSuccess/authLogout) are dispatched within onAuthStateChanged
        // No direct state change here, status is managed by onAuthStateChanged callbacks.
      })
      .addCase(initializeAuthListener.rejected, (state, action) => {
         state.status = 'failed';
         state.error = action.error.message || "Auth initialization failed";
      });
  },
});

export const authActions = authSlice.actions; // Export all actions
export default authSlice.reducer;