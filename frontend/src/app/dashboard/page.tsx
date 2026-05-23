'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Teleconsultation {
  id: string;
  patient_name: string;
  specialty: string;
  created_at: string;
  status: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('7');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, token } = useAuth();
  
  const isInitialMount = useRef(true);

  // Handle automatic updates with debounce for search but immediate for others
  useEffect(() => {
    // We declare fetchTeleconsultations INSIDE the effect so it has access to fresh state
    // without needing useCallback.
    const fetchTeleconsultations = async () => {
      if (!token) return;
      
      setLoading(true);
      console.log('[Dashboard] Fetching data...', { statusFilter, periodFilter, searchQuery });

      try {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        
        if (searchQuery) {
          if (/^[0-9a-fA-F-]+$/.test(searchQuery) && searchQuery.length >= 4) {
            params.id = searchQuery;
          } else {
            params.patient_name = searchQuery;
          }
        }
        
        if (periodFilter !== 'all') {
          const now = new Date();
          let startDate = new Date();
          if (periodFilter === '7') startDate.setDate(now.getDate() - 7);
          else if (periodFilter === '30') startDate.setDate(now.getDate() - 30);
          else if (periodFilter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          params.start_date = startDate.toISOString().split('T')[0];
        }

        const response = await api.get('/teleconsultations/', { params });
        setData(response.data);
        console.log('[Dashboard] Success:', response.data.length, 'items');
      } catch (error) {
        console.error('[Dashboard] API Error:', error);
      } finally {
        setLoading(false);
      }
    };

    // 0ms delay for dropdowns (status/period/refreshTrigger change)
    // 400ms delay if it's a search query change
    // Using a ref to prevent delay on first mount
    const delay = isInitialMount.current ? 0 : (searchQuery ? 400 : 0);
    
    const timer = setTimeout(() => {
      fetchTeleconsultations();
      isInitialMount.current = false;
    }, delay);

    return () => clearTimeout(timer);
  }, [statusFilter, periodFilter, searchQuery, token, refreshTrigger]);

  // Listen for WebSocket notifications

  useEffect(() => {
    const handleNotification = () => {
      console.log('[Dashboard] Notification received, refreshing list...');
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('notification-received', handleNotification);
    return () => window.removeEventListener('notification-received', handleNotification);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      'PENDENTE': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Pendente</span>,
      'EM_ANDAMENTO': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">Em análise</span>,
      'CONCLUIDA': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">Concluída</span>,
      'CANCELADA': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">Cancelada</span>,
    };
    return badges[status] || <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant">{status}</span>;
  };

  // Explicit handlers for debugging
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('[Dashboard] Status changing to:', e.target.value);
    setStatusFilter(e.target.value);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('[Dashboard] Period changing to:', e.target.value);
    setPeriodFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Visão Geral</h1>
          <p className="text-base text-on-surface-variant">Acompanhe suas solicitações de teleconsultoria.</p>
        </div>
        {user?.role === 'SOLICITANTE' && (
          <Link href="/dashboard/new" className="bg-primary text-white hover:bg-opacity-90 transition-all rounded-lg px-6 py-2.5 font-semibold text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 duration-150">
            <Plus className="w-5 h-5" /> Nova Teleconsultoria
          </Link>
        )}
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Filters Area */}
        <div className="p-6 border-b border-outline-variant flex flex-col gap-4 bg-surface-container-lowest">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-on-surface">Teleconsultorias Recentes</h2>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Filter className="w-5 h-5" /> Filtros
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Período</label>
              <select 
                value={periodFilter} 
                onChange={handlePeriodChange} 
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="month">Este mês</option>
                <option value="all">Todo o histórico</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Status</label>
              <select 
                value={statusFilter} 
                onChange={handleStatusChange} 
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ANDAMENTO">Em análise</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Buscar Paciente ou ID</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Digite o nome ou ID..." 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto relative flex-1">
          {loading && (
            <div className="absolute inset-0 bg-surface/60 z-20 flex items-center justify-center backdrop-blur-[2px] transition-all">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-primary">Sincronizando...</span>
              </div>
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest">
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Especialidade</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="text-lg font-medium">Nenhum registro encontrado</p>
                      <p className="text-sm opacity-70">Tente ajustar os filtros ou criar uma nova teleconsultoria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{item.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                          {item.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-on-surface">{item.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{item.specialty}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/${item.id}`} className="inline-flex items-center justify-center w-9 h-9 text-primary hover:bg-primary/10 rounded-full transition-all">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Total: {data.length} registros</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded disabled:opacity-30" disabled><ChevronLeft className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded bg-primary text-white text-sm font-bold flex items-center justify-center">1</div>
            <button className="p-1 rounded disabled:opacity-30" disabled><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
