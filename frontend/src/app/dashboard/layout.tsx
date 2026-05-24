'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we are SURE loading is finished and there is no user
    if (!loading && !user) {
      console.log('[DashboardLayout] No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [user, loading, router]);

  // While loading or if no user yet, show loader
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm font-medium text-on-surface-variant">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Once user is confirmed, render the dashboard
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-64 mt-16 p-10 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
