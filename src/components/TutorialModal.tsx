import React, { useState } from 'react';
import { Box, Text, VStack, HStack, IconButton, Heading, Badge, Button } from '@chakra-ui/react';
import { UniformButton } from './UniformButton';
import { UniformCard } from './UniformCard';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const tutorialSteps = [
    {
      title: "Welcome to ChainLinkPay",
      icon: "🔗",
      content: "ChainLinkPay is a professional Bitcoin payment platform that allows you to create payment links, manage transactions, and bridge assets across blockchain networks.",
      features: ["Create secure payment links", "Manage Bitcoin and STX transactions", "Cross-chain asset bridging", "AI-powered smart contracts"]
    },
    {
      title: "Connect Your Wallet",
      icon: "👛",
      content: "Start by connecting your wallet to access all features. We support both Stacks and Bitcoin wallets.",
      features: ["Stacks wallets (Hiro, Xverse, Leather)", "Bitcoin wallets (Unisat, OKX, Bitget)", "Mobile wallet support", "Secure connection"]
    },
    {
      title: "Create Payment Links",
      icon: "💳",
      content: "Generate secure payment links for your customers. Support both Bitcoin and STX payments with QR codes.",
      features: ["Custom payment amounts", "Payment descriptions", "QR code generation", "Real-time tracking"]
    },
    {
      title: "AI Contract Builder",
      icon: "🤖",
      content: "Generate smart contracts using AI. Describe your requirements in natural language and get production-ready Clarity code.",
      features: ["Natural language input", "Template-based generation", "Contract validation", "Deployment support"]
    },
    {
      title: "Cross-Chain Bridge",
      icon: "🌉",
      content: "Bridge assets between different blockchain networks. Transfer Bitcoin, STX, and other supported tokens.",
      features: ["Multi-asset support", "Real-time fee estimation", "Transaction tracking", "Secure bridging"]
    },
    {
      title: "Dashboard & Analytics",
      icon: "📊",
      content: "Track your payment statistics, view transaction history, and monitor your business performance.",
      features: ["Real-time statistics", "Payment history", "Monthly growth tracking", "Quick actions"]
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  if (!isOpen) {
    return (
      <UniformButton
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Learn how to use ChainLinkPay"
      >
        📚 Tutorial
      </UniformButton>
    );
  }

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.9)"
      backdropFilter="blur(10px)"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <UniformCard
        maxW={{ base: "95%", md: "600px" }}
        w="full"
        p={0}
        overflow="hidden"
      >
        <VStack gap={0} align="stretch">
          {/* Header */}
          <Box p={6} borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
            <HStack justify="space-between" align="center">
              <HStack gap={3} align="center">
                <Text fontSize="2xl">{currentTutorial.icon}</Text>
                <VStack align="start" gap={1}>
                  <Heading size="md" color="#ffffff">
                    {currentTutorial.title}
                  </Heading>
                  <Badge colorScheme="blue" fontSize="xs">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Badge>
                </VStack>
              </HStack>
              
              <IconButton
                aria-label="Close tutorial"
                icon={<Text fontSize="lg">✕</Text>}
                size="sm"
                variant="ghost"
                color="#9ca3af"
                _hover={{ color: "#ffffff", bg: "rgba(255, 255, 255, 0.1)" }}
                onClick={skipTutorial}
              />
            </HStack>
          </Box>

          {/* Content */}
          <Box p={6}>
            <VStack gap={6} align="stretch">
              <Text fontSize="md" color="#ffffff" lineHeight="1.6">
                {currentTutorial.content}
              </Text>

              {/* Features List */}
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="#9ca3af">
                  Key Features:
                </Text>
                {currentTutorial.features.map((feature, index) => (
                  <HStack key={index} gap={3} align="start">
                    <Text fontSize="sm" color="#10b981" mt={0.5}>✓</Text>
                    <Text fontSize="sm" color="#ffffff">
                      {feature}
                    </Text>
                  </HStack>
                ))}
              </VStack>

              {/* Progress Bar */}
              <VStack gap={2} align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" color="#9ca3af">Progress</Text>
                  <Text fontSize="xs" color="#9ca3af">
                    {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
                  </Text>
                </HStack>
                <Box
                  w="full"
                  h="4px"
                  bg="rgba(255, 255, 255, 0.1)"
                  borderRadius="full"
                  overflow="hidden"
                >
                  <Box
                    w={`${((currentStep + 1) / tutorialSteps.length) * 100}%`}
                    h="full"
                    bg="linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                    borderRadius="full"
                    transition="width 0.3s ease"
                  />
                </Box>
              </VStack>
            </VStack>
          </Box>

          {/* Footer */}
          <Box p={6} borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                {tutorialSteps.map((_, index) => (
                  <Box
                    key={index}
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={index === currentStep ? "#3b82f6" : "rgba(255, 255, 255, 0.3)"}
                    transition="background-color 0.2s ease"
                  />
                ))}
              </HStack>

              <HStack gap={3}>
                {currentStep > 0 && (
                  <UniformButton
                    variant="secondary"
                    size="sm"
                    onClick={prevStep}
                  >
                    Previous
                  </UniformButton>
                )}
                
                <UniformButton
                  variant="ghost"
                  size="sm"
                  onClick={skipTutorial}
                >
                  Skip Tutorial
                </UniformButton>
                
                <UniformButton
                  variant="primary"
                  size="sm"
                  onClick={nextStep}
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                </UniformButton>
              </HStack>
            </HStack>
          </Box>
        </VStack>
      </UniformCard>
    </Box>
  );
}