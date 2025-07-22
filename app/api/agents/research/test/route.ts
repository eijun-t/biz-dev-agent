/**
 * Research Phase Test API Endpoint
 * 研究フェーズのテスト用API（認証なし）
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/langgraph/config';
import { ResearchCoordinator } from '@/lib/agents/research';
import { ChatOpenAI } from '@langchain/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type, user_input, target_items } = body;

    console.log('🧪 研究フェーズテスト開始:', { test_type, user_input });

    // 設定を読み込み
    const config = loadConfig();
    const llm = new ChatOpenAI({
      apiKey: config.openai.apiKey,
      model: config.openai.model,
      temperature: 0.7,
      maxTokens: 4000
    });

    // 環境変数の確認
    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      return NextResponse.json({ 
        error: 'Serper API key not configured',
        note: 'Please set SERPER_API_KEY in .env.local'
      }, { status: 500 });
    }

    // 研究コーディネーターを初期化
    const coordinator = new ResearchCoordinator(
      llm,
      serperApiKey,
      parseInt(process.env.RESEARCH_PARALLEL_LIMIT || '3'), // テスト用に小さめの値
      parseInt(process.env.MAX_EXECUTION_TIME || '300000'), // 5分
      parseInt(process.env.MAX_RETRIES || '3')
    );

    let result;
    let testResults = {
      success: false,
      test_type,
      timestamp: new Date().toISOString(),
      details: {} as any,
      errors: [] as string[]
    };

    switch (test_type) {
      case 'planner_only':
        // プランナーのみテスト
        result = await testPlannerOnly(coordinator, user_input, target_items);
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'researcher_only':
        // リサーチャーのみテスト
        result = await testResearcherOnly(coordinator, user_input);
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'full_integration':
        // 完全統合テスト
        result = await testFullIntegration(coordinator, user_input);
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'performance':
        // パフォーマンステスト
        result = await testPerformance(coordinator, user_input);
        testResults.details = result;
        testResults.success = result.success;
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid test type',
          valid_types: ['planner_only', 'researcher_only', 'full_integration', 'performance']
        }, { status: 400 });
    }

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('研究フェーズテストエラー:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testPlannerOnly(
  coordinator: ResearchCoordinator,
  userInput: string,
  targetItems: number = 10
): Promise<unknown> {
  console.log('🎯 プランナーテスト開始');
  
  try {
    // @ts-expect-error - プライベートメソッドにアクセス
    const plan = await coordinator.planner.generateResearchPlan(userInput, targetItems);
    
    const planQuality = coordinator.planner.evaluatePlanQuality(plan);
    
    return {
      success: true,
      plan: {
        id: plan.id,
        total_items: plan.research_items.length,
        categories: [...new Set(plan.research_items.map(item => item.category))],
        regions: [...new Set(plan.research_items.map(item => item.region))],
        languages: [...new Set(plan.research_items.map(item => item.language))],
        avg_priority: plan.research_items.reduce((sum, item) => sum + item.priority, 0) / plan.research_items.length,
        estimated_time: plan.total_estimated_time
      },
      quality: planQuality,
      sample_items: plan.research_items.slice(0, 3).map(item => ({
        topic: item.topic,
        category: item.category,
        region: item.region,
        keywords: item.keywords,
        priority: item.priority
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testResearcherOnly(
  coordinator: ResearchCoordinator,
  userInput: string
): Promise<unknown> {
  console.log('🔍 リサーチャーテスト開始');
  
  try {
    // テスト用の研究項目を作成
    const testItem = {
      id: 'test_item_1',
      category: 'startup_trends' as const,
      topic: userInput || 'AI スタートアップ',
      keywords: ['AI', 'スタートアップ', '人工知能', 'ベンチャー'],
      region: 'japan' as const,
      language: 'ja' as const,
      priority: 8,
      estimated_effort: 15
    };

    // @ts-expect-error - プライベートメソッドにアクセス
    const result = await coordinator.researcher.executeResearch(testItem);
    
    return {
      success: true,
      research_item: testItem,
      search_results: {
        count: result.searchResults.length,
        avg_relevance: result.searchResults.reduce((sum, r) => sum + r.relevance_score, 0) / result.searchResults.length,
        sources: result.searchResults.map(r => r.source),
        sample_result: result.searchResults[0] ? {
          title: result.searchResults[0].title,
          snippet: result.searchResults[0].snippet.substring(0, 100),
          relevance_score: result.searchResults[0].relevance_score
        } : null
      },
      summary: {
        topic: result.summary.topic,
        business_potential: result.summary.business_potential,
        synergy_potential: result.summary.mitsubishi_synergy_potential,
        market_size: result.summary.market_size_indicator,
        tech_maturity: result.summary.technology_maturity,
        key_insights_count: result.summary.key_insights.length,
        sources_count: result.summary.sources.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testFullIntegration(
  coordinator: ResearchCoordinator,
  userInput: string
): Promise<unknown> {
  console.log('🚀 完全統合テスト開始');
  
  try {
    const startTime = Date.now();
    
    // 完全な研究フェーズを実行（小規模）
    const result = await coordinator.executeResearchPhase(userInput, 'test_session_full');
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    const statistics = coordinator.getPhaseStatistics(result);
    
    return {
      success: true,
      processing_time: processingTime,
      phase_result: {
        next_action: result.next_action,
        is_sufficient: result.is_sufficient,
        total_items: result.plan.research_items.length,
        completed_items: result.completed_items.length,
        summaries_count: result.summaries.length,
        evaluations_count: result.evaluations.length
      },
      statistics: statistics,
      sample_summaries: result.summaries.slice(0, 2).map(s => ({
        topic: s.topic,
        category: s.category,
        region: s.region,
        business_potential: s.business_potential,
        synergy_potential: s.mitsubishi_synergy_potential,
        market_size: s.market_size_indicator,
        insights_count: s.key_insights.length
      })),
      performance_metrics: {
        items_per_minute: (result.summaries.length / (processingTime / 60000)).toFixed(2),
        avg_processing_time_per_item: (processingTime / result.summaries.length).toFixed(0),
        success_rate: (result.summaries.length / result.plan.research_items.length * 100).toFixed(1)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testPerformance(
  coordinator: ResearchCoordinator,
  userInput: string
): Promise<unknown> {
  console.log('⚡ パフォーマンステスト開始');
  
  try {
    const tests = [
      { name: 'Small Plan (5 items)', items: 5 },
      { name: 'Medium Plan (10 items)', items: 10 },
      { name: 'Large Plan (15 items)', items: 15 }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const startTime = Date.now();
      
      // @ts-expect-error - プライベートメソッドにアクセス
      const plan = await coordinator.planner.generateResearchPlan(userInput, test.items);
      
      const planTime = Date.now() - startTime;
      
      results.push({
        test_name: test.name,
        target_items: test.items,
        actual_items: plan.research_items.length,
        plan_generation_time: planTime,
        estimated_research_time: plan.total_estimated_time,
        categories_coverage: [...new Set(plan.research_items.map(item => item.category))].length,
        regions_coverage: [...new Set(plan.research_items.map(item => item.region))].length
      });
    }
    
    return {
      success: true,
      performance_results: results,
      summary: {
        avg_plan_time: results.reduce((sum, r) => sum + r.plan_generation_time, 0) / results.length,
        avg_estimated_research_time: results.reduce((sum, r) => sum + r.estimated_research_time, 0) / results.length,
        total_test_time: results.reduce((sum, r) => sum + r.plan_generation_time, 0)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Research Phase Test API',
    available_tests: [
      'planner_only',
      'researcher_only', 
      'full_integration',
      'performance'
    ],
    example_request: {
      test_type: 'planner_only',
      user_input: 'フィンテック業界の新規事業機会を調査',
      target_items: 10
    }
  });
}