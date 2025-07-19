import { ChatOpenAI } from "@langchain/openai";
import { AgentState, AgentExecutionResult } from "./types";
import axios from "axios";

export class ResearcherAgent {
  private llm: ChatOpenAI;
  private serperApiKey: string;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: process.env.LLM_MODEL_DEFAULT || "gpt-4o",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
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
   * 検索結果を要約・分析
   */
  async analyzeSearchResults(searchResults: any, analysisType: string): Promise<string> {
    if (!searchResults || !searchResults.organic) {
      return "検索結果を取得できませんでした。";
    }

    const results = searchResults.organic.slice(0, 8);
    const resultsText = results.map((r: any) => 
      `タイトル: ${r.title}\n概要: ${r.snippet}\nURL: ${r.link}`
    ).join('\n\n');

    const prompt = `以下の検索結果を分析し、${analysisType}について詳細にまとめてください。

検索結果:
${resultsText}

要求事項:
- 最新の情報とトレンドを重視
- 具体的な数値やデータがあれば含める
- 信頼性の高い情報源を優先
- 三菱地所のような不動産デベロッパーが参入可能な領域を意識
- 400文字以上で詳細に記述

分析結果:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  /**
   * 初期調査を実行
   */
  async executeInitialResearch(state: AgentState): Promise<AgentExecutionResult> {
    const topic = state.topic;
    const startTime = Date.now();
    let tokensUsed = 0;
    
    try {
      // 1. 業界トレンドの調査
      const industrySearchResults = await this.performWebSearch(
        `${topic} 業界 トレンド 2024 2025 市場動向 日本`
      );
      const industryTrends = await this.analyzeSearchResults(
        industrySearchResults,
        "業界トレンドと市場動向"
      );
      tokensUsed += 500; // 概算

      // 2. 市場ギャップの調査
      const gapSearchResults = await this.performWebSearch(
        `${topic} 市場 課題 問題点 ニーズ 未解決`
      );
      const marketGaps = await this.analyzeSearchResults(
        gapSearchResults,
        "市場ギャップと未解決の課題"
      );
      tokensUsed += 500;

      // 3. 技術トレンドの調査
      const techSearchResults = await this.performWebSearch(
        `${topic} 技術 イノベーション AI DX デジタル変革`
      );
      const technologyTrends = await this.analyzeSearchResults(
        techSearchResults,
        "技術トレンドとイノベーション"
      );
      tokensUsed += 500;

      // 4. 規制環境の調査
      const regulatorySearchResults = await this.performWebSearch(
        `${topic} 規制 法律 政策 政府 制度変更`
      );
      const regulatoryEnvironment = await this.analyzeSearchResults(
        regulatorySearchResults,
        "規制環境と政策動向"
      );
      tokensUsed += 500;

      // 5. 品質評価
      const qualityPrompt = `以下の初期調査結果の品質を1-10で評価してください。

業界トレンド: ${industryTrends}
市場ギャップ: ${marketGaps}
技術トレンド: ${technologyTrends}
規制環境: ${regulatoryEnvironment}

評価基準:
- 情報の具体性と詳細度
- データの信頼性
- 分析の深度
- ビジネス機会の明確さ
- 三菱地所との関連性

品質スコア（1-10）:`;

      const qualityResponse = await this.llm.invoke(qualityPrompt);
      const qualityScore = parseInt(qualityResponse.content.toString().match(/\d+/)?.[0] || "5");
      tokensUsed += 200;

      // 情報源の収集
      const sources = [
        industrySearchResults?.organic?.[0]?.link,
        gapSearchResults?.organic?.[0]?.link,
        techSearchResults?.organic?.[0]?.link,
        regulatorySearchResults?.organic?.[0]?.link
      ].filter(Boolean);

      const updatedState: AgentState = {
        ...state,
        initial_research: {
          industry_trends: industryTrends,
          market_gaps: marketGaps,
          technology_trends: technologyTrends,
          regulatory_environment: regulatoryEnvironment,
          sources: sources,
          quality_score: qualityScore
        },
        tokens_used: state.tokens_used + tokensUsed,
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'researcher',
            action: 'initial_research_completed',
            details: {
              quality_score: qualityScore,
              sources_count: sources.length,
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
      console.error('Initial research error:', error);
      
      const updatedState: AgentState = {
        ...state,
        errors: [...state.errors, `初期調査エラー: ${error}`],
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'researcher',
            action: 'initial_research_failed',
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
}