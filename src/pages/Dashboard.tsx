import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Flex, Heading, Text, Badge, VStack, HStack, Grid, IconButton, AlertRoot, AlertContent, AlertIndicator, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useStxBalance } from '../hooks/useStxBalance';
import { paymentStorage, PaymentLink, PaymentStats } from '../services/paymentStorage';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { address, isAuthenticated } = useStacksWallet();
  const { balance, loading: balanceLoading } = useStxBalance(address);
  const { toast } = useToast();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalLinks: 0,
    totalPaid: 0,
    totalPending: 0,
    totalExpired: 0,
    totalVolume: 0
  });
  const [loading, setLoading] = useState(true);

  // Load real payment data
  useEffect(() => {
    if (!isAuthenticated || !address) {
      setLoading(false);
      return;
    }

    // Check for expired links
    paymentStorage.checkExpiredLinks();

    // Load payment links and stats
    const links = paymentStorage.getPaymentLinks(address);
    const paymentStats = paymentStorage.getPaymentStats(address);
    
    setPaymentLinks(links);
    setStats(paymentStats);
    setLoading(false);
  }, [isAuthenticated, address]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && address) {
        const links = paymentStorage.getPaymentLinks(address);
        const paymentStats = paymentStorage.getPaymentStats(address);
        setPaymentLinks(links);
        setStats(paymentStats);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, address]);

  // Add refresh function for manual refresh
  const refreshData = () => {
    if (!isAuthenticated || !address) return;
    
    paymentStorage.checkExpiredLinks();
    const links = paymentStorage.getPaymentLinks(address);
    const paymentStats = paymentStorage.getPaymentStats(address);
    setPaymentLinks(links);
    setStats(paymentStats);
  };

  // Format time remaining
  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: PaymentLink['status']) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'blue';
      case 'expired': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  // Delete payment link
  const handleDelete = (id: string) => {
    paymentStorage.deletePaymentLink(id);
    const updatedLinks = paymentStorage.getPaymentLinks(address!);
    const updatedStats = paymentStorage.getPaymentStats(address!);
    setPaymentLinks(updatedLinks);
    setStats(updatedStats);
    toast({ title: 'Payment link deleted', status: 'success' });
  };

  if (!isAuthenticated || !address) {
  return (
      <Container maxW="6xl" py={10}>
        <VStack gap={6} textAlign="center">
          <Heading size="lg" color="red.600">Wallet Required</Heading>
          <Text color="gray.600">Please connect your wallet to view your dashboard</Text>
        </VStack>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="6xl" py={10}>
            <VStack gap={6}>
          <Text>Loading your dashboard...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Box 
      minH="100vh" 
      overflowX="hidden"
      bg="#0a0a0a"
      backgroundImage="radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)"
    >
      <Container maxW="6xl" py={{ base: 4, md: 10 }} px={{ base: 4, md: 6 }}>
        <VStack gap={{ base: 4, md: 8 }} align="stretch">
        {/* Header */}
        <VStack gap={4} textAlign="center">
          <HStack gap={4} align="center">
            <Heading 
              size={{ base: "xl", md: "2xl" }} 
              bg="linear-gradient(135deg, #00d4ff 0%, #ffffff 100%)"
              bgClip="text"
              fontWeight="bold"
            >
              Dashboard
            </Heading>
            <Button 
              size="sm" 
              bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
              color="white"
              border="none"
              borderRadius="xl"
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4)'
              }}
              onClick={refreshData}
            >
              🔄 Refresh
            </Button>
          </HStack>
          <Text fontSize={{ base: "sm", md: "lg" }} color="#a0a0a0" px={{ base: 4, md: 0 }}>
            Manage your payment links and track your earnings
          </Text>
        </VStack>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={{ base: 3, md: 4 }}>
          <Box 
            bg="rgba(30, 30, 30, 0.8)" 
            backdropFilter="blur(10px)"
            p={{ base: 4, md: 6 }} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor="rgba(0, 212, 255, 0.3)"
            shadow="0 8px 32px rgba(0, 0, 0, 0.3)"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
              borderColor: 'rgba(0, 212, 255, 0.5)'
            }}
            transition="all 0.3s ease"
          >
            <VStack gap={2}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="#00d4ff">{stats.totalLinks}</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="#a0a0a0" textAlign="center">Total Links</Text>
            </VStack>
          </Box>
          
          <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" borderWidth="2px" borderColor="green.200" shadow="lg">
            <VStack gap={2}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="green.600">{stats.totalPaid}</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" textAlign="center">Paid</Text>
        </VStack>
          </Box>
          
          <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" borderWidth="2px" borderColor="orange.200" shadow="lg">
            <VStack gap={2}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="orange.600">{stats.totalPending}</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" textAlign="center">Pending</Text>
            </VStack>
          </Box>
          
          <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" borderWidth="2px" borderColor="purple.200" shadow="lg">
            <VStack gap={2}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="purple.600">{stats.totalVolume.toFixed(2)}</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" textAlign="center">STX Earned</Text>
            </VStack>
          </Box>
        </Grid>

        {/* Wallet Info */}
        <Box bg="white" p={6} borderRadius="xl" borderWidth="2px" borderColor="gray.200" shadow="lg">
          <VStack gap={4}>
            <Heading size="md" color="gray.700">Wallet Information</Heading>
            <HStack gap={4} wrap="wrap" justify="center">
              <VStack gap={1}>
                <Text fontSize="sm" color="gray.500">Address</Text>
                <Text fontSize="sm" fontFamily="mono" color="blue.600">
                  {address.slice(0, 8)}...{address.slice(-4)}
                </Text>
              </VStack>
              <VStack gap={1}>
                <Text fontSize="sm" color="gray.500">Balance</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.600">
                  {balanceLoading ? '...' : `${(Number(balance || '0') / 1_000_000).toFixed(2)} STX`}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Payment Links */}
        <Box bg="white" p={6} borderRadius="xl" borderWidth="2px" borderColor="gray.200" shadow="lg">
          <VStack gap={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Heading size="md" color="gray.700">Payment Links</Heading>
              <Link to="/">
                <Button colorScheme="blue" size="sm">
                  Create New Link
                </Button>
              </Link>
            </Flex>

            {paymentLinks.length === 0 ? (
              <AlertRoot status="info" borderRadius="lg">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>No payment links yet</AlertTitle>
                  <AlertDescription>
                    <Text fontSize="sm">Create your first payment link to start receiving payments</Text>
                    <Link to="/">
                      <Button colorScheme="blue" size="sm" mt={2}>
                        Create Payment Link
                      </Button>
                    </Link>
                  </AlertDescription>
                </AlertContent>
              </AlertRoot>
            ) : (
              <VStack gap={4} align="stretch">
                {paymentLinks.map((link) => (
                  <Box key={link.id} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                    <VStack gap={3} align="stretch">
                      <HStack justify="space-between" wrap="wrap">
                        <VStack align="start" gap={1}>
                          <Text fontSize="xs" color="gray.500">Payment ID</Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} fontFamily="mono" color="gray.600">
                            {link.id.slice(0, 8)}...
                          </Text>
                        </VStack>
                        <VStack align="end" gap={1}>
                          <Text fontSize="xs" color="gray.500">Amount</Text>
                          <Text fontWeight="bold" color="blue.600" fontSize={{ base: "xs", md: "sm" }}>
                            {link.amount} STX
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack justify="space-between" wrap="wrap">
                        <VStack align="start" gap={1}>
                          <Text fontSize="xs" color="gray.500">Status</Text>
                          <Badge colorScheme={getStatusColor(link.status)} fontSize={{ base: "xs", md: "sm" }}>
                            {link.status.toUpperCase()}
                          </Badge>
                        </VStack>
                        <VStack align="end" gap={1}>
                          <Text fontSize="xs" color="gray.500">Created</Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(link.createdAt)}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      {link.description && (
                        <VStack align="start" gap={1}>
                          <Text fontSize="xs" color="gray.500">Description</Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                            {link.description}
                          </Text>
                        </VStack>
                      )}
                      
                      {link.expiresAt && (
                        <HStack justify="space-between" wrap="wrap">
                          <Text fontSize="xs" color="gray.500">Expires</Text>
                          <Text fontSize="xs" color={Date.now() > link.expiresAt ? "red.500" : "gray.500"}>
                            {getTimeRemaining(link.expiresAt)}
                          </Text>
                        </HStack>
                      )}
                      
                      <HStack gap={2} justify="flex-end">
                        <Link to={`/pay/${link.id}`}>
                          <Button size={{ base: "xs", md: "sm" }} colorScheme="blue" variant="outline">
                            View
                          </Button>
                        </Link>
                        {link.status === 'pending' && (
                          <IconButton
                            size={{ base: "xs", md: "sm" }}
                            colorScheme="red"
                            variant="outline"
                            aria-label="Delete"
                            onClick={() => handleDelete(link.id)}
                          >
                            🗑️
                          </IconButton>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Quick Actions */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          <Link to="/">
            <Box bg="blue.50" p={6} borderRadius="xl" borderWidth="2px" borderColor="blue.200" shadow="lg" cursor="pointer" _hover={{ bg: "blue.100" }}>
              <VStack gap={2}>
                <Text fontSize="2xl">🔗</Text>
                <Text fontWeight="bold" color="blue.600">Create Payment Link</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">Generate a new payment link</Text>
              </VStack>
            </Box>
          </Link>
          
          <Link to="/ai-contract-builder">
            <Box bg="purple.50" p={6} borderRadius="xl" borderWidth="2px" borderColor="purple.200" shadow="lg" cursor="pointer" _hover={{ bg: "purple.100" }}>
              <VStack gap={2}>
                <Text fontSize="2xl">🤖</Text>
                <Text fontWeight="bold" color="purple.600">AI Contract Builder</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">Generate smart contracts with AI</Text>
              </VStack>
            </Box>
          </Link>
        </Grid>
      </VStack>
    </Container>
    </Box>
  );
}