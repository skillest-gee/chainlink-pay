import React, { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Badge, Button, Skeleton, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import { paymentStorage, PaymentLink } from '../services/paymentStorage';
import { crossDeviceSync } from '../services/crossDeviceSync';
import { UniformCard } from '../components/UniformCard';
import { UniformButton } from '../components/UniformButton';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalPayments: number;
  totalVolume: number;
  activePayments: number;
  completedPayments: number;
  stxPayments: number;
  btcPayments: number;
  averagePayment: number;
  recentPayments: PaymentLink[];
  monthlyStats: {
    current: number;
    previous: number;
    growth: number;
  };
}

export default function Dashboard() {
  const { isAuthenticated, address } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, balance: btcBalance } = useBitcoinWallet();
  const { balance: stxBalance, loading: balanceLoading } = useStxBalance(address);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    totalVolume: 0,
    activePayments: 0,
    completedPayments: 0,
    stxPayments: 0,
    btcPayments: 0,
    averagePayment: 0,
    recentPayments: [],
    monthlyStats: {
      current: 0,
      previous: 0,
      growth: 0
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to verify pending payments against blockchain using cross-device sync
  const verifyPendingPayments = async (allPayments: PaymentLink[]) => {
    try {
      const pendingPayments = allPayments.filter(p => p.status === 'pending' && p.txHash);
      
      if (pendingPayments.length === 0) return;
      
      console.log(`Dashboard: Verifying ${pendingPayments.length} pending payments using cross-device sync...`);
      
      // Use cross-device sync service to check all pending payments
      await crossDeviceSync.performCrossDeviceSync();
      
      console.log('Dashboard: Cross-device sync completed for pending payments verification');
    } catch (error) {
      console.error('Dashboard: Failed to verify pending payments:', error);
    }
  };

  const loadStats = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // Only load data if wallet is connected
      if (!isAuthenticated && !btcConnected) {
        setStats({
          totalPayments: 0,
          totalVolume: 0,
          activePayments: 0,
          completedPayments: 0,
          stxPayments: 0,
          btcPayments: 0,
          averagePayment: 0,
          recentPayments: [],
          monthlyStats: {
            current: 0,
            previous: 0,
            growth: 0
          }
        });
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const allPayments = paymentStorage.getAllPaymentLinks();
      
      // Verify payment statuses against blockchain for pending payments
      await verifyPendingPayments(allPayments);
      
      // Filter payments for the connected wallet only
      const currentAddress = isAuthenticated ? address : btcAddress;
      const userPayments = allPayments.filter(payment => 
        payment.merchantAddress === currentAddress || 
        payment.payerAddress === currentAddress
      );
      
      // Calculate comprehensive statistics for this wallet only
      const totalPayments = userPayments.length;
      const totalVolume = userPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const activePayments = userPayments.filter(p => p.status === 'pending').length;
      const completedPayments = userPayments.filter(p => p.status === 'paid').length;
      const stxPayments = userPayments.filter(p => p.paymentType === 'STX').length;
      const btcPayments = userPayments.filter(p => p.paymentType === 'BTC').length;
      const averagePayment = totalPayments > 0 ? totalVolume / totalPayments : 0;
      
      // Get recent payments (last 10) for this wallet
      const recentPayments = userPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      // Calculate monthly growth for this wallet
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthPayments = userPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      });
      
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const previousMonthPayments = userPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === previousMonth && paymentDate.getFullYear() === previousYear;
      });
      
      const currentVolume = currentMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const previousVolume = previousMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const growth = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;

      setStats({
        totalPayments,
        totalVolume,
        activePayments,
        completedPayments,
        stxPayments,
        btcPayments,
        averagePayment,
        recentPayments,
        monthlyStats: {
          current: currentVolume,
          previous: previousVolume,
          growth
        }
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  // Listen for wallet state changes and payment updates
  useEffect(() => {
    const handleWalletChange = () => {
      console.log('Dashboard: Wallet state changed, reloading stats');
      loadStats();
    };

    const handlePaymentUpdate = (event: CustomEvent) => {
      console.log('Dashboard: Payment update received', event.detail);
      // Refresh dashboard data when payments are updated
      setTimeout(() => {
        console.log('Dashboard: Refreshing after payment update');
        loadStats();
      }, 100);
    };

    window.addEventListener('walletConnected', handleWalletChange);
    window.addEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
    window.addEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
    window.addEventListener('merchantPaymentUpdate', handlePaymentUpdate as EventListener);
    window.addEventListener('paymentStatusAPIUpdate', handlePaymentUpdate as EventListener);
    window.addEventListener('crossDevicePaymentUpdate', handlePaymentUpdate as EventListener);
    window.addEventListener('walletDisconnected', handleWalletChange);

    return () => {
      window.removeEventListener('walletConnected', handleWalletChange);
      window.removeEventListener('walletDisconnected', handleWalletChange);
      window.removeEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
      window.removeEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
      window.removeEventListener('merchantPaymentUpdate', handlePaymentUpdate as EventListener);
      window.removeEventListener('paymentStatusAPIUpdate', handlePaymentUpdate as EventListener);
      window.removeEventListener('crossDevicePaymentUpdate', handlePaymentUpdate as EventListener);
    };
  }, []);

  // Auto-refresh dashboard every 5 seconds to catch payment updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isAuthenticated || btcConnected) {
        console.log('Dashboard: Auto-refreshing stats with cross-device sync');
        // Force immediate sync for demo, then load stats
        await crossDeviceSync.forceImmediateSync();
        await crossDeviceSync.performCrossDeviceSync();
        loadStats();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, btcConnected]);

  // Listen for payment completion events
  useEffect(() => {
    const handlePaymentUpdate = (event: CustomEvent) => {
      console.log('Dashboard: Payment update received', event.detail);
      // Immediate refresh when payment is updated
      setTimeout(() => {
        console.log('Dashboard: Immediate refresh after payment update');
        loadStats();
      }, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
    window.addEventListener('paymentUpdated', handlePaymentUpdate as EventListener);

    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
      window.removeEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
    };
  }, []);

  const formatBalance = (balance: number | string | null) => {
    if (balance === null) return '0.00';
    
    let stxBalance: number;
    if (typeof balance === 'string') {
      stxBalance = parseInt(balance) / 1000000; // Convert microSTX to STX
    } else {
      stxBalance = balance;
    }
    
    return stxBalance.toFixed(6);
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
          {/* Header */}
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading size="xl" color="#ffffff">
                Dashboard
              </Heading>
              <HStack gap={3}>
                <UniformButton
                  variant="ghost"
                  size="sm"
                  onClick={loadStats}
                  isLoading={refreshing}
                  loadingText="Refreshing..."
                >
                  🔄 Refresh
                </UniformButton>
                <Link to="/generate" style={{ textDecoration: 'none' }}>
                  <UniformButton variant="primary" size="sm">
                    Create Payment
                  </UniformButton>
                </Link>
              </HStack>
            </HStack>
            
            {/* Wallet Status */}
            {walletInfo && (
              <HStack justify="space-between" align="center" p={4} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                <HStack gap={3} align="center">
                  <Badge colorScheme={walletInfo.type === 'Stacks' ? 'blue' : 'orange'} fontSize="sm">
                    {walletInfo.type}
                  </Badge>
                  <Text fontSize="sm" color="#ffffff" fontFamily="mono">
                    {walletInfo.address?.slice(0, 6)}...{walletInfo.address?.slice(-4)}
                  </Text>
                </HStack>
                <VStack align="end" gap={1}>
                  <Text fontSize="lg" fontWeight="bold" color="#10b981">
                    {formatBalance(walletInfo.balance)} {walletInfo.type === 'Stacks' ? 'STX' : 'BTC'}
                  </Text>
                  {walletInfo.loading && (
                    <Text fontSize="xs" color="#9ca3af">Loading balance...</Text>
                  )}
                </VStack>
              </HStack>
            )}
          </VStack>

          {/* Wallet Connection Check */}
          {!isAuthenticated && !btcConnected && (
            <UniformCard p={8}>
              <VStack gap={4} align="center" textAlign="center">
                <Text fontSize="2xl">🔗</Text>
                <Heading size="lg" color="#ffffff">
                  Connect Your Wallet
                </Heading>
                <Text color="#9ca3af" maxW="md">
                  Connect your Stacks or Bitcoin wallet to view your dashboard, create payment links, and manage transactions.
                </Text>
                <HStack gap={3}>
                  <Link to="/" style={{ textDecoration: 'none' }}>
                    <UniformButton variant="primary" size="md">
                      Connect Wallet
                    </UniformButton>
                  </Link>
                </HStack>
              </VStack>
            </UniformCard>
          )}

          {/* Error Display */}
          {error && (
            <AlertRoot status="error">
              <AlertIndicator />
              <AlertContent>
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </AlertRoot>
          )}

          {/* Main Statistics - Only show when wallet is connected */}
          {!loading && (isAuthenticated || btcConnected) && (
            <VStack gap={6} align="stretch">
              <Heading size="lg" color="#ffffff">
                Overview Statistics
              </Heading>
              
              <VStack gap={4} align="stretch">
                {/* Primary Stats */}
                <HStack gap={4} align="stretch">
                  <UniformCard p={6} flex="1">
                    <VStack align="center" gap={3}>
                      <Text fontSize="3xl" fontWeight="bold" color="#3b82f6">
                        {stats.totalPayments}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Total Payments
                      </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={6} flex="1">
                    <VStack align="center" gap={3}>
                      <Text fontSize="3xl" fontWeight="bold" color="#10b981">
                        {stats.totalVolume.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Total Volume
        </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={6} flex="1">
                    <VStack align="center" gap={3}>
                      <Text fontSize="3xl" fontWeight="bold" color="#f59e0b">
                        {stats.activePayments}
                      </Text>
                      <Text fontSize="sm" color="#9ca3af" textAlign="center">
                        Active Payments
        </Text>
                    </VStack>
                  </UniformCard>
                </HStack>

                {/* Secondary Stats */}
                <HStack gap={4} align="stretch">
                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#8b5cf6">
                        {stats.completedPayments}
                      </Text>
                      <Text fontSize="xs" color="#9ca3af" textAlign="center">
                        Completed
        </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#06b6d4">
                        {stats.stxPayments}
                      </Text>
                      <Text fontSize="xs" color="#9ca3af" textAlign="center">
                        STX Payments
        </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#f97316">
                        {stats.btcPayments}
                      </Text>
                      <Text fontSize="xs" color="#9ca3af" textAlign="center">
                        BTC Payments
                      </Text>
                    </VStack>
                  </UniformCard>

                  <UniformCard p={4} flex="1">
                    <VStack align="center" gap={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="#84cc16">
                        {stats.averagePayment.toFixed(2)}
              </Text>
                      <Text fontSize="xs" color="#9ca3af" textAlign="center">
                        Avg Payment
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

          {/* Monthly Growth */}
          {!loading && (
            <UniformCard p={6}>
      <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  Monthly Performance
                </Heading>
                
                <VStack gap={3} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Current Month</Text>
                    <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                      {stats.monthlyStats.current.toFixed(2)} Volume
                    </Text>
            </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Previous Month</Text>
                    <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                      {stats.monthlyStats.previous.toFixed(2)} Volume
          </Text>
                  </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Growth Rate</Text>
                    <Badge 
                      colorScheme={stats.monthlyStats.growth >= 0 ? 'green' : 'red'} 
                      fontSize="sm"
                    >
                      {stats.monthlyStats.growth >= 0 ? '+' : ''}{stats.monthlyStats.growth.toFixed(1)}%
          </Badge>
          </HStack>
        </VStack>
      </VStack>
            </UniformCard>
          )}

          {/* Recent Payments */}
          {!loading && (
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="md" color="#ffffff">
                    Recent Payments
                  </Heading>
                  <Link to="/generate" style={{ textDecoration: 'none' }}>
                    <UniformButton variant="ghost" size="sm">
                      Create New
                    </UniformButton>
                  </Link>
                </HStack>
                
                {stats.recentPayments.length === 0 ? (
                  <VStack gap={4} py={8}>
                    <Text fontSize="4xl">💳</Text>
                    <VStack gap={2}>
                      <Heading size="md" color="#ffffff">No Payments Yet</Heading>
                      <Text color="#9ca3af" textAlign="center">
                        Create your first payment link to get started
                      </Text>
                    </VStack>
                    <Link to="/generate" style={{ textDecoration: 'none' }}>
                      <UniformButton variant="primary">
                        Create Payment Link
                      </UniformButton>
                    </Link>
                  </VStack>
                ) : (
                  <VStack gap={3} align="stretch">
                    {stats.recentPayments.map((payment, index) => (
                      <HStack key={index} justify="space-between" align="center" p={4} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                        <VStack align="start" gap={1}>
                          <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                            {payment.description || 'Payment'}
                          </Text>
                          <Text fontSize="xs" color="#9ca3af">
                            {new Date(payment.createdAt).toLocaleDateString()}
            </Text>
          </VStack>
          
                        <VStack align="end" gap={1}>
                          <Text fontSize="sm" fontWeight="bold" color="#ffffff">
                            {payment.amount} {payment.paymentType}
              </Text>
                          <Badge 
                            colorScheme={
                              payment.status === 'paid' ? 'green' : 
                              payment.status === 'pending' ? 'yellow' : 'gray'
                            }
                            fontSize="xs"
                          >
                            {payment.status}
                          </Badge>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </VStack>
            </UniformCard>
          )}

          {/* Quick Actions */}
          <UniformCard p={6}>
            <VStack gap={4} align="stretch">
              <Heading size="md" color="#ffffff">
                Quick Actions
              </Heading>
              
              <HStack gap={3} justify="center" wrap="wrap">
                <Link to="/generate" style={{ textDecoration: 'none' }}>
                  <UniformButton variant="primary" size="md">
                    💳 Create Payment
                  </UniformButton>
                </Link>
                <Link to="/ai-builder" style={{ textDecoration: 'none' }}>
                  <UniformButton variant="secondary" size="md">
                    🤖 AI Builder
                  </UniformButton>
                </Link>
                <Link to="/bridge" style={{ textDecoration: 'none' }}>
                  <UniformButton variant="accent" size="md">
                    🌉 Bridge Assets
                  </UniformButton>
                </Link>
              </HStack>
            </VStack>
          </UniformCard>
        </VStack>
      </Container>
          </Box>
  );
}