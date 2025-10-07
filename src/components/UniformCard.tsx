/**
 * Uniform Professional Card System
 * Consistent styling across the entire app
 */

import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface UniformCardProps extends BoxProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
}

export function UniformCard({
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: UniformCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          bg: '#171717',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          _hover: {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-1px)'
          }
        };
      case 'outlined':
        return {
          bg: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            bg: 'rgba(255, 255, 255, 0.02)'
          }
        };
      case 'glass':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }
        };
      default:
        return {
          bg: '#171717',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          _hover: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            bg: '#1f1f1f'
          }
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'sm':
        return { p: 3 };
      case 'md':
        return { p: 4 };
      case 'lg':
        return { p: 6 };
      default:
        return { p: 4 };
    }
  };

  return (
    <Box
      {...getVariantStyles()}
      {...getPaddingStyles()}
      borderRadius="xl"
      transition="all 0.2s ease"
      {...props}
    >
      {children}
    </Box>
  );
}

export default UniformCard;
