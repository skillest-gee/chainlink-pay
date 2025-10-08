import React, { useState } from 'react';
import { Button, HStack, Text, Spinner, Box, Badge, VStack } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import MobileWalletGuide from './MobileWalletGuide';

export function WalletConnectButton() {
  const { address, isAuthenticated, isConnecting, error, connect, disconnect } = useStacksWallet();
  const { balance, loading: balanceLoading, error: balanceError } = useStxBalance(address);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const content = () => {
    if (isConnecting) {
      return (
        <Button size="md" disabled colorScheme="blue" title="Connecting to your Stacks wallet...">
          <Spinner size="xs" mr={2} />
          Connecting...
        </Button>
      );
    }
    if (!isAuthenticated || !address) {
      return (
        <VStack gap={2}>
          <Button 
            colorScheme="blue" 
            onClick={connect} 
            size="md" 
            title="Connect your Stacks wallet to start making payments"
          >
            🔗 Connect Wallet
          </Button>
          {isMobile && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowMobileGuide(true)}
              color="#737373"
              borderColor="rgba(255, 255, 255, 0.2)"
            >
              📱 Mobile Wallet Help
            </Button>
          )}
        </VStack>
      );
    }
        return (
          <HStack gap={4} align="center">
            {/* Wallet Info */}
            <VStack gap={1} align="end">
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Wallet:</Text>
                <Text fontSize="sm" color="blue.600" fontFamily="mono" fontWeight="bold">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Text>
              </HStack>
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="gray.500" fontWeight="medium">Balance:</Text>
                <Text fontSize="sm" color="green.600" fontWeight="bold">
                  {balanceLoading ? '...' : balanceError ? 'N/A' : `${(Number(balance || '0') / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} STX`}
                </Text>
                {Number(balance || '0') === 0 && (
                  <Text 
                    fontSize="xs" 
                    color="orange.500" 
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ color: "orange.600", textDecoration: "underline" }}
                    onClick={() => window.open('https://explorer.hiro.so/sandbox/faucet?chain=testnet', '_blank')}
                    title="Click to get testnet tokens"
                  >
                    (Get tokens)
                  </Text>
                )}
              </HStack>
            </VStack>

            {/* Disconnect Button */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={disconnect}
              colorScheme="red"
              fontWeight="semibold"
              borderWidth="1px"
              _hover={{ bg: "red.50" }}
            >
              Disconnect
            </Button>
          </HStack>
        );
  };

  return (
    <Box>
      {error && (
        <Badge colorScheme="red" mb={2} fontSize="xs">
          {error}
        </Badge>
      )}
      {content()}
      {showMobileGuide && (
        <MobileWalletGuide onClose={() => setShowMobileGuide(false)} />
      )}
    </Box>
  );
}

export default WalletConnectButton;

