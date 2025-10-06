import { useState, useCallback, useEffect, useMemo } from 'react';
import { showConnect } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { appDetails, STACKS_NETWORK_KEY } from '../config/stacksConfig';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export type WalletState = {
  address: string | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;
  version: number; // Add version to force re-renders
};

export function useStacksWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isAuthenticated: false,
    isConnecting: false,
    error: null,
    version: 0,
  });

  // Helper function to update state with version increment
  const updateState = useCallback((updates: Partial<WalletState>) => {
    setState(s => {
      const newState = { ...s, ...updates, version: s.version + 1 };
      // Dispatch custom event for wallet state changes
      window.dispatchEvent(new CustomEvent('walletStateChanged', { 
        detail: newState 
      }));
      return newState;
    });
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('Wallet state changed:', state);
    console.log('isAuthenticated:', state.isAuthenticated);
    console.log('address:', state.address);
    console.log('isConnecting:', state.isConnecting);
    console.log('error:', state.error);
  }, [state]);

  // Check network compatibility
  const checkNetworkCompatibility = useCallback(() => {
    const currentNetwork = STACKS_NETWORK_KEY;
    console.log('Current network configuration:', currentNetwork);
    
    // In a real app, you might want to check if the user's wallet is on the correct network
    // For now, we'll just log the network being used
    if (currentNetwork === 'testnet') {
      console.log('Using Stacks testnet - make sure your wallet is connected to testnet');
    } else if (currentNetwork === 'mainnet') {
      console.log('Using Stacks mainnet - make sure your wallet is connected to mainnet');
    }
  }, []);

  useEffect(() => {
    checkNetworkCompatibility();

    console.log('useEffect running - checking wallet state');
    console.log('isUserSignedIn:', userSession.isUserSignedIn());
    console.log('isSignInPending:', userSession.isSignInPending());

    if (userSession.isUserSignedIn()) {
      try {
        const userData = userSession.loadUserData();
        const addresses = (userData as any)?.profile?.stxAddress;
        const testnet = addresses?.testnet || null;
        const mainnet = addresses?.mainnet || null;
        
        // Use the appropriate address based on network
        const address = STACKS_NETWORK_KEY === 'testnet' ? testnet : mainnet;
        
        if (address) {
          updateState({ address, isAuthenticated: true, error: null });
          console.log('Wallet connected:', address);
        } else {
          updateState({ 
            error: `No ${STACKS_NETWORK_KEY} address found. Please reconnect your wallet.`,
            isAuthenticated: false
          });
        }
      } catch (err: any) {
        console.error('Error loading user data:', err);
        updateState({ 
          error: 'Failed to load wallet data. Please reconnect.', 
          isAuthenticated: false 
        });
      }
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => {
        try {
          const userData = userSession.loadUserData();
          const addresses = (userData as any)?.profile?.stxAddress;
          const testnet = addresses?.testnet || null;
          const mainnet = addresses?.mainnet || null;
          
          const address = STACKS_NETWORK_KEY === 'testnet' ? testnet : mainnet;
          
          if (address) {
            updateState({ address, isAuthenticated: true, error: null });
            console.log('Wallet connected after pending sign-in:', address);
          } else {
            updateState({ 
              error: `No ${STACKS_NETWORK_KEY} address found. Please reconnect your wallet.`,
              isAuthenticated: false 
            });
          }
        } catch (err: any) {
          console.error('Error handling pending sign-in:', err);
          updateState({ 
            error: 'Failed to complete wallet connection.', 
            isAuthenticated: false 
          });
        }
      }).catch(err => {
        console.error('Pending sign-in failed:', err);
        updateState({ 
          error: err?.message || 'Sign-in failed. Please try again.', 
          isConnecting: false 
        });
      });
    } else {
      // User is not signed in, ensure state reflects this
      updateState({ 
        address: null, 
        isAuthenticated: false, 
        error: null 
      });
    }
  }, [checkNetworkCompatibility]);

  // Add effect to listen for wallet state changes
  useEffect(() => {
    const checkWalletState = () => {
      const isSignedIn = userSession.isUserSignedIn();
      console.log('Checking wallet state - isSignedIn:', isSignedIn);
      
      if (isSignedIn && !state.isAuthenticated) {
        // Wallet was connected, update state
        try {
          const userData = userSession.loadUserData();
          const addresses = (userData as any)?.profile?.stxAddress;
          const testnet = addresses?.testnet || null;
          const mainnet = addresses?.mainnet || null;
          const address = STACKS_NETWORK_KEY === 'testnet' ? testnet : mainnet;
          
          if (address) {
            updateState({ address, isAuthenticated: true, error: null });
            console.log('Wallet state updated - connected:', address);
          }
        } catch (err: any) {
          console.error('Error checking wallet state:', err);
        }
      } else if (!isSignedIn && state.isAuthenticated) {
        // Wallet was disconnected, update state
        updateState({ address: null, isAuthenticated: false, error: null });
        console.log('Wallet state updated - disconnected');
      }
    };

    // Check immediately
    checkWalletState();

    // Set up interval to check for changes
    const interval = setInterval(checkWalletState, 1000);

    // Add event listener for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stacks-session' || e.key?.includes('stacks')) {
        console.log('Storage change detected, checking wallet state');
        setTimeout(checkWalletState, 100);
      }
    };

    // Add focus event listener to check wallet state when user returns to tab
    const handleFocus = () => {
      console.log('Window focused, checking wallet state');
      setTimeout(checkWalletState, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.isAuthenticated, state.address]);

  const connect = useCallback(() => {
    try {
      updateState({ isConnecting: true, error: null });

      console.log('Initiating wallet connection...');
      console.log('Network:', STACKS_NETWORK_KEY);
      console.log('App details:', appDetails);
      console.log('User session:', userSession);
      
      showConnect({
        userSession,
        appDetails,
        onFinish: () => {
          console.log('=== WALLET CONNECTION ONFINISH CALLED ===');
          console.log('Wallet connection onFinish called');
          try {
            console.log('Wallet connection finished, loading user data...');
            const userData = userSession.loadUserData();
            console.log('User data loaded:', userData);
            const addresses = (userData as any)?.profile?.stxAddress;
            console.log('Addresses found:', addresses);
            const testnet = addresses?.testnet || null;
            const mainnet = addresses?.mainnet || null;
            
            const address = STACKS_NETWORK_KEY === 'testnet' ? testnet : mainnet;
            console.log('Selected address for network', STACKS_NETWORK_KEY, ':', address);
            
            if (address) {
              console.log('Setting wallet state with address:', address);
              updateState({ address, isAuthenticated: true, isConnecting: false, error: null });
              console.log('Wallet connected successfully:', address);
            } else {
              updateState({ 
                error: `No ${STACKS_NETWORK_KEY} address found. Please check your wallet settings.`,
                isAuthenticated: false,
                isConnecting: false 
              });
            }
          } catch (err: any) {
            console.error('Error in onFinish:', err);
            updateState({ 
              error: 'Failed to load wallet data after connection.', 
              isAuthenticated: false,
              isConnecting: false 
            });
          }
        },
        onCancel: () => {
          console.log('Wallet connection cancelled by user');
          updateState({ isConnecting: false });
        },
      });
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      updateState({ 
        error: err?.message || 'Connection error. Please try again.', 
        isConnecting: false 
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      console.log('Disconnecting wallet...');
      userSession.signUserOut();
      // Force immediate state update
      updateState({ address: null, isAuthenticated: false, isConnecting: false, error: null });
      console.log('Wallet disconnected successfully');
      
      // Force a re-render by updating state again after a short delay
      setTimeout(() => {
        updateState({ address: null, isAuthenticated: false, isConnecting: false, error: null });
      }, 100);
    } catch (err: any) {
      console.error('Wallet disconnect error:', err);
      updateState({ error: err?.message || 'Disconnect error' });
    }
  }, []);

  return useMemo(() => {
    console.log('useMemo returning state:', state);
    return { ...state, connect, disconnect };
  }, [state, connect, disconnect, updateState]);
}

