import React from 'react';
import { Badge, Box } from '@chakra-ui/react';
import { STACKS_NETWORK_KEY } from '../config/stacksConfig';

export default function NetworkStatus() {
  const isMainnet = STACKS_NETWORK_KEY === 'mainnet';
  const color = isMainnet ? 'green' : 'purple';
  const label = isMainnet ? 'Stacks Mainnet' : 'Stacks Testnet';
  return (
    <Box 
      display="inline-block"
      borderWidth="2px" 
      borderColor={isMainnet ? 'green.400' : 'purple.400'}
      borderRadius="lg"
      p={1}
      bg={isMainnet ? 'green.50' : 'purple.50'}
    >
      <Badge 
        colorScheme={color} 
        title={label}
        fontSize="sm"
        fontWeight="bold"
        px={3}
        py={1}
        borderRadius="md"
      >
        {isMainnet ? 'MAINNET' : 'TESTNET'}
      </Badge>
    </Box>
  );
}

