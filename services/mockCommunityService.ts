
import { CommunityEntry, LeaderboardUser } from '../types';
import moment from 'moment';

const mockCommunityEntries: CommunityEntry[] = [
  {
    id: 'c1',
    username: 'TraderPro',
    date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
    strategyTemplate: 'Traded London ORB on GBP/USD. Good momentum.',
    pnl: 150,
    likes: 15,
  },
  {
    id: 'c2',
    username: 'ScalperQueen',
    date: moment().subtract(2, 'hours').format('YYYY-MM-DD'),
    strategyTemplate: 'Quick scalp on EUR/JPY during Tokyo session.',
    pnl: 45,
    likes: 8,
  },
  {
    id: 'c3',
    username: 'NewbieTrader',
    date: moment().subtract(3, 'days').format('YYYY-MM-DD'),
    strategyTemplate: 'Learning VWAP pullbacks. Took a small loss, but learned a lot.',
    pnl: -20,
    likes: 5,
  },
];

const mockLeaderboard: LeaderboardUser[] = [
  { userId: 'lp1', username: 'TopGunTrader', winRate: 0.75, monthlyPnl: 5200 },
  { userId: 'lp2', username: 'ConsistentChloe', winRate: 0.68, monthlyPnl: 3100 },
  { userId: 'lp3', username: 'RiskRewardRon', winRate: 0.55, monthlyPnl: 7800 }, // Higher PnL, lower win rate
];

export const fetchPublicEntries = async (): Promise<CommunityEntry[]> => {
  console.log('Fetching public entries (mock)');
  await new Promise(resolve => setTimeout(resolve, 700));
  return [...mockCommunityEntries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const likeEntry = async (entryId: string): Promise<void> => {
  console.log(`Liking entry (mock): ${entryId}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const entry = mockCommunityEntries.find(e => e.id === entryId);
  if (entry) {
    entry.likes += 1;
  }
  // In a real app, this would be an API call.
};

export const postComment = async (entryId: string, username: string, text: string): Promise<void> => {
    console.log(`Posting comment to entry ${entryId} (mock): ${username} - ${text}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    // Mock adding comment locally
};

export const fetchLeaderboard = async (): Promise<LeaderboardUser[]> => {
  console.log('Fetching leaderboard (mock)');
  await new Promise(resolve => setTimeout(resolve, 600));
  return [...mockLeaderboard].sort((a,b) => b.monthlyPnl - a.monthlyPnl);
};
