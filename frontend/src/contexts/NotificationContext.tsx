'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Bell, X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'status_update' | 'info';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: 'status_update' | 'info') => void;
  removeNotification: (id: string) => void;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);
  const { user, token } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((message: string, type: 'status_update' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
    setVisibleToasts((prev) => [...prev, id]);

    // Auto-hide toast after 8 seconds
    setTimeout(() => {
      setVisibleToasts((prev) => prev.filter((toastId) => toastId !== id));
    }, 8000);
  }, []);

  const removeNotification = (id: string) => {
    setVisibleToasts((prev) => prev.filter((toastId) => toastId !== id));
  };

  const clearUnread = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      if (!user || !token) return;

      // Build WebSocket URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Extract host from API_URL or fallback to location.hostname
      let host = window.location.hostname + ':8082';
      try {
        const url = new URL(API_URL);
        host = url.host;
      } catch (e) {
        console.warn('[NotificationService] Invalid NEXT_PUBLIC_API_URL, falling back to default host');
      }
      
      // Get the freshest token from localStorage as fallback
      const currentToken = localStorage.getItem('access_token') || token;
      const wsUrl = `${protocol}//${host}/ws/teleconsultations/?token=${currentToken}`;
      
      console.log(`[NotificationService] Connecting (Attempt ${retryCount + 1})...`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[NotificationService] Connected successfully');
        retryCount = 0; // Reset retries on success
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[NotificationService] Message received:', data);
          if (data && data.message) {
            console.log('[NotificationService] Adding notification:', data.message);
            addNotification(data.message, 'status_update');
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('notification-received', { detail: data }));
          } else {
            console.warn('[NotificationService] Received message without content:', data);
          }
        } catch (e) {
          console.error('[NotificationService] Parse error:', e);
        }
      };

      socket.onclose = (e) => {
        console.log('[NotificationService] Disconnected:', e.code, e.reason);
        
        // Don't reconnect if it was a normal closure or if we reached max retries
        if (e.code !== 1000 && retryCount < maxRetries) {
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`[NotificationService] Retrying in ${timeout}ms...`);
          reconnectTimeout = setTimeout(() => {
            retryCount++;
            connect();
          }, timeout);
        }
      };

      socket.onerror = (e) => {
        // WebSocket error objects are often empty in logs for security
        console.error('[NotificationService] WebSocket Error detected');
      };
    };

    connect();

    return () => {
      if (socket) {
        console.log('[NotificationService] Cleaning up connection');
        socket.close(1000); // Normal closure
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user, token, addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, removeNotification, clearUnread }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {notifications.filter(n => visibleToasts.includes(n.id)).map((n) => (
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
