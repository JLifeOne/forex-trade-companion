
import moment from 'moment-timezone';
import { ForexSession } from '../types';

export const getSessionStatus = (session: ForexSession): 'open' | 'opening_soon' | 'closed' => {
  const nowUtc = moment().utc();
  const open = moment.utc().hour(session.utcOpen).minute(0).second(0);
  const close = moment.utc().hour(session.utcClose).minute(0).second(0);

  if (nowUtc.isBetween(open, close, 'hour', '[)')) {
    return 'open';
  }
  if (nowUtc.isBetween(open.clone().subtract(30, 'minutes'), open, 'minute', '[)')) {
    return 'opening_soon';
  }
  return 'closed';
};

export const convertUtcToLocalTime = (utcHour: number, timezone: string): string => {
  return moment.utc().hour(utcHour).minute(0).tz(timezone).format('HH:mm');
};

export const getCurrentTimeInZone = (timezone: string): string => {
  return moment().tz(timezone).format('HH:mm:ss');
};

export const getCoachingPromptForSession = (sessionName: 'Tokyo' | 'London' | 'NewYork'): string => {
  const tips = {
    Tokyo: 'Tokyo session is known for JPY pair movements. Watch for early momentum and potential range breakouts. Consider the impact of Asian market news.',
    London: 'London is the largest Forex market. High volatility, especially at the open and during overlaps. EUR, GBP, CHF pairs are active. Watch for major news releases.',
    NewYork: 'New York session overlaps with London, often leading to peak liquidity. USD pairs are key. Important US economic data releases can cause significant moves.',
  };
  return tips[sessionName] || "Stay disciplined and stick to your trading plan.";
};
