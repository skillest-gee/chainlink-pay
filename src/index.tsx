import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      bg: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    '*': {
      transition: 'all 0.2s ease-in-out',
    },
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: '#111111',
    },
    '::-webkit-scrollbar-thumb': {
      bg: '#00d4ff',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: '#0099cc',
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

