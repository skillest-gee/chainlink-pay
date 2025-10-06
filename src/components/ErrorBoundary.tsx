import React from 'react';
import { Box, Button, Heading, Text, VStack, HStack, Badge, AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle } from '@chakra-ui/react';

type State = { 
  hasError: boolean; 
  error?: any; 
  errorInfo?: any;
  errorId?: string;
};

type Props = {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: any; resetError: () => void }>;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: any) {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    // Log to console with more details
    console.group('🚨 Application Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // In a real app, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
  
  handleReload = () => {
    window.location.reload();
  };
  
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: undefined });
  };
  
  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetError={this.handleReset}
          />
        );
      }
      
      // Default error UI
      return (
        <Box p={8} minH="50vh" bg="gray.50">
          <VStack gap={6} align="stretch" maxW="600px" mx="auto">
            <VStack gap={4} textAlign="center">
              <Heading size="xl" color="red.600">🚨 Application Error</Heading>
              <Text fontSize="lg" color="gray.600">
                Something went wrong in the application. We've been notified and are working to fix it.
              </Text>
            </VStack>
            
            <AlertRoot status="error" borderRadius="lg">
              <AlertIndicator />
              <AlertContent>
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <VStack gap={2} align="start">
                    <Text fontSize="sm">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Time:</strong> {new Date().toLocaleString()}
                    </Text>
                  </VStack>
                </AlertDescription>
              </AlertContent>
            </AlertRoot>
            
            <Box p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
              <VStack gap={3} align="stretch">
                <Text fontWeight="semibold" color="gray.700">Troubleshooting Steps:</Text>
                <VStack gap={2} align="start" fontSize="sm" color="gray.600">
                  <Text>1. Try refreshing the page</Text>
                  <Text>2. Check your internet connection</Text>
                  <Text>3. Make sure your wallet is connected</Text>
                  <Text>4. Try switching networks (testnet/mainnet)</Text>
                  <Text>5. Clear browser cache and try again</Text>
                </VStack>
              </VStack>
            </Box>
            
            <HStack gap={4} justify="center">
              <Button 
                colorScheme="blue" 
                onClick={this.handleReset}
                size="lg"
                px={8}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleReload}
                size="lg"
                px={8}
              >
                Reload Page
              </Button>
            </HStack>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box p={4} bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200">
                <VStack gap={2} align="start">
                  <Text fontWeight="semibold" color="red.700" fontSize="sm">
                    Development Error Details:
                  </Text>
                  <Text fontSize="xs" color="red.600" fontFamily="mono" whiteSpace="pre-wrap">
                    {this.state.error.stack}
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }
    
    return this.props.children;
  }
}

