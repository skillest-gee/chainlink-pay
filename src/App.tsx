import React from 'react';
import { Box, Container, Flex, Heading, Spacer, HStack, VStack, Image, Text } from '@chakra-ui/react';
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
import ContractBadge from './components/ContractBadge';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useStacksWallet } from './hooks/useStacksWallet';
import WalletGuard from './components/WalletGuard';
function App() {
  const { toasts, removeToast } = useToast();
  const { isAuthenticated } = useStacksWallet();
  
  return (
    <Box minH="100vh" bg="gray.50" color="gray.800">
      <Box as="header" borderBottomWidth="1px" bg="white" shadow="sm">
        <Container maxW="6xl" py={3}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
            {/* Logo and Brand */}
            <HStack gap={3} align="center">
              <Box position="relative">
                <Image 
                  src="/logo.png" 
                  alt="ChainLinkPay Logo" 
                  w="45px" 
                  h="45px" 
                  borderRadius="lg"
                  shadow="md"
                  border="2px solid"
                  borderColor="blue.300"
                  _hover={{ 
                    transform: "scale(1.05)", 
                    transition: "all 0.2s",
                    shadow: "lg",
                    borderColor: "blue.400"
                  }}
                />
              </Box>
              <Heading size="lg" color="blue.600" fontWeight="bold" letterSpacing="tight">
                ChainLinkPay
              </Heading>
            </HStack>

            {/* Navigation */}
            <HStack gap={6} display={{ base: "none", md: "flex" }}>
              <Link to="/" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="Create and manage payment links">
                <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Home</Text>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/builder" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="AI-powered smart contract builder">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">AI Builder</Text>
                  </Link>
                  <Link to="/bridge" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="Cross-chain bridge for Bitcoin to other networks">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Bridge</Text>
                  </Link>
                  <Link to="/dashboard" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="View analytics and transaction history">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Dashboard</Text>
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
              <ContractBadge />
            </HStack>

            {/* Wallet */}
            <WalletConnectButton />
          </Flex>

          {/* Mobile Navigation */}
          <VStack gap={4} mt={3} display={{ base: "flex", md: "none" }}>
            <HStack gap={3} align="center">
              <Image 
                src="/logo.png" 
                alt="ChainLinkPay Logo" 
                w="35px" 
                h="35px" 
                borderRadius="lg"
                shadow="md"
                border="2px solid"
                borderColor="blue.300"
              />
              <Heading size="md" color="blue.600" fontWeight="bold">ChainLinkPay</Heading>
            </HStack>
            <HStack gap={3} wrap="wrap" justify="center">
              <Link to="/" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="Create and manage payment links">
                <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Home</Text>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/builder" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="AI-powered smart contract builder">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">AI Builder</Text>
                  </Link>
                  <Link to="/bridge" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="Cross-chain bridge for Bitcoin to other networks">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Bridge</Text>
                  </Link>
                  <Link to="/dashboard" style={{ textDecoration: 'none', color: '#374151', fontWeight: '500', cursor: 'pointer' }} title="View analytics and transaction history">
                    <Text _hover={{ color: 'blue.600' }} px={2} py={1} borderRadius="md" fontSize="sm">Dashboard</Text>
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
              <ContractBadge />
            </HStack>
          </VStack>
        </Container>
      </Box>
      <Box as="main">
        <Container maxW="6xl" py={2}><NetworkStatus /></Container>
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
