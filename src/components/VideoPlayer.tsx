
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const VideoPlayer = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const comments = [
    {
      id: 1,
      user: 'Wijaya Abadi',
      avatar: '/placeholder.svg?height=40&width=40',
      text: 'Can you tell us what skateboard are you using?',
      verified: true,
    },
    {
      id: 2,
      user: 'Johny Wise',
      avatar: '/placeholder.svg?height=40&width=40',
      text: 'Are the equipment he\'s using expensive?',
      verified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Andy William Live</h1>
        <div className="w-10"></div>
      </div>

      {/* Video Player */}
      <div className="relative mx-6 rounded-xl overflow-hidden mb-6">
        <img
          src="https://images.unsplash.com/photo-1549989476-69a92fa57c36?w=800&h=450&fit=crop"
          alt="Video thumbnail"
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          • LIVE
        </div>
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/20 rounded-full h-1 mb-2">
            <div className="bg-white rounded-full h-1 w-1/3"></div>
          </div>
          <div className="flex justify-between text-white text-sm">
            <span>17:34</span>
            <span>59:32</span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="px-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              How to ride your skateboard and Basic Equipment
            </h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/placeholder.svg?height=40&width=40"
                  alt="Andy William"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">Andy William</p>
                  <p className="text-sm text-gray-500">1,980,893 subscribers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-gray-500 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>125,908 views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>47,987 likes</span>
                </div>
              </div>
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-xl">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img
                src={comment.avatar}
                alt={comment.user}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-semibold text-sm">{comment.user}</p>
                  {comment.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
                <p className="text-gray-700 text-sm">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600">•••</span>
          </div>
          <Input
            placeholder="Write your message"
            className="flex-1 rounded-xl"
          />
          <Button className="bg-teal-400 hover:bg-teal-500 w-12 h-12 rounded-xl p-0">
            <span className="text-white">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
