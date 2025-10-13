// Test new OpenAI API key
const testNewAPI = async (apiKey) => {
  console.log('Testing new OpenAI API key...');
  console.log('API Key:', apiKey.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Generate a simple Clarity smart contract for a payment system with create-payment and mark-paid functions.'
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
    return true;
    
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
};

// Usage: node test-new-api.js YOUR_API_KEY_HERE
const apiKey = process.argv[2];
if (!apiKey) {
  console.log('Usage: node test-new-api.js YOUR_API_KEY_HERE');
  process.exit(1);
}

testNewAPI(apiKey).then(success => {
  if (success) {
    console.log('\n✅ API key is working! You can now add it to your environment variables.');
  } else {
    console.log('\n❌ API key test failed. Please check your key and try again.');
  }
});
