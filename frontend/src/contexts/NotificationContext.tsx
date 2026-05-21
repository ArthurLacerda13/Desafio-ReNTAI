'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (user && token) {
      // Connect to WebSocket
      const wsUrl = `ws://localhost:8081/ws/teleconsultations/?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to notification service');
      };

      ws.onmessage = (event) => {
        const data = jsonParse(event.data);
        if (data && data.message) {
          addNotification(data.message, 'status_update');
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from notification service');
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [user, token]);

  const addNotification = (message: string, type: 'status_update' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const jsonParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

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
