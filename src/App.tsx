import React, { useEffect, useState, Suspense } from 'react';
import { Box, Container, Flex, Heading, HStack, VStack, Text, Badge, IconButton, useDisclosure, Stack, Spinner } from '@chakra-ui/react';
import WalletConnectButton from './components/WalletConnectButton';
import { UniformButton } from './components/UniformButton';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useToast } from './hooks/useToast';
import { useStacksWallet } from './hooks/useStacksWallet';
import { useBitcoinWallet } from './hooks/useBitcoinWallet';
import { useStxBalance } from './hooks/useStxBalance';
import TutorialModal from './components/TutorialModal';
import { backendAPI } from './services/backendAPI';
import { crossDeviceBackendAPI } from './services/crossDeviceBackendAPI';
import { realTimeNotificationService } from './services/realTimeNotificationService';
import { blockchainVerificationService } from './services/blockchainVerificationService';
import { paymentLifecycleManager } from './services/paymentLifecycleManager';

// Lazy load pages for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Pay = React.lazy(() => import('./pages/Pay'));
const PaymentLinkGenerator = React.lazy(() => import('./components/PaymentLinkGenerator'));
const AIContractBuilder = React.lazy(() => import('./pages/AIContractBuilder'));
const Bridge = React.lazy(() => import('./pages/Bridge'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
    <VStack gap={4}>
      <Spinner size="lg" color="#3b82f6" />
      <Text color="#9ca3af" fontSize="sm">Loading page...</Text>
    </VStack>
  </Box>
);

function AppContent() {
  const { toasts, removeToast } = useToast();
  const { isAuthenticated, address, connect, disconnect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, balance: btcBalance } = useBitcoinWallet();
  const { balance: stxBalance, loading: balanceLoading } = useStxBalance(address);
  const { open: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();
  
  const [appState, setAppState] = useState({
    isInitialized: false,
    userAddress: null as string | null,
    walletType: null as 'stacks' | 'bitcoin' | null,
    lastActivity: Date.now()
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // Initialize all backend services
  useEffect(() => {
    backendAPI.initializeCrossTabSync();
    crossDeviceBackendAPI.initializeCrossDeviceSync();
    
    // Services are already initialized as singletons, but we can log their status
    console.log('App: All backend services initialized:');
    console.log('- Cross-tab communication: Active');
    console.log('- Cross-device sync: Active');
    console.log('- Real-time notifications: Active');
    console.log('- Blockchain verification: Active');
    console.log('- Payment lifecycle manager: Active');
  }, []);

  // Update app state when wallet connections change
  useEffect(() => {
    console.log('App: Wallet state changed', { isAuthenticated, address, btcConnected, btcAddress });
    
    setAppState(prev => ({
      ...prev,
      isInitialized: true,
      userAddress: isAuthenticated ? address : btcConnected ? btcAddress : null,
      walletType: isAuthenticated ? 'stacks' : btcConnected ? 'bitcoin' : null,
      lastActivity: Date.now()
    }));
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  // Track user activity for state management
  useEffect(() => {
    const handleActivity = () => {
      setAppState(prev => ({ ...prev, lastActivity: Date.now() }));
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  // Initialize application
  useEffect(() => {
    console.log('🚀 Initializing ChainLinkPay Application...');
    console.log('✅ Application ready for hackathon submission!');
  }, []);

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0.00';
    return balance.toFixed(6);
  };

  const getWalletStatus = () => {
    if (isAuthenticated && address) {
      return { type: 'stacks', address, balance: stxBalance };
    }
    if (btcConnected && btcAddress) {
      return { type: 'bitcoin', address: btcAddress, balance: btcBalance };
    }
    return null;
  };

  const walletStatus = getWalletStatus();

  return (
    <Box minH="100vh" bg="var(--bg-primary)" color="var(--text-primary)">
      {/* Enhanced Professional Header */}
      <Box 
        as="header" 
        borderBottomWidth="1px" 
        borderColor="var(--border-primary)"
        bg="var(--bg-modal)" 
        position="sticky"
        top="0"
        zIndex="1000"
        backdropFilter="blur(10px)"
        w="100%"
      >
        <Container maxW="7xl" py={{ base: 2, md: 4 }} px={{ base: 2, md: 4 }}>
          <Flex align="center" justify="space-between" gap={4} w="100%">
            {/* Logo and Brand */}
            <HStack gap={{ base: 2, md: 3 }} align="center" flexShrink={0}>
              <Box 
                w={{ base: "35px", md: "45px" }}
                h={{ base: "35px", md: "45px" }}
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: "lg", md: "xl" }}
                color="#ffffff"
                fontWeight="bold"
                boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
              >
                🔗
              </Box>
              <VStack align="start" gap={0}>
                <Heading size={{ base: "md", md: "lg" }} color="#ffffff" fontWeight="bold">
                  ChainLinkPay
                </Heading>
                <Text fontSize={{ base: "2xs", md: "xs" }} color="#9ca3af" fontWeight="medium">
                  Bitcoin Payment Platform
                </Text>
              </VStack>
            </HStack>

            {/* Navigation - Professional Core Links Only */}
            <HStack gap={1} display={{ base: 'none', md: 'flex' }} justify="center" flex="1" maxW="500px">
              <Link to="/generate" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  title="Create payment links"
                >
                  Payments
                </UniformButton>
              </Link>
              <Link to="/ai-builder" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  title="AI smart contract builder"
                >
                  AI Builder
                </UniformButton>
              </Link>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  title="View analytics"
                >
                  Dashboard
                </UniformButton>
              </Link>
              <UniformButton
                variant="ghost"
                size="sm"
                title="Learn how to use ChainLinkPay"
                onClick={() => setShowTutorial(true)}
                onTouchStart={() => setShowTutorial(true)}
                style={{ touchAction: 'manipulation' }}
              >
                Tutorial
              </UniformButton>
              <Link to="/bridge" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  title="Cross-chain bridge"
                >
                  Bridge
                </UniformButton>
              </Link>
            </HStack>

            {/* Right Side - Wallet Connection, Theme Toggle, and Mobile Menu */}
            <HStack gap={2} align="center" flexShrink={0}>
              {/* Desktop Wallet Connection */}
              <HStack gap={3} display={{ base: 'none', md: 'flex' }}>
                <ThemeToggle />
                <WalletConnectButton />
              </HStack>
              
              {/* Mobile Menu Button */}
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                aria-label="Open menu"
                children={<Text fontSize="lg">☰</Text>}
                variant="ghost"
                color="#ffffff"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={onMobileMenuOpen}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation - Enhanced Overlay */}
      {isMobileMenuOpen && (
        <Box 
          position="fixed" 
          top="0" 
          left="0" 
          right="0" 
          bottom="0" 
          bg="rgba(0, 0, 0, 0.95)" 
          zIndex="9999"
          p={4}
        >
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="md" color="#ffffff">Menu</Heading>
            <IconButton
              aria-label="Close menu"
              children={<Text fontSize="lg">✕</Text>}
              variant="ghost"
              color="#ffffff"
              onClick={onMobileMenuClose}
            />
          </Flex>
          
          <VStack gap={6} align="stretch">
            {/* Navigation Links */}
            <VStack gap={3} align="stretch">
              <Text fontSize="sm" color="#9ca3af" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Navigation
              </Text>
              <VStack gap={2} align="stretch">
                <Link to="/generate" onClick={onMobileMenuClose} style={{ textDecoration: 'none' }}>
                  <UniformButton variant="ghost" size="lg" w="100%" justifyContent="flex-start" h="60px">
                    <HStack gap={3}>
                      <Text fontSize="2xl">💳</Text>
                      <VStack align="start" gap={0}>
                        <Text fontSize="md" fontWeight="medium">Payments</Text>
                        <Text fontSize="xs" color="#9ca3af">Create payment links</Text>
                      </VStack>
                    </HStack>
                  </UniformButton>
                </Link>
                <Link to="/ai-builder" onClick={onMobileMenuClose} style={{ textDecoration: 'none' }}>
                  <UniformButton variant="ghost" size="lg" w="100%" justifyContent="flex-start" h="60px">
                    <HStack gap={3}>
                      <Text fontSize="2xl">🤖</Text>
                      <VStack align="start" gap={0}>
                        <Text fontSize="md" fontWeight="medium">AI Builder</Text>
                        <Text fontSize="xs" color="#9ca3af">Generate smart contracts</Text>
                      </VStack>
                    </HStack>
                  </UniformButton>
                </Link>
                <Link to="/dashboard" onClick={onMobileMenuClose} style={{ textDecoration: 'none' }}>
                  <UniformButton variant="ghost" size="lg" w="100%" justifyContent="flex-start" h="60px">
                    <HStack gap={3}>
                      <Text fontSize="2xl">📊</Text>
                      <VStack align="start" gap={0}>
                        <Text fontSize="md" fontWeight="medium">Dashboard</Text>
                        <Text fontSize="xs" color="#9ca3af">View analytics</Text>
                      </VStack>
                    </HStack>
                  </UniformButton>
                </Link>
                <Link to="/bridge" onClick={onMobileMenuClose} style={{ textDecoration: 'none' }}>
                  <UniformButton variant="ghost" size="lg" w="100%" justifyContent="flex-start" h="60px">
                    <HStack gap={3}>
                      <Text fontSize="2xl">🌉</Text>
                      <VStack align="start" gap={0}>
                        <Text fontSize="md" fontWeight="medium">Bridge</Text>
                        <Text fontSize="xs" color="#9ca3af">Cross-chain transfers</Text>
                      </VStack>
                    </HStack>
                  </UniformButton>
                </Link>
              </VStack>
            </VStack>

            {/* Separator */}
            <Box h="1px" bg="rgba(255, 255, 255, 0.1)" />

            {/* Wallet and Network Status */}
            <VStack gap={4} align="stretch">
              <Text fontSize="sm" color="#9ca3af" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                Wallet & Network
              </Text>
              <WalletConnectButton />
              <HStack gap={2} justify="space-between">
                <Text fontSize="sm" color="#9ca3af">Theme</Text>
                <ThemeToggle />
              </HStack>
              <UniformButton
                variant="secondary"
                size="sm"
                onClick={() => setShowTutorial(true)}
                onTouchStart={() => setShowTutorial(true)}
                style={{ touchAction: 'manipulation' }}
              >
                Tutorial
              </UniformButton>
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Main Content */}
      <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }} flex="1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<PaymentLinkGenerator />} />
            <Route path="/pay/:id" element={<Pay />} />
            <Route path="/ai-builder" element={<AIContractBuilder />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </Container>

      {/* Footer */}
      <Box as="footer" borderTopWidth="1px" borderColor="rgba(255, 255, 255, 0.1)" mt={10}>
        <Container maxW="6xl" py={6}>
          <VStack gap={4} align="center">
            <Text textAlign="center" fontSize="sm" color="#9ca3af">
              &copy; {new Date().getFullYear()} ChainLinkPay. All rights reserved.
            </Text>
            
            {/* Hackathon Badge */}
            <Box 
              p={3} 
              bg="rgba(59, 130, 246, 0.1)" 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="rgba(59, 130, 246, 0.3)"
            >
              <VStack gap={2} align="center">
                <Text fontSize="sm" fontWeight="medium" color="#3b82f6">
                  🏆 Built for Stacks Vibe Coding Hackathon
                </Text>
                <Text fontSize="xs" color="#9ca3af" textAlign="center">
                  Unlocking the Bitcoin economy through AI-powered development
                </Text>
              </VStack>
            </Box>
            
            <HStack gap={4} fontSize="xs" color="#6b7280" wrap="wrap" justify="center">
              <Text>Built with AI</Text>
              <Text>•</Text>
              <Text>Stacks Blockchain</Text>
              <Text>•</Text>
              <Text>Bitcoin Native</Text>
              <Text>•</Text>
              <Text>OpenRouter AI</Text>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;