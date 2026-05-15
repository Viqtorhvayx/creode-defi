"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  txHash?: string;
}

interface ToastContextType {
  showToast: (message: string, txHash?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, txHash?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, txHash }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className="glass-panel !p-4 flex items-center gap-4 animate-in slide-in-from-right-10 fade-in duration-500 shadow-2xl min-w-[320px]"
          >
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <CheckCircle2 className="text-emerald-500" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-white">{toast.message}</p>
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
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
