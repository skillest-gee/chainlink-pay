import { useState, useCallback, useEffect } from 'react';

export type BitcoinWalletState = {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isConnecting: boolean;
  error: string | null;
};

export function useBitcoinWallet() {
  const [state, setState] = useState<BitcoinWalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  // Check if Bitcoin wallet is available
  const checkBitcoinWallet = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for common Bitcoin wallet providers
    if (typeof (window as any).unisat !== 'undefined') {
      return 'unisat';
    }
    if (typeof (window as any).okxwallet !== 'undefined') {
      return 'okxwallet';
    }
    if (typeof (window as any).bitget !== 'undefined') {
      return 'bitget';
    }
    if (typeof (window as any).bitcoin !== 'undefined') {
      return 'bitcoin';
    }
    if (typeof (window as any).btc !== 'undefined') {
      return 'btc';
    }
    
    // Check for mobile-specific Bitcoin wallets
    if (isMobile) {
      if (typeof (window as any).xverse !== 'undefined') {
        return 'xverse';
      }
      if (typeof (window as any).leather !== 'undefined') {
        return 'leather';
      }
    }

    return null;
  }, []);

  // Connect to Bitcoin wallet
  const connect = useCallback(async () => {
    try {
      setState(s => ({ ...s, isConnecting: true, error: null }));

      const provider = checkBitcoinWallet();
      
      if (!provider) {
        setState(s => ({ 
          ...s, 
          error: 'No Bitcoin wallet detected. Please install Unisat, OKX, Bitget, Xverse, or Leather wallet.', 
          isConnecting: false 
        }));
        return;
      }

      let address: string;
      let balance: number = 0;

      switch (provider) {
        case 'unisat':
          if ((window as any).unisat) {
            const accounts = await (window as any).unisat.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).unisat.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        case 'okxwallet':
          if ((window as any).okxwallet) {
            const accounts = await (window as any).okxwallet.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).okxwallet.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        case 'bitget':
          if ((window as any).bitget) {
            const accounts = await (window as any).bitget.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).bitget.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        case 'xverse':
          if ((window as any).xverse) {
            const accounts = await (window as any).xverse.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).xverse.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        case 'leather':
          if ((window as any).leather) {
            const accounts = await (window as any).leather.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).leather.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        default:
          throw new Error('Unsupported Bitcoin wallet provider');
      }

      setState({
        isConnected: true,
        address,
        balance,
        isConnecting: false,
        error: null,
      });

    } catch (e: any) {
      console.error('Bitcoin wallet connection failed:', e);
      setState(s => ({ 
        ...s, 
        error: e.message || 'Failed to connect Bitcoin wallet', 
        isConnecting: false 
      }));
    }
  }, [checkBitcoinWallet]);

  // Sign transaction
  const signTransaction = useCallback(async (transaction: any) => {
    if (!state.isConnected) {
      throw new Error('Bitcoin wallet not connected');
    }

    const provider = checkBitcoinWallet();
    if (!provider) {
      throw new Error('No Bitcoin wallet available');
    }

    try {
      switch (provider) {
        case 'unisat':
          return await (window as any).unisat.signTransaction(transaction);
        case 'okxwallet':
          return await (window as any).okxwallet.signTransaction(transaction);
        case 'bitget':
          return await (window as any).bitget.signTransaction(transaction);
        case 'xverse':
          return await (window as any).xverse.signTransaction(transaction);
        case 'leather':
          return await (window as any).leather.signTransaction(transaction);
        default:
          throw new Error('Unsupported Bitcoin wallet provider');
      }
    } catch (e: any) {
      console.error('Bitcoin transaction signing failed:', e);
      throw new Error(e.message || 'Failed to sign Bitcoin transaction');
    }
  }, [state.isConnected, checkBitcoinWallet]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      const provider = checkBitcoinWallet();
      if (provider) {
        try {
          // Try to get accounts without prompting
          let accounts: string[] = [];
          switch (provider) {
            case 'unisat':
              if ((window as any).unisat) {
                accounts = await (window as any).unisat.getAccounts();
              }
              break;
            case 'okxwallet':
              if ((window as any).okxwallet) {
                accounts = await (window as any).okxwallet.getAccounts();
              }
              break;
            case 'bitget':
              if ((window as any).bitget) {
                accounts = await (window as any).bitget.getAccounts();
              }
              break;
            case 'xverse':
              if ((window as any).xverse) {
                accounts = await (window as any).xverse.getAccounts();
              }
              break;
            case 'leather':
              if ((window as any).leather) {
                accounts = await (window as any).leather.getAccounts();
              }
              break;
          }

          if (accounts && accounts.length > 0) {
            setState(s => ({
              ...s,
              isConnected: true,
              address: accounts[0],
              balance: 0, // Will be fetched separately
            }));
          }
        } catch (e) {
          // Wallet not connected, that's fine
          console.log('Bitcoin wallet not connected');
        }
      }
    };

    checkConnection();
  }, [checkBitcoinWallet]);

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
  };
}