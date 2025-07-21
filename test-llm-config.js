/**
 * Simple LLM Configuration Test
 * LLM設定の簡易テスト
 */

// Node.js環境での設定確認
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Check:');
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
console.log('LLM_MODEL:', process.env.LLM_MODEL);
console.log('LLM_MODEL_CRITICAL:', process.env.LLM_MODEL_CRITICAL);
console.log('LLM_MODEL_DEFAULT:', process.env.LLM_MODEL_DEFAULT);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// 動的import でESモジュールを読み込み
async function testLLMConfig() {
  try {
    const { 
      validateLLMConfig, 
      logLLMConfig, 
      createChatOpenAI,
      getModelForAgent,
      getTemperatureForAgent 
    } = await import('./lib/config/llm-config.js');

    console.log('\n🧪 LLM Configuration Test Results:\n');
    
    // 設定の検証
    const validation = validateLLMConfig();
    if (validation.isValid) {
      console.log('✅ Configuration is valid!');
    } else {
      console.log('❌ Configuration has errors:');
      validation.errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }

    // エージェント別設定テスト
    console.log('\n📋 Agent-specific Settings:');
    const agentTypes = ['analyst', 'critic', 'researcher', 'planner', 'ideator', 'writer', 'coordinator'];
    
    agentTypes.forEach(agentType => {
      const model = getModelForAgent(agentType);
      const temperature = getTemperatureForAgent(agentType);
      console.log(`  ${agentType}: ${model} (temp: ${temperature})`);
    });

    // LLM インスタンス作成テスト
    console.log('\n⚙️  LLM Instance Creation Test:');
    
    try {
      const analystLLM = createChatOpenAI('analyst');
      console.log('✅ Analyst LLM created successfully');
      
      const ideatorLLM = createChatOpenAI('ideator');
      console.log('✅ Ideator LLM created successfully');
      
      const writerLLM = createChatOpenAI('writer');
      console.log('✅ Writer LLM created successfully');
      
    } catch (error) {
      console.log('❌ LLM creation failed:', error.message);
    }

    // 詳細ログ表示
    console.log('\n📊 Detailed Configuration:');
    logLLMConfig();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLLMConfig();