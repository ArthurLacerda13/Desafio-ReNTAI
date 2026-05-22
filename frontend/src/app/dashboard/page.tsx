'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Tune, Search, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
  const { user } = useAuth();

  const fetchTeleconsultations = React.useCallback(async () => {
    try {
      const response = await api.get('/teleconsultations/');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch teleconsultations', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeleconsultations();

    // Refresh when a notification is received
    const handleNotification = () => {
      console.log('Notification received, refreshing data...');
      fetchTeleconsultations();
    };

    window.addEventListener('notification-received', handleNotification);
    return () => window.removeEventListener('notification-received', handleNotification);
  }, [fetchTeleconsultations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">Pendente</span>;
      case 'EM_ANDAMENTO':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">Em análise</span>;
      case 'CONCLUIDA':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">Concluída</span>;
      case 'CANCELADA':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">Cancelada</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant">{status}</span>;
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Visão Geral</h1>
          <p className="text-base text-on-surface-variant">Acompanhe suas solicitações de teleconsultoria.</p>
        </div>
        {user?.role === 'SOLICITANTE' && (
          <Link
            href="/dashboard/new"
            className="bg-primary text-white hover:bg-opacity-90 transition-all rounded-lg px-6 py-2.5 font-semibold text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 duration-150"
          >
            <Plus className="w-5 h-5" />
            Nova Teleconsultoria
          </Link>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header / Filters */}
        <div className="p-6 border-b border-outline-variant flex flex-col gap-4 bg-surface-container-lowest">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-on-surface">Teleconsultorias Recentes</h2>
            <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:bg-primary-container/10 px-3 py-1.5 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
              Filtros Avançados
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Período</label>
              <select className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Este mês</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">Status</label>
              <select className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                <option>Todos os Status</option>
                <option>Pendente</option>
                <option>Em análise</option>
                <option>Concluída</option>
                <option>Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest">
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ID Solicitação</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Especialidade</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Data Criação</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                    Carregando dados...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{item.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold">
                          {item.patient_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-on-surface">{item.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{item.specialty}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/${item.id}`} className="text-primary hover:bg-surface-container p-2 rounded-full transition-all inline-block">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Mostrando {data.length} de {data.length} registros</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded bg-primary-container text-white text-sm font-bold flex items-center justify-center">1</button>
            <button className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
