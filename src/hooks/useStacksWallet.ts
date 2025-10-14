import { useState, useCallback, useEffect, useMemo } from 'react';
import { showConnect } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { appDetails, STACKS_NETWORK_KEY } from '../config/stacksConfig';
import { mobileWalletConnect, handlePostInstallRedirect, isMobileDevice } from '../utils/mobileWalletConnection';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Wallet provider persistence utilities
const WALLET_PROVIDER_KEY = 'chainlink-pay-wallet-provider';

const saveWalletProvider = (provider: 'xverse' | 'leather' | 'hiro' | 'unknown') => {
  try {
    localStorage.setItem(WALLET_PROVIDER_KEY, provider);
    localStorage.setItem('chainlink-pay-last-used-wallet', provider);
    
    // Track connection history
    const connectionHistory = JSON.parse(localStorage.getItem('chainlink-pay-connection-history') || '[]');
    connectionHistory.push({
      wallet: provider,
      timestamp: Date.now(),
      address: 'connected' // We'll update this with the actual address later
    });
    
    // Keep only last 10 connections
    if (connectionHistory.length > 10) {
      connectionHistory.splice(0, connectionHistory.length - 10);
    }
    
    localStorage.setItem('chainlink-pay-connection-history', JSON.stringify(connectionHistory));
    
    console.log('Saved wallet provider to localStorage:', provider);
    console.log('Updated connection history:', connectionHistory);
  } catch (error) {
    console.warn('Failed to save wallet provider:', error);
  }
};

const loadWalletProvider = (): 'xverse' | 'leather' | 'hiro' | 'unknown' => {
  try {
    const provider = localStorage.getItem(WALLET_PROVIDER_KEY) as 'xverse' | 'leather' | 'hiro' | 'unknown';
    if (provider && ['xverse', 'leather', 'hiro', 'unknown'].includes(provider)) {
      console.log('Loaded wallet provider from localStorage:', provider);
      return provider;
    }
  } catch (error) {
    console.warn('Failed to load wallet provider:', error);
  }
  return 'unknown';
};

export type WalletState = {
  address: string | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;
  version: number; // Add version to force re-renders
  walletProvider?: 'xverse' | 'leather' | 'hiro' | 'unknown';
};

