import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStacksWallet, WalletState } from '../hooks/useStacksWallet';

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
  forceUpdate: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useStacksWallet();
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  // Force update function to trigger re-renders
  const forceUpdate = () => {
    setForceUpdateCounter(prev => prev + 1);
  };

  // Listen for wallet state changes and force updates
  useEffect(() => {
    console.log('Wallet context: wallet state changed', wallet);
    forceUpdate();
  }, [wallet.isAuthenticated, wallet.address, wallet.error]);

  // Listen for custom wallet state change events
  useEffect(() => {
    const handleWalletStateChange = (event: CustomEvent) => {
      console.log('Custom wallet state change event received:', event.detail);
      forceUpdate();
    };

    window.addEventListener('walletStateChanged', handleWalletStateChange as EventListener);
    
    return () => {
      window.removeEventListener('walletStateChanged', handleWalletStateChange as EventListener);
    };
  }, []);

  const contextValue: WalletContextType = {
    ...wallet,
    forceUpdate,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
