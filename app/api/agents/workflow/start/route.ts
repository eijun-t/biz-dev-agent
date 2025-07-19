/**
 * Workflow Orchestration - Start Endpoint
 * マルチエージェントワークフローの開始エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user_input, session_id } = await request.json();

    // セッション初期化
    const sessionData = {
      id: session_id,
      user_input: user_input || '',
      phase: 'research',
      current_step: 'planner_initialization',
      progress_percentage: 5,
      status: 'running',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Supabaseにセッション保存
    const { error: sessionError } = await supabase
      .from('workflow_sessions')
      .upsert(sessionData);

    if (sessionError) {
      console.error('Session creation error:', sessionError);
    }

    // 初期ステップを作成
    const initialSteps = [
      {
        id: `step_${Date.now()}_1`,
        session_id,
        agent: 'planner',
        action: 'ワークフロー計画を立案中',
        status: 'in_progress',
        timestamp: new Date().toISOString(),
        details: 'ユーザー入力を分析して最適な調査計画を作成しています'
      }
    ];

    // ステップをSupabaseに保存
    const { error: stepsError } = await supabase
      .from('workflow_steps')
      .insert(initialSteps);

    if (stepsError) {
      console.error('Steps creation error:', stepsError);
    }

    // バックグラウンドでワークフロー実行を開始
    // 本来はここでLangGraph.jsのワークフローを起動
    startWorkflowExecution(session_id, user_input);

    return NextResponse.json({
      success: true,
      session_id,
      message: 'ワークフローが開始されました'
    });

  } catch (error) {
    console.error('Workflow start error:', error);
    return NextResponse.json({
      success: false,
      error: 'ワークフローの開始に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * バックグラウンドワークフロー実行
 * 実際のプロダクションではLangGraph.jsで実装
 */
async function startWorkflowExecution(sessionId: string, userInput: string) {
  // デモ用のシミュレーション
  setTimeout(async () => {
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
      console.error('Workflow execution error:', error);
      await markWorkflowFailed(sessionId, error);
    }
  }, 1000);
}

async function simulateResearchPhase(sessionId: string) {
  const steps = [
    { agent: 'planner', action: '調査計画を完了', status: 'completed', progress: 10 },
    { agent: 'researcher', action: '市場トレンド調査を開始', status: 'in_progress', progress: 15 },
    { agent: 'researcher', action: '技術動向分析を実行中', status: 'in_progress', progress: 20 },
    { agent: 'researcher', action: '初期調査を完了', status: 'completed', progress: 25 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'ideation', 25);
}

async function simulateIdeationPhase(sessionId: string) {
  const steps = [
    { agent: 'ideator', action: 'ビジネスアイデア生成を開始', status: 'in_progress', progress: 30 },
    { agent: 'ideator', action: '複数のアイデア候補を作成中', status: 'in_progress', progress: 35 },
    { agent: 'critic', action: 'アイデア品質評価を実行', status: 'in_progress', progress: 40 },
    { agent: 'ideator', action: 'フィードバックに基づくアイデア改善', status: 'in_progress', progress: 45 },
    { agent: 'critic', action: 'アイデア評価を完了', status: 'completed', progress: 50 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'analysis', 50);
}

async function simulateAnalysisPhase(sessionId: string) {
  const steps = [
    { agent: 'researcher', action: '詳細市場調査を開始', status: 'in_progress', progress: 55 },
    { agent: 'analyst', action: '市場規模算出を実行中', status: 'in_progress', progress: 60 },
    { agent: 'analyst', action: '競合分析を実行中', status: 'in_progress', progress: 65 },
    { agent: 'analyst', action: 'リスク評価を実行中', status: 'in_progress', progress: 70 },
    { agent: 'analyst', action: '詳細分析を完了', status: 'completed', progress: 75 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateWorkflowStep(sessionId, step);
  }

  await updateSessionPhase(sessionId, 'report', 75);
}

async function simulateReportPhase(sessionId: string) {
  const steps = [
    { agent: 'writer', action: '包括的レポート生成を開始', status: 'in_progress', progress: 80 },
    { agent: 'writer', action: '各セクションを作成中', status: 'in_progress', progress: 85 },
    { agent: 'critic', action: 'レポート品質評価を実行', status: 'in_progress', progress: 90 },
    { agent: 'writer', action: 'レポート最終調整中', status: 'in_progress', progress: 95 },
    { agent: 'coordinator', action: 'レポート生成を完了', status: 'completed', progress: 100 }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    await updateWorkflowStep(sessionId, step);
  }
}

async function updateWorkflowStep(sessionId: string, stepData: any) {
  const step = {
    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    session_id: sessionId,
    agent: stepData.agent,
    action: stepData.action,
    status: stepData.status,
    timestamp: new Date().toISOString(),
    details: stepData.details || null
  };

  await supabase.from('workflow_steps').insert([step]);
  
  // セッションの進捗更新
  await supabase
    .from('workflow_sessions')
    .update({
      progress_percentage: stepData.progress,
      current_step: step.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

async function updateSessionPhase(sessionId: string, phase: string, progress: number) {
  await supabase
    .from('workflow_sessions')
    .update({
      phase,
      progress_percentage: progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

async function completeWorkflow(sessionId: string) {
  await supabase
    .from('workflow_sessions')
    .update({
      phase: 'completed',
      status: 'completed',
      progress_percentage: 100,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

async function markWorkflowFailed(sessionId: string, error: any) {
  await supabase
    .from('workflow_sessions')
    .update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}