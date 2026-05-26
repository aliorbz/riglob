'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // If it's a loading toast, remove any existing loading toasts to avoid duplicates
      const filtered = type === 'loading' ? prev.filter((t) => t.type !== 'loading') : prev;
      return [...filtered, { id, type, message, duration }];
    });

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, [dismiss]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, clear }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const { type, message } = toast;

  const typeConfig = {
    success: {
      bg: 'rgba(5, 20, 10, 0.85)',
      border: 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'rgba(25, 5, 5, 0.85)',
      border: 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
      icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
    },
    info: {
      bg: 'rgba(5, 15, 25, 0.85)',
      border: 'border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    },
    loading: {
      bg: 'rgba(5, 10, 5, 0.85)',
      border: 'border-[#00ff66]/45 shadow-[0_0_15px_rgba(0,255,102,0.15)]',
      icon: <Loader2 className="w-5 h-5 text-[#00ff66] animate-spin shrink-0" />,
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md pointer-events-auto transition-all duration-300 transform translate-y-0 animate-[slideIn_0.2s_ease-out] ${config.border}`}
      style={{
        backgroundColor: config.bg,
      }}
    >
      <div className={`p-1 rounded-lg ${config.border} border bg-black/40`}>
        {config.icon}
      </div>
      <div className="flex-1 text-sm font-medium text-gray-200 mt-1 select-none">
        {message}
      </div>
      {type !== 'loading' && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5 mt-0.5 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
