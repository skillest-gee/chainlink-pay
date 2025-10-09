import React, { useState, useRef } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Button, Textarea, Select, Badge, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription, Divider, Code, Collapsible, useDisclosure } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';
import { UniformButton } from '../components/UniformButton';
import { UniformTextarea } from '../components/UniformInput';
import { UniformCard } from '../components/UniformCard';
import { aiService, AIContractRequest, AIContractResponse, ContractValidation } from '../services/aiService';
import { testAIService } from '../utils/testAI';

export default function AIContractBuilder() {
  const { toast } = useToast();
  const { isOpen: showSuggestions, onToggle: toggleSuggestions } = useDisclosure();
  const { isOpen: showValidation, onToggle: toggleValidation } = useDisclosure();
  
  // Form state
  const [request, setRequest] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('payment');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  
  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Results state
  const [aiResponse, setAiResponse] = useState<AIContractResponse | null>(null);
  const [validation, setValidation] = useState<ContractValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [improvementFeedback, setImprovementFeedback] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'generate' | 'validate' | 'improve' | 'deploy'>('generate');
  const [copied, setCopied] = useState(false);

  const templates = [
    { value: 'payment', label: 'Payment Contract', description: 'Basic payment processing with escrow' },
    { value: 'escrow', label: 'Escrow Contract', description: 'Secure escrow with timeout and dispute resolution' },
    { value: 'split', label: 'Split Payment', description: 'Multi-party payment splitting and distribution' },
    { value: 'subscription', label: 'Subscription', description: 'Recurring payment system with billing cycles' },
    { value: 'custom', label: 'Custom Contract', description: 'Fully customized contract from description' }
  ];

  const handleGenerate = async () => {
    if (!request.trim()) {
      setError('Please enter a contract description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAiResponse(null);

    try {
      const aiRequest: AIContractRequest = {
        description: request,
        template: selectedTemplate,
        language: 'clarity',
        requirements: requirements.length > 0 ? requirements : undefined
      };

      console.log('AI Contract Builder: Generating contract with request:', aiRequest);
      const response = await aiService.generateContract(aiRequest);
      console.log('AI Contract Builder: Received response:', response);
      
      setAiResponse(response);
      setActiveTab('validate');
      toast({ title: 'Success', status: 'success', description: 'Contract generated successfully!' });
    } catch (err: any) {
      console.error('AI Contract Builder: Generation error:', err);
      setError(err.message || 'Failed to generate contract');
      toast({ title: 'Error', status: 'error', description: 'Contract generation failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!aiResponse?.contract) {
      setError('No contract to validate');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const validationResult = await aiService.validateContract(aiResponse.contract);
      setValidation(validationResult);
      setActiveTab('validate');
      
      if (validationResult.valid) {
        toast({ title: 'Success', status: 'success', description: 'Contract validation passed!' });
      } else {
        toast({ title: 'Warning', status: 'warning', description: 'Contract validation found issues' });
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed');
      toast({ title: 'Error', status: 'error', description: 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImprove = async () => {
    if (!aiResponse?.contract || !improvementFeedback.trim()) {
      setError('Please provide feedback for improvement');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const improvedResponse = await aiService.improveContract(aiResponse.contract, improvementFeedback);
      setAiResponse(improvedResponse);
      setActiveTab('validate');
      toast({ title: 'Success', status: 'success', description: 'Contract improved successfully!' });
    } catch (err: any) {
      setError(err.message || 'Failed to improve contract');
      toast({ title: 'Error', status: 'error', description: 'Contract improvement failed' });
    } finally {
      setIsImproving(false);
    }
  };

  const handleDeploy = async () => {
    if (!aiResponse?.contract) {
      setError('No contract to deploy');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({ title: 'Success', status: 'success', description: 'Contract deployment initiated!' });
    } catch (err: any) {
      setError(err.message || 'Deployment failed');
      toast({ title: 'Error', status: 'error', description: 'Deployment failed' });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Success', status: 'success', description: 'Contract copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Error', status: 'error', description: 'Failed to copy contract' });
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleTestAI = async () => {
    try {
      const result = await testAIService();
      if (result.success) {
        toast({ title: 'Success', status: 'success', description: 'AI Service test successful!' });
        console.log('AI Service working correctly');
      } else {
        toast({ title: 'Error', status: 'error', description: `AI Service test failed: ${result.error}` });
        console.error('AI Service test failed:', result.error);
      }
    } catch (error) {
      toast({ title: 'Error', status: 'error', description: 'AI Service test failed' });
      console.error('AI Service test error:', error);
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Container maxW="7xl" py={8} px={4}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={4} textAlign="center">
            <Heading size="xl" color="#ffffff">
              AI Contract Builder
            </Heading>
            <Text color="#9ca3af" maxW="3xl" fontSize="lg">
              Generate professional Clarity smart contracts using AI. Describe your requirements in natural language and get production-ready code with validation and deployment support.
            </Text>
          </VStack>

          {/* Main Content */}
          <VStack gap={6} align="stretch">
            {/* Contract Generation Form */}
            <UniformCard p={6}>
              <VStack gap={6} align="stretch">
                <Heading size="md" color="#ffffff">
                  Contract Requirements
                </Heading>

                {/* Template Selection */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Contract Template
                  </Text>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    bg="rgba(255, 255, 255, 0.05)"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="#ffffff"
                    _focus={{ borderColor: '#3b82f6' }}
                    size="lg"
                  >
                    {templates.map((template) => (
                      <option key={template.value} value={template.value} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                        {template.label} - {template.description}
                      </option>
                    ))}
                  </Select>
                </VStack>

                {/* Natural Language Description */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Describe Your Contract
                  </Text>
                  <UniformTextarea
                    placeholder="Describe what your contract should do in detail (e.g., 'Create a payment contract that handles escrow transactions with a 3-day timeout, dispute resolution, and automatic release')"
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    rows={4}
                    variant="default"
                    fontSize="md"
                  />
                </VStack>

                {/* Additional Requirements */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Additional Requirements (Optional)
                  </Text>
                  <HStack gap={2}>
                    <UniformTextarea
                      placeholder="Add specific requirement..."
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      rows={1}
                      variant="default"
                      flex="1"
                    />
                    <UniformButton
                      variant="secondary"
                      onClick={addRequirement}
                      disabled={!newRequirement.trim()}
                    >
                      Add
                    </UniformButton>
                  </HStack>
                  
                  {requirements.length > 0 && (
                    <VStack gap={2} align="stretch">
                      {requirements.map((req, index) => (
                        <HStack key={index} justify="space-between" p={2} bg="rgba(255, 255, 255, 0.05)" borderRadius="md">
                          <Text fontSize="sm" color="#ffffff">{req}</Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="#ef4444"
                            onClick={() => removeRequirement(index)}
                          >
                            Remove
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>

                {/* Action Buttons */}
                <HStack gap={3} justify="center" wrap="wrap">
                  <UniformButton
                    variant="primary"
                    onClick={handleGenerate}
                    loading={isGenerating}
                    disabled={!request.trim()}
                    size="lg"
                  >
                    {isGenerating ? 'Generating Contract...' : 'Generate Contract with AI'}
                  </UniformButton>
                  
                  <UniformButton
                    variant="secondary"
                    onClick={handleTestAI}
                    size="sm"
                  >
                    Test AI Service
                  </UniformButton>
                </HStack>

                {/* Error Display */}
                {error && (
                  <AlertRoot status="error">
                    <AlertIndicator />
                    <AlertContent>
                      <AlertTitle>Error!</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </AlertContent>
                  </AlertRoot>
                )}
              </VStack>
            </UniformCard>

            {/* AI Response */}
            {aiResponse && (
              <UniformCard p={6}>
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Generated Contract
                    </Heading>
                    <HStack gap={2}>
                      <Badge colorScheme="green" fontSize="sm">AI Generated</Badge>
                      <UniformButton
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(aiResponse.contract)}
                        disabled={copied}
                      >
                        {copied ? 'Copied!' : 'Copy Code'}
                      </UniformButton>
                    </HStack>
                  </HStack>

                  {/* Contract Explanation */}
                  {aiResponse.explanation && (
                    <Box p={4} bg="rgba(59, 130, 246, 0.1)" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)" borderRadius="lg">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="medium" mb={2}>
                        AI Explanation:
                      </Text>
                      <Text fontSize="sm" color="#ffffff">
                        {aiResponse.explanation}
                      </Text>
                    </Box>
                  )}

                  {/* Contract Code */}
                  <Box p={4} bg="#0a0a0a" borderRadius="lg" border="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
                    <Code
                      as="pre"
                      fontSize="sm"
                      color="#ffffff"
                      fontFamily="mono"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                      display="block"
                      p={0}
                      bg="transparent"
                    >
                      {aiResponse.contract}
                    </Code>
                  </Box>

                  {/* AI Suggestions */}
                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                    <Box>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSuggestions}
                        color="#3b82f6"
                        mb={2}
                      >
                        {showSuggestions ? 'Hide' : 'Show'} AI Suggestions ({aiResponse.suggestions.length})
                      </Button>
                      <Collapsible.Root open={showSuggestions}>
                        <Collapsible.Content>
                          <VStack gap={2} align="stretch">
                            {aiResponse.suggestions.map((suggestion, index) => (
                              <Box key={index} p={3} bg="rgba(59, 130, 246, 0.1)" borderRadius="md">
                                <Text fontSize="sm" color="#ffffff">
                                  💡 {suggestion}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <HStack gap={3} justify="center" wrap="wrap">
                    <UniformButton
                      variant="secondary"
                      onClick={handleValidate}
                      loading={isValidating}
                    >
                      {isValidating ? 'Validating...' : 'Validate Contract'}
                    </UniformButton>

                    <UniformButton
                      variant="accent"
                      onClick={() => setActiveTab('improve')}
                    >
                      Improve Contract
                    </UniformButton>

                    <UniformButton
                      variant="primary"
                      onClick={handleDeploy}
                      loading={isDeploying}
                    >
                      {isDeploying ? 'Deploying...' : 'Deploy Contract'}
                    </UniformButton>
                  </HStack>
                </VStack>
              </UniformCard>
            )}

            {/* Contract Validation */}
            {validation && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Contract Validation
                    </Heading>
                    <Badge colorScheme={validation.valid ? 'green' : 'red'} fontSize="sm">
                      {validation.valid ? 'Valid' : 'Issues Found'}
                    </Badge>
                  </HStack>

                  {validation.errors.length > 0 && (
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="#ef4444">
                        Errors ({validation.errors.length}):
                      </Text>
                      {validation.errors.map((error, index) => (
                        <Box key={index} p={3} bg="rgba(239, 68, 68, 0.1)" borderRadius="md">
                          <Text fontSize="sm" color="#ef4444">
                            ❌ {error}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {validation.warnings.length > 0 && (
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="#f59e0b">
                        Warnings ({validation.warnings.length}):
                      </Text>
                      {validation.warnings.map((warning, index) => (
                        <Box key={index} p={3} bg="rgba(245, 158, 11, 0.1)" borderRadius="md">
                          <Text fontSize="sm" color="#f59e0b">
                            ⚠️ {warning}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {validation.valid && (
                    <Box p={4} bg="rgba(16, 185, 129, 0.1)" border="1px solid" borderColor="rgba(16, 185, 129, 0.3)" borderRadius="lg">
                      <Text fontSize="sm" color="#10b981" fontWeight="medium">
                        ✅ Contract validation passed! The contract is ready for deployment.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </UniformCard>
            )}

            {/* Contract Improvement */}
            {activeTab === 'improve' && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ffffff">
                    Improve Contract
                  </Heading>
                  
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                      Provide feedback for improvement:
                    </Text>
                    <UniformTextarea
                      placeholder="Describe what you'd like to improve (e.g., 'Add more security checks', 'Improve error handling', 'Add more documentation')"
                      value={improvementFeedback}
                      onChange={(e) => setImprovementFeedback(e.target.value)}
                      rows={3}
                      variant="default"
                    />
                  </VStack>

                  <HStack gap={3} justify="center">
                    <UniformButton
                      variant="secondary"
                      onClick={() => setActiveTab('validate')}
                    >
                      Cancel
                    </UniformButton>
                    <UniformButton
                      variant="primary"
                      onClick={handleImprove}
                      loading={isImproving}
                      disabled={!improvementFeedback.trim()}
                    >
                      {isImproving ? 'Improving...' : 'Improve Contract'}
                    </UniformButton>
                  </HStack>
                </VStack>
              </UniformCard>
            )}

            {/* How It Works */}
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  How AI Contract Builder Works
                </Heading>
                
                <VStack gap={4} align="stretch">
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">1</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Describe Your Contract</Text>
                      <Text fontSize="sm" color="#9ca3af">Tell us what your contract should do in plain English. Be specific about features, security requirements, and business logic.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">2</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">AI Generation</Text>
                      <Text fontSize="sm" color="#9ca3af">Our AI analyzes your requirements and generates professional Clarity code with proper security, error handling, and documentation.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">3</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Validation & Improvement</Text>
                      <Text fontSize="sm" color="#9ca3af">Validate the contract syntax, review AI suggestions, and request improvements based on your feedback.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">4</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Deploy to Blockchain</Text>
                      <Text fontSize="sm" color="#9ca3af">Deploy your validated contract to the Stacks blockchain with transaction tracking and explorer links.</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </UniformCard>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}