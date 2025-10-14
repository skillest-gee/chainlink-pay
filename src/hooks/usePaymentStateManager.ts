import { useState, useEffect, useCallback } from 'react';
import { useTransactionStatus } from './useTransactionStatus';
import { usePaymentStorage, PaymentRecord } from './usePaymentStorage';
import { useMerchantNotifications } from './useMerchantNotifications';
import { PaymentLink, paymentStorage } from '../services/paymentStorage';

export interface PaymentState {
  id: string;
  txId?: string;
  amount: string;
  recipient: string;
  status: 'initial' | 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  paymentType: 'STX' | 'BTC';
  description?: string;
  merchantAddress: string;
  payerAddress?: string;
  paidAt?: number;
  error?: string;
}

interface PaymentStateManagerHook {
  paymentState: PaymentState | null;
  isLoading: boolean;
  error: string | null;
  initiatePayment: (paymentLink: PaymentLink, txId: string) => void;
  checkPaymentStatus: (txId: string) => void;
  clearPaymentState: () => void;
  isDuplicatePayment: (recipient: string, amount: string) => boolean;
}

export const usePaymentStateManager = (): PaymentStateManagerHook => {
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status: txStatus, isLoading: txLoading, error: txError, pollTransaction, stopPolling } = useTransactionStatus();
  const { savePayment, updatePaymentStatus, isDuplicatePayment: checkDuplicate } = usePaymentStorage();
  const { notifyPaymentUpdate } = useMerchantNotifications();

  // Update payment state when transaction status changes
  useEffect(() => {
    if (paymentState && paymentState.txId) {
      console.log('Transaction status changed:', { txStatus, paymentId: paymentState.id });
      
      if (txStatus === 'confirmed') {
        setPaymentState(prev => prev ? { ...prev, status: 'confirmed', paidAt: Date.now() } : null);
        
        // Save confirmed payment
        if (paymentState.txId) {
          const paymentRecord: PaymentRecord = {
            id: paymentState.id,
            txId: paymentState.txId,
            amount: paymentState.amount,
            recipient: paymentState.recipient,
            status: 'confirmed',
            timestamp: paymentState.timestamp,
            paymentType: paymentState.paymentType,
            description: paymentState.description,
            merchantAddress: paymentState.merchantAddress,
            payerAddress: paymentState.payerAddress,
            paidAt: Date.now()
          };
          
          savePayment(paymentRecord);
          notifyPaymentUpdate(paymentRecord);
          
          // Also update the PaymentLink storage for merchant dashboard
          const allPayments = paymentStorage.getAllPaymentLinks();
          const updatedPayments = allPayments.map(p => 
            p.id === paymentState.id ? { 
              ...p, 
              status: 'paid' as const,
              txHash: paymentState.txId,
              payerAddress: paymentState.payerAddress,
              paidAt: Date.now()
            } : p
          );
          paymentStorage.saveAllPaymentLinks(updatedPayments);
          
          // Dispatch the original payment events for merchant dashboard
          const paymentCompletedEvent = new CustomEvent('paymentCompleted', {
            detail: {
              paymentId: paymentState.id,
              status: 'paid',
              txId: paymentState.txId,
              merchantAddress: paymentState.merchantAddress
            }
          });
          window.dispatchEvent(paymentCompletedEvent);
          
          const paymentUpdatedEvent = new CustomEvent('paymentUpdated', {
            detail: {
              paymentId: paymentState.id,
              status: 'paid',
              txId: paymentState.txId
            }
          });
          window.dispatchEvent(paymentUpdatedEvent);
          
          console.log('Payment confirmed and merchant notified:', {
            paymentId: paymentState.id,
            status: 'paid',
            txId: paymentState.txId,
            merchantAddress: paymentState.merchantAddress
          });
        }
        
        stopPolling();
      } else if (txStatus === 'failed') {
        setPaymentState(prev => prev ? { ...prev, status: 'failed', error: 'Transaction failed on blockchain' } : null);
        
        // Save failed payment
        if (paymentState.txId) {
          const paymentRecord: PaymentRecord = {
            id: paymentState.id,
            txId: paymentState.txId,
            amount: paymentState.amount,
            recipient: paymentState.recipient,
            status: 'failed',
            timestamp: paymentState.timestamp,
            paymentType: paymentState.paymentType,
            description: paymentState.description,
            merchantAddress: paymentState.merchantAddress,
            payerAddress: paymentState.payerAddress
          };
          
          savePayment(paymentRecord);
          notifyPaymentUpdate(paymentRecord);
        }
        
        stopPolling();
      } else if (txStatus === 'pending') {
        setPaymentState(prev => prev ? { ...prev, status: 'pending' } : null);
      }
    }
  }, [txStatus, paymentState, savePayment, notifyPaymentUpdate, stopPolling]);

  // Update loading and error states
  useEffect(() => {
    setIsLoading(txLoading);
    if (txError) {
      setError(txError);
    }
  }, [txLoading, txError]);

  const initiatePayment = useCallback((paymentLink: PaymentLink, txId: string) => {
    console.log('Initiating payment state management:', { paymentLink, txId });
    
    const newPaymentState: PaymentState = {
      id: paymentLink.id,
      txId,
      amount: paymentLink.amount,
      recipient: paymentLink.merchantAddress,
      status: 'pending',
      timestamp: Date.now(),
      paymentType: paymentLink.paymentType || 'STX',
      description: paymentLink.description,
      merchantAddress: paymentLink.merchantAddress
    };
    
    setPaymentState(newPaymentState);
    setError(null);
    
    // Start polling for transaction status
    pollTransaction(txId);
    
    // Save initial payment record
    const paymentRecord: PaymentRecord = {
      id: paymentLink.id,
      txId,
      amount: paymentLink.amount,
      recipient: paymentLink.merchantAddress,
      status: 'pending',
      timestamp: Date.now(),
      paymentType: paymentLink.paymentType || 'STX',
      description: paymentLink.description,
      merchantAddress: paymentLink.merchantAddress
    };
    
    savePayment(paymentRecord);
  }, [pollTransaction, savePayment]);

  const checkPaymentStatus = useCallback((txId: string) => {
    console.log('Manually checking payment status for:', txId);
    pollTransaction(txId);
  }, [pollTransaction]);

  const clearPaymentState = useCallback(() => {
    console.log('Clearing payment state');
    setPaymentState(null);
    setError(null);
    stopPolling();
  }, [stopPolling]);

  const isDuplicatePayment = useCallback((recipient: string, amount: string): boolean => {
    return checkDuplicate(recipient, amount);
  }, [checkDuplicate]);

  return {
    paymentState,
    isLoading,
    error,
    initiatePayment,
    checkPaymentStatus,
    clearPaymentState,
    isDuplicatePayment
  };
};
