import React from 'react';
import { Box, VStack, Text, Button, AlertRoot, AlertContent, AlertTitle, AlertDescription, AlertIndicator, HStack, Icon } from '@chakra-ui/react';

interface BridgeErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function BridgeErrorHandler({ error, onRetry, onDismiss }: BridgeErrorHandlerProps) {
  if (!error) return null;

  const getErrorInfo = (error: string) => {
    if (error.includes('NoSuchContract')) {
      return {
        title: 'Contract Not Found',
        description: 'The bridge contract is not deployed on this network. This is a demo environment.',
        severity: 'warning' as const,
        action: 'This is expected in testnet mode. Real bridge contracts would be deployed for production use.'
      };
    }
    
    if (error.includes('InsufficientFunds')) {
      return {
        title: 'Insufficient Funds',
        description: 'You don\'t have enough tokens to complete this bridge transaction.',
        severity: 'error' as const,
        action: 'Please check your balance and try with a smaller amount.'
      };
    }
    
    if (error.includes('UserRejected')) {
      return {
        title: 'Transaction Cancelled',
        description: 'You cancelled the transaction in your wallet.',
        severity: 'info' as const,
        action: 'No funds were transferred. You can try again if needed.'
      };
    }
    
    if (error.includes('NetworkError')) {
      return {
        title: 'Network Error',
        description: 'Unable to connect to the blockchain network.',
        severity: 'error' as const,
        action: 'Please check your internet connection and try again.'
      };
    }
    
    return {
      title: 'Transaction Failed',
      description: error,
      severity: 'error' as const,
      action: 'Please try again or contact support if the problem persists.'
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <Box p={4} bg="white" borderRadius="xl" borderWidth="2px" borderColor="red.200" shadow="lg" mx={4}>
      <AlertRoot status={errorInfo.severity} borderRadius="lg">
        <AlertIndicator />
        <AlertContent>
          <VStack align="start" gap={3} flex={1}>
            <AlertTitle fontSize="lg" fontWeight="bold">
              {errorInfo.title}
            </AlertTitle>
            <AlertDescription fontSize="md">
              {errorInfo.description}
            </AlertDescription>
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              {errorInfo.action}
            </Text>
            <HStack gap={2} mt={2}>
              {onRetry && (
                <Button size="sm" colorScheme="blue" onClick={onRetry}>
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="outline" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </HStack>
          </VStack>
        </AlertContent>
      </AlertRoot>
    </Box>
  );
}
