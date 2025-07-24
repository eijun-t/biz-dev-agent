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
  phase: 'input' | 'research' | 'ideation' | 'evaluation' | 'planning' | 'specialized_research' | 'analysis' | 'report' | 'completed';
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
    
    // Try Enhanced workflow first, fallback to mock if fails
    let finalReport;
    try {
      const orchestrator = new BusinessWorkflowOrchestrator();
      finalReport = await orchestrator.executeFullWorkflow(
        userInput,
        'dev_user', // Development user ID
        sessionId,
        progressCallback
      );
      console.log('✅ Enhanced workflow completed successfully');
    } catch (workflowError) {
      console.error('💥 Enhanced workflow failed, using fallback mock system:', {
        message: workflowError.message,
        sessionId: sessionId,
        userInput: userInput
      });
      
      // Update user about fallback
      await addWorkflowStep(sessionId, {
        agent: 'coordinator',
        action: '⚠️ Enhanced mode失敗 - Mockモードに切り替え',
        status: 'completed',
        details: 'API設定が不完全なため、モック版で実行中'
      });
      
      // Execute mock workflow
      finalReport = await executeMockWorkflow(sessionId, userInput, progressCallback);
    }

    // Complete workflow
    await completeEnhancedWorkflow(sessionId, finalReport);

  } catch (error) {
    console.error('❌ Enhanced workflow execution failed:', error);
    await markWorkflowFailed(sessionId, error);
  }
}

async function executeMockWorkflow(sessionId: string, userInput: string, progressCallback: any) {
  console.log('🎭 Executing mock workflow as fallback');
  
  // Mock research phase
  progressCallback('research', 20);
  await addWorkflowStep(sessionId, {
    agent: 'enhanced_researcher',
    action: '🔍 Enhanced Research - 包括的市場調査実行中',
    status: 'in_progress'
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await addWorkflowStep(sessionId, {
    agent: 'enhanced_researcher',
    action: '✅ 市場調査完了 (Mock)',
    status: 'completed'
  });

  // Mock ideation phase  
  progressCallback('ideation', 50);
  await addWorkflowStep(sessionId, {
    agent: 'enhanced_ideator',
    action: '💡 Enhanced Ideation - 高度なアイデア生成・評価',
    status: 'in_progress'
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock business ideas based on input
  const mockIdeas = generateMockBusinessIdeas(userInput);
  
  await addWorkflowStep(sessionId, {
    agent: 'enhanced_ideator',
    action: `✅ ${mockIdeas.length}個のビジネスアイデア生成完了 (Mock)`,
    status: 'completed'
  });

  // Mock analysis phase
  progressCallback('analysis', 75);
  await addWorkflowStep(sessionId, {
    agent: 'analyst',
    action: '📊 詳細分析・事業性評価',
    status: 'in_progress'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  await addWorkflowStep(sessionId, {
    agent: 'analyst',
    action: '✅ 事業性分析完了 (Mock)',
    status: 'completed'
  });

  // Mock report phase
  progressCallback('report', 90);
  await addWorkflowStep(sessionId, {
    agent: 'writer',
    action: '📄 最終レポート生成',
    status: 'in_progress'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await addWorkflowStep(sessionId, {
    agent: 'writer',
    action: '✅ 最終レポート生成完了 (Mock)',
    status: 'completed'
  });

  progressCallback('completed', 100);

  // Return mock report
  return {
    reportData: {
      userInput: userInput,
      executionMode: 'Mock (Fallback)',
      generatedAt: new Date().toISOString(),
      businessIdeas: mockIdeas,
      summary: {
        totalIdeas: mockIdeas.length,
        averageScore: 7.5,
        recommendedIdea: mockIdeas[0]?.title || 'Mock Business Idea'
      }
    },
    generatedReport: {
      sections: [
        {
          id: 'executive_summary',
          title: 'エグゼクティブサマリー',
          content: `入力「${userInput}」に基づく${mockIdeas.length}個のビジネスアイデアを生成しました。(Mock版)`
        },
        {
          id: 'business_ideas',
          title: 'ビジネスアイデア一覧',
          content: mockIdeas.map(idea => `• ${idea.title}: ${idea.description}`).join('\n')
        }
      ],
      quality_assessment: {
        overall_score: 7.5,
        category_scores: {
          feasibility: 7.0,
          market_potential: 8.0,
          innovation: 7.5
        }
      },
      generation_process: {
        total_time: '約5秒',
        mode: 'Mock (Enhanced API失敗のためフォールバック)'
      }
    }
  };
}

function generateMockBusinessIdeas(userInput: string) {
  const isAdvertising = userInput.includes('広告') || userInput.includes('マーケティング') || userInput.includes('プロモーション');
  const isIoT = userInput.includes('IoT') || userInput.includes('AI') || userInput.includes('DX');
  const isRealEstate = userInput.includes('不動産') || userInput.includes('建物') || userInput.includes('施設');

  if (isAdvertising) {
    return [
      {
        title: 'デジタルサイネージ統合広告プラットフォーム',
        description: '三菱地所の商業施設・オフィスビル内のデジタルサイネージを統合し、AI駆動の広告配信システムを構築'
      },
      {
        title: 'リアルタイム店舗分析サービス',
        description: '店舗内の人流データとデジタル広告の効果測定を組み合わせた、次世代マーケティングソリューション'
      },
      {
        title: 'AR建物案内システム',
        description: 'スマートフォンAR技術を活用した、商業施設・オフィスビル向けインタラクティブ案内サービス'
      }
    ];
  }

  if (isIoT) {
    return [
      {
        title: 'スマートビル管理プラットフォーム',
        description: 'IoTセンサーとAI分析による、エネルギー効率と居住快適性を最適化する統合管理システム'
      },
      {
        title: 'AI予測メンテナンスサービス',
        description: '建物設備の故障予測とメンテナンス最適化により、運営コスト削減とサービス品質向上を実現'
      },
      {
        title: '次世代コワーキングスペース',
        description: 'AI駆動の空間利用最適化と個人向けカスタマイズ機能を備えた、未来型ワークスペース'
      }
    ];
  }

  if (isRealEstate) {
    return [
      {
        title: 'プロパティテック投資プラットフォーム',
        description: 'AI評価システムと分散投資機能による、新世代不動産投資サービス'
      },
      {
        title: 'バーチャル不動産見学システム',
        description: 'VR/AR技術を活用した、リモート物件見学とバーチャル内見サービス'
      },
      {
        title: 'サステナブル建物認証サービス',
        description: '環境配慮型建物の認証・評価・改善提案を行う、ESG投資対応サービス'
      }
    ];
  }

  // Default business ideas
  return [
    {
      title: '次世代ビジネスプラットフォーム',
      description: 'AI・IoT・DX技術を統合した、企業向け総合ソリューションプラットフォーム'
    },
    {
      title: 'デジタル変革コンサルティング',
      description: '三菱地所の知見を活用した、企業のDX推進支援サービス'
    },
    {
      title: 'スマートシティ開発事業',
      description: '持続可能な都市開発とスマートインフラの統合による、未来都市創造プロジェクト'
    }
  ];
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
    'evaluation': '⚖️ Enhanced Critic - ビジネスアイデア総合評価',
    'planning': '📋 Advanced Planner - 詳細調査計画策定',
    'specialized_research': '🔬 Specialized Research - 専門分野別深掘り調査',
    'analysis': '🧠 Enhanced Analysis - Writer向けセクション生成',
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
    'evaluation': 'enhanced_critic',
    'planning': 'advanced_planner',
    'specialized_research': 'specialized_researcher',
    'analysis': 'enhanced_analyst',
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