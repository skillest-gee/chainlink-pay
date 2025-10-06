import React from 'react';
import { Button, Box, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        Tutorial
      </Button>
    );
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.6)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        maxW="600px"
        mx={4}
        position="relative"
        shadow="2xl"
        border="2px solid"
        borderColor="blue.200"
      >
        <Button
          position="absolute"
          top={4}
          right={4}
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          color="gray.500"
          _hover={{ color: "red.500" }}
        >
          ✕
        </Button>
        <VStack align="start" gap={6}>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600" textAlign="center" w="100%">
            🚀 ChainLinkPay Tutorial
          </Text>
          <VStack align="start" gap={4} w="100%">
            <Box p={4} bg="blue.50" borderRadius="lg" w="100%">
              <Text fontWeight="bold" color="blue.700" mb={2}>1. 💳 Connect Your Wallet</Text>
              <Text color="blue.600">Click "Connect Wallet" to link your Stacks wallet</Text>
            </Box>
            <Box p={4} bg="green.50" borderRadius="lg" w="100%">
              <Text fontWeight="bold" color="green.700" mb={2}>2. 🔗 Create Payment Links</Text>
              <Text color="green.600">Generate payment links and QR codes for easy Bitcoin payments</Text>
            </Box>
            <Box p={4} bg="purple.50" borderRadius="lg" w="100%">
              <Text fontWeight="bold" color="purple.700" mb={2}>3. 🤖 AI Contract Builder</Text>
              <Text color="purple.600">Use natural language to generate smart contracts with AI</Text>
            </Box>
            <Box p={4} bg="orange.50" borderRadius="lg" w="100%">
              <Text fontWeight="bold" color="orange.700" mb={2}>4. 🌉 Cross-Chain Bridge</Text>
              <Text color="orange.600">Bridge Bitcoin to other blockchain networks seamlessly</Text>
            </Box>
          </VStack>
          <Button 
            colorScheme="blue" 
            onClick={() => setIsOpen(false)}
            w="100%"
            size="lg"
            fontWeight="bold"
          >
            Got it! Let's start 🎉
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

