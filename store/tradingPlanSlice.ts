import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TradingPlan, TradingPlanState } from '../types';
import { getTradingPlan, saveTradingPlan as savePlanToStorage } from '../services/storageService';

const initialState: TradingPlanState = {
  plan: getTradingPlan(),
  status: 'idle',
  error: null,
};

const tradingPlanSlice = createSlice({
  name: 'tradingPlan',
  initialState,
  reducers: {
    loadPlan(state) {
      state.status = 'loading';
      try {
        state.plan = getTradingPlan();
        state.status = 'succeeded';
      } catch (e: unknown) {
        state.status = 'failed';
        state.error = (e as Error).message || 'Failed to load trading plan';
      }
    },
    updatePlan(state, action: PayloadAction<Partial<TradingPlan>>) {
      state.plan = { ...state.plan, ...action.payload };
      // Optionally, could add a 'dirty' flag and save only on explicit save action
      // For simplicity, auto-save on update for now
      try {
        savePlanToStorage(state.plan);
        state.status = 'succeeded'; // Reflect that the last operation was successful
      } catch (e: unknown) {
          state.status = 'failed';
          state.error = (e as Error).message || 'Failed to save trading plan update';
          // Potentially revert state.plan here if save fails critically, or handle with UI feedback
      }
    },
    savePlan(state) { // Explicit save action
        state.status = 'loading';
        try {
            savePlanToStorage(state.plan);
            state.status = 'succeeded';
        } catch (e: unknown) {
            state.status = 'failed';
            state.error = (e as Error).message || 'Failed to save trading plan';
        }
    }
    // No separate updateField, as updatePlan with Partial<TradingPlan> handles it.
  },
});

export const { loadPlan, updatePlan, savePlan } = tradingPlanSlice.actions;
export default tradingPlanSlice.reducer;