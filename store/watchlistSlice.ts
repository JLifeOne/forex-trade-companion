import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WatchlistItem, WatchlistState } from '../types';
import { getWatchlistItems, saveWatchlistItems } from '../services/storageService';
import { getAISymbolSentiment } from '../services/geminiService';
import { AppDispatch, RootState } from './index'; // For thunk typings

// Thunk to fetch sentiment for a single symbol
export const fetchSentimentForSymbol = createAsyncThunk<
  { id: string; sentiment: WatchlistItem['aiSentiment'] }, // Return type
  string, // Argument type (symbolId)
  { dispatch: AppDispatch; state: RootState } // ThunkAPI config
>(
  'watchlist/fetchSentimentForSymbol',
  async (symbolId, { getState, rejectWithValue }) => {
    const item = getState().watchlist.items.find(i => i.id === symbolId);
    if (!item) {
      return rejectWithValue('Symbol not found in watchlist');
    }
    try {
      const sentiment = await getAISymbolSentiment(item.symbol);
      return { id: symbolId, sentiment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sentiment');
    }
  }
);

// Thunk to refresh all watchlist sentiments
export const refreshAllWatchlistSentiments = createAsyncThunk<
  void, // Return type (void as updates happen via individual dispatches)
  void, // Argument type
  { dispatch: AppDispatch; state: RootState }
>(
  'watchlist/refreshAllSentiments',
  async (_, { getState, dispatch }) => {
    const { items } = getState().watchlist;
    // Sequentially dispatch for simplicity, or use Promise.all for parallel
    for (const item of items) {
      await dispatch(fetchSentimentForSymbol(item.id));
    }
  }
);

const initialState: WatchlistState = {
  items: getWatchlistItems(),
  globalStatus: 'idle',
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    addSymbolToWatchlist(state, action: PayloadAction<string>) {
      const symbol = action.payload.toUpperCase().trim();
      if (symbol && !state.items.some(item => item.symbol === symbol)) {
        const newItem: WatchlistItem = {
          id: `wl-${symbol.replace('/', '')}-${Date.now()}`,
          symbol,
          aiSentiment: 'N/A',
          sentimentStatus: 'idle',
        };
        state.items.push(newItem);
        saveWatchlistItems(state.items);
      }
    },
    removeSymbolFromWatchlist(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      saveWatchlistItems(state.items);
    },
    // Used by fetchSentimentForSymbol.pending
    _setSentimentStatusLoading(state, action: PayloadAction<string>) {
        const item = state.items.find(i => i.id === action.payload);
        if (item) item.sentimentStatus = 'loading';
    },
    // Used by fetchSentimentForSymbol.fulfilled
    _updateSentimentSuccess(state, action: PayloadAction<{ id: string; sentiment: WatchlistItem['aiSentiment'] }>) {
        const item = state.items.find(i => i.id === action.payload.id);
        if (item) {
            item.aiSentiment = action.payload.sentiment;
            item.lastUpdated = Date.now();
            item.sentimentStatus = 'idle';
        }
        saveWatchlistItems(state.items); // Save after update
    },
    // Used by fetchSentimentForSymbol.rejected
    _updateSentimentFailure(state, action: PayloadAction<{ id: string; error: string | undefined }>) {
        const item = state.items.find(i => i.id === action.payload.id);
        if (item) {
            item.sentimentStatus = 'failed';
            item.aiSentiment = 'N/A'; // Reset on failure
        }
         saveWatchlistItems(state.items); // Save after update
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSentimentForSymbol
      .addCase(fetchSentimentForSymbol.pending, (state, action) => {
        const item = state.items.find(i => i.id === action.meta.arg);
        if (item) item.sentimentStatus = 'loading';
      })
      .addCase(fetchSentimentForSymbol.fulfilled, (state, action) => {
        const item = state.items.find(i => i.id === action.payload.id);
        if (item) {
          item.aiSentiment = action.payload.sentiment;
          item.lastUpdated = Date.now();
          item.sentimentStatus = 'idle';
        }
        saveWatchlistItems(state.items);
      })
      .addCase(fetchSentimentForSymbol.rejected, (state, action) => {
        const item = state.items.find(i => i.id === action.meta.arg);
        if (item) {
          item.sentimentStatus = 'failed';
          item.aiSentiment = 'N/A';
        }
        // Optionally set a global error for the specific item:
        // state.error = `Failed to fetch sentiment for ${item?.symbol}: ${action.payload || action.error.message}`;
        saveWatchlistItems(state.items);
      })
      // Handle refreshAllWatchlistSentiments
      .addCase(refreshAllWatchlistSentiments.pending, (state) => {
        state.globalStatus = 'loading';
        state.error = null;
      })
      .addCase(refreshAllWatchlistSentiments.fulfilled, (state) => {
        state.globalStatus = 'idle';
      })
      .addCase(refreshAllWatchlistSentiments.rejected, (state, action) => {
        state.globalStatus = 'idle';
        state.error = action.error.message || 'Failed to refresh all sentiments.';
      });
  },
});

export const { 
    addSymbolToWatchlist, 
    removeSymbolFromWatchlist,
    _setSentimentStatusLoading, // Exporting for potential direct use if needed, though thunks are preferred
    _updateSentimentSuccess,
    _updateSentimentFailure 
} = watchlistSlice.actions;
export default watchlistSlice.reducer;