/**
 * Research Phase Coordinator - プランナーとリサーチャーの統合管理
 */

import { ChatOpenAI } from '@langchain/openai';
import { PlannerAgent } from './planner';
import { ResearcherAgent } from './researcher';
import { 
  ResearchPhaseState, 
  ResearchPlan, 
  ResearchItem, 
  ResearchSummary, 
  ResearchEvaluation,
  ResearchTask,
  ResearchError
} from './types';
import { 
  evaluateResearchSufficiency, 
  estimateProcessingTime 
} from './utils';

export class ResearchCoordinator {
  private planner: PlannerAgent;
  private researcher: ResearcherAgent;
  private llm: ChatOpenAI;
  private parallelLimit: number;
  private maxExecutionTime: number;
  private maxRetries: number;

  constructor(
    llm: ChatOpenAI,
    serperApiKey: string,
    parallelLimit: number = 5,
    maxExecutionTime: number = 600000, // 10分
    maxRetries: number = 3
  ) {
    this.llm = llm;
    this.planner = new PlannerAgent(llm, parallelLimit);
    this.researcher = new ResearcherAgent(llm, serperApiKey, 120000);
    this.parallelLimit = parallelLimit;
    this.maxExecutionTime = maxExecutionTime;
    this.maxRetries = maxRetries;
  }

  /**
   * 研究フェーズを実行
   */
  async executeResearchPhase(
    userInput: string = '',
    sessionId: string
  ): Promise<ResearchPhaseState> {
    const startTime = Date.now();
    console.log(`🚀 研究フェーズ開始: セッション ${sessionId}`);

    try {
      // 1. 研究計画を生成
      const plan = await this.planner.generateResearchPlan(userInput, 25);
      console.log(`📋 研究計画生成完了: ${plan.research_items.length}項目`);

      // 2. 初期状態を作成
      let state: ResearchPhaseState = {
        plan,
        completed_items: [],
        search_results: [],
        summaries: [],
        evaluations: [],
        is_sufficient: false,
        total_processing_time: 0,
        next_action: 'continue_research'
      };

      // 3. 研究を実行
      state = await this.executeResearchIteration(state);

      // 4. 結果を評価
      state = await this.evaluateResearchResults(state);

      // 5. 追加研究が必要かどうか判断
      if (!state.is_sufficient && state.next_action === 'continue_research') {
        console.log('📊 追加研究が必要と判断');
        state = await this.executeAdditionalResearch(state);
      }

      // 6. 最終処理時間を計算
      state.total_processing_time = Date.now() - startTime;
      
      console.log(`✅ 研究フェーズ完了: ${state.summaries.length}件の要約, 処理時間: ${state.total_processing_time}ms`);
      return state;

    } catch (error) {
      console.error('❌ 研究フェーズエラー:', error);
      throw error;
    }
  }

  /**
   * 研究イテレーションを実行
   */
  private async executeResearchIteration(
    state: ResearchPhaseState
  ): Promise<ResearchPhaseState> {
    const remainingItems = state.plan.research_items.filter(
      item => !state.completed_items.includes(item.id)
    );

    if (remainingItems.length === 0) {
      console.log('✅ 全研究項目完了');
      return state;
    }

    console.log(`🔄 研究実行: ${remainingItems.length}項目を並列処理`);

    // 並列処理で研究を実行
    const result = await this.researcher.executeParallelResearch(
      remainingItems,
      this.parallelLimit
    );

    // 結果を状態に追加
    state.search_results.push(...result.searchResults);
    state.summaries.push(...result.summaries);
    state.completed_items.push(...result.summaries.map(s => s.research_item_id));

    // エラーの記録
    if (result.errors.length > 0) {
      console.warn(`⚠️ 研究エラー: ${result.errors.length}件`);
      // エラー項目の再試行は後で実装
    }

    return state;
  }

  /**
   * 研究結果を評価
   */
  private async evaluateResearchResults(
    state: ResearchPhaseState
  ): Promise<ResearchPhaseState> {
    console.log('📊 研究結果を評価中...');

    // 1. 各要約を評価
    const evaluations: ResearchEvaluation[] = [];
    
    for (const summary of state.summaries) {
      const evaluation = await this.evaluateResearchSummary(summary);
      evaluations.push(evaluation);
    }

    state.evaluations = evaluations;

    // 2. 全体的な十分性を評価
    const sufficientSummaries = state.summaries.filter(s => s.business_potential >= 6);
    state.is_sufficient = evaluateResearchSufficiency(sufficientSummaries, 3);

    // 3. 次のアクションを決定
    state.next_action = await this.determineNextAction(state);

    console.log(`📈 評価完了: 十分性=${state.is_sufficient}, 次のアクション=${state.next_action}`);
    return state;
  }

