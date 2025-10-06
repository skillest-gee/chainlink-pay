import React from 'react';
import { Box, Button, Container, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export default function WalletGuard({ 
  children, 
  fallback,
  title = "Wallet Required",
  description = "Connect your Stacks wallet to access this feature"
}: WalletGuardProps) {
  const { isAuthenticated, connect } = useStacksWallet();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Container maxW="4xl" py={10}>
      <VStack gap={8} align="stretch">
        <VStack gap={4} textAlign="center">
          <Heading size="2xl" color="blue.600" fontWeight="bold">
            🔗 {title}
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="600px">
            {description}
          </Text>
        </VStack>
        
        <Box bg="white" p={8} borderRadius="xl" borderWidth="2px" borderColor="blue.200" shadow="lg" textAlign="center">
          <VStack gap={6}>
            <Text fontSize="2xl">🔗</Text>
            <Heading size="lg" color="blue.600">Connect Your Wallet</Heading>
            <Text color="gray.600" maxW="500px">
              You need to connect your Stacks wallet to access this feature. 
              Supported wallets: Hiro, Xverse, Leather
            </Text>
            <HStack gap={4}>
              <Button 
                colorScheme="blue" 
                size="lg" 
                onClick={connect}
                fontWeight="semibold"
                px={8}
              >
                Connect Wallet
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.href = '/'}
                fontWeight="semibold"
                px={8}
              >
                Go to Home
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
