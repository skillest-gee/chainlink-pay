import React from 'react';
import { Badge, Box, HStack, Text } from '@chakra-ui/react';
import { STACKS_NETWORK_KEY } from '../config/stacksConfig';

export default function NetworkStatus() {
  const isMainnet = STACKS_NETWORK_KEY === 'mainnet';
  const color = isMainnet ? 'green' : 'purple';
  const label = isMainnet ? 'Stacks Mainnet' : 'Stacks Testnet';
  
  return (
    <Box 
      display="inline-block"
      borderWidth="1px" 
      borderColor={isMainnet ? 'rgba(34, 197, 94, 0.3)' : 'rgba(168, 85, 247, 0.3)'}
      borderRadius="lg"
      p={2}
      bg={isMainnet ? 'rgba(34, 197, 94, 0.1)' : 'rgba(168, 85, 247, 0.1)'}
    >
      <HStack gap={2} align="center">
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={isMainnet ? '#22c55e' : '#a855f7'}
          animation="pulse 2s infinite"
        />
        <Badge 
          colorScheme={color} 
          title={label}
          fontSize="xs"
          fontWeight="medium"
          px={2}
          py={1}
          borderRadius="md"
          bg={isMainnet ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)'}
          color={isMainnet ? '#22c55e' : '#a855f7'}
          border="1px solid"
          borderColor={isMainnet ? 'rgba(34, 197, 94, 0.3)' : 'rgba(168, 85, 247, 0.3)'}
        >
          {isMainnet ? 'MAINNET' : 'TESTNET'}
        </Badge>
      </HStack>
    </Box>
  );
}