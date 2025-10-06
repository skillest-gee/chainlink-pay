import { useState, useCallback } from 'react';

export type ToastMessage = {
  title: string;
  status: 'success' | 'error' | 'info' | 'warning';
  description?: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: ToastMessage) => {
    setToasts(prev => [...prev, message]);
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  }, []);

  const removeToast = useCallback((index: number) => {
    setToasts(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { toast, toasts, removeToast };
}
