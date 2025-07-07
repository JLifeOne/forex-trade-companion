import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/rootReducer';
import { FaCloud, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const SyncIndicator: React.FC = () => {
  const authStatus = useSelector((state: RootState) => state.auth.isLoading);
  const isSyncing = useSelector((state: RootState) => state.journal.isSyncing);
  const cloudSyncEnabled = true; // Assuming settings are in Redux or accessible

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
  } else if (!authStatus) {
    icon = <FaCheckCircle />;
    title = 'Data synced with cloud';
    colorClass = 'text-green-400';
  } else { // idle or loading but not yet syncing
    icon = <FaCloud />;
    title = 'Cloud sync pending';
    colorClass = 'text-yellow-400';
  }

  return (
    <div title={title} className={`flex items-center space-x-1 p-1 rounded-md ${colorClass} transition-colors`}>
      {icon}
    </div>
  );
};

export default SyncIndicator;