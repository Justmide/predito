import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { walletService } from '@/services/walletService'; // Assuming you have a wallet service
 
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  balance: number;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // If we can't decode, treat as expired
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setBalance(0);
  }, []);

  const refreshBalance = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken || isTokenExpired(storedToken)) return;

    try {
      // Use the correct service function which returns a Balance object
      const balanceData = await walletService.getBalance();
      setBalance(parseFloat(balanceData.total || '0'));
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, []);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser && storedUser !== 'undefined') {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        console.log('Token expired, logging out');
        logout();
      } else {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          refreshBalance(); // Fetch balance for the stored user
        } catch (error) {
          // Clear invalid data
          logout();
          console.error('Failed to parse stored user data:', error);
        }
      }
    }
    setIsLoading(false);
  }, [logout, refreshBalance]);

  const login = (newToken: string, newUser: User) => {
    if (!newToken || !newUser) {
      console.error('Invalid login data provided');
      return;
    }
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    refreshBalance(); // Fetch balance on new login
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        balance,
        token, 
        login, 
        logout, 
        isAuthenticated: !!token && !isTokenExpired(token), // This is correct
        isLoading,
        refreshBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
