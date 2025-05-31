
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import AuthScreen from '../components/AuthScreen';
import MainApp from '../components/MainApp';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return <MainApp />;
};

export default Index;
