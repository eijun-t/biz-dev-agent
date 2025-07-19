/**
 * Workflow Test Endpoint - No Authentication Required
 * ワークフローテスト用エンドポイント（認証不要）
 */

import { NextRequest, NextResponse } from 'next/server';

interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  details?: string;
}

interface WorkflowState {
  phase: 'input' | 'research' | 'ideation' | 'analysis' | 'report' | 'completed';
  current_step: string;
  steps: WorkflowStep[];
  session_id: string;
  progress_percentage: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

// In-memory storage for demo (in production, use Supabase)
const workflowStates = new Map<string, WorkflowState>();
const workflowTimers = new Map<string, NodeJS.Timeout>();

export async function POST(request: NextRequest) {
  try {
    const { action, session_id, user_input } = await request.json();

    if (action === 'start') {
      return startWorkflow(session_id, user_input || '');
    } else if (action === 'status') {
      return getWorkflowStatus(session_id);
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Workflow test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'session_id is required'
      }, { status: 400 });
    }

    return getWorkflowStatus(sessionId);
  } catch (error) {
    console.error('Workflow status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Status fetch failed'
    }, { status: 500 });
  }
}

function startWorkflow(sessionId: string, userInput: string) {
  // Initialize workflow state
  const workflowState: WorkflowState = {
    phase: 'research',
    current_step: 'planner_initialization',
    steps: [],
    session_id: sessionId,
    progress_percentage: 5,
    status: 'running'
  };

  workflowStates.set(sessionId, workflowState);

  // Start simulation
  simulateWorkflow(sessionId, userInput);

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    message: 'ワークフローが開始されました'
  });
}

function getWorkflowStatus(sessionId: string) {
  const state = workflowStates.get(sessionId);
  
  if (!state) {
    return NextResponse.json({
      success: false,
      error: 'セッションが見つかりません'
    }, { status: 404 });
  }

  let finalReport = null;
  if (state.phase === 'completed') {
    finalReport = generateMockFinalReport(sessionId);
  }

  return NextResponse.json({
    success: true,
    phase: state.phase,
    current_step: state.current_step,
    progress_percentage: state.progress_percentage,
    status: state.status,
    steps: state.steps,
    final_report: finalReport,
    error: state.error
  });
}

async function simulateWorkflow(sessionId: string, userInput: string) {
  try {
    // Phase 1: Research (5% -> 25%)
    await simulateResearchPhase(sessionId);
    
    // Phase 2: Ideation (25% -> 50%)
    await simulateIdeationPhase(sessionId);
    
    // Phase 3: Analysis (50% -> 75%)
    await simulateAnalysisPhase(sessionId);
    
    // Phase 4: Report (75% -> 100%)
    await simulateReportPhase(sessionId);
    
    // Complete
    await completeWorkflow(sessionId);
    
  } catch (error) {
    console.error('Workflow simulation error:', error);
    await markWorkflowFailed(sessionId, error);
  }
}

