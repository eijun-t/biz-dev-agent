/**
 * Enhanced Workflow Endpoint - Development Testing
 * 認証なしでEnhanced Agentsをテストするためのエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
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
}

// In-memory storage for workflow states
const workflowStates = new Map<string, WorkflowState>();

export async function POST(request: NextRequest) {
  try {
    const { action, session_id, user_input } = await request.json();

    if (action === 'start') {
      return startEnhancedWorkflow(session_id, user_input || '');
    } else if (action === 'status') {
      return getWorkflowStatus(session_id);
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Enhanced workflow error:', error);
    return NextResponse.json({
      success: false,
      error: 'Enhanced workflow execution failed',
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
    console.error('Enhanced workflow status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Status fetch failed'
    }, { status: 500 });
  }
}

async function startEnhancedWorkflow(sessionId: string, userInput: string) {
  // Initialize workflow state
  const workflowState: WorkflowState = {
    phase: 'research',
    current_step: 'enhanced_workflow_initialization',
    steps: [],
    session_id: sessionId,
    progress_percentage: 5,
    status: 'running',
    userInput: userInput
  };

  workflowStates.set(sessionId, workflowState);

  // Start enhanced workflow execution
  executeEnhancedWorkflow(sessionId, userInput);

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    message: '🚀 Enhanced AI Workflowが開始されました (開発モード)'
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

async function executeEnhancedWorkflow(sessionId: string, userInput: string) {
  const orchestrator = new BusinessWorkflowOrchestrator();
  
  try {
    // Progress callback function
    const progressCallback = (phase: string, progress: number) => {
      updateWorkflowProgress(sessionId, phase, progress);
    };

    // Add initial step
    await addWorkflowStep(sessionId, {
      agent: 'coordinator',
      action: '🚀 Enhanced Workflow初期化完了',
      status: 'completed'
    });

    // Execute the full workflow with Enhanced LLM agents
    console.log(`🔥 Starting Enhanced workflow for session ${sessionId}`);
    console.log(`📝 Input: "${userInput}"`);
    
    let finalReport;
    try {
      finalReport = await orchestrator.executeFullWorkflow(
        userInput,
        'dev_user', // Development user ID
        sessionId,
        progressCallback
      );
      console.log('✅ Enhanced workflow completed successfully');
    } catch (workflowError) {
      console.error('💥 Workflow execution error details:', {
        message: workflowError.message,
        stack: workflowError.stack,
        sessionId: sessionId,
        userInput: userInput
      });
      throw workflowError;
    }

    // Complete workflow
    await completeEnhancedWorkflow(sessionId, finalReport);

  } catch (error) {
    console.error('❌ Enhanced workflow execution failed:', error);
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
  console.log(`📈 Workflow Progress Update: ${sessionId} - ${phase} (${progress}%)`);
  
  const state = workflowStates.get(sessionId);
  if (!state) {
    console.warn(`⚠️  No workflow state found for session: ${sessionId}`);
    return;
  }

  state.phase = phase as any;
  state.progress_percentage = progress;

  // Add progress step with enhanced descriptions
  const phaseDescriptions: Record<string, string> = {
    'research': '🔍 Enhanced Research - 包括的市場調査実行中',
    'ideation': '💡 Enhanced Ideation - 高度なアイデア生成・評価',
    'analysis': '📊 詳細分析・事業性評価',
    'report': '📄 最終レポート生成',
    'completed': '✅ Enhanced Workflow完了'
  };

  await addWorkflowStep(sessionId, {
    agent: getAgentForPhase(phase),
    action: phaseDescriptions[phase] || `${phase}フェーズ実行中`,
    status: progress === 100 ? 'completed' : 'in_progress'
  });

  workflowStates.set(sessionId, state);
  console.log(`✅ Progress updated successfully: ${phase} (${progress}%)`);
}

function getAgentForPhase(phase: string): string {
  const agentMap: Record<string, string> = {
    'research': 'enhanced_researcher',
    'ideation': 'enhanced_ideator',
    'analysis': 'analyst',
    'report': 'writer',
    'completed': 'coordinator'
  };
  return agentMap[phase] || 'coordinator';
}

async function completeEnhancedWorkflow(sessionId: string, finalReport: any) {
  const state = workflowStates.get(sessionId);
  if (!state) return;

  await addWorkflowStep(sessionId, {
    agent: 'coordinator',
    action: '🎉 Enhanced AI レポート生成完了',
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
    action: '❌ Enhanced Workflow実行失敗',
    status: 'failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  });

  state.status = 'failed';
  state.error = error instanceof Error ? error.message : 'Unknown error';
  
  workflowStates.set(sessionId, state);
}