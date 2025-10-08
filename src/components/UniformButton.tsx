/**
 * Uniform Professional Button System
 * Consistent styling across the entire app
 */

import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

interface UniformButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  [key: string]: any;
}

export function UniformButton({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: UniformButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: '#0ea5e9',
          color: 'white',
          border: 'none',
          _hover: {
            bg: '#0284c7',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
          },
          _active: {
            transform: 'translateY(0)',
            bg: '#0369a1'
          }
        };
      case 'secondary':
        return {
          bg: 'transparent',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            transform: 'translateY(-1px)'
          },
          _active: {
            transform: 'translateY(0)'
          }
        };
      case 'accent':
        return {
          bg: '#22c55e',
          color: 'white',
          border: 'none',
          _hover: {
            bg: '#16a34a',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          },
          _active: {
            transform: 'translateY(0)',
            bg: '#15803d'
          }
        };
      case 'ghost':
        return {
          bg: 'transparent',
          color: '#a3a3a3',
          border: 'none',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            transform: 'translateY(-1px)'
          }
        };
      case 'danger':
        return {
          bg: '#ef4444',
          color: 'white',
          border: 'none',
          _hover: {
            bg: '#dc2626',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          },
          _active: {
            transform: 'translateY(0)',
            bg: '#b91c1c'
          }
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          px: 3,
          py: 2,
          fontSize: 'sm',
          borderRadius: 'md'
        };
      case 'md':
        return {
          px: 4,
          py: 3,
          fontSize: 'md',
          borderRadius: 'lg'
        };
      case 'lg':
        return {
          px: 6,
          py: 4,
          fontSize: 'lg',
          borderRadius: 'xl'
        };
      default:
        return {};
    }
  };

  return (
    <Button
      {...getVariantStyles()}
      {...getSizeStyles()}
      fontWeight="medium"
      transition="all 0.2s ease"
      {...props}
    >
      {children}
    </Button>
  );
}

export default UniformButton;