async function simulateResearchPhase(sessionId: string) {
  const steps = [
    { agent: 'planner', action: '調査計画を完了', status: 'completed' as const, progress: 10 },
    { agent: 'researcher', action: '市場トレンド調査を開始', status: 'in_progress' as const, progress: 15 },
    { agent: 'researcher', action: '技術動向分析を実行中', status: 'in_progress' as const, progress: 20 },
    { agent: 'researcher', action: '初期調査を完了', status: 'completed' as const, progress: 25 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'ideation', 25);
}

async function simulateIdeationPhase(sessionId: string) {
  const steps = [
    { agent: 'ideator', action: 'ビジネスアイデア生成を開始', status: 'in_progress' as const, progress: 30 },
    { agent: 'ideator', action: '複数のアイデア候補を作成中', status: 'in_progress' as const, progress: 35 },
    { agent: 'critic', action: 'アイデア品質評価を実行', status: 'in_progress' as const, progress: 40 },
    { agent: 'ideator', action: 'フィードバックに基づくアイデア改善', status: 'in_progress' as const, progress: 45 },
    { agent: 'critic', action: 'アイデア評価を完了', status: 'completed' as const, progress: 50 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'analysis', 50);
}

async function simulateAnalysisPhase(sessionId: string) {
  const steps = [
    { agent: 'researcher', action: '詳細市場調査を開始', status: 'in_progress' as const, progress: 55 },
    { agent: 'analyst', action: '市場規模算出を実行中', status: 'in_progress' as const, progress: 60 },
    { agent: 'analyst', action: '競合分析を実行中', status: 'in_progress' as const, progress: 65 },
    { agent: 'analyst', action: 'リスク評価を実行中', status: 'in_progress' as const, progress: 70 },
    { agent: 'analyst', action: '詳細分析を完了', status: 'completed' as const, progress: 75 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'report', 75);
}

async function simulateReportPhase(sessionId: string) {
  const steps = [
    { agent: 'writer', action: '包括的レポート生成を開始', status: 'in_progress' as const, progress: 80 },
    { agent: 'writer', action: '各セクションを作成中', status: 'in_progress' as const, progress: 85 },
    { agent: 'critic', action: 'レポート品質評価を実行', status: 'in_progress' as const, progress: 90 },
    { agent: 'writer', action: 'レポート最終調整中', status: 'in_progress' as const, progress: 95 },
    { agent: 'coordinator', action: 'レポート生成を完了', status: 'completed' as const, progress: 100 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    await updateWorkflowStep(sessionId, step);
  }
}

async function updateWorkflowStep(sessionId: string, stepData: any) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  const step: WorkflowStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agent: stepData.agent,
    action: stepData.action,
    status: stepData.status,
    timestamp: new Date().toISOString(),
    details: stepData.details || null
  };

  state.steps.push(step);
  state.progress_percentage = stepData.progress;
  state.current_step = step.id;

  workflowStates.set(sessionId, state);
}

async function updateSessionPhase(sessionId: string, phase: string, progress: number) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  state.phase = phase as any;
  state.progress_percentage = progress;
  
  workflowStates.set(sessionId, state);
}

async function completeWorkflow(sessionId: string) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  state.phase = 'completed';
  state.status = 'completed';
  state.progress_percentage = 100;
  
  workflowStates.set(sessionId, state);
}

async function markWorkflowFailed(sessionId: string, error: any) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  state.status = 'failed';
  state.error = error instanceof Error ? error.message : 'Unknown error';
  
  workflowStates.set(sessionId, state);
}

