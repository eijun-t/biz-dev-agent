/**
 * Critic Agent - ビジネスアイデア評価
 */

import { ChatOpenAI } from '@langchain/openai';
import { 
  BusinessIdea, 
  IdeaEvaluation, 
  EvaluationWeights, 
  EvaluationCriteria,
  ImprovementFeedback 
} from './types';
import { MITSUBISHI_CAPABILITIES } from '../research/utils';

export class CriticAgent {
  private llm: ChatOpenAI;
  private evaluationWeights: EvaluationWeights;
  private evaluationCriteria: EvaluationCriteria;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.evaluationWeights = {
      market_potential: 35,
      strategic_fit: 35,
      competitive_advantage: 15,
      profitability: 15
    };
    this.evaluationCriteria = this.initializeEvaluationCriteria();
  }

  /**
   * ビジネスアイデアを評価
   */
  async evaluateIdeas(ideas: BusinessIdea[]): Promise<IdeaEvaluation[]> {
    console.log(`🎯 Critic Agent: ${ideas.length}個のアイデアを評価中...`);

    const evaluations: IdeaEvaluation[] = [];

    for (const idea of ideas) {
      try {
        const evaluation = await this.evaluateSingleIdea(idea);
        evaluations.push(evaluation);
        console.log(`📊 "${idea.title}": ${evaluation.total_score}点`);
      } catch (error) {
        console.error(`アイデア評価エラー (${idea.title}):`, error);
        // フォールバック評価
        const fallbackEvaluation = this.generateFallbackEvaluation(idea);
        evaluations.push(fallbackEvaluation);
      }
    }

    return evaluations;
  }

  /**
   * 単一のアイデアを評価
   */
  private async evaluateSingleIdea(idea: BusinessIdea): Promise<IdeaEvaluation> {
    const prompt = this.buildEvaluationPrompt(idea);

    const response = await this.llm.invoke(prompt);
    const content = response.content as string;

    // レスポンスをパースして評価結果を抽出
    const evaluation = this.parseEvaluationResponse(content, idea);
    
    return evaluation;
  }

  /**
   * 評価用のプロンプトを構築
   */
  private buildEvaluationPrompt(idea: BusinessIdea): string {
    return `
あなたは事業評価の専門家です。以下のビジネスアイデアを厳格に評価してください。

## 評価対象ビジネスアイデア

**タイトル**: ${idea.title}
**ターゲット市場**: ${idea.target_market}
**課題**: ${idea.problem_statement}
**ソリューション**: ${idea.solution}
**ビジネスモデル**: ${idea.business_model}
**三菱地所シナジー**: ${idea.mitsubishi_synergy}

## 評価基準と配点

### 1. 市場有望性 (35点満点)
- 市場規模と成長性
- 顧客ニーズの明確性
- 市場参入タイミング
- 市場浸透可能性

**評価ガイド:**
- 30-35点: 巨大市場・高成長・明確なニーズ
- 20-29点: 大きな市場・中程度成長・一定のニーズ
- 10-19点: 中規模市場・低成長・限定的ニーズ
- 0-9点: 小さな市場・成長性低・不明確なニーズ

### 2. 戦略適合性 (35点満点)
- 三菱地所ケイパビリティの活用度
- 既存アセットとの相乗効果
- 事業加速の可能性
- 組織・文化との適合性

**評価ガイド:**
- 30-35点: 極めて高い相乗効果・大幅な事業加速
- 20-29点: 高い相乗効果・明確な事業加速
- 10-19点: 中程度の相乗効果・限定的な加速
- 0-9点: 低い相乗効果・加速効果不明

### 3. 競争優位性 (15点満点)
- 差別化要素の強さ
- 参入障壁の高さ
- 競合への対抗力
- 持続可能性

**評価ガイド:**
- 13-15点: 強固な差別化・高い参入障壁
- 10-12点: 一定の差別化・中程度の障壁
- 5-9点: 限定的差別化・低い障壁
- 0-4点: 差別化不足・障壁なし

### 4. 収益性 (15点満点)
- 収益モデルの明確性
- 利益率の高さ
- 収益の持続性
- スケーラビリティ

**評価ガイド:**
- 13-15点: 高収益・高利益率・強いスケーラビリティ
- 10-12点: 安定収益・中程度利益率・一定のスケール性
- 5-9点: 低収益・低利益率・限定的スケール性
- 0-4点: 収益性不明・利益率低・スケール困難

## 三菱地所の主要ケイパビリティ（参考）
${MITSUBISHI_CAPABILITIES.map((cap, i) => `${i + 1}. ${cap.name}: ${cap.description}`).join('\n')}

## 出力形式
以下のJSONフォーマットで評価結果を出力してください：

\`\`\`json
{
  "scores": {
    "market_potential": [0-35の整数],
    "strategic_fit": [0-35の整数],
    "competitive_advantage": [0-15の整数],
    "profitability": [0-15の整数]
  },
  "total_score": [合計点数],
  "feedback": {
    "strengths": ["強み1", "強み2", "強み3"],
    "weaknesses": ["弱み1", "弱み2", "弱み3"],
    "improvement_suggestions": ["改善提案1", "改善提案2", "改善提案3"]
  },
  "recommendation": "proceed|iterate|reject",
  "evaluation_reason": "評価理由と総合判断（200文字以内）"
}
\`\`\`

**重要**: 
- 各項目は配点範囲内で厳格に採点
- 70点以上で"proceed"、50-69点で"iterate"、50点未満で"reject"
- 評価は客観的かつ建設的に
- 改善提案は具体的で実行可能に
`;
  }

  /**
   * 評価レスポンスをパース
   */
  private parseEvaluationResponse(content: string, idea: BusinessIdea): IdeaEvaluation {
    try {
      // JSONブロックを抽出
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSON形式が見つかりません');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      
      // スコアの検証
      const scores = jsonData.scores;
      if (!scores) {
        throw new Error('スコア情報が見つかりません');
      }

      // 合計スコアを計算
      const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + (score || 0), 0);

      // 推奨アクションを決定
      let recommendation: 'proceed' | 'iterate' | 'reject';
      if (totalScore >= 70) {
        recommendation = 'proceed';
      } else if (totalScore >= 50) {
        recommendation = 'iterate';
      } else {
        recommendation = 'reject';
      }

      return {
        idea_id: idea.id,
        scores: {
          market_potential: Math.min(35, Math.max(0, scores.market_potential || 0)),
          strategic_fit: Math.min(35, Math.max(0, scores.strategic_fit || 0)),
          competitive_advantage: Math.min(15, Math.max(0, scores.competitive_advantage || 0)),
          profitability: Math.min(15, Math.max(0, scores.profitability || 0))
        },
        total_score: totalScore,
        feedback: {
          strengths: jsonData.feedback?.strengths || ['評価できませんでした'],
          weaknesses: jsonData.feedback?.weaknesses || ['特定できませんでした'],
          improvement_suggestions: jsonData.feedback?.improvement_suggestions || ['具体的な提案はありません']
        },
        recommendation: recommendation,
        evaluation_reason: jsonData.evaluation_reason || '自動評価により判定',
        evaluated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('評価レスポンスパースエラー:', error);
      return this.generateFallbackEvaluation(idea);
    }
  }

  /**
   * フォールバック評価を生成
   */
  private generateFallbackEvaluation(idea: BusinessIdea): IdeaEvaluation {
    // 基本的な評価を実施
    const marketScore = this.estimateMarketPotential(idea);
    const strategicScore = this.estimateStrategicFit(idea);
    const competitiveScore = Math.floor(Math.random() * 10) + 5; // 5-15
    const profitabilityScore = Math.floor(Math.random() * 10) + 5; // 5-15
    
    const totalScore = marketScore + strategicScore + competitiveScore + profitabilityScore;

    let recommendation: 'proceed' | 'iterate' | 'reject';
    if (totalScore >= 70) {
      recommendation = 'proceed';
    } else if (totalScore >= 50) {
      recommendation = 'iterate';
    } else {
      recommendation = 'reject';
    }

    return {
      idea_id: idea.id,
      scores: {
        market_potential: marketScore,
        strategic_fit: strategicScore,
        competitive_advantage: competitiveScore,
        profitability: profitabilityScore
      },
      total_score: totalScore,
      feedback: {
        strengths: ['アイデアの独創性', '市場ニーズへの対応'],
        weaknesses: ['詳細な分析が必要', '実現可能性の検証が必要'],
        improvement_suggestions: ['市場調査の深化', 'ビジネスモデルの詳細化', '競合分析の実施']
      },
      recommendation: recommendation,
      evaluation_reason: 'システム自動評価により暫定判定',
      evaluated_at: new Date().toISOString()
    };
  }

  /**
   * 市場有望性の簡易推定
   */
  private estimateMarketPotential(idea: BusinessIdea): number {
    let score = 15; // ベーススコア
    
    // キーワードベースの評価
    const marketKeywords = ['大規模', '成長', '拡大', 'グローバル', '急増', '需要'];
    const hasMarketKeywords = marketKeywords.some(keyword => 
      idea.target_market.includes(keyword) || idea.problem_statement.includes(keyword)
    );
    
    if (hasMarketKeywords) score += 10;
    
    // ターゲット市場の具体性
    if (idea.target_market.length > 20) score += 5;
    
    // 課題の明確性
    if (idea.problem_statement.length > 30) score += 5;
    
    return Math.min(35, score);
  }

  /**
   * 戦略適合性の簡易推定
   */
  private estimateStrategicFit(idea: BusinessIdea): number {
    let score = 10; // ベーススコア
    
    // 三菱地所ケイパビリティとの関連性
    const capabilityKeywords = ['不動産', '都市', '開発', 'ビル', '管理', 'テナント', 'ネットワーク', '金融', '投資'];
    const hasSynergy = capabilityKeywords.some(keyword => 
      idea.mitsubishi_synergy.includes(keyword) || idea.business_model.includes(keyword)
    );
    
    if (hasSynergy) score += 15;
    
    // シナジーの具体性
    if (idea.mitsubishi_synergy.length > 30) score += 10;
    
    return Math.min(35, score);
  }

  /**
   * 最適なアイデアを選択
   */
  selectBestIdea(
    ideas: BusinessIdea[], 
    evaluations: IdeaEvaluation[]
  ): { bestIdea: BusinessIdea | null; bestEvaluation: IdeaEvaluation | null } {
    if (ideas.length === 0 || evaluations.length === 0) {
      return { bestIdea: null, bestEvaluation: null };
    }

    // 最高スコアの評価を見つける
    const bestEvaluation = evaluations.reduce((best, current) => 
      current.total_score > best.total_score ? current : best
    );

    // 対応するアイデアを見つける
    const bestIdea = ideas.find(idea => idea.id === bestEvaluation.idea_id) || null;

    return { bestIdea, bestEvaluation };
  }

  /**
   * 反復が必要かどうかを判断
   */
  shouldIterate(
    evaluations: IdeaEvaluation[], 
    currentIteration: number, 
    maxIterations: number
  ): {
    shouldIterate: boolean;
    reason: string;
    feedback?: string;
  } {
    const bestScore = Math.max(...evaluations.map(e => e.total_score));
    const averageScore = evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length;

    // 70点以上のアイデアがある場合は反復不要
    if (bestScore >= 70) {
      return {
        shouldIterate: false,
        reason: `最高スコア${bestScore}点で基準を満たしています`
      };
    }

    // 最大反復数に達した場合は終了
    if (currentIteration >= maxIterations) {
      return {
        shouldIterate: false,
        reason: `最大反復数(${maxIterations})に達しました`
      };
    }

    // 反復が必要
    const improvementAreas = this.identifyImprovementAreas(evaluations);
    const feedback = this.generateIterationFeedback(evaluations, improvementAreas);

    return {
      shouldIterate: true,
      reason: `最高スコア${bestScore}点で基準(70点)に達していません`,
      feedback: feedback
    };
  }

  /**
   * 改善すべき領域を特定
   */
  private identifyImprovementAreas(evaluations: IdeaEvaluation[]): string[] {
    const scoringAreas = ['market_potential', 'strategic_fit', 'competitive_advantage', 'profitability'];
    const areaAverages = scoringAreas.map(area => ({
      area,
      average: evaluations.reduce((sum, evaluation) => sum + evaluation.scores[area as keyof typeof evaluation.scores], 0) / evaluations.length,
      maxPossible: area.includes('market_potential') || area.includes('strategic_fit') ? 35 : 15
    }));

    // 最大スコアに対する達成率が低い領域を特定
    return areaAverages
      .filter(item => (item.average / item.maxPossible) < 0.6)
      .sort((a, b) => (a.average / a.maxPossible) - (b.average / b.maxPossible))
      .slice(0, 2)
      .map(item => item.area);
  }

  /**
   * 反復用のフィードバックを生成
   */
  private generateIterationFeedback(evaluations: IdeaEvaluation[], improvementAreas: string[]): string {
    const commonWeaknesses = evaluations.flatMap(e => e.feedback.weaknesses);
    const commonSuggestions = evaluations.flatMap(e => e.feedback.improvement_suggestions);

    let feedback = '以下の点を改善してより強力なビジネスアイデアを生成してください：\n\n';

    if (improvementAreas.includes('market_potential')) {
      feedback += '**市場有望性の改善:**\n';
      feedback += '- より大きな市場機会に焦点を当てる\n';
      feedback += '- 市場規模と成長性を明確に示す\n';
      feedback += '- 顧客ニーズの緊急性と重要性を強調する\n\n';
    }

    if (improvementAreas.includes('strategic_fit')) {
      feedback += '**戦略適合性の改善:**\n';
      feedback += '- 三菱地所の具体的なケイパビリティとの連携を強化\n';
      feedback += '- 既存アセット（不動産、ネットワーク等）の活用方法を詳細化\n';
      feedback += '- 相乗効果による事業加速の具体例を示す\n\n';
    }

    if (improvementAreas.includes('competitive_advantage')) {
      feedback += '**競争優位性の改善:**\n';
      feedback += '- 独自性と差別化要素を強化\n';
      feedback += '- 参入障壁と競合優位性を明確化\n\n';
    }

    if (improvementAreas.includes('profitability')) {
      feedback += '**収益性の改善:**\n';
      feedback += '- 収益モデルの具体化と収益性向上\n';
      feedback += '- コスト構造と利益率の改善\n\n';
    }

    // 共通の改善提案を追加
    if (commonSuggestions.length > 0) {
      const uniqueSuggestions = [...new Set(commonSuggestions)].slice(0, 3);
      feedback += '**共通改善点:**\n';
      uniqueSuggestions.forEach(suggestion => {
        feedback += `- ${suggestion}\n`;
      });
    }

    return feedback;
  }

  /**
   * 評価基準を初期化
   */
  private initializeEvaluationCriteria(): EvaluationCriteria {
    return {
      market_potential: {
        description: '市場規模、成長性、顧客ニーズの明確性、市場参入タイミング',
        max_score: 35,
        scoring_guide: [
          '30-35点: 巨大市場・高成長・明確なニーズ',
          '20-29点: 大きな市場・中程度成長・一定のニーズ',
          '10-19点: 中規模市場・低成長・限定的ニーズ',
          '0-9点: 小さな市場・成長性低・不明確なニーズ'
        ]
      },
      strategic_fit: {
        description: '三菱地所ケイパビリティの活用度、既存アセットとの相乗効果、事業加速の可能性',
        max_score: 35,
        scoring_guide: [
          '30-35点: 極めて高い相乗効果・大幅な事業加速',
          '20-29点: 高い相乗効果・明確な事業加速',
          '10-19点: 中程度の相乗効果・限定的な加速',
          '0-9点: 低い相乗効果・加速効果不明'
        ]
      },
      competitive_advantage: {
        description: '差別化要素の強さ、参入障壁の高さ、競合への対抗力、持続可能性',
        max_score: 15,
        scoring_guide: [
          '13-15点: 強固な差別化・高い参入障壁',
          '10-12点: 一定の差別化・中程度の障壁',
          '5-9点: 限定的差別化・低い障壁',
          '0-4点: 差別化不足・障壁なし'
        ]
      },
      profitability: {
        description: '収益モデルの明確性、利益率の高さ、収益の持続性、スケーラビリティ',
        max_score: 15,
        scoring_guide: [
          '13-15点: 高収益・高利益率・強いスケーラビリティ',
          '10-12点: 安定収益・中程度利益率・一定のスケール性',
          '5-9点: 低収益・低利益率・限定的スケール性',
          '0-4点: 収益性不明・利益率低・スケール困難'
        ]
      }
    };
  }
}