import { useEffect, useState } from 'react';
import { accountsApi } from '../config/stacksConfig';

export function useStxBalance(address: string | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }
    let isCancelled = false;
    setLoading(true);
    setError(null);
    
    console.log('Fetching balance for address:', address);
    
    accountsApi
      .getAccountBalance({ principal: address })
      .then(res => {
        if (isCancelled) return;
        console.log('Balance API response:', res);
        const stx = res?.stx?.balance || '0';
        console.log('Setting balance to:', stx);
        setBalance(stx);
      })
      .catch(err => {
        if (isCancelled) return;
        console.error('Balance fetch error:', err);
        setError(err?.message || 'Failed to fetch balance');
        // Set a fallback balance for demo purposes
        setBalance('1000000'); // 1 STX in microSTX
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [address]);

  return { balance, loading, error };
}

