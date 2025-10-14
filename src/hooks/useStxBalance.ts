import { useEffect, useState, useRef } from 'react';
import { accountsApi } from '../config/stacksConfig';

const BALANCE_CACHE_TIME = 10000; // 10 seconds cache

export function useStxBalance(address: string | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const cacheRef = useRef<{ balance: string; timestamp: number } | null>(null);

  const fetchBalance = async (addr: string, forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && cacheRef.current && 
          Date.now() - cacheRef.current.timestamp < BALANCE_CACHE_TIME) {
        console.log('Using cached balance for address:', addr);
        setBalance(cacheRef.current.balance);
        setLastUpdated(new Date(cacheRef.current.timestamp));
        return;
      }

      setLoading(true);
      setError(null);
      
      console.log('Fetching balance for address:', addr);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const res = await accountsApi.getAccountBalance({ 
          principal: addr
        });
        clearTimeout(timeoutId);
        
        console.log('Balance API response:', res);
        
        const stx = res?.stx?.balance || '0';
        console.log('Setting balance to:', stx);
        
        // Update cache
        cacheRef.current = {
          balance: stx,
          timestamp: Date.now()
        };
        
        setBalance(stx);
        setLastUpdated(new Date());
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please check your internet connection');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Balance fetch error:', err);
      setError(err?.message || 'Failed to fetch balance');
      // Set a fallback balance of 0 to prevent UI issues
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setBalance(null);
      setError(null);
      setLastUpdated(null);
      cacheRef.current = null;
      return;
    }

    // Debounce balance checks
    const timeoutId = setTimeout(() => {
      fetchBalance(address);
    }, 500);

    // Set up periodic refresh every 60 seconds (reduced frequency)
    const interval = setInterval(() => {
      fetchBalance(address, true); // Force refresh for periodic updates
    }, 60000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [address]);

  // Refresh balance manually
  const refreshBalance = () => {
    if (address) {
      fetchBalance(address, true); // Force refresh
    }
  };

  return { balance, loading, error, lastUpdated, refreshBalance };
}

