import React from 'react';
import { Button, Box, Text, VStack, HStack, IconButton, Container, Heading, Badge } from '@chakra-ui/react';
import { useState } from 'react';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        bg="rgba(0, 212, 255, 0.1)"
        borderColor="rgba(0, 212, 255, 0.3)"
        color="#00d4ff"
        _hover={{
          bg: 'rgba(0, 212, 255, 0.2)',
          borderColor: 'rgba(0, 212, 255, 0.5)',
          transform: 'translateY(-1px)'
        }}
        transition="all 0.2s ease"
        fontWeight="medium"
      >
        📚 Tutorial
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
      bg="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(8px)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="rgba(17, 17, 17, 0.95)"
        backdropFilter="blur(20px)"
        p={{ base: 6, md: 8 }}
        borderRadius="3xl"
        maxW={{ base: "95%", md: "700px" }}
        w="100%"
        position="relative"
        shadow="0 25px 80px rgba(0, 0, 0, 0.6)"
        border="1px solid"
        borderColor="rgba(0, 212, 255, 0.3)"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '3xl',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 107, 53, 0.3))',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
        }}
      >
        <IconButton
          position="absolute"
          top={4}
          right={4}
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          color="#a0a0a0"
          _hover={{ 
            color: "#ff4444",
            bg: 'rgba(255, 68, 68, 0.1)',
            transform: 'scale(1.1)'
          }}
          transition="all 0.2s ease"
          aria-label="Close tutorial"
        >
          ✕
        </IconButton>
        
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <VStack gap={3} textAlign="center">
            <HStack gap={3} align="center">
              <Box
                w="50px"
                h="50px"
                bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xl"
                boxShadow="0 8px 32px rgba(0, 212, 255, 0.3)"
              >
                🚀
              </Box>
              <Heading 
                size="lg" 
                bg="linear-gradient(135deg, #00d4ff 0%, #ffffff 100%)"
                bgClip="text"
                fontWeight="bold"
              >
                ChainLinkPay Tutorial
              </Heading>
            </HStack>
            <Text color="#a0a0a0" fontSize="md">
              Learn how to use ChainLinkPay in 4 simple steps
            </Text>
          </VStack>

          {/* Tutorial Steps */}
          <VStack gap={4} align="stretch">
            {/* Step 1 */}
            <Box 
              p={6} 
              bg="rgba(0, 212, 255, 0.05)" 
              borderRadius="2xl" 
              border="1px solid"
              borderColor="rgba(0, 212, 255, 0.2)"
              _hover={{
                borderColor: 'rgba(0, 212, 255, 0.4)',
                bg: 'rgba(0, 212, 255, 0.08)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
            >
              <HStack gap={4} align="start">
                <Badge 
                  bg="linear-gradient(135deg, #00d4ff, #0099cc)" 
                  color="white" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  1
                </Badge>
                <VStack align="start" gap={2} flex={1}>
                  <Text fontWeight="bold" color="#00d4ff" fontSize="lg">
                    💳 Connect Your Wallet
                  </Text>
                  <Text color="#ffffff" fontSize="md" lineHeight="1.6">
                    Click "Connect Wallet" to link your Stacks wallet and start using ChainLinkPay
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Step 2 */}
            <Box 
              p={6} 
              bg="rgba(0, 255, 136, 0.05)" 
              borderRadius="2xl" 
              border="1px solid"
              borderColor="rgba(0, 255, 136, 0.2)"
              _hover={{
                borderColor: 'rgba(0, 255, 136, 0.4)',
                bg: 'rgba(0, 255, 136, 0.08)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
            >
              <HStack gap={4} align="start">
                <Badge 
                  bg="linear-gradient(135deg, #00ff88, #00d4ff)" 
                  color="white" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  2
                </Badge>
                <VStack align="start" gap={2} flex={1}>
                  <Text fontWeight="bold" color="#00ff88" fontSize="lg">
                    🔗 Create Payment Links
                  </Text>
                  <Text color="#ffffff" fontSize="md" lineHeight="1.6">
                    Generate secure payment links and QR codes for easy Bitcoin payments
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Step 3 */}
            <Box 
              p={6} 
              bg="rgba(255, 107, 53, 0.05)" 
              borderRadius="2xl" 
              border="1px solid"
              borderColor="rgba(255, 107, 53, 0.2)"
              _hover={{
                borderColor: 'rgba(255, 107, 53, 0.4)',
                bg: 'rgba(255, 107, 53, 0.08)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
            >
              <HStack gap={4} align="start">
                <Badge 
                  bg="linear-gradient(135deg, #ff6b35, #ffaa00)" 
                  color="white" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  3
                </Badge>
                <VStack align="start" gap={2} flex={1}>
                  <Text fontWeight="bold" color="#ff6b35" fontSize="lg">
                    🤖 AI Contract Builder
                  </Text>
                  <Text color="#ffffff" fontSize="md" lineHeight="1.6">
                    Use natural language to generate smart contracts with AI assistance
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Step 4 */}
            <Box 
              p={6} 
              bg="rgba(138, 43, 226, 0.05)" 
              borderRadius="2xl" 
              border="1px solid"
              borderColor="rgba(138, 43, 226, 0.2)"
              _hover={{
                borderColor: 'rgba(138, 43, 226, 0.4)',
                bg: 'rgba(138, 43, 226, 0.08)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
            >
              <HStack gap={4} align="start">
                <Badge 
                  bg="linear-gradient(135deg, #8a2be2, #ff6b35)" 
                  color="white" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  4
                </Badge>
                <VStack align="start" gap={2} flex={1}>
                  <Text fontWeight="bold" color="#8a2be2" fontSize="lg">
                    🌉 Cross-Chain Bridge
                  </Text>
                  <Text color="#ffffff" fontSize="md" lineHeight="1.6">
                    Bridge Bitcoin to other blockchain networks seamlessly
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>

          {/* Action Button */}
          <Button 
            bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
            color="white"
            border="none"
            borderRadius="xl"
            fontWeight="semibold"
            size="lg"
            onClick={() => setIsOpen(false)}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
              bg: 'linear-gradient(135deg, #0099cc 0%, #0077aa 100%)'
            }}
            _active={{
              transform: 'translateY(0)',
              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)'
            }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            boxShadow="0 8px 25px rgba(0, 212, 255, 0.3)"
            py={6}
          >
            🎉 Got it! Let's start building
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

