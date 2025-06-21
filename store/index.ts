
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
export type { RootState } from './rootReducer'; // Added export

export const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;