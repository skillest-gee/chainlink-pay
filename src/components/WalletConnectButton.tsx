import React, { useState } from 'react';
import { HStack, Text, Spinner, Box, Badge, VStack, Button } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import { UniformButton } from './UniformButton';
import { MobileWalletConnection } from './MobileWalletConnection';

export function WalletConnectButton() {
  const { address, isAuthenticated, isConnecting, error, connect, disconnect, walletProvider } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress } = useBitcoinWallet();
  const { balance, loading: balanceLoading, error: balanceError, refreshBalance } = useStxBalance(address);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Handle connection errors
  React.useEffect(() => {
    if (error) {
      setConnectionError(error);
      // Clear error after 5 seconds
      setTimeout(() => setConnectionError(null), 5000);
    }
  }, [error]);

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
          {connectionError && (
            <Text fontSize="xs" color="#ef4444" textAlign="center" maxW="200px">
              {connectionError}
            </Text>
          )}
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
      loading: balanceLoading,
      provider: walletProvider
    } : {
      type: 'Bitcoin',
      address: btcAddress,
      balance: null,
      loading: false,
      provider: 'unknown'
    };

    return (
      <HStack gap={3} align="center">
        {/* Wallet Info */}
        <HStack gap={2} align="center">
          <Badge 
            colorScheme={
              connectedWallet.provider === 'xverse' ? 'green' : 
              connectedWallet.provider === 'leather' ? 'blue' : 
              connectedWallet.type === 'Stacks' ? 'blue' : 'orange'
            } 
            fontSize="xs"
            variant="subtle"
          >
            {connectedWallet.type === 'Stacks' ? 
              (connectedWallet.provider === 'xverse' ? '🔗 Xverse' : 
               connectedWallet.provider === 'leather' ? '🔗 Leather' : 'STX') : 
              'BTC'}
          </Badge>
          <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
            {connectedWallet.address?.slice(0, 6)}...{connectedWallet.address?.slice(-4)}
          </Text>
          {connectedWallet.type === 'Stacks' && (
            <HStack gap={1} align="center">
              <Text fontSize="xs" color="#10b981" fontWeight="medium">
                {formatBalance(connectedWallet.balance)} STX
              </Text>
              {balanceError && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="#ef4444"
                  onClick={refreshBalance}
                  title="Refresh balance"
                >
                  🔄
                </Button>
              )}
            </HStack>
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
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.95)"
          zIndex="999999"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMobileGuide(false);
            }
          }}
        >
          <MobileWalletConnection onClose={() => setShowMobileGuide(false)} />
        </Box>
      )}
    </Box>
  );
}

export default WalletConnectButton;