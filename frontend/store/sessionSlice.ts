
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment-timezone';
import { SessionState, SessionStatus } from '../types';
import { FOREX_SESSIONS } from '../constants';

const getInitialSessionStatus = (): SessionStatus => {
  const nowUtc = moment().utc();
  const status: Partial<SessionStatus> = {};

  FOREX_SESSIONS.forEach(session => {
    const open = moment.utc().hour(session.utcOpen).minute(0).second(0);
    const close = moment.utc().hour(session.utcClose).minute(0).second(0);
    
    // Handle sessions that cross midnight (e.g. open 22:00 close 07:00)
    // This example doesn't have such sessions, but good to keep in mind.
    // For this app, close time is always after open time on the same UTC day.

    if (nowUtc.isBetween(open, close, 'hour', '[)')) { // inclusive open, exclusive close
      status[session.name] = 'open';
    } else if (nowUtc.isBetween(open.clone().subtract(30, 'minutes'), open, 'minute', '[)')) {
      status[session.name] = 'opening_soon';
    } else {
      status[session.name] = 'closed';
    }
  });
  return status as SessionStatus;
};


const initialState: SessionState = {
  localTime: moment().format('HH:mm:ss'),
  timezones: {
    Tokyo: FOREX_SESSIONS.find(s => s.name === 'Tokyo')?.timezone || 'Asia/Tokyo',
    London: FOREX_SESSIONS.find(s => s.name === 'London')?.timezone || 'Europe/London',
    NewYork: FOREX_SESSIONS.find(s => s.name === 'NewYork')?.timezone || 'America/New_York',
  },
  sessionStatus: getInitialSessionStatus(),
  lastPrompted: { Tokyo: false, London: false, NewYork: false },
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    updateLocalTime(state) {
      state.localTime = moment().format('HH:mm:ss');
    },
    updateSessionStatus(state) {
      const nowUtc = moment().utc();
      FOREX_SESSIONS.forEach(session => {
        const open = moment.utc().hour(session.utcOpen).minute(0).second(0);
        const close = moment.utc().hour(session.utcClose).minute(0).second(0);

        if (nowUtc.isBetween(open, close, 'hour', '[)')) {
          state.sessionStatus[session.name] = 'open';
        } else if (nowUtc.isBetween(open.clone().subtract(30, 'minutes'), open, 'minute', '[)')) {
          state.sessionStatus[session.name] = 'opening_soon';
        } else {
          state.sessionStatus[session.name] = 'closed';
        }
      });
    },
    setSessionPrompted(state, action: PayloadAction<{ sessionName: 'Tokyo' | 'London' | 'NewYork'; value: boolean }>) {
      const { sessionName, value } = action.payload;
      state.lastPrompted[sessionName] = value;
    },
  },
});

export const { updateLocalTime, updateSessionStatus, setSessionPrompted } = sessionSlice.actions;
export default sessionSlice.reducer;
