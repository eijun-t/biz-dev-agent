import { ChatOpenAI } from "@langchain/openai";
import { createChatOpenAI } from '@/lib/config/llm-config';
import { AgentState, AgentExecutionResult } from "./types";

export class CriticAgent {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = createChatOpenAI('critic');
  }

  /**
   * アイデア評価・選択を実行
   */
  async executeEvaluation(state: AgentState): Promise<AgentExecutionResult> {
    const ideation = state.ideation;
    const research = state.initial_research;
    const startTime = Date.now();
    let tokensUsed = 0;
    
    if (!ideation || !ideation.generated_ideas || ideation.generated_ideas.length === 0) {
      return {
        success: false,
        updated_state: state,
        next_action: 'fail',
        quality_score: 0,
        tokens_used: 0,
        error: 'アイディエーションデータが不足しています'
      };
    }

    try {
      // 各アイデアの詳細評価
      const evaluatedIdeas = await this.evaluateEachIdea(ideation.generated_ideas, research);
      tokensUsed += 800;

      // 最適なアイデアの選択
      const selectionResult = await this.selectBestIdea(evaluatedIdeas, research);
      tokensUsed += 500;

      // 選択の品質評価
      const qualityPrompt = `選択されたビジネスアイデアの品質を1-10で評価してください。

選択されたアイデア:
タイトル: ${selectionResult.selected_idea.title}
説明: ${selectionResult.selected_idea.description}
選択理由: ${selectionResult.reasoning}

評価基準:
- アイデアの市場性とスケーラビリティ
- 三菱地所の強みとの適合性
- 実現可能性
- 社会課題解決への貢献度
- 選択理由の論理性

品質スコア（1-10）:`;

      const qualityResponse = await this.llm.invoke(qualityPrompt);
      const qualityScore = parseInt(qualityResponse.content.toString().match(/\d+/)?.[0] || "5");
      tokensUsed += 200;

      const updatedState: AgentState = {
        ...state,
        evaluation: {
          selected_idea: {
            title: selectionResult.selected_idea.title,
            description: selectionResult.selected_idea.description,
            target_customer: selectionResult.selected_idea.target_customer,
            value_proposition: selectionResult.selected_idea.value_proposition,
            mitsubishi_synergy: selectionResult.selected_idea.mitsubishi_synergy,
            selection_reasoning: selectionResult.reasoning
          },
          quality_score: qualityScore
        },
        tokens_used: state.tokens_used + tokensUsed,
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'critic',
            action: 'evaluation_completed',
            details: {
              selected_idea: selectionResult.selected_idea.title,
              quality_score: qualityScore,
              evaluation_scores: selectionResult.scores,
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
      console.error('Evaluation error:', error);
      
      const updatedState: AgentState = {
        ...state,
        errors: [...state.errors, `評価エラー: ${error}`],
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            agent: 'critic',
            action: 'evaluation_failed',
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
   * 各アイデアを詳細評価
   */
  private async evaluateEachIdea(ideas: any[], research: any): Promise<any[]> {
    const evaluationPrompt = `以下のビジネスアイデアを多角的に評価してください。

アイデア一覧:
${ideas.map((idea, index) => `
${index + 1}. ${idea.title}
   説明: ${idea.description}
   ターゲット: ${idea.target_customer}
   価値提案: ${idea.value_proposition}
   三菱地所シナジー: ${idea.mitsubishi_synergy}
`).join('\n')}

市場調査結果:
- 業界トレンド: ${research?.industry_trends?.substring(0, 200)}...
- 市場ギャップ: ${research?.market_gaps?.substring(0, 200)}...

各アイデアを以下の項目で1-10点で評価してください:
1. 市場性（市場規模と成長性）
2. 実現可能性（技術的・資源的制約）
3. 三菱地所適合性（既存事業との相乗効果）
4. 革新性（独自性と差別化要因）
5. 社会的価値（社会課題解決への貢献）

以下のJSON形式で回答してください:
{
  "evaluations": [
    {
      "idea_index": 0,
      "title": "アイデアタイトル",
      "scores": {
        "market_potential": 8,
        "feasibility": 7,
        "mitsubishi_fit": 9,
        "innovation": 6,
        "social_value": 8
      },
      "total_score": 38,
      "strengths": ["強み1", "強み2"],
      "weaknesses": ["弱み1", "弱み2"],
      "comments": "総合コメント"
    }
  ]
}`;

    const response = await this.llm.invoke(evaluationPrompt);
    
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.evaluations || [];
      }
    } catch (error) {
      console.error('Evaluation parsing error:', error);
    }

    // フォールバック: 簡単な評価
    return ideas.map((idea, index) => ({
      idea_index: index,
      title: idea.title,
      scores: {
        market_potential: 7,
        feasibility: 7,
        mitsubishi_fit: 7,
        innovation: 7,
        social_value: 7
      },
      total_score: 35,
      strengths: ["評価データの生成に失敗"],
      weaknesses: ["詳細評価が困難"],
      comments: "評価処理でエラーが発生しました"
    }));
  }

  /**
   * 最適なアイデアを選択
   */
  private async selectBestIdea(evaluatedIdeas: any[], research: any): Promise<any> {
    // 最高スコアのアイデアを特定
    const bestIdea = evaluatedIdeas.reduce((best, current) => 
      current.total_score > best.total_score ? current : best
    );

    const selectionPrompt = `以下の評価結果を基に、最適なビジネスアイデアの選択理由を詳しく説明してください。

選択されたアイデア:
${JSON.stringify(bestIdea, null, 2)}

他の候補アイデア:
${evaluatedIdeas.filter(idea => idea.idea_index !== bestIdea.idea_index)
  .map(idea => `- ${idea.title} (スコア: ${idea.total_score})`).join('\n')}

市場環境:
- 業界トレンド: ${research?.industry_trends?.substring(0, 150)}...
- 市場ギャップ: ${research?.market_gaps?.substring(0, 150)}...

以下の観点から選択理由を300文字以上で詳しく説明してください:
1. なぜこのアイデアが最も有望なのか
2. 市場環境との適合性
3. 三菱地所の強みをどう活かせるか
4. 期待される事業インパクト
5. 実現に向けた課題と対策

選択理由:`;

    const reasoningResponse = await this.llm.invoke(selectionPrompt);
    
    // 元のアイデアデータを取得
    const originalIdea = {
      title: bestIdea.title,
      description: evaluatedIdeas[bestIdea.idea_index]?.description || "説明なし",
      target_customer: evaluatedIdeas[bestIdea.idea_index]?.target_customer || "顧客不明",
      value_proposition: evaluatedIdeas[bestIdea.idea_index]?.value_proposition || "価値提案不明",
      mitsubishi_synergy: evaluatedIdeas[bestIdea.idea_index]?.mitsubishi_synergy || "シナジー不明"
    };

    return {
      selected_idea: originalIdea,
      reasoning: reasoningResponse.content as string,
      scores: bestIdea.scores,
      total_score: bestIdea.total_score
    };
  }
}