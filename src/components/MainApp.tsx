
import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import HomeScreen from './HomeScreen';
import VideoPlayer from './VideoPlayer';
import ProfileScreen from './ProfileScreen';
import CreateVideoScreen from './CreateVideoScreen';
import LibraryScreen from './LibraryScreen';
import SettingsScreen from './SettingsScreen';
import NetworkScreen from './NetworkScreen';
import { SavedArticlesScreen } from './settings/SavedArticlesScreen';
import { LinkedAccountsScreen } from './settings/LinkedAccountsScreen';
import { MobileNumberScreen } from './settings/MobileNumberScreen';
import { NotificationsScreen } from './settings/NotificationsScreen';

const MainApp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/network" element={<NetworkScreen />} />
          <Route path="/create" element={<CreateVideoScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/profile-settings" element={<SettingsScreen />} />          <Route path="/saved-articles" element={<SavedArticlesScreen />} />
          <Route path="/linked-accounts" element={<LinkedAccountsScreen />} />
          <Route path="/mobile-number" element={<MobileNumberScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/appearance" element={<SettingsScreen />} />
          <Route path="/language" element={<SettingsScreen />} />
          <Route path="/privacy-security" element={<SettingsScreen />} />
          <Route path="/storage" element={<SettingsScreen />} />
        </Routes>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default MainApp;
