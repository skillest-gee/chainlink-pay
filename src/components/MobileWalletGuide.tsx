import React from 'react';
import { Box, VStack, HStack, Text, IconButton, Heading, Badge } from '@chakra-ui/react';
import { UniformButton } from './UniformButton';
import { UniformCard } from './UniformCard';

interface MobileWalletGuideProps {
  onClose: () => void;
}

export default function MobileWalletGuide({ onClose }: MobileWalletGuideProps) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) {
    return null;
  }

  const wallets = [
    {
      name: 'Xverse',
      type: 'Stacks & Bitcoin',
      icon: '🟦',
      description: 'Multi-chain wallet for Stacks and Bitcoin',
      link: 'https://www.xverse.app/'
    },
    {
      name: 'Leather',
      type: 'Stacks',
      icon: '🟫',
      description: 'Stacks-native wallet with Bitcoin support',
      link: 'https://leather.io/'
    },
    {
      name: 'Unisat',
      type: 'Bitcoin',
      icon: '🟠',
      description: 'Bitcoin wallet with Ordinals support',
      link: 'https://unisat.io/'
    },
    {
      name: 'OKX',
      type: 'Multi-chain',
      icon: '🔵',
      description: 'Multi-chain wallet supporting Bitcoin and Stacks',
      link: 'https://www.okx.com/web3'
    }
  ];

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.9)"
      backdropFilter="blur(10px)"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <UniformCard
        maxW={{ base: "95%", md: "500px" }}
        w="full"
        p={0}
        overflow="hidden"
      >
        <VStack gap={0} align="stretch">
          {/* Header */}
          <Box p={6} borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
            <HStack justify="space-between" align="center">
              <VStack align="start" gap={1}>
                <Heading size="md" color="#ffffff">
                  📱 Mobile Wallet Guide
                </Heading>
                <Text fontSize="sm" color="#9ca3af">
                  Connect your wallet on mobile devices
                </Text>
              </VStack>
              
              <IconButton
                aria-label="Close guide"
                children={<Text fontSize="lg">✕</Text>}
                size="sm"
                variant="ghost"
                color="#9ca3af"
                _hover={{ color: "#ffffff", bg: "rgba(255, 255, 255, 0.1)" }}
                onClick={onClose}
              />
            </HStack>
          </Box>

          {/* Content */}
          <Box p={6}>
            <VStack gap={6} align="stretch">
              <Text fontSize="md" color="#ffffff" textAlign="center">
                Install one of these mobile wallets to connect and start using ChainLinkPay:
              </Text>

              {/* Wallet List */}
              <VStack gap={4} align="stretch">
                {wallets.map((wallet, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg="rgba(255, 255, 255, 0.05)"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                  >
                    <HStack gap={4} align="start">
                      <Text fontSize="2xl">{wallet.icon}</Text>
                      
                      <VStack align="start" gap={2} flex="1">
                        <HStack gap={2} align="center">
                          <Text fontSize="md" fontWeight="medium" color="#ffffff">
                            {wallet.name}
                          </Text>
                          <Badge 
                            colorScheme={wallet.type.includes('Bitcoin') ? 'orange' : 'blue'} 
                            fontSize="xs"
                          >
                            {wallet.type}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="#9ca3af">
                          {wallet.description}
                        </Text>
                        
                        <UniformButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(wallet.link, '_blank')}
                        >
                          Install Wallet
                        </UniformButton>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>

              {/* Instructions */}
              <Box p={4} bg="rgba(59, 130, 246, 0.1)" borderRadius="lg" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#3b82f6">
                    How to Connect:
                  </Text>
                  
                  <VStack gap={2} align="stretch">
                    <HStack gap={3} align="start">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="bold">1.</Text>
                      <Text fontSize="sm" color="#ffffff">
                        Install your preferred wallet from the links above
                      </Text>
                    </HStack>
                    
                    <HStack gap={3} align="start">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="bold">2.</Text>
                      <Text fontSize="sm" color="#ffffff">
                        Create or import your wallet in the mobile app
                      </Text>
                    </HStack>
                    
                    <HStack gap={3} align="start">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="bold">3.</Text>
                      <Text fontSize="sm" color="#ffffff">
                        Return to ChainLinkPay and click "Connect Wallet"
                      </Text>
                    </HStack>
                    
                    <HStack gap={3} align="start">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="bold">4.</Text>
                      <Text fontSize="sm" color="#ffffff">
                        Select your wallet and approve the connection
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </Box>

          {/* Footer */}
          <Box p={6} borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
            <UniformButton
              variant="primary"
              onClick={onClose}
              w="full"
            >
              Got it, let's connect!
            </UniformButton>
          </Box>
        </VStack>
      </UniformCard>
    </Box>
  );
}