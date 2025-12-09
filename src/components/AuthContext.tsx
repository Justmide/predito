import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  balance: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // In a real app, you'd initialize this from localStorage or an API call
  const [user, setUser] = useState<User | null>({ name: 'Satoshi', balance: 1000 });
  const isLoggedIn = !!user;

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  const value = {
    isLoggedIn,
    user,
    login,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};