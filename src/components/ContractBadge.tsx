import React from 'react';
import { Badge, HStack } from '@chakra-ui/react';
import CopyButton from './CopyButton';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/stacksConfig';

export default function ContractBadge() {
  if (!CONTRACT_ADDRESS) return null;
  const label = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
  return (
    <HStack>
      <Badge colorScheme="cyan">{label.slice(0, 10)}...</Badge>
      <CopyButton value={label} label="Copy" />
    </HStack>
  );
}

