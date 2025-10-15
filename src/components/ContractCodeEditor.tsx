import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Textarea, Badge } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';
import { UniformButton } from './UniformButton';

interface ContractCodeEditorProps {
  initialCode: string;
  onCodeChange: (code: string) => void;
  onSave: (code: string) => void;
  onCancel: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export const ContractCodeEditor: React.FC<ContractCodeEditorProps> = ({
  initialCode,
  onCodeChange,
  onSave,
  onCancel,
  isEditing,
  onToggleEdit
}) => {
  const [editedCode, setEditedCode] = useState(initialCode);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditedCode(initialCode);
    setHasChanges(false);
  }, [initialCode]);

  const handleCodeChange = (value: string) => {
    setEditedCode(value);
    setHasChanges(value !== initialCode);
    onCodeChange(value);
  };

  const handleSave = () => {
    onSave(editedCode);
    setHasChanges(false);
    toast({
      title: 'Success',
      status: 'success',
      description: 'Contract code updated successfully!'
    });
  };

  const handleCancel = () => {
    setEditedCode(initialCode);
    setHasChanges(false);
    onCancel();
  };

  const handleReset = () => {
    setEditedCode(initialCode);
    setHasChanges(false);
    toast({
      title: 'Reset',
      status: 'info',
      description: 'Contract code reset to original'
    });
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Editor Header */}
      <HStack justify="space-between" align="center">
        <HStack gap={2}>
          <Text fontSize="md" fontWeight="medium" color="var(--text-primary)">
            Contract Code
          </Text>
          {isEditing && (
            <Badge colorScheme={hasChanges ? 'orange' : 'blue'} fontSize="xs">
              {hasChanges ? 'Modified' : 'Editing'}
            </Badge>
          )}
        </HStack>
        
        <HStack gap={2}>
          {!isEditing ? (
            <UniformButton
              variant="secondary"
              size="sm"
              onClick={onToggleEdit}
            >
              ✏️ Edit Code
            </UniformButton>
          ) : (
            <>
              <UniformButton
                variant="secondary"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                🔄 Reset
              </UniformButton>
              <UniformButton
                variant="secondary"
                size="sm"
                onClick={handleCancel}
              >
                ❌ Cancel
              </UniformButton>
              <UniformButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                💾 Save Changes
              </UniformButton>
            </>
          )}
        </HStack>
      </HStack>

      {/* Code Editor */}
      <Box position="relative">
        {isEditing ? (
          <Textarea
            value={editedCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Enter your Clarity contract code here..."
            fontFamily="mono"
            fontSize="sm"
            minH="400px"
            maxH="600px"
            resize="vertical"
            bg="var(--bg-secondary)"
            color="var(--text-primary)"
            border="1px solid"
            borderColor="var(--border-primary)"
            borderRadius="lg"
            _focus={{
              borderColor: "var(--text-accent)",
              boxShadow: "0 0 0 1px var(--text-accent)"
            }}
            _placeholder={{
              color: "var(--text-tertiary)"
            }}
            style={{
              fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
              lineHeight: "1.5"
            }}
          />
        ) : (
          <Box
            p={4}
            bg="var(--bg-secondary)"
            borderRadius="lg"
            border="1px solid"
            borderColor="var(--border-primary)"
            maxH="400px"
            overflowY="auto"
          >
            <Text
              as="pre"
              fontFamily="mono"
              fontSize="sm"
              color="var(--text-primary)"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              style={{
                fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                lineHeight: "1.5"
              }}
            >
              {editedCode}
            </Text>
          </Box>
        )}
      </Box>

      {/* Editor Help */}
      {isEditing && (
        <Box
          p={3}
          bg="rgba(59, 130, 246, 0.1)"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
          borderRadius="md"
        >
          <VStack gap={2} align="stretch">
            <Text fontSize="sm" color="var(--text-accent)" fontWeight="medium">
              💡 Editing Tips:
            </Text>
            <Text fontSize="xs" color="var(--text-secondary)">
              • Use proper Clarity syntax: (define-public (function-name (param type)))
              • Use stx-transfer? for STX transfers, not stx-transfer-from?
              • Use (ok value) and (err error) patterns in match statements
              • Use default-to u0 for safe map access: (default-to u0 (map-get? map-name key))
              • Use asserts! for validation: (asserts! condition error-constant)
            </Text>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};
