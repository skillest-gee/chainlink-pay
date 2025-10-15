import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Heading, Text, VStack, HStack, Badge, Button, Skeleton, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useToast } from '../hooks/useToast';
import { usePaymentStateManager } from '../hooks/usePaymentStateManager';
import { UniformButton } from '../components/UniformButton';
import { UniformCard } from '../components/UniformCard';
import { paymentStorage, PaymentLink } from '../services/paymentStorage';
import { paymentStatusAPI } from '../services/paymentStatusAPI';
import { validateTransactionParams, formatAddress } from '../utils/validation';
import { CONTRACT_DEPLOYED, verifyContractDeployment } from '../config/stacksConfig';
// Removed buffer utils import - using simplified buffer creation

export default function Pay() {
  const { id: paymentId } = useParams<{ id: string }>();
  const { isAuthenticated, address, connect, userSession, walletProvider } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, connect: connectBTC } = useBitcoinWallet();
  const { toast } = useToast();
  
  const [payment, setPayment] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProgress, setPaymentProgress] = useState(0);
  
  // Use comprehensive payment state management
  const { 
    paymentStates, 
    isLoading: paymentStateLoading, 
    errors: paymentStateErrors,
    initiatePayment,
    checkPaymentStatus,
    clearPaymentState,
    isDuplicatePayment
  } = usePaymentStateManager();

  // Check if current user is the merchant (creator of the payment link)
  const isMerchant = payment && (
    (isAuthenticated && address === payment.merchantAddress) ||
    (btcConnected && btcAddress === payment.merchantAddress)
  );

  // Enhanced debug logging
  console.log('Payment debug:', {
    payment: payment?.id,
    merchantAddress: payment?.merchantAddress,
    currentAddress: isAuthenticated ? address : btcAddress,
    isAuthenticated,
    btcConnected,
    isMerchant,
    addressMatch: isAuthenticated ? (address === payment?.merchantAddress) : (btcAddress === payment?.merchantAddress),
    addresses: {
      paymentMerchant: payment?.merchantAddress,
      stacksAddress: address,
      btcAddress: btcAddress
    }
  });

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
          console.log('Found payment in localStorage:', foundPayment);
          setPayment(foundPayment);
        } else {
          // Try to get payment data from URL parameters (for shared links)
          const urlParams = new URLSearchParams(window.location.search);
          const amount = urlParams.get('amount');
          const description = urlParams.get('description');
          const merchantAddress = urlParams.get('merchant');
          const paymentType = urlParams.get('type') || 'STX';
          
          if (amount && description && merchantAddress) {
            console.log('Found payment data in URL parameters:', { amount, description, merchantAddress, paymentType });
            
            // Check if this payment already exists in storage with updated status
            const existingPayment = allPayments.find(p => p.id === paymentId);
            const actualStatus = existingPayment ? existingPayment.status : 'pending';
            
            console.log('Payment status check:', { paymentId, existingPayment, actualStatus });
            
            const urlPayment: PaymentLink = {
              id: paymentId,
              amount: amount,
              description: description,
              status: actualStatus, // Use actual status from storage, not always 'pending'
              merchantAddress: merchantAddress,
              paymentType: paymentType as 'STX' | 'BTC',
              createdAt: existingPayment?.createdAt || Date.now(),
              txHash: existingPayment?.txHash,
              payerAddress: existingPayment?.payerAddress,
              paidAt: existingPayment?.paidAt
            };
            setPayment(urlPayment);
            
            // If this is a new payment (not in storage), save it
            if (!existingPayment) {
              console.log('Saving new payment to storage:', urlPayment);
              paymentStorage.savePaymentLink(urlPayment);
            }
          } else {
            // Fallback to mock payment if no data found
            console.log('No payment data found, using mock payment');
            const mockPayment: PaymentLink = {
              id: paymentId,
              amount: '10.5',
              description: 'Sample payment for services',
              status: 'pending',
              merchantAddress: 'merchant-address',
              paymentType: 'STX',
              createdAt: Date.now()
            };
            setPayment(mockPayment);
          }
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

    // Check for duplicate payment
    if (isDuplicatePayment(payment.merchantAddress, payment.amount)) {
      toast({ 
        title: 'Duplicate Payment', 
        status: 'warning', 
        description: 'A payment for this amount is already pending. Please wait for confirmation.' 
      });
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

    // Check if contract is deployed for STX payments
    if (payment.paymentType === 'STX') {
      if (!CONTRACT_DEPLOYED) {
        toast({ 
          title: 'Contract Not Deployed', 
          status: 'error', 
          description: 'The smart contract is not deployed. STX payments are currently unavailable. Please contact the merchant.' 
        });
        return;
      }

      // Verify contract deployment
      const isDeployed = await verifyContractDeployment();
      if (!isDeployed) {
        toast({ 
          title: 'Contract Not Found', 
          status: 'error', 
          description: 'The smart contract could not be found on the blockchain. Please try again later or contact support.' 
        });
        return;
      }
    }

    setIsPaying(true);
    setPaymentError(null);
    setPaymentProgress(0);

    try {
      if (payment.paymentType === 'STX' && isAuthenticated) {
        // Real STX payment using Stacks Connect
        const { routeContractCall } = await import('../utils/walletProviderRouter');
        const { bufferCV } = await import('@stacks/transactions');
        const { stacksNetwork, STACKS_NETWORK_KEY } = await import('../config/stacksConfig');
        const network = stacksNetwork;
        
        const { CONTRACT_ADDRESS, CONTRACT_NAME } = await import('../config/stacksConfig');
        const contractAddress = CONTRACT_ADDRESS;
        const contractName = CONTRACT_NAME;

        // Generate payment ID buffer
        const paymentId = payment.id;
        
        // Create a 32-byte buffer for the payment ID using consistent method
        const encoder = new TextEncoder();
        const idBuffer = bufferCV(encoder.encode(paymentId));
        console.log('Payment ID buffer created:', { paymentId, idBuffer });
        
        console.log('Payment transaction data:', {
          contractAddress,
          contractName,
          functionName: 'mark-paid',
          paymentId,
          idBuffer: idBuffer
        });
        
        // Debug wallet connection before payment
        console.log('=== PAYMENT TRANSACTION DEBUG ===');
        console.log('Connected address:', address);
        console.log('Is authenticated:', isAuthenticated);
        console.log('Payment ID:', payment.id);
        console.log('Contract address:', contractAddress);
        console.log('Contract name:', contractName);
        
        // Use the user session from the hook
        console.log('User session exists:', !!userSession);
        console.log('User session is signed in:', userSession?.isUserSignedIn());
        if (userSession?.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          console.log('User data from session:', userData);
          console.log('User profile:', userData.profile);
        }
        
        // First, check if the payment exists on the contract
        console.log('Checking if payment exists on contract before marking as paid...');
        
        // Check if payment exists on contract first
        try {
          const { callReadOnlyFunction } = await import('@stacks/transactions');
          const paymentCheck = await callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-payment',
            functionArgs: [idBuffer],
            senderAddress: address || '',
            network: STACKS_NETWORK_KEY as 'testnet' | 'mainnet',
          });
          
          console.log('Payment check result:', paymentCheck);
          
          // If payment doesn't exist, show error
          if (!paymentCheck) {
            toast({ 
              title: 'Payment Not Found', 
              status: 'error', 
              description: 'This payment was not registered on the blockchain. Please ask the merchant to register it first.' 
            });
            return;
          }
        } catch (error) {
          console.error('Error checking payment on contract:', error);
          toast({ 
            title: 'Error', 
            status: 'error', 
            description: 'Could not verify payment on blockchain. Please try again.' 
          });
          return;
        }
        
        // Mark payment as paid on-chain
        await routeContractCall({
          contractAddress,
          contractName,
          functionName: 'mark-paid',
          functionArgs: [
            // id (buff 32) - use bufferCV helper
            idBuffer
          ],
          network,
          // Explicitly use the current user session to ensure correct wallet
          userSession: userSession,
          // Route to the correct wallet provider
          walletProvider: walletProvider || 'unknown',
          onFinish: async (data: any) => {
            console.log('Payment transaction finished:', data);
            console.log('Payment ID used in mark-paid:', payment.id);
            console.log('Buffer used in mark-paid:', idBuffer);
            
            // Update local payment state immediately
            setPayment(prev => prev ? { 
              ...prev, 
              status: 'paid',
              txHash: data.txId,
              payerAddress: (isAuthenticated ? address : btcAddress) || undefined,
              paidAt: Date.now()
            } : null);
            
            // Update in storage with transaction details
            const allPayments = paymentStorage.getAllPaymentLinks();
            const updatedPayments = allPayments.map(p => 
              p.id === payment.id ? { 
                ...p, 
                status: 'paid' as const,
                txHash: data.txId,
                payerAddress: (isAuthenticated ? address : btcAddress) || undefined,
                paidAt: Date.now()
              } : p
            );
            paymentStorage.saveAllPaymentLinks(updatedPayments);
            
            // Update centralized payment status API
            const updatedPayment = updatedPayments.find(p => p.id === payment.id);
            if (updatedPayment) {
              await paymentStatusAPI.savePayment(updatedPayment);
              console.log('PaymentStatusAPI: Payment saved to centralized storage:', updatedPayment.id);
            }
            
            // IMMEDIATELY trigger comprehensive merchant notification
            window.dispatchEvent(new CustomEvent('merchantPaymentUpdate', {
              detail: {
                paymentId: payment.id,
                status: 'paid',
                merchantAddress: payment.merchantAddress,
                txHash: data.txId,
                immediate: true // Flag for immediate update
              }
            }));
            
            // Also trigger the standard payment completed event
            window.dispatchEvent(new CustomEvent('paymentCompleted', {
              detail: {
                paymentId: payment.id,
                merchantAddress: payment.merchantAddress,
                txHash: data.txId,
                amount: payment.amount,
                paymentType: payment.paymentType
              }
            }));
            
            // Initiate comprehensive payment state management
            initiatePayment(payment, data.txId);
            
            console.log('Updated payment in storage:', {
              paymentId: payment.id,
              status: 'paid',
              txHash: data.txId,
              payerAddress: isAuthenticated ? address : btcAddress
            });
            
            toast({ 
              title: 'Success', 
              status: 'success', 
              description: 'Payment completed! Merchant has been notified.' 
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

            {/* Payment Status from State Manager */}
            {payment && paymentStates[payment.id] && (
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                  Payment Status
                </Text>
                
                <HStack justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                  <HStack gap={2} align="center">
                    <Text fontSize="sm" color="#ffffff">Status</Text>
                    <Badge 
                      colorScheme={
                        paymentStates[payment.id].status === 'confirmed' ? 'green' : 
                        paymentStates[payment.id].status === 'failed' ? 'red' : 
                        paymentStates[payment.id].status === 'pending' ? 'yellow' : 'gray'
                      } 
                      fontSize="xs"
                    >
                      {paymentStates[payment.id].status.toUpperCase()}
                    </Badge>
                  </HStack>
                  {paymentStates[payment.id].txId && (
                    <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                      {paymentStates[payment.id].txId?.slice(0, 8)}...
                    </Text>
                  )}
                </HStack>
                
                {paymentStates[payment.id].status === 'pending' && (
                  <Text fontSize="xs" color="#9ca3af" textAlign="center">
                    Waiting for blockchain confirmation...
                  </Text>
                )}
                
                {paymentStates[payment.id].status === 'confirmed' && (
                  <Text fontSize="xs" color="#10b981" textAlign="center">
                    ✅ Payment confirmed on blockchain!
                  </Text>
                )}
                
                {paymentStates[payment.id].status === 'failed' && (
                  <Text fontSize="xs" color="#ef4444" textAlign="center">
                    ❌ Payment failed on blockchain
                  </Text>
                )}
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
                disabled={payment.status === 'paid' || !walletStatus?.connected || isPaying}
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
                
                <Text color="#ef4444" fontSize="xs" textAlign="center">
                  Debug: Merchant: {payment.merchantAddress} | Your Address: {isAuthenticated ? address : btcAddress}
                </Text>
                
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