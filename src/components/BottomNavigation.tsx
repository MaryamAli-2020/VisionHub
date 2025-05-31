
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Plus } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'streaming', label: 'Streaming Tv', path: '/', icon: '📺' },
    { id: 'network', label: 'Network', path: '/network', icon: '🌐' },
    { id: 'create', label: '', path: '/create', icon: 'plus' },
    { id: 'library', label: 'Library', path: '/library', icon: '📚' },
    { id: 'profile', label: 'Profile', path: '/profile', icon: 'user' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          if (tab.id === 'create') {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 ${
                isActive ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {tab.icon === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <span className="text-lg">{tab.icon}</span>
              )}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
