import React, { useEffect, useState } from 'react';
import { Box, Container, Flex, Heading, HStack, VStack, Text, Badge } from '@chakra-ui/react';
import WalletConnectButton from './components/WalletConnectButton';
import { UniformButton } from './components/UniformButton';
import Home from './pages/Home';
import Pay from './pages/Pay';
import PaymentLinkGenerator from './components/PaymentLinkGenerator';
import AIContractBuilder from './pages/AIContractBuilder';
import Bridge from './pages/Bridge';
import Dashboard from './pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TutorialModal from './components/TutorialModal';
import NetworkStatus from './components/NetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useStacksWallet } from './hooks/useStacksWallet';
import { useBitcoinWallet } from './hooks/useBitcoinWallet';
import { useStxBalance } from './hooks/useStxBalance';
import { logEnvironmentStatus } from './utils/environmentValidator';
import { appValidator } from './utils/appValidator';

function App() {
  const { toasts, removeToast } = useToast();
  const { isAuthenticated, address, connect, disconnect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, balance: btcBalance } = useBitcoinWallet();
  const { balance: stxBalance, loading: balanceLoading } = useStxBalance(address);
  
  const [appState, setAppState] = useState({
    isInitialized: false,
    userAddress: null as string | null,
    walletType: null as 'stacks' | 'bitcoin' | null,
    lastActivity: Date.now()
  });

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

  // Initialize application validation
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing ChainLinkPay Application...');
      
      // Log environment status
      logEnvironmentStatus();
      
      // Run comprehensive validation in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const validationReport = await appValidator.runFullValidation();
          console.log('✅ Application validation completed:', validationReport.overall);
          
          if (validationReport.overall === 'critical') {
            console.error('🚨 Critical issues found - application may not function properly');
          } else if (validationReport.overall === 'degraded') {
            console.warn('⚠️ Some issues found - application running in degraded mode');
          }
        } catch (error) {
          console.error('❌ Application validation failed:', error);
        }
      }
    };

    initializeApp();
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
    <Box minH="100vh" bg="#000000" color="#ffffff">
      {/* Enhanced Professional Header */}
      <Box 
        as="header" 
        borderBottomWidth="1px" 
        borderColor="rgba(255, 255, 255, 0.1)"
        bg="rgba(0, 0, 0, 0.95)" 
        position="sticky"
        top="0"
        zIndex="1000"
        backdropFilter="blur(10px)"
        w="100%"
      >
        <Container maxW="7xl" py={4} px={4}>
          <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4} w="100%">
            {/* Logo and Brand */}
            <HStack gap={3} align="center" flexShrink={0}>
              <Box 
                w="45px"
                h="45px"
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xl"
                color="#ffffff"
                fontWeight="bold"
                boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
              >
                🔗
              </Box>
              <VStack align="start" gap={0}>
                <Heading size="lg" color="#ffffff" fontWeight="bold">
                  ChainLinkPay
                </Heading>
                <Text fontSize="xs" color="#9ca3af" fontWeight="medium">
                  Bitcoin Payment Platform
                </Text>
              </VStack>
            </HStack>

            {/* Navigation - Professional Core Links Only */}
            <HStack gap={1} display={{ base: 'none', md: 'flex' }} justify="center" flex="1" maxW="400px">
              <Link to="/generate" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  title="Create payment links"
                >
                  Payments
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

            {/* Wallet Status and Controls */}
            <HStack gap={3} align="center" flexShrink={0}>
              {/* Wallet Status Display - Only show when connected */}
              {walletStatus && (
                <HStack gap={2} align="center" display={{ base: 'none', lg: 'flex' }}>
                  <Badge 
                    colorScheme={walletStatus.type === 'stacks' ? 'blue' : 'orange'} 
                    fontSize="xs"
                    variant="subtle"
                  >
                    {walletStatus.type === 'stacks' ? 'STX' : 'BTC'}
                  </Badge>
                  <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                    {walletStatus.address?.slice(0, 6)}...{walletStatus.address?.slice(-4)}
                  </Text>
                </HStack>
              )}

              {/* Network Status */}
              <NetworkStatus />
              
              {/* Wallet Connect Button */}
              <WalletConnectButton />
              
              {/* Tutorial Modal */}
              <TutorialModal />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="6xl" py={8} flex="1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<PaymentLinkGenerator />} />
            <Route path="/pay/:id" element={<Pay />} />
            <Route path="/ai-builder" element={<AIContractBuilder />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </ErrorBoundary>
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

      {/* Toast Notifications */}
      {toasts.map((toast, index) => (
        <Toast
          key={index}
          message={toast}
          onClose={() => removeToast(index)}
        />
      ))}
    </Box>
  );
}

export default App;