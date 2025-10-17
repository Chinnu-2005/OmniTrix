import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from '../lib/api';
import { socketClient } from '../lib/socket';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        apiClient.setToken(token);
        socketClient.connect(token);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    await apiClient.signup(username, email, password);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;
        setUser(userData);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        apiClient.setToken(accessToken);
        socketClient.connect(accessToken);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    apiClient.clearToken();
    socketClient.disconnect();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
