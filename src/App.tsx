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
        <Container maxW="6xl" py={{ base: 2, md: 3 }}>
          <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={{ base: 3, md: 4 }}>
            {/* Logo and Brand */}
            <HStack gap={3} align="center" order={{ base: 1, md: 1 }}>
              <Box 
                w={{ base: "40px", md: "50px" }}
                h={{ base: "40px", md: "50px" }}
                bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: "lg", md: "xl" }}
                boxShadow="0 4px 20px rgba(0, 212, 255, 0.3)"
                border="2px solid"
                borderColor="brand.primary"
                _hover={{
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 30px rgba(0, 212, 255, 0.4)",
                  borderColor: "brand.secondary"
                }}
              >
                🔗
              </Box>
              <Heading 
                size={{ base: "md", md: "lg" }} 
                bg="linear-gradient(135deg, #00d4ff 0%, #ffffff 100%)"
                bgClip="text"
                fontWeight="bold" 
                letterSpacing="tight"
              >
                ChainLinkPay
              </Heading>
            </HStack>

            {/* Navigation */}
            <HStack gap={{ base: 2, md: 4 }} display="flex" order={{ base: 3, md: 2 }} wrap="wrap" justify="center">
              <Link to="/" style={{ textDecoration: 'none' }} title="Create and manage payment links">
                <Text 
                  color="#ffffff" 
                  fontWeight="600" 
                  px={4} 
                  py={2} 
                  borderRadius="xl" 
                  fontSize={{ base: "sm", md: "md" }}
                  bg="rgba(0, 212, 255, 0.1)"
                  border="1px solid"
                  borderColor="rgba(0, 212, 255, 0.3)"
                  _hover={{ 
                    bg: 'rgba(0, 212, 255, 0.2)',
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)'
                  }}
                  transition="all 0.3s ease"
                >
                  🏠 Home
                </Text>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/builder" style={{ textDecoration: 'none' }} title="AI-powered smart contract builder">
                    <Text 
                      color="#ffffff" 
                      fontWeight="600" 
                      px={4} 
                      py={2} 
                      borderRadius="xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(255, 107, 53, 0.1)"
                      border="1px solid"
                      borderColor="rgba(255, 107, 53, 0.3)"
                      _hover={{ 
                        bg: 'rgba(255, 107, 53, 0.2)',
                        borderColor: 'rgba(255, 107, 53, 0.5)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
                      }}
                      transition="all 0.3s ease"
                    >
                      🤖 AI Builder
                    </Text>
                  </Link>
                  <Link to="/bridge" style={{ textDecoration: 'none' }} title="Cross-chain bridge for Bitcoin to other networks">
                    <Text 
                      color="#ffffff" 
                      fontWeight="600" 
                      px={4} 
                      py={2} 
                      borderRadius="xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(0, 255, 136, 0.1)"
                      border="1px solid"
                      borderColor="rgba(0, 255, 136, 0.3)"
                      _hover={{ 
                        bg: 'rgba(0, 255, 136, 0.2)',
                        borderColor: 'rgba(0, 255, 136, 0.5)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 255, 136, 0.3)'
                      }}
                      transition="all 0.3s ease"
                    >
                      🌉 Bridge
                    </Text>
                  </Link>
                  <Link to="/dashboard" style={{ textDecoration: 'none' }} title="View analytics and transaction history">
                    <Text 
                      color="#ffffff" 
                      fontWeight="600" 
                      px={4} 
                      py={2} 
                      borderRadius="xl" 
                      fontSize={{ base: "sm", md: "md" }}
                      bg="rgba(170, 0, 255, 0.1)"
                      border="1px solid"
                      borderColor="rgba(170, 0, 255, 0.3)"
                      _hover={{ 
                        bg: 'rgba(170, 0, 255, 0.2)',
                        borderColor: 'rgba(170, 0, 255, 0.5)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(170, 0, 255, 0.3)'
                      }}
                      transition="all 0.3s ease"
                    >
                      📊 Dashboard
                    </Text>
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
            <HStack gap={{ base: 2, md: 4 }} order={{ base: 2, md: 3 }}>
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
