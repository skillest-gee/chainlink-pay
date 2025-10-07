/**
 * Comprehensive Error Boundary for ChainLinkPay
 * Handles all unhandled errors and provides user-friendly feedback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Heading, Text, VStack, HStack, AlertRoot, AlertContent, AlertIndicator, AlertTitle, AlertDescription } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details
    console.error('Error ID:', this.state.errorId);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // In a real app, you might want to log this to an error reporting service
    // Example: logErrorToService(error, errorInfo, this.state.errorId);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box minH="100vh" bg="#0a0a0a" color="#ffffff" py={20}>
          <Container maxW="4xl">
            <VStack gap={8} textAlign="center">
              {/* Error Icon */}
              <Box
                w="120px"
                h="120px"
                bg="red.500"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="4xl"
                mb={4}
              >
                ⚠️
              </Box>

              {/* Error Title */}
              <Heading size="2xl" color="red.400" mb={4}>
                Something went wrong
              </Heading>

              {/* Error Message */}
              <Text fontSize="lg" color="#a0a0a0" mb={6} maxW="600px">
                We encountered an unexpected error. This has been logged and we're working to fix it.
              </Text>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <AlertRoot status="error" variant="subtle" borderRadius="lg" maxW="800px" w="100%">
                  <AlertIndicator>
                    <Text fontSize="lg">🐛</Text>
                  </AlertIndicator>
                  <AlertContent>
                    <AlertTitle>Development Error Details</AlertTitle>
                    <AlertDescription>
                      <Box fontFamily="mono" fontSize="sm" mt={2}>
                        <Text><strong>Error:</strong> {this.state.error.message}</Text>
                        <Text><strong>Error ID:</strong> {this.state.errorId}</Text>
                        {this.state.error.stack && (
                          <Text><strong>Stack:</strong></Text>
                        )}
                        {this.state.error.stack && (
                          <Text fontSize="xs" whiteSpace="pre-wrap" wordBreak="break-all">
                            {this.state.error.stack}
                          </Text>
                        )}
                      </Box>
                    </AlertDescription>
                  </AlertContent>
                </AlertRoot>
              )}

              {/* Action Buttons */}
              <HStack gap={4} wrap="wrap" justify="center">
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={this.handleRetry}
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s ease"
                >
                  🔄 Try Again
                </Button>
                <Button
                  colorScheme="gray"
                  size="lg"
                  variant="outline"
                  onClick={this.handleReload}
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s ease"
                >
                  🔄 Reload Page
                </Button>
              </HStack>

              {/* Help Text */}
              <Text fontSize="sm" color="#666666" mt={8}>
                If this problem persists, please contact support with Error ID: {this.state.errorId}
              </Text>
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
