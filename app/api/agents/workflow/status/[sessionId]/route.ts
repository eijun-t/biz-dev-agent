/**
 * Workflow Status Endpoint
 * ワークフロー進行状況取得API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    // セッション情報取得
    const { data: session, error: sessionError } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'セッションが見つかりません'
      }, { status: 404 });
    }

    // ステップ履歴取得
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (stepsError) {
      console.error('Steps fetch error:', stepsError);
    }

    // 完了時の最終レポート取得（デモ用）
    let finalReport = null;
    if (session.phase === 'completed') {
      finalReport = await generateMockFinalReport(sessionId);
    }

    return NextResponse.json({
      success: true,
      phase: session.phase,
      current_step: session.current_step,
      progress_percentage: session.progress_percentage,
      status: session.status,
      steps: steps || [],
      final_report: finalReport,
      error: session.error_message
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'ステータス取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * デモ用の最終レポート生成
 * 実際のプロダクションでは実際のワークフロー結果を使用
 */
async function generateMockFinalReport(sessionId: string) {
  // セッションの入力を取得
  const { data: session } = await supabase
    .from('workflow_sessions')
    .select('user_input')
    .eq('id', sessionId)
    .single();

  const userInput = session?.user_input || 'AI・IoT・DXを活用した新しいビジネス領域';

  return {
    reportData: {
      id: `report_${sessionId}`,
      session_id: sessionId,
      title: 'AI-Powered Smart City Management Platform',
      research_phase_result: [
        {
          id: 'research_1',
          research_item_id: 'item_1',
          category: 'technology_developments',
          topic: 'スマートシティ技術',
          summary: 'AI、IoT、5G技術の融合により、都市インフラの最適化が進展',
          key_insights: [
            '都市運営効率40%向上の実績',
            '住民満足度の大幅向上',
            'カーボンニュートラル実現への貢献'
          ],
          business_potential: 9,
          mitsubishi_synergy_potential: 8,
          market_size_indicator: '大規模市場',
          technology_maturity: '商用化段階',
          competitive_landscape: '競合激化',
          regulatory_environment: '政府支援',
          sources: ['https://example.com/smart-city-research'],
          language: 'ja',
          region: 'japan',
          created_at: new Date().toISOString()
        }
      ],
      ideation_phase_result: {
        selected_idea: {
          id: 'idea_smart_city',
          title: 'AI-Powered Smart City Management Platform',
          target_market: '地方自治体・都市開発事業者',
          problem_statement: '都市インフラの非効率な運営と住民サービスの質的課題',
          solution: 'AI・IoT・データ分析を統合したスマートシティプラットフォーム',
          business_model: 'SaaS型プラットフォーム + データ分析サービス',
          mitsubishi_synergy: '三菱地所の都市開発ノウハウとデータ活用',
          generated_at: new Date().toISOString(),
          iteration_count: 2,
          source_research_ids: ['research_1']
        },
        final_score: 88,
        iteration_count: 2,
        generated_at: new Date().toISOString(),
        session_id: sessionId
      },
      analysis_phase_result: {
        business_idea_id: 'idea_smart_city',
        market_analysis: {
          tam: {
            value: 8000,
            unit: '億円',
            description: 'グローバルスマートシティ市場規模',
            calculation_method: 'トップダウン分析',
            confidence_level: 'high',
            sources: ['IDC調査', 'McKinsey分析']
          },
          sam: {
            value: 800,
            unit: '億円',
            description: '日本国内addressable市場',
            market_share_assumption: 0.1
          },
          som: {
            value: 80,
            unit: '億円',
            description: '5年以内獲得可能市場',
            penetration_assumption: 0.01
          },
          market_growth_rate: 22,
          market_maturity: 'growth'
        },
        competitive_analysis: {
          direct_competitors: [
            {
              name: 'IBM Smart City Solutions',
              strengths: ['グローバル実績', 'AI技術力'],
              weaknesses: ['高コスト', '日本市場適応'],
              key_offerings: ['Watson IoT', 'Urban Analytics'],
              target_segments: ['大都市'],
              mitsubishi_advantage_over: ['地域密着', 'コスト競争力', '不動産ノウハウ']
            }
          ],
          indirect_competitors: [],
          market_positioning: {
            our_position: '地域密着型スマートシティソリューションリーダー',
            differentiation_factors: ['三菱地所の都市開発実績', '地域特化AI'],
            competitive_advantages: ['実証済み都市開発', 'ローカル最適化'],
            potential_weaknesses: ['技術開発投資', '人材確保']
          },
          market_concentration: 'fragmented',
          barriers_to_entry: ['技術開発', '実績構築', '自治体との関係'],
          threat_level: 'medium'
        },
        risk_assessment: {
          market_risks: [
            {
              risk_name: '自治体予算削減',
              description: '財政悪化による IT投資の削減',
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
          overall_risk_score: 5,
          mitigation_strategies: []
        },
        financial_projections: {
          revenue_projections: {
            year_1: 800,
            year_2: 2400,
            year_3: 6000,
            year_5: 15000,
            assumptions: ['地方自治体20団体との契約', '年間単価1000万円〜']
          },
          cost_structure: {
            initial_investment: 3000,
            operating_costs_annual: 1500,
            major_cost_categories: {}
          },
          profitability: {
            break_even_point: '2年目後半',
            gross_margin: 0.75,
            net_margin_projections: { year_1: -0.6, year_2: 0.05, year_3: 0.3 }
          },
          funding_requirements: {
            total_funding_needed: 5000,
            funding_stages: []
          },
          roi_analysis: {
            expected_roi: 0.45,
            payback_period: '3.5年',
            sensitivity_analysis: []
          }
        },
        strategic_recommendations: [
          '地方中核都市での実証実験開始',
          'AI・都市工学エンジニアの積極採用',
          '自治体との戦略的パートナーシップ構築'
        ],
        next_steps: [
          'MVP開発と実証実験計画',
          '技術パートナーの選定',
          'パイロット自治体の確保'
        ],
        analysis_confidence: 8,
        analyst_notes: 'スマートシティ市場の成長性と三菱地所の都市開発実績の組み合わせは非常に有望',
        research_requests_made: [],
        total_analysis_time: 240000,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      selected_business_idea: {
        id: 'idea_smart_city',
        title: 'AI-Powered Smart City Management Platform',
        target_market: '地方自治体・都市開発事業者',
        problem_statement: '都市インフラの非効率な運営と住民サービスの質的課題',
        solution: 'AI・IoT・データ分析を統合したスマートシティプラットフォーム',
        business_model: 'SaaS型プラットフォーム + データ分析サービス',
        mitsubishi_synergy: '三菱地所の都市開発ノウハウとデータ活用',
        generated_at: new Date().toISOString(),
        iteration_count: 2,
        source_research_ids: ['research_1']
      },
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: 'generated'
    },
    generatedReport: {
      report_id: `final_report_${sessionId}`,
      sections: [
        {
          section_id: 'summary_section',
          tab_name: '概要' as const,
          title: 'エグゼクティブサマリー',
          content: `
            <h2>AI-Powered Smart City Management Platform</h2>
            <p>本提案は、AI・IoT・データ分析技術を統合したスマートシティ管理プラットフォームの開発・提供事業です。</p>
            
            <h3>事業概要</h3>
            <ul>
              <li><strong>市場機会</strong>: グローバル8,000億円、国内800億円の成長市場</li>
              <li><strong>ターゲット</strong>: 地方自治体・都市開発事業者</li>
              <li><strong>競争優位性</strong>: 三菱地所の都市開発実績とローカル最適化</li>
              <li><strong>収益予測</strong>: 5年目売上150億円、ROI 45%</li>
            </ul>
            
            <h3>投資ハイライト</h3>
            <p>政府のスマートシティ政策と地方創生の追い風を受け、三菱地所の都市開発ノウハウを活かした差別化されたソリューションを提供します。</p>
          `,
          data_sources: ['市場調査結果', '競合分析', '財務予測'],
          confidence_level: 'high' as const,
          completeness_score: 92,
          last_updated: new Date().toISOString()
        }
      ],
      generation_process: [],
      quality_assessment: {
        overall_score: 88,
        section_scores: [],
        evaluation_criteria: {
          logical_consistency_weight: 0.35,
          actionable_specificity_weight: 0.35,
          data_support_weight: 0.15,
          clarity_weight: 0.15,
          minimum_passing_score: 80
        },
        improvement_suggestions: [],
        strengths: ['包括的市場分析', '実現可能性の高いビジネスモデル'],
        weaknesses: [],
        meets_threshold: true,
        assessed_at: new Date().toISOString(),
        assessed_by: 'critic_agent'
      },
      revision_history: [],
      final_score: 88,
      generation_time: 180000,
      word_count: 2500,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }
  };
}