#!/usr/bin/env ts-node
/**
 * LLM Configuration Validation Script
 * LLM設定の検証スクリプト
 */

import { validateLLMConfig, logLLMConfig, createChatOpenAI } from '../lib/config/llm-config.js';

async function main() {
  console.log('🔍 LLM Configuration Validation\n');
  
  // 設定の検証
  const validation = validateLLMConfig();
  
  if (validation.isValid) {
    console.log('✅ Configuration is valid!\n');
  } else {
    console.log('❌ Configuration has errors:\n');
    validation.errors.forEach(error => console.log(`  ❌ ${error}`));
    console.log('');
  }
  
  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    console.log('');
  }
  
  // 詳細設定の表示
  logLLMConfig();
  
  // 各エージェントタイプでの実際のLLM初期化テスト
  console.log('\n🧪 Testing LLM Initialization...\n');
  
  const agentTypes = ['analyst', 'critic', 'researcher', 'planner', 'ideator', 'writer', 'coordinator'] as const;
  
  for (const agentType of agentTypes) {
    try {
      const llm = createChatOpenAI(agentType);
      console.log(`✅ ${agentType}: Successfully initialized`);
      
      // 簡単なテスト呼び出し（APIキーが有効かチェック）
      if (process.env.OPENAI_API_KEY) {
        try {
          await llm.invoke('Test');
          console.log(`  ✅ API call successful`);
        } catch (error) {
          console.log(`  ⚠️  API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${agentType}: Failed to initialize - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n✨ Validation complete!');
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

export { main };