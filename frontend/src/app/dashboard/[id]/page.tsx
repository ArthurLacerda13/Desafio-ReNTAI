'use client';

import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  User as UserIcon, 
  FileText, 
  Paperclip, 
  Clock, 
  Send, 
  CheckCircle, 
  ShieldAlert,
  Edit3,
  Brain,
  MessageSquare,
  Download
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Teleconsultation {
  id: string;
  patient_name: string;
  patient_birth_date: string;
  specialty: string;
  clinical_history: string;
  diagnostic_hypothesis: string;
  status: string;
  created_at: string;
  solicitante_name: string;
  especialista_name: string | null;
  attachment: {
    file: string;
    ai_score: number;
    ai_provider: string;
    ai_threshold: number;
    ai_timestamp: string;
  } | null;
  feedback: {
    content: string;
    created_at: string;
    specialist_name: string;
  } | null;
}

export default function TeleconsultationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Teleconsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await api.get(`/teleconsultations/${id}/`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch details', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/teleconsultations/${id}/feedback/`, { content: feedback });
      addNotification('Parecer registrado com sucesso! O caso foi encerrado.', 'status_update');
      fetchData();
    } catch (error) {
      console.error('Failed to submit feedback', error);
      addNotification('Falha ao registrar parecer. Tente novamente.', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const response = await api.get(`/teleconsultations/${id}/pdf/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `parecer_${id.toString().slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const isSpecialist = user?.role === 'ESPECIALISTA';
  const isConcluida = data.status === 'CONCLUIDA';

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-primary hover:underline text-sm font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-on-background">Avaliação: {data.specialty}</h1>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              Paciente: {data.patient_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              Risco IA: 
              <span className={cn(
                "font-bold ml-1",
                data.attachment?.ai_score && data.attachment.ai_score < 0.7 ? "text-error" : "text-primary"
              )}>
                {data.attachment?.ai_score ? `${(data.attachment.ai_score * 100).toFixed(0)}%` : 'N/A'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border",
            data.status === 'CONCLUIDA' ? "bg-secondary-fixed text-on-secondary-fixed border-secondary" : "bg-primary-fixed text-on-primary-fixed border-primary"
          )}>
            <div className={cn("w-2 h-2 rounded-full", data.status === 'CONCLUIDA' ? "bg-secondary" : "bg-primary")}></div>
            {data.status === 'CONCLUIDA' ? 'Concluída' : 'Em Análise'}
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient & Clinical Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2 mb-6 border-b border-outline-variant pb-2">
              <FileText className="w-6 h-6 text-primary fill-current" />
              História Clínica e Hipótese
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Relato do Solicitante ({data.solicitante_name})</h3>
                <p className="text-base text-on-surface bg-surface-container-low p-4 rounded-lg border border-outline-variant leading-relaxed">
                  {data.clinical_history}
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4 py-1">
                <h3 className="text-sm font-bold text-on-surface mb-1">Hipótese Diagnóstica</h3>
                <p className="text-base text-on-surface">{data.diagnostic_hypothesis}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2 mb-6 border-b border-outline-variant pb-2">
              <Paperclip className="w-6 h-6 text-primary" />
              Documentos e Validação IA
            </h2>
            {data.attachment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group relative rounded-xl border border-outline-variant overflow-hidden bg-surface-container-low aspect-video flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-primary/40" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-white">
                    <p className="text-sm font-bold truncate">Anexo de Exame</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs opacity-90">Qualidade Validada (IA)</span>
                    </div>
                  </div>
                  <a 
                    href={`http://localhost:8081${data.attachment.file}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold shadow-lg">Visualizar Arquivo</span>
                  </a>
                </div>
                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="w-5 h-5" />
                    <span className="text-sm font-bold">Relatório de Triagem IA</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-on-surface-variant font-medium">Confiança da Extração</p>
                    <div className="w-full bg-outline-variant rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${(data.attachment.ai_score * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                    <span>Motor: {data.attachment.ai_provider}</span>
                    <span>Score: {(data.attachment.ai_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic">Nenhum anexo encontrado.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Feedback */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Linha do Tempo
            </h2>
            <div className="relative pl-4 space-y-6 border-l-2 border-outline-variant ml-2">
              <div className="relative">
                <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"></div>
                <p className="text-[10px] font-bold text-on-surface-variant">{(new Date(data.created_at)).toLocaleString()}</p>
                <p className="text-sm font-bold text-on-surface">Solicitação Aberta</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"></div>
                <p className="text-[10px] font-bold text-on-surface-variant">{new Date(new Date(data.created_at).getTime() + 60000).toLocaleString()}</p>
                <p className="text-sm font-bold text-on-surface">Triagem Automática Concluída</p>
              </div>
              {isConcluida && (
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-white"></div>
                  <p className="text-[10px] font-bold text-on-surface-variant">{new Date(data.feedback?.created_at || '').toLocaleString()}</p>
                  <p className="text-sm font-bold text-on-surface">Parecer Emitido</p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Form / Display */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2 mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
              Parecer Especializado
            </h2>

            {isConcluida ? (
              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-base text-on-surface leading-relaxed italic">
                    &quot;{data.feedback?.content}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {data.feedback?.specialist_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-on-surface">{data.feedback?.specialist_name}</p>
                    <p className="text-on-surface-variant">Médico Especialista</p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="w-full mt-4 bg-surface-container-high text-primary border border-primary/20 font-bold py-3 rounded-lg hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  {downloading ? 'Gerando PDF...' : 'Baixar Parecer em PDF'}
                </button>
              </div>
            ) : isSpecialist ? (
              <div className="flex flex-col gap-4">
                <textarea
                  className="w-full min-h-[200px] p-4 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Insira sua avaliação técnica e conduta recomendada..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant border-dashed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    Ao registrar, o caso será encerrado e o solicitante será notificado.
                  </p>
                </div>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={submitting || !feedback.trim()}
                  className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Registrando...' : 'Registrar e Encerrar Caso'}
                </button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
                <p className="text-sm font-medium text-on-surface-variant">Aguardando análise do especialista...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
