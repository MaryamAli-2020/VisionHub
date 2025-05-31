
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LibraryScreen = () => {
  const [activeTab, setActiveTab] = useState('articles');

  const articles = [
    {
      id: 1,
      title: 'Video ideas for beginners using DSLR',
      date: 'May 25, 2022',
      category: 'IDEAS',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop',
    },
    {
      id: 2,
      title: 'How to make a movie: 4',
      date: 'June 6, 2022',
      category: 'TUTORIAL',
      description: 'Description. Lorem ipsum dolor sit',
      image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=300&h=200&fit=crop',
    },
    {
      id: 3,
      title: 'Online media streaming',
      date: 'June 26, 2022',
      category: 'TUTORIAL',
      description: 'Description. Lorem ipsum dolor sit',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop',
    },
    {
      id: 4,
      title: 'Which streaming services do you need',
      date: 'May 29, 2022',
      category: 'IDEAS',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=200&fit=crop',
    },
  ];

  const webinars = [
    {
      id: 1,
      title: 'Webinar: innovation and management',
      date: 'MAY 25, 2024',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop',
    },
    {
      id: 2,
      title: 'Unlocking Success: Mastering Product Discovery',
      date: 'JUNE 9, 2024',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop',
    },
    {
      id: 3,
      title: 'Engaging in Learning: Join Our Live Session!',
      date: 'LIVE',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop',
    },
    {
      id: 4,
      title: 'Connections: Engaging in Virtual Learning',
      date: 'OCTOBER 1, 2024',
      image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=300&h=200&fit=crop',
    },
  ];

  const masterClasses = [
    {
      id: 1,
      title: 'Mastering Digital Marketing Strategies',
      instructor: 'David Chen',
      duration: '2 HOURS',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop',
    },
    {
      id: 2,
      title: 'Introduction to Graphic Design Basics',
      instructor: 'Sarah Thompson',
      duration: '1.5 HOURS',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop',
    },
  ];

  const availableClasses = [
    {
      id: 1,
      title: 'Creating Engaging content for Social Media',
      instructor: 'Liza Martinez',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=80&h=80&fit=crop',
    },
    {
      id: 2,
      title: 'Photography Essentials for Beginners',
      instructor: 'Emma Johnson',
      image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=80&h=80&fit=crop',
    },
    {
      id: 3,
      title: 'Financial Literacy for Entrepreneurs',
      instructor: 'Marcus Chen',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=80&h=80&fit=crop',
    },
  ];

  const tabs = [
    { id: 'articles', label: 'Articles' },
    { id: 'webinars', label: 'Webinars' },
    { id: 'masterclasses', label: 'Master Classes' },
    { id: 'help', label: 'Help Requests' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Tabs */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex space-x-8 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-lg font-semibold ${
                activeTab === tab.id ? 'text-black border-b-2 border-black' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          {activeTab === 'masterclasses' && (
            <>
              <Button variant="outline" className="rounded-xl">
                Categories ↓
              </Button>
              <Button variant="outline" className="rounded-xl relative">
                Filter
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
            </>
          )}
          {activeTab === 'articles' && (
            <Button variant="outline" className="rounded-xl">
              Categories ↓
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-20">
        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-teal-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {article.category}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{article.date}</p>
                {article.description && (
                  <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                )}
                <Button variant="outline" className="rounded-xl border-red-500 text-red-500 hover:bg-red-50">
                  Read More →
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'webinars' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {webinars.map((webinar) => (
              <div key={webinar.id} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img
                    src={webinar.image}
                    alt={webinar.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-teal-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {webinar.date}
                  </div>
                  {webinar.date === 'LIVE' && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      LIVE •
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-4">{webinar.title}</h3>
                <Button variant="outline" className="rounded-xl border-red-500 text-red-500 hover:bg-red-50">
                  View →
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'masterclasses' && (
          <>
            {/* Featured Classes */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-6">Featured Classes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {masterClasses.map((masterClass) => (
                  <div key={masterClass.id} className="group cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden mb-4">
                      <img
                        src={masterClass.image}
                        alt={masterClass.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-teal-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {masterClass.duration}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{masterClass.title}</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <img
                        src="/placeholder.svg?height=24&width=24"
                        alt={masterClass.instructor}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-red-500 font-semibold">{masterClass.instructor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Classes */}
            <div>
              <h2 className="text-xl font-bold mb-6">Available classes</h2>
              <div className="space-y-4">
                {availableClasses.map((class_item) => (
                  <div key={class_item.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <img
                      src={class_item.image}
                      alt={class_item.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{class_item.title}</h3>
                      <p className="text-gray-500">{class_item.instructor}</p>
                    </div>
                    <span className="text-gray-400">→</span>
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

export default LibraryScreen;