function generateMockFinalReport(sessionId: string) {
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
          market_risks: [],
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
        strategic_recommendations: [],
        next_steps: [],
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
        },
        {
          section_id: 'target_section',
          tab_name: '想定ターゲットと課題' as const,
          title: '想定ターゲットと課題',
          content: `
            <h2>ターゲット市場とペルソナ</h2>
            
            <h3>🎯 プライマリーターゲット</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>地方中核都市（人口10-50万人）の自治体</h4>
              <ul>
                <li><strong>ペルソナ</strong>: 情報政策課長、都市計画部長</li>
                <li><strong>予算規模</strong>: 年間IT予算5-20億円</li>
                <li><strong>決裁権限</strong>: 1000万円以上は議会承認</li>
                <li><strong>導入動機</strong>: 住民サービス向上、業務効率化、コスト削減</li>
              </ul>
            </div>

            <h3>🏢 セカンダリーターゲット</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>民間都市開発事業者</h4>
              <ul>
                <li><strong>対象</strong>: 大手デベロッパー、インフラ事業者</li>
                <li><strong>ニーズ</strong>: スマートシティ機能の差別化</li>
                <li><strong>予算</strong>: プロジェクト予算の2-5%</li>
              </ul>
            </div>

            <h3>⚠️ 現在の課題</h3>
            <ul>
              <li><strong>データ分散</strong>: 各部署のシステムが独立、情報連携困難</li>
              <li><strong>リアルタイム性の欠如</strong>: 手動集計による遅延</li>
              <li><strong>予測分析不足</strong>: 過去データ活用が不十分</li>
              <li><strong>住民接点の限界</strong>: デジタルサービスの普及率低下</li>
              <li><strong>人材不足</strong>: IT専門人材の確保困難</li>
            </ul>
          `,
          data_sources: ['自治体ヒアリング', 'ペルソナ分析'],
          confidence_level: 'high' as const,
          completeness_score: 88,
          last_updated: new Date().toISOString()
        },
        {
          section_id: 'solution_section',
          tab_name: 'ソリューション仮説・ビジネスモデル' as const,
          title: 'ソリューション仮説・ビジネスモデル',
          content: `
            <h2>統合スマートシティプラットフォーム</h2>
            
            <h3>💡 ソリューション概要</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p>AI・IoT・データ分析を統合したクラウドプラットフォームにより、都市インフラの最適化と住民サービスの向上を実現します。</p>
            </div>

            <h3>🔧 主要機能</h3>
            <ul>
              <li><strong>統合ダッシュボード</strong>: 全庁データの可視化・分析</li>
              <li><strong>予測分析エンジン</strong>: 交通量、エネルギー需要の予測</li>
              <li><strong>自動アラート</strong>: 異常検知・早期警告システム</li>
              <li><strong>住民アプリ</strong>: 行政サービスのデジタル化</li>
              <li><strong>IoTセンサー連携</strong>: リアルタイムデータ収集</li>
            </ul>

            <h3>💰 ビジネスモデル</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>SaaS型サブスクリプション + 成果報酬</h4>
              <ul>
                <li><strong>基本料金</strong>: 月額100-500万円（人口規模別）</li>
                <li><strong>従量課金</strong>: データ処理量・API呼び出し数</li>
                <li><strong>成果報酬</strong>: 省エネ・効率化による削減コストの一部</li>
                <li><strong>カスタマイズ</strong>: 個別開発・導入支援</li>
              </ul>
            </div>

            <h3>🎯 価値提案</h3>
            <ul>
              <li><strong>運営コスト20%削減</strong>: 自動化・最適化による効率向上</li>
              <li><strong>住民満足度向上</strong>: サービス品質・利便性の改善</li>
              <li><strong>データドリブン意思決定</strong>: 根拠ある政策立案支援</li>
              <li><strong>災害対応強化</strong>: リアルタイム監視・早期警告</li>
            </ul>
          `,
          data_sources: ['技術仕様書', 'ビジネスモデル分析'],
          confidence_level: 'high' as const,
          completeness_score: 90,
          last_updated: new Date().toISOString()
        },
        {
          section_id: 'market_section',
          tab_name: '市場規模・競合' as const,
          title: '市場規模・競合分析',
          content: `
            <h2>市場規模分析</h2>
            
            <h3>📊 TAM（総市場規模）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>8,000億円（グローバル）</h4>
              <ul>
                <li>スマートシティ関連投資の急拡大</li>
                <li>年平均成長率22%（2023-2028）</li>
                <li>アジア太平洋地域が最大市場</li>
              </ul>
            </div>

            <h3>📈 SAM（獲得可能市場）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>800億円（日本国内）</h4>
              <ul>
                <li>地方自治体のDX推進予算</li>
                <li>スーパーシティ構想による政府支援</li>
                <li>民間デベロッパーの投資増加</li>
              </ul>
            </div>

            <h3>🎯 SOM（獲得目標市場）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>80億円（5年目標）</h4>
              <p>中核都市20団体での10%シェア獲得</p>
            </div>

            <h2>競合分析</h2>
            
            <h3>🏢 主要競合</h3>
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>IBM Smart City Solutions</h4>
              <ul>
                <li><strong>強み</strong>: グローバル実績、AI技術Watson</li>
                <li><strong>弱み</strong>: 高コスト、日本市場適応不足</li>
                <li><strong>当社優位性</strong>: 地域密着、コスト競争力</li>
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>NEC Smart City Platform</h4>
              <ul>
                <li><strong>強み</strong>: 国内実績、官公庁との関係</li>
                <li><strong>弱み</strong>: 従来型アプローチ、革新性不足</li>
                <li><strong>当社優位性</strong>: 不動産ノウハウ、AI活用度</li>
              </ul>
            </div>

            <h3>⚔️ 競争戦略</h3>
            <ul>
              <li><strong>差別化要因</strong>: 三菱地所の都市開発実績活用</li>
              <li><strong>参入障壁</strong>: 自治体との信頼関係構築</li>
              <li><strong>価格戦略</strong>: 成果報酬による導入リスク軽減</li>
            </ul>
          `,
          data_sources: ['市場調査レポート', '競合分析'],
          confidence_level: 'high' as const,
          completeness_score: 85,
          last_updated: new Date().toISOString()
        },
        {
          section_id: 'mitsubishi_section',
          tab_name: '三菱地所が取り組む意義' as const,
          title: '三菱地所が取り組む意義',
          content: `
            <h2>戦略的位置づけ</h2>
            
            <h3>🏢 既存事業とのシナジー</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>都市開発ノウハウの活用</h4>
              <ul>
                <li><strong>丸の内エリア</strong>: 先進的都市機能の実証フィールド</li>
                <li><strong>大手町・有楽町</strong>: スマートビル技術の蓄積</li>
                <li><strong>地方開発</strong>: 地域特性への深い理解</li>
              </ul>
            </div>

            <h3>📊 データ資産の優位性</h3>
            <ul>
              <li><strong>ビル管理データ</strong>: エネルギー、セキュリティ、利用状況</li>
              <li><strong>テナント行動データ</strong>: 人流・商業活動パターン</li>
              <li><strong>都市計画ノウハウ</strong>: 長期開発計画の策定経験</li>
            </ul>

            <h3>🎯 成長戦略との整合性</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>「Creating Shared Value」の具現化</h4>
              <ul>
                <li><strong>社会課題解決</strong>: 地方創生・持続可能都市の実現</li>
                <li><strong>新規事業創出</strong>: 不動産以外の収益源確立</li>
                <li><strong>デジタル変革</strong>: DXによる競争優位性強化</li>
              </ul>
            </div>

            <h3>🌟 独自の価値創造</h3>
            <ul>
              <li><strong>実証環境の提供</strong>: 自社物件での技術検証</li>
              <li><strong>総合的ソリューション</strong>: 開発から運営まで一貫対応</li>
              <li><strong>長期パートナーシップ</strong>: 30年以上の関係構築</li>
              <li><strong>金融機能活用</strong>: グループの金融ノウハウで資金調達支援</li>
            </ul>

            <h3>💼 組織・人材面での優位性</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <ul>
                <li><strong>ブランド力</strong>: 三菱地所の信頼性・安定性</li>
                <li><strong>官民連携経験</strong>: 自治体との協働実績</li>
                <li><strong>グローバルネットワーク</strong>: 海外展開のポテンシャル</li>
              </ul>
            </div>

            <h3>🚀 長期ビジョンへの貢献</h3>
            <p>スマートシティ事業は、三菱地所が目指す「持続可能な都市」の実現において中核的役割を果たし、ESG経営の具体的成果として社会からの評価向上にも寄与します。</p>
          `,
          data_sources: ['企業戦略', '既存事業分析'],
          confidence_level: 'high' as const,
          completeness_score: 90,
          last_updated: new Date().toISOString()
        },
        {
          section_id: 'verification_section',
          tab_name: '検証アクション' as const,
          title: '検証アクション・実行計画',
          content: `
            <h2>段階的検証アプローチ</h2>
            
            <h3>🧪 Phase 1: コンセプト検証（3ヶ月）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>MVP開発・実証実験</h4>
              <ul>
                <li><strong>対象</strong>: 三菱地所保有ビル（大手町・丸の内）</li>
                <li><strong>範囲</strong>: エネルギー管理・セキュリティ統合</li>
                <li><strong>KPI</strong>: 20%のエネルギー効率改善</li>
                <li><strong>予算</strong>: 5000万円</li>
              </ul>
            </div>

            <h3>🏙️ Phase 2: パイロット自治体（6ヶ月）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>地方中核都市での実証</h4>
              <ul>
                <li><strong>候補</strong>: 岡山市、熊本市、仙台市</li>
                <li><strong>範囲</strong>: 交通・防災・行政サービス</li>
                <li><strong>KPI</strong>: 住民満足度10%向上</li>
                <li><strong>予算</strong>: 2億円</li>
              </ul>
            </div>

            <h3>📈 Phase 3: スケール展開（12ヶ月）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>商用サービス開始</h4>
              <ul>
                <li><strong>目標</strong>: 10自治体への導入</li>
                <li><strong>機能</strong>: フルプラットフォーム</li>
                <li><strong>売上目標</strong>: 年間5億円</li>
                <li><strong>投資</strong>: 10億円</li>
              </ul>
            </div>

            <h2>🎯 重要マイルストーン</h2>
            
            <h3>技術検証</h3>
            <ul>
              <li><strong>Month 1-2</strong>: AIエンジン・データ統合基盤構築</li>
              <li><strong>Month 3-4</strong>: IoTセンサー統合・リアルタイム分析</li>
              <li><strong>Month 5-6</strong>: 住民向けアプリ・UIトライアル</li>
            </ul>

            <h3>事業検証</h3>
            <ul>
              <li><strong>市場検証</strong>: 自治体ニーズ調査・価格感度分析</li>
              <li><strong>収益検証</strong>: 課金モデル・LTV分析</li>
              <li><strong>運営検証</strong>: サポート体制・SLA定義</li>
            </ul>

            <h3>パートナーシップ</h3>
            <ul>
              <li><strong>技術パートナー</strong>: AI・IoT分野の専門企業</li>
              <li><strong>販売パートナー</strong>: 地域ITインテグレーター</li>
              <li><strong>学術連携</strong>: 大学研究機関との共同研究</li>
            </ul>

            <h2>📊 成功指標（KPI）</h2>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <ul>
                <li><strong>技術KPI</strong>: 99.9%稼働率、リアルタイム処理（<1秒）</li>
                <li><strong>事業KPI</strong>: 契約自治体数、月次売上、チャーンレート</li>
                <li><strong>社会KPI</strong>: CO2削減量、住民満足度、業務効率改善</li>
              </ul>
            </div>
          `,
          data_sources: ['実行計画書', 'KPI設計'],
          confidence_level: 'high' as const,
          completeness_score: 88,
          last_updated: new Date().toISOString()
        },
        {
          section_id: 'risk_section',
          tab_name: 'リスク' as const,
          title: 'リスク分析・軽減策',
          content: `
            <h2>リスク分析マトリックス</h2>
            
            <h3>🔴 高リスク（要重点対策）</h3>
            
            <div style="background: #fee; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #dc2626;">
              <h4>⚠️ 技術開発遅延</h4>
              <ul>
                <li><strong>確率</strong>: 中（40%）</li>
                <li><strong>影響</strong>: 高（市場投入遅れ）</li>
                <li><strong>軽減策</strong>: アジャイル開発、技術パートナー連携、段階的リリース</li>
              </ul>
            </div>

            <div style="background: #fee; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #dc2626;">
              <h4>⚠️ 自治体予算削減</h4>
              <ul>
                <li><strong>確率</strong>: 中（30%）</li>
                <li><strong>影響</strong>: 高（売上減少）</li>
                <li><strong>軽減策</strong>: 成果報酬モデル、国庫補助金活用支援、民間事業者向け展開</li>
              </ul>
            </div>

            <h3>🟡 中リスク（継続監視）</h3>
            
            <div style="background: #fef3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b;">
              <h4>⚠️ 大手IT企業の市場参入</h4>
              <ul>
                <li><strong>確率</strong>: 高（70%）</li>
                <li><strong>影響</strong>: 中（競争激化）</li>
                <li><strong>軽減策</strong>: 三菱地所独自性強化、自治体との長期契約、特許取得</li>
              </ul>
            </div>

            <div style="background: #fef3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b;">
              <h4>⚠️ 人材確保困難</h4>
              <ul>
                <li><strong>確率</strong>: 高（60%）</li>
                <li><strong>影響</strong>: 中（開発遅延）</li>
                <li><strong>軽減策</strong>: 採用強化、外部パートナー活用、リモートワーク拡充</li>
              </ul>
            </div>

            <h3>🟢 低リスク（定期確認）</h3>
            
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #10b981;">
              <h4>法規制変更</h4>
              <ul>
                <li><strong>確率</strong>: 低（20%）</li>
                <li><strong>影響</strong>: 中（対応コスト）</li>
                <li><strong>軽減策</strong>: 業界団体参加、政策動向モニタリング</li>
              </ul>
            </div>

            <h2>🛡️ 総合的リスク軽減戦略</h2>
            
            <h3>事業継続計画（BCP）</h3>
            <ul>
              <li><strong>多角化戦略</strong>: 官民両セクターへの展開</li>
              <li><strong>段階的投資</strong>: マイルストーン毎の見直し</li>
              <li><strong>Exit戦略</strong>: 技術IP売却・事業譲渡オプション</li>
            </ul>

            <h3>財務リスク管理</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <ul>
                <li><strong>キャッシュフロー管理</strong>: 18ヶ月分の運転資金確保</li>
                <li><strong>収益多様化</strong>: SaaS基本料金 + 従量課金 + コンサル</li>
                <li><strong>コスト変動対応</strong>: 固定費比率40%以下維持</li>
              </ul>
            </div>

            <h3>📊 リスク監視KPI</h3>
            <ul>
              <li><strong>開発進捗</strong>: 月次スプリント完了率</li>
              <li><strong>市場環境</strong>: 競合動向、政策変更情報</li>
              <li><strong>財務健全性</strong>: バーンレート、資金調達状況</li>
              <li><strong>人材状況</strong>: エンジニア稼働率、離職率</li>
            </ul>

            <h2>🎯 リスク対応体制</h2>
            <p>月次のリスク委員会開催、四半期毎の戦略見直し、緊急時のエスカレーションフローを整備し、機動的なリスク対応を実現します。</p>
          `,
          data_sources: ['リスク分析', '軽減策検討'],
          confidence_level: 'high' as const,
          completeness_score: 85,
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