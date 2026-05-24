'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { Plus, Search, Eye, ChevronLeft, ChevronRight, Filter, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';

interface Teleconsultation {
  id: string;
  patient_name: string;
  specialty: string;
  created_at: string;
  status: string;
}

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-16"></div></td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high"></div>
            <div className="h-4 bg-surface-container-high rounded w-32"></div>
          </div>
        </td>
        <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-surface-container-high rounded-full w-20"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-surface-container-high rounded-full ml-auto"></div></td>
      </tr>
    ))}
  </>
);

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [data, setData] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize state from URL params or defaults
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [periodFilter, setPeriodFilter] = useState(searchParams.get('period') || '7');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, token } = useAuth();
  const isInitialMount = useRef(true);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (periodFilter !== '7') params.set('period', periodFilter);
    if (searchQuery) params.set('q', searchQuery);
    
    const query = params.toString();
    const newUrl = query ? `/dashboard?${query}` : '/dashboard';
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  }, [statusFilter, periodFilter, searchQuery]);

  useEffect(() => {
    const fetchTeleconsultations = async () => {
      if (!token) return;
      
      setLoading(true);
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
      } catch (error) {
        console.error('[Dashboard] API Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const delay = isInitialMount.current ? 0 : (searchQuery ? 400 : 0);
    const timer = setTimeout(() => {
      fetchTeleconsultations();
      isInitialMount.current = false;
    }, delay);

    return () => clearTimeout(timer);
  }, [statusFilter, periodFilter, searchQuery, token, refreshTrigger]);

  useEffect(() => {
    const handleNotification = () => setRefreshTrigger(prev => prev + 1);
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

  const clearFilters = () => {
    setStatusFilter('');
    setPeriodFilter('7');
    setSearchQuery('');
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
            {(statusFilter || searchQuery || periodFilter !== '7') && (
              <button 
                onClick={clearFilters}
                className="text-error font-bold text-xs flex items-center gap-1 hover:underline"
              >
                <XCircle className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Período</label>
              <select 
                value={periodFilter} 
                onChange={(e) => setPeriodFilter(e.target.value)} 
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
                onChange={(e) => setStatusFilter(e.target.value)} 
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
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto relative flex-1">
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
              {loading ? (
                <TableSkeleton />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="text-lg font-medium">Nenhum registro encontrado</p>
                      <p className="text-sm opacity-70">Tente ajustar os filtros ou criar uma nova teleconsultoria.</p>
                      <button 
                        onClick={clearFilters}
                        className="mt-4 text-primary font-bold text-sm hover:underline"
                      >
                        Limpar todos os filtros
                      </button>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
