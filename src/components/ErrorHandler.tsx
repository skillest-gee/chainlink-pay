/**
 * Comprehensive Error Handling Components
 * User-friendly error messages and recovery options
 */

import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Alert, 
  AlertIndicator, 
  AlertTitle, 
  AlertDescription,
  Collapse,
  IconButton,
  Tooltip
} from '@chakra-ui/react';

export interface ErrorInfo {
  type: 'network' | 'wallet' | 'contract' | 'bridge' | 'ai' | 'validation' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ErrorHandlerProps {
  error: ErrorInfo | null;
  onDismiss: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorHandler({ error, onDismiss, onRetry, showDetails = false }: ErrorHandlerProps) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network': return '🌐';
      case 'wallet': return '👛';
      case 'contract': return '📄';
      case 'bridge': return '🌉';
      case 'ai': return '🤖';
      case 'validation': return '⚠️';
      default: return '❌';
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'network': return 'orange';
      case 'wallet': return 'blue';
      case 'contract': return 'red';
      case 'bridge': return 'purple';
      case 'ai': return 'green';
      case 'validation': return 'yellow';
      default: return 'red';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network': return 'Network Error';
      case 'wallet': return 'Wallet Connection Issue';
      case 'contract': return 'Smart Contract Error';
      case 'bridge': return 'Bridge Transaction Failed';
      case 'ai': return 'AI Service Error';
      case 'validation': return 'Validation Error';
      default: return 'Something went wrong';
    }
  };

  return (
    <Alert 
      status="error" 
      variant="subtle" 
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="auto"
      borderRadius="xl"
      bg="rgba(255, 68, 68, 0.1)"
      border="1px solid"
      borderColor="rgba(255, 68, 68, 0.3)"
      p={6}
    >
      <VStack gap={4} align="stretch" w="100%">
        <HStack gap={3} align="center" justify="center">
          <Text fontSize="2xl">{getErrorIcon()}</Text>
          <AlertTitle fontSize="lg" color="#ff4444">
            {getErrorTitle()}
          </AlertTitle>
        </HStack>
        
        <AlertDescription color="#ffffff" fontSize="md">
          {error.message}
        </AlertDescription>

        {error.details && showDetails && (
          <Box
            bg="rgba(0, 0, 0, 0.2)"
            borderRadius="md"
            p={3}
            fontSize="sm"
            color="#a0a0a0"
            fontFamily="mono"
          >
            {error.details}
          </Box>
        )}

        <HStack gap={3} justify="center" wrap="wrap">
          {error.recoverable && onRetry && (
            <Button
              size="sm"
              variant="outline"
              color="#ff4444"
              borderColor="#ff4444"
              _hover={{
                bg: 'rgba(255, 68, 68, 0.1)',
                borderColor: '#ff6666'
              }}
              onClick={onRetry}
            >
              🔄 Try Again
            </Button>
          )}
          
          {error.action && (
            <Button
              size="sm"
              bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
              color="white"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)'
              }}
              onClick={error.action.onClick}
            >
              {error.action.label}
            </Button>
          )}
          
          <Tooltip label="Dismiss error">
            <IconButton
              size="sm"
              variant="ghost"
              color="#a0a0a0"
              _hover={{ color: '#ff4444' }}
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              ✕
            </IconButton>
          </Tooltip>
        </HStack>
      </VStack>
    </Alert>
  );
}

// Success handler for positive feedback
interface SuccessHandlerProps {
  message: string;
  onDismiss: () => void;
  type?: 'success' | 'info' | 'warning';
}

export function SuccessHandler({ message, onDismiss, type = 'success' }: SuccessHandlerProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return '#00ff88';
      case 'info': return '#00d4ff';
      case 'warning': return '#ffaa00';
      default: return '#00ff88';
    }
  };

  return (
    <Alert 
      status="success" 
      variant="subtle"
      borderRadius="xl"
      bg="rgba(0, 255, 136, 0.1)"
      border="1px solid"
      borderColor="rgba(0, 255, 136, 0.3)"
      p={4}
    >
      <HStack gap={3} align="center" justify="space-between" w="100%">
        <HStack gap={3} align="center">
          <Text fontSize="lg">{getIcon()}</Text>
          <Text color="#ffffff" fontSize="md">
            {message}
          </Text>
        </HStack>
        
        <IconButton
          size="sm"
          variant="ghost"
          color="#a0a0a0"
          _hover={{ color: getColor() }}
          onClick={onDismiss}
          aria-label="Dismiss success message"
        >
          ✕
        </IconButton>
      </HStack>
    </Alert>
  );
}

// Loading handler for async operations
interface LoadingHandlerProps {
  message: string;
  progress?: number;
  onCancel?: () => void;
}

export function LoadingHandler({ message, progress, onCancel }: LoadingHandlerProps) {
  return (
    <Alert 
      status="info" 
      variant="subtle"
      borderRadius="xl"
      bg="rgba(0, 212, 255, 0.1)"
      border="1px solid"
      borderColor="rgba(0, 212, 255, 0.3)"
      p={4}
    >
      <VStack gap={3} align="stretch" w="100%">
        <HStack gap={3} align="center" justify="space-between">
          <HStack gap={3} align="center">
            <Text fontSize="lg">⏳</Text>
            <Text color="#ffffff" fontSize="md">
              {message}
            </Text>
          </HStack>
          
          {onCancel && (
            <IconButton
              size="sm"
              variant="ghost"
              color="#a0a0a0"
              _hover={{ color: '#ff4444' }}
              onClick={onCancel}
              aria-label="Cancel operation"
            >
              ✕
            </IconButton>
          )}
        </HStack>
        
        {progress !== undefined && (
          <Box
            w="100%"
            h="4px"
            bg="rgba(0, 0, 0, 0.2)"
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              w={`${progress}%`}
              h="100%"
              bg="linear-gradient(90deg, #00d4ff, #0099cc)"
              borderRadius="full"
              transition="width 0.3s ease"
            />
          </Box>
        )}
      </VStack>
    </Alert>
  );
}

export default {
  ErrorHandler,
  SuccessHandler,
  LoadingHandler
};
