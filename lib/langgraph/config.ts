/**
 * LangGraph.js Configuration
 * 環境変数ベースのLLMプロバイダー選択とモデル設定
 */

import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface SystemConfig {
  llm: LLMConfig;
  maxExecutionTime: number;
  maxRetries: number;
  sessionTimeout: number;
}

/**
 * 環境変数から設定を読み込む
 */
export function loadConfig(): SystemConfig {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const model = process.env.LLM_MODEL || 'gpt-4o';
  
  let apiKey = '';
  switch (provider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || '';
      break;
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${provider}`);
  }

  return {
    llm: {
      provider,
      model,
      apiKey,
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000
    },
    maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '600000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000')
  };
}

/**
 * 設定に基づいてLLMインスタンスを作成
 */
export function createLLM(config: LLMConfig): BaseChatModel {
  switch (config.provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: config.model,
        openAIApiKey: config.apiKey,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeout: config.timeout
      });
    
    // 将来的な拡張用
    case 'anthropic':
      throw new Error('Anthropic support not implemented yet');
    
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

/**
 * システム設定の検証
 */
export function validateConfig(config: SystemConfig): void {
  if (!config.llm.apiKey) {
    throw new Error('LLM API key is required');
  }
  
  if (config.maxExecutionTime < 60000) {
    throw new Error('Max execution time must be at least 60 seconds');
  }
  
  if (config.maxRetries < 1 || config.maxRetries > 10) {
    throw new Error('Max retries must be between 1 and 10');
  }
}