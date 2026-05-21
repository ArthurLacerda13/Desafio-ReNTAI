'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SOLICITANTE' | 'ESPECIALISTA';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. CORREÇÃO: Declarar o logout PRIMEIRO para disponibilizar a referência no escopo superior
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  // 2. CORREÇÃO: fetchUser agora lê uma referência estável e existente de logout
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me/');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout(); // Execução segura
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    fetchUser();
    router.push('/dashboard');
  };

  // 3. O efeito de montagem consome as funções já declaradas sem gerar ciclos repetitivos
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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