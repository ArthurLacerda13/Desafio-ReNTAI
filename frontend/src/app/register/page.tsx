'use client';

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Heart, Eye, EyeOff, AlertCircle, Stethoscope, ClipboardList, CheckCircle, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'SOLICITANTE',
    specialty: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/users/register/', formData);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || 'Ocorreu um erro no cadastro. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
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
          <p className="text-lg text-on-surface-variant font-medium leading-relaxed">Crie sua conta e comece a colaborar em rede.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 md:px-10 py-8 bg-surface overflow-y-auto">
        <div className="w-full max-w-[480px] flex flex-col">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-6 md:p-10 w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-fixed to-primary"></div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-on-surface mb-1">Criar Nova Conta</h2>
              <p className="text-sm text-on-surface-variant">Selecione seu perfil de atuação clínica</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-on-surface" htmlFor="first_name">Nome</label>
                  <input
                    className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    id="first_name"
                    type="text"
                    placeholder="Nome"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-on-surface" htmlFor="last_name">Sobrenome</label>
                  <input
                    className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    id="last_name"
                    type="text"
                    placeholder="Sobrenome"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                    onChange={handleChange}
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
                    onChange={handleChange}
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

              <div className="flex flex-col gap-3 mt-2">
                <label className="text-sm font-semibold text-on-surface">Perfil de Acesso</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'SOLICITANTE' })}
                    className={cn(
                      "text-left p-3 rounded-xl border-2 transition-all relative group",
                      formData.role === 'SOLICITANTE' 
                        ? "border-primary bg-surface-container-low ring-1 ring-primary/20" 
                        : "border-outline-variant bg-surface hover:bg-surface-container-low"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        formData.role === 'SOLICITANTE' ? "bg-primary text-white" : "bg-primary-container text-on-primary-container"
                      )}>
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface mb-0.5">Solicitante (APS)</h3>
                        <p className="text-xs text-on-surface-variant leading-tight">Médicos da Atenção Primária</p>
                      </div>
                    </div>
                    {formData.role === 'SOLICITANTE' && (
                      <CheckCircle className="absolute top-3 right-3 text-primary w-4.5 h-4.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ESPECIALISTA' })}
                    className={cn(
                      "text-left p-3 rounded-xl border-2 transition-all relative group",
                      formData.role === 'ESPECIALISTA' 
                        ? "border-primary bg-surface-container-low ring-1 ring-primary/20" 
                        : "border-outline-variant bg-surface hover:bg-surface-container-low"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        formData.role === 'ESPECIALISTA' ? "bg-secondary text-white" : "bg-secondary-container text-on-secondary-container"
                      )}>
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface mb-0.5">Especialista</h3>
                        <p className="text-xs text-on-surface-variant leading-tight">Médicos especialistas</p>
                      </div>
                    </div>
                    {formData.role === 'ESPECIALISTA' && (
                      <CheckCircle className="absolute top-3 right-3 text-primary w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {formData.role === 'ESPECIALISTA' && (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-on-surface" htmlFor="specialty">Especialidade Médica</label>
                  <select
                    id="specialty"
                    className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    required
                  >
                    <option value="">Selecione sua especialidade</option>
                    <option value="CARDIOLOGIA">Cardiologia</option>
                    <option value="CIRURGIA_ROBOTICA">Cirurgia Robótica</option>
                    <option value="ODONTOLOGIA">Odontologia</option>
                    <option value="DOENCAS_RARAS">Doenças Raras</option>
                    <option value="OXIGENOTERAPIA">Oxigenoterapia</option>
                  </select>
                </div>
              )}

              <button
                className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Criando Conta...' : 'Criar Conta'}
              </button>

              <div className="mt-2 text-center">
                <p className="text-sm text-on-surface-variant">
                  Já possui conta?{' '}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
