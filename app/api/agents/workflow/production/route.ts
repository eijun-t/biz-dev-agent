/**
 * Production Workflow Endpoint
 * 実際のLLMエージェントを使用したビジネスレポート生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReport } from '@/lib/database/queries';
import { CreateReportInput } from '@/lib/database/types';
import BusinessWorkflowOrchestrator from '@/lib/agents/business-agents';

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
  user_id?: string;
}

// In-memory storage for workflow states
const workflowStates = new Map<string, WorkflowState>();

export async function POST(request: NextRequest) {
  try {
    const { action, session_id, user_input } = await request.json();

    if (action === 'start') {
      return startProductionWorkflow(session_id, user_input || '');
    } else if (action === 'status') {
      return getWorkflowStatus(session_id);
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Production workflow error:', error);
    return NextResponse.json({
      success: false,
      error: 'Workflow execution failed',
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

async function startProductionWorkflow(sessionId: string, userInput: string) {
  // Get authenticated user (always skip in development/testing)
  let user = null;
  let userId = 'dev_user';
  
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    skipAuth: true // Always skip for testing
  });
  
  // Always skip authentication for testing
  if (false && process.env.NODE_ENV === 'production') {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    user = authUser;
    userId = authUser.id;
  } else {
    console.log('Development mode: Skipping authentication');
  }

  // Initialize workflow state
  const workflowState: WorkflowState = {
    phase: 'research',
    current_step: 'workflow_initialization',
    steps: [],
    session_id: sessionId,
    progress_percentage: 5,
    status: 'running',
    userInput: userInput,
    user_id: userId
  };

  workflowStates.set(sessionId, workflowState);

  // Start actual workflow execution
  executeProductionWorkflow(sessionId, userInput, userId);

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    message: '本格的なAIワークフローが開始されました'
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

async function executeProductionWorkflow(sessionId: string, userInput: string, userId: string) {
  const orchestrator = new BusinessWorkflowOrchestrator();
  
  try {
    // Progress callback function
    const progressCallback = (phase: string, progress: number) => {
      updateWorkflowProgress(sessionId, phase, progress);
    };

    // Add initial step
    await addWorkflowStep(sessionId, {
      agent: 'coordinator',
      action: 'ワークフロー初期化完了',
      status: 'completed'
    });

    // Execute the full workflow with real LLM agents
    console.log(`Starting production workflow for session ${sessionId}`);
    
    const finalReport = await orchestrator.executeFullWorkflow(
      userInput,
      userId,
      sessionId,
      progressCallback
    );

    // Save to database (skip in development)
    if (process.env.NODE_ENV === 'production') {
      await saveReportToDatabase(finalReport, userId, userInput);
    } else {
      console.log('Development mode: Skipping database save');
    }

    // Complete workflow
    await completeProductionWorkflow(sessionId, finalReport);

  } catch (error) {
    console.error('Production workflow execution failed:', error);
    await markWorkflowFailed(sessionId, error);
  }
}

async function addWorkflowStep(sessionId: string, stepData: {
  agent: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
}) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  const step: WorkflowStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agent: stepData.agent,
    action: stepData.action,
    status: stepData.status,
    timestamp: new Date().toISOString(),
    details: stepData.details
  };

  state.steps.push(step);
  state.current_step = step.id;
  workflowStates.set(sessionId, state);
}

async function updateWorkflowProgress(sessionId: string, phase: string, progress: number) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  state.phase = phase as any;
  state.progress_percentage = progress;

  // Add progress step
  const phaseDescriptions: Record<string, string> = {
    'research': '市場調査・技術トレンド分析',
    'ideation': 'ビジネスアイデア生成・評価',
    'analysis': '詳細分析・事業性評価',
    'report': '包括的レポート生成',
    'completed': 'ワークフロー完了'
  };

  await addWorkflowStep(sessionId, {
    agent: getAgentForPhase(phase),
    action: phaseDescriptions[phase] || `${phase}フェーズ実行中`,
    status: progress === 100 ? 'completed' : 'in_progress'
  });

  workflowStates.set(sessionId, state);
}

function getAgentForPhase(phase: string): string {
  const agentMap: Record<string, string> = {
    'research': 'researcher',
    'ideation': 'ideator',
    'analysis': 'analyst',
    'report': 'writer',
    'completed': 'coordinator'
  };
  return agentMap[phase] || 'coordinator';
}

async function saveReportToDatabase(finalReport: any, userId: string, userInput: string) {
  try {
    const reportInput: CreateReportInput = {
      user_id: userId,
      title: finalReport.reportData.title,
      content: {
        idea_title: finalReport.reportData.selected_business_idea?.title || '',
        target: finalReport.reportData.selected_business_idea?.target_market || '',
        challenges: finalReport.reportData.research_phase_result?.market_analysis?.key_drivers?.join(', ') || '',
        monetization: finalReport.reportData.selected_business_idea?.revenue_model || '',
        market_tam: finalReport.reportData.research_phase_result?.market_analysis?.market_size || '',
        competitors: finalReport.reportData.research_phase_result?.competitive_landscape?.major_players?.join(', ') || '',
        mitsubishi_synergy: finalReport.reportData.selected_business_idea?.mitsubishi_synergy || '',
        risks: finalReport.reportData.analysis_results?.risk_analysis?.high_risks?.map((r: any) => r.risk)?.join(', ') || '',
        roadmap: 'AI生成による段階的実行計画'
      },
      html_content: JSON.stringify(finalReport),
      status: 'completed'
    };

    await createReport(reportInput);
    console.log(`Production report saved to database for user ${userId}`);
  } catch (error) {
    console.error('Failed to save production report to database:', error);
    throw error; // Re-throw to handle in workflow
  }
}

async function completeProductionWorkflow(sessionId: string, finalReport: any) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  await addWorkflowStep(sessionId, {
    agent: 'coordinator',
    action: 'AIレポート生成完了',
    status: 'completed'
  });

  state.final_report = finalReport;
  state.phase = 'completed';
  state.status = 'completed';
  state.progress_percentage = 100;
  
  workflowStates.set(sessionId, state);
}

async function markWorkflowFailed(sessionId: string, error: any) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  await addWorkflowStep(sessionId, {
    agent: 'coordinator',
    action: 'ワークフロー実行失敗',
    status: 'failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  });

  state.status = 'failed';
  state.error = error instanceof Error ? error.message : 'Unknown error';
  
  workflowStates.set(sessionId, state);
}