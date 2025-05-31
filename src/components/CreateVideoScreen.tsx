
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CreateVideoScreen = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Create Video</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8">
        {/* Video Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">📁</span>
          </div>
          <p className="text-gray-600 mb-2">
            <span className="text-red-500 font-semibold">Click to Upload</span> or drag and drop
          </p>
          <p className="text-gray-400 text-sm">(Max. File size: 120 MB)</p>
        </div>

        {/* Video Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Video title</label>
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl min-h-[120px] resize-none"
            />
          </div>

          {/* Tags, Category, Visibility */}
          <div className="flex space-x-4">
            <Button variant="outline" className="rounded-xl relative">
              Tags
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Button>
            <Button variant="outline" className="rounded-xl">
              Category ↓
            </Button>
            <Button variant="outline" className="rounded-xl">
              Visibility ↓
            </Button>
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-gray-700 font-semibold mb-4">Thumbnail</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">📁</span>
            </div>
            <p className="text-gray-600 mb-2">
              <span className="text-red-500 font-semibold">Click to Upload</span> or drag and drop
            </p>
            <p className="text-gray-400 text-sm">(Max. File size: 25 MB)</p>
          </div>
        </div>

        {/* Upload Button */}
        <Button className="w-full bg-teal-400 hover:bg-teal-500 text-white py-4 rounded-xl text-lg font-semibold">
          Upload Video
        </Button>
      </div>
    </div>
  );
};

export default CreateVideoScreen;
