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
  },
  globalCss: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
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

