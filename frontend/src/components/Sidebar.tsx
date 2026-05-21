'use client';

import React from 'react';
import { LayoutDashboard, PlusCircle, Heart, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'SOLICITANTE' ? [{ name: 'Nova Teleconsultoria', href: '/dashboard/new', icon: PlusCircle }] : []),
  ];

  return (
    <nav className="bg-surface-container-lowest h-full w-64 fixed left-0 top-0 border-r border-outline-variant shadow-sm flex flex-col py-6 px-4 gap-4 z-40">
      {/* Profile Header */}
      <div className="flex items-center gap-4 px-4 pb-6 border-b border-outline-variant">
        <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-primary fill-current" />
        </div>
        <div className="overflow-hidden">
          <div className="text-lg font-bold text-primary truncate">
            {user?.first_name || 'Usuário'}
          </div>
          <div className="text-xs font-medium text-secondary">
            {user?.role === 'SOLICITANTE' ? 'Solicitante (APS)' : 'Especialista'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1 mt-4 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm",
                  isActive 
                    ? "text-primary bg-primary-container/10 border-l-4 border-primary" 
                    : "text-secondary hover:text-primary hover:bg-surface-container-low"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error-container/20 transition-all font-semibold text-sm mt-auto"
      >
        <LogOut className="w-5 h-5" />
        Sair do Sistema
      </button>
    </nav>
  );
};
