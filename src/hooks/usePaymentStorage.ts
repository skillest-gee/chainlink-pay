import { useState, useEffect, useCallback } from 'react';
import { PaymentLink } from '../services/paymentStorage';

export interface PaymentRecord {
  id: string;
  txId: string;
  amount: string;
  recipient: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  paymentType: 'STX' | 'BTC';
  description?: string;
  merchantAddress: string;
  payerAddress?: string;
  paidAt?: number;
}

interface PaymentStorageHook {
  payments: PaymentRecord[];
  savePayment: (payment: PaymentRecord) => void;
  updatePaymentStatus: (txId: string, status: PaymentRecord['status']) => void;
  getPaymentByTxId: (txId: string) => PaymentRecord | null;
  isDuplicatePayment: (recipient: string, amount: string) => boolean;
  clearPayments: () => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'stx_payment_records';

export const usePaymentStorage = (): PaymentStorageHook => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load payments from localStorage on mount
  useEffect(() => {
    const loadPayments = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedPayments = JSON.parse(stored);
          setPayments(parsedPayments);
          console.log('Loaded payments from storage:', parsedPayments.length);
        }
      } catch (error) {
        console.error('Error loading payments from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  const savePayment = useCallback((payment: PaymentRecord) => {
    try {
      setPayments(prev => {
        const existingIndex = prev.findIndex(p => p.txId === payment.txId);
        let updated;
        
        if (existingIndex >= 0) {
          // Update existing payment
          updated = [...prev];
          updated[existingIndex] = payment;
        } else {
          // Add new payment
          updated = [...prev, payment];
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log('Payment saved to storage:', payment);
        return updated;
      });
    } catch (error) {
      console.error('Error saving payment to storage:', error);
    }
  }, []);

  const updatePaymentStatus = useCallback((txId: string, status: PaymentRecord['status']) => {
    try {
      setPayments(prev => {
        const updated = prev.map(payment => 
          payment.txId === txId 
            ? { 
                ...payment, 
                status,
                paidAt: status === 'confirmed' ? Date.now() : payment.paidAt
              }
            : payment
        );
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log('Payment status updated:', { txId, status });
        return updated;
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }, []);

  const getPaymentByTxId = useCallback((txId: string): PaymentRecord | null => {
    return payments.find(p => p.txId === txId) || null;
  }, [payments]);

  const isDuplicatePayment = useCallback((recipient: string, amount: string): boolean => {
    return payments.some(p => 
      p.recipient === recipient && 
      p.amount === amount && 
      p.status === 'pending'
    );
  }, [payments]);

  const clearPayments = useCallback(() => {
    try {
      setPayments([]);
      localStorage.removeItem(STORAGE_KEY);
      console.log('All payments cleared from storage');
    } catch (error) {
      console.error('Error clearing payments:', error);
    }
  }, []);

  return {
    payments,
    savePayment,
    updatePaymentStatus,
    getPaymentByTxId,
    isDuplicatePayment,
    clearPayments,
    isLoading
  };
};
