
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/rootReducer';
import { removeToast, addToast } from '../store/toastSlice';
import { ToastMessage } from '../types';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 2500); // Default 2.5 seconds duration

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <span className="text-green-500"><FaCheckCircle size={20} /></span>;
      case 'error':
        return <span className="text-red-500"><FaExclamationCircle size={20} /></span>;
      case 'info':
        return <span className="text-blue-500"><FaInfoCircle size={20} /></span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`max-w-sm w-full bg-gray-700 shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden my-2 border-l-4 ${
        toast.type === 'success' ? 'border-green-500' : toast.type === 'error' ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-100">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(toast.id)}
              className="inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <FaTimes size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastNotificationsContainer: React.FC = () => {
  const toasts = useSelector((state: RootState) => state.toast.messages);
  const dispatch = useDispatch();

  const handleDismiss = (id: string) => {
    dispatch(removeToast(id));
  };

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end z-[100]" // Ensure high z-index
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};

export default ToastNotificationsContainer;
