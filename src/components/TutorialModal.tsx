import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack, IconButton, Heading, Badge, Button, Portal } from '@chakra-ui/react';
import { UniformButton } from './UniformButton';
import { UniformCard } from './UniformCard';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('TutorialModal state changed:', { isOpen, currentStep });
  }, [isOpen, currentStep]);
  
  const tutorialSteps = [
    {
      title: "Welcome to ChainLinkPay",
      icon: "🔗",
      content: "ChainLinkPay is a professional Bitcoin payment platform that allows you to create payment links, manage transactions, and bridge assets across blockchain networks.",
      features: ["Create secure payment links", "Manage Bitcoin and STX transactions", "Cross-chain asset bridging", "AI-powered smart contracts"],
      action: "Click 'Connect Wallet' to get started"
    },
    {
      title: "Connect Your Wallet",
      icon: "👛",
      content: "Start by connecting your wallet to access all features. We support both Stacks and Bitcoin wallets for maximum flexibility.",
      features: ["Stacks wallets (Hiro, Xverse, Leather)", "Bitcoin wallets (Unisat, OKX, Bitget)", "Mobile wallet support", "Secure connection"],
      action: "Choose your preferred wallet and connect"
    },
    {
      title: "Create Payment Links",
      icon: "💳",
      content: "Generate secure payment links for your customers. Support both Bitcoin and STX payments with professional QR codes.",
      features: ["Custom payment amounts", "Payment descriptions", "QR code generation", "Real-time tracking"],
      action: "Go to 'Payments' to create your first link"
    },
    {
      title: "AI Contract Builder",
      icon: "🤖",
      content: "Generate smart contracts using AI. Describe your requirements in natural language and get production-ready Clarity code.",
      features: ["Natural language input", "Template-based generation", "Contract validation", "Deployment support"],
      action: "Try the 'AI Builder' for custom contracts"
    },
    {
      title: "Cross-Chain Bridge",
      icon: "🌉",
      content: "Bridge assets between different blockchain networks. Transfer Bitcoin, STX, and other supported tokens seamlessly.",
      features: ["Multi-asset support", "Real-time fee estimation", "Transaction tracking", "Secure bridging"],
      action: "Use 'Bridge' to transfer between chains"
    },
    {
      title: "Dashboard & Analytics",
      icon: "📊",
      content: "Track your payment statistics, view transaction history, and monitor your business performance with detailed analytics.",
      features: ["Real-time statistics", "Payment history", "Monthly growth tracking", "Quick actions"],
      action: "Check your 'Dashboard' for insights"
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
        onClick={() => {
          console.log('Tutorial button clicked, opening modal...');
          setIsOpen(true);
        }}
        title="Learn how to use ChainLinkPay"
      >
        📚 Tutorial
      </UniformButton>
    );
  }

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <Portal>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(0, 0, 0, 0.9)"
        backdropFilter="blur(12px)"
        zIndex="99999"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        overflow="auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            skipTutorial();
          }
        }}
        style={{
          position: 'fixed',
          zIndex: 99999,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
      <UniformCard
        maxW={{ base: "95%", md: "600px", lg: "700px" }}
        w="full"
        maxH="90vh"
        p={0}
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
        display="flex"
        flexDirection="column"
      >
        <VStack gap={0} align="stretch" h="full" flex="1">
          {/* Header */}
          <Box p={6} borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.1)" bg="rgba(0, 0, 0, 0.8)">
            <HStack justify="space-between" align="center">
              <HStack gap={3} align="center">
                <Text fontSize="2xl">{currentTutorial.icon}</Text>
                <VStack align="start" gap={1}>
                  <Heading size="md" color="#ffffff" fontWeight="bold">
                    {currentTutorial.title}
                  </Heading>
                  <Badge colorScheme="blue" fontSize="xs" variant="subtle">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Badge>
                </VStack>
              </HStack>
              
              <IconButton
                aria-label="Close tutorial"
                children={<Text fontSize="lg">✕</Text>}
                size="sm"
                variant="ghost"
                color="#9ca3af"
                _hover={{ color: "#ffffff", bg: "rgba(255, 255, 255, 0.1)" }}
                onClick={skipTutorial}
              />
            </HStack>
          </Box>

          {/* Content */}
          <Box p={6} bg="rgba(0, 0, 0, 0.6)" flex="1" overflow="auto">
            <VStack gap={6} align="stretch">
              <Text fontSize="md" color="#ffffff" lineHeight="1.6" textAlign="center">
                {currentTutorial.content}
              </Text>

              {/* Features List */}
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" fontWeight="bold" color="#3b82f6" textAlign="center">
                  Key Features:
                </Text>
                {currentTutorial.features.map((feature, index) => (
                  <HStack key={index} gap={3} align="start" p={2} bg="rgba(255, 255, 255, 0.05)" borderRadius="md">
                    <Text fontSize="sm" color="#10b981" mt={0.5} fontWeight="bold">✓</Text>
                    <Text fontSize="sm" color="#ffffff">
                      {feature}
                    </Text>
                  </HStack>
                ))}
              </VStack>

              {/* Action Call */}
              <Box p={4} bg="rgba(59, 130, 246, 0.1)" borderRadius="lg" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                <Text fontSize="sm" color="#3b82f6" fontWeight="medium" textAlign="center">
                  💡 {currentTutorial.action}
                </Text>
              </Box>

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
          <Box p={6} borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.1)" bg="rgba(0, 0, 0, 0.8)" flexShrink={0}>
            <VStack gap={4} align="stretch">
              {/* Progress Dots */}
              <HStack justify="center" gap={2}>
                {tutorialSteps.map((_, index) => (
                  <Box
                    key={index}
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg={index === currentStep ? "#3b82f6" : "rgba(255, 255, 255, 0.3)"}
                    transition="all 0.2s ease"
                    cursor="pointer"
                    onClick={() => setCurrentStep(index)}
                    _hover={{ bg: index === currentStep ? "#3b82f6" : "rgba(255, 255, 255, 0.5)" }}
                  />
                ))}
              </HStack>

              {/* Action Buttons */}
              <HStack justify="space-between" align="center">
                <HStack gap={2}>
                  {currentStep > 0 && (
                    <UniformButton
                      variant="secondary"
                      size="sm"
                      onClick={prevStep}
                    >
                      ← Previous
                    </UniformButton>
                  )}
                </HStack>
                
                <HStack gap={2}>
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
                    {currentStep === tutorialSteps.length - 1 ? 'Get Started →' : 'Next →'}
                  </UniformButton>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </UniformCard>
    </Box>
    </Portal>
  );
}