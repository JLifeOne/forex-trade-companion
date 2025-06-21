
import { Trade } from '../types';

let mockTrades: Trade[] = [
  { id: '1', symbol: 'EUR/USD', side: 'buy', size: 0.1, openPrice: 1.0850, closePrice: 1.0870, pnl: 20, openTime: new Date(Date.now() - 3600000 * 2).toISOString(), closeTime: new Date(Date.now() - 3600000).toISOString(), sl: 1.0830, tp: 1.0900 },
  { id: '2', symbol: 'GBP/JPY', side: 'sell', size: 0.05, openPrice: 190.50, closePrice: 190.00, pnl: 25, openTime: new Date(Date.now() - 3600000 * 5).toISOString(), closeTime: new Date(Date.now() - 3600000 * 3).toISOString(), sl: 191.00, tp: 189.50 },
];

export const placeOrder = async (order: { symbol: string; side: 'buy' | 'sell'; size: number; sl?: number; tp?: number }): Promise<Trade> => {
  console.log('Placing order (mock):', order);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  const newTrade: Trade = {
    id: String(Date.now()),
    symbol: order.symbol,
    side: order.side,
    size: order.size,
    openPrice: Math.random() * 0.01 + 1.0800, // Mock price
    openTime: new Date().toISOString(),
    sl: order.sl,
    tp: order.tp,
  };
  // For simplicity, we don't add to mockTrades here as it's an open position.
  // getTradeHistory usually returns closed trades.
  // alert('Mock order placed successfully. Check console.');
  return newTrade;
};

export const getTradeHistory = async (): Promise<Trade[]> => {
  console.log('Fetching trade history (mock)');
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockTrades].sort((a,b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
};

export const getOpenPositions = async (): Promise<Trade[]> => {
  console.log('Fetching open positions (mock)');
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return a couple of mock open positions for demonstration
  return [
    { id: 'open1', symbol: 'AUD/USD', side: 'buy', size: 0.2, openPrice: 0.6650, openTime: new Date(Date.now() - 3600000).toISOString(), sl: 0.6620, tp: 0.6700, pnl: 15 /* mock floating pnl */ },
  ];
};
