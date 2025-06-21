import { combineReducers } from 'redux';
import sessionReducer from './sessionSlice';
import journalReducer from './journalSlice';
import authReducer from './authSlice';
import toastReducer from './toastSlice'; 
import tradingPlanReducer from './tradingPlanSlice'; // Added trading plan reducer
import watchlistReducer from './watchlistSlice'; // Added watchlist reducer

const rootReducer = combineReducers({
  session: sessionReducer,
  journal: journalReducer,
  auth: authReducer,
  toast: toastReducer, 
  tradingPlan: tradingPlanReducer, 
  watchlist: watchlistReducer, // Added watchlist reducer
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;