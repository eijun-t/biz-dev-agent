/**
 * LLM Configuration Test API
 * LLM設定テスト用API
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateLLMConfig, 
  createChatOpenAI,
  getModelForAgent,
  getTemperatureForAgent 
} from '@/lib/config/llm-config';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testType = url.searchParams.get('type') || 'basic';

    if (testType === 'basic') {
      return testBasicConfiguration();
    } else if (testType === 'agents') {
      return testAgentConfiguration();
    } else if (testType === 'api') {
      return await testAPICall();
    } else {
      return NextResponse.json({
        error: 'Invalid test type. Use: basic, agents, or api'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('LLM config test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function testBasicConfiguration() {
  const validation = validateLLMConfig();
  
  return NextResponse.json({
    success: validation.isValid,
    test_type: 'basic',
    validation: {
      is_valid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    },
    environment_variables: {
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      LLM_MODEL: process.env.LLM_MODEL,
      LLM_MODEL_CRITICAL: process.env.LLM_MODEL_CRITICAL,
      LLM_MODEL_DEFAULT: process.env.LLM_MODEL_DEFAULT,
      LLM_MAX_TOKENS: process.env.LLM_MAX_TOKENS,
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY
    }
  });
}

function testAgentConfiguration() {
  const agentTypes = ['analyst', 'critic', 'researcher', 'planner', 'ideator', 'writer', 'coordinator'];
  const agentConfigs: any = {};
  const creationResults: any = {};

  agentTypes.forEach(agentType => {
    try {
      const model = getModelForAgent(agentType as any);
      const temperature = getTemperatureForAgent(agentType as any);
      
      agentConfigs[agentType] = {
        model,
        temperature
      };

      // LLM作成テスト
      const llm = createChatOpenAI(agentType as any);
      creationResults[agentType] = {
        success: true,
        message: 'Successfully created'
      };
      
    } catch (error) {
      creationResults[agentType] = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  return NextResponse.json({
    success: true,
    test_type: 'agents',
    agent_configurations: agentConfigs,
    creation_results: creationResults
  });
}

async function testAPICall() {
  try {
    // 実際のAPI呼び出しテスト（短いプロンプト）
    const testLLM = createChatOpenAI('default');
    
    const startTime = Date.now();
    const response = await testLLM.invoke('Hello! Please respond with just "OK".');
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      test_type: 'api',
      api_test: {
        success: true,
        response: response.content,
        duration_ms: duration,
        model_used: testLLM.modelName || 'unknown'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'api',
      api_test: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_type = 'default', test_prompt = 'Hello! Please respond with just "Test successful".' } = body;

    // 指定されたエージェントタイプでのテスト
    const llm = createChatOpenAI(agent_type);
    
    const startTime = Date.now();
    const response = await llm.invoke(test_prompt);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      agent_type,
      test_result: {
        prompt: test_prompt,
        response: response.content,
        duration_ms: duration,
        model: getModelForAgent(agent_type),
        temperature: getTemperatureForAgent(agent_type)
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}