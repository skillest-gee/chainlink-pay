import React from 'react';
import { Box, Text, Button, HStack } from '@chakra-ui/react';
import { ToastMessage } from '../hooks/useToast';

interface ToastProps {
  message: ToastMessage;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const bgColor = {
    success: 'green.500',
    error: 'red.500',
    warning: 'yellow.500',
    info: 'blue.500',
  }[message.status];

  return (
    <Box
      bg={bgColor}
      color="white"
      p={3}
      borderRadius="md"
      mb={2}
      position="fixed"
      top={4}
      right={4}
      zIndex={1000}
      minW="300px"
    >
      <HStack justify="space-between">
        <Box>
          <Text fontWeight="bold">{message.title}</Text>
          {message.description && (
            <Text fontSize="sm" opacity={0.9}>
              {message.description}
            </Text>
          )}
        </Box>
        <Button size="sm" variant="ghost" onClick={onClose}>
          ×
        </Button>
      </HStack>
    </Box>
  );
}
