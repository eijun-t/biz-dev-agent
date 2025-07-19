import { ChatOpenAI } from "@langchain/openai";
import { AgentState, AgentExecutionResult, ReportContent } from "./types";

export class WriterAgent {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: process.env.LLM_MODEL_DEFAULT || "gpt-4o",
      temperature: 0.4, // バランスの取れた創造性
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 最終レポート生成を実行
   */
  async executeReportGeneration(state: AgentState): Promise<AgentExecutionResult> {
    const selectedIdea = state.evaluation?.selected_idea;
    const detailedResearch = state.detailed_research;
    const startTime = Date.now();
    let tokensUsed = 0;
    
    if (!selectedIdea || !detailedResearch) {
      return {
        success: false,
        updated_state: state,
        next_action: 'fail',
        quality_score: 0,
        tokens_used: 0,
        error: '必要なデータが不足しています'
      };
    }

    try {
      // 1. 構造化データの作成
      const structuredData = this.createStructuredReportData(state);

      // 2. HTMLレポートの生成
      const htmlContent = await this.generateHTMLReport(structuredData);
      tokensUsed += 1200;

      // 3. レポート品質の評価
      const qualityScore = await this.evaluateReportQuality(htmlContent, structuredData);
      tokensUsed += 300;

      const updatedState: AgentState = {
        ...state,
        final_report: {
          html_content: htmlContent,
          structured_data: structuredData,
          quality_score: qualityScore
        },
        stage: 'completed',
        tokens_used: state.tokens_used + tokensUsed,
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'writer',
            action: 'report_generation_completed',
            details: {
              idea_title: selectedIdea.title,
              quality_score: qualityScore,
              report_length: htmlContent.length,
              execution_time: Date.now() - startTime
            }
          }
        ]
      };

      return {
        success: true,
        updated_state: updatedState,
        next_action: 'complete',
        quality_score: qualityScore,
        tokens_used: tokensUsed
      };

    } catch (error) {
      console.error('Report generation error:', error);
      
      const updatedState: AgentState = {
        ...state,
        errors: [...state.errors, `レポート生成エラー: ${error}`],
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'writer',
            action: 'report_generation_failed',
            details: { error: error instanceof Error ? error.message : String(error) }
          }
        ]
      };

      return {
        success: false,
        updated_state: updatedState,
        next_action: 'retry',
        quality_score: 0,
        tokens_used: tokensUsed,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 構造化レポートデータの作成
   */
  private createStructuredReportData(state: AgentState): ReportContent {
    const selectedIdea = state.evaluation!.selected_idea;
    const research = state.detailed_research!;

    return {
      idea_title: selectedIdea.title,
      target: selectedIdea.target_customer,
      challenges: `ターゲット顧客の課題: ${selectedIdea.description}`,
      monetization: selectedIdea.value_proposition,
      market_tam: `TAM: ${research.market_size.tam}, PAM: ${research.market_size.pam}, SAM: ${research.market_size.sam}`,
      competitors: `直接競合: ${research.competitive_analysis.direct_competitors.join(', ')}\n間接競合: ${research.competitive_analysis.indirect_competitors.join(', ')}`,
      mitsubishi_synergy: selectedIdea.mitsubishi_synergy,
      risks: `市場リスク: ${research.risks.market_risks}\n技術リスク: ${research.risks.technical_risks}\n規制リスク: ${research.risks.regulatory_risks}`,
      roadmap: research.implementation_roadmap
    };
  }

  /**
   * HTMLレポートの生成
   */
  private async generateHTMLReport(data: ReportContent): Promise<string> {
    const reportPrompt = `以下のビジネス企画データから、三菱地所の経営陣向けの包括的なビジネスレポートをHTML形式で作成してください。

データ:
${JSON.stringify(data, null, 2)}

要求仕様:
1. A3横サイズ（1189px幅）で1画面に収まるレイアウト
2. TailwindCSSクラスを使用したスタイリング
3. 以下のセクション構成:
   - ヘッダー（タイトル、サマリー）
   - ビジネスモデル概要
   - 市場分析（TAM/PAM/SAM、競合分析）
   - 三菱地所とのシナジー
   - リスク分析と対策
   - 実装ロードマップ
   - 推奨アクション

4. デザイン要件:
   - プロフェッショナルで読みやすい
   - 重要情報の視覚的強調
   - 適切な余白とレイアウト
   - グラフィカルな要素（ボックス、アイコン等）

5. 内容要件:
   - 具体的で実行可能な提案
   - 数値データの明確な表示
   - リスクと対策の明確化
   - 次のステップの具体的な提示

完全なHTMLドキュメントとして出力してください:`;

    const response = await this.llm.invoke(reportPrompt);
    return response.content as string;
  }

  /**
   * レポート品質の評価
   */
  private async evaluateReportQuality(htmlContent: string, structuredData: ReportContent): Promise<number> {
    const qualityPrompt = `以下のビジネスレポートの品質を1-10で評価してください。

HTML内容の長さ: ${htmlContent.length}文字
構造化データ: ${Object.keys(structuredData).length}項目

評価基準:
1. 情報の完全性（全項目が適切に含まれているか）
2. 内容の具体性（曖昧でない具体的な情報）
3. 実行可能性（実際に実行できる提案内容）
4. 説得力（経営陣が判断できる材料）
5. 視覚的品質（読みやすさとプロフェッショナルさ）

最低要件:
- HTML長さ: 2000文字以上
- 全9項目の情報が含まれている
- 具体的な数値や提案が含まれている

品質スコア（1-10）:`;

    const response = await this.llm.invoke(qualityPrompt);
    const qualityScore = parseInt(response.content.toString().match(/\d+/)?.[0] || "5");
    
    // 基本的な品質チェック
    let adjustedScore = qualityScore;
    
    if (htmlContent.length < 1500) {
      adjustedScore = Math.max(1, adjustedScore - 2);
    }
    
    if (!htmlContent.includes('DOCTYPE') && !htmlContent.includes('<html')) {
      adjustedScore = Math.max(1, adjustedScore - 1);
    }
    
    return Math.min(10, Math.max(1, adjustedScore));
  }
}