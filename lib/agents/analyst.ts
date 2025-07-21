import { ChatOpenAI } from "@langchain/openai";
import { createChatOpenAI } from '@/lib/config/llm-config';
import { AgentState, AgentExecutionResult } from "./types";
import axios from "axios";

export class AnalystAgent {
  private llm: ChatOpenAI;
  private serperApiKey: string;
  
  constructor() {
    this.llm = createChatOpenAI('analyst');
    this.serperApiKey = process.env.SERPER_API_KEY || "";
  }

  /**
   * Web検索を実行
   */
  async performWebSearch(query: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: query,
          num: 10,
          hl: 'ja',
          gl: 'jp'
        },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Web search error:', error);
      return null;
    }
  }

  /**
   * 詳細市場分析を実行
   */
  async executeDetailedResearch(state: AgentState): Promise<AgentExecutionResult> {
    const selectedIdea = state.evaluation?.selected_idea;
    const startTime = Date.now();
    let tokensUsed = 0;
    
    if (!selectedIdea) {
      return {
        success: false,
        updated_state: state,
        next_action: 'fail',
        quality_score: 0,
        tokens_used: 0,
        error: '選択されたアイデアが不足しています'
      };
    }

    try {
      // 1. 市場規模調査
      const marketSizeAnalysis = await this.analyzeMarketSize(selectedIdea);
      tokensUsed += 600;

      // 2. 競合分析
      const competitiveAnalysis = await this.analyzeCompetitors(selectedIdea);
      tokensUsed += 600;

      // 3. リスク分析
      const riskAnalysis = await this.analyzeRisks(selectedIdea);
      tokensUsed += 500;

      // 4. 実装ロードマップ
      const roadmapAnalysis = await this.createImplementationRoadmap(selectedIdea);
      tokensUsed += 400;

      // 5. 品質評価
      const qualityPrompt = `以下の詳細分析結果の品質を1-10で評価してください。

市場規模分析:
${JSON.stringify(marketSizeAnalysis, null, 2)}

競合分析:
${JSON.stringify(competitiveAnalysis, null, 2)}

リスク分析:
${JSON.stringify(riskAnalysis, null, 2)}

実装ロードマップ:
${roadmapAnalysis}

評価基準:
- データの具体性と信頼性
- 分析の深度と包括性
- 数値の妥当性
- リスクの網羅性
- 実装可能性

品質スコア（1-10）:`;

      const qualityResponse = await this.llm.invoke(qualityPrompt);
      const qualityScore = parseInt(qualityResponse.content.toString().match(/\d+/)?.[0] || "5");
      tokensUsed += 200;

      const updatedState: AgentState = {
        ...state,
        detailed_research: {
          market_size: marketSizeAnalysis,
          competitive_analysis: competitiveAnalysis,
          risks: riskAnalysis,
          implementation_roadmap: roadmapAnalysis,
          quality_score: qualityScore
        },
        tokens_used: state.tokens_used + tokensUsed,
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'analyst',
            action: 'detailed_research_completed',
            details: {
              idea_title: selectedIdea.title,
              quality_score: qualityScore,
              execution_time: Date.now() - startTime
            }
          }
        ]
      };

      return {
        success: true,
        updated_state: updatedState,
        next_action: 'advance_stage',
        quality_score: qualityScore,
        tokens_used: tokensUsed
      };

    } catch (error) {
      console.error('Detailed research error:', error);
      
      const updatedState: AgentState = {
        ...state,
        errors: [...state.errors, `詳細分析エラー: ${error}`],
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'analyst',
            action: 'detailed_research_failed',
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
   * 市場規模分析（TAM/PAM/SAM）
   */
  private async analyzeMarketSize(idea: any): Promise<any> {
    // Web検索で市場データを収集
    const marketSearchResults = await this.performWebSearch(
      `${idea.title} 市場規模 TAM SAM 日本 統計 市場調査`
    );

    const marketPrompt = `以下のビジネスアイデアの市場規模（TAM/PAM/SAM）を分析してください。

アイデア: ${idea.title}
説明: ${idea.description}
ターゲット: ${idea.target_customer}

検索結果:
${marketSearchResults?.organic?.slice(0, 5).map((r: any) => 
  `- ${r.title}: ${r.snippet}`
).join('\n') || '検索結果なし'}

以下の項目で分析してください:
1. TAM (Total Addressable Market): 理論的な全市場規模
2. PAM (Practical Addressable Market): 実際にアプローチ可能な市場
3. SAM (Serviceable Addressable Market): 実際に獲得可能な市場
4. 算出根拠と方法論

可能な限り具体的な数値を含めて回答してください。数値が不明な場合は推定方法を明記してください。

以下のJSON形式で回答:
{
  "tam": "○○億円 - 全市場の説明と根拠",
  "pam": "○○億円 - アプローチ可能市場の説明と根拠", 
  "sam": "○○億円 - 獲得可能市場の説明と根拠",
  "calculation_method": "算出方法の詳細説明"
}`;

    const response = await this.llm.invoke(marketPrompt);
    
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Market size parsing error:', error);
    }

    // フォールバック
    return {
      tam: "データ不足により算出困難",
      pam: "データ不足により算出困難",
      sam: "データ不足により算出困難", 
      calculation_method: "市場データの取得に失敗しました"
    };
  }

  /**
   * 競合分析
   */
  private async analyzeCompetitors(idea: any): Promise<any> {
    const competitorSearchResults = await this.performWebSearch(
      `${idea.title} 競合 競合他社 類似サービス 代替案`
    );

    const competitorPrompt = `以下のビジネスアイデアの競合分析を実施してください。

アイデア: ${idea.title}
説明: ${idea.description}

検索結果:
${competitorSearchResults?.organic?.slice(0, 6).map((r: any) => 
  `- ${r.title}: ${r.snippet}`
).join('\n') || '検索結果なし'}

以下の項目で分析してください:
1. 直接競合（同じソリューションを提供）
2. 間接競合（異なる方法で同じ課題を解決）
3. 競合優位性（三菱地所の強みをどう活かすか）

以下のJSON形式で回答:
{
  "direct_competitors": ["競合1", "競合2", "競合3"],
  "indirect_competitors": ["間接競合1", "間接競合2"],
  "competitive_advantages": "三菱地所が持つ競合優位性の詳細説明"
}`;

    const response = await this.llm.invoke(competitorPrompt);
    
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Competitor analysis parsing error:', error);
    }

    return {
      direct_competitors: ["競合分析データの取得に失敗"],
      indirect_competitors: ["間接競合の特定に失敗"],
      competitive_advantages: "競合優位性の分析に失敗しました"
    };
  }

  /**
   * リスク分析
   */
  private async analyzeRisks(idea: any): Promise<any> {
    const riskPrompt = `以下のビジネスアイデアの包括的なリスク分析を実施してください。

アイデア: ${idea.title}
説明: ${idea.description}
ターゲット: ${idea.target_customer}

以下のリスクカテゴリーで分析してください:
1. 市場リスク（需要変動、市場成長鈍化等）
2. 技術リスク（技術的実現性、技術革新等）
3. 規制リスク（法規制変更、コンプライアンス等）
4. 各リスクの軽減策

各リスクは具体的かつ実用的な内容で記述してください。

以下のJSON形式で回答:
{
  "market_risks": "市場リスクの詳細説明",
  "technical_risks": "技術リスクの詳細説明",
  "regulatory_risks": "規制リスクの詳細説明",
  "mitigation_strategies": "リスク軽減策の具体的な提案"
}`;

    const response = await this.llm.invoke(riskPrompt);
    
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Risk analysis parsing error:', error);
    }

    return {
      market_risks: "市場リスクの分析に失敗",
      technical_risks: "技術リスクの分析に失敗",
      regulatory_risks: "規制リスクの分析に失敗",
      mitigation_strategies: "リスク軽減策の提案に失敗"
    };
  }

  /**
   * 実装ロードマップ作成
   */
  private async createImplementationRoadmap(idea: any): Promise<string> {
    const roadmapPrompt = `以下のビジネスアイデアの実装ロードマップを作成してください。

アイデア: ${idea.title}
説明: ${idea.description}
三菱地所シナジー: ${idea.mitsubishi_synergy}

以下の時間軸で具体的なマイルストーンを設定してください:
- Phase 1 (0-6ヶ月): 企画・検証フェーズ
- Phase 2 (6-18ヶ月): 開発・構築フェーズ  
- Phase 3 (18-36ヶ月): 本格展開フェーズ

各フェーズには以下を含めてください:
- 主要な取り組み内容
- 必要なリソース
- 想定される成果物
- リスクと対策

400文字以上で詳細に記述してください。

ロードマップ:`;

    const response = await this.llm.invoke(roadmapPrompt);
    return response.content as string;
  }
}