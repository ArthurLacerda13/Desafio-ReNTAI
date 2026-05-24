'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  ShieldAlert, 
  Timer, 
  Users, 
  Save, 
  Brain, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings2
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Stats {
  kpis: {
    ai_rejection_rate: number;
    avg_sla_hours: number;
    pending_cases: number;
    critical_cases: number;
    active_specialists: number;
  };
  specialty_distribution: Array<{ specialty: string; count: number }>;
  ai_logs: Array<{
    id: string;
    ai_score: number;
    ai_threshold: number;
    ai_provider: string;
    ai_timestamp: string;
    teleconsultation__patient_name: string;
  }>;
}

interface AIConfig {
  ai_threshold: number;
  ai_provider: string;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<AIConfig>({ ai_threshold: 0.6, ai_provider: 'REAL' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_staff)) {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, configRes] = await Promise.all([
          api.get('/teleconsultations/stats/'),
          api.get('/teleconsultations/config/')
        ]);
        setStats(statsRes.data);
        setConfig(configRes.data);
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.is_staff) fetchData();
  }, [user, authLoading, router]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/teleconsultations/config/1/', config);
      // Refresh stats to see new thresholds applied in calculations if any
      const statsRes = await api.get('/teleconsultations/stats/');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to save config', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Dashboard de Auditoria</h1>
          <p className="text-on-surface-variant">Monitoramento de IA, SLAs e Governança Clínica</p>
        </div>
        <div className="text-right text-sm text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant">
          Status do Sistema: <span className="text-primary font-bold">Operacional</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-error font-bold flex items-center gap-1 text-xs px-2 py-1 bg-error-container/20 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 2.1%
            </span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Taxa de Rejeição IA</p>
          <h2 className="text-4xl font-black text-on-surface mt-1">{stats.kpis.ai_rejection_rate}%</h2>
          <div className="mt-4 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-error rounded-full" style={{ width: `${stats.kpis.ai_rejection_rate}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <Timer className="w-6 h-6" />
            </div>
            <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 rounded-full">
              <ArrowDownRight className="w-3 h-3" /> -12m
            </span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Média Resposta (SLA)</p>
          <h2 className="text-4xl font-black text-on-surface mt-1">{stats.kpis.avg_sla_hours}h</h2>
          <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Meta: Menos de 6h</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container text-white flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Alertas Críticos</p>
          <h2 className="text-4xl font-black text-on-surface mt-1">{stats.kpis.critical_cases}</h2>
          <p className="text-[10px] text-error mt-2 font-bold animate-pulse">Pendentes &gt; 24h</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Especialistas</p>
          <h2 className="text-4xl font-black text-on-surface mt-1">{stats.kpis.active_specialists}</h2>
          <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Ativos no ecossistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specialty Distribution */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-on-surface">Demanda por Especialidade</h3>
            <BarChart3 className="text-on-surface-variant w-6 h-6" />
          </div>
          <div className="space-y-6">
            {stats.specialty_distribution.map((item, idx) => {
              const maxCount = Math.max(...stats.specialty_distribution.map(d => d.count), 1);
              const percentage = (item.count / maxCount) * 100;
              return (
                <div key={item.specialty} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-on-surface">{item.specialty}</span>
                    <span className="font-black text-primary">{item.count} chamados</span>
                  </div>
                  <div className="h-10 w-full bg-surface-container rounded-xl overflow-hidden flex items-center px-1">
                    <div 
                      className="h-8 bg-primary rounded-lg transition-all duration-1000 ease-out" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Configuration Panel */}
        <div className="bg-primary text-on-primary p-8 rounded-3xl shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <Settings2 className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Governança de IA</h3>
          </div>

          <div className="space-y-8 flex-grow relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold opacity-90">Threshold de Confiança</label>
                <span className="text-3xl font-black">{(config.ai_threshold * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                max="100" 
                min="0" 
                value={config.ai_threshold * 100}
                onChange={(e) => setConfig({ ...config, ai_threshold: parseInt(e.target.value) / 100 })}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <p className="text-xs opacity-70 leading-relaxed italic">
                Documentos com score abaixo deste valor serão automaticamente rejeitados ou enviados para auditoria manual.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold opacity-90">Provedor Inteligente</label>
              <select 
                value={config.ai_provider}
                onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl text-white py-4 px-4 font-bold focus:ring-2 focus:ring-white outline-none appearance-none cursor-pointer"
              >
                <option value="REAL" className="text-on-surface">Local NLP (PyMuPDF)</option>
                <option value="OPENAI" className="text-on-surface">OpenAI GPT-4o</option>
                <option value="MOCK" className="text-on-surface">V4H Mock Engine</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleSaveConfig}
            disabled={saving}
            className="mt-8 w-full bg-white text-primary font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50 relative z-10"
          >
            <Save className="w-6 h-6" />
            {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÃO'}
          </button>
        </div>
      </div>

      {/* AI Logs Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <Brain className="text-primary w-6 h-6" />
            <h3 className="text-xl font-bold text-on-surface">Rastreabilidade de Triagem (Logs de IA)</h3>
          </div>
          <div className="text-xs font-bold text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            AO VIVO
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest">Paciente</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-center">Score Obtido</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest">Provedor</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest">Decisão</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {stats.ai_logs.map((log) => {
                const isApproved = log.ai_score >= log.ai_threshold;
                return (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors">{log.teleconsultation__patient_name}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">ID: {log.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-lg font-black ${isApproved ? 'text-emerald-600' : 'text-error'}`}>
                        {(log.ai_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold bg-surface-container-high px-3 py-1 rounded-full text-on-surface-variant">
                        {log.ai_provider}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {isApproved ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                          <CheckCircle2 className="w-4 h-4" /> APROVADO
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-error font-black text-xs">
                          <XCircle className="w-4 h-4" /> REJEITADO
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right text-xs font-medium text-on-surface-variant">
                      {new Date(log.ai_timestamp).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
