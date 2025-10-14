import { useState, useEffect, useCallback } from 'react';
import { StacksNetwork } from '@stacks/network';
import { STACKS_NETWORK_KEY } from '../config/stacksConfig';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'unknown';

interface TransactionStatusHook {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  txData: any | null;
  pollTransaction: (txId: string) => void;
  stopPolling: () => void;
}

export const useTransactionStatus = (): TransactionStatusHook => {
  const [status, setStatus] = useState<TransactionStatus>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txData, setTxData] = useState<any | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const checkTransactionOnChain = useCallback(async (txId: string): Promise<TransactionStatus> => {
    try {
      setIsLoading(true);
      setError(null);

      const network = STACKS_NETWORK_KEY === 'testnet' ? 'testnet' : 'mainnet';
      const apiUrl = network === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';

      console.log(`Checking transaction status for ${txId} on ${network}`);

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Transaction not found yet, still pending');
          return 'pending';
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Transaction data received:', data);

      setTxData(data);

      // Check transaction status
      if (data.tx_status === 'success') {
        console.log('Transaction confirmed successfully');
        return 'confirmed';
      } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.log('Transaction failed:', data.tx_status);
        return 'failed';
      } else {
        console.log('Transaction still pending:', data.tx_status);
        return 'pending';
      }
    } catch (err: any) {
      console.error('Error checking transaction status:', err);
      setError(err.message);
      return 'unknown';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollTransaction = useCallback((txId: string) => {
    console.log('Starting transaction polling for:', txId);
    
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Initial check
    checkTransactionOnChain(txId).then(initialStatus => {
      setStatus(initialStatus);
      
      // If still pending, start polling
      if (initialStatus === 'pending') {
        const interval = setInterval(async () => {
          const currentStatus = await checkTransactionOnChain(txId);
          setStatus(currentStatus);
          
          // Stop polling if transaction is confirmed or failed
          if (currentStatus === 'confirmed' || currentStatus === 'failed') {
            console.log('Transaction polling completed with status:', currentStatus);
            clearInterval(interval);
            setPollingInterval(null);
          }
        }, 5000); // Check every 5 seconds
        
        setPollingInterval(interval);
      }
    });
  }, [checkTransactionOnChain, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      console.log('Transaction polling stopped');
    }
  }, [pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    status,
    isLoading,
    error,
    txData,
    pollTransaction,
    stopPolling
  };
};
