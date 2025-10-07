/**
 * Component Tests
 * Comprehensive testing for React components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock components and hooks
jest.mock('../hooks/useStacksWallet', () => ({
  useStacksWallet: () => ({
    isAuthenticated: true,
    address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    connect: jest.fn(),
    disconnect: jest.fn()
  })
}));

jest.mock('../hooks/useBitcoinWallet', () => ({
  useBitcoinWallet: () => ({
    isConnected: true,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    balance: '0.001',
    connect: jest.fn(),
    disconnect: jest.fn()
  })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ChakraProvider>
);

describe('PaymentLinkGenerator', () => {
  it('should render payment form correctly', () => {
    const PaymentLinkGenerator = require('../components/PaymentLinkGenerator').default;
    
    render(
      <TestWrapper>
        <PaymentLinkGenerator />
      </TestWrapper>
    );

    expect(screen.getByText('Generate Payment Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    expect(screen.getByText('🔗 Generate Link')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const PaymentLinkGenerator = require('../components/PaymentLinkGenerator').default;
    
    render(
      <TestWrapper>
        <PaymentLinkGenerator />
      </TestWrapper>
    );

    const generateButton = screen.getByText('🔗 Generate Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  it('should generate payment link with valid input', async () => {
    const PaymentLinkGenerator = require('../components/PaymentLinkGenerator').default;
    
    render(
      <TestWrapper>
        <PaymentLinkGenerator />
      </TestWrapper>
    );

    const amountInput = screen.getByPlaceholderText('Enter amount');
    const descriptionInput = screen.getByPlaceholderText('Enter description');
    const generateButton = screen.getByText('🔗 Generate Link');

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test payment' } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Payment link generated successfully!')).toBeInTheDocument();
    });
  });
});

describe('TutorialModal', () => {
  it('should open and close tutorial modal', () => {
    const TutorialModal = require('../components/TutorialModal').default;
    
    render(
      <TestWrapper>
        <TutorialModal />
      </TestWrapper>
    );

    const tutorialButton = screen.getByText('📚 Tutorial');
    fireEvent.click(tutorialButton);

    expect(screen.getByText('ChainLinkPay Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Learn how to use ChainLinkPay in 4 simple steps')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close tutorial');
    fireEvent.click(closeButton);

    expect(screen.queryByText('ChainLinkPay Tutorial')).not.toBeInTheDocument();
  });

  it('should display all tutorial steps', () => {
    const TutorialModal = require('../components/TutorialModal').default;
    
    render(
      <TestWrapper>
        <TutorialModal />
      </TestWrapper>
    );

    const tutorialButton = screen.getByText('📚 Tutorial');
    fireEvent.click(tutorialButton);

    expect(screen.getByText('💳 Connect Your Wallet')).toBeInTheDocument();
    expect(screen.getByText('🔗 Create Payment Links')).toBeInTheDocument();
    expect(screen.getByText('🤖 AI Contract Builder')).toBeInTheDocument();
    expect(screen.getByText('🌉 Cross-Chain Bridge')).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('should display payment statistics', () => {
    const Dashboard = require('../pages/Dashboard').default;
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Links')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('should show empty state when no payments', () => {
    const Dashboard = require('../pages/Dashboard').default;
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('No payment links yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first payment link to get started')).toBeInTheDocument();
  });
});

describe('AIContractBuilder', () => {
  it('should render AI contract builder form', () => {
    const AIContractBuilder = require('../pages/AIContractBuilder').default;
    
    render(
      <TestWrapper>
        <AIContractBuilder />
      </TestWrapper>
    );

    expect(screen.getByText('AI Contract Builder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe your smart contract...')).toBeInTheDocument();
    expect(screen.getByText('🤖 Generate Contract')).toBeInTheDocument();
  });

  it('should validate contract description', async () => {
    const AIContractBuilder = require('../pages/AIContractBuilder').default;
    
    render(
      <TestWrapper>
        <AIContractBuilder />
      </TestWrapper>
    );

    const generateButton = screen.getByText('🤖 Generate Contract');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a contract description')).toBeInTheDocument();
    });
  });
});

describe('Bridge', () => {
  it('should render bridge interface', () => {
    const Bridge = require('../pages/Bridge').default;
    
    render(
      <TestWrapper>
        <Bridge />
      </TestWrapper>
    );

    expect(screen.getByText('Cross-Chain Bridge')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('🌉 Start Bridge')).toBeInTheDocument();
  });

  it('should validate bridge amount', async () => {
    const Bridge = require('../pages/Bridge').default;
    
    render(
      <TestWrapper>
        <Bridge />
      </TestWrapper>
    );

    const bridgeButton = screen.getByText('🌉 Start Bridge');
    fireEvent.click(bridgeButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });
  });
});

describe('Error Handling', () => {
  it('should display error messages correctly', () => {
    const ErrorHandler = require('../components/ErrorHandler').ErrorHandler;
    
    const error = {
      type: 'network' as const,
      message: 'Network connection failed',
      details: 'Unable to connect to the blockchain',
      recoverable: true
    };

    const onDismiss = jest.fn();
    const onRetry = jest.fn();

    render(
      <TestWrapper>
        <ErrorHandler 
          error={error} 
          onDismiss={onDismiss} 
          onRetry={onRetry} 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('🔄 Try Again')).toBeInTheDocument();
  });

  it('should handle retry functionality', () => {
    const ErrorHandler = require('../components/ErrorHandler').ErrorHandler;
    
    const error = {
      type: 'network' as const,
      message: 'Network connection failed',
      recoverable: true
    };

    const onDismiss = jest.fn();
    const onRetry = jest.fn();

    render(
      <TestWrapper>
        <ErrorHandler 
          error={error} 
          onDismiss={onDismiss} 
          onRetry={onRetry} 
        />
      </TestWrapper>
    );

    const retryButton = screen.getByText('🔄 Try Again');
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    const PaymentLinkGenerator = require('../components/PaymentLinkGenerator').default;
    
    render(
      <TestWrapper>
        <PaymentLinkGenerator />
      </TestWrapper>
    );

    const amountInput = screen.getByPlaceholderText('Enter amount');
    expect(amountInput).toHaveAttribute('aria-label');
  });

  it('should support keyboard navigation', () => {
    const TutorialModal = require('../components/TutorialModal').default;
    
    render(
      <TestWrapper>
        <TutorialModal />
      </TestWrapper>
    );

    const tutorialButton = screen.getByText('📚 Tutorial');
    tutorialButton.focus();
    
    fireEvent.keyDown(tutorialButton, { key: 'Enter' });
    expect(screen.getByText('ChainLinkPay Tutorial')).toBeInTheDocument();
  });
});
