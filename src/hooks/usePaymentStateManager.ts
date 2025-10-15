// hooks/usePaymentStateManager.ts
import { useState, useEffect, useCallback } from 'react';
import { PaymentLink, paymentStorage } from '../services/paymentStorage';
import { paymentStatusAPI } from '../services/paymentStatusAPI';

export interface PaymentState {
  status: 'pending' | 'confirmed' | 'failed' | 'unknown';
  txId?: string;
  blockHeight?: number;
  confirmations?: number;
  lastChecked?: number;
  error?: string;
}

export const usePaymentStateManager = () => {
  const [paymentStates, setPaymentStates] = useState<Record<string, PaymentState>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check payment status on blockchain
  const checkPaymentStatus = useCallback(async (paymentId: string, txHash?: string): Promise<PaymentState> => {
    setIsLoading(prev => ({ ...prev, [paymentId]: true }));
    
    try {
      console.log(`Checking payment status for: ${paymentId}, TX: ${txHash}`);
      
      // First, check with centralized API
      const apiStatus = await paymentStatusAPI.getPayment(paymentId);
      if (apiStatus && apiStatus.status === 'paid') {
        const state: PaymentState = { status: 'confirmed', txId: apiStatus.txHash };
        setPaymentStates(prev => ({ ...prev, [paymentId]: state }));
        return state;
      }

      // If we have a transaction hash, check blockchain directly
      if (txHash) {
        const blockchainStatus = await checkBlockchainStatus(txHash, paymentId);
        if (blockchainStatus.status === 'confirmed') {
          // Update centralized API
          await paymentStatusAPI.updatePaymentStatus(paymentId, 'paid', txHash);
        }
        setPaymentStates(prev => ({ ...prev, [paymentId]: blockchainStatus }));
        return blockchainStatus;
      }

      // Default state
      const defaultState: PaymentState = { status: 'pending' };
      setPaymentStates(prev => ({ ...prev, [paymentId]: defaultState }));
      return defaultState;

    } catch (error) {
      console.error(`Error checking payment status for ${paymentId}:`, error);
      const errorState: PaymentState = { 
        status: 'unknown', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
      setErrors(prev => ({ ...prev, [paymentId]: errorState.error || 'Unknown error' }));
      setPaymentStates(prev => ({ ...prev, [paymentId]: errorState }));
      return errorState;
    } finally {
      setIsLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  }, []);

  // Initiate payment tracking
  const initiatePayment = useCallback((payment: PaymentLink, txHash: string) => {
    const paymentId = payment.id;
    const state: PaymentState = { 
      status: 'pending', 
      txId: txHash,
      lastChecked: Date.now()
    };
    
    setPaymentStates(prev => ({ ...prev, [paymentId]: state }));
    
    // Start periodic checking
    const checkInterval = setInterval(async () => {
      const currentState = await checkPaymentStatus(paymentId, txHash);
      if (currentState.status === 'confirmed') {
        clearInterval(checkInterval);
        
        // Trigger merchant notification
        notifyMerchant(payment, txHash);
      }
    }, 3000); // Check every 3 seconds

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(checkInterval), 10 * 60 * 1000);
  }, [checkPaymentStatus]);

  // Check for duplicate payments
  const isDuplicatePayment = useCallback((merchantAddress: string, amount: string): boolean => {
    const pendingPayments = Object.entries(paymentStates).filter(([_, state]) => 
      state.status === 'pending'
    );
    return pendingPayments.length > 0;
  }, [paymentStates]);

  // Clear payment state
  const clearPaymentState = useCallback((paymentId: string) => {
    setPaymentStates(prev => {
      const newStates = { ...prev };
      delete newStates[paymentId];
      return newStates;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[paymentId];
      return newErrors;
    });
  }, []);

  return {
    paymentStates,
    isLoading,
    errors,
    checkPaymentStatus,
    initiatePayment,
    isDuplicatePayment,
    clearPaymentState
  };
};

// Blockchain status checker
async function checkBlockchainStatus(txHash: string, paymentId: string): Promise<PaymentState> {
  try {
    const network = process.env.REACT_APP_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
    const apiUrl = network === 'testnet' 
      ? 'https://api.testnet.hiro.so' 
      : 'https://api.hiro.so';

    const response = await fetch(`${apiUrl}/extended/v1/tx/${txHash}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'pending', txId: txHash, lastChecked: Date.now() };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Blockchain status for ${paymentId}:`, data.tx_status);

    if (data.tx_status === 'success') {
      return { 
        status: 'confirmed', 
        txId: txHash, 
        blockHeight: data.block_height,
        confirmations: 1, // Simplified
        lastChecked: Date.now()
      };
    } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      return { 
        status: 'failed', 
        txId: txHash, 
        error: `Transaction failed: ${data.tx_status}`,
        lastChecked: Date.now()
      };
    } else {
      return { status: 'pending', txId: txHash, lastChecked: Date.now() };
    }
  } catch (error) {
    console.error(`Blockchain check error for ${paymentId}:`, error);
    return { 
      status: 'unknown', 
      txId: txHash, 
      error: error instanceof Error ? error.message : 'Blockchain check failed',
      lastChecked: Date.now()
    };
  }
}

// Notify merchant about payment completion
async function notifyMerchant(payment: PaymentLink, txHash: string) {
  try {
    console.log(`Notifying merchant about payment: ${payment.id}`);
    
    // Update local storage
    const allPayments = paymentStorage.getAllPaymentLinks();
    const updatedPayments = allPayments.map(p => 
      p.id === payment.id ? { 
        ...p, 
        status: 'paid' as const,
        txHash: txHash,
        paidAt: Date.now()
      } : p
    );
    paymentStorage.saveAllPaymentLinks(updatedPayments);

    // Update centralized API - this will also sync with paymentStorage
    const updatedPayment = updatedPayments.find(p => p.id === payment.id);
    if (updatedPayment) {
      await paymentStatusAPI.savePayment(updatedPayment);
      
      // Also explicitly update the payment status in the API
      await paymentStatusAPI.updatePaymentStatus(payment.id, 'paid', txHash, payment.payerAddress);
    }

    // Trigger events for UI updates
    window.dispatchEvent(new CustomEvent('paymentCompleted', {
      detail: {
        paymentId: payment.id,
        merchantAddress: payment.merchantAddress,
        txHash: txHash,
        amount: payment.amount,
        paymentType: payment.paymentType,
        status: 'paid'
      }
    }));

    // Also dispatch a more specific event for merchant updates
    window.dispatchEvent(new CustomEvent('merchantPaymentUpdate', {
      detail: {
        paymentId: payment.id,
        status: 'paid',
        merchantAddress: payment.merchantAddress,
        txHash: txHash
      }
    }));

    // Dispatch payment updated event
    window.dispatchEvent(new CustomEvent('paymentUpdated', {
      detail: {
        paymentId: payment.id,
        status: 'paid',
        merchantAddress: payment.merchantAddress,
        txHash: txHash
      }
    }));

    console.log(`Merchant notified successfully for payment: ${payment.id}`);
  } catch (error) {
    console.error(`Failed to notify merchant for payment ${payment.id}:`, error);
  }
}