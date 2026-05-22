'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Bell, X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'status_update' | 'info';
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: 'status_update' | 'info') => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, token } = useAuth();

  const addNotification = useCallback((message: string, type: 'status_update' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove after 8 seconds for better visibility
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (user && token) {
      // Build WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use the current hostname but port 8082 for the backend
      const host = window.location.hostname + ':8082';
      const wsUrl = `${protocol}//${host}/ws/teleconsultations/?token=${token}`;
      
      console.log('[NotificationService] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[NotificationService] Connected successfully');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[NotificationService] Message received:', data);
          if (data && data.message) {
            addNotification(data.message, 'status_update');
            
            // Dispatch event to allow components to refresh data
            console.log('[NotificationService] Dispatching refresh event');
            window.dispatchEvent(new CustomEvent('notification-received', { detail: data }));
          }
        } catch (e) {
          console.error('[NotificationService] Parse error:', e);
        }
      };

      ws.onclose = (e) => {
        console.log('[NotificationService] Disconnected:', e.code, e.reason);
      };

      ws.onerror = (e) => {
        console.error('[NotificationService] Connection error:', e);
      };

      return () => {
        console.log('[NotificationService] Cleaning up connection');
        ws.close();
      };
    }
  }, [user, token, addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className="pointer-events-auto bg-surface-container-highest border border-outline-variant shadow-xl rounded-xl p-4 flex gap-3 animate-in slide-in-from-right-full duration-300"
          >
            <div className="text-primary mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-on-surface font-medium leading-tight">{n.message}</p>
              <p className="text-[10px] text-on-surface-variant mt-1 opacity-70">
                {n.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button 
              onClick={() => removeNotification(n.id)}
              className="text-on-surface-variant hover:text-on-surface transition-colors self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
