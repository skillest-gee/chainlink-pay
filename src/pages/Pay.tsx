import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Heading, Stack, Text, Badge, Skeleton, VStack, HStack, AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle, Button } from '@chakra-ui/react';
import { getPayment, PaymentData, PaymentServiceError, checkContractStatus } from '../services/payments';
import LoadingState from '../components/LoadingState';
import ErrorDisplay from '../components/ErrorDisplay';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useToast } from '../hooks/useToast';
import { openSTXTransfer } from '@stacks/connect';
import { stacksNetwork } from '../config/stacksConfig';

export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const amount = params.get('amount');
  const desc = params.get('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [contractStatus, setContractStatus] = useState<{ isDeployed: boolean; error?: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Wallet and payment functionality
  const { isAuthenticated, address, connect } = useStacksWallet();
  const { toast } = useToast();

  const displayAmount = useMemo(() => {
    if (!amount) return null;
    const n = Number(amount);
    if (!Number.isFinite(n)) return null;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} STX`;
  }, [amount]);

  // Payment function for customers
  const handlePayment = async () => {
    if (!amount || !isAuthenticated) return;
    
    setIsPaying(true);
    setPaymentError(null);
    
    try {
      const amountInMicroSTX = BigInt(Math.floor(Number(amount) * 1000000)); // Convert to micro-STX
      const merchantAddress = process.env.REACT_APP_MERCHANT_ADDRESS;
      
      if (!merchantAddress) {
        throw new Error('Merchant address not configured');
      }

      console.log('Initiating payment:', { amount, amountInMicroSTX, merchantAddress });
      
      await openSTXTransfer({
        recipient: merchantAddress,
        amount: amountInMicroSTX,
        memo: desc || `Payment for ${id}`,
        network: stacksNetwork,
        onFinish: (data) => {
          console.log('Payment completed:', data);
          toast({ 
            title: 'Payment Successful!', 
            description: `You paid ${displayAmount} to the merchant.`,
            status: 'success' 
          });
          setIsPaying(false);
        },
        onCancel: () => {
          console.log('Payment cancelled');
          toast({ 
            title: 'Payment Cancelled', 
            description: 'You cancelled the payment.',
            status: 'info' 
          });
          setIsPaying(false);
        }
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMsg = error.message || 'Payment could not be completed.';
      setPaymentError(errorMsg);
      toast({ 
        title: 'Payment Failed', 
        description: errorMsg,
        status: 'error' 
      });
    } finally {
      setIsPaying(false);
    }
  };

  // Check contract status on mount
  useEffect(() => {
    const checkContract = async () => {
      try {
        const status = await checkContractStatus();
        setContractStatus(status);
      } catch (error) {
        console.error('Failed to check contract status:', error);
      }
    };
    checkContract();
  }, []);

  useEffect(() => {
    if (!id) return;
    let timer: any;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorCode(null);
        const p = await getPayment(id);
        setPayment(p);
      } catch (e: any) {
        console.error('Payment fetch error:', e);
        if (e instanceof PaymentServiceError) {
          setError(e.message);
          setErrorCode(e.code || 'UNKNOWN_ERROR');
        } else {
          setError(e?.message || 'Failed to load payment');
          setErrorCode('UNKNOWN_ERROR');
        }
      } finally {
        setLoading(false);
      }
      timer = setTimeout(load, 5000);
    };
    load();
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <Box minH="100vh" overflowX="hidden">
      <Container maxW="4xl" py={{ base: 4, md: 10 }} px={{ base: 4, md: 6 }}>
        <VStack gap={{ base: 4, md: 8 }} align="stretch">
          <VStack gap={4} textAlign="center">
            <Heading size={{ base: "xl", md: "2xl" }} color="blue.600" fontWeight="bold">Payment Invoice</Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW={{ base: "100%", md: "600px" }} px={{ base: 4, md: 0 }}>
              Complete your payment using the details below
            </Text>
          </VStack>
        
        <Box borderWidth="2px" borderColor="blue.200" borderRadius="xl" p={{ base: 4, md: 8 }} bg="white" shadow="lg">
          <VStack gap={{ base: 4, md: 6 }} align="stretch">
            <HStack gap={4} justify="space-between" w="100%" wrap="wrap">
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Payment ID:</Text>
              <Badge colorScheme="purple" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>{id}</Badge>
            </HStack>
            
            {displayAmount && (
              <HStack gap={4} justify="space-between" w="100%" wrap="wrap">
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Amount:</Text>
                <Badge colorScheme="teal" fontSize={{ base: "md", md: "lg" }} px={4} py={2}>{displayAmount}</Badge>
              </HStack>
            )}
            
            {desc && (
              <Box>
                <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>Description:</Text>
                <Text fontSize="md" color="gray.600" p={3} bg="gray.50" borderRadius="lg">{desc}</Text>
              </Box>
            )}
            
            {loading && <Skeleton height="24px" borderRadius="lg" />}
            
            {/* Contract Status Warning */}
            {contractStatus && !contractStatus.isDeployed && (
              <AlertRoot status="warning" borderRadius="lg">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>Smart Contract Not Deployed</AlertTitle>
                  <AlertDescription>
                    The payment contract is not deployed. Please check your contract configuration.
                    {contractStatus.error && ` Error: ${contractStatus.error}`}
                  </AlertDescription>
                </AlertContent>
              </AlertRoot>
            )}
            
            {/* Error Display */}
            {error && (
              <AlertRoot status={errorCode === 'CONFIG_ERROR' ? 'error' : 'warning'} borderRadius="lg">
                <AlertIndicator />
                <AlertContent>
                  <AlertTitle>
                    {errorCode === 'CONFIG_ERROR' ? 'Configuration Error' :
                     errorCode === 'CONTRACT_NOT_FOUND' ? 'Contract Not Found' :
                     errorCode === 'FUNCTION_NOT_FOUND' ? 'Function Not Found' :
                     errorCode === 'NETWORK_ERROR' ? 'Network Error' :
                     'Payment Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {error}
                    {errorCode === 'CONFIG_ERROR' && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        ml={2}
                        onClick={() => window.location.href = '/'}
                      >
                        Go to Home
                      </Button>
                    )}
                  </AlertDescription>
                </AlertContent>
              </AlertRoot>
            )}
            
            {payment && (
              <HStack gap={4} justify="space-between" w="100%">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">Status:</Text>
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>{payment.status}</Badge>
              </HStack>
            )}

            {/* Payment Section for Customers */}
            {displayAmount && (
              <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" p={{ base: 4, md: 6 }} shadow="lg">
                <VStack gap={4}>
                  <Heading size={{ base: "md", md: "lg" }} color="blue.600" textAlign="center">
                    💳 Complete Payment
                  </Heading>
                  
                  <VStack gap={3} w="100%">
                    <HStack justify="space-between" w="100%" wrap="wrap">
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Amount:</Text>
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.600">{displayAmount}</Text>
                    </HStack>
                    
                    {desc && (
                      <VStack gap={2} w="100%" align="stretch">
                        <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Description:</Text>
                        <Text fontSize={{ base: "sm", md: "md" }} color="gray.600" p={3} bg="gray.50" borderRadius="lg">{desc}</Text>
                      </VStack>
                    )}
                  </VStack>

                  {!isAuthenticated ? (
                    <VStack gap={3}>
                      <Text color="gray.600" textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                        Connect your wallet to complete the payment
                      </Text>
                      <Button 
                        colorScheme="blue" 
                        size={{ base: "md", md: "lg" }} 
                        onClick={connect}
                        fontWeight="semibold"
                        w="100%"
                      >
                        🔗 Connect Wallet
                      </Button>
                    </VStack>
                  ) : (
                    <VStack gap={3} w="100%">
                      {paymentError && (
                        <AlertRoot status="error" variant="subtle" borderRadius="lg">
                          <AlertIndicator>
                            <Text fontSize="lg">⚠️</Text>
                          </AlertIndicator>
                          <AlertContent>
                            <AlertTitle>Payment Error</AlertTitle>
                            <AlertDescription>{paymentError}</AlertDescription>
                          </AlertContent>
                        </AlertRoot>
                      )}
                      <Button 
                        colorScheme="green" 
                        size={{ base: "md", md: "lg" }} 
                        onClick={handlePayment}
                        disabled={isPaying}
                        loading={isPaying}
                        loadingText="Processing Payment..."
                        fontWeight="semibold"
                        w="100%"
                      >
                        💳 Pay with Wallet
                      </Button>
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
    </Box>
  );
}

