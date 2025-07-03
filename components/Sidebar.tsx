
import React, { useState } from 'react';
import { FaBars, FaSearch, FaHome, FaChartBar, FaClipboardList, FaUser, FaCog, FaSignOutAlt, FaBolt, FaNewspaper, FaUsers, FaTrophy, FaSignInAlt, FaBookOpen, FaFlask, FaEdit, FaListAlt } from 'react-icons/fa'; // Added FaListAlt for Trading Plan
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store'; // Import AppDispatch
import { logoutFromFirebase } from '../store/authSlice'; 


interface SidebarProps {
  onShowAuth: () => void;
  onShowStrategyLibrary: () => void;
  onShowBacktestModal: () => void;
  onShowOrderModal: () => void;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ onShowAuth, onShowStrategyLibrary, onShowBacktestModal, onShowOrderModal }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>(); // Typed dispatch
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation(); // For active route highlighting

  const handleLogout = () => {
    dispatch(logoutFromFirebase()); 
    navigate('/dashboard'); // Redirect to dashboard after logout
  };


  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <FaHome />, path: '/dashboard' },
    { name: 'Analytics', icon: <FaChartBar />, path: '/analytics' },
    { name: 'Journal', icon: <FaClipboardList />, path: '/journal' },
    { name: 'Trading Plan', icon: <FaListAlt />, path: '/trading-plan' }, // Added Trading Plan
    { name: 'AI Signals', icon: <FaBolt />, path: '/signals'},
    { name: 'Strategy Library', icon: <FaBookOpen />, action: onShowStrategyLibrary },
    { name: 'Backtest', icon: <FaFlask />, action: onShowBacktestModal },
    { name: 'Place Order', icon: <FaEdit />, action: onShowOrderModal },
    { name: 'Trade History', icon: <FaClipboardList />, path: '/trades'},
    { name: 'News', icon: <FaNewspaper />, path: '/news' },
    { name: 'Community', icon: <FaUsers />, path: '/community' },
    { name: 'Leaderboard', icon: <FaTrophy />, path: '/leaderboard' },
    { name: 'Profile', icon: <FaUser />, path: '/profile' },
  ];

  const bottomItems: MenuItem[] = [
    { name: 'Settings', icon: <FaCog />, path: '/settings' },
  ];


  return (
    <div className={`bg-gray-800 h-full flex flex-col shadow-lg print:hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <span className="text-white text-2xl font-bold">ForexTrack</span>}
        <button
          className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-white text-xl"><FaBars /></span>
        </button>
      </div>

      {!collapsed && (
        <div className="flex items-center m-4 bg-gray-700 rounded-lg p-2 shadow-sm">
          <span className="text-gray-400"><FaSearch /></span>
          <input type="text" placeholder="Search..." className="bg-transparent ml-2 flex-1 text-sm text-gray-200 focus:outline-none placeholder-gray-400" />
        </div>
      )}

      <nav className="flex-1 mt-2 space-y-1 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.path ? location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/dashboard' && item.path !== '/') : false;
           // Special handling for dashboard to avoid it being active for all sub-routes if path is '/'
          if (item.path === '/dashboard' && location.pathname !== '/dashboard' && location.pathname !== '/') {
            // isActive = false; // No, this logic is flawed. Simple equality is better.
          }


          const linkOrButtonClasses = `w-full flex items-center p-3 rounded-lg transition-colors duration-200 group relative ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600 hover:text-white'}`;
          
          const content = (
            <>
              <span className={`text-xl ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.icon}</span>
              {!collapsed && <span className={`ml-4 text-sm font-medium ${isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>{item.name}</span>}
              {collapsed && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {item.name}
                  </span>
              )}
            </>
          );

          if (item.path) {
            return (
              <Link
                to={item.path}
                key={item.name}
                className={linkOrButtonClasses}
              >
                {content}
              </Link>
            );
          } else if (item.action) {
            return (
              <button
                onClick={item.action}
                key={item.name}
                className={`${linkOrButtonClasses} text-left`}
                aria-label={item.name}
              >
                {content}
              </button>
            );
          }
          return null;
        })}
      </nav>

      <div className="mt-auto p-2 border-t border-gray-700 space-y-1">
        {bottomItems.map((item) => {
           const isActive = item.path ? location.pathname === item.path || location.pathname.startsWith(item.path) : false;
           const linkClasses = `w-full flex items-center p-3 rounded-lg transition-colors duration-200 group relative ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600 hover:text-white'}`;
          return (
            <Link
              to={item.path!}
              key={item.name}
              className={linkClasses}
            >
              <span className={`text-xl ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.icon}</span>
              {!collapsed && <span className={`ml-4 text-sm font-medium ${isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>{item.name}</span>}
              {collapsed && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {item.name}
                  </span>
              )}
            </Link>
          );
        })}
         {user ? (
            <button
                onClick={handleLogout}
                className={`w-full flex items-center p-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 group relative ${collapsed ? 'justify-center' : ''} text-gray-300`}
            >
                <span className="text-xl text-gray-300 group-hover:text-white"><FaSignOutAlt /></span>
                {!collapsed && <span className="ml-4 text-sm font-medium text-gray-200 group-hover:text-white">Logout</span>}
                {collapsed && (
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Logout
                    </span>
                )}
            </button>
        ) : (
            <button
                onClick={onShowAuth}
                className={`w-full flex items-center p-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-200 group relative ${collapsed ? 'justify-center' : ''} text-gray-300`}
            >
                <span className="text-xl text-gray-300 group-hover:text-white"><FaSignInAlt /></span>
                {!collapsed && <span className="ml-4 text-sm font-medium text-gray-200 group-hover:text-white">Login</span>}
                {collapsed && (
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Login
                    </span>
                )}
            </button>
        )}
      </div>
    </div>
  );
}
export default React.memo(SidebarComponent);
