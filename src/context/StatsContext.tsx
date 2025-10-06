import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

type Stats = {
  totalVolumeStx: number;
  aiContractsGenerated: number;
  crossChainTransfers: number;
  yieldEarnedStx: number;
  incrementAI: () => void;
  addVolume: (stx: number) => void;
  addCrossChain: () => void;
  addYield: (stx: number) => void;
  reset: () => void;
  isLoading: boolean;
  error: string | null;
};

const Ctx = createContext<Stats | undefined>(undefined);

const STORAGE_KEY = 'chainlinkpay_stats';

// Load stats from localStorage
const loadStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        totalVolumeStx: parsed.totalVolumeStx || 0,
        aiContractsGenerated: parsed.aiContractsGenerated || 0,
        crossChainTransfers: parsed.crossChainTransfers || 0,
        yieldEarnedStx: parsed.yieldEarnedStx || 0,
      };
    }
  } catch (error) {
    console.error('Failed to load stats from localStorage:', error);
  }
  return {
    totalVolumeStx: 0,
    aiContractsGenerated: 0,
    crossChainTransfers: 0,
    yieldEarnedStx: 0,
  };
};

// Save stats to localStorage
const saveStats = (stats: Omit<Stats, 'incrementAI' | 'addVolume' | 'addCrossChain' | 'addYield' | 'reset' | 'isLoading' | 'error'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats to localStorage:', error);
  }
};

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVolumeStx, setTotalVolume] = useState(0);
  const [aiContractsGenerated, setAI] = useState(0);
  const [crossChainTransfers, setCross] = useState(0);
  const [yieldEarnedStx, setYield] = useState(0);

  // Load stats on mount
  useEffect(() => {
    try {
      const loadedStats = loadStats();
      setTotalVolume(loadedStats.totalVolumeStx);
      setAI(loadedStats.aiContractsGenerated);
      setCross(loadedStats.crossChainTransfers);
      setYield(loadedStats.yieldEarnedStx);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics. Using defaults.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveStats({
        totalVolumeStx,
        aiContractsGenerated,
        crossChainTransfers,
        yieldEarnedStx,
      });
    }
  }, [totalVolumeStx, aiContractsGenerated, crossChainTransfers, yieldEarnedStx, isLoading]);

  const value = useMemo<Stats>(() => ({
    totalVolumeStx,
    aiContractsGenerated,
    crossChainTransfers,
    yieldEarnedStx,
    isLoading,
    error,
    incrementAI: () => {
      try {
        setAI(v => v + 1);
        setError(null);
      } catch (err: any) {
        console.error('Failed to increment AI counter:', err);
        setError('Failed to update AI counter');
      }
    },
    addVolume: (stx: number) => {
      try {
        if (stx < 0) {
          throw new Error('Volume cannot be negative');
        }
        setTotalVolume(v => v + stx);
        setError(null);
      } catch (err: any) {
        console.error('Failed to add volume:', err);
        setError(err.message || 'Failed to update volume');
      }
    },
    addCrossChain: () => {
      try {
        setCross(v => v + 1);
        setError(null);
      } catch (err: any) {
        console.error('Failed to increment cross-chain counter:', err);
        setError('Failed to update cross-chain counter');
      }
    },
    addYield: (stx: number) => {
      try {
        if (stx < 0) {
          throw new Error('Yield cannot be negative');
        }
        setYield(v => v + stx);
        setError(null);
      } catch (err: any) {
        console.error('Failed to add yield:', err);
        setError(err.message || 'Failed to update yield');
      }
    },
    reset: () => {
      try {
        setTotalVolume(0);
        setAI(0);
        setCross(0);
        setYield(0);
        setError(null);
        localStorage.removeItem(STORAGE_KEY);
      } catch (err: any) {
        console.error('Failed to reset stats:', err);
        setError('Failed to reset statistics');
      }
    },
  }), [totalVolumeStx, aiContractsGenerated, crossChainTransfers, yieldEarnedStx, isLoading, error]);

  // Expose for demo counters and debugging
  (window as any).__stats = value;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStats() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}

