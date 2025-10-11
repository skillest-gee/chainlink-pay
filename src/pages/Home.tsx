import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Container, VStack, HStack, Badge, Skeleton } from '@chakra-ui/react';
import PaymentLinkGenerator from '../components/PaymentLinkGenerator';
import { UniformButton } from '../components/UniformButton';
import { UniformCard } from '../components/UniformCard';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import { Link } from 'react-router-dom';
import { paymentStorage } from '../services/paymentStorage';

interface HomeStats {
  totalPayments: number;
  totalVolume: number;
  activePayments: number;
  recentActivity: any[];
}

export default function Home() {
  const { isAuthenticated, address, connect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, balance: btcBalance } = useBitcoinWallet();
  const { balance: stxBalance, loading: balanceLoading } = useStxBalance(address);
  
  const [stats, setStats] = useState<HomeStats>({
    totalPayments: 0,
    totalVolume: 0,
    activePayments: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const allPayments = paymentStorage.getAllPaymentLinks();
        const totalPayments = allPayments.length;
        const totalVolume = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const activePayments = allPayments.filter(p => p.status === 'pending').length;
        const recentActivity = allPayments.slice(0, 5);

        setStats({
          totalPayments,
          totalVolume,
          activePayments,
          recentActivity
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0.00';
    return balance.toFixed(6);
  };

  const getWalletInfo = () => {
    if (isAuthenticated && address) {
      return {
        type: 'Stacks',
        address: address,
        balance: stxBalance,
        loading: balanceLoading
      };
    }
    if (btcConnected && btcAddress) {
      return {
        type: 'Bitcoin',
        address: btcAddress,
        balance: btcBalance,
        loading: false
      };
    }
    return null;
  };

  const walletInfo = getWalletInfo();

  return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Container maxW="6xl" py={8} px={4}>
        <VStack gap={8} align="stretch">
          {/* Hero Section */}
          <VStack gap={6} textAlign="center" py={8}>
            <HStack gap={3} align="center">
              <Box
                w="60px"
                h="60px"
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                borderRadius="2xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
                color="#ffffff"
                fontWeight="bold"
                boxShadow="0 8px 32px rgba(59, 130, 246, 0.4)"
              >
                🔗
              </Box>
              <VStack align="start" gap={1}>
                <Heading size="2xl" fontWeight="bold" color="#ffffff">
                  ChainLinkPay
                </Heading>
                <Text fontSize="lg" color="#9ca3af">
                  Professional Bitcoin Payment Platform
                </Text>
              </VStack>
            </HStack>
            
            <Text fontSize="lg" color="#9ca3af" maxW="3xl" mx="auto">
              Create secure payment links, manage transactions, bridge assets across blockchain networks, and generate smart contracts with AI.
            </Text>
          </VStack>

          {/* Wallet Status */}
          {walletInfo && (
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  Wallet Status
                </Heading>
                
                <HStack justify="space-between" align="center" p={4} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="#9ca3af">{walletInfo.type} Wallet</Text>
                    <Text fontSize="lg" fontWeight="bold" color="#ffffff">
                      {formatBalance(typeof walletInfo.balance === 'number' ? walletInfo.balance : 0)} {walletInfo.type === 'Stacks' ? 'STX' : 'BTC'}
                    </Text>
                  </VStack>
                  <VStack align="end" gap={1}>
                    <Badge colorScheme="green" fontSize="xs">Connected</Badge>
                    <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                      {walletInfo.address?.slice(0, 6)}...{walletInfo.address?.slice(-4)}
                    </Text>
                  </VStack>
                </HStack>

                {walletInfo.loading && (
                  <Box>
                    <Text fontSize="sm" color="#9ca3af" mb={2}>Loading balance...</Text>
                    <Box w="100%" h="4px" bg="rgba(255, 255, 255, 0.1)" borderRadius="2px" overflow="hidden">
                      <Box w="100%" h="100%" bg="#3b82f6" borderRadius="2px" animation="pulse 1.5s ease-in-out infinite" />
                    </Box>
                  </Box>
                )}
              </VStack>
            </UniformCard>
          )}

          {/* Quick Stats */}
          {!loading && (
            <VStack gap={4} align="stretch">
              <Heading size="lg" color="#ffffff" textAlign="center">
                Your Statistics
              </Heading>
              
              <VStack gap={4} align="stretch">
                <HStack gap={4} align="stretch">
                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#3b82f6">
                        {stats.totalPayments}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Total Payments
                      </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#10b981">
                        {stats.totalVolume.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Total Volume
                      </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#f59e0b">
                        {stats.activePayments}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Active Payments
                      </Text>
                    </VStack>
                  </UniformCard>
                </HStack>
              </VStack>
            </VStack>
          )}

          {/* Loading State */}
          {loading && (
            <VStack gap={4} align="stretch">
              <Skeleton height="100px" borderRadius="lg" />
              <HStack gap={4} align="stretch">
                <Skeleton height="80px" flex="1" borderRadius="lg" />
                <Skeleton height="80px" flex="1" borderRadius="lg" />
                <Skeleton height="80px" flex="1" borderRadius="lg" />
              </HStack>
            </VStack>
          )}

          {/* Features Grid */}
          <VStack gap={6} align="stretch">
            <Heading size="lg" color="#ffffff" textAlign="center">
              Platform Features
            </Heading>
            
            <VStack gap={4} align="stretch">
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack gap={3} align="center">
                    <Text fontSize="2xl">💳</Text>
                    <VStack align="start" gap={1}>
                      <Heading size="md" color="#ffffff">Payment Links</Heading>
                      <Text fontSize="sm" color="#9ca3af">
                        Create secure payment links for Bitcoin and STX transactions
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={3} justify="center">
                    <Link to="/generate" style={{ textDecoration: 'none' }}>
                      <UniformButton variant="primary" size="md">
                        Create Payment
                      </UniformButton>
                    </Link>
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                      <UniformButton variant="secondary" size="md">
                        View Dashboard
                      </UniformButton>
                    </Link>
                  </HStack>
                </VStack>
              </UniformCard>

              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack gap={3} align="center">
                    <Text fontSize="2xl">🤖</Text>
                    <VStack align="start" gap={1}>
                      <Heading size="md" color="#ffffff">AI Contract Builder</Heading>
                      <Text fontSize="sm" color="#9ca3af">
                        Generate smart contracts from natural language descriptions
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Link to="/ai-builder" style={{ textDecoration: 'none' }}>
                    <UniformButton variant="primary" size="md" w="full">
                      Build Contract
                    </UniformButton>
                  </Link>
                </VStack>
              </UniformCard>

              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack gap={3} align="center">
                    <Text fontSize="2xl">🌉</Text>
                    <VStack align="start" gap={1}>
                      <Heading size="md" color="#ffffff">Cross-Chain Bridge</Heading>
                      <Text fontSize="sm" color="#9ca3af">
                        Bridge Bitcoin and STX tokens across blockchain networks
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Link to="/bridge" style={{ textDecoration: 'none' }}>
                    <UniformButton variant="primary" size="md" w="full">
                      Bridge Assets
                    </UniformButton>
                  </Link>
                </VStack>
              </UniformCard>
            </VStack>
          </VStack>

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  Recent Activity
                </Heading>
                
                <VStack gap={3} align="stretch">
                  {stats.recentActivity.map((activity, index) => (
                    <HStack key={index} justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                          {activity.description || 'Payment'}
                        </Text>
                        <Text fontSize="xs" color="#9ca3af">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      
                      <VStack align="end" gap={1}>
                        <Text fontSize="sm" fontWeight="bold" color="#ffffff">
                          {activity.amount} {activity.paymentType}
                        </Text>
                        <Badge 
                          colorScheme={activity.status === 'completed' ? 'green' : activity.status === 'pending' ? 'yellow' : 'gray'}
                          fontSize="xs"
                        >
                          {activity.status}
                        </Badge>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </UniformCard>
          )}

          {/* Quick Start */}
          {!isAuthenticated && !btcConnected && (
            <UniformCard p={6} textAlign="center">
              <VStack gap={4}>
                <Heading size="md" color="#ffffff">
                  Get Started
                </Heading>
                <Text color="#9ca3af">
                  Connect your wallet to start creating payment links and managing transactions.
                </Text>
                <UniformButton variant="primary" onClick={connect} size="lg">
                  Connect Wallet
                </UniformButton>
              </VStack>
            </UniformCard>
          )}

          {/* Payment Generator */}
          {(isAuthenticated || btcConnected) && (
            <UniformCard p={6}>
              <VStack gap={4}>
                <Heading size="md" color="#ffffff">
                  Create Payment Link
                </Heading>
                <PaymentLinkGenerator />
              </VStack>
            </UniformCard>
          )}
        </VStack>
      </Container>
    </Box>
  );
}