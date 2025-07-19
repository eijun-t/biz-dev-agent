/**
 * Analysis Phase Test API Endpoint
 * 分析フェーズのテスト用APIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { AnalysisCoordinator, AnalystAgent, EnhancedResearcherAgent } from '@/lib/agents/analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type, business_ideas, selected_idea_id } = body;

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4o',
      temperature: 0.2,
      maxTokens: 4000
    });

    const serperApiKey = process.env.SERPER_API_KEY || '';

    switch (test_type) {
      case 'analyst_only':
        return await testAnalystOnly(llm, business_ideas);
        
      case 'researcher_only':
        return await testResearcherOnly(llm, serperApiKey);
        
      case 'coordination_test':
        return await testCoordination(llm, serperApiKey);
        
      case 'full_integration':
        return await testFullIntegration(llm, serperApiKey, business_ideas, selected_idea_id);
        
      case 'performance':
        return await testPerformance(llm, serperApiKey, business_ideas);
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type',
          available_tests: [
            'analyst_only',
            'researcher_only', 
            'coordination_test',
            'full_integration',
            'performance'
          ]
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Analysis test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testAnalystOnly(llm: ChatOpenAI, businessIdeas: any[]) {
  const startTime = Date.now();
  
  try {
    const analyst = new AnalystAgent(llm);
    const testIdea = businessIdeas?.[0] || generateMockBusinessIdea();
    
    const result = await analyst.conductComprehensiveAnalysis(testIdea);
    
    return NextResponse.json({
      success: true,
      test_type: 'analyst_only',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        idea_analyzed: testIdea.title,
        market_analysis_confidence: result.market_analysis.tam.confidence_level,
        competitors_found: result.competitive_analysis.direct_competitors.length,
        risk_score: result.risk_assessment.overall_risk_score,
        analysis_confidence: result.analysis_confidence,
        strategic_recommendations: result.strategic_recommendations.length
      },
      result
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'analyst_only',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testResearcherOnly(llm: ChatOpenAI, serperApiKey: string) {
  const startTime = Date.now();
  
  try {
    const researcher = new EnhancedResearcherAgent(llm, serperApiKey);
    
    const testRequest = {
      id: 'test_req_' + Date.now(),
      requested_by: 'analyst' as const,
      request_type: 'market_data' as const,
      specific_query: 'フィンテック 市場規模 日本',
      context: 'Test research request for fintech market size',
      priority: 'medium' as const,
      expected_data_format: 'structured_json',
      business_idea_id: 'test_idea',
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };
    
    const result = await researcher.executeResearchRequest(testRequest);
    
    return NextResponse.json({
      success: true,
      test_type: 'researcher_only',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        request_type: testRequest.request_type,
        confidence_level: result.confidence_level,
        sources_found: result.sources.length,
        data_available: result.data ? true : false,
        limitations: result.limitations.length
      },
      result
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'researcher_only',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testCoordination(llm: ChatOpenAI, serperApiKey: string) {
  const startTime = Date.now();
  
  try {
    const coordinator = new AnalysisCoordinator(llm, serperApiKey, {
      max_research_requests: 2, // Reduced for testing
      analysis_timeout: 120000, // 2 minutes for testing
      max_iterations: 1
    });
    
    const testIdeas = [generateMockBusinessIdea()];
    
    // Test coordination capabilities without full execution
    const mockAnalysis = {
      business_idea_id: testIdeas[0].id,
      market_analysis: {
        tam: { value: 1000, confidence_level: 'medium' as const },
        sam: { value: 100 },
        som: { value: 10 }
      },
      competitive_analysis: {
        direct_competitors: ['Competitor1', 'Competitor2'],
        threat_level: 'medium' as const
      },
      risk_assessment: {
        overall_risk_score: 6
      },
      analysis_confidence: 6,
      research_requests_made: [],
      total_analysis_time: 60000
    };
    
    const statistics = coordinator.getAnalysisStatistics(mockAnalysis as any);
    const summary = coordinator.formatResultSummary(mockAnalysis as any);
    
    return NextResponse.json({
      success: true,
      test_type: 'coordination_test',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        coordination_working: true,
        statistics_generation: statistics ? true : false,
        summary_generation: summary ? true : false,
        test_analysis_confidence: mockAnalysis.analysis_confidence
      },
      result: {
        statistics,
        summary,
        mock_analysis: mockAnalysis
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'coordination_test',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testFullIntegration(
  llm: ChatOpenAI, 
  serperApiKey: string, 
  businessIdeas: any[], 
  selectedIdeaId?: string
) {
  const startTime = Date.now();
  
  try {
    const coordinator = new AnalysisCoordinator(llm, serperApiKey, {
      max_research_requests: 3,
      analysis_timeout: 300000, // 5 minutes
      max_iterations: 2
    });
    
    const testIdeas = businessIdeas?.length > 0 ? businessIdeas : [
      generateMockBusinessIdea(),
      generateMockBusinessIdea('PropTech Platform'),
      generateMockBusinessIdea('Smart Building Solutions')
    ];
    
    const result = await coordinator.executeAnalysisPhase(
      testIdeas,
      selectedIdeaId,
      'test_session_' + Date.now()
    );
    
    const statistics = coordinator.getAnalysisStatistics(result);
    const summary = coordinator.formatResultSummary(result);
    
    return NextResponse.json({
      success: true,
      test_type: 'full_integration',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        ideas_processed: testIdeas.length,
        selected_idea: result.business_idea_id,
        research_requests: result.research_requests_made.length,
        final_confidence: result.analysis_confidence,
        tam_value: result.market_analysis.tam.value,
        competitors_found: result.competitive_analysis.direct_competitors.length,
        risk_score: result.risk_assessment.overall_risk_score,
        strategic_recommendations: result.strategic_recommendations.length
      },
      result: {
        analysis: result,
        statistics,
        summary
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'full_integration',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testPerformance(llm: ChatOpenAI, serperApiKey: string, businessIdeas: any[]) {
  const startTime = Date.now();
  
  try {
    const performanceTests = [
      {
        name: 'Basic Analysis Speed',
        test: async () => {
          const analyst = new AnalystAgent(llm);
          const testIdea = generateMockBusinessIdea();
          const start = Date.now();
          await analyst.conductComprehensiveAnalysis(testIdea);
          return Date.now() - start;
        }
      },
      {
        name: 'Research Request Speed',
        test: async () => {
          const researcher = new EnhancedResearcherAgent(llm, serperApiKey);
          const testRequest = {
            id: 'perf_test_' + Date.now(),
            requested_by: 'analyst' as const,
            request_type: 'industry_trends' as const,
            specific_query: 'AI technology trends',
            context: 'Performance test',
            priority: 'low' as const,
            expected_data_format: 'json',
            business_idea_id: 'test',
            status: 'pending' as const,
            created_at: new Date().toISOString()
          };
          const start = Date.now();
          await researcher.executeResearchRequest(testRequest);
          return Date.now() - start;
        }
      },
      {
        name: 'Coordination Overhead',
        test: async () => {
          const coordinator = new AnalysisCoordinator(llm, serperApiKey, {
            max_research_requests: 1,
            analysis_timeout: 60000,
            max_iterations: 1
          });
          const testIdeas = [generateMockBusinessIdea()];
          const start = Date.now();
          await coordinator.executeAnalysisPhase(testIdeas);
          return Date.now() - start;
        }
      }
    ];
    
    const results = [];
    for (const test of performanceTests) {
      try {
        const duration = await test.test();
        results.push({
          test_name: test.name,
          duration_ms: duration,
          status: 'passed'
        });
      } catch (error) {
        results.push({
          test_name: test.name,
          duration_ms: -1,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = results.reduce((sum, r) => sum + (r.duration_ms > 0 ? r.duration_ms : 0), 0) / results.filter(r => r.duration_ms > 0).length;
    
    return NextResponse.json({
      success: true,
      test_type: 'performance',
      timestamp: new Date().toISOString(),
      execution_time: totalTime,
      details: {
        tests_run: results.length,
        tests_passed: results.filter(r => r.status === 'passed').length,
        average_test_time: Math.round(avgTime),
        total_test_time: totalTime,
        performance_acceptable: avgTime < 60000 // Under 1 minute average
      },
      result: {
        performance_results: results,
        summary: {
          total_time: totalTime,
          average_time: avgTime,
          success_rate: (results.filter(r => r.status === 'passed').length / results.length) * 100
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'performance',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

function generateMockBusinessIdea(title?: string) {
  const baseTitle = title || 'AI-Powered Real Estate Analytics';
  
  return {
    id: 'mock_idea_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: baseTitle,
    target_market: '不動産投資家・デベロッパー',
    problem_statement: '不動産投資における市場分析とリスク評価の複雑性',
    solution: 'AIを活用した包括的な不動産分析プラットフォーム',
    business_model: 'SaaS型サブスクリプションモデル',
    mitsubishi_synergy: '三菱地所の不動産データと開発実績を活用したAI分析の高精度化',
    generated_at: new Date().toISOString(),
    iteration_count: 0,
    source_research_ids: ['mock_research_1', 'mock_research_2']
  };
}