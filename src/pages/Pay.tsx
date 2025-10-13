import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Heading, Text, VStack, HStack, Badge, Button, Skeleton, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useToast } from '../hooks/useToast';
import { UniformButton } from '../components/UniformButton';
import { UniformCard } from '../components/UniformCard';
import { paymentStorage } from '../services/paymentStorage';

interface PaymentData {
  id: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'expired';
  merchant: string;
  paymentType: 'STX' | 'BTC';
  createdAt: string;
}

export default function Pay() {
  const { id: paymentId } = useParams<{ id: string }>();
  const { isAuthenticated, address, connect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, connect: connectBTC } = useBitcoinWallet();
  const { toast } = useToast();
  
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProgress, setPaymentProgress] = useState(0);

  // Check if current user is the merchant (creator of the payment link)
  const isMerchant = payment && (
    (isAuthenticated && address === payment.merchant) ||
    (btcConnected && btcAddress === payment.merchant)
  );

  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) {
        setError('Payment ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try to get payment from local storage first
        const allPayments = paymentStorage.getAllPaymentLinks();
        const foundPayment = allPayments.find(p => p.id === paymentId);
        
        if (foundPayment) {
          const paymentData: PaymentData = {
            id: foundPayment.id,
            amount: parseFloat(foundPayment.amount),
            description: foundPayment.description || 'Payment',
            status: foundPayment.status as 'pending' | 'paid' | 'expired',
            merchant: foundPayment.merchantAddress || 'unknown',
            paymentType: foundPayment.paymentType || 'STX',
            createdAt: new Date(foundPayment.createdAt).toISOString()
          };
          setPayment(paymentData);
        } else {
          // Simulate fetching from server
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockPayment: PaymentData = {
            id: paymentId,
            amount: 10.5,
            description: 'Sample payment for services',
            status: 'pending',
            merchant: 'merchant-address',
            paymentType: 'STX',
            createdAt: new Date().toISOString()
          };
          
          setPayment(mockPayment);
        }
      } catch (err) {
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  const handlePayment = async () => {
    if (!payment) {
      toast({ title: 'Error', status: 'error', description: 'Payment details not loaded' });
      return;
    }

    // Check wallet connection based on payment type
    if (payment.paymentType === 'STX' && !isAuthenticated) {
      toast({ title: 'Wallet Required', status: 'warning', description: 'Please connect your Stacks wallet first' });
      connect();
      return;
    }

    if (payment.paymentType === 'BTC' && !btcConnected) {
      toast({ title: 'Wallet Required', status: 'warning', description: 'Please connect your Bitcoin wallet first' });
      connectBTC();
      return;
    }

    setIsPaying(true);
    setPaymentError(null);
    setPaymentProgress(0);

    try {
      if (payment.paymentType === 'STX' && isAuthenticated) {
        // Real STX payment using Stacks Connect
        const { openContractCall } = await import('@stacks/connect');
        const { stacksNetwork } = await import('../config/stacksConfig');
        const network = stacksNetwork;
        
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
        const contractName = process.env.REACT_APP_CONTRACT_NAME || 'chainlink-pay';
        
        if (!contractAddress || contractAddress === 'ST000000000000000000002AMW42H') {
          throw new Error('Contract not deployed. Please deploy the contract first.');
        }

        // Generate payment ID buffer
        const paymentId = payment.id;
        // Create a 32-byte buffer for the payment ID
        const idBuffer = new Uint8Array(32);
        const paymentIdBytes = new TextEncoder().encode(paymentId);
        idBuffer.set(paymentIdBytes.slice(0, 32));
        
        // Mark payment as paid on-chain
        await openContractCall({
          contractAddress,
          contractName,
          functionName: 'mark-paid',
          functionArgs: [
            { type: 'buff', value: idBuffer }
          ] as any,
          network,
          onFinish: (data) => {
            console.log('Payment transaction finished:', data);
            
            // Update payment status
            setPayment(prev => prev ? { ...prev, status: 'paid' } : null);
            
            // Update in storage
            const allPayments = paymentStorage.getAllPaymentLinks();
            const updatedPayments = allPayments.map(p => 
              p.id === payment.id ? { ...p, status: 'paid' as const } : p
            );
            paymentStorage.saveAllPaymentLinks(updatedPayments);
            
            toast({ 
              title: 'Success', 
              status: 'success', 
              description: `Payment completed! TX: ${data.txId.slice(0, 8)}...` 
            });
          },
          onCancel: () => {
            toast({ title: 'Cancelled', status: 'warning', description: 'Payment was cancelled' });
          }
        });
        
      } else if (payment.paymentType === 'BTC' && btcConnected) {
        // For BTC payments, we'll simulate for now since we need Bitcoin wallet integration
        // In a real implementation, this would use the Bitcoin wallet to send BTC
        const progressInterval = setInterval(() => {
          setPaymentProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 20;
          });
        }, 500);

        // Simulate BTC payment processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        clearInterval(progressInterval);
        setPaymentProgress(100);

        // Update payment status
        setPayment(prev => prev ? { ...prev, status: 'paid' } : null);
        
        // Update in storage
        const allPayments = paymentStorage.getAllPaymentLinks();
        const updatedPayments = allPayments.map(p => 
          p.id === payment.id ? { ...p, status: 'paid' as const } : p
        );
        paymentStorage.saveAllPaymentLinks(updatedPayments);
        
        toast({ title: 'Success', status: 'success', description: 'BTC Payment completed successfully!' });
      } else {
        throw new Error('Invalid payment type or wallet not connected');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
      toast({ title: 'Error', status: 'error', description: err.message || 'Payment failed' });
    } finally {
      setIsPaying(false);
      setPaymentProgress(0);
    }
  };

  const getWalletStatus = () => {
    if (payment?.paymentType === 'STX') {
      return {
        connected: isAuthenticated,
        address: address,
        connect: connect,
        type: 'Stacks'
      };
    }
    if (payment?.paymentType === 'BTC') {
      return {
        connected: btcConnected,
        address: btcAddress,
        connect: connectBTC,
        type: 'Bitcoin'
      };
    }
    return null;
  };

  const walletStatus = getWalletStatus();

  if (loading) {
    return (
      <Box minH="100vh" bg="#000000" color="#ffffff">
        <Container maxW="md" py={10}>
          <VStack gap={4} align="stretch">
            <Skeleton height="40px" width="80%" />
            <Skeleton height="20px" width="60%" />
            <Skeleton height="20px" width="70%" />
            <Skeleton height="20px" width="50%" />
            <Skeleton height="50px" />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="#000000" color="#ffffff">
        <Container maxW="md" py={10}>
          <UniformCard p={6}>
            <VStack gap={4} textAlign="center">
              <Text fontSize="4xl">❌</Text>
              <Heading size="md" color="#ef4444">Error</Heading>
              <Text color="#9ca3af">{error}</Text>
            </VStack>
          </UniformCard>
        </Container>
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box minH="100vh" bg="#000000" color="#ffffff">
        <Container maxW="md" py={10}>
          <UniformCard p={6}>
            <VStack gap={4} textAlign="center">
              <Text fontSize="4xl">🔍</Text>
              <Heading size="md" color="#ffffff">Payment Not Found</Heading>
              <Text color="#9ca3af">The payment link is invalid or does not exist.</Text>
            </VStack>
          </UniformCard>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Container maxW="md" py={10}>
        <UniformCard p={6}>
          <VStack gap={6} align="stretch">
            {/* Header */}
            <VStack gap={2} textAlign="center">
              <Heading size="lg" color="#ffffff">Payment Details</Heading>
              <Text color="#9ca3af">Complete your payment securely</Text>
            </VStack>

            {/* Payment Information */}
            <VStack gap={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="#9ca3af">Payment ID</Text>
                <Text fontSize="sm" color="#ffffff" fontFamily="mono">
                  {payment.id}
                </Text>
              </HStack>

              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="#9ca3af">Amount</Text>
                <Text fontSize="xl" fontWeight="bold" color="#10b981">
                  {payment.amount} {payment.paymentType}
                </Text>
              </HStack>

              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="#9ca3af">Description</Text>
                <Text fontSize="sm" color="#ffffff">
                  {payment.description}
                </Text>
              </HStack>

              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="#9ca3af">Status</Text>
                <Badge 
                  colorScheme={payment.status === 'paid' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'}
                  fontSize="sm"
                >
                  {payment.status.toUpperCase()}
                </Badge>
              </HStack>
            </VStack>

            {/* Wallet Status */}
            {walletStatus && (
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                  {walletStatus.type} Wallet Status
                </Text>
                
                <HStack justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                  <HStack gap={2} align="center">
                    <Text fontSize="sm" color="#ffffff">{walletStatus.type} Wallet</Text>
                    <Badge colorScheme={walletStatus.connected ? 'green' : 'red'} fontSize="xs">
                      {walletStatus.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </HStack>
                  {walletStatus.address && (
                    <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                      {walletStatus.address.slice(0, 6)}...{walletStatus.address.slice(-4)}
                    </Text>
                  )}
                </HStack>
              </VStack>
            )}

            {/* Payment Progress */}
            {isPaying && (
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="#ffffff" textAlign="center">
                  Processing Payment...
                </Text>
                <Box w="100%" h="8px" bg="rgba(255, 255, 255, 0.1)" borderRadius="4px" overflow="hidden">
                  <Box 
                    w={`${paymentProgress}%`} 
                    h="100%" 
                    bg="#3b82f6" 
                    borderRadius="4px" 
                    transition="width 0.3s ease"
                  />
                </Box>
                <Text fontSize="xs" color="#9ca3af" textAlign="center">
                  {paymentProgress}% Complete
                </Text>
              </VStack>
            )}

            {/* Payment Error */}
            {paymentError && (
              <AlertRoot status="error">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>Payment Failed!</AlertTitle>
                  <AlertDescription>{paymentError}</AlertDescription>
                </AlertContent>
              </AlertRoot>
            )}

            {/* Payment Button - Only show for customers, not merchants */}
            {!isMerchant ? (
              <UniformButton
                variant="primary"
                onClick={handlePayment}
                loading={isPaying}
                disabled={payment.status === 'paid' || !walletStatus?.connected}
                size="lg"
              >
                {payment.status === 'paid' ? 'Payment Completed' : isPaying ? 'Processing Payment...' : 'Pay Now'}
              </UniformButton>
            ) : (
              <VStack gap={3} align="stretch">
                <AlertRoot status="info">
                  <AlertIndicator />
                  <AlertContent>
                    <AlertTitle>You created this payment link</AlertTitle>
                    <AlertDescription>
                      Share this link with your customers to receive payments. You cannot pay yourself.
                    </AlertDescription>
                  </AlertContent>
                </AlertRoot>
                
                <UniformButton
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  size="lg"
                >
                  📋 Copy Payment Link
                </UniformButton>
              </VStack>
            )}

            {/* Wallet Connection Required */}
            {walletStatus && !walletStatus.connected && (
              <AlertRoot status="warning">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>{walletStatus.type} Wallet Required</AlertTitle>
                  <AlertDescription>
                    Please connect your {walletStatus.type} wallet to make a payment.
                  </AlertDescription>
                </AlertContent>
              </AlertRoot>
            )}

            {/* Payment Status Info */}
            {payment.status === 'paid' && (
              <AlertRoot status="success">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>Payment Completed!</AlertTitle>
                  <AlertDescription>
                    Your payment has been processed successfully.
                  </AlertDescription>
                </AlertContent>
              </AlertRoot>
            )}
          </VStack>
        </UniformCard>
      </Container>
    </Box>
  );
}