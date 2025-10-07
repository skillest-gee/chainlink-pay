import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { DemoProvider } from './context/DemoContext';
import { StatsProvider } from './context/StatsContext';
import './mobile-fixes.css';

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        bg: {
          primary: { value: '#0a0a0a' },
          secondary: { value: '#111111' },
          tertiary: { value: '#1a1a1a' },
          card: { value: '#1e1e1e' },
          hover: { value: '#2a2a2a' }
        },
        text: {
          primary: { value: '#ffffff' },
          secondary: { value: '#a0a0a0' },
          tertiary: { value: '#666666' },
          accent: { value: '#00d4ff' }
        },
        brand: {
          primary: { value: '#00d4ff' },
          secondary: { value: '#0099cc' },
          accent: { value: '#ff6b35' },
          success: { value: '#00ff88' },
          warning: { value: '#ffaa00' },
          error: { value: '#ff4444' }
        }
      }
    }
  },
  globalCss: {
    body: {
      bg: 'bg.primary',
      color: 'text.primary',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    '*': {
      transition: 'all 0.2s ease-in-out',
    },
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'bg.secondary',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'brand.primary',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'brand.secondary',
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
        <DemoProvider>
          <StatsProvider>
            <App />
          </StatsProvider>
        </DemoProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);

