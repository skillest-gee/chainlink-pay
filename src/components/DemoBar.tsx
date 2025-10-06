import React from 'react';
import { HStack, Button, Box } from '@chakra-ui/react';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../hooks/useToast';

export default function DemoBar() {
  const { enable, disable, enabled } = useDemo();
  const { toast } = useToast();
  const onEnable = (preset?: any) => {
    enable(preset);
    toast({ title: 'Demo mode enabled', status: 'success' });
  };
  return (
    <Box 
      overflowX="auto" 
      overflowY="hidden" 
      w="100%" 
      css={{
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}
    >
      <HStack 
        gap={2} 
        minW="max-content" 
        px={1} 
        py={2}
        align="center"
      >
        <Button 
          size="sm" 
          onClick={() => (enabled ? disable() : onEnable('simple-payment'))}
          title={enabled ? 'Disable demo mode' : 'Enable demo mode with test data'}
          flexShrink={0}
          minW="fit-content"
        >
          {enabled ? 'Demo: ON' : 'Demo: OFF'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEnable('split')}
          flexShrink={0}
          minW="fit-content"
        >
          Split $1000
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEnable('escrow')}
          flexShrink={0}
          minW="fit-content"
        >
          Escrow on Delivery
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEnable('subscription')}
          flexShrink={0}
          minW="fit-content"
        >
          Monthly Subscription
        </Button>
      </HStack>
    </Box>
  );
}

