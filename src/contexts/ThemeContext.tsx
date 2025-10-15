import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('chainlink-pay-theme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemeMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'system';
    }
    
    return 'dark'; // Default to dark mode for this app
  });

  const [isDark, setIsDark] = useState(() => {
    if (mode === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return mode === 'dark';
  });

  // Update theme when mode changes
  useEffect(() => {
    localStorage.setItem('chainlink-pay-theme', mode);
    
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      
      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDark(mode === 'dark');
    }
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Set CSS custom properties for theme colors
    const theme = isDark ? {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0f172a',
      '--bg-tertiary': '#1e293b',
      '--bg-card': 'rgba(255, 255, 255, 0.05)',
      '--bg-modal': 'rgba(0, 0, 0, 0.95)',
      '--bg-overlay': 'rgba(0, 0, 0, 0.8)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#e2e8f0',
      '--text-tertiary': '#9ca3af',
      '--text-inverse': '#000000',
      '--text-accent': '#3b82f6',
      '--border-primary': 'rgba(255, 255, 255, 0.1)',
      '--border-secondary': 'rgba(255, 255, 255, 0.2)',
      '--border-accent': '#3b82f6',
      '--border-error': '#ef4444',
      '--border-success': '#10b981',
      '--surface-primary': 'rgba(255, 255, 255, 0.05)',
      '--surface-secondary': 'rgba(255, 255, 255, 0.1)',
      '--surface-tertiary': 'rgba(255, 255, 255, 0.15)',
      '--surface-elevated': 'rgba(255, 255, 255, 0.1)',
    } : {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--bg-tertiary': '#f1f5f9',
      '--bg-card': '#ffffff',
      '--bg-modal': 'rgba(255, 255, 255, 0.95)',
      '--bg-overlay': 'rgba(0, 0, 0, 0.8)',
      '--text-primary': '#1a202c',
      '--text-secondary': '#4a5568',
      '--text-tertiary': '#718096',
      '--text-inverse': '#ffffff',
      '--text-accent': '#3b82f6',
      '--border-primary': '#e2e8f0',
      '--border-secondary': '#cbd5e1',
      '--border-accent': '#3b82f6',
      '--border-error': '#e53e3e',
      '--border-success': '#38a169',
      '--surface-primary': '#ffffff',
      '--surface-secondary': '#f7fafc',
      '--surface-tertiary': '#edf2f7',
      '--surface-elevated': '#ffffff',
    };

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [isDark]);

  const toggleTheme = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  const value: ThemeContextType = {
    mode,
    setMode,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
