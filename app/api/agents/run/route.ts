/**
 * POST /api/agents/run
 * エージェントワークフローの実行エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stateManager } from '@/lib/langgraph/state-manager';
import { loadConfig, validateConfig } from '@/lib/langgraph/config';
import { errorHandler, createSystemError } from '@/lib/langgraph/error-handler';

export async function POST(request: NextRequest) {
  try {
    // 設定の読み込みと検証
    const config = loadConfig();
    validateConfig(config);

    // 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // リクエストボディの取得と検証
    const body = await request.json();
    const { topic, requirements } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required and must be a non-empty string', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // セッションの作成
    const sessionId = stateManager.createSession(user.id, topic.trim(), requirements);
    
    // 初期ログ記録
    stateManager.addAgentExecution(sessionId, {
      agent: 'planner',
      timestamp: new Date().toISOString(),
      input: { topic, requirements },
      output: { session_created: true },
      success: true,
      duration: 0,
      tokens_used: 0
    });

    // レスポンス返却
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      status: 'created',
      message: 'Agent workflow session created successfully',
      data: {
        topic: topic.trim(),
        requirements: requirements || null,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Agent run API error:', error);
    
    // エラーの種類に応じた処理
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: 'SYSTEM_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'UNKNOWN_ERROR',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}