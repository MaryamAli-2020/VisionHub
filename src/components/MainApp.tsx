
import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import HomeScreen from './HomeScreen';
import VideoPlayer from './VideoPlayer';
import ProfileScreen from './ProfileScreen';
import CreateVideoScreen from './CreateVideoScreen';
import LibraryScreen from './LibraryScreen';

const MainApp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/create" element={<CreateVideoScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
        </Routes>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default MainApp;
