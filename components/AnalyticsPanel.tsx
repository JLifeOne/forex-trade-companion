
import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { RootState } from '../store/rootReducer';
import { computeDailyWinRates, computeMonthlyPnl, computeSessionPnl } from '../utils/analyticsUtils';
import { JournalEntry } from '../types'; // Added import
import { FaChartBar, FaChartLine, FaChartPie, FaThermometerHalf, FaInfoCircle } from 'react-icons/fa';

const AnalyticsPanelComponent: React.FC = () => {
  const journalEntries = useSelector((state: RootState) => state.journal.entries);

  // Memoize these calculations if they become expensive and entries don't change often on this view
  const dailyRatesData = React.useMemo(() => computeDailyWinRates(journalEntries), [journalEntries]);
  const monthlyPnlData = React.useMemo(() => computeMonthlyPnl(journalEntries), [journalEntries]);
  const sessionPnlData = React.useMemo(() => computeSessionPnl(journalEntries), [journalEntries]);

  const COLORS_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Blue, Green, Yellow, Orange
  const COLORS_BAR = ['#8884d8', '#82ca9d', '#ffc658']; // Purple, Teal, Yellow

  // Placeholder for heatmap data (remains mock as it needs more complex data structuring)
  const heatmapData = Array.from({ length: 7 * 5 }, (_, i) => ({ // 7 days, 5 weeks representation
    day: i % 7,
    week: Math.floor(i / 7),
    value: Math.random(), // Random win rate or PnL intensity
  }));
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const hasTradeData = React.useMemo(() => {
    return Object.values(journalEntries).some((entry: JournalEntry) => entry.trades && entry.trades.length > 0 && entry.trades.some(trade => trade.pnl !== undefined));
  }, [journalEntries]);


  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: string | number; color?: string; fill?: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-700 p-2 border border-gray-600 rounded shadow-lg text-sm">
          <p className="label text-indigo-300">{`${label}`}</p>
          {payload.map((entry: { name: string; value: string | number; color?: string; fill?: string }, index: number) => (
             <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
                {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(entry.name === 'Win Rate' || entry.name === 'winRate' ? 1 : 2) : entry.value}${entry.name === 'Win Rate' || entry.name === 'winRate' ? '%' : ''}`}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 space-y-8">
      <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
        <span className="mr-3 text-indigo-400"><FaChartBar /></span>
        Performance Analytics
      </h2>

      {!hasTradeData ? (
        <div className="bg-gray-700 p-6 rounded-lg shadow-md text-center">
          <span className="text-indigo-400 text-3xl mb-3 block"><FaInfoCircle /></span>
          <p className="text-lg text-gray-300">No trading data available to generate analytics.</p>
          <p className="text-sm text-gray-400 mt-1">Please log some trades with P&L in your journal to see your performance metrics.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Win Rate & PnL Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-indigo-300 mb-3 flex items-center"><span className="mr-2"><FaChartBar /></span>Daily Win Rate (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyRatesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} unit="%" domain={[0, 100]}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }}/>
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="winRate" name="Win Rate" fill={COLORS_BAR[0]} radius={[4, 4, 0, 0]} barSize={20}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-indigo-300 mb-3 flex items-center"><span className="mr-2"><FaChartLine /></span>Monthly PnL Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyPnlData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS_BAR[1], strokeWidth: 1 }}/>
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Line type="monotone" dataKey="pnl" name="PnL" stroke={COLORS_BAR[1]} strokeWidth={2} dot={{ r: 4, fill: COLORS_BAR[1]}} activeDot={{ r: 6 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 2: Session PnL & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-indigo-300 mb-3 flex items-center"><span className="mr-2"><FaChartPie /></span>Session PnL Distribution (Overall)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionPnlData.filter(s => s.value !== 0)} // Filter out zero values for better visualization
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%): ${value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {sessionPnlData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />}/>
                  <Legend iconType="circle" wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
              </ResponsiveContainer>
               <p className="text-xs text-gray-500 mt-1 text-center">Note: Session PnL is based on total PnL distribution and requires trade-level session data for true accuracy.</p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-indigo-300 mb-3 flex items-center"><span className="mr-2"><FaThermometerHalf /></span>Trading Performance Heatmap (Mock)</h3>
                <div className="grid grid-cols-7 gap-1 h-[280px]">
                    {daysOfWeek.map(dayName => (
                        <div key={dayName} className="text-center text-xs text-gray-400 font-medium">{dayName}</div>
                    ))}
                    {heatmapData.map((cell, idx) => {
                        const intensity = Math.floor(cell.value * 255);
                        const color = cell.value > 0.66 ? `rgb(50, ${intensity}, 100)` : cell.value > 0.33 ? `rgb(${intensity}, ${intensity}, 50)` : `rgb(${intensity}, 50, 50)`; // Greenish, Yellowish, Reddish
                        return <div key={idx} style={{ backgroundColor: color, height: '40px' }} className="rounded flex items-center justify-center text-white text-xs opacity-75 hover:opacity-100 transition-opacity" title={`Mock Performance: ${(cell.value * 100).toFixed(0)}`}>{(cell.value * 100).toFixed(0)}</div>;
                    })}
                </div>
                 <p className="text-xs text-gray-500 mt-2 text-center">Mock data representing daily performance intensity.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(AnalyticsPanelComponent);