import React from 'react';
import { Button } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';

export default function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const { toast } = useToast();
  const handle = () => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied', status: 'success' });
  };
  return <Button size="sm" variant="outline" onClick={handle}>{label}</Button>;
}

