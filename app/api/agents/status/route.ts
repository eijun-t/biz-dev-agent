/**
 * GET /api/agents/status
 * エージェントワークフローの状態確認エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stateManager } from '@/lib/langgraph/state-manager';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // セッションIDの取得
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'MISSING_SESSION_ID' },
        { status: 400 }
      );
    }

    // セッション情報の取得
    const session = stateManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // ユーザー権限チェック
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // セッション統計情報の取得
    const stats = stateManager.getSessionStats(sessionId);

    // レスポンス作成
    const response = {
      success: true,
      sessionId: sessionId,
      status: session.is_active ? 'active' : 'inactive',
      data: {
        // 基本情報
        userId: session.user_id,
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        
        // ワークフロー状態
        isCompleted: session.state.is_completed,
        hasErrors: session.state.has_errors,
        currentAgent: session.state.current_agent,
        researchPhase: session.state.research_phase,
        iterationCount: session.state.iteration_count,
        
        // 入力データ
        topic: session.state.user_input,
        requirements: session.state.requirements,
        
        // 進捗データ
        researchDataCount: session.state.research_data.length,
        ideasCount: session.state.ideas.length,
        hasSelectedIdea: !!session.state.selected_idea,
        hasAnalysisResults: !!session.state.analysis_results,
        hasReport: !!session.state.report,
        
        // 品質スコア
        qualityScores: session.state.quality_scores,
        
        // 統計情報
        stats: stats,
        
        // 実行履歴（最新10件）
        recentExecutions: session.state.agent_history
          .slice(-10)
          .map(exec => ({
            agent: exec.agent,
            timestamp: exec.timestamp,
            success: exec.success,
            duration: exec.duration,
            tokens_used: exec.tokens_used,
            error: exec.error
          }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SYSTEM_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// プリフライトリクエストの処理
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}