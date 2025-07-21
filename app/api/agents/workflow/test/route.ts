/**
 * Workflow Test Endpoint - No Authentication Required
 * ワークフローテスト用エンドポイント（認証不要）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReport } from '@/lib/database/queries';
import { CreateReportInput } from '@/lib/database/types';

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
  userInput?: string;
  final_report?: any;
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
    status: 'running',
    userInput: userInput
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

  return NextResponse.json({
    success: true,
    phase: state.phase,
    current_step: state.current_step,
    progress_percentage: state.progress_percentage,
    status: state.status,
    steps: state.steps,
    final_report: state.final_report || null,
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

  // レポートデータを生成
  const businessIdea = generateBusinessIdeaFromInput(state.userInput || '');
  const finalReport = generateMockFinalReport(sessionId, state.userInput);

  try {
    // 認証されたユーザーがいる場合のみデータベースに保存
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // データベースにレポートを保存
      const reportInput: CreateReportInput = {
        user_id: user.id,
        title: businessIdea.title,
        content: {
          idea_title: businessIdea.title,
          target: businessIdea.target,
          challenges: businessIdea.problem,
          monetization: businessIdea.businessModel,
          market_tam: businessIdea.marketSize,
          competitors: businessIdea.competitors.join(', '),
          mitsubishi_synergy: businessIdea.synergy,
          risks: businessIdea.risks.join(', '),
          roadmap: businessIdea.verification.join(', ')
        },
        html_content: JSON.stringify(finalReport), // 完全なレポートデータを保存
        status: 'completed'
      };

      await createReport(reportInput);
      console.log(`Report saved to database for user ${user.id}`);
    } else {
      console.log('No authenticated user - report not saved to database');
    }
  } catch (error) {
    console.error('Failed to save report to database:', error);
    // エラーが発生してもワークフローは続行
  }

  // 最終レポートをワークフロー状態に設定
  state.final_report = finalReport;
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

function generateBusinessIdeaFromInput(userInput: string) {
  // ユーザー入力からビジネスアイデアのキーワードを抽出
  const input = userInput.toLowerCase();
  
  // キーワードマッピング
  if (input.includes('ai') || input.includes('人工知能') || input.includes('機械学習')) {
    return {
      title: 'AI駆動型ビジネス最適化プラットフォーム',
      domain: 'AI・機械学習',
      description: 'AI技術を活用した業務プロセス最適化とデータ分析サービス',
      target: '企業・中小企業経営者',
      problem: '業務効率化の遅れと意思決定の精度不足',
      solution: 'AI・機械学習による業務プロセス自動化と予測分析',
      businessModel: 'SaaS型プラットフォーム + コンサルティング',
      synergy: '三菱地所のデータ活用ノウハウとテナント企業との関係性',
      marketSize: 'AI市場',
      competitors: ['IBM Watson', 'Salesforce Einstein'],
      advantage: ['業界特化AI', '実証済み効果'],
      verification: ['POC実施', 'テナント企業での検証'],
      risks: ['技術開発遅延', 'AI人材確保困難']
    };
  }
  
  if (input.includes('不動産') || input.includes('建設') || input.includes('建築')) {
    return {
      title: 'スマート不動産管理プラットフォーム',
      domain: '不動産・建設',
      description: 'IoTとAIを活用した次世代不動産管理・運営システム',
      target: '不動産オーナー・管理会社',
      problem: '不動産運営の非効率性と入居者満足度の向上課題',
      solution: 'IoT・AI技術による統合不動産管理システム',
      businessModel: 'SaaS型管理システム + 成果報酬',
      synergy: '三菱地所の不動産管理実績と技術革新の融合',
      marketSize: '不動産テック市場',
      competitors: ['GA technologies', 'SpaceFinder'],
      advantage: ['大規模管理実績', '総合不動産サービス'],
      verification: ['自社物件での実証', 'テナント満足度調査'],
      risks: ['システム導入コスト', '従来業務への抵抗']
    };
  }
  
  if (input.includes('ooh') || input.includes('広告') || input.includes('デジタルサイネージ')) {
    return {
      title: 'AI駆動型デジタル広告最適化プラットフォーム',
      domain: 'デジタル広告・マーケティング',
      description: 'リアルタイムデータ分析による最適化された屋外広告配信システム',
      target: '広告代理店・小売・飲食チェーン',
      problem: 'OOH広告の効果測定困難と配信最適化の課題',
      solution: 'AI・データ分析による動的広告最適化システム',
      businessModel: '広告配信手数料 + データ分析サービス',
      synergy: '三菱地所の商業施設運営データと広告技術の融合',
      marketSize: 'デジタルOOH広告市場',
      competitors: ['電通デジタル', 'サイバーエージェント'],
      advantage: ['リアル店舗データ', '立地優位性'],
      verification: ['丸の内エリアでの実証', '効果測定システム構築'],
      risks: ['プライバシー規制', '広告効果の証明困難']
    };
  }
  
  if (input.includes('ヘルスケア') || input.includes('医療') || input.includes('健康')) {
    return {
      title: 'AIヘルスケア予防診断プラットフォーム',
      domain: 'ヘルスケア・医療',
      description: 'AIによる早期診断と予防医療を支援するデジタルヘルスサービス',
      target: '医療機関・健康保険組合・個人',
      problem: '疾病の早期発見困難と予防医療の普及不足',
      solution: 'AI画像診断と健康データ分析による予防医療システム',
      businessModel: 'SaaS型診断支援 + 健康管理サービス',
      synergy: '三菱地所の健康経営ノウハウとテナント従業員データ活用',
      marketSize: 'ヘルステック市場',
      competitors: ['メドレー', 'エムスリー'],
      advantage: ['企業健康管理実績', '大規模データ'],
      verification: ['従業員健康診断での検証', '医療機関との連携'],
      risks: ['医療法規制', 'データセキュリティ']
    };
  }
  
  if (input.includes('教育') || input.includes('学習') || input.includes('edtech')) {
    return {
      title: 'AI個別学習最適化プラットフォーム',
      domain: '教育・EdTech',
      description: 'AI技術による個人最適化された学習体験とスキル開発支援',
      target: '教育機関・企業研修・個人学習者',
      problem: '画一的教育による学習効果の限界と個別最適化の困難',
      solution: 'AI学習分析による個人最適化教育システム',
      businessModel: 'SaaS型学習プラットフォーム + コンテンツ販売',
      synergy: '三菱地所の人材育成ノウハウと学習空間提供',
      marketSize: 'EdTech市場',
      competitors: ['リクルート', 'ベネッセ'],
      advantage: ['企業研修実績', '学習環境提供'],
      verification: ['社内研修での実証', '学習効果測定'],
      risks: ['教育効果の証明', 'コンテンツ品質維持']
    };
  }
  
  if (input.includes('金融') || input.includes('fintech') || input.includes('投資')) {
    return {
      title: 'AI金融リスク管理プラットフォーム',
      domain: 'FinTech・金融',
      description: 'AI分析による投資リスク評価と最適化ソリューション',
      target: '金融機関・投資会社・個人投資家',
      problem: '複雑化する金融リスクの評価困難と最適化の課題',
      solution: 'AI・ビッグデータによるリスク分析・予測システム',
      businessModel: 'SaaS型リスク管理 + 成果報酬',
      synergy: '三菱UFJとの連携と不動産投資データ活用',
      marketSize: 'FinTech市場',
      competitors: ['野村證券', 'マネーフォワード'],
      advantage: ['グループ金融ノウハウ', '不動産投資実績'],
      verification: ['グループ内での実証', 'リスク予測精度検証'],
      risks: ['金融規制', 'システム安定性']
    };
  }
  
  if (input.includes('物流') || input.includes('配送') || input.includes('サプライチェーン')) {
    return {
      title: 'AI物流最適化管理システム',
      domain: '物流・サプライチェーン',
      description: 'AI予測分析による効率的な物流ネットワーク最適化',
      target: '物流会社・製造業・小売業',
      problem: '物流コスト増大と配送効率化の課題',
      solution: 'AI需要予測と最適化による統合物流管理システム',
      businessModel: 'SaaS型物流管理 + 効率化成果報酬',
      synergy: '三菱地所の商業施設物流ノウハウと最適化技術',
      marketSize: '物流テック市場',
      competitors: ['日本通運', 'ヤマト運輸'],
      advantage: ['商業施設物流実績', '都市部配送網'],
      verification: ['自社物流での実証', '配送効率測定'],
      risks: ['システム導入コスト', '物流業界の抵抗']
    };
  }
  
  if (input.includes('環境') || input.includes('エネルギー') || input.includes('サステナビリティ')) {
    return {
      title: 'AIエネルギー最適化プラットフォーム',
      domain: '環境・エネルギー',
      description: 'AI技術による再生可能エネルギー管理と最適化システム',
      target: 'エネルギー会社・企業・自治体',
      problem: 'エネルギー効率化とカーボンニュートラル実現の課題',
      solution: 'AI予測・制御による統合エネルギー管理システム',
      businessModel: 'SaaS型エネルギー管理 + 省エネ成果報酬',
      synergy: '三菱地所のビル管理実績とエネルギー最適化技術',
      marketSize: '環境テック市場',
      competitors: ['東京電力', 'ENEOS'],
      advantage: ['大規模ビル管理実績', 'ESG経営ノウハウ'],
      verification: ['自社ビルでの実証', 'エネルギー削減効果測定'],
      risks: ['エネルギー政策変更', '技術標準化遅れ']
    };
  }
  
  // デフォルト（入力内容を反映）
  return {
    title: `${userInput}関連ビジネスプラットフォーム`,
    domain: '新規事業領域',
    description: `${userInput}の課題解決を目的とした革新的なデジタルソリューション`,
    target: '関連業界の企業・組織',
    problem: `${userInput}分野における効率化と最適化の課題`,
    solution: `デジタル技術を活用した${userInput}の革新的ソリューション`,
    businessModel: 'SaaS型プラットフォーム + コンサルティング',
    synergy: `三菱地所の事業ノウハウと${userInput}分野の融合`,
    marketSize: `${userInput}関連市場`,
    competitors: ['業界大手企業', '新興テック企業'],
    advantage: ['三菱地所ブランド', '実証実績'],
    verification: ['POC実施', '効果測定'],
    risks: ['市場変化', '技術革新']
  };
}

function generateMockFinalReport(sessionId: string, userInput?: string) {
  // ユーザー入力から適切なビジネスアイデアを生成
  const businessIdea = generateBusinessIdeaFromInput(userInput || '');
  
  return {
    reportData: {
      id: `report_${sessionId}`,
      session_id: sessionId,
      title: businessIdea.title,
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
          title: businessIdea.title,
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
        title: businessIdea.title,
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
            <h2>${businessIdea.title}</h2>
            <p>本提案は、${businessIdea.description}の開発・提供事業です。</p>
            
            <h3>事業概要</h3>
            <ul>
              <li><strong>市場機会</strong>: ${businessIdea.marketSize}における急成長機会</li>
              <li><strong>ターゲット</strong>: ${businessIdea.target}</li>
              <li><strong>競争優位性</strong>: ${businessIdea.advantage.join('、')}</li>
              <li><strong>収益予測</strong>: 5年目売上150億円、ROI 45%</li>
            </ul>
            
            <h3>投資ハイライト</h3>
            <p>${businessIdea.synergy}により、差別化されたソリューションを提供します。</p>
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
              <h4>${businessIdea.target}</h4>
              <ul>
                <li><strong>業界</strong>: ${businessIdea.domain}</li>
                <li><strong>主要課題</strong>: ${businessIdea.problem}</li>
                <li><strong>求めるソリューション</strong>: ${businessIdea.solution}</li>
              </ul>
            </div>

            <h3>💼 ビジネスモデル</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${businessIdea.businessModel}</h4>
              <p>${businessIdea.synergy}</p>
            </div>

            <h3>⚠️ 解決すべき課題</h3>
            <div style="background: #fef3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>核心課題</strong>: ${businessIdea.problem}</p>
              <p><strong>提案ソリューション</strong>: ${businessIdea.solution}</p>
            </div>
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
            <h2>${businessIdea.title}</h2>
            
            <h3>💡 ソリューション概要</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p>${businessIdea.description}</p>
            </div>

            <h3>🔧 主要機能・特徴</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>核心技術：</strong> ${businessIdea.solution}</p>
              <p><strong>対象課題：</strong> ${businessIdea.problem}</p>
              <p><strong>提供価値：</strong> ${businessIdea.description}</p>
            </div>

            <h3>💰 ビジネスモデル</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${businessIdea.businessModel}</h4>
              <p><strong>収益構造：</strong> プラットフォーム利用料とデータ分析サービス</p>
              <p><strong>価格戦略：</strong> 成果連動型で導入リスクを軽減</p>
              <p><strong>拡張性：</strong> ${businessIdea.target}への段階的展開</p>
            </div>

            <h3>🎯 価値提案</h3>
            <ul>
              <li><strong>効率化実現：</strong> ${businessIdea.problem}の根本的解決</li>
              <li><strong>競争優位性：</strong> ${businessIdea.advantage.join('、')}</li>
              <li><strong>シナジー効果：</strong> ${businessIdea.synergy}</li>
              <li><strong>スケーラビリティ：</strong> ${businessIdea.domain}全体への展開可能性</li>
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
            
            <h3>📊 市場規模分析</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${businessIdea.marketSize}</h4>
              <ul>
                <li>急成長する${businessIdea.domain}分野</li>
                <li>年平均成長率22%の高成長市場</li>
                <li>デジタル変革による市場拡大</li>
              </ul>
            </div>

            <h3>📈 ターゲット市場</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${businessIdea.target}向け市場</h4>
              <ul>
                <li>対象顧客: ${businessIdea.target}</li>
                <li>市場ニーズ: ${businessIdea.problem}の解決</li>
                <li>成長ドライバー: ${businessIdea.solution}への需要拡大</li>
              </ul>
            </div>

            <h2>競合分析</h2>
            
            <h3>🏢 主要競合企業</h3>
            ${businessIdea.competitors.map(competitor => `
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${competitor}</h4>
              <ul>
                <li><strong>市場地位</strong>: ${businessIdea.domain}分野の既存プレイヤー</li>
                <li><strong>当社優位性</strong>: ${businessIdea.advantage.join('、')}</li>
                <li><strong>差別化要因</strong>: ${businessIdea.synergy}</li>
              </ul>
            </div>
            `).join('')}

            <h3>⚔️ 競争戦略</h3>
            <ul>
              <li><strong>差別化要因</strong>: ${businessIdea.synergy}</li>
              <li><strong>競争優位性</strong>: ${businessIdea.advantage.join('、')}</li>
              <li><strong>価格戦略</strong>: ${businessIdea.businessModel}</li>
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
              <h4>${businessIdea.synergy}</h4>
              <ul>
                <li><strong>丸の内エリア</strong>: ${businessIdea.domain}分野での実証フィールド</li>
                <li><strong>大手町・有楽町</strong>: 先進技術の蓄積と検証環境</li>
                <li><strong>テナント企業</strong>: ${businessIdea.target}との直接的関係</li>
              </ul>
            </div>

            <h3>📊 データ資産の優位性</h3>
            <ul>
              <li><strong>運営データ</strong>: ${businessIdea.domain}関連の実績データ</li>
              <li><strong>顧客行動データ</strong>: テナント・来訪者の活動パターン</li>
              <li><strong>事業ノウハウ</strong>: ${businessIdea.target}との長期関係構築経験</li>
            </ul>

            <h3>🎯 成長戦略との整合性</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>「Creating Shared Value」の具現化</h4>
              <ul>
                <li><strong>社会課題解決</strong>: ${businessIdea.problem}の解決による社会貢献</li>
                <li><strong>新規事業創出</strong>: ${businessIdea.domain}分野での収益源確立</li>
                <li><strong>デジタル変革</strong>: ${businessIdea.solution}による競争優位性強化</li>
              </ul>
            </div>

            <h3>🌟 独自の価値創造</h3>
            <ul>
              <li><strong>実証環境の提供</strong>: 自社物件での${businessIdea.solution}検証</li>
              <li><strong>総合的ソリューション</strong>: ${businessIdea.businessModel}の一貫提供</li>
              <li><strong>長期パートナーシップ</strong>: ${businessIdea.target}との持続的関係</li>
              <li><strong>グループシナジー</strong>: 三菱グループの総合力活用</li>
            </ul>

            <h3>💼 組織・人材面での優位性</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <ul>
                <li><strong>ブランド力</strong>: 三菱地所の信頼性による${businessIdea.target}への訴求力</li>
                <li><strong>業界経験</strong>: ${businessIdea.domain}分野での実績とノウハウ</li>
                <li><strong>グローバルネットワーク</strong>: 海外展開への発展可能性</li>
              </ul>
            </div>

            <h3>🚀 長期ビジョンへの貢献</h3>
            <p>${businessIdea.title}事業は、三菱地所が目指す「持続可能な社会」の実現において重要な役割を果たし、${businessIdea.domain}分野でのESG経営の具体的成果として社会からの評価向上にも寄与します。</p>
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
                <li><strong>検証内容</strong>: ${businessIdea.verification[0]}</li>
                <li><strong>対象</strong>: ${businessIdea.target}との協力</li>
                <li><strong>範囲</strong>: ${businessIdea.solution}の基本機能</li>
                <li><strong>予算</strong>: 5000万円</li>
              </ul>
            </div>

            <h3>🏢 Phase 2: パイロット実証（6ヶ月）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>${businessIdea.target}での実証実験</h4>
              <ul>
                <li><strong>実証内容</strong>: ${businessIdea.verification[1] || businessIdea.verification[0]}</li>
                <li><strong>範囲</strong>: ${businessIdea.solution}の実用化</li>
                <li><strong>KPI</strong>: ${businessIdea.problem}の解決効果測定</li>
                <li><strong>予算</strong>: 2億円</li>
              </ul>
            </div>

            <h3>📈 Phase 3: スケール展開（12ヶ月）</h3>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <h4>商用サービス開始</h4>
              <ul>
                <li><strong>目標</strong>: ${businessIdea.target}10社への導入</li>
                <li><strong>機能</strong>: ${businessIdea.solution}フルバージョン</li>
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
              <h4>⚠️ ${businessIdea.risks[0]}</h4>
              <ul>
                <li><strong>確率</strong>: 中（40%）</li>
                <li><strong>影響</strong>: 高（市場投入遅れ）</li>
                <li><strong>軽減策</strong>: アジャイル開発、技術パートナー連携、段階的リリース</li>
              </ul>
            </div>

            <div style="background: #fee; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #dc2626;">
              <h4>⚠️ ${businessIdea.risks[1] || '市場環境変化'}</h4>
              <ul>
                <li><strong>確率</strong>: 中（30%）</li>
                <li><strong>影響</strong>: 高（売上減少）</li>
                <li><strong>軽減策</strong>: ${businessIdea.businessModel}、多角化戦略、継続的市場調査</li>
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