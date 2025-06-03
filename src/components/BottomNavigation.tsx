import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, User, Video, Earth, Settings } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string | string[]) => {
    if (Array.isArray(path)) {
      return path.some(p => location.pathname.startsWith(p));
    }
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-50">
      <div className="flex justify-around items-center">        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center p-2 ${
            (location.pathname === '/' || location.pathname.startsWith('/network')) ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
          <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center p-2 ${
            (location.pathname === '/profile' || location.pathname.startsWith('/messages')) ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Earth className="w-6 h-6" />
          <span className="text-xs mt-1">Network</span>
        </button>
        
        <button
          onClick={() => navigate('/create')}
          className={`flex flex-col items-center p-2 ${
            isActive('/create') ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs mt-1">Create</span>
        </button>
        
        <button
          onClick={() => navigate('/library')}
          className={`flex flex-col items-center p-2 ${
            isActive('/library') ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Video className="w-6 h-6" />
          <span className="text-xs mt-1">Library</span>
        </button>        <button
          onClick={() => navigate('/profile-settings')}
          className={`flex flex-col items-center p-2 ${
            location.pathname === '/profile-settings' ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
