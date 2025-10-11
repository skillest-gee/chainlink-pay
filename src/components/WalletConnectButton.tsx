import React, { useState } from 'react';
import { HStack, Text, Spinner, Box, Badge, VStack } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import { UniformButton } from './UniformButton';
import MobileWalletGuide from './MobileWalletGuide';

export function WalletConnectButton() {
  const { address, isAuthenticated, isConnecting, error, connect, disconnect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress } = useBitcoinWallet();
  const { balance, loading: balanceLoading } = useStxBalance(address);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const formatBalance = (balance: number | string | null) => {
    if (balance === null) return '0.00';
    
    // Convert microSTX to STX if it's a string
    let stxBalance: number;
    if (typeof balance === 'string') {
      stxBalance = parseInt(balance) / 1000000; // Convert microSTX to STX
    } else {
      stxBalance = balance;
    }
    
    return stxBalance.toFixed(6);
  };

  const content = () => {
    if (isConnecting) {
      return (
        <UniformButton
          variant="secondary"
          size="md"
          disabled
          title="Connecting to your Stacks wallet..."
        >
          <Spinner size="sm" mr={2} />
          Connecting...
        </UniformButton>
      );
    }
    
    if (!isAuthenticated && !btcConnected) {
      return (
        <VStack gap={2}>
          <UniformButton
            variant="primary"
            onClick={connect}
            size="md"
            title="Connect your Stacks wallet to start making payments"
          >
            🔗 Connect Wallet
          </UniformButton>
          {isMobile && (
            <UniformButton
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileGuide(true)}
            >
              📱 Mobile Help
            </UniformButton>
          )}
        </VStack>
      );
    }

    // Show connected wallet info
    const connectedWallet = isAuthenticated ? {
      type: 'Stacks',
      address: address,
      balance: balance,
      loading: balanceLoading
    } : {
      type: 'Bitcoin',
      address: btcAddress,
      balance: null,
      loading: false
    };

    return (
      <HStack gap={3} align="center">
        {/* Wallet Info */}
        <HStack gap={2} align="center">
          <Badge 
            colorScheme={connectedWallet.type === 'Stacks' ? 'blue' : 'orange'} 
            fontSize="xs"
            variant="subtle"
          >
            {connectedWallet.type === 'Stacks' ? 'STX' : 'BTC'}
          </Badge>
          <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
            {connectedWallet.address?.slice(0, 6)}...{connectedWallet.address?.slice(-4)}
          </Text>
          {connectedWallet.type === 'Stacks' && (
            <Text fontSize="xs" color="#10b981" fontWeight="medium">
              {formatBalance(connectedWallet.balance)} STX
            </Text>
          )}
        </HStack>

        {/* Get Tokens Button for Testnet */}
        {connectedWallet.type === 'Stacks' && process.env.REACT_APP_STACKS_NETWORK === 'testnet' && (
          <UniformButton
            variant="secondary"
            size="sm"
            onClick={() => window.open('https://explorer.stacks.co/sandbox/faucet?chain=testnet', '_blank')}
            title="Get testnet STX tokens"
          >
            Get Tokens
          </UniformButton>
        )}

        {/* Disconnect Button */}
        <UniformButton
          variant="ghost"
          size="sm"
          onClick={disconnect}
          title="Disconnect wallet"
        >
          Disconnect
        </UniformButton>
      </HStack>
    );
  };

  return (
    <Box>
      {content()}
      {showMobileGuide && (
        <MobileWalletGuide onClose={() => setShowMobileGuide(false)} />
      )}
    </Box>
  );
}

export default WalletConnectButton;