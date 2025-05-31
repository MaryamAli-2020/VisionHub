
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ProfileScreen = () => {
  const navigate = useNavigate();

  const friends = [
    { name: 'Alex Chen', avatar: '/placeholder.svg?height=60&width=60' },
    { name: 'Sarah Kim', avatar: '/placeholder.svg?height=60&width=60' },
    { name: 'Maya Patel', avatar: '/placeholder.svg?height=60&width=60' },
    { name: 'David Lee', avatar: '/placeholder.svg?height=60&width=60' },
    { name: 'Emma Wilson', avatar: '/placeholder.svg?height=60&width=60' },
    { name: 'Jordan Brown', avatar: '/placeholder.svg?height=60&width=60' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=800&h=600&fit=crop&opacity=30"
            alt="Background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        {/* Camera equipment overlay */}
        <div className="absolute top-10 left-10 opacity-40">
          <div className="w-32 h-20 bg-gray-800 rounded-lg"></div>
        </div>
        <div className="absolute top-20 right-20 opacity-40">
          <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
        </div>
      </div>

      <div className="relative z-10 p-6 pt-16">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src="/placeholder.svg?height=120&width=120"
              alt="Kelvin Wing"
              className="w-30 h-30 rounded-full border-4 border-white"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Kelvin Wing</h1>
          <p className="text-white/80 text-lg">Video Editor</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
            Edit Profile
          </Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
            Feed
          </Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
            Messages
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Friends */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">My Friends (187)</h2>
              <span className="text-red-400 font-semibold">ALL</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {friends.map((friend, index) => (
                <div key={index} className="text-center">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full mx-auto mb-1"
                  />
                  <p className="text-white text-xs">{friend.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Post */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Publish Post</h2>
            <textarea
              placeholder="Text here"
              className="w-full h-24 bg-white/20 border border-white/30 rounded-xl p-3 text-white placeholder-white/60 resize-none mb-4"
            />
            <div className="flex items-center justify-between">
              <button className="text-white/60">
                <span className="text-2xl">📎</span>
              </button>
              <Button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl">
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* My News */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">My News</h2>
          <div className="flex space-x-4">
            <img
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=120&fit=crop"
              alt="News"
              className="w-24 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-white/80 text-sm">
                Description. Lorem ipsum dolor sit amet consectetur adipiscing elit, sed do...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
