import React, { createContext, useContext, useState } from 'react';

type DemoPreset = 'escrow' | 'split' | 'subscription' | 'simple-payment';

type DemoState = {
  enabled: boolean;
  preset: DemoPreset | null;
  enable: (preset?: DemoPreset) => void;
  disable: () => void;
};

const DemoContext = createContext<DemoState | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPreset] = useState<DemoPreset | null>(null);
  const enable = (p?: DemoPreset) => { setEnabled(true); if (p) setPreset(p); };
  const disable = () => { setEnabled(false); setPreset(null); };
  return <DemoContext.Provider value={{ enabled, preset, enable, disable }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}

