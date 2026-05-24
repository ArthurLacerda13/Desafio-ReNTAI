'use client';

import React from 'react';
import { Search, Bell, HelpCircle, Settings, Heart, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';

export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, clearUnread } = useNotifications();

  return (
    <header className="bg-surface dark:bg-background fixed top-0 right-0 w-[calc(100%-16rem)] h-16 border-b border-outline-variant dark:border-outline flex justify-between items-center px-6 z-30 transition-all duration-150">
      {/* Search Bar removed to avoid duplication with dashboard filters */}
      <div className="flex-1 flex items-center max-w-md"></div>

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
        <button 
          onClick={clearUnread}
          className="w-10 h-10 relative flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-full transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
