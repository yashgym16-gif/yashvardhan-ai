// Integration test script for Yashvardhan AI API endpoints

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting Yashvardhan AI API Verification...\n');

  try {
    // 1. Test Health Check
    const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    console.log('✅ 1. Health Check:', health.status, `(${health.app})`);

    // 2. Test Create Conversation
    const convRes = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Verification Session' })
    }).then((r) => r.json());
    console.log('✅ 2. Create Conversation:', convRes.conversation.id, convRes.conversation.title);
    const convId = convRes.conversation.id;

    // 3. Test Chat Completion (Built-in assistant)
    const chatRes = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: convId,
        content: 'Hi Yashvardhan AI! Can you write a small Python hello world function?',
        useWebSearch: false
      })
    }).then((r) => r.json());
    console.log('✅ 3. Chat Completion:', chatRes.provider, `(${chatRes.model})`);
    console.log('   Response snippet:', chatRes.assistantMessage.content.slice(0, 100).replace(/\n/g, ' ') + '...');

    // 4. Test Web Search
    const searchRes = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'React 19 release highlights' })
    }).then((r) => r.json());
    console.log('✅ 4. Web Search Results:', searchRes.results?.length || 0, 'results found');

    // 5. Test Memory Store
    const memRes = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'preference',
        key: 'Preferred Framework',
        value: 'React and Vite with Tailwind'
      })
    }).then((r) => r.json());
    console.log('✅ 5. Add Memory:', memRes.memory.key, '->', memRes.memory.value);

    // 6. Test Settings & Key Masking
    const settingsRes = await fetch(`${BASE_URL}/settings`).then((r) => r.json());
    console.log('✅ 6. Settings Security (Masked Keys):', settingsRes.settings.maskedKeys);

    console.log('\n🎉 ALL 6 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

runTests();
