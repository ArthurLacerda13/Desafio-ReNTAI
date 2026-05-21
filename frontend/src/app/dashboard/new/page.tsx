'use client';

import React, { useState } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Stethoscope, 
  FileText, 
  Upload, 
  X, 
  Send, 
  RefreshCcw, 
  File,
  AlertCircle,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NewTeleconsultationPage() {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_birth_date: '',
    specialty: '',
    clinical_history: '',
    diagnostic_hypothesis: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Por favor, anexe pelo menos um documento.');
      return;
    }

    setError(null);
    setLoading(true);
    setAiAnalyzing(true);

    const data = new FormData();
    data.append('patient_name', formData.patient_name);
    data.append('patient_birth_date', formData.patient_birth_date);
    data.append('specialty', formData.specialty);
    data.append('clinical_history', formData.clinical_history);
    data.append('diagnostic_hypothesis', formData.diagnostic_hypothesis);
    
    files.forEach((file) => {
      data.append('attachment_files', file);
    });

    try {
      await api.post('/teleconsultations/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Simulate a bit more AI analysis time for UX
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError('Erro ao enviar solicitação. Verifique os dados e tente novamente.');
      setLoading(false);
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Nova Solicitação</h1>
          <p className="text-base text-on-surface-variant mt-1">Preencha os dados clínicos para solicitar apoio especializado.</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant">
          <AlertCircle className="w-4 h-4" />
          Campos com asterisco (*) são obrigatórios
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Patient & Context) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Patient Data Card */}
          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-on-background">
                <UserIcon className="w-6 h-6 text-primary fill-current" />
                Dados do Paciente
              </h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Conformidade LGPD</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-sm font-bold text-on-surface-variant">Nome ou Iniciais *</label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ex: João da Silva ou J.S."
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-on-surface-variant">Data de Nascimento *</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    type="date"
                    required
                    value={formData.patient_birth_date}
                    onChange={(e) => setFormData({...formData, patient_birth_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Context Card */}
          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary"></div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-on-background mb-6">
              <FileText className="w-6 h-6 text-tertiary fill-current" />
              Contexto Clínico
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-on-surface-variant">História Clínica *</label>
                <textarea
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[150px]"
                  placeholder="Descreva os sintomas, evolução e tratamentos prévios relevantes..."
                  required
                  value={formData.clinical_history}
                  onChange={(e) => setFormData({...formData, clinical_history: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-on-surface-variant">Hipótese Diagnóstica *</label>
                <textarea
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px]"
                  placeholder="Qual a sua principal suspeita ou dúvida para o especialista?"
                  required
                  value={formData.diagnostic_hypothesis}
                  onChange={(e) => setFormData({...formData, diagnostic_hypothesis: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Specialty & Attachments) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Specialty Card */}
          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-on-background mb-6">
              <Stethoscope className="w-6 h-6 text-primary fill-current" />
              Especialidade
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant">Selecione o destino *</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                >
                  <option value="" disabled>Escolha uma opção...</option>
                  <option value="CARDIOLOGIA">Cardiologia</option>
                  <option value="CIRURGIA_ROBOTICA">Cirurgia Robótica</option>
                  <option value="ODONTOLOGIA">Odontologia</option>
                  <option value="DOENCAS_RARAS">Doenças Raras</option>
                  <option value="OXIGENOTERAPIA">Oxigenoterapia</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col gap-4 flex-1">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-on-background">
              <Upload className="w-6 h-6 text-primary" />
              Documentos
            </h2>
            <p className="text-sm text-on-surface-variant">Anexe exames, laudos ou fotos relevantes.</p>
            
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface hover:bg-surface-container transition-colors cursor-pointer min-h-[160px] relative group">
              <Upload className="w-10 h-10 text-primary mb-2 group-hover:-translate-y-1 transition-transform" />
              <p className="text-sm font-bold text-on-surface">Arraste arquivos ou clique</p>
              <p className="text-xs text-on-surface-variant mt-1">PDF, JPG, PNG (Max 10MB)</p>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
              />
            </div>

            {aiAnalyzing && (
              <div className="bg-surface-container-low border border-primary/20 rounded-lg p-3 flex flex-col gap-2 mt-2 animate-pulse">
                <div className="flex items-start gap-3">
                  <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-primary">Analisando documentos via IA...</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Extraindo dados clínicos e validando anexos.</p>
                  </div>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full w-[65%] transition-all duration-500"></div>
                </div>
              </div>
            )}

            {files.length > 0 && !aiAnalyzing && (
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-outline-variant rounded-lg bg-surface">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <File className="w-5 h-5 text-secondary" />
                      <span className="text-xs font-medium text-on-surface truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="text-error hover:bg-error-container rounded-full p-1 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-16rem)] bg-surface-container-lowest border-t border-outline-variant p-4 z-10 flex items-center justify-end gap-4 shadow-lg">
        {error && <p className="text-sm text-error font-medium mr-auto ml-4">{error}</p>}
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors"
          type="button"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:bg-opacity-90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          type="button"
          disabled={loading}
        >
          <Send className="w-4 h-4" />
          {loading ? 'Enviando...' : 'Solicitar Teleconsultoria'}
        </button>
      </div>
    </div>
  );
}
