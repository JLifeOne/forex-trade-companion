
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastMessage, ToastState } from '../types';

const MAX_NOTIFICATION_LOG_ENTRIES = 50; // Max number of notifications to keep in the log

const initialState: ToastState = {
  messages: [],
  notificationLog: [], // Initialize notification log
};

let toastIdCounter = 0;

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<ToastMessage, 'id' | 'isRead'>>) {
      const newToastBase = action.payload;
      const toastId = `toast-${toastIdCounter++}`;

      // Add to visible messages queue
      state.messages.push({
        id: toastId,
        ...newToastBase,
        // isRead is not relevant for the temporary messages array
      });

      // Add to persistent notification log
      state.notificationLog.unshift({
        id: toastId,
        ...newToastBase,
        isRead: false, // New notifications are initially unread
      });

      // Cap the notification log size
      if (state.notificationLog.length > MAX_NOTIFICATION_LOG_ENTRIES) {
        state.notificationLog.pop(); // Remove the oldest notification
      }
    },
    removeToast(state, action: PayloadAction<string>) {
      // Removes from the visible messages queue
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    markNotificationAsRead(state, action: PayloadAction<string>) {
      const notification = state.notificationLog.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    markAllNotificationsAsRead(state) {
      state.notificationLog.forEach(notification => {
        notification.isRead = true;
      });
    },
    clearNotificationLog(state) {
        state.notificationLog = [];
    }
  },
});

export const { addToast, removeToast, markNotificationAsRead, markAllNotificationsAsRead, clearNotificationLog } = toastSlice.actions;
export default toastSlice.reducer;
