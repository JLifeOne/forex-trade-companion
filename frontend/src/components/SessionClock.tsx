import React from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment-timezone';
import { RootState } from '../store/rootReducer';
import { FOREX_SESSIONS } from '../constants';
import { FaClock, FaGlobeAmericas } from 'react-icons/fa';
import { SessionStatus } from '../types';

const SessionClock: React.FC = () => {
  const { localTime, timezones, sessionStatus } = useSelector((state: RootState) => state.session);

  const getStatusColor = (status: 'open' | 'opening_soon' | 'closed'): string => {
    if (status === 'open') return 'bg-green-500';
    if (status === 'opening_soon') return 'bg-yellow-500';
    return 'bg-red-600'; // Changed from gray for more distinction
  };

  const getStatusText = (status: 'open' | 'opening_soon' | 'closed'): string => {
    if (status === 'open') return 'Open';
    if (status === 'opening_soon') return 'Opening Soon';
    return 'Closed';
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
          <span className="mr-3 text-indigo-400"><FaGlobeAmericas /></span>
          Session Tracker
        </h2>
        <div className="flex items-center text-lg font-mono text-gray-300 bg-gray-700 px-3 py-1 rounded-md shadow-sm">
           <span className="mr-2 text-indigo-400"><FaClock /></span> {localTime} (Local)
        </div>
      </div>
      
      <div className="space-y-3">
        {FOREX_SESSIONS.map((session) => {
          const sessionCurrentTime = timezones[session.timezone as keyof typeof timezones] || '--:--';
          const status = sessionStatus[session.name as keyof SessionStatus];
          const openLocal = moment.utc().hour(session.utcOpen).minute(0).tz(moment.tz.guess()).format('HH:mm');
          const closeLocal = moment.utc().hour(session.utcClose).minute(0).tz(moment.tz.guess()).format('HH:mm');
          const statusText = getStatusText(status);

          return (
            <div key={session.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition-colors duration-150">
              <div className="flex items-center space-x-3">
                <span 
                  className={`w-4 h-4 rounded-full ${getStatusColor(status)} ring-2 ring-offset-2 ring-offset-gray-700 ${getStatusColor(status).replace('bg-', 'ring-')}`}
                  title={`${session.name} Session: ${statusText}`}
                ></span>
                <span className="text-base font-medium text-gray-100 w-20">{session.name}</span>
              </div>
              <div className="text-sm text-gray-300 w-36 text-center">
                {openLocal} - {closeLocal} (Local)
              </div>
              <div className="text-base font-mono text-gray-200 w-24 text-right">{sessionCurrentTime}</div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full w-28 text-center ${
                status === 'open' ? 'bg-green-200 text-green-800' : 
                status === 'opening_soon' ? 'bg-yellow-200 text-yellow-800' : 
                'bg-red-200 text-red-800' // Changed from gray
              }`}>
                {statusText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionClock;