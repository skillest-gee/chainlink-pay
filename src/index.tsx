import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig, {
  globalCss: {
    ':root': {
      // Light theme variables
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
    },
    '.dark': {
      // Dark theme variables
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
    },
    body: {
      bg: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    '*': {
      transition: 'all 0.2s ease-in-out',
    },
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'var(--bg-secondary)',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'var(--text-accent)',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'var(--text-accent)',
      opacity: 0.8,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);

