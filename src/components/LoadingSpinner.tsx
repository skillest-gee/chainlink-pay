import React from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'lg',
  color = '#3b82f6'
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      p={8}
      minH="200px"
    >
      <VStack gap={4}>
        <Spinner 
          size={size} 
          color={color}
        />
        <Text 
          color={color} 
          fontSize="sm" 
          fontWeight="medium"
          textAlign="center"
        >
          {message}
        </Text>
      </VStack>
    </Box>
  );
};

export const BridgeLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Processing bridge transaction...' 
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      p={6}
      bg="rgba(59, 130, 246, 0.1)"
      borderRadius="lg"
      border="1px solid rgba(59, 130, 246, 0.2)"
    >
      <VStack gap={3}>
        <Spinner 
          size="lg" 
          color="#3b82f6"
        />
        <Text 
          color="#3b82f6" 
          fontSize="sm" 
          fontWeight="medium"
          textAlign="center"
        >
          {message}
        </Text>
        <Text 
          color="#9ca3af" 
          fontSize="xs" 
          textAlign="center"
        >
          This may take a few minutes...
        </Text>
      </VStack>
    </Box>
  );
};

export const AILoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'AI is generating your contract...' 
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      p={6}
      bg="rgba(16, 185, 129, 0.1)"
      borderRadius="lg"
      border="1px solid rgba(16, 185, 129, 0.2)"
    >
      <VStack gap={3}>
        <Spinner 
          size="lg" 
          color="#10b981"
        />
        <Text 
          color="#10b981" 
          fontSize="sm" 
          fontWeight="medium"
          textAlign="center"
        >
          {message}
        </Text>
        <Text 
          color="#9ca3af" 
          fontSize="xs" 
          textAlign="center"
        >
          Using advanced AI to create optimized code...
        </Text>
      </VStack>
    </Box>
  );
};
