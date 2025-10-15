import React from 'react';
import { IconButton, HStack, Text } from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <IconButton
      aria-label="Toggle theme"
      variant="ghost"
      size="sm"
      color="current"
      onClick={toggleTheme}
      _hover={{ 
        bg: 'var(--surface-secondary)',
        transform: 'scale(1.05)',
      }}
      _active={{ 
        bg: 'var(--surface-tertiary)',
        transform: 'scale(0.95)',
      }}
      transition="all 0.2s ease"
    >
      <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
    </IconButton>
  );
};

export const SimpleThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <IconButton
      aria-label="Toggle theme"
      variant="ghost"
      size="sm"
      color="current"
      onClick={toggleTheme}
      _hover={{ 
        bg: 'var(--surface-secondary)',
        transform: 'scale(1.05)',
      }}
      _active={{ 
        bg: 'var(--surface-tertiary)',
        transform: 'scale(0.95)',
      }}
      transition="all 0.2s ease"
    >
      <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
    </IconButton>
  );
};