/**
 * Centralized LLM Configuration
 * 中央集権的LLM設定管理
 */

import { ChatOpenAI } from '@langchain/openai';

// LLM Provider Types
export type LLMProvider = 'openai' | 'anthropic' | 'google';

// Agent Types for LLM Selection
export type AgentType = 
  | 'analyst' 
  | 'critic' 
  | 'researcher' 
  | 'planner' 
  | 'ideator' 
  | 'writer' 
  | 'coordinator'
  | 'default';

// LLM Configuration Interface
export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}

// Agent-specific temperature settings
const AGENT_TEMPERATURES: Record<AgentType, number> = {
  analyst: 0.2,      // 数値分析の精度重視
  critic: 0.2,       // 評価の一貫性重視  
  researcher: 0.7,   // 調査バランス
  planner: 0.7,      // 計画立案バランス
  ideator: 0.8,      // 創造性重視
  writer: 0.6,       // 構造化と創造性のバランス
  coordinator: 0.5,  // ワークフロー調整
  default: 0.7       // デフォルト
};

// Environment variable keys
const ENV_KEYS = {
  PROVIDER: 'LLM_PROVIDER',
  MODEL_CRITICAL: 'LLM_MODEL_CRITICAL',
  MODEL_DEFAULT: 'LLM_MODEL_DEFAULT',
  MODEL_FALLBACK: 'LLM_MODEL',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  MAX_TOKENS: 'LLM_MAX_TOKENS',
  // Agent-specific temperature overrides
  TEMP_ANALYST: 'LLM_TEMP_ANALYST',
  TEMP_CRITIC: 'LLM_TEMP_CRITIC',
  TEMP_RESEARCHER: 'LLM_TEMP_RESEARCHER',
  TEMP_PLANNER: 'LLM_TEMP_PLANNER',
  TEMP_IDEATOR: 'LLM_TEMP_IDEATOR',
  TEMP_WRITER: 'LLM_TEMP_WRITER',
  TEMP_COORDINATOR: 'LLM_TEMP_COORDINATOR',
  TEMP_DEFAULT: 'LLM_TEMP_DEFAULT'
} as const;

/**
 * Get LLM provider from environment
 */
export function getLLMProvider(): LLMProvider {
  const provider = process.env[ENV_KEYS.PROVIDER]?.toLowerCase() as LLMProvider;
  if (provider && ['openai', 'anthropic', 'google'].includes(provider)) {
    return provider;
  }
  console.warn(`Invalid LLM_PROVIDER: ${provider}, defaulting to 'openai'`);
  return 'openai';
}

/**
 * Get model name for specific agent type
 */
export function getModelForAgent(agentType: AgentType): string {
  // Critical agents (Analyst, Critic) use LLM_MODEL_CRITICAL
  if (agentType === 'analyst' || agentType === 'critic') {
    return process.env[ENV_KEYS.MODEL_CRITICAL] || 
           process.env[ENV_KEYS.MODEL_FALLBACK] || 
           'gpt-4o';
  }
  
  // Default agents use LLM_MODEL_DEFAULT
  return process.env[ENV_KEYS.MODEL_DEFAULT] || 
         process.env[ENV_KEYS.MODEL_FALLBACK] || 
         'gpt-4o';
}

/**
 * Get temperature for specific agent type
 */
export function getTemperatureForAgent(agentType: AgentType): number {
  // Check for agent-specific environment variable override
  const envKey = `TEMP_${agentType.toUpperCase()}` as keyof typeof ENV_KEYS;
  const envTemp = process.env[ENV_KEYS[envKey]];
  
  if (envTemp) {
    const temp = parseFloat(envTemp);
    if (!isNaN(temp) && temp >= 0 && temp <= 2) {
      return temp;
    }
    console.warn(`Invalid temperature for ${agentType}: ${envTemp}, using default`);
  }
  
  return AGENT_TEMPERATURES[agentType] || AGENT_TEMPERATURES.default;
}

/**
 * Get API key for specific provider
 */
