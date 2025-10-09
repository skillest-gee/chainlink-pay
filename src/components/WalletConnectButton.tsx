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

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0.00';
    return balance.toFixed(6);
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
          <Spinner size="xs" mr={2} />
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
              size="xs"
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
      <VStack gap={2} align="end">
        <HStack gap={3} align="center">
          {/* Wallet Info */}
          <VStack align="end" gap={1}>
            <HStack gap={2} align="center">
              <Badge 
                colorScheme={connectedWallet.type === 'Stacks' ? 'blue' : 'orange'} 
                fontSize="xs"
              >
                {connectedWallet.type}
              </Badge>
              <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                {connectedWallet.address?.slice(0, 6)}...{connectedWallet.address?.slice(-4)}
              </Text>
            </HStack>
            {connectedWallet.type === 'Stacks' && (
              <Text fontSize="xs" color="#10b981" fontWeight="medium">
                {formatBalance(connectedWallet.balance)} STX
              </Text>
            )}
          </VStack>

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
      </VStack>
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