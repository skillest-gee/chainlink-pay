import React, { useEffect } from 'react';
import { Box, Container, Flex, Heading, HStack, VStack, Image, Text } from '@chakra-ui/react';
import WalletConnectButton from './components/WalletConnectButton';
import { UniformButton } from './components/UniformButton';
import { UniformCard } from './components/UniformCard';
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
function App() {
  const { toasts, removeToast } = useToast();
  const { isAuthenticated } = useStacksWallet();
  
  return (
      <Box minH="100vh" bg="#0a0a0a" color="#ffffff" overflowX="hidden">
      <Box 
        as="header" 
        borderBottomWidth="1px" 
        borderColor="rgba(0, 212, 255, 0.2)"
        bg="rgba(17, 17, 17, 0.95)" 
        shadow="0 8px 32px rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(20px)"
        position="sticky"
        top="0"
        zIndex="1000"
        transition="all 0.3s ease"
      >
        <Container maxW="7xl" py={{ base: 3, md: 4 }}>
          <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 6 }}>
            {/* Logo and Brand */}
            <HStack gap={4} align="center" order={{ base: 1, md: 1 }}>
              <Box 
                w={{ base: "45px", md: "55px" }}
                h={{ base: "45px", md: "55px" }}
                bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
                borderRadius="2xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: "xl", md: "2xl" }}
                boxShadow="0 8px 32px rgba(0, 212, 255, 0.4)"
                border="2px solid"
                borderColor="rgba(0, 212, 255, 0.3)"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '2xl',
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(255, 107, 53, 0.5))',
                  zIndex: -1,
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
                _hover={{
                  transform: "scale(1.08)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 12px 40px rgba(0, 212, 255, 0.5)",
                  borderColor: "rgba(0, 212, 255, 0.6)",
                  _before: {
                    opacity: 1
                  }
                }}
              >
                🔗
              </Box>
              <VStack align="start" gap={1}>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  bg="linear-gradient(135deg, #00d4ff 0%, #ffffff 100%)"
                  bgClip="text"
                  fontWeight="bold" 
                  letterSpacing="tight"
                >
                  ChainLinkPay
                </Heading>
                <Text 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="#a0a0a0" 
                  fontWeight="medium"
                  letterSpacing="wide"
                >
                  Bitcoin Payment Platform
                </Text>
              </VStack>
            </HStack>

            {/* Navigation */}
            <HStack gap={{ base: 3, md: 2 }} display="flex" order={{ base: 3, md: 2 }} wrap="wrap" justify="center">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="md"
                  title="Create and manage payment links"
                >
                  🏠 Home
                </UniformButton>
              </Link>
              <Link to="/generate" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="md"
                  title="Create and manage payment links"
                >
                  💳 Payments
                </UniformButton>
              </Link>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="md"
                  title="View analytics and payment history"
                >
                  📊 Dashboard
                </UniformButton>
              </Link>
              <Link to="/ai-builder" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="md"
                  title="AI-powered smart contract builder"
                >
                  🤖 AI Builder
                </UniformButton>
              </Link>
              <Link to="/bridge" style={{ textDecoration: 'none' }}>
                <UniformButton
                  variant="ghost"
                  size="md"
                  title="Cross-chain asset bridging"
                >
                  🌉 Bridge
                </UniformButton>
              </Link>
              <TutorialModal />
            </HStack>

            {/* Wallet */}
            <HStack gap={{ base: 3, md: 4 }} order={{ base: 2, md: 3 }}>
              <NetworkStatus />
              <WalletConnectButton />
            </HStack>
          </Flex>

        </Container>
      </Box>
      <Box as="main">
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
      </Box>
      <Box as="footer" borderTopWidth="1px" mt={10}>
        <Container maxW="6xl" py={4}>
          © {new Date().getFullYear()} ChainLinkPay
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
