
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { RootState } from '../store/rootReducer';
import { JournalEntry } from '../types';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

interface CalendarViewProps {
  onDateSelect?: (date: string) => void; // YYYY-MM-DD
  selectedJournalDate?: string; // YYYY-MM-DD, date currently shown in journal
}

const CalendarView: React.FC<CalendarViewProps> = ({ onDateSelect, selectedJournalDate }) => {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const journalEntries = useSelector((state: RootState) => state.journal.entries);

  const today = moment();

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors text-indigo-400 hover:text-indigo-300"
          aria-label="Previous month"
        >
          <FaChevronLeft size={18} />
        </button>
        <h3 className="text-xl font-semibold text-indigo-300">
          {currentMonth.format('MMMM YYYY')}
        </h3>
        <button
          onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors text-indigo-400 hover:text-indigo-300"
          aria-label="Next month"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = currentMonth.clone().startOf('month').startOf('week');
    const endDate = currentMonth.clone().endOf('month').endOf('week');
    let day = startDate.clone();

    while (day.isSameOrBefore(endDate, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    
    const dayNames = moment.weekdaysShort();

    return (
      <>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
          {dayNames.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const dateKey = d.format('YYYY-MM-DD');
            const entry: JournalEntry | undefined = journalEntries[dateKey];
            const pnl = entry?.trades?.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

            let cellClasses = "h-16 flex flex-col items-center justify-center rounded-lg transition-all duration-150 ease-in-out cursor-pointer text-sm ";
            
            if (!d.isSame(currentMonth, 'month')) {
              cellClasses += "bg-gray-750 text-gray-500 hover:bg-gray-600";
            } else if (selectedJournalDate && dateKey === selectedJournalDate && !d.isSame(today, 'day')) {
              // Highlight for selected journal date, if not today
              cellClasses += "bg-teal-600 text-white font-semibold ring-2 ring-teal-400 hover:bg-teal-500";
            } else if (d.isSame(today, 'day')) {
              // Highlight for today - if also selected, this style might override or combine.
              // If selectedJournalDate IS today, we might want a combined style or let 'today' style take precedence.
              // For now, specific 'today' style:
              const todaySelected = selectedJournalDate && dateKey === selectedJournalDate;
              cellClasses += todaySelected 
                ? "bg-teal-500 text-white font-semibold ring-2 ring-offset-2 ring-offset-gray-800 ring-teal-300 hover:bg-teal-400" // Today and selected
                : "bg-indigo-500 text-white font-semibold ring-2 ring-indigo-300 hover:bg-indigo-400"; // Just today
            } else {
              cellClasses += "bg-gray-700 text-gray-200 hover:bg-gray-600";
            }
            
            if (entry) {
                // Make border more prominent on selected/today cells if they have an entry
                if (dateKey === selectedJournalDate || d.isSame(today, 'day')) {
                     cellClasses += " border-2 ";
                } else {
                     cellClasses += " border border-opacity-50 ";
                }

                if (pnl !== undefined) {
                    if (pnl > 0) cellClasses += "border-green-500";
                    else if (pnl < 0) cellClasses += "border-red-500";
                    else cellClasses += "border-yellow-500"; 
                } else {
                    cellClasses += "border-blue-500"; 
                }
            }


            return (
              <div
                key={dateKey}
                className={cellClasses}
                onClick={() => onDateSelect && onDateSelect(dateKey)}
                title={entry ? `PnL: ${pnl?.toFixed(0) || 'N/A'}` : 'No entry'}
              >
                <span>{d.format('D')}</span>
                {entry && pnl !== undefined && (
                  <span className={`text-xs mt-1 px-1 rounded ${pnl > 0 ? 'bg-green-500/30 text-green-300' : pnl < 0 ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                    {pnl.toFixed(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
       <h2 className="text-xl font-semibold text-indigo-300 flex items-center mb-4">
          <span className="mr-3 text-indigo-400"><FaCalendarAlt /></span>
          Trading Calendar
        </h2>
      {renderHeader()}
      {renderDays()}
    </div>
  );
};

export default CalendarView;
    