/**
 * Ideation Phase Test API Endpoint
 * アイディエーションフェーズのテスト用API
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/langgraph/config';
import { IdeationCoordinator } from '@/lib/agents/ideation';
import { ChatOpenAI } from '@langchain/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type, research_summaries, user_requirements } = body;

    console.log('🧪 アイディエーションフェーズテスト開始:', { test_type });

    // 設定を読み込み
    const config = loadConfig();
    const llm = new ChatOpenAI({
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      temperature: 0.7,
      maxTokens: 4000
    });

    let result;
    let testResults = {
      success: false,
      test_type,
      timestamp: new Date().toISOString(),
      details: {} as any,
      errors: [] as string[]
    };

    switch (test_type) {
      case 'ideator_only':
        // Ideatorのみテスト
        result = await testIdeatorOnly(llm, research_summaries || generateMockResearchData());
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'critic_only':
        // Criticのみテスト
        result = await testCriticOnly(llm);
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'full_integration':
        // 完全統合テスト
        result = await testFullIntegration(llm, research_summaries || generateMockResearchData(), user_requirements);
        testResults.details = result;
        testResults.success = result.success;
        break;

      case 'performance':
        // パフォーマンステスト
        result = await testPerformance(llm);
        testResults.details = result;
        testResults.success = result.success;
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid test type',
          valid_types: ['ideator_only', 'critic_only', 'full_integration', 'performance']
        }, { status: 400 });
    }

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('アイディエーションフェーズテストエラー:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testIdeatorOnly(llm: ChatOpenAI, researchSummaries: any[]): Promise<any> {
  console.log('💡 Ideatorテスト開始');
  
  try {
    const { IdeatorAgent } = await import('@/lib/agents/ideation/ideator');
    const ideator = new IdeatorAgent(llm);
    
    const ideas = await ideator.generateIdeas(
      researchSummaries,
      'フィンテック業界の新事業機会',
      undefined,
      0
    );
    
    const validation = ideator.validateIdeas(ideas);
    
    return {
      success: true,
      ideas_generated: ideas.length,
      validation: validation,
      sample_idea: ideas[0] ? {
        title: ideas[0].title,
        target_market: ideas[0].target_market,
        business_model: ideas[0].business_model
      } : null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testCriticOnly(llm: ChatOpenAI): Promise<any> {
  console.log('🎯 Criticテスト開始');
  
  try {
    const { CriticAgent } = await import('@/lib/agents/ideation/critic');
    const critic = new CriticAgent(llm);
    
    // テスト用のモックアイデア
    const mockIdea = {
      id: 'test_idea_1',
      title: 'AIを活用した不動産管理プラットフォーム',
      target_market: '中小不動産会社・個人投資家',
      problem_statement: '不動産管理の効率化とコスト削減が急務',
      solution: 'AI分析による予測メンテナンスと自動化',
      business_model: 'SaaS型サブスクリプション',
      mitsubishi_synergy: '三菱地所の不動産管理ノウハウとの連携',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_1']
    };
    
    const evaluations = await critic.evaluateIdeas([mockIdea]);
    
    return {
      success: true,
      evaluations_count: evaluations.length,
      evaluation_result: evaluations[0] ? {
        total_score: evaluations[0].total_score,
        scores: evaluations[0].scores,
        recommendation: evaluations[0].recommendation
      } : null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testFullIntegration(llm: ChatOpenAI, researchSummaries: any[], userRequirements?: string): Promise<any> {
  console.log('🚀 完全統合テスト開始');
  
  try {
    const coordinator = new IdeationCoordinator(llm, 1, 70); // 1回反復のみ
    
    const startTime = Date.now();
    const result = await coordinator.executeIdeationPhase(
      researchSummaries,
      userRequirements || 'AI・テクノロジー活用の新事業',
      'test_session_full'
    );
    const endTime = Date.now();
    
    const statistics = coordinator.getIdeationStatistics(result);
    const summary = coordinator.formatResultSummary(result);
    
    return {
      success: true,
      processing_time: endTime - startTime,
      result: {
        ideas_generated: result.ideas.length,
        iterations_completed: result.iteration_history.length,
        final_score: result.final_score,
        selected_idea: result.selected_idea ? {
          title: result.selected_idea.title,
          score: result.final_score
        } : null
      },
      statistics,
      summary
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testPerformance(llm: ChatOpenAI): Promise<any> {
  console.log('⚡ パフォーマンステスト開始');
  
  try {
    const tests = [
      { name: 'Small Dataset (3 summaries)', summaries: generateMockResearchData(3) },
      { name: 'Medium Dataset (5 summaries)', summaries: generateMockResearchData(5) },
      { name: 'Large Dataset (8 summaries)', summaries: generateMockResearchData(8) }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const startTime = Date.now();
      
      try {
        const coordinator = new IdeationCoordinator(llm, 1, 70);
        const result = await coordinator.executeIdeationPhase(
          test.summaries,
          'パフォーマンステスト',
          `perf_test_${Date.now()}`
        );
        
        const endTime = Date.now();
        
        results.push({
          test_name: test.name,
          success: true,
          processing_time: endTime - startTime,
          ideas_generated: result.ideas.length,
          final_score: result.final_score,
          iterations: result.iteration_history.length
        });
      } catch (error) {
        results.push({
          test_name: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      success: true,
      performance_results: results,
      summary: {
        avg_processing_time: results
          .filter(r => r.success)
          .reduce((sum, r) => sum + (r.processing_time || 0), 0) / results.filter(r => r.success).length,
        success_rate: (results.filter(r => r.success).length / results.length) * 100
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateMockResearchData(count: number = 5): any[] {
  const topics = [
    'フィンテック', 'ヘルステック', 'エドテック', 'プロップテック', 'アグリテック',
    'モビリティ', 'サステナビリティ', 'AI・機械学習', 'ブロックチェーン', 'IoT'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `mock_research_${i}`,
    research_item_id: `research_item_${i}`,
    category: ['startup_trends', 'technology_developments', 'industry_challenges'][i % 3],
    topic: topics[i % topics.length],
    summary: `${topics[i % topics.length]}分野における市場機会とイノベーションの可能性について分析`,
    key_insights: [
      '急速な市場成長が期待される',
      '技術的優位性を活かした差別化が可能',
      '三菱地所のアセットとの相乗効果が見込める'
    ],
    business_potential: Math.floor(Math.random() * 4) + 6, // 6-10
    mitsubishi_synergy_potential: Math.floor(Math.random() * 4) + 5, // 5-9
    market_size_indicator: '大規模市場',
    technology_maturity: '商用化段階',
    competitive_landscape: '競合多数',
    regulatory_environment: '規制緩和',
    sources: ['https://example.com'],
    language: 'ja',
    region: 'japan',
    created_at: new Date().toISOString()
  }));
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Ideation Phase Test API',
    available_tests: [
      'ideator_only',
      'critic_only', 
      'full_integration',
      'performance'
    ],
    example_request: {
      test_type: 'full_integration',
      user_requirements: 'AI・テクノロジー活用の新事業',
      research_summaries: 'optional - will use mock data if not provided'
    }
  });
}