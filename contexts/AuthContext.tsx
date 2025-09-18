import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginData, RegisterData } from '../types/auth';
import ApiService from '../services/api';

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const user = await ApiService.getCurrentUser();
        setAuthState({ user, token, isLoading: false });
      } else {
        setAuthState({ user: null, token: null, isLoading: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('token');
      setAuthState({ user: null, token: null, isLoading: false });
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await ApiService.login(data);
      await AsyncStorage.setItem('token', response.token);
      setAuthState({
        user: response.user,
        token: response.token,
        isLoading: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await ApiService.register(data);
      await AsyncStorage.setItem('token', response.token);
      setAuthState({
        user: response.user,
        token: response.token,
        isLoading: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setAuthState({ user: null, token: null, isLoading: false });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};