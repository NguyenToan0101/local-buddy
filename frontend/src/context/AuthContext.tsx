import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import type { User } from '../services/auth';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithToken: (token: string) => Promise<User>;
  register: (userData: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const storeAuth = useCallback((nextUser: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearAuth();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const freshUser = await authService.fetchMe(token);
        if (!cancelled) {
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const login = async (email: string, password: string) => {
    const { user, token } = await authService.login(email, password);
    storeAuth(user, token);
    return user;
  };

  const loginWithToken = useCallback(async (token: string) => {
    const user = await authService.fetchMe(token);
    storeAuth(user, token);
    return user;
  }, [storeAuth]);

  const register = async (userData: any) => {
    const { user, token } = await authService.register(userData);
    if (token === 'OTP_SENT') {
      return { otpRequired: true, email: user.email, name: user.name, role: user.role };
    }
    storeAuth(user, token);
    return user;
  };

  const verifyOtp = async (email: string, otp: string) => {
    const { user, token } = await authService.verifyOtp(email, otp);
    storeAuth(user, token);
    return user;
  };

  const logout = () => {
    clearAuth();
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateProfile(user.id, userData);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, verifyOtp, logout, updateUser }}>
      {!loading && children}
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
