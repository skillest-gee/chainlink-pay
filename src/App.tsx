import React from 'react';
import { Box, Container, Flex, Heading, HStack, VStack, Image, Text } from '@chakra-ui/react';
import WalletConnectButton from './components/WalletConnectButton';
import Home from './pages/Home';
import Pay from './pages/Pay';
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
import WalletGuard from './components/WalletGuard';
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
              <Link to="/" style={{ textDecoration: 'none' }} title="Create and manage payment links">
                <Box
                  color="#ffffff" 
                  fontWeight="600" 
                  px={{ base: 4, md: 5 }} 
                  py={{ base: 3, md: 4 }} 
                  borderRadius="2xl" 
                  fontSize={{ base: "sm", md: "md" }}
                  bg="rgba(0, 212, 255, 0.08)"
                  border="1px solid"
                  borderColor="rgba(0, 212, 255, 0.2)"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    bg: 'linear-gradient(90deg, #00d4ff, #0099cc)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease'
                  }}
                  _hover={{ 
                    bg: 'rgba(0, 212, 255, 0.15)',
                    borderColor: 'rgba(0, 212, 255, 0.4)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(0, 212, 255, 0.25)',
                    _before: {
                      transform: 'scaleX(1)'
                    }
                  }}
                >
                  🏠 Home
                </Box>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/builder" style={{ textDecoration: 'none' }} title="AI-powered smart contract builder">
                    <Box
                      color="#ffffff" 
                      fontWeight="600" 
                      px={{ base: 4, md: 5 }} 
                      py={{ base: 3, md: 4 }} 
                      borderRadius="2xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(255, 107, 53, 0.08)"
                      border="1px solid"
                      borderColor="rgba(255, 107, 53, 0.2)"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bg: 'linear-gradient(90deg, #ff6b35, #ffaa00)',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease'
                      }}
                      _hover={{ 
                        bg: 'rgba(255, 107, 53, 0.15)',
                        borderColor: 'rgba(255, 107, 53, 0.4)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 35px rgba(255, 107, 53, 0.25)',
                        _before: {
                          transform: 'scaleX(1)'
                        }
                      }}
                    >
                      🤖 AI Builder
                    </Box>
                  </Link>
                  <Link to="/bridge" style={{ textDecoration: 'none' }} title="Cross-chain bridge for Bitcoin to other networks">
                    <Box
                      color="#ffffff" 
                      fontWeight="600" 
                      px={{ base: 4, md: 5 }} 
                      py={{ base: 3, md: 4 }} 
                      borderRadius="2xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(0, 255, 136, 0.08)"
                      border="1px solid"
                      borderColor="rgba(0, 255, 136, 0.2)"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bg: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease'
                      }}
                      _hover={{ 
                        bg: 'rgba(0, 255, 136, 0.15)',
                        borderColor: 'rgba(0, 255, 136, 0.4)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 35px rgba(0, 255, 136, 0.25)',
                        _before: {
                          transform: 'scaleX(1)'
                        }
                      }}
                    >
                      🌉 Bridge
                    </Box>
                  </Link>
                  <Link to="/dashboard" style={{ textDecoration: 'none' }} title="View analytics and transaction history">
                    <Box
                      color="#ffffff" 
                      fontWeight="600" 
                      px={{ base: 4, md: 5 }} 
                      py={{ base: 3, md: 4 }} 
                      borderRadius="2xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(170, 0, 255, 0.08)"
                      border="1px solid"
                      borderColor="rgba(170, 0, 255, 0.2)"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bg: 'linear-gradient(90deg, #aa00ff, #8a2be2)',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease'
                      }}
                      _hover={{ 
                        bg: 'rgba(170, 0, 255, 0.15)',
                        borderColor: 'rgba(170, 0, 255, 0.4)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 35px rgba(170, 0, 255, 0.25)',
                        _before: {
                          transform: 'scaleX(1)'
                        }
                      }}
                    >
                      📊 Dashboard
                    </Box>
                  </Link>
                </>
              ) : (
                <>
                  <Text color="gray.400" px={2} py={1} borderRadius="md" fontSize="sm" title="Connect wallet to access AI Builder">AI Builder</Text>
                  <Text color="gray.400" px={2} py={1} borderRadius="md" fontSize="sm" title="Connect wallet to access Bridge">Bridge</Text>
                  <Text color="gray.400" px={2} py={1} borderRadius="md" fontSize="sm" title="Connect wallet to access Dashboard">Dashboard</Text>
                </>
              )}
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
            <Route path="/pay/:id" element={<Pay />} />
            <Route path="/builder" element={
              <WalletGuard title="AI Contract Builder" description="Connect your wallet to generate smart contracts with AI">
                <AIContractBuilder />
              </WalletGuard>
            } />
            <Route path="/bridge" element={
              <WalletGuard title="Cross-Chain Bridge" description="Connect your wallet to bridge Bitcoin to other networks">
                <Bridge />
              </WalletGuard>
            } />
            <Route path="/dashboard" element={
              <WalletGuard title="Dashboard" description="Connect your wallet to view your analytics and transaction history">
                <Dashboard />
              </WalletGuard>
            } />
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