  /**
   * 個別の要約を評価
   */
  private async evaluateResearchSummary(
    summary: ResearchSummary
  ): Promise<ResearchEvaluation> {
    const prompt = `
以下の研究要約を評価してください：

トピック: ${summary.topic}
要約: ${summary.summary}
インサイト: ${summary.key_insights.join(', ')}
ビジネス潜在性: ${summary.business_potential}/10
三菱地所相乗効果: ${summary.mitsubishi_synergy_potential}/10
市場規模: ${summary.market_size_indicator}
技術成熟度: ${summary.technology_maturity}

以下の項目を1-10で評価してください：
1. 情報の十分性（情報量は十分か）
2. 品質スコア（情報の信頼性と詳細度）
3. ビジネス関連性（新事業としての可能性）
4. 三菱地所シナジー（三菱地所のケイパビリティとの相乗効果）

また、追加調査が必要かどうかを判断し、必要な場合は追加キーワードを提案してください。

回答形式：
情報十分性: [1-10]
品質スコア: [1-10]
ビジネス関連性: [1-10]
三菱地所シナジー: [1-10]
追加調査必要: [true/false]
追加キーワード: [キーワード1, キーワード2, ...]
評価理由: [理由]
`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      // レスポンスをパース
      const evaluation = this.parseEvaluationResponse(content, summary.research_item_id);
      return evaluation;
    } catch (error) {
      console.error('評価エラー:', error);
      // フォールバック評価
      return {
        research_item_id: summary.research_item_id,
        information_sufficiency: 5,
        quality_score: 5,
        business_relevance: summary.business_potential,
        mitsubishi_synergy_score: summary.mitsubishi_synergy_potential,
        needs_additional_research: false,
        evaluation_reason: '自動評価（エラーのため）'
      };
    }
  }

  /**
   * 評価レスポンスをパース
   */
  private parseEvaluationResponse(
    content: string,
    researchItemId: string
  ): ResearchEvaluation {
    const parseScore = (pattern: RegExp): number => {
      const match = content.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));
      }
      return 5;
    };

    const informationSufficiency = parseScore(/情報十分性:\s*(\d+)/);
    const qualityScore = parseScore(/品質スコア:\s*(\d+)/);
    const businessRelevance = parseScore(/ビジネス関連性:\s*(\d+)/);
    const mitsubishiSynergy = parseScore(/三菱地所シナジー:\s*(\d+)/);
    
    const needsAdditionalMatch = content.match(/追加調査必要:\s*(true|false)/);
    const needsAdditional = needsAdditionalMatch ? needsAdditionalMatch[1] === 'true' : false;
    
    const keywordsMatch = content.match(/追加キーワード:\s*\[(.*?)\]/);
    const additionalKeywords = keywordsMatch ? 
      keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0) : 
      undefined;
    
    const reasonMatch = content.match(/評価理由:\s*(.*?)$/m);
    const reason = reasonMatch ? reasonMatch[1].trim() : '評価完了';

    return {
      research_item_id: researchItemId,
      information_sufficiency: informationSufficiency,
      quality_score: qualityScore,
      business_relevance: businessRelevance,
      mitsubishi_synergy_score: mitsubishiSynergy,
      needs_additional_research: needsAdditional,
      additional_keywords: additionalKeywords,
      evaluation_reason: reason
    };
  }

  /**
   * 次のアクションを決定
   */
  private async determineNextAction(
    state: ResearchPhaseState
  ): Promise<'continue_research' | 'proceed_to_ideation' | 'need_replanning'> {
    const highQualitySummaries = state.summaries.filter(s => 
      s.business_potential >= 6 && s.mitsubishi_synergy_potential >= 5
    );

    const avgBusinessPotential = state.summaries.reduce((sum, s) => sum + s.business_potential, 0) / state.summaries.length;
    const avgSynergyPotential = state.summaries.reduce((sum, s) => sum + s.mitsubishi_synergy_potential, 0) / state.summaries.length;

    // 高品質な要約が十分にある場合
    if (highQualitySummaries.length >= 5) {
      return 'proceed_to_ideation';
    }

    // 平均スコアが高い場合
    if (avgBusinessPotential >= 6 && avgSynergyPotential >= 5) {
      return 'proceed_to_ideation';
    }

    // 追加研究が必要な項目がある場合
    const needsAdditionalResearch = state.evaluations.some(e => e.needs_additional_research);
    if (needsAdditionalResearch) {
      return 'continue_research';
    }

    // 結果が不十分な場合は再計画
    if (avgBusinessPotential < 4 || avgSynergyPotential < 4) {
      return 'need_replanning';
    }

    return 'proceed_to_ideation';
  }

  /**
   * 追加研究を実行
   */
  private async executeAdditionalResearch(
    state: ResearchPhaseState
  ): Promise<ResearchPhaseState> {
    console.log('🔄 追加研究を実行中...');

    // 追加研究が必要な項目を特定
    const needsAdditional = state.evaluations.filter(e => e.needs_additional_research);
    
    if (needsAdditional.length === 0) {
      return state;
    }

    // 追加研究項目を生成
    const additionalItems: ResearchItem[] = [];
    
    for (const evaluation of needsAdditional) {
      const originalItem = state.plan.research_items.find(i => i.id === evaluation.research_item_id);
      if (originalItem && evaluation.additional_keywords) {
        const additionalItem: ResearchItem = {
          ...originalItem,
          id: `${originalItem.id}_additional_${Date.now()}`,
          keywords: [...originalItem.keywords, ...evaluation.additional_keywords],
          priority: originalItem.priority + 1
        };
        additionalItems.push(additionalItem);
      }
    }

    if (additionalItems.length > 0) {
      // 追加研究を実行
      const result = await this.researcher.executeParallelResearch(
        additionalItems,
        this.parallelLimit
      );

      // 結果を状態に追加
      state.search_results.push(...result.searchResults);
      state.summaries.push(...result.summaries);
      state.completed_items.push(...result.summaries.map(s => s.research_item_id));

      // 再評価
      state = await this.evaluateResearchResults(state);
    }

    return state;
  }

  /**
   * 研究フェーズの健全性チェック
   */
  private async healthCheck(state: ResearchPhaseState): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 処理時間チェック
    if (state.total_processing_time > this.maxExecutionTime) {
      issues.push('処理時間が上限を超過');
      recommendations.push('並列処理の最適化を検討');
    }

    // 成功率チェック
    const successRate = state.summaries.length / state.plan.research_items.length;
    if (successRate < 0.8) {
      issues.push('研究項目の成功率が低い');
      recommendations.push('エラーハンドリングの改善が必要');
    }

    // 品質チェック
    const avgQuality = state.evaluations.reduce((sum, e) => sum + e.quality_score, 0) / state.evaluations.length;
    if (avgQuality < 5) {
      issues.push('研究結果の品質が低い');
      recommendations.push('検索キーワードの見直しが必要');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * 研究フェーズの統計情報を取得
   */
  getPhaseStatistics(state: ResearchPhaseState): {
    totalItems: number;
    completedItems: number;
    successRate: number;
    avgBusinessPotential: number;
    avgSynergyPotential: number;
    processingTime: number;
    topCategories: string[];
  } {
    const totalItems = state.plan.research_items.length;
    const completedItems = state.completed_items.length;
    const successRate = completedItems / totalItems;
    
    const avgBusinessPotential = state.summaries.reduce((sum, s) => sum + s.business_potential, 0) / state.summaries.length;
    const avgSynergyPotential = state.summaries.reduce((sum, s) => sum + s.mitsubishi_synergy_potential, 0) / state.summaries.length;

    // カテゴリ別の集計
    const categoryScores = state.summaries.reduce((acc, s) => {
      if (!acc[s.category]) {
        acc[s.category] = { total: 0, count: 0 };
      }
      acc[s.category].total += s.business_potential + s.mitsubishi_synergy_potential;
      acc[s.category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const topCategories = Object.entries(categoryScores)
      .map(([category, data]) => ({ category, score: data.total / data.count }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.category);

    return {
      totalItems,
      completedItems,
      successRate,
      avgBusinessPotential,
      avgSynergyPotential,
      processingTime: state.total_processing_time,
      topCategories
    };
  }
}