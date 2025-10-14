import { useState, useCallback } from 'react';

export type ToastMessage = {
  id?: number;
  title: string;
  status: 'success' | 'error' | 'info' | 'warning';
  description?: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: ToastMessage) => {
    const toastWithId = { ...message, id: Date.now() + Math.random() };
    setToasts(prev => [...prev, toastWithId]);
    
    // Auto remove after duration based on status
    const duration = message.status === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastWithId.id));
    }, duration);
  }, []);

  const removeToast = useCallback((index: number) => {
    setToasts(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Helper functions for common toast types
  const success = useCallback((title: string, description?: string) => {
    toast({ title, status: 'success', description });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast({ title, status: 'error', description });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    toast({ title, status: 'warning', description });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    toast({ title, status: 'info', description });
  }, [toast]);

  return { toast, toasts, removeToast, success, error, warning, info };
}
