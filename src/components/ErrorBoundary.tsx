import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Container, VStack, Heading, Text, Button, Code } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services here
      console.error('Production error:', { error: error.message, stack: error.stack, errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box minH="100vh" bg="#000000" color="#ffffff" py={8}>
          <Container maxW="4xl">
            <VStack gap={6} align="stretch">
              <VStack gap={4} textAlign="center">
                <Heading size="xl" color="#ef4444">
                  🚨 Application Error
                </Heading>
                <Text color="#9ca3af" fontSize="lg">
                  Something went wrong. Don't worry, we're here to help!
                </Text>
              </VStack>

              <Box p={6} bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)" borderRadius="lg">
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ef4444">
                    Error Details
                  </Heading>
                  
                  {this.state.error && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="#ffffff" mb={2}>
                        Error Message:
                      </Text>
                      <Code p={3} bg="#1a1a1a" color="#ef4444" fontSize="sm" display="block" whiteSpace="pre-wrap">
                        {this.state.error.message}
                      </Code>
                    </Box>
                  )}

                  {this.state.errorInfo && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="#ffffff" mb={2}>
                        Component Stack:
                      </Text>
                      <Code p={3} bg="#1a1a1a" color="#9ca3af" fontSize="xs" display="block" whiteSpace="pre-wrap" maxH="200px" overflowY="auto">
                        {this.state.errorInfo.componentStack}
                      </Code>
                    </Box>
                  )}
                </VStack>
              </Box>

              <VStack gap={4}>
                <Text color="#9ca3af" textAlign="center">
                  Try these solutions:
                </Text>
                
                <VStack gap={2} align="stretch">
                  <Button
                    onClick={this.handleReset}
                    colorScheme="blue"
                    size="lg"
                    variant="solid"
                  >
                    🔄 Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleReload}
                    colorScheme="gray"
                    size="lg"
                    variant="outline"
                  >
                    🔃 Reload Page
                  </Button>
                </VStack>
              </VStack>

              <Box p={4} bg="rgba(59, 130, 246, 0.1)" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)" borderRadius="lg">
                <VStack gap={2} align="center">
                  <Text fontSize="sm" color="#3b82f6" fontWeight="medium">
                    💡 Need Help?
                  </Text>
                  <Text fontSize="xs" color="#9ca3af" textAlign="center">
                    If this error persists, please check the browser console for more details or contact support.
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}