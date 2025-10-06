import React from 'react';
import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import CopyButton from './CopyButton';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/stacksConfig';

export default function ContractBadge() {
  if (!CONTRACT_ADDRESS) return null;
  const label = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
  return (
    <VStack gap={1} align="start">
      <Text fontSize="xs" color="gray.500" fontWeight="semibold">
        Smart Contract:
      </Text>
      <HStack gap={2}>
        <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
          {CONTRACT_NAME}
        </Badge>
        <Text fontSize="xs" color="gray.600" fontFamily="mono">
          {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-4)}
        </Text>
        <CopyButton value={label} label="Copy" />
      </HStack>
    </VStack>
  );
}

