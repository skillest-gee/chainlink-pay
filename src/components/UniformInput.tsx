/**
 * Uniform Professional Input System
 * Consistent styling across the entire app
 */

import React from 'react';
import { Input, InputProps, Textarea, TextareaProps } from '@chakra-ui/react';

interface UniformInputProps extends Omit<InputProps, 'variant'> {
  variant?: 'default' | 'search' | 'password';
}

interface UniformTextareaProps extends Omit<TextareaProps, 'variant'> {
  variant?: 'default' | 'code';
}

export function UniformInput({
  variant = 'default',
  ...props
}: UniformInputProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          _placeholder: { color: '#737373' },
          _focus: {
            borderColor: '#22c55e',
            boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          }
        };
      case 'password':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          _placeholder: { color: '#737373' },
          _focus: {
            borderColor: '#0ea5e9',
            boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          }
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          _placeholder: { color: '#737373' },
          _hover: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          },
          _focus: {
            borderColor: '#22c55e',
            boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          }
        };
    }
  };

  return (
    <Input
      {...getVariantStyles()}
      borderRadius="lg"
      borderWidth="1px"
      transition="all 0.2s ease"
      {...props}
    />
  );
}

export function UniformTextarea({
  variant = 'default',
  ...props
}: UniformTextareaProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'code':
        return {
          bg: '#0a0a0a',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          fontFamily: 'mono',
          _placeholder: { color: '#737373' },
          _focus: {
            borderColor: '#22c55e',
            boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2)'
          }
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          _placeholder: { color: '#737373' },
          _hover: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          },
          _focus: {
            borderColor: '#22c55e',
            boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2)',
            bg: 'rgba(255, 255, 255, 0.08)'
          }
        };
    }
  };

  return (
    <Textarea
      {...getVariantStyles()}
      borderRadius="lg"
      borderWidth="1px"
      transition="all 0.2s ease"
      {...props}
    />
  );
}

export default { UniformInput, UniformTextarea };
