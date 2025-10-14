import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Badge, Image } from '@chakra-ui/react';
import { UniformCard } from './UniformCard';
import { UniformButton } from './UniformButton';

interface MobileWalletConnectionProps {
  onClose: () => void;
}

export const MobileWalletConnection: React.FC<MobileWalletConnectionProps> = ({ onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const wallets = [
    {
      id: 'xverse',
      name: 'Xverse Wallet',
      description: 'Bitcoin & Stacks wallet for mobile',
      icon: '🟦',
      downloadUrl: {
        ios: 'https://apps.apple.com/app/xverse-bitcoin-wallet/id1552060055',
        android: 'https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse'
      },
      deepLink: 'xverse://',
      color: '#3b82f6'
    },
    {
      id: 'leather',
      name: 'Leather Wallet',
      description: 'Stacks wallet for mobile',
      icon: '🟫',
      downloadUrl: {
        ios: 'https://apps.apple.com/app/leather-stacks-wallet/id1643605783',
        android: 'https://play.google.com/store/apps/details?id=com.leatherwallet.app'
      },
      deepLink: 'leather://',
      color: '#8b4513'
    },
    {
      id: 'unisat',
      name: 'Unisat Wallet',
      description: 'Bitcoin wallet for mobile',
      icon: '🟠',
      downloadUrl: {
        ios: 'https://apps.apple.com/app/unisat-wallet/id1635447349',
        android: 'https://play.google.com/store/apps/details?id=io.unisat.app'
      },
      deepLink: 'unisat://',
      color: '#ff6b35'
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      description: 'Multi-chain wallet for mobile',
      icon: '🔵',
      downloadUrl: {
        ios: 'https://apps.apple.com/app/okx-buy-bitcoin-eth-crypto/id1327268470',
        android: 'https://play.google.com/store/apps/details?id=com.okinc.okex.gp'
      },
      deepLink: 'okx://',
      color: '#0066ff'
    }
  ];

  const handleWalletSelect = async (wallet: typeof wallets[0]) => {
    setSelectedWallet(wallet.id);
    
    try {
      // Import the mobile wallet connection utility
      const { openWalletApp, detectWalletApps } = await import('../utils/mobileWalletConnection');
      
      const { isMobile, isIOS, isAndroid } = detectWalletApps();
      
      if (isMobile) {
        // Use the new mobile wallet connection
        const walletType = wallet.id === 'xverse' ? 'xverse' : 'leather';
        const appOpened = await openWalletApp(walletType);
        
        if (appOpened) {
          console.log('Wallet app opened successfully');
          // Close the modal and let the wallet connection handle the rest
          onClose();
        } else {
          console.log('Wallet app not available, redirecting to app store');
          const storeUrl = isIOS ? wallet.downloadUrl.ios : wallet.downloadUrl.android;
          window.open(storeUrl, '_blank');
        }
      } else {
        // Desktop - show download options
        const downloadUrl = isIOS ? wallet.downloadUrl.ios : wallet.downloadUrl.android;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error handling wallet selection:', error);
      // Fallback to original behavior
      const deepLink = wallet.deepLink;
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      if (isIOS || isAndroid) {
        window.location.href = deepLink;
        setTimeout(() => {
          const storeUrl = isIOS ? wallet.downloadUrl.ios : wallet.downloadUrl.android;
          window.open(storeUrl, '_blank');
        }, 2000);
      } else {
        const downloadUrl = isIOS ? wallet.downloadUrl.ios : wallet.downloadUrl.android;
        window.open(downloadUrl, '_blank');
      }
    }
  };

  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'desktop';
  };

  const device = detectDevice();

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.8)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={{ base: 2, md: 4 }}
      overflowY="auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <UniformCard maxW="md" w="full" p={{ base: 4, md: 6 }} maxH="90vh" overflowY="auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Text fontSize="xl" fontWeight="bold" color="#ffffff">
                📱 Connect Mobile Wallet
              </Text>
              <Text fontSize="sm" color="#9ca3af">
                {device === 'ios' ? 'iOS' : device === 'android' ? 'Android' : 'Desktop'} Device Detected
              </Text>
            </VStack>
            <UniformButton
              onClick={onClose}
              onTouchStart={onClose}
              variant="secondary"
              size="sm"
              style={{ touchAction: 'manipulation' }}
            >
              ✕
            </UniformButton>
          </HStack>

          {/* Device-specific instructions */}
          <Box
            bg="rgba(59, 130, 246, 0.1)"
            border="1px solid rgba(59, 130, 246, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={2} align="stretch">
              <Text fontSize="sm" fontWeight="medium" color="#3b82f6">
                {device === 'ios' ? '📱 iOS Instructions:' : device === 'android' ? '🤖 Android Instructions:' : '💻 Desktop Instructions:'}
              </Text>
              <VStack gap={1} align="stretch">
                {device === 'ios' || device === 'android' ? (
                  <>
                    <Text fontSize="xs" color="#9ca3af">
                      1. Tap on your preferred wallet below
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      2. If the app is installed, it will open automatically
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      3. If not installed, you'll be redirected to the app store
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      4. Install the app and return to connect
                    </Text>
                  </>
                ) : (
                  <>
                    <Text fontSize="xs" color="#9ca3af">
                      1. Choose your preferred wallet below
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      2. You'll be redirected to download the mobile app
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      3. Install on your mobile device
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      4. Return to connect your wallet
                    </Text>
                  </>
                )}
              </VStack>
            </VStack>
          </Box>

          {/* Wallet Options */}
          <VStack gap={3} align="stretch">
            <Text fontSize="md" fontWeight="medium" color="#ffffff">
              Choose Your Wallet:
            </Text>
            {wallets.map((wallet) => (
              <Box
                key={wallet.id}
                p={4}
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="lg"
                border="1px solid"
                borderColor={selectedWallet === wallet.id ? wallet.color : 'rgba(255, 255, 255, 0.1)'}
                cursor="pointer"
                _hover={{
                  bg: 'rgba(255, 255, 255, 0.1)',
                  borderColor: wallet.color
                }}
                onClick={() => handleWalletSelect(wallet)}
              >
                <HStack gap={4} align="center">
                  <Box
                    w={12}
                    h={12}
                    bg={`${wallet.color}20`}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                  >
                    {wallet.icon}
                  </Box>
                  <VStack align="start" gap={1} flex={1}>
                    <Text fontSize="md" fontWeight="medium" color="#ffffff">
                      {wallet.name}
                    </Text>
                    <Text fontSize="sm" color="#9ca3af">
                      {wallet.description}
                    </Text>
                  </VStack>
                  <Badge
                    colorScheme={wallet.id === 'xverse' ? 'blue' : wallet.id === 'leather' ? 'brown' : wallet.id === 'unisat' ? 'orange' : 'blue'}
                    variant="outline"
                    fontSize="xs"
                  >
                    {wallet.id === 'xverse' ? 'Recommended' : 'Available'}
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>

          {/* Tips */}
          <Box
            bg="rgba(16, 185, 129, 0.1)"
            border="1px solid rgba(16, 185, 129, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={2} align="stretch">
              <Text fontSize="sm" fontWeight="medium" color="#10b981">
                💡 Pro Tips:
              </Text>
              <VStack gap={1} align="stretch">
                <Text fontSize="xs" color="#9ca3af">
                  • Xverse is recommended for Bitcoin + Stacks support
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • Leather is great for Stacks-focused users
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • Make sure you have some testnet tokens for testing
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • You can connect multiple wallets if needed
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Actions */}
          <HStack gap={3} justify="center">
            <UniformButton
              onClick={onClose}
              variant="secondary"
              size="md"
            >
              Close
            </UniformButton>
          </HStack>
        </VStack>
      </UniformCard>
    </Box>
  );
};

export default MobileWalletConnection;
