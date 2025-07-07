
import React from 'react';
import { FaQuestionCircle, FaBell, FaUserCircle } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store'; // Added AppDispatch
import { markAllNotificationsAsRead } from '../store/toastSlice'; // Added action
import SyncIndicator from './SyncIndicator';

interface TopBarProps {
  onHelpClick: () => void;
  onSettingsClick: () => void;
  onShowAuth: () => void;
}

const TopBarComponent: React.FC<TopBarProps> = ({ onHelpClick, onSettingsClick, onShowAuth }) => {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const notificationLog = useSelector((state: RootState) => state.toast.notificationLog);

  const unreadCount = notificationLog.filter(n => !n.isRead).length;

  const handleNotificationsClick = () => {
    dispatch(markAllNotificationsAsRead());
    // In a future update, this could open a notification center panel/modal.
    // For now, it just marks all as read.
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 px-6 py-3 shadow-md print:hidden">
      <div className="text-xl font-semibold text-white">
        Forex Session Tracker
      </div>
      <div className="flex items-center space-x-4">
        <SyncIndicator />
        <button onClick={onHelpClick} title="Help / AI Assistant" className="text-gray-400 hover:text-indigo-400 transition-colors">
          <FaQuestionCircle size={20} />
        </button>
        <button 
          onClick={handleNotificationsClick} 
          title="Notifications" 
          className="text-gray-400 hover:text-indigo-400 transition-colors relative"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "No new notifications"}
        >
          <FaBell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {user ? (
           <button onClick={onSettingsClick} title="User Settings" className="flex items-center space-x-2 text-gray-400 hover:text-indigo-400 transition-colors">
            <FaUserCircle size={24} />
            <span className="text-sm hidden md:block">{user.displayName || user.email || 'User Profile'}</span>
          </button>
        ) : (
          <button onClick={onShowAuth} title="Login" className="text-gray-400 hover:text-indigo-400 transition-colors">
            <FaUserCircle size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TopBarComponent);
