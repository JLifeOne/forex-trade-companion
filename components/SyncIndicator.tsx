
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/rootReducer';
import { FaCloud, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const SyncIndicator: React.FC = () => {
  const authStatus = useSelector((state: RootState) => state.auth.status);
  const isSyncing = useSelector((state: RootState) => state.auth.syncing);
  const cloudSyncEnabled = useSelector(() => getAppSettings().cloudSync); // Assuming settings are in Redux or accessible

  // Helper function to get settings, ideally from Redux or context, fallback to localStorage
  function getAppSettings() { 
    const raw = localStorage.getItem('forexAppSettings');
    return raw ? JSON.parse(raw) : { cloudSync: false };
  }

  let icon: React.ReactNode;
  let title: string;
  let colorClass: string;

  if (!cloudSyncEnabled) {
    icon = <FaCloud />;
    title = 'Cloud sync disabled';
    colorClass = 'text-gray-500';
  } else if (isSyncing) {
    icon = (
        <div className="animate-pulse">
            <FaCloudUploadAlt />
        </div>
    );
    title = 'Syncing data...';
    colorClass = 'text-blue-400';
  } else if (authStatus === 'succeeded') {
    icon = <FaCheckCircle />;
    title = 'Data synced with cloud';
    colorClass = 'text-green-400';
  } else if (authStatus === 'failed') {
    icon = <FaExclamationCircle />;
    title = 'Sync failed. Check connection or login.';
    colorClass = 'text-red-400';
  } else { // idle or loading but not yet syncing
    icon = <FaCloud />;
    title = 'Cloud sync pending';
    colorClass = 'text-yellow-400';
  }

  return (
    <div title={title} className={`flex items-center space-x-1 p-1 rounded-md ${colorClass} transition-colors`}>
      {icon}
      {/* Optional: add text like "Synced" or "Syncing..." if space allows */}
      {/* <span className="text-xs hidden sm:inline">{title.split('.')[0]}</span> */}
    </div>
  );
};

export default SyncIndicator;
