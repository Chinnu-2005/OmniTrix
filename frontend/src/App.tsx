import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { RoomInterface } from './components/RoomInterface';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    // Restore room ID from localStorage on app load
    return localStorage.getItem('currentRoomId');
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (currentRoomId) {
    return <RoomInterface roomId={currentRoomId} onLeave={() => {
      setCurrentRoomId(null);
      localStorage.removeItem('currentRoomId');
    }} />;
  }

  return <Dashboard onRoomJoin={(roomId) => {
    setCurrentRoomId(roomId);
    localStorage.setItem('currentRoomId', roomId);
  }} />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
