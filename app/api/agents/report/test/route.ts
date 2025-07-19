/**
 * Report Generation Test API Endpoint
 * レポート生成のテスト用APIエンドポイント（認証不要）
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ReportCoordinator } from '@/lib/agents/report';
import { ComprehensiveBusinessReport } from '@/lib/agents/report/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type = 'full_generation', enable_revisions = true } = body;

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4o',
      temperature: 0.3,
      maxTokens: 4000
    });

    switch (test_type) {
      case 'writer_only':
        return await testWriterOnly(llm);
        
      case 'critic_only':
        return await testCriticOnly(llm);
        
      case 'full_generation':
        return await testFullGeneration(llm, enable_revisions);
        
      case 'mock_report':
        return await testMockReport();
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type',
          available_tests: ['writer_only', 'critic_only', 'full_generation', 'mock_report']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Report test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testWriterOnly(llm: ChatOpenAI) {
  const startTime = Date.now();
  
  try {
    const { WriterAgent } = await import('@/lib/agents/report');
    const writer = new WriterAgent(llm);
    const mockData = generateMockReportData();
    
    const section = await writer.generateSection(mockData, '概要');
    
    return NextResponse.json({
      success: true,
      test_type: 'writer_only',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        section_generated: section.tab_name,
        content_length: section.content.length,
        confidence_level: section.confidence_level,
        completeness_score: section.completeness_score
      },
      result: section
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'writer_only',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testCriticOnly(llm: ChatOpenAI) {
  const startTime = Date.now();
  
  try {
    const { EnhancedCriticAgent } = await import('@/lib/agents/report');
    const critic = new EnhancedCriticAgent(llm);
    
    const mockReport = generateMockReport();
    const mockData = generateMockReportData();
    
    const assessment = await critic.evaluateReport(mockReport, mockData);
    
    return NextResponse.json({
      success: true,
      test_type: 'critic_only',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        overall_score: assessment.overall_score,
        meets_threshold: assessment.meets_threshold,
        sections_evaluated: assessment.section_scores.length,
        improvement_suggestions: assessment.improvement_suggestions.length
      },
      result: assessment
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'critic_only',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testFullGeneration(llm: ChatOpenAI, enableRevisions: boolean) {
  const startTime = Date.now();
  
  try {
    const { ReportCoordinator } = await import('@/lib/agents/report');
    const coordinator = new ReportCoordinator(llm, 2);
    const mockData = generateMockReportData();
    
    let result;
    if (enableRevisions) {
      result = await coordinator.generateReportWithRevisions(mockData);
    } else {
      result = await coordinator.generateSimpleReport(mockData);
    }
    
    const statistics = coordinator.getReportStatistics(result);
    const summary = coordinator.formatReportSummary(result);
    
    return NextResponse.json({
      success: true,
      test_type: 'full_generation',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        report_id: result.report_id,
        sections_generated: result.sections.length,
        final_score: result.final_score,
        word_count: result.word_count,
        revision_count: result.revision_history.length,
        process_count: result.generation_process.length
      },
      result: {
        report: result,
        statistics,
        summary
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'full_generation',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

async function testMockReport() {
  const startTime = Date.now();
  
  try {
    const mockReport = generateMockReport();
    const mockData = generateMockReportData();
    
    return NextResponse.json({
      success: true,
      test_type: 'mock_report',
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      details: {
        report_id: mockReport.report_id,
        sections_count: mockReport.sections.length,
        mock_data: true
      },
      result: {
        report: mockReport,
        report_data: mockData
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test_type: 'mock_report',
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: Date.now() - startTime
    });
  }
}

function generateMockReportData(): ComprehensiveBusinessReport {
  return {
    id: 'test_report_' + Date.now(),
    session_id: 'test_session',
    title: 'AI-Powered Smart Building Management System',
    research_phase_result: [
      {
        id: 'research_1',
        research_item_id: 'item_1',
        category: 'technology_developments',
        topic: 'スマートビル技術',
        summary: 'IoT、AI、クラウド技術の融合により、ビル管理の自動化と最適化が進展',
        key_insights: [
          'エネルギー効率30%向上の実績',
          'テナント満足度向上',
          '運営コスト削減効果'
        ],
        business_potential: 9,
        mitsubishi_synergy_potential: 9,
        market_size_indicator: '大規模市場',
        technology_maturity: '商用化段階',
        competitive_landscape: '競合中程度',
        regulatory_environment: '支援政策',
        sources: ['https://example.com/research1'],
        language: 'ja',
        region: 'japan',
        created_at: new Date().toISOString()
      }
    ],
    ideation_phase_result: {
      selected_idea: {
        id: 'idea_1',
        title: 'AI-Powered Smart Building Management System',
        target_market: '商業ビル・オフィス運営者',
        problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
        solution: 'AIとIoTを活用したビル管理システム',
        business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
        mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
        generated_at: new Date().toISOString(),
        iteration_count: 0,
        source_research_ids: ['research_1']
      },
      final_score: 85,
      iteration_count: 1,
      generated_at: new Date().toISOString(),
      session_id: 'test_session'
    },
    analysis_phase_result: {
      business_idea_id: 'idea_1',
      market_analysis: {
        tam: {
          value: 5000,
          unit: '億円',
          description: 'スマートビル市場の総市場規模',
          calculation_method: 'トップダウン分析',
          confidence_level: 'high',
          sources: ['総務省統計', '民間調査会社レポート']
        },
        sam: {
          value: 500,
          unit: '億円',
          description: '実際にアプローチ可能な市場',
          market_share_assumption: 0.1
        },
        som: {
          value: 50,
          unit: '億円',
          description: '獲得可能な市場',
          penetration_assumption: 0.01
        },
        market_growth_rate: 15,
        market_maturity: 'growth'
      },
      competitive_analysis: {
        direct_competitors: [
          {
            name: 'ビル管理システムA社',
            strengths: ['豊富な実績', 'システム統合力'],
            weaknesses: ['AI活用の遅れ', '高コスト'],
            key_offerings: ['従来型BMS', '設備管理'],
            target_segments: ['大型商業施設'],
            mitsubishi_advantage_over: ['AI技術力', 'データ量', '実証環境']
          }
        ],
        indirect_competitors: [],
        market_positioning: {
          our_position: 'AI駆動型スマートビル管理のリーダー',
          differentiation_factors: ['AI予測分析', '三菱地所データ活用'],
          competitive_advantages: ['豊富な実証データ', 'ブランド力'],
          potential_weaknesses: ['技術開発コスト', '導入期間']
        },
        market_concentration: 'moderate',
        barriers_to_entry: ['技術開発', '初期投資', '実績構築'],
        threat_level: 'medium'
      },
      risk_assessment: {
        market_risks: [
          {
            risk_name: '市場成長鈍化',
            description: '経済環境変化によるビル投資の減速',
            probability: 'medium',
            impact: 'high',
            risk_score: 6,
            timeframe: '2-3年'
          }
        ],
        technology_risks: [],
        competitive_risks: [],
        financial_risks: [],
        regulatory_risks: [],
        operational_risks: [],
        overall_risk_score: 6,
        mitigation_strategies: []
      },
      financial_projections: {
        revenue_projections: {
          year_1: 500,
          year_2: 1500,
          year_3: 4000,
          year_5: 10000,
          assumptions: ['年間契約単価500万円', '契約数の段階的拡大']
        },
        cost_structure: {
          initial_investment: 2000,
          operating_costs_annual: 1000,
          major_cost_categories: {}
        },
        profitability: {
          break_even_point: '2年目',
          gross_margin: 0.7,
          net_margin_projections: { year_1: -0.5, year_2: 0.1, year_3: 0.25 }
        },
        funding_requirements: {
          total_funding_needed: 3000,
          funding_stages: []
        },
        roi_analysis: {
          expected_roi: 0.4,
          payback_period: '3年',
          sensitivity_analysis: []
        }
      },
      strategic_recommendations: ['三菱地所保有ビルでのパイロット実証'],
      next_steps: ['MVP開発とパイロット実証'],
      analysis_confidence: 8,
      analyst_notes: '高い市場ポテンシャル',
      research_requests_made: [],
      total_analysis_time: 180000,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    selected_business_idea: {
      id: 'idea_1',
      title: 'AI-Powered Smart Building Management System',
      target_market: '商業ビル・オフィス運営者',
      problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
      solution: 'AIとIoTを活用したビル管理システム',
      business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
      mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_1']
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    status: 'draft'
  };
}

function generateMockReport() {
  return {
    report_id: 'mock_report_' + Date.now(),
    sections: [
      {
        section_id: 'section_1',
        tab_name: '概要' as const,
        title: '概要',
        content: '<h2>ビジネス概要</h2><p>AI駆動型スマートビル管理システムは、IoTとAI技術を活用して、ビル運営の効率化とテナント満足度の向上を実現します。</p>',
        data_sources: ['分析結果'],
        confidence_level: 'high' as const,
        completeness_score: 85,
        last_updated: new Date().toISOString()
      }
    ],
    generation_process: [],
    quality_assessment: {
      overall_score: 85,
      section_scores: [],
      evaluation_criteria: {
        logical_consistency_weight: 0.35,
        actionable_specificity_weight: 0.35,
        data_support_weight: 0.15,
        clarity_weight: 0.15,
        minimum_passing_score: 80
      },
      improvement_suggestions: [],
      strengths: ['包括的な分析'],
      weaknesses: [],
      meets_threshold: true,
      assessed_at: new Date().toISOString(),
      assessed_by: 'critic_agent'
    },
    revision_history: [],
    final_score: 85,
    generation_time: 30000,
    word_count: 1500,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  };
}