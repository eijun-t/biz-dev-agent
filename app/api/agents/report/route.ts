/**
 * Report Generation API Endpoint
 * レポート生成のAPIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/langgraph/config';
import { StateManager } from '@/lib/langgraph/state-manager';
import { ErrorHandler } from '@/lib/langgraph/error-handler';
import { ReportCoordinator } from '@/lib/agents/report';
import { createChatOpenAI } from '@/lib/config/llm-config';
import { ChatOpenAI } from '@langchain/openai';
import { ComprehensiveBusinessReport } from '@/lib/agents/report/types';

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
    const { 
      report_data, 
      session_id, 
      enable_revisions = true,
      max_revisions = 2 
    } = body;

    // 必須パラメータのチェック
    if (!report_data) {
      return NextResponse.json({ 
        error: 'Report data is required' 
      }, { status: 400 });
    }

    // LLMインスタンス作成（レポート生成用）
    const llm = createChatOpenAI('writer');

    // レポートコーディネーターを初期化
    const coordinator = new ReportCoordinator(llm, max_revisions);

    // セッションを作成または取得
    const actualSessionId = session_id || stateManager.createSession(user.id, 'report_generation');

    // レポート生成を実行
    const result = await errorHandler.executeWithRetry(
      async () => {
        const comprehensiveData: ComprehensiveBusinessReport = {
          ...report_data,
          id: report_data.id || `report_${Date.now()}`,
          session_id: actualSessionId,
          status: 'generated',
          created_at: report_data.created_at || new Date().toISOString(),
          last_updated: new Date().toISOString()
        };

        if (enable_revisions) {
          return await coordinator.generateReportWithRevisions(comprehensiveData);
        } else {
          return await coordinator.generateSimpleReport(comprehensiveData);
        }
      },
      { 
        operation: 'report_generation', 
        sessionId: actualSessionId,
        agent: 'writer',
        attempt: 0,
        timestamp: new Date().toISOString()
      }
    );

    // 結果をSupabaseに保存
    const reportStorage = {
      id: result.report_id,
      session_id: actualSessionId,
      user_id: user.id,
      title: report_data.selected_business_idea?.title || 'Untitled Report',
      content_json: JSON.stringify(result),
      raw_data_json: JSON.stringify(report_data),
      status: 'generated',
      final_score: result.final_score,
      word_count: result.word_count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: saveError } = await supabase
      .from('reports')
      .upsert(reportStorage);

    if (saveError) {
      console.error('Report save error:', saveError);
    }

    // 結果を状態管理に保存
    stateManager.updateSession(actualSessionId, {
      report_generation_result: result,
      last_updated: new Date().toISOString()
    });

    // 統計情報を取得
    const statistics = coordinator.getReportStatistics(result);
    const summary = coordinator.formatReportSummary(result);

    return NextResponse.json({
      success: true,
      session_id: actualSessionId,
      report_id: result.report_id,
      result,
      statistics,
      summary,
      next_actions: result.quality_assessment?.meets_threshold ? 
        ['export_report', 'share_report', 'create_presentation'] : 
        ['review_quality', 'manual_revision', 'regenerate_sections']
    });

  } catch (error) {
    console.error('Report generation error:', error);
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
    const reportId = searchParams.get('report_id');
    const sessionId = searchParams.get('session_id');

    if (reportId) {
      // 特定のレポートを取得
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

      if (error || !report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const reportData = JSON.parse(report.content_json);
      const coordinator = new ReportCoordinator(createChatOpenAI('default'));
      const statistics = coordinator.getReportStatistics(reportData);
      const summary = coordinator.formatReportSummary(reportData);

      return NextResponse.json({
        success: true,
        report: reportData,
        statistics,
        summary,
        metadata: {
          id: report.id,
          title: report.title,
          created_at: report.created_at,
          updated_at: report.updated_at,
          final_score: report.final_score,
          word_count: report.word_count
        }
      });

    } else if (sessionId) {
      // セッション情報を取得
      const sessionInfo = stateManager.getSession(sessionId);
      
      if (!sessionInfo) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const reportResult = (sessionInfo as any).report_generation_result;
      
      if (!reportResult) {
        return NextResponse.json({ 
          message: 'Report generation not started',
          session: sessionInfo
        });
      }

      const coordinator = new ReportCoordinator(createChatOpenAI('default'));
      const statistics = coordinator.getReportStatistics(reportResult);
      const summary = coordinator.formatReportSummary(reportResult);

      return NextResponse.json({
        success: true,
        session_id: sessionId,
        result: reportResult,
        statistics,
        summary,
        session_info: sessionInfo
      });

    } else {
      // ユーザーのレポート一覧を取得
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, title, final_score, word_count, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        reports: reports || [],
        total_count: reports?.length || 0
      });
    }

  } catch (error) {
    console.error('Get report error:', error);
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
    const { report_id, action, parameters } = body;

    if (!report_id || !action) {
      return NextResponse.json({ 
        error: 'Report ID and action required' 
      }, { status: 400 });
    }

    // レポートの取得
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      temperature: 0.3,
      maxTokens: 4000
    });

    const coordinator = new ReportCoordinator(llm);
    let result;

    switch (action) {
      case 'regenerate_section':
        // 特定セクションの再生成
        if (!parameters?.section_name) {
          return NextResponse.json({ 
            error: 'Section name required' 
          }, { status: 400 });
        }

        const originalData = JSON.parse(report.raw_data_json);
        const newSection = await coordinator.regenerateSection(
          originalData,
          parameters.section_name
        );

        result = { regenerated_section: newSection };
        break;

      case 'update_title':
        // レポートタイトルの更新
        if (!parameters?.new_title) {
          return NextResponse.json({ 
            error: 'New title required' 
          }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from('reports')
          .update({ title: parameters.new_title, updated_at: new Date().toISOString() })
          .eq('id', report_id);

        if (updateError) {
          throw updateError;
        }

        result = { message: 'Title updated successfully' };
        break;

      case 'delete_report':
        // レポートの削除
        const { error: deleteError } = await supabase
          .from('reports')
          .delete()
          .eq('id', report_id)
          .eq('user_id', user.id);

        if (deleteError) {
          throw deleteError;
        }

        result = { message: 'Report deleted successfully' };
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      report_id,
      result,
      action_performed: action
    });

  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}