import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Heading, Stack, Text, Badge, Skeleton, VStack, HStack, AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle, Button } from '@chakra-ui/react';
import { getPayment, PaymentData, PaymentServiceError, checkContractStatus } from '../services/payments';
import LoadingState from '../components/LoadingState';
import ErrorDisplay from '../components/ErrorDisplay';

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

  const displayAmount = useMemo(() => {
    if (!amount) return null;
    const n = Number(amount);
    if (!Number.isFinite(n)) return null;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} STX`;
  }, [amount]);

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
    <Container maxW="4xl" py={10}>
      <VStack gap={8} align="stretch">
        <VStack gap={4} textAlign="center">
          <Heading size="2xl" color="blue.600" fontWeight="bold">Payment Invoice</Heading>
          <Text fontSize="lg" color="gray.600" maxW="600px">
            Complete your payment using the details below
          </Text>
        </VStack>
        
        <Box borderWidth="2px" borderColor="blue.200" borderRadius="xl" p={8} bg="white" shadow="lg">
          <VStack gap={6} align="stretch">
            <HStack gap={4} justify="space-between" w="100%">
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">Payment ID:</Text>
              <Badge colorScheme="purple" fontSize="md" px={3} py={1}>{id}</Badge>
            </HStack>
            
            {displayAmount && (
              <HStack gap={4} justify="space-between" w="100%">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">Amount:</Text>
                <Badge colorScheme="teal" fontSize="lg" px={4} py={2}>{displayAmount}</Badge>
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
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

