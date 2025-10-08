/**
 * Mobile Wallet Connection Guide
 * Helps users connect their wallets on mobile devices
 */

import React from 'react';
import { Box, VStack, HStack, Text, Button, Link, Badge, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription } from '@chakra-ui/react';

interface MobileWalletGuideProps {
  onClose: () => void;
}

export default function MobileWalletGuide({ onClose }: MobileWalletGuideProps) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.8)"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="rgba(17, 17, 17, 0.95)"
        borderRadius="2xl"
        p={6}
        maxW="md"
        w="full"
        border="1px solid"
        borderColor="rgba(0, 212, 255, 0.3)"
        backdropFilter="blur(20px)"
      >
        <VStack gap={4} align="stretch">
          <Text fontSize="xl" fontWeight="bold" color="#00d4ff" textAlign="center">
            📱 Mobile Wallet Setup
          </Text>
          
          <AlertRoot status="info">
            <AlertIndicator />
            <AlertContent>
              <AlertTitle>Connect Your Mobile Wallet</AlertTitle>
              <AlertDescription>
                To use ChainLinkPay on mobile, you need to install a compatible wallet app.
              </AlertDescription>
            </AlertContent>
          </AlertRoot>

          <VStack gap={3} align="stretch">
            <Text fontWeight="semibold" color="#ffffff">
              🔗 Stacks Wallets:
            </Text>
            
            <HStack justify="space-between" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
              <VStack align="start" gap={1}>
                <Text fontWeight="semibold">Xverse</Text>
                <Text fontSize="sm" color="#737373">Best for mobile</Text>
              </VStack>
              <Badge colorScheme="green">Recommended</Badge>
            </HStack>

            <HStack justify="space-between" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
              <VStack align="start" gap={1}>
                <Text fontWeight="semibold">Hiro Wallet</Text>
                <Text fontSize="sm" color="#737373">Official wallet</Text>
              </VStack>
              <Badge colorScheme="blue">Popular</Badge>
            </HStack>

            <HStack justify="space-between" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
              <VStack align="start" gap={1}>
                <Text fontWeight="semibold">Leather</Text>
                <Text fontSize="sm" color="#737373">Lightweight</Text>
              </VStack>
              <Badge colorScheme="purple">New</Badge>
            </HStack>

            <Text fontWeight="semibold" color="#ffffff" mt={4}>
              ₿ Bitcoin Wallets:
            </Text>
            
            <HStack justify="space-between" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
              <VStack align="start" gap={1}>
                <Text fontWeight="semibold">Unisat</Text>
                <Text fontSize="sm" color="#737373">Bitcoin Ordinals</Text>
              </VStack>
              <Badge colorScheme="orange">Bitcoin</Badge>
            </HStack>

            <HStack justify="space-between" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
              <VStack align="start" gap={1}>
                <Text fontWeight="semibold">OKX Wallet</Text>
                <Text fontSize="sm" color="#737373">Multi-chain</Text>
              </VStack>
              <Badge colorScheme="cyan">Multi-chain</Badge>
            </HStack>
          </VStack>

          <VStack gap={2} align="stretch">
            <Text fontSize="sm" color="#737373" textAlign="center">
              💡 After installing a wallet, refresh this page and try connecting again.
            </Text>
            
            <Button
              onClick={() => window.location.reload()}
              colorScheme="blue"
              size="sm"
            >
              🔄 Refresh Page
            </Button>
          </VStack>

          <HStack gap={2} justify="center">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              color="#737373"
              borderColor="rgba(255, 255, 255, 0.2)"
            >
              Close
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
