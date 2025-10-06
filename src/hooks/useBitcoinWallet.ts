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

    return null;
  }, []);

  // Connect to Bitcoin wallet
  const connect = useCallback(async () => {
    console.log('Connect Bitcoin Wallet button clicked');
    try {
      setState(s => ({ ...s, isConnecting: true, error: null }));

      const provider = checkBitcoinWallet();
      
      if (!provider) {
        console.log('No Bitcoin wallet provider found');
        throw new Error('No Bitcoin wallet found. Please install a Bitcoin wallet like Unisat, OKX, or Bitget.');
      }

      console.log('Connecting to Bitcoin wallet:', provider);

      // Request account access - use safer approach
      let accounts;
      if (provider === 'unisat') {
        accounts = await (window as any).unisat.requestAccounts();
      } else if (provider === 'okxwallet') {
        accounts = await (window as any).okxwallet.bitcoin.requestAccounts();
      } else if (provider === 'bitget') {
        accounts = await (window as any).bitget.bitcoin.requestAccounts();
      } else {
        // Generic Bitcoin wallet
        const wallet = (window as any)[provider];
        accounts = await wallet.requestAccounts();
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No Bitcoin accounts found');
      }

      const address = accounts[0];
      console.log('Bitcoin wallet connected:', address);

      // Get balance - use safer approach
      let balance;
      if (provider === 'unisat') {
        balance = await (window as any).unisat.getBalance();
      } else if (provider === 'okxwallet') {
        balance = await (window as any).okxwallet.bitcoin.getBalance();
      } else if (provider === 'bitget') {
        balance = await (window as any).bitget.bitcoin.getBalance();
      } else {
        const wallet = (window as any)[provider];
        balance = await wallet.getBalance();
      }
      
      console.log('Bitcoin balance:', balance);

      setState({
        isConnected: true,
        address,
        balance: balance / 100000000, // Convert satoshis to BTC
        isConnecting: false,
        error: null,
      });

    } catch (error: any) {
      console.error('Bitcoin wallet connection error:', error);
      setState(s => ({
        ...s,
        error: error.message || 'Failed to connect Bitcoin wallet',
        isConnecting: false,
      }));
    }
  }, [checkBitcoinWallet]);

  // Disconnect Bitcoin wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Sign Bitcoin transaction
  const signTransaction = useCallback(async (to: string, amount: number, memo?: string) => {
    try {
      const provider = checkBitcoinWallet();
      
      if (!provider) {
        throw new Error('No Bitcoin wallet found');
      }

      if (!state.isConnected) {
        throw new Error('Bitcoin wallet not connected');
      }

      console.log('Signing Bitcoin transaction:', { to, amount, memo });

      // Create transaction
      const transaction = {
        to,
        amount: Math.floor(amount * 100000000), // Convert BTC to satoshis
        memo: memo || '',
      };

      // Sign transaction based on provider
      let signedTx;
      if (provider === 'unisat') {
        signedTx = await (window as any).unisat.signTransaction(transaction);
      } else if (provider === 'okxwallet') {
        signedTx = await (window as any).okxwallet.bitcoin.signTransaction(transaction);
      } else if (provider === 'bitget') {
        signedTx = await (window as any).bitget.bitcoin.signTransaction(transaction);
      } else {
        const wallet = (window as any)[provider];
        signedTx = await wallet.signTransaction(transaction);
      }
      
      console.log('Bitcoin transaction signed:', signedTx);
      return signedTx;

    } catch (error: any) {
      console.error('Bitcoin transaction signing error:', error);
      throw new Error(`Failed to sign Bitcoin transaction: ${error.message}`);
    }
  }, [state.isConnected, checkBitcoinWallet]);

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
  };
}
