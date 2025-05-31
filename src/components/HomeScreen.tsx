
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const favoriteChannels = [
    { name: 'Sophia Evans', status: 'Online', avatar: '/placeholder.svg?height=80&width=80', color: 'bg-teal-400' },
    { name: 'Aron Leal', status: 'Offline', avatar: '/placeholder.svg?height=80&width=80', color: 'bg-red-500' },
    { name: 'Noah Reed', status: 'Online', avatar: '/placeholder.svg?height=80&width=80', color: 'bg-teal-400' },
    { name: 'Mia Turner', status: 'Online', avatar: '/placeholder.svg?height=80&width=80', color: 'bg-teal-400' },
  ];

  const videos = [
    {
      id: 1,
      title: 'How to code better',
      creator: 'Aron Leal',
      views: '59302 views',
      duration: '10:40',
      thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
    },
    {
      id: 2,
      title: 'Design masterclass',
      creator: 'Noah Reed',
      views: '85723 views',
      duration: '21:30',
      thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=225&fit=crop',
    },
    {
      id: 3,
      title: 'Creative process',
      creator: 'Sarah Kim',
      views: '42150 views',
      duration: '15:20',
      thumbnail: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=225&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`text-lg font-semibold ${
                activeTab === 'home' ? 'text-black border-b-2 border-black' : 'text-gray-400'
              }`}
            >
              Home page
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`text-lg font-semibold ${
                activeTab === 'subscription' ? 'text-black border-b-2 border-black' : 'text-gray-400'
              }`}
            >
              Subscription
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search"
            className="pl-12 py-4 rounded-xl border-gray-200"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-8">
          <Button variant="outline" className="rounded-xl">
            Sort ↓
          </Button>
          <Button variant="outline" className="rounded-xl relative">
            Filter
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>
          <Button variant="outline" className="rounded-xl">
            Categories ↓
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === 'home' && (
          <>
            {/* Favorite Channels */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Your favourite channels</h2>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {favoriteChannels.map((channel, index) => (
                  <div key={index} className="flex-shrink-0 text-center">
                    <div className={`w-16 h-16 ${channel.color} rounded-xl mb-2 flex items-center justify-center relative`}>
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      {channel.status === 'Online' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <p className="font-semibold text-sm">{channel.name}</p>
                    <p className="text-xs text-gray-500">{channel.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Videos */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">New Videos</h2>
              <div className="grid grid-cols-1 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => navigate(`/video/${video.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="relative rounded-xl overflow-hidden mb-3">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-y-[6px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <img
                        src={`/placeholder.svg?height=40&width=40`}
                        alt={video.creator}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{video.title}</h3>
                        <p className="text-gray-600 text-sm">{video.creator}</p>
                        <p className="text-gray-500 text-sm">{video.views}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
