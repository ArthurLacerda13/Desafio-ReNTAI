'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Heart, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/token/', { email, password });
      login(response.data.access, response.data.refresh);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Credenciais inválidas. Por favor, verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-surface transition-colors duration-300">
      {/* Theme Toggle Floating */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 w-10 h-10 flex items-center justify-center bg-surface-container-high dark:bg-surface-container text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all shadow-md"
        title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Left Side: Hero Image / Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-highest overflow-hidden items-center justify-center">
        <img
          alt="Medical Tech"
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
          src="https://images.unsplash.com/photo-1576091160550-2173dad99a01?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-surface/80"></div>
        <div className="relative z-10 bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant p-8 rounded-2xl shadow-2xl max-w-md text-center transform -translate-y-1/4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Heart className="w-12 h-12 fill-current" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-on-surface tracking-tighter mb-1">V4H</h1>
          <p className="text-xl font-bold text-primary tracking-widest uppercase">ReNTAI</p>
          <div className="w-16 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto my-6 rounded-full opacity-50"></div>
          <p className="text-lg text-on-surface-variant font-medium leading-relaxed">Conectando especialistas, salvando vidas com precisão clínica.</p>
        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 md:px-10 py-8 bg-surface overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col">
          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Heart className="w-8 h-8 fill-current" />
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">V4H - ReNTAI</h1>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-6 md:p-10 w-full relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-fixed to-primary"></div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-on-surface mb-1">Bem-vindo(a)</h2>
              <p className="text-sm text-on-surface-variant">Módulo de Teleconsultoria Inteligente</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-on-surface" htmlFor="email">E-mail Corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    className="w-full pl-10 pr-3 py-2 bg-surface rounded-lg border border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    id="email"
                    type="email"
                    placeholder="dr.nome@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-on-surface" htmlFor="password">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    className="w-full pl-10 pr-10 py-2 bg-surface rounded-lg border border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="#" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>

              <button
                className="mt-2 w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
                {!loading && <ArrowRight className="w-4.5 h-4.5" />}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-on-surface-variant">
                  Não possui uma conta?{' '}
                  <Link href="/register" className="text-primary font-semibold hover:underline">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center px-4">
            <p className="text-xs text-secondary leading-relaxed">
              Ao prosseguir, você concorda com os nossos{' '}
              <Link href="#" className="underline hover:text-primary transition-colors">Termos de Uso</Link> e{' '}
              <Link href="#" className="underline hover:text-primary transition-colors">Política de Privacidade</Link>{' '}
              em conformidade com a LGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
