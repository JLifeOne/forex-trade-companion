
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getAppSettings, saveAppSettings } from '../services/storageService';
import { FaTimes, FaUserCog, FaCloud, FaSave } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addToast } from '../store/toastSlice';

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsPanelComponent: React.FC<SettingsPanelProps> = ({ visible, onClose }) => {
  const dispatch: AppDispatch = useDispatch();
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [userNameInput, setUserNameInput] = useState<string>(settings.userName || '');

  useEffect(() => {
    // Refresh settings from storage when panel becomes visible
    // This ensures that if settings were changed elsewhere (less likely in this app structure)
    // or if the component is re-mounted, it has the latest.
    if (visible) {
        const currentSettings = getAppSettings();
        setSettings(currentSettings);
        setUserNameInput(currentSettings.userName || '');
    }
  }, [visible]);


  const handleToggleCloudSync = () => {
    setSettings(prev => ({ ...prev, cloudSync: !prev.cloudSync }));
  };

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserNameInput(e.target.value);
  };

  const handleSaveSettings = () => {
    const updatedSettings = { ...settings, userName: userNameInput };
    setSettings(updatedSettings); // Update local component state
    saveAppSettings(updatedSettings); // Persist to localStorage
    dispatch(addToast({ message: 'Settings saved successfully!', type: 'success' }));
    onClose();
  };


  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-gray-800 shadow-2xl rounded-lg w-full max-w-md flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
            <span className="mr-2 text-indigo-400"><FaUserCog /></span> Application Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <FaTimes size={20}/>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-1">Trader Name / Alias</label>
            <input
              type="text"
              id="userName"
              value={userNameInput}
              onChange={handleUserNameChange}
              placeholder="Enter your display name"
              className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-300 mb-2 flex items-center">
              <span className="mr-2 text-indigo-400"><FaCloud /></span> Data Sync (Mock)
            </h4>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cloudSync}
                onChange={handleToggleCloudSync}
                className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-400 focus:ring-offset-gray-800"
              />
              <span className="text-sm text-gray-200">Enable Cloud Sync</span>
            </label>
            {settings.cloudSync ? (
              <p className="text-xs text-green-400 mt-1">Cloud sync is enabled (mock functionality).</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Cloud sync is disabled. Data is stored locally.</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Note: Full cloud sync requires backend setup and authentication, which is mocked in this version.
            </p>
          </div>

        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
            >
                Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center"
            >
              <span className="mr-2"><FaSave /></span> Save Settings
            </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsPanelComponent);
    