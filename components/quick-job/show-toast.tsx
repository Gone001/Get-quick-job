'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useShowToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useShowToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-neon-green text-background' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-neon-blue text-background'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-70">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {children}
    </ToastContext.Provider>
  );
}