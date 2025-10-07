/**
 * Professional Loading Components
 * Beautiful loading states for the application
 */

import React from 'react';
import { Box, VStack, HStack, Text, Spinner, Skeleton } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: string;
}

export function LoadingSpinner({ size = 'md', text, color = '#00d4ff' }: LoadingSpinnerProps) {
  return (
    <VStack gap={4} align="center" justify="center" py={8}>
      <Spinner
        size={size}
        color={color}
      />
      {text && (
        <Text color={color} fontSize="md" fontWeight="medium">
          {text}
        </Text>
      )}
    </VStack>
  );
}

interface LoadingCardProps {
  title: string;
  description?: string;
  showSkeleton?: boolean;
}

export function LoadingCard({ title, description, showSkeleton = true }: LoadingCardProps) {
  return (
    <Box
      bg="rgba(30, 30, 30, 0.95)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="rgba(0, 212, 255, 0.3)"
      p={8}
      shadow="0 12px 40px rgba(0, 0, 0, 0.4)"
    >
      <VStack gap={4} align="center">
        <HStack gap={3} align="center">
          <Spinner size="md" color="#00d4ff" />
          <Text fontSize="lg" fontWeight="semibold" color="#00d4ff">
            {title}
          </Text>
        </HStack>
        {description && (
          <Text color="#a0a0a0" fontSize="sm" textAlign="center">
            {description}
          </Text>
        )}
        {showSkeleton && (
          <VStack gap={2} w="100%" align="stretch">
            <Skeleton height="20px" borderRadius="md" />
            <Skeleton height="20px" borderRadius="md" />
            <Skeleton height="20px" borderRadius="md" w="60%" />
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
  [key: string]: any;
}

export function LoadingButton({ isLoading, loadingText, children, ...props }: LoadingButtonProps) {
  return (
    <Box position="relative" {...props}>
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
        >
          <Spinner size="sm" color="white" />
        </Box>
      )}
      <Box
        opacity={isLoading ? 0.6 : 1}
        transition="opacity 0.2s ease"
      >
        {isLoading ? loadingText : children}
      </Box>
    </Box>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
}

export function LoadingOverlay({ isVisible, text }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(4px)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={4} align="center">
        <Box
          w="60px"
          h="60px"
          borderRadius="full"
          bg="linear-gradient(135deg, #00d4ff, #0099cc)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          animation="pulse 2s infinite"
        >
          <Text fontSize="2xl">🔗</Text>
        </Box>
        {text && (
          <Text color="white" fontSize="lg" fontWeight="medium">
            {text}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

export default {
  LoadingSpinner,
  LoadingCard,
  LoadingButton,
  LoadingOverlay,
};
