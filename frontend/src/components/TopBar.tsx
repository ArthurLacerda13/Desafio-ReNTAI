'use client';

import React from 'react';
import { Search, Bell, HelpCircle, Settings, Heart, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface dark:bg-background fixed top-0 right-0 w-[calc(100%-16rem)] h-16 border-b border-outline-variant dark:border-outline flex justify-between items-center px-6 z-30 transition-all duration-150">
      {/* Search Bar */}
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="Buscar pacientes, IDs..."
            type="text"
          />
        </div>
      </div>

      {/* Product Name */}
      <div className="absolute left-1/2 -translate-x-1/2 font-black text-primary flex items-center gap-2">
        <Heart className="w-6 h-6 fill-current" />
        V4H - ReNTAI
      </div>

      {/* Trailing Icon Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-full transition-all"
          title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-full transition-all">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-full transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-full transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
