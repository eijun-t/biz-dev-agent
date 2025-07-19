/**
 * Simple Research Phase Test API (No Auth Required)
 * 認証不要のシンプルなテストAPI
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Research Phase Test API is working!',
    timestamp: new Date().toISOString(),
    test_endpoints: {
      planner_test: 'POST /api/agents/research/test-simple with { "test": "planner" }',
      basic_validation: 'POST /api/agents/research/test-simple with { "test": "validation" }'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test } = body;

    console.log('🧪 シンプルテスト開始:', { test });

    switch (test) {
      case 'planner':
        return await testPlannerBasic();
      case 'validation':
        return await testValidation();
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          valid_tests: ['planner', 'validation']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('テストエラー:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testPlannerBasic() {
  try {
    // 基本的な型とユーティリティ関数のテスト
    const { 
      MITSUBISHI_CAPABILITIES, 
      RESEARCH_KEYWORDS, 
      generateResearchItemId,
      calculatePriority
    } = await import('@/lib/agents/research/utils');

    // 基本的な機能チェック
    const testId = generateResearchItemId('startup_trends', 'japan', 1);
    const testPriority = calculatePriority('startup_trends', 'japan', 'フィンテック');
    
    return NextResponse.json({
      success: true,
      test: 'planner',
      results: {
        mitsubishi_capabilities_count: MITSUBISHI_CAPABILITIES.length,
        research_keywords_categories: Object.keys(RESEARCH_KEYWORDS),
        test_id_generated: testId,
        test_priority: testPriority,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testValidation() {
  try {
    // 基本的な検証テスト
    const checks = {
      environment_variables: {
        openai_key: !!process.env.OPENAI_API_KEY,
        serper_key: !!process.env.SERPER_API_KEY,
        llm_provider: process.env.LLM_PROVIDER || 'not_set',
        llm_model: process.env.LLM_MODEL || 'not_set'
      },
      imports: {
        types: false,
        utils: false,
        planner: false,
        researcher: false,
        coordinator: false
      }
    };

    // インポートテスト
    try {
      await import('@/lib/agents/research/types');
      checks.imports.types = true;
    } catch (e) {
      console.error('Types import failed:', e);
    }

    try {
      await import('@/lib/agents/research/utils');
      checks.imports.utils = true;
    } catch (e) {
      console.error('Utils import failed:', e);
    }

    try {
      await import('@/lib/agents/research/planner');
      checks.imports.planner = true;
    } catch (e) {
      console.error('Planner import failed:', e);
    }

    try {
      await import('@/lib/agents/research/researcher');
      checks.imports.researcher = true;
    } catch (e) {
      console.error('Researcher import failed:', e);
    }

    try {
      await import('@/lib/agents/research/coordinator');
      checks.imports.coordinator = true;
    } catch (e) {
      console.error('Coordinator import failed:', e);
    }

    const allImportsWorking = Object.values(checks.imports).every(Boolean);
    const hasRequiredEnvVars = checks.environment_variables.openai_key && checks.environment_variables.serper_key;

    return NextResponse.json({
      success: true,
      test: 'validation',
      results: {
        all_imports_working: allImportsWorking,
        has_required_env_vars: hasRequiredEnvVars,
        details: checks,
        recommendations: [
          ...(hasRequiredEnvVars ? [] : ['Set OPENAI_API_KEY and SERPER_API_KEY in .env.local']),
          ...(allImportsWorking ? [] : ['Fix import issues before proceeding'])
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}