export function getAPIKey(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return process.env[ENV_KEYS.OPENAI_API_KEY] || '';
    case 'anthropic':
      return process.env[ENV_KEYS.ANTHROPIC_API_KEY] || '';
    case 'google':
      // Add Google API key handling if needed
      return '';
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Get max tokens from environment
 */
export function getMaxTokens(): number {
  const maxTokens = process.env[ENV_KEYS.MAX_TOKENS];
  if (maxTokens) {
    const tokens = parseInt(maxTokens, 10);
    if (!isNaN(tokens) && tokens > 0) {
      return tokens;
    }
  }
  return 4000; // Default
}

/**
 * Create LLM configuration for specific agent
 */
export function createLLMConfig(agentType: AgentType = 'default'): LLMConfig {
  const provider = getLLMProvider();
  const model = getModelForAgent(agentType);
  const temperature = getTemperatureForAgent(agentType);
  const maxTokens = getMaxTokens();
  const apiKey = getAPIKey(provider);

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${provider}`);
  }

  return {
    provider,
    model,
    temperature,
    maxTokens,
    apiKey
  };
}

/**
 * Create ChatOpenAI instance for specific agent
 */
export function createChatOpenAI(agentType: AgentType = 'default'): ChatOpenAI {
  const config = createLLMConfig(agentType);
  
  if (config.provider !== 'openai') {
    console.warn(`Non-OpenAI provider requested (${config.provider}), falling back to OpenAI`);
  }

  // Special configuration for writer agent (needs more tokens for full report)
  const maxTokens = agentType === 'writer' ? 8000 : config.maxTokens;

  try {
    const llm = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: maxTokens,
      timeout: 120000, // 2 minutes for writer, 60 seconds for others
    });

    console.log(`LLM initialized for ${agentType}: ${config.model} (temp: ${config.temperature})`);
    return llm;
    
  } catch (error) {
    console.error(`Failed to initialize LLM for ${agentType}:`, error);
    
    // Fallback to gpt-4o with default settings
    const fallbackLLM = new ChatOpenAI({
      apiKey: config.apiKey,
      model: 'gpt-4o',
      temperature: AGENT_TEMPERATURES[agentType] || 0.7,
      maxTokens: 4000,
      timeout: 60000,
    });
    
    console.warn(`Using fallback LLM for ${agentType}: gpt-4o`);
    return fallbackLLM;
  }
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check provider
  const provider = getLLMProvider();
  const apiKey = getAPIKey(provider);
  
  if (!apiKey) {
    errors.push(`Missing API key for provider: ${provider}`);
  }
  
  // Check model settings
  const criticalModel = process.env[ENV_KEYS.MODEL_CRITICAL];
  const defaultModel = process.env[ENV_KEYS.MODEL_DEFAULT];
  
  if (!criticalModel && !process.env[ENV_KEYS.MODEL_FALLBACK]) {
    warnings.push('No LLM_MODEL_CRITICAL set, using fallback');
  }
  
  if (!defaultModel && !process.env[ENV_KEYS.MODEL_FALLBACK]) {
    warnings.push('No LLM_MODEL_DEFAULT set, using fallback');
  }
  
  // Check temperature overrides
  Object.entries(ENV_KEYS).forEach(([key, envKey]) => {
    if (key.startsWith('TEMP_') && process.env[envKey]) {
      const temp = parseFloat(process.env[envKey]!);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        warnings.push(`Invalid temperature in ${envKey}: ${process.env[envKey]}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Log current LLM configuration (for debugging)
 */
export function logLLMConfig(): void {
  const agentTypes: AgentType[] = ['analyst', 'critic', 'researcher', 'planner', 'ideator', 'writer', 'coordinator'];
  
  console.log('=== LLM Configuration ===');
  console.log(`Provider: ${getLLMProvider()}`);
  console.log(`Max Tokens: ${getMaxTokens()}`);
  console.log('');
  console.log('Agent Models & Temperatures:');
  
  agentTypes.forEach(agentType => {
    const model = getModelForAgent(agentType);
    const temperature = getTemperatureForAgent(agentType);
    console.log(`  ${agentType}: ${model} (temp: ${temperature})`);
  });
  
  const validation = validateLLMConfig();
  if (validation.errors.length > 0) {
    console.log('\nErrors:');
    validation.errors.forEach(error => console.log(`  ❌ ${error}`));
  }
  if (validation.warnings.length > 0) {
    console.log('\nWarnings:');
    validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  }
  console.log('========================');
}

// Export types and utilities
export { AGENT_TEMPERATURES, ENV_KEYS };