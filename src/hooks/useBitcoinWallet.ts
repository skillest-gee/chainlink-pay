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
    
    console.log('Checking for Bitcoin wallets...', { isMobile });
    
    // Check for common Bitcoin wallet providers
    if (typeof (window as any).unisat !== 'undefined') {
      console.log('Unisat wallet detected');
      return 'unisat';
    }
    if (typeof (window as any).okxwallet !== 'undefined') {
      console.log('OKX wallet detected');
      return 'okxwallet';
    }
    if (typeof (window as any).bitget !== 'undefined') {
      console.log('Bitget wallet detected');
      return 'bitget';
    }
    if (typeof (window as any).bitcoin !== 'undefined') {
      console.log('Bitcoin wallet detected');
      return 'bitcoin';
    }
    if (typeof (window as any).btc !== 'undefined') {
      console.log('BTC wallet detected');
      return 'btc';
    }
    
    // Check for mobile-specific Bitcoin wallets with better detection
    if (isMobile) {
      // Check for Xverse wallet (supports both Bitcoin and Stacks)
      if (typeof (window as any).XverseProvider !== 'undefined' || 
          typeof (window as any).xverse !== 'undefined' ||
          typeof (window as any).XverseWallet !== 'undefined') {
        console.log('Xverse wallet detected on mobile');
        return 'xverse';
      }
      
      // Check for Leather wallet (formerly Hiro wallet)
      if (typeof (window as any).LeatherProvider !== 'undefined' || 
          typeof (window as any).leather !== 'undefined' ||
          typeof (window as any).LeatherWallet !== 'undefined') {
        console.log('Leather wallet detected on mobile');
        return 'leather';
      }
      
      // Check for Stacks Connect mobile wallets
      if (typeof (window as any).StacksProvider !== 'undefined') {
        console.log('Stacks provider detected on mobile');
        return 'stacks';
      }
    }

    console.log('No Bitcoin wallet detected');
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

      let address: string | null = null;
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
          // Xverse wallet connection (mobile-friendly)
          if ((window as any).XverseProvider) {
            const provider = new (window as any).XverseProvider();
            const accounts = await provider.requestAccounts();
            address = accounts[0];
            const balanceResult = await provider.getBalance();
            balance = balanceResult.confirmed;
          } else if ((window as any).xverse) {
            const accounts = await (window as any).xverse.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).xverse.getBalance();
            balance = balanceResult.confirmed;
          } else {
            // For mobile, try to open Xverse app
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              // Try to open Xverse app
              window.location.href = 'xverse://connect';
              throw new Error('Please open Xverse wallet app and try again');
            }
          }
          break;
        case 'leather':
          // Leather wallet connection (mobile-friendly)
          if ((window as any).LeatherProvider) {
            const provider = new (window as any).LeatherProvider();
            const accounts = await provider.requestAccounts();
            address = accounts[0];
            const balanceResult = await provider.getBalance();
            balance = balanceResult.confirmed;
          } else if ((window as any).leather) {
            const accounts = await (window as any).leather.requestAccounts();
            address = accounts[0];
            const balanceResult = await (window as any).leather.getBalance();
            balance = balanceResult.confirmed;
          } else {
            // For mobile, try to open Leather app
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              // Try to open Leather app
              window.location.href = 'leather://connect';
              throw new Error('Please open Leather wallet app and try again');
            }
          }
          break;
        case 'stacks':
          // Stacks Connect for mobile
          if ((window as any).StacksProvider) {
            const provider = new (window as any).StacksProvider();
            const accounts = await provider.requestAccounts();
            address = accounts[0];
            const balanceResult = await provider.getBalance();
            balance = balanceResult.confirmed;
          }
          break;
        default:
          throw new Error('Unsupported Bitcoin wallet provider');
      }

      if (address) {
        setState({
          isConnected: true,
          address,
          balance,
          isConnecting: false,
          error: null,
        });
      } else {
        setState(s => ({ 
          ...s, 
          error: 'Failed to get Bitcoin address', 
          isConnecting: false 
        }));
      }

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