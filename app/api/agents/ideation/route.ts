/**
 * Ideation Phase API Endpoint
 * アイディエーションフェーズのAPI統合
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/langgraph/config';
import { StateManager } from '@/lib/langgraph/state-manager';
import { ErrorHandler } from '@/lib/langgraph/error-handler';
import { IdeationCoordinator } from '@/lib/agents/ideation';
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
    const { research_summaries, user_requirements, session_id } = body;

    // 必須パラメータのチェック
    if (!research_summaries || !Array.isArray(research_summaries) || research_summaries.length === 0) {
      return NextResponse.json({ 
        error: 'Research summaries are required' 
      }, { status: 400 });
    }

    // LLMインスタンス作成（アイデア生成用）
    const llm = createChatOpenAI('ideator');

    // アイディエーションコーディネーターを初期化
    const coordinator = new IdeationCoordinator(
      llm,
      parseInt(process.env.IDEATION_MAX_ITERATIONS || '2'),
      parseInt(process.env.IDEATION_PASSING_SCORE || '70')
    );

    // セッションを作成または取得
    const actualSessionId = session_id || stateManager.createSession(user.id, user_requirements || '');

    // アイディエーションフェーズを実行
    const result = await errorHandler.executeWithRetry(
      async () => {
        return await coordinator.executeIdeationPhase(
          research_summaries,
          user_requirements,
          actualSessionId
        );
      },
      { 
        operation: 'ideation_phase', 
        sessionId: actualSessionId,
        agent: 'ideator',
        attempt: 0,
        timestamp: new Date().toISOString()
      }
    );

    // 結果を状態管理に保存
    stateManager.updateSession(actualSessionId, {
      ideation_phase_result: result,
      last_updated: new Date().toISOString()
    });

    // 統計情報を取得
    const statistics = coordinator.getIdeationStatistics(result);
    const summary = coordinator.formatResultSummary(result);

    return NextResponse.json({
      success: true,
      session_id: actualSessionId,
      result,
      statistics,
      summary,
      next_actions: result.final_score >= 70 ? 
        ['proceed_to_analysis'] : 
        ['review_ideas', 'modify_requirements', 'gather_more_research']
    });

  } catch (error) {
    console.error('Ideation phase error:', error);
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

    // アイディエーションフェーズの結果を取得
    const ideationResult = (sessionInfo as any).ideation_phase_result;
    
    if (!ideationResult) {
      return NextResponse.json({ 
        message: 'Ideation phase not started',
        session: sessionInfo
      });
    }

    // 統計情報を計算
    const coordinator = new IdeationCoordinator(
      createChatOpenAI('default'), // ダミーのLLM
      2
    );
    const statistics = coordinator.getIdeationStatistics(ideationResult);
    const summary = coordinator.formatResultSummary(ideationResult);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      result: ideationResult,
      statistics,
      summary,
      session_info: sessionInfo
    });

  } catch (error) {
    console.error('Get ideation phase error:', error);
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

    const coordinator = new IdeationCoordinator(llm, 2);

    let result;

    switch (action) {
      case 'regenerate_ideas':
        // 新しい要件でアイデアを再生成
        const currentState = (sessionInfo as any).ideation_phase_result;
        if (currentState) {
          result = await coordinator.executeIdeationPhase(
            parameters?.research_summaries || currentState.research_summaries,
            parameters?.modified_requirements || (sessionInfo as any).userInput || '',
            session_id
          );
        } else {
          return NextResponse.json({ 
            error: 'No existing ideation state found' 
          }, { status: 400 });
        }
        break;

      case 'evaluate_custom_idea':
        // カスタムアイデアの評価
        if (!parameters?.custom_idea) {
          return NextResponse.json({ 
            error: 'Custom idea required' 
          }, { status: 400 });
        }
        
        const critic = coordinator['critic']; // プライベートメンバーアクセス
        const evaluations = await critic.evaluateIdeas([parameters.custom_idea]);
        result = { custom_evaluation: evaluations[0] };
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // 結果を状態管理に保存
    if (action === 'regenerate_ideas') {
      stateManager.updateSession(session_id, {
        ideation_phase_result: result,
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
    console.error('Update ideation phase error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}