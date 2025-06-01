import { useNavigate, useLocation } from 'react-router-dom';
import { User, Plus, Tv, Globe, BookOpen } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'streaming', label: '', path: '/', icon: Tv },
    { id: 'network', label: '', path: '/network', icon: Globe },
    { id: 'create', label: '', path: '/create', icon: Plus },
    { id: 'library', label: '', path: '/library', icon: BookOpen },
    { id: 'profile', label: '', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto px-6 py-3">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const IconComponent = tab.icon;
          
          if (tab.id === 'create') {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                title="Create"
                aria-label="Create"
              >
                <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center space-y-1.5 px-4 py-2 rounded-lg transition-all duration-200 min-w-0 ${
                isActive 
                  ? 'text-teal-600 bg-teal-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <IconComponent 
                className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}`}
              />
              <span className={`text-xs font-medium leading-tight text-center ${
                isActive ? 'font-semibold' : 'font-normal'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;