export function useStacksWallet() {
  const [state, setState] = useState<WalletState>(() => {
    // Initialize with persisted wallet provider
    const persistedProvider = loadWalletProvider();
    return {
      address: null,
      isAuthenticated: false,
      isConnecting: false,
      error: null,
      version: 0,
      walletProvider: persistedProvider,
    };
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
    
    // Handle post-installation redirect for mobile wallets
    handlePostInstallRedirect();
  }, [state]);

  // Detect which wallet was actually used for the connection
  const detectConnectionSource = useCallback(() => {
    try {
      console.log('=== DETECTING CONNECTION SOURCE ===');
      
      // Check if we can determine the connection source from the current session
      if (userSession && userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const authResponse = (userData as any)?.authResponse;
        
        if (authResponse) {
          // Check the authResponse for specific wallet indicators
          const authString = JSON.stringify(authResponse);
          console.log('Auth response for connection source:', authString);
          
          // Look for specific wallet connection patterns
          if (authString.includes('xverse') || authString.includes('Xverse')) {
            console.log('Connection source: Xverse (from authResponse)');
            return 'xverse';
          }
          
          if (authString.includes('leather') || authString.includes('Leather') || 
              authString.includes('hiro') || authString.includes('Hiro')) {
            console.log('Connection source: Leather (from authResponse)');
            return 'leather';
          }
        }
      }
      
      // Check recent connection history
      const connectionHistory = localStorage.getItem('chainlink-pay-connection-history');
      if (connectionHistory) {
        try {
          const history = JSON.parse(connectionHistory);
          const recentConnection = history[history.length - 1];
          if (recentConnection && recentConnection.timestamp > Date.now() - 600000) { // 10 minutes
            console.log('Connection source: Recent history -', recentConnection.wallet);
            return recentConnection.wallet;
          }
        } catch (error) {
          console.log('Error parsing connection history:', error);
        }
      }
      
      console.log('Connection source: Unknown');
      return 'unknown';
    } catch (error) {
      console.log('Error detecting connection source:', error);
      return 'unknown';
    }
  }, [userSession]);

  // Detect wallet provider
  const detectWalletProvider = useCallback(() => {
    try {
      console.log('=== WALLET PROVIDER DETECTION ===');
      console.log('Window object wallet providers:');
      console.log('- XverseProvider:', !!(window as any).XverseProvider);
      console.log('- xverse:', !!(window as any).xverse);
      console.log('- LeatherProvider:', !!(window as any).LeatherProvider);
      console.log('- leather:', !!(window as any).leather);
      console.log('- hiro:', !!(window as any).hiro);
      
      // First, try to detect the actual connection source
      const connectionSource = detectConnectionSource();
      if (connectionSource !== 'unknown') {
        console.log('Using connection source detection:', connectionSource);
        return connectionSource;
      }
      
      // Fallback to user session detection
      if (userSession && userSession.isUserSignedIn()) {
        try {
          const userData = userSession.loadUserData();
          const profile = (userData as any)?.profile;
          
          console.log('User session data:', userData);
          console.log('User profile:', profile);
          
          // Check if the profile contains wallet-specific information
          if (profile) {
            // Check the authResponse for wallet provider information
            const authResponse = (userData as any)?.authResponse;
            console.log('Auth response:', authResponse);
            
            if (authResponse) {
              // Check the authResponse for wallet provider indicators
              const authResponseString = JSON.stringify(authResponse);
              console.log('Auth response string:', authResponseString);
              
              if (authResponseString.includes('xverse') || 
                  authResponseString.includes('Xverse') ||
                  authResponseString.includes('xverse-wallet')) {
                console.log('Detected Xverse from authResponse');
                return 'xverse';
              }
              
              if (authResponseString.includes('leather') || 
                  authResponseString.includes('Leather') ||
                  authResponseString.includes('hiro') ||
                  authResponseString.includes('Hiro')) {
                console.log('Detected Leather from authResponse');
                return 'leather';
              }
            }
            
            // Fallback to appPrivateKey check
            if (profile.appPrivateKey && profile.appPrivateKey.includes('xverse')) {
              console.log('Detected Xverse from appPrivateKey');
              return 'xverse';
            }
            
            if (profile.appPrivateKey && profile.appPrivateKey.includes('leather')) {
              console.log('Detected Leather from appPrivateKey');
              return 'leather';
            }
          }
        } catch (error) {
          console.log('Error reading user session for wallet detection:', error);
        }
      }
      
      // Check for manual override in localStorage (for testing)
      const manualOverride = localStorage.getItem('chainlink-pay-wallet-override');
      if (manualOverride && ['xverse', 'leather', 'hiro'].includes(manualOverride)) {
        console.log('Using manual wallet override:', manualOverride);
        return manualOverride as 'xverse' | 'leather' | 'hiro';
      }
      
      // Fallback to window object detection - but be smarter about it
      // When both wallets are present, we need to determine which one was actually used
      const hasXverse = !!(window as any).XverseProvider || !!(window as any).xverse;
      const hasLeather = !!(window as any).LeatherProvider || !!(window as any).leather || !!(window as any).hiro;
      
      console.log('Wallet availability check:');
      console.log('- Has Xverse:', hasXverse);
      console.log('- Has Leather:', hasLeather);
      
      if (hasXverse && hasLeather) {
        console.log('Both wallets detected - checking connection history');
        
        // Check localStorage for previous connection preference
        const lastUsedWallet = localStorage.getItem('chainlink-pay-last-used-wallet');
        if (lastUsedWallet && ['xverse', 'leather'].includes(lastUsedWallet)) {
          console.log('Using last used wallet from localStorage:', lastUsedWallet);
          return lastUsedWallet as 'xverse' | 'leather';
        }
        
        // Check if there's a recent connection event or session data
        const connectionHistory = localStorage.getItem('chainlink-pay-connection-history');
        if (connectionHistory) {
          try {
            const history = JSON.parse(connectionHistory);
            const recentConnection = history[history.length - 1];
            if (recentConnection && recentConnection.timestamp > Date.now() - 300000) { // 5 minutes
              console.log('Using recent connection from history:', recentConnection.wallet);
              return recentConnection.wallet;
            }
          } catch (error) {
            console.log('Error parsing connection history:', error);
          }
        }
        
        // If both are present and no clear indication, default to Xverse (as it's more commonly used)
        console.log('Both wallets present, defaulting to Xverse');
        return 'xverse';
      }
      
      // If only one wallet is present, use that one
      if (hasXverse) {
        console.log('Only Xverse detected, using Xverse');
        return 'xverse';
      }
      
      if (hasLeather) {
        console.log('Only Leather detected, using Leather');
        return 'leather';
      }
      
      // Check user agent for mobile wallets
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('xverse')) {
        console.log('Detected Xverse from user agent');
        return 'xverse';
      }
      
      console.log('No wallet provider detected, returning unknown');
      return 'unknown';
    } catch (error) {
      console.log('Error detecting wallet provider:', error);
      return 'unknown';
    }
  }, [userSession]);

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
          // Detect and save wallet provider for existing connection
          const walletProvider = detectWalletProvider();
          console.log('Detected wallet provider for existing connection:', walletProvider);
          saveWalletProvider(walletProvider);
          
          updateState({ address, isAuthenticated: true, error: null, walletProvider });
          console.log('Wallet connected:', address, 'with provider:', walletProvider);
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
            // Detect and save wallet provider for pending sign-in
            const walletProvider = detectWalletProvider();
            console.log('Detected wallet provider for pending sign-in:', walletProvider);
            saveWalletProvider(walletProvider);
            
            updateState({ address, isAuthenticated: true, error: null, walletProvider });
            console.log('Wallet connected after pending sign-in:', address, 'with provider:', walletProvider);
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

  // Debounced wallet state check to reduce excessive checks
  const debouncedCheckWalletState = useCallback(
    debounce(() => {
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
            // Dispatch custom event for immediate UI updates
            window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address } }));
          }
        } catch (err: any) {
          console.error('Error checking wallet state:', err);
        }
      } else if (!isSignedIn && state.isAuthenticated) {
        // Wallet was disconnected, update state
        updateState({ address: null, isAuthenticated: false, error: null });
        console.log('Wallet state updated - disconnected');
        // Dispatch custom event for immediate UI updates
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
      }
    }, 2000), // Wait 2 seconds between checks instead of 1 second
    [state.isAuthenticated, userSession]
  );

  // Add effect to listen for wallet state changes
  useEffect(() => {
    // Check immediately
    debouncedCheckWalletState();

    // Set up interval to check for changes (reduced frequency for better performance)
    const interval = setInterval(debouncedCheckWalletState, 5000); // Reduced from 1000ms to 5000ms

    // Add event listener for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stacks-session' || e.key?.includes('stacks')) {
        console.log('Storage change detected, checking wallet state');
        debouncedCheckWalletState();
      }
    };

    // Add focus event listener to check wallet state when user returns to tab
    const handleFocus = () => {
      console.log('Window focused, checking wallet state');
      debouncedCheckWalletState();
    };

    // Add visibility change listener for better mobile support
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, checking wallet state');
        debouncedCheckWalletState();
      }
    };

    // Add message listener for cross-tab communication
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'walletStateChange') {
        console.log('Cross-tab wallet state change detected');
        debouncedCheckWalletState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isAuthenticated, state.address]);

  const connect = useCallback(() => {
    try {
      updateState({ isConnecting: true, error: null });

      console.log('Initiating wallet connection...');
      console.log('Network:', STACKS_NETWORK_KEY);
      console.log('App details:', appDetails);
      console.log('User session:', userSession);
      
      // Use mobile-optimized wallet connection
      mobileWalletConnect(
        userSession,
        (address) => {
          console.log('Mobile wallet connection successful:', address);
          const walletProvider = detectWalletProvider();
          console.log('Detected wallet provider:', walletProvider);
          
          // Save wallet provider to localStorage for persistence
          saveWalletProvider(walletProvider);
          
          updateState({ address, isAuthenticated: true, isConnecting: false, error: null, walletProvider });
          console.log('Wallet connected successfully:', address, 'with provider:', walletProvider);
          
          // Dispatch custom event for immediate UI updates
          window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address, walletProvider } }));
          
          // Notify other tabs
          window.postMessage({ type: 'walletStateChange', action: 'connect', address, walletProvider }, '*');
        },
        (error) => {
          console.error('Mobile wallet connection error:', error);
          updateState({ isConnecting: false, error });
        }
      );
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
      
      // Clear wallet provider from localStorage
      try {
        localStorage.removeItem(WALLET_PROVIDER_KEY);
        console.log('Cleared wallet provider from localStorage');
      } catch (error) {
        console.warn('Failed to clear wallet provider:', error);
      }
      
      // Force immediate state update
      updateState({ address: null, isAuthenticated: false, isConnecting: false, error: null, walletProvider: 'unknown' });
      console.log('Wallet disconnected successfully');
      
      // Dispatch custom event for immediate UI updates
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
      
      // Notify other tabs
      window.postMessage({ type: 'walletStateChange', action: 'disconnect' }, '*');
      
      // Force a re-render by updating state again after a short delay
      setTimeout(() => {
        updateState({ address: null, isAuthenticated: false, isConnecting: false, error: null, walletProvider: 'unknown' });
      }, 100);
    } catch (err: any) {
      console.error('Wallet disconnect error:', err);
      updateState({ error: err?.message || 'Disconnect error' });
    }
  }, []);

  // Manual wallet provider setter for testing
  const setWalletProvider = useCallback((provider: 'xverse' | 'leather' | 'hiro' | 'unknown') => {
    console.log('Manually setting wallet provider to:', provider);
    saveWalletProvider(provider);
    updateState({ walletProvider: provider });
  }, [updateState]);

  return useMemo(() => {
    console.log('useMemo returning state:', state);
    return { ...state, connect, disconnect, userSession, detectWalletProvider, detectConnectionSource, setWalletProvider };
  }, [state, connect, disconnect, updateState, userSession, detectWalletProvider, detectConnectionSource, setWalletProvider]);
}

