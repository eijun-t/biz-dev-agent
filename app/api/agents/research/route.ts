/**
 * Research Phase API Endpoint
 * 研究フェーズのAPI統合
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/langgraph/config';
import { StateManager } from '@/lib/langgraph/state-manager';
import { ErrorHandler } from '@/lib/langgraph/error-handler';
import { ResearchCoordinator } from '@/lib/agents/research';
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
    const { user_input, session_id } = body;

    // LLMインスタンス作成（研究エージェント用）
    const llm = createChatOpenAI('researcher');

    // 環境変数の確認
    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      return NextResponse.json({ 
        error: 'Serper API key not configured' 
      }, { status: 500 });
    }

    // 研究コーディネーターを初期化
    const coordinator = new ResearchCoordinator(
      llm,
      serperApiKey,
      parseInt(process.env.RESEARCH_PARALLEL_LIMIT || '5'),
      parseInt(process.env.MAX_EXECUTION_TIME || '600000'),
      parseInt(process.env.MAX_RETRIES || '3')
    );

    // セッションを作成または取得
    const actualSessionId = session_id || stateManager.createSession(user.id, user_input);

    // 研究フェーズを実行
    const result = await errorHandler.executeWithRetry(
      async () => {
        return await coordinator.executeResearchPhase(user_input, actualSessionId);
      },
      { 
        operation: 'research_phase', 
 
        sessionId: actualSessionId 
      }
    );

    // 結果を状態管理に保存
    stateManager.updateSession(actualSessionId, {
      research_phase_result: result,
      last_updated: new Date().toISOString()
    });

    // 統計情報を取得
    const statistics = coordinator.getPhaseStatistics(result);

    return NextResponse.json({
      success: true,
      session_id: actualSessionId,
      result,
      statistics,
      next_actions: result.next_action === 'proceed_to_ideation' ? 
        ['proceed_to_ideation'] : 
        ['continue_research', 'modify_plan']
    });

  } catch (error) {
    console.error('Research phase error:', error);
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

    // 研究フェーズの結果を取得
    const researchResult = sessionInfo.sharedState.research_phase_result;
    
    if (!researchResult) {
      return NextResponse.json({ 
        message: 'Research phase not started',
        session: sessionInfo
      });
    }

    // 統計情報を計算
    const coordinator = new ResearchCoordinator(
      createChatOpenAI('default'), // ダミーのLLM
      process.env.SERPER_API_KEY || '',
      5
    );
    const statistics = coordinator.getPhaseStatistics(researchResult);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      result: researchResult,
      statistics,
      session_info: sessionInfo
    });

  } catch (error) {
    console.error('Get research phase error:', error);
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
      temperature: 0.7,
      maxTokens: 4000
    });

    const coordinator = new ResearchCoordinator(
      llm,
      process.env.SERPER_API_KEY || '',
      parseInt(process.env.RESEARCH_PARALLEL_LIMIT || '5'),
      parseInt(process.env.MAX_EXECUTION_TIME || '600000'),
      parseInt(process.env.MAX_RETRIES || '3')
    );

    let result;

    switch (action) {
      case 'continue_research':
        // 追加研究を実行
        const currentState = sessionInfo.sharedState.research_phase_result;
        if (currentState) {
          result = await coordinator.executeResearchPhase(
            parameters?.additional_input || '',
            session_id
          );
        } else {
          return NextResponse.json({ 
            error: 'No existing research state found' 
          }, { status: 400 });
        }
        break;

      case 'modify_plan':
        // 研究計画を修正
        result = await coordinator.executeResearchPhase(
          parameters?.modified_input || sessionInfo.userInput,
          session_id
        );
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // 結果を状態管理に保存
    stateManager.updateSession(session_id, {
      research_phase_result: result,
      last_updated: new Date().toISOString()
    });

    const statistics = coordinator.getPhaseStatistics(result);

    return NextResponse.json({
      success: true,
      session_id,
      result,
      statistics,
      action_performed: action
    });

  } catch (error) {
    console.error('Update research phase error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}