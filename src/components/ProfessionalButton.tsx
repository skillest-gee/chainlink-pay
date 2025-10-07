/**
 * Professional Button Components
 * Consistent, accessible, and beautiful buttons
 */

import React from 'react';
import { Button, Box, HStack, Text, Spinner } from '@chakra-ui/react';

interface ProfessionalButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  [key: string]: any;
}

export function ProfessionalButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled = false,
  leftIcon,
  rightIcon,
  onClick,
  ...props
}: ProfessionalButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          color: 'white',
          border: 'none',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
            bg: 'linear-gradient(135deg, #0099cc 0%, #0077aa 100%)'
          },
          _active: {
            transform: 'translateY(0)',
            boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)'
          },
          _disabled: {
            bg: 'rgba(0, 212, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none'
          }
        };
      case 'secondary':
        return {
          bg: 'transparent',
          color: '#00d4ff',
          border: '2px solid',
          borderColor: '#00d4ff',
          _hover: {
            bg: 'rgba(0, 212, 255, 0.1)',
            borderColor: '#0099cc',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)'
          },
          _active: {
            transform: 'translateY(0)'
          }
        };
      case 'ghost':
        return {
          bg: 'transparent',
          color: '#a0a0a0',
          border: 'none',
          _hover: {
            color: '#00d4ff',
            bg: 'rgba(0, 212, 255, 0.1)',
            transform: 'translateY(-1px)'
          }
        };
      case 'danger':
        return {
          bg: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
          color: 'white',
          border: 'none',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(255, 68, 68, 0.4)',
            bg: 'linear-gradient(135deg, #cc0000 0%, #990000 100%)'
          },
          _active: {
            transform: 'translateY(0)',
            boxShadow: '0 8px 25px rgba(255, 68, 68, 0.3)'
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
          px: 4,
          py: 2,
          fontSize: 'sm',
          borderRadius: 'lg'
        };
      case 'md':
        return {
          px: 6,
          py: 3,
          fontSize: 'md',
          borderRadius: 'xl'
        };
      case 'lg':
        return {
          px: 8,
          py: 4,
          fontSize: 'lg',
          borderRadius: '2xl'
        };
      default:
        return {};
    }
  };

  return (
    <Button
      {...getVariantStyles()}
      {...getSizeStyles()}
      loading={loading}
      loadingText={loadingText}
      disabled={disabled || loading}
      onClick={onClick}
      fontWeight="semibold"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      boxShadow="0 8px 25px rgba(0, 212, 255, 0.3)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
        transform: 'translateX(-100%)',
        transition: 'transform 0.6s ease'
      }}
      _hover={{
        _before: {
          transform: 'translateX(100%)'
        }
      }}
      {...props}
    >
      <HStack gap={2} align="center">
        {leftIcon && <Box>{leftIcon}</Box>}
        {loading ? (
          <>
            <Spinner size="sm" color="currentColor" />
            <Text>{loadingText || 'Loading...'}</Text>
          </>
        ) : (
          children
        )}
        {rightIcon && <Box>{rightIcon}</Box>}
      </HStack>
    </Button>
  );
}

export default ProfessionalButton;
