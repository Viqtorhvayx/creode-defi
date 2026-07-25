"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ExternalLink, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  txHash?: string;
}

interface ToastOptions {
  type?: ToastType;
  txHash?: string;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const STYLES: Record<ToastType, { iconBg: string; iconColor: string; Icon: typeof CheckCircle2 }> = {
  success: { iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-500', Icon: CheckCircle2 },
  error: { iconBg: 'bg-[#EF4444]/20', iconColor: 'text-[#EF4444]', Icon: XCircle },
  warning: { iconBg: 'bg-amber-500/20', iconColor: 'text-amber-500', Icon: AlertTriangle },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const type = options?.type ?? 'success';
    setToasts((prev) => [...prev, { id, message, type, txHash: options?.txHash }]);

    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {toasts.map((toast) => {
          const { iconBg, iconColor, Icon } = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className="glass-panel !p-4 flex items-start gap-4 animate-in slide-in-from-right-10 fade-in duration-500 shadow-2xl min-w-[320px] max-w-[380px]"
            >
              <div className={`${iconBg} p-2 rounded-full shrink-0`}>
                <Icon className={iconColor} size={20} />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-bold text-white leading-snug">{toast.message}</p>
                {toast.txHash && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${toast.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#00A8E8] hover:underline flex items-center gap-1 mt-1 uppercase tracking-widest"
                  >
                    View Transaction <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-white/30 hover:text-white/70 transition-colors shrink-0 -mt-0.5 -mr-0.5"
                aria-label="Dismiss"
              >
                <XCircle size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
