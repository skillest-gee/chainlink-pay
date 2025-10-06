import React from 'react';
import { Box, Skeleton, VStack, HStack, Text } from '@chakra-ui/react';

interface LoadingStateProps {
  message?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
}

export default function LoadingState({ 
  message = "Loading...", 
  showSkeleton = true, 
  skeletonCount = 3 
}: LoadingStateProps) {
  return (
    <VStack gap={4} align="stretch">
      <HStack gap={3} justify="center">
        <Box
          w="20px"
          h="20px"
          borderRadius="full"
          bg="blue.500"
          animation="pulse 1.5s ease-in-out infinite"
        />
        <Text color="blue.600" fontWeight="semibold">
          {message}
        </Text>
      </HStack>
      
      {showSkeleton && (
        <VStack gap={3} align="stretch">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} height="20px" borderRadius="md" />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
