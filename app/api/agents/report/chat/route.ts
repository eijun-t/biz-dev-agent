/**
 * Report Chat API Endpoint
 * レポートチャット機能のAPIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/langgraph/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatMessage, ChatContext, ComprehensiveBusinessReport } from '@/lib/agents/report/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message || !context) {
      return NextResponse.json({ 
        error: 'Message and context are required' 
      }, { status: 400 });
    }

    // 設定を読み込み
    const config = loadConfig();
    const llm = new ChatOpenAI({
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      temperature: 0.7, // チャット用にやや高めの温度
      maxTokens: 1000
    });

    // チャット応答の生成
    const response = await generateChatResponse(llm, message, context);

    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      related_section: context.current_section,
      context_data: response.context_data
    };

    return NextResponse.json({
      success: true,
      message: chatMessage,
      context_updated: false,
      suggested_questions: response.suggested_questions
    });

  } catch (error) {
    console.error('Report chat error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * チャット応答の生成
 */
async function generateChatResponse(
  llm: ChatOpenAI,
  userMessage: string,
  context: ChatContext
): Promise<{
  content: string;
  context_data?: any;
  suggested_questions?: string[];
}> {
  const reportData = context.report_data;
  const currentSection = context.current_section;
  const conversationHistory = context.conversation_history.slice(-6); // 直近6件

  // セクション固有のデータを抽出
  const sectionData = extractSectionData(reportData, currentSection);
  
  const chatPrompt = `あなたは三菱地所のビジネスアイデア分析レポートに関する質問に答えるAIアシスタントです。

レポート情報:
- ビジネスアイデア: ${reportData.selected_business_idea.title}
- 現在表示中のセクション: ${currentSection}
- 市場規模TAM: ${reportData.analysis_phase_result?.market_analysis.tam.value}${reportData.analysis_phase_result?.market_analysis.tam.unit}
- 全体品質スコア: ${reportData.report_generation_result?.final_score}/100

セクション固有データ:
${JSON.stringify(sectionData, null, 2)}

会話履歴:
${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

ユーザー質問: ${userMessage}

回答要件:
- 具体的で実用的な回答を提供
- レポートのデータに基づいて回答
- 不明な点は推測せず「レポートに記載されていません」と答える
- 三菱地所の視点から分析
- 200文字以内で簡潔に回答

回答:`;

  const response = await llm.invoke(chatPrompt);
  const content = response.content as string;

  // 関連する追加質問の提案
  const suggestedQuestions = generateSuggestedQuestions(currentSection, userMessage);

  return {
    content: content.trim(),
    context_data: sectionData,
    suggested_questions: suggestedQuestions
  };
}

/**
 * セクション固有データの抽出
 */
function extractSectionData(reportData: ComprehensiveBusinessReport, sectionName: string): any {
  const idea = reportData.selected_business_idea;
  const analysis = reportData.analysis_phase_result;

  switch (sectionName) {
    case '概要':
      return {
        title: idea.title,
        problem: idea.problem_statement,
        solution: idea.solution,
        market_size: analysis?.market_analysis.tam.value,
        confidence: analysis?.analysis_confidence
      };

    case '想定ターゲットと課題':
      return {
        target_market: idea.target_market,
        problem_statement: idea.problem_statement,
        research_insights: reportData.research_phase_result?.map(r => r.key_insights).flat()
      };

    case 'ソリューション仮説・ビジネスモデル':
      return {
        solution: idea.solution,
        business_model: idea.business_model,
        revenue_projections: analysis?.financial_projections.revenue_projections,
        break_even: analysis?.financial_projections.profitability.break_even_point
      };

    case '市場規模・競合':
      return {
        tam: analysis?.market_analysis.tam,
        sam: analysis?.market_analysis.sam,
        som: analysis?.market_analysis.som,
        competitors: analysis?.competitive_analysis.direct_competitors,
        market_growth: analysis?.market_analysis.market_growth_rate
      };

    case '三菱地所が取り組む意義':
      return {
        mitsubishi_synergy: idea.mitsubishi_synergy,
        strategic_recommendations: analysis?.strategic_recommendations,
        competitive_advantages: analysis?.competitive_analysis.market_positioning.competitive_advantages
      };

    case '検証アクション':
      return {
        next_steps: analysis?.next_steps,
        financial_requirements: analysis?.financial_projections.funding_requirements,
        implementation_timeline: 'Phase 1: 6ヶ月, Phase 2: 18ヶ月'
      };

    case 'リスク':
      return {
        overall_risk_score: analysis?.risk_assessment.overall_risk_score,
        market_risks: analysis?.risk_assessment.market_risks,
        mitigation_strategies: analysis?.risk_assessment.mitigation_strategies
      };

    default:
      return {
        general_info: {
          title: idea.title,
          target_market: idea.target_market
        }
      };
  }
}

/**
 * 関連質問の提案生成
 */
function generateSuggestedQuestions(sectionName: string, userMessage: string): string[] {
  const questionsBySection: { [key: string]: string[] } = {
    '概要': [
      'この事業の最大の強みは何ですか？',
      '実現可能性はどの程度ですか？',
      '投資回収期間はどのくらいですか？'
    ],
    '想定ターゲットと課題': [
      'ターゲット顧客の具体的なペルソナは？',
      '課題の緊急性はどの程度ですか？',
      '市場セグメントの優先順位は？'
    ],
    'ソリューション仮説・ビジネスモデル': [
      '技術的な実現可能性は？',
      '競合との差別化要因は？',
      'スケーラビリティはありますか？'
    ],
    '市場規模・競合': [
      '市場成長率の根拠は？',
      '主要競合との比較は？',
      '市場シェア獲得戦略は？'
    ],
    '三菱地所が取り組む意義': [
      '既存事業とのシナジーは？',
      'ブランド価値への影響は？',
      '長期的な戦略価値は？'
    ],
    '検証アクション': [
      '最初に取り組むべきアクションは？',
      '必要な予算規模は？',
      '成功指標の設定は？'
    ],
    'リスク': [
      '最も重要なリスクは？',
      'リスク軽減策の優先順位は？',
      '早期警告指標は？'
    ]
  };

  const questions = questionsBySection[sectionName] || [
    'このセクションで重要なポイントは？',
    '他のセクションとの関連性は？',
    '詳細な分析データはありますか？'
  ];

  // ユーザーの質問に基づいて関連質問を絞り込み
  return questions.slice(0, 3);
}