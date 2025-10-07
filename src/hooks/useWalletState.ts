/**
 * Enhanced Wallet State Management
 * Centralized wallet state with reactive updates and error handling
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStacksWallet } from './useStacksWallet';
import { useBitcoinWallet } from './useBitcoinWallet';

export interface WalletState {
  // Stacks wallet
  stacks: {
    isConnected: boolean;
    address: string | null;
    isConnecting: boolean;
    error: string | null;
  };
  
  // Bitcoin wallet
  bitcoin: {
    isConnected: boolean;
    address: string | null;
    isConnecting: boolean;
    error: string | null;
  };
  
  // Combined state
  isAnyConnected: boolean;
  isAllConnected: boolean;
  hasErrors: boolean;
  errors: string[];
}

export function useWalletState() {
  const stacksWallet = useStacksWallet();
  const bitcoinWallet = useBitcoinWallet();
  
  const [state, setState] = useState<WalletState>({
    stacks: {
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
    },
    bitcoin: {
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
    },
    isAnyConnected: false,
    isAllConnected: false,
    hasErrors: false,
    errors: [],
  });

  // Update state when wallet states change
  useEffect(() => {
    const newState: WalletState = {
      stacks: {
        isConnected: stacksWallet.isAuthenticated,
        address: stacksWallet.address,
        isConnecting: stacksWallet.isConnecting,
        error: stacksWallet.error,
      },
      bitcoin: {
        isConnected: bitcoinWallet.isConnected,
        address: bitcoinWallet.address,
        isConnecting: bitcoinWallet.isConnecting,
        error: bitcoinWallet.error,
      },
      isAnyConnected: stacksWallet.isAuthenticated || bitcoinWallet.isConnected,
      isAllConnected: stacksWallet.isAuthenticated && bitcoinWallet.isConnected,
      hasErrors: !!(stacksWallet.error || bitcoinWallet.error),
      errors: [stacksWallet.error, bitcoinWallet.error].filter(Boolean) as string[],
    };

    setState(newState);
  }, [stacksWallet, bitcoinWallet]);

  // Helper functions
  const connectStacks = useCallback(() => {
    stacksWallet.connect();
  }, [stacksWallet]);

  const connectBitcoin = useCallback(() => {
    bitcoinWallet.connect();
  }, [bitcoinWallet]);

  const disconnectAll = useCallback(() => {
    stacksWallet.disconnect();
    bitcoinWallet.disconnect();
  }, [stacksWallet, bitcoinWallet]);

  const clearErrors = useCallback(() => {
    // Clear errors by reconnecting or refreshing state
    if (stacksWallet.error) {
      stacksWallet.connect();
    }
    if (bitcoinWallet.error) {
      bitcoinWallet.connect();
    }
  }, [stacksWallet, bitcoinWallet]);

  return useMemo(() => ({
    ...state,
    connectStacks,
    connectBitcoin,
    disconnectAll,
    clearErrors,
  }), [state, connectStacks, connectBitcoin, disconnectAll, clearErrors]);
}
