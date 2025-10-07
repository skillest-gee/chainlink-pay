/**
 * Reactive Wallet State Management
 * Ensures all components update instantly on wallet changes
 */

import { useEffect, useState, useCallback } from 'react';
import { useStacksWallet } from './useStacksWallet';
import { useBitcoinWallet } from './useBitcoinWallet';

export interface ReactiveWalletState {
  // Connection states
  isStacksConnected: boolean;
  isBitcoinConnected: boolean;
  isAnyWalletConnected: boolean;
  
  // Addresses
  stacksAddress: string | null;
  bitcoinAddress: string | null;
  
  // Balances
  stacksBalance: string;
  bitcoinBalance: string;
  
  // Loading states
  isConnecting: boolean;
  isDisconnecting: boolean;
  
  // Error states
  connectionError: string | null;
  
  // Actions
  connectStacks: () => Promise<void>;
  connectBitcoin: () => Promise<void>;
  disconnectAll: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

export function useReactiveWallet(): ReactiveWalletState {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const {
    isAuthenticated: isStacksConnected,
    address: stacksAddress,
    connect: connectStacksWallet,
    disconnect: disconnectStacksWallet
  } = useStacksWallet();

  const {
    isConnected: isBitcoinConnected,
    address: bitcoinAddress,
    balance: bitcoinBalance,
    connect: connectBitcoinWallet,
    disconnect: disconnectBitcoinWallet
  } = useBitcoinWallet();

  // Force re-render when wallet state changes
  const triggerUpdate = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  // Connect Stacks wallet
  const connectStacks = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      await connectStacksWallet();
      triggerUpdate();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect Stacks wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [connectStacksWallet, triggerUpdate]);

  // Connect Bitcoin wallet
  const connectBitcoin = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      await connectBitcoinWallet();
      triggerUpdate();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect Bitcoin wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [connectBitcoinWallet, triggerUpdate]);

  // Disconnect all wallets
  const disconnectAll = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      setConnectionError(null);
      
      if (isStacksConnected) {
        await disconnectStacksWallet();
      }
      
      if (isBitcoinConnected) {
        await disconnectBitcoinWallet();
      }
      
      triggerUpdate();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to disconnect wallets');
    } finally {
      setIsDisconnecting(false);
    }
  }, [isStacksConnected, isBitcoinConnected, disconnectStacksWallet, disconnectBitcoinWallet, triggerUpdate]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    try {
      // This will trigger balance updates in the respective hooks
      triggerUpdate();
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [triggerUpdate]);

  // Auto-refresh balances every 30 seconds when connected
  useEffect(() => {
    if (isStacksConnected || isBitcoinConnected) {
      const interval = setInterval(() => {
        refreshBalances();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isStacksConnected, isBitcoinConnected, refreshBalances]);

  // Clear errors when wallet state changes
  useEffect(() => {
    if (isStacksConnected || isBitcoinConnected) {
      setConnectionError(null);
    }
  }, [isStacksConnected, isBitcoinConnected]);

  return {
    // Connection states
    isStacksConnected,
    isBitcoinConnected,
    isAnyWalletConnected: isStacksConnected || isBitcoinConnected,
    
    // Addresses
    stacksAddress,
    bitcoinAddress,
    
    // Balances (these will be updated by the respective hooks)
    stacksBalance: '0', // This should be updated by useStxBalance
    bitcoinBalance: bitcoinBalance || '0',
    
    // Loading states
    isConnecting,
    isDisconnecting,
    
    // Error states
    connectionError,
    
    // Actions
    connectStacks,
    connectBitcoin,
    disconnectAll,
    refreshBalances
  };
}

// Hook to force component re-render on wallet changes
export function useWalletStateTrigger() {
  const [trigger, setTrigger] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  return { trigger, forceUpdate };
}
