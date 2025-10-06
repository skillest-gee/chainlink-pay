import React from 'react';
import { HStack, Button } from '@chakra-ui/react';
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
    <HStack gap={2}>
      <Button 
        size="sm" 
        onClick={() => (enabled ? disable() : onEnable('simple-payment'))}
        title={enabled ? 'Disable demo mode' : 'Enable demo mode with test data'}
      >
        {enabled ? 'Demo: ON' : 'Demo: OFF'}
      </Button>
      <Button size="sm" variant="outline" onClick={() => onEnable('split')}>Split $1000</Button>
      <Button size="sm" variant="outline" onClick={() => onEnable('escrow')}>Escrow on Delivery</Button>
      <Button size="sm" variant="outline" onClick={() => onEnable('subscription')}>Monthly Subscription</Button>
    </HStack>
  );
}

