import React, { useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // In a real implementation, this would toggle the actual theme
    console.log('Theme toggled to:', isDark ? 'light' : 'dark');
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      bg="rgba(255, 255, 255, 0.1)"
      color="#ffffff"
      borderColor="rgba(255, 255, 255, 0.1)"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.05)',
      }}
      _active={{
        bg: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <HStack gap={2}>
        <Text fontSize="sm">
          {isDark ? '☀️' : '🌙'}
        </Text>
        <Text fontSize="sm">
          {isDark ? 'Light' : 'Dark'}
        </Text>
      </HStack>
    </Button>
  );
};
