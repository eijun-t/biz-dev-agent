/**
 * Ideator Agent - ビジネスアイデア生成
 */

import { ChatOpenAI } from '@langchain/openai';
import { 
  BusinessIdea, 
  IdeationContext, 
  ImprovementFeedback 
} from './types';
import { ResearchSummary } from '../research/types';
import { MITSUBISHI_CAPABILITIES } from '../research/utils';

export class IdeatorAgent {
  private llm: ChatOpenAI;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
  }

  /**
   * 研究結果からビジネスアイデアを生成
   */
  async generateIdeas(
    researchSummaries: ResearchSummary[],
    userRequirements?: string,
    previousFeedback?: string,
    iterationCount: number = 0
  ): Promise<BusinessIdea[]> {
    console.log(`💡 Ideator Agent: ビジネスアイデア生成開始 (反復: ${iterationCount + 1})`);

    // 研究結果からコンテキストを抽出
    const context = this.extractIdeationContext(researchSummaries, userRequirements, previousFeedback);

    // AIプロンプトを構築
    const prompt = this.buildIdeationPrompt(context, iterationCount, previousFeedback);

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      // レスポンスをパースしてビジネスアイデアを抽出
      const ideas = this.parseIdeationResponse(content, researchSummaries, iterationCount);
      
      console.log(`✅ ${ideas.length}個のビジネスアイデアを生成`);
      return ideas;
    } catch (error) {
      console.error('アイデア生成エラー:', error);
      // フォールバック：基本的なアイデアを生成
      return this.generateFallbackIdeas(researchSummaries, iterationCount);
    }
  }

  /**
   * 研究結果からアイディエーションコンテキストを抽出
   */
  private extractIdeationContext(
    researchSummaries: ResearchSummary[],
    userRequirements?: string,
    previousFeedback?: string
  ): IdeationContext {
    // 研究インサイトを抽出
    const researchInsights = researchSummaries.flatMap(summary => summary.key_insights);
    
    // 市場機会を抽出
    const marketOpportunities = researchSummaries
      .filter(s => s.business_potential >= 6)
      .map(s => `${s.topic}: ${s.summary}`);

    // 技術トレンドを抽出
    const technologyTrends = researchSummaries
      .filter(s => s.category === 'technology_developments')
      .map(s => s.summary);

    // 三菱地所の強みを整理
    const mitsubishiStrengths = MITSUBISHI_CAPABILITIES.map(cap => 
      `${cap.name}: ${cap.description}`
    );

    return {
      research_insights: researchInsights,
      market_opportunities: marketOpportunities,
      technology_trends: technologyTrends,
      mitsubishi_strengths: mitsubishiStrengths,
      user_requirements: userRequirements,
      previous_feedback: previousFeedback
    };
  }

  /**
   * アイディエーション用のプロンプトを構築
   */
  private buildIdeationPrompt(
    context: IdeationContext,
    iterationCount: number,
    previousFeedback?: string
  ): string {
    const iterationNote = iterationCount > 0 && previousFeedback ? 
      `\n前回のフィードバック:\n${previousFeedback}\n上記フィードバックを反映して改善してください。\n` : '';

    return `
あなたは新事業開発の専門家です。以下の調査結果と三菱地所の強みを基に、3つの革新的なビジネスアイデアを生成してください。

## 調査結果サマリー

### 市場機会
${context.market_opportunities.slice(0, 10).map((opp, i) => `${i + 1}. ${opp}`).join('\n')}

### 重要なインサイト
${context.research_insights.slice(0, 15).map((insight, i) => `- ${insight}`).join('\n')}

### 技術トレンド
${context.technology_trends.slice(0, 8).map((trend, i) => `- ${trend}`).join('\n')}

## 三菱地所の主要ケイパビリティ
${context.mitsubishi_strengths.map((strength, i) => `${i + 1}. ${strength}`).join('\n')}

${context.user_requirements ? `\n## ユーザー要件\n${context.user_requirements}\n` : ''}

${iterationNote}

## 重要な指針
1. **戦略適合性**: 三菱地所のケイパビリティを活用してアクセラレートできる事業
2. **市場有望性**: 大きな市場ポテンシャルと成長性がある領域
3. **競争優位性**: 差別化要素と競合優位性を持つ
4. **収益性**: 明確な収益モデルと利益創出の仕組み
5. **実現可能性**: 技術的・法的に実現可能

## 出力形式
以下のJSONフォーマットで厳密に3つのアイデアを出力してください：

\`\`\`json
{
  "ideas": [
    {
      "title": "魅力的なビジネス名（20文字以内）",
      "target_market": "具体的なターゲット市場と顧客層",
      "problem_statement": "解決する課題・ペインポイント",
      "solution": "提供するソリューション・価値",
      "business_model": "収益モデルと事業構造",
      "mitsubishi_synergy": "三菱地所ケイパビリティとの具体的な相乗効果"
    },
    {
      "title": "...",
      "target_market": "...",
      "problem_statement": "...",
      "solution": "...",
      "business_model": "...",
      "mitsubishi_synergy": "..."
    },
    {
      "title": "...",
      "target_market": "...",
      "problem_statement": "...",
      "solution": "...",
      "business_model": "...",
      "mitsubishi_synergy": "..."
    }
  ]
}
\`\`\`

各アイデアは独創性と実現可能性のバランスを重視し、三菱地所の既存事業とは異なる新しい価値創造を目指してください。
`;
  }

  /**
   * AIレスポンスをパースしてビジネスアイデアを抽出
   */
  private parseIdeationResponse(
    content: string,
    researchSummaries: ResearchSummary[],
    iterationCount: number
  ): BusinessIdea[] {
    try {
      // JSONブロックを抽出
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSON形式が見つかりません');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      
      if (!jsonData.ideas || !Array.isArray(jsonData.ideas)) {
        throw new Error('ideas配列が見つかりません');
      }

      const sourceResearchIds = researchSummaries.map(s => s.id);
      const timestamp = new Date().toISOString();

      return jsonData.ideas.slice(0, 3).map((ideaData: any, index: number) => ({
        id: `idea_${Date.now()}_${index}`,
        title: ideaData.title || `ビジネスアイデア ${index + 1}`,
        target_market: ideaData.target_market || '未定義',
        problem_statement: ideaData.problem_statement || '未定義',
        solution: ideaData.solution || '未定義',
        business_model: ideaData.business_model || '未定義',
        mitsubishi_synergy: ideaData.mitsubishi_synergy || '未定義',
        generated_at: timestamp,
        iteration_count: iterationCount,
        source_research_ids: sourceResearchIds
      }));
    } catch (error) {
      console.error('レスポンスパースエラー:', error);
      // パースに失敗した場合はフォールバックを使用
      return this.generateFallbackIdeas(researchSummaries, iterationCount);
    }
  }

  /**
   * フォールバック用のビジネスアイデア生成
   */
  private generateFallbackIdeas(
    researchSummaries: ResearchSummary[],
    iterationCount: number
  ): BusinessIdea[] {
    const timestamp = new Date().toISOString();
    const sourceResearchIds = researchSummaries.map(s => s.id);

    // 研究結果から基本的なアイデアを抽出
    const topResearch = researchSummaries
      .filter(s => s.business_potential >= 6)
      .sort((a, b) => b.business_potential - a.business_potential)
      .slice(0, 3);

    return topResearch.map((research, index) => ({
      id: `fallback_idea_${Date.now()}_${index}`,
      title: `${research.topic}活用事業`,
      target_market: '一般消費者・企業',
      problem_statement: research.summary,
      solution: `${research.topic}を活用したソリューション提供`,
      business_model: 'サービス提供・プラットフォーム運営',
      mitsubishi_synergy: '不動産・都市開発ノウハウとの組み合わせ',
      generated_at: timestamp,
      iteration_count: iterationCount,
      source_research_ids: sourceResearchIds
    }));
  }

  /**
   * アイデア改善のためのフィードバックを生成
   */
  generateImprovementFeedback(
    ideas: BusinessIdea[],
    evaluations: any[],
    targetScore: number = 70
  ): ImprovementFeedback {
    const averageScore = evaluations.reduce((sum, evaluation) => sum + evaluation.total_score, 0) / evaluations.length;
    const scoreGap = targetScore - averageScore;

    // 最も低いスコア項目を特定
    const scoringAreas = ['market_potential', 'strategic_fit', 'competitive_advantage', 'profitability'];
    const areaScores = scoringAreas.map(area => ({
      area,
      averageScore: evaluations.reduce((sum, evaluation) => sum + evaluation.scores[area], 0) / evaluations.length
    }));

    const lowestAreas = areaScores
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 2)
      .map(item => item.area);

    // 改善提案を生成
    const suggestions = [];
    if (lowestAreas.includes('market_potential')) {
      suggestions.push('より大きな市場機会に焦点を当てる');
      suggestions.push('市場規模と成長性を明確に示す');
    }
    if (lowestAreas.includes('strategic_fit')) {
      suggestions.push('三菱地所の具体的なケイパビリティとの連携を強化');
      suggestions.push('既存アセットの活用方法を詳細化');
    }
    if (lowestAreas.includes('competitive_advantage')) {
      suggestions.push('独自性と差別化要素を強化');
      suggestions.push('参入障壁と競合優位性を明確化');
    }
    if (lowestAreas.includes('profitability')) {
      suggestions.push('収益モデルの具体化と収益性向上');
      suggestions.push('コスト構造と利益率の改善');
    }

    return {
      target_score_gap: scoreGap,
      priority_areas: lowestAreas,
      specific_suggestions: suggestions,
      market_focus_recommendations: [
        '成長市場への注力',
        '明確な顧客ニーズの特定',
        '市場浸透戦略の具体化'
      ]
    };
  }

  /**
   * アイデアの基本的な品質検証
   */
  validateIdeas(ideas: BusinessIdea[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (ideas.length !== 3) {
      issues.push(`アイデア数が不正: ${ideas.length}個（期待値: 3個）`);
    }

    ideas.forEach((idea, index) => {
      if (!idea.title || idea.title.length < 5) {
        issues.push(`アイデア${index + 1}: タイトルが不適切`);
      }
      if (!idea.target_market || idea.target_market === '未定義') {
        issues.push(`アイデア${index + 1}: ターゲット市場が未定義`);
      }
      if (!idea.solution || idea.solution === '未定義') {
        issues.push(`アイデア${index + 1}: ソリューションが未定義`);
      }
      if (!idea.mitsubishi_synergy || idea.mitsubishi_synergy === '未定義') {
        issues.push(`アイデア${index + 1}: 三菱地所シナジーが未定義`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}