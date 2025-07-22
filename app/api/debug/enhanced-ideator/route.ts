/**
 * Enhanced Ideator デバッグ用エンドポイント
 * アウトプットの詳細確認用
 */

import { NextRequest, NextResponse } from 'next/server';
import { IdeatorAgent } from '@/lib/agents/business-agents';

export async function POST(request: NextRequest) {
  try {
    const { userInput, researchResults } = await request.json();
    
    console.log('🔍 Enhanced Ideator デバッグテスト開始');
    console.log('入力:', userInput);
    console.log('リサーチデータ:', researchResults ? 'あり' : 'なし');
    
    const ideator = new IdeatorAgent();
    const result = await ideator.generateBusinessIdeas(
      userInput || '広告領域',
      researchResults || null,
      'debug_user',
      'debug_session'
    );
    
    console.log('🎯 デバッグ結果:', result);
    
    return NextResponse.json({
      success: true,
      debug_info: {
        userInput: userInput || '広告領域',
        hasResearchData: !!researchResults,
        ideatorResult: result.data,
        execution_time: result.executionTime,
        tokens_used: result.tokensUsed,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Enhanced Ideator デバッグエラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug_info: {
        error_details: error,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Enhanced Ideator デバッグエンドポイント",
    usage: "POST /api/debug/enhanced-ideator with { userInput: string, researchResults?: any }",
    example: {
      userInput: "広告領域",
      researchResults: null
    }
  });
}