// Test AI Service functionality
import { aiService } from '../services/aiService';

export async function testAIService() {
  console.log('Testing AI Service...');
  
  try {
    // Test basic contract generation
    const testRequest = {
      description: 'Create a simple payment contract',
      template: 'payment',
      language: 'clarity',
      requirements: ['Include error handling', 'Add security checks']
    };

    console.log('Test request:', testRequest);
    
    const response = await aiService.generateContract(testRequest);
    console.log('AI Service test successful:', response);
    
    return {
      success: true,
      response
    };
  } catch (error) {
    console.error('AI Service test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Auto-test on module load (for development)
if (process.env.NODE_ENV === 'development') {
  testAIService();
}
