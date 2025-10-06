import React from 'react';
import { Box, Button, Heading, Text, VStack, HStack, AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle } from '@chakra-ui/react';

interface ErrorDisplayProps {
  error: string;
  errorCode?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  title?: string;
  description?: string;
}

export default function ErrorDisplay({ 
  error, 
  errorCode, 
  onRetry, 
  onGoHome, 
  title = "Something went wrong",
  description = "An error occurred while processing your request"
}: ErrorDisplayProps) {
  const getErrorColor = (code?: string) => {
    switch (code) {
      case 'CONFIG_ERROR': return 'error';
      case 'CONTRACT_NOT_FOUND': return 'warning';
      case 'NETWORK_ERROR': return 'warning';
      case 'WALLET_ERROR': return 'error';
      default: return 'error';
    }
  };

  const getErrorTitle = (code?: string) => {
    switch (code) {
      case 'CONFIG_ERROR': return 'Configuration Error';
      case 'CONTRACT_NOT_FOUND': return 'Contract Not Found';
      case 'NETWORK_ERROR': return 'Network Error';
      case 'WALLET_ERROR': return 'Wallet Error';
      default: return 'Error';
    }
  };

  return (
    <Box p={8} minH="50vh" bg="gray.50">
      <VStack gap={6} align="stretch" maxW="600px" mx="auto">
        <VStack gap={4} textAlign="center">
          <Heading size="xl" color={getErrorColor(errorCode) === 'error' ? 'red.600' : 'orange.600'}>
            ⚠️ {title}
          </Heading>
          <Text fontSize="lg" color="gray.600">
            {description}
          </Text>
        </VStack>

        <AlertRoot status={getErrorColor(errorCode)} borderRadius="lg">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>{getErrorTitle(errorCode)}</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </AlertContent>
        </AlertRoot>

        <Box p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <VStack gap={3} align="stretch">
            <Text fontWeight="semibold" color="gray.700">Troubleshooting Steps:</Text>
            <VStack gap={2} align="start" fontSize="sm" color="gray.600">
              <Text>1. Check your internet connection</Text>
              <Text>2. Verify your wallet is connected</Text>
              <Text>3. Try refreshing the page</Text>
              <Text>4. Check browser console for more details</Text>
              {errorCode === 'CONFIG_ERROR' && (
                <Text>5. Verify your environment variables are set correctly</Text>
              )}
            </VStack>
          </VStack>
        </Box>

        <HStack gap={4} justify="center">
          {onRetry && (
            <Button
              colorScheme="blue"
              onClick={onRetry}
              size="lg"
              px={8}
            >
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button
              variant="outline"
              onClick={onGoHome}
              size="lg"
              px={8}
            >
              Go to Home
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}
