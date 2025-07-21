/**
 * Analysis Phase API Endpoint
 * 分析フェーズのAPI統合
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/langgraph/config';
import { StateManager } from '@/lib/langgraph/state-manager';
import { ErrorHandler } from '@/lib/langgraph/error-handler';
import { AnalysisCoordinator } from '@/lib/agents/analysis';
import { createChatOpenAI } from '@/lib/config/llm-config';
import { ChatOpenAI } from '@langchain/openai';

// グローバル状態管理
const stateManager = new StateManager();
const errorHandler = new ErrorHandler();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { business_ideas, selected_idea_id, session_id } = body;

    // 必須パラメータのチェック
    if (!business_ideas || !Array.isArray(business_ideas) || business_ideas.length === 0) {
      return NextResponse.json({ 
        error: 'Business ideas are required' 
      }, { status: 400 });
    }

    // LLMインスタンス作成（分析エージェント用）
    const llm = createChatOpenAI('analyst');

    // 環境変数の確認
    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      return NextResponse.json({ 
        error: 'Serper API key not configured' 
      }, { status: 500 });
    }

    // 分析コーディネーターを初期化
    const coordinator = new AnalysisCoordinator(
      llm,
      serperApiKey,
      {
        max_research_requests: parseInt(process.env.ANALYSIS_MAX_RESEARCH_REQUESTS || '5'),
        analysis_timeout: parseInt(process.env.ANALYSIS_TIMEOUT || '600000'),
        confidence_threshold: parseFloat(process.env.ANALYSIS_CONFIDENCE_THRESHOLD || '0.7'),
        max_iterations: parseInt(process.env.ANALYSIS_MAX_ITERATIONS || '3')
      }
    );

    // セッションを作成または取得
    const actualSessionId = session_id || stateManager.createSession(user.id, 'analysis_phase');

    // 分析フェーズを実行
    const result = await errorHandler.executeWithRetry(
      async () => {
        return await coordinator.executeAnalysisPhase(
          business_ideas,
          selected_idea_id,
          actualSessionId
        );
      },
      { 
        operation: 'analysis_phase', 
        sessionId: actualSessionId,
        agent: 'analyst',
        attempt: 0,
        timestamp: new Date().toISOString()
      }
    );

    // 結果を状態管理に保存
    stateManager.updateSession(actualSessionId, {
      analysis_phase_result: result,
      last_updated: new Date().toISOString()
    });

    // 統計情報を取得
    const statistics = coordinator.getAnalysisStatistics(result);
    const summary = coordinator.formatResultSummary(result);

    return NextResponse.json({
      success: true,
      session_id: actualSessionId,
      result,
      statistics,
      summary,
      next_actions: result.analysis_confidence >= 7 ? 
        ['proceed_to_implementation', 'review_analysis'] : 
        ['conduct_additional_research', 'revise_idea', 'seek_expert_input']
    });

  } catch (error) {
    console.error('Analysis phase error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // セッション情報を取得
    const sessionInfo = stateManager.getSession(sessionId);
    
    if (!sessionInfo) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 分析フェーズの結果を取得
    const analysisResult = (sessionInfo as any).analysis_phase_result;
    
    if (!analysisResult) {
      return NextResponse.json({ 
        message: 'Analysis phase not started',
        session: sessionInfo
      });
    }

    // 統計情報を計算
    const coordinator = new AnalysisCoordinator(
      createChatOpenAI('analyst'), // ダミーのLLM
      process.env.SERPER_API_KEY || ''
    );
    const statistics = coordinator.getAnalysisStatistics(analysisResult);
    const summary = coordinator.formatResultSummary(analysisResult);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      result: analysisResult,
      statistics,
      summary,
      session_info: sessionInfo
    });

  } catch (error) {
    console.error('Get analysis phase error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, action, parameters } = body;

    if (!session_id || !action) {
      return NextResponse.json({ 
        error: 'Session ID and action required' 
      }, { status: 400 });
    }

    // セッション情報を取得
    const sessionInfo = stateManager.getSession(session_id);
    
    if (!sessionInfo) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 設定を読み込み
    const config = loadConfig();
    const llm = new ChatOpenAI({
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      temperature: 0.2,
      maxTokens: 4000
    });

    const coordinator = new AnalysisCoordinator(
      llm,
      process.env.SERPER_API_KEY || ''
    );

    let result;

    switch (action) {
      case 'reanalyze_with_different_idea':
        // 別のアイデアで再分析
        const currentState = (sessionInfo as any).analysis_phase_result;
        if (currentState && parameters?.business_ideas && parameters?.selected_idea_id) {
          result = await coordinator.executeAnalysisPhase(
            parameters.business_ideas,
            parameters.selected_idea_id,
            session_id
          );
        } else {
          return NextResponse.json({ 
            error: 'Invalid parameters for reanalysis' 
          }, { status: 400 });
        }
        break;

      case 'conduct_additional_research':
        // 追加調査の実行
        if (!parameters?.research_focus) {
          return NextResponse.json({ 
            error: 'Research focus required' 
          }, { status: 400 });
        }
        
        // In a full implementation, this would trigger specific additional research
        result = {
          message: 'Additional research request submitted',
          research_focus: parameters.research_focus,
          status: 'pending'
        };
        break;

      case 'update_analysis_parameters':
        // 分析パラメータの更新
        if (parameters?.analysis_config) {
          const updatedCoordinator = new AnalysisCoordinator(
            llm,
            process.env.SERPER_API_KEY || '',
            parameters.analysis_config
          );
          
          result = {
            message: 'Analysis parameters updated',
            updated_config: parameters.analysis_config
          };
        } else {
          return NextResponse.json({ 
            error: 'Analysis config required' 
          }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // 結果を状態管理に保存（必要な場合）
    if (action === 'reanalyze_with_different_idea') {
      stateManager.updateSession(session_id, {
        analysis_phase_result: result,
        last_updated: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      session_id,
      result,
      action_performed: action
    });

  } catch (error) {
    console.error('Update analysis phase error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}