
import moment from 'moment';
import { JournalEntry } from '../types';

interface DailyWinRate {
  day: string; // 'Mon', 'Tue', etc.
  winRate: number; // 0-100
  trades: number;
}

interface MonthlyPnlData {
  date: string; // '01', '02', ... '31'
  pnl: number;
}

interface SessionPnlData {
  name: string; // 'Tokyo', 'London', 'NewYork'
  value: number; // PnL
}

export const computeDailyWinRates = (journalEntries: { [date: string]: JournalEntry }): DailyWinRate[] => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyData: { [key: string]: { trades: number; wins: number } } = daysOfWeek.reduce((acc, day) => {
    acc[day] = { trades: 0, wins: 0 };
    return acc;
  }, {} as { [key: string]: { trades: number; wins: number } });

  Object.keys(journalEntries).forEach(dateKey => {
    const entry = journalEntries[dateKey];
    if (entry && entry.trades && entry.trades.length > 0) {
      const dayOfWeek = moment(dateKey).format('ddd'); // 'Mon', 'Tue', etc.
      if (dailyData[dayOfWeek]) {
        entry.trades.forEach(trade => {
          if (trade.pnl !== undefined) {
            dailyData[dayOfWeek].trades += 1;
            if (trade.pnl > 0) {
              dailyData[dayOfWeek].wins += 1;
            }
          }
        });
      }
    }
  });

  return daysOfWeek.map(day => ({
    day,
    trades: dailyData[day].trades,
    winRate: dailyData[day].trades > 0 ? (dailyData[day].wins / dailyData[day].trades) * 100 : 0,
  }));
};

export const computeMonthlyPnl = (journalEntries: { [date: string]: JournalEntry }): MonthlyPnlData[] => {
  const data: MonthlyPnlData[] = [];
  const today = moment(); // Or determine month from entries if desired for historical data
  const daysInMonth = today.daysInMonth();
  const currentMonthYear = today.format('YYYY-MM');

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonthYear}-${String(d).padStart(2, '0')}`;
    const entry = journalEntries[dateStr];
    let dailyPnl = 0;

    if (entry && entry.trades) {
      dailyPnl = entry.trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    }
    data.push({ date: String(d).padStart(2, '0'), pnl: parseFloat(dailyPnl.toFixed(2)) });
  }
  return data;
};

export const computeSessionPnl = (journalEntries: { [date: string]: JournalEntry }): SessionPnlData[] => {
  // TODO: This requires associating trades with sessions for accurate PnL breakdown.
  // Currently, Trade objects do not store session information.
  // For a real implementation, the Trade type would need a `session?: 'Tokyo' | 'London' | 'NewYork'` field,
  // or PnL calculation would need to infer session based on trade open/close times and session definitions.
  // For now, this will distribute total PnL somewhat randomly as a placeholder.
  
  let totalPnl = 0;
  Object.values(journalEntries).forEach(entry => {
    if (entry.trades) {
      totalPnl += entry.trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    }
  });

  // Distribute total PnL as a mock, ideally this comes from trade-level session data
  const tokyoPnl = totalPnl * 0.3; // Example distribution
  const londonPnl = totalPnl * 0.4;
  const newYorkPnl = totalPnl * 0.3;
  
  return [
    { name: 'Tokyo', value: parseFloat(tokyoPnl.toFixed(2)) },
    { name: 'London', value: parseFloat(londonPnl.toFixed(2)) },
    { name: 'NewYork', value: parseFloat(newYorkPnl.toFixed(2)) },
  ];
};