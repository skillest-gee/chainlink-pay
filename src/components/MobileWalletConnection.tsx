import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Badge, Image, Spinner } from '@chakra-ui/react';
import { UniformCard } from './UniformCard';
import { UniformButton } from './UniformButton';

interface MobileWalletConnectionProps {
  onClose: () => void;
}

interface WalletConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  downloadUrl: {
    ios: string;
    android: string;
  };
  deepLink: string;
  color: string;
  universalLink?: string;
  checkInstalled?: () => Promise<boolean>;
}

export const MobileWalletConnection: React.FC<MobileWalletConnectionProps> = ({ onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    detectDevice();
  }, []);

  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  };

  // Enhanced wallet detection function
  const checkIfWalletInstalled = async (wallet: WalletConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.src = wallet.deepLink;
      iframe.style.display = 'none';
      
      let timer: NodeJS.Timeout;
      
      const cleanup = () => {
        window.removeEventListener('blur', onBlur);
        clearTimeout(timer);
        document.body.removeChild(iframe);
      };
      
      const onBlur = () => {
        cleanup();
        resolve(true);
      };
      
      const onTimeout = () => {
        cleanup();
        resolve(false);
      };
      
      window.addEventListener('blur', onBlur);
      timer = setTimeout(onTimeout, 2000);
      
      document.body.appendChild(iframe);
    });
  };

  const wallets: WalletConfig[] = [
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
      universalLink: 'https://xverse.app/connect',
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
      universalLink: 'https://leather.io/connect',
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
      universalLink: 'https://unisat.io/connect',
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
      universalLink: 'https://okx.com/connect',
      color: '#0066ff'
    }
  ];

  const handleWalletSelect = async (wallet: WalletConfig) => {
    setSelectedWallet(wallet.id);
    setIsChecking(wallet.id);

    try {
      // First, try to detect if wallet is installed
      const isInstalled = await checkIfWalletInstalled(wallet);
      
      if (isInstalled) {
        // Wallet is installed, use deep link
        console.log(`${wallet.name} is installed, opening app...`);
        
        if (deviceType === 'ios' && wallet.universalLink) {
          // Use universal links for iOS for better reliability
          window.location.href = wallet.universalLink;
        } else {
          // Use deep links for Android and fallback
          window.location.href = wallet.deepLink;
        }
        
        // Set a timeout to redirect to app store if app doesn't open
        setTimeout(() => {
          if (!document.hidden) {
            console.log('App not opened, redirecting to app store...');
            redirectToAppStore(wallet);
          }
        }, 1500);
        
      } else {
        // Wallet not installed, redirect to app store
        console.log(`${wallet.name} not installed, redirecting to app store...`);
        redirectToAppStore(wallet);
      }
      
    } catch (error) {
      console.error('Error handling wallet selection:', error);
      // Fallback to original behavior
      fallbackWalletConnection(wallet);
    } finally {
      setIsChecking(null);
    }
  };

  const redirectToAppStore = (wallet: WalletConfig) => {
    const storeUrl = deviceType === 'ios' ? wallet.downloadUrl.ios : wallet.downloadUrl.android;
    window.open(storeUrl, '_blank');
  };

  const fallbackWalletConnection = (wallet: WalletConfig) => {
    // Original fallback behavior
    if (deviceType === 'ios' || deviceType === 'android') {
      window.location.href = wallet.deepLink;
      setTimeout(() => {
        redirectToAppStore(wallet);
      }, 2000);
    } else {
      redirectToAppStore(wallet);
    }
  };

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
                {deviceType === 'ios' ? 'iOS' : deviceType === 'android' ? 'Android' : 'Desktop'} Device Detected
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
                {deviceType === 'ios' ? '📱 iOS Instructions:' : deviceType === 'android' ? '🤖 Android Instructions:' : '💻 Desktop Instructions:'}
              </Text>
              <VStack gap={1} align="stretch">
                {deviceType === 'ios' || deviceType === 'android' ? (
                  <>
                    <Text fontSize="xs" color="#9ca3af">
                      1. Tap on your preferred wallet below
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      2. We'll detect if the app is installed
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      3. If installed, the app will open automatically
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      4. If not installed, you'll go to the app store
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
                cursor={isChecking === wallet.id ? 'default' : 'pointer'}
                opacity={isChecking === wallet.id ? 0.7 : 1}
                _hover={
                  isChecking === wallet.id ? {} : {
                    bg: 'rgba(255, 255, 255, 0.1)',
                    borderColor: wallet.color
                  }
                }
                onClick={() => !isChecking && handleWalletSelect(wallet)}
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
                    {isChecking === wallet.id ? <Spinner size="sm" /> : wallet.icon}
                  </Box>
                  <VStack align="start" gap={1} flex={1}>
                    <Text fontSize="md" fontWeight="medium" color="#ffffff">
                      {wallet.name}
                      {isChecking === wallet.id && ' (Checking...)'}
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

          {/* Enhanced Tips */}
          <Box
            bg="rgba(16, 185, 129, 0.1)"
            border="1px solid rgba(16, 185, 129, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={2} align="stretch">
              <Text fontSize="sm" fontWeight="medium" color="#10b981">
                💡 Enhanced Connection Tips:
              </Text>
              <VStack gap={1} align="stretch">
                <Text fontSize="xs" color="#9ca3af">
                  • If detection fails, manually open your wallet app first
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • Ensure your wallet app is updated to the latest version
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • For iOS, allow "Universal Links" in your wallet app settings
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  • Refresh the page if connection issues persist
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Manual Connection Option */}
          <Box
            bg="rgba(245, 158, 11, 0.1)"
            border="1px solid rgba(245, 158, 11, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={2} align="stretch">
              <Text fontSize="sm" fontWeight="medium" color="#f59e0b">
                🔧 Still Having Issues?
              </Text>
              <Text fontSize="xs" color="#9ca3af">
                Try this manual method:
              </Text>
              <UniformButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Provide manual connection instructions or alternative method
                  alert('1. Open your wallet app manually\n2. Use the "Scan QR" feature in your wallet\n3. Come back to this screen for QR code connection');
                }}
              >
                Show Manual Connection Guide
              </UniformButton>
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