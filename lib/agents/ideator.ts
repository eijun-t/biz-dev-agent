import { ChatOpenAI } from "@langchain/openai";
import { createChatOpenAI } from '@/lib/config/llm-config';
import { AgentState, AgentExecutionResult } from "./types";

export class IdeatorAgent {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = createChatOpenAI('ideator');
  }

  /**
   * アイディエーションを実行
   */
  async executeIdeation(state: AgentState): Promise<AgentExecutionResult> {
    const topic = state.topic;
    const research = state.initial_research;
    const startTime = Date.now();
    let tokensUsed = 0;
    
    if (!research) {
      return {
        success: false,
        updated_state: state,
        next_action: 'fail',
        quality_score: 0,
        tokens_used: 0,
        error: '初期調査データが不足しています'
      };
    }

    try {
      // 三菱地所のケイパビリティ情報
      const mitsubishiCapabilities = `
三菱地所の主要ケイパビリティ:
- 大規模不動産開発（丸の内、みなとみらい等）
- 商業施設運営（丸の内OAZO、東京ビルディング等）
- 住宅事業（ザ・パークハウス等）
- ホテル事業（ロイヤルパークホテル等）
- 国際事業（海外不動産開発）
- 投資・ファンド事業
- スタートアップ支援・CVC
- DXプラットフォーム事業
- ESG・サステナビリティ推進
- 地域創生・まちづくり
`;

      const ideationPrompt = `あなたは三菱地所の新事業開発担当者です。以下の調査結果を基に、「${topic}」領域で三菱地所が展開可能な革新的なビジネスアイデアを5つ生成してください。

## 調査結果
### 業界トレンド
${research.industry_trends}

### 市場ギャップ
${research.market_gaps}

### 技術トレンド
${research.technology_trends}

### 規制環境
${research.regulatory_environment}

## 三菱地所のケイパビリティ
${mitsubishiCapabilities}

## 要求事項
各アイデアは以下の要素を含む必要があります：
- アイデアタイトル（キャッチーで分かりやすい）
- 詳細な説明（200文字以上）
- 想定ターゲット顧客（具体的なペルソナ）
- 価値提案（顧客が得られる価値）
- 三菱地所との相乗効果（既存事業との連携方法）

## 評価基準
- 市場性とスケーラビリティ
- 三菱地所の強みを活かせるか
- 社会課題解決への貢献度
- 実現可能性
- 革新性

以下のJSON形式で回答してください：
{
  "ideas": [
    {
      "title": "アイデアタイトル",
      "description": "詳細な説明",
      "target_customer": "想定ターゲット顧客",
      "value_proposition": "価値提案",
      "mitsubishi_synergy": "三菱地所との相乗効果"
    }
  ]
}`;

      const ideationResponse = await this.llm.invoke(ideationPrompt);
      tokensUsed += 1000; // 概算

      // JSONレスポンスのパース
      let generatedIdeas: any[] = [];
      try {
        const responseContent = ideationResponse.content as string;
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          generatedIdeas = parsed.ideas || [];
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        // フォールバック: テキストから手動でアイデアを抽出
        generatedIdeas = await this.extractIdeasFromText(ideationResponse.content as string);
      }

      // 品質評価
      const qualityPrompt = `以下のアイデアの品質を1-10で評価してください。

生成されたアイデア数: ${generatedIdeas.length}
アイデア概要:
${generatedIdeas.map((idea, index) => `${index + 1}. ${idea.title}: ${idea.description?.substring(0, 100)}...`).join('\n')}

評価基準:
- アイデアの革新性と独創性
- 市場性とビジネス性
- 三菱地所の強みとの適合性
- 実現可能性
- 社会的価値

品質スコア（1-10）:`;

      const qualityResponse = await this.llm.invoke(qualityPrompt);
      const qualityScore = parseInt(qualityResponse.content.toString().match(/\d+/)?.[0] || "5");
      tokensUsed += 200;

      const updatedState: AgentState = {
        ...state,
        ideation: {
          generated_ideas: generatedIdeas,
          quality_score: qualityScore
        },
        tokens_used: state.tokens_used + tokensUsed,
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'ideator',
            action: 'ideation_completed',
            details: {
              ideas_count: generatedIdeas.length,
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
      console.error('Ideation error:', error);
      
      const updatedState: AgentState = {
        ...state,
        errors: [...state.errors, `アイディエーションエラー: ${error}`],
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'ideator',
            action: 'ideation_failed',
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
   * テキストからアイデアを抽出（JSONパース失敗時のフォールバック）
   */
  private async extractIdeasFromText(text: string): Promise<any[]> {
    const extractPrompt = `以下のテキストからビジネスアイデアを抽出し、JSON形式で整理してください。

テキスト:
${text}

以下の形式で回答してください：
{
  "ideas": [
    {
      "title": "アイデアタイトル",
      "description": "詳細な説明",
      "target_customer": "想定ターゲット顧客",
      "value_proposition": "価値提案",
      "mitsubishi_synergy": "三菱地所との相乗効果"
    }
  ]
}`;

    try {
      const response = await this.llm.invoke(extractPrompt);
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.ideas || [];
      }
    } catch (error) {
      console.error('Fallback extraction error:', error);
    }

    // 最終フォールバック
    return [{
      title: "アイデア生成に失敗",
      description: "テキストからアイデアを抽出できませんでした",
      target_customer: "不明",
      value_proposition: "不明",
      mitsubishi_synergy: "不明"
    }];
  }
}