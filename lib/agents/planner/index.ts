/**
 * Advanced Planner Agent - Main Export
 * 詳細調査計画策定エージェントのメインエクスポート
 */

// メインクラス
import { AdvancedPlannerAgent } from './advanced-planner';
export { AdvancedPlannerAgent };

// 型定義
export type {
  BusinessIdea,
  ResearchCategory,
  ResearchPriority,
  ResearchDifficulty,
  ResearchMethod,
  ResearchItem,
  ResearchPlan,
  ResearchMilestone,
  ContingencyPlan,
  ResourceRequirement,
  QualityGate,
  PlanAdjustment,
  PlanAdjustmentTrigger,
  PlanChange,
  PlannerInput,
  PlannerOutput,
  PlannerConfig,
  PlannerState,
  ExecutionFeedback,
  PlannerPerformanceMetrics,
  PlanningError,
  ValidationError,
  ResourceError
} from './types';

// 設定とコンフィグ
export {
  DEFAULT_PLANNER_CONFIG,
  RESEARCH_CATEGORY_CONFIG,
  RESEARCH_ITEM_TEMPLATES,
  PRIORITY_WEIGHTS,
  DATA_SOURCE_CONFIG,
  QUALITY_CRITERIA,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from './config';

// ファクトリー関数
export const createAdvancedPlanner = (config: any = {}) => {
  return new AdvancedPlannerAgent(config);
};

// 使用例とヘルパー関数
export class PlannerIntegration {
  private planner: AdvancedPlannerAgent;

  constructor(config: any = {}) {
    this.planner = new AdvancedPlannerAgent(config);
  }

  /**
   * Enhanced Critic Agentの出力からPlanner用入力を生成
   */
  static fromCriticOutput(criticOutput: any, context: any): any {
    const bestIdea = criticOutput.selectedIdea || criticOutput.businessIdeas?.[0];
    
    if (!bestIdea) {
      throw new Error('No business idea found in critic output');
    }

    // Enhanced Critic の出力形式を Advanced Planner が期待する形式に正規化
    const normalizedIdea = {
      id: bestIdea.idea_id || bestIdea.id || 'unknown-id',
      title: bestIdea.idea_title || bestIdea.title || 'Unknown Business Idea',
      description: bestIdea.idea_description || bestIdea.description || bestIdea.idea_title || 'No description available',
      shortDescription: bestIdea.short_description || bestIdea.shortDescription || bestIdea.idea_title || 'No description available',
      targetMarket: bestIdea.target_market || bestIdea.targetMarket || 'enterprise',
      revenueModel: bestIdea.revenue_model || bestIdea.revenueModel || 'subscription',
      businessModel: {
        type: bestIdea.business_model?.type || bestIdea.businessModel?.type || 'platform',
        description: bestIdea.business_model?.description || bestIdea.businessModel?.description || 'Digital platform business model',
        keyComponents: bestIdea.business_model?.key_components || bestIdea.businessModel?.keyComponents || ['technology', 'service', 'operations']
      },
      valueProposition: bestIdea.value_proposition || bestIdea.valueProposition || 'AI-driven value creation',
      competitiveAdvantage: bestIdea.competitive_advantage || bestIdea.competitiveAdvantage || 'Technology and expertise',
      riskLevel: bestIdea.risk_level || bestIdea.riskLevel || 'balanced',
      businessScale: bestIdea.business_scale || bestIdea.businessScale || 'enterprise',
      confidence: bestIdea.confidence || 'medium',
      estimatedROI: bestIdea.estimated_roi || bestIdea.estimatedROI || 200,
      estimatedProfitJPY: bestIdea.estimated_profit_jpy || bestIdea.estimatedProfitJPY || 10000000000,
      timeToMarket: bestIdea.time_to_market || bestIdea.timeToMarket || '18ヶ月',
      initialInvestment: bestIdea.initial_investment || bestIdea.initialInvestment || 100000000,
      marketSize: bestIdea.market_size || bestIdea.marketSize || 25000000000,
      mitsubishiSynergy: bestIdea.mitsubishi_synergy || bestIdea.mitsubishiSynergy || {
        overallFit: 7.5,
        capability: [],
        businessPortfolio: [],
        networkAssets: []
      }
    };

    return {
      businessIdea: normalizedIdea,
      context: {
        researcherCapabilities: context.researcherCapabilities || [
          'web_search',
          'database_query',
          'api_call',
          'analysis'
        ],
        availableDataSources: context.availableDataSources || [
          'Google Search',
          'Market Database',
          'Patent Database',
          'Industry Reports',
          'Academic Sources'
        ],
        constraints: {
          maxTimeWeeks: context.maxTimeWeeks || 8,
          maxBudget: context.maxBudget || 2000000,
          restrictedSources: context.restrictedSources || [],
          complianceRequirements: context.complianceRequirements || []
        },
        stakeholderRequirements: context.stakeholderRequirements || [
          '市場規模の明確化',
          '競合優位性の検証',
          '実装可能性の評価'
        ]
      },
      preferences: {
        prioritizeSpeed: context.prioritizeSpeed || false,
        prioritizeDepth: context.prioritizeDepth || true,
        prioritizeCost: context.prioritizeCost || false,
        riskTolerance: context.riskTolerance || 'medium',
        innovationFocus: bestIdea.riskLevel === 'disruptive'
      }
    };
  }

  /**
   * Task 22 Researcher Agent用の調査指示を生成
   */
  static toResearcherInstructions(plannerOutput: any): any {
    const plan = plannerOutput.researchPlan;
    
    const instructions = {
      planId: plan.id,
      businessIdeaTitle: plan.businessIdeaTitle,
      researchCategories: Object.keys(plan.categories),
      prioritizedItems: plan.executionOrder.slice(0, 5), // First 5 items
      criticalPath: plan.criticalPath,
      constraints: {
        totalTimeLimit: plan.totalEstimatedTime,
        totalBudgetLimit: plan.totalEstimatedCost
      },
      qualityRequirements: plannerOutput.qualityMetrics,
      nextSteps: plannerOutput.nextSteps,
      contingencyPlans: plan.contingencyPlans
    };

    return instructions;
  }

  /**
   * 計画の実行と進捗管理
   */
  async executePlan(plannerOutput: any): Promise<any> {
    const researchInstructions = PlannerIntegration.toResearcherInstructions(plannerOutput);
    
    // Task 22 Researcher Agentへの指示として返す
    return {
      instructions: researchInstructions,
      planId: researchInstructions.planId,
      status: 'ready_for_execution',
      message: 'Research plan generated successfully. Ready for Task 22 Researcher Agent execution.'
    };
  }

  /**
   * 計画の動的調整
   */
  async adjustPlan(planId: string, newInformation: any, trigger: string): Promise<any> {
    const adjustmentTrigger = {
      type: 'new_information' as const,
      source: trigger,
      description: `New information requires plan adjustment: ${JSON.stringify(newInformation)}`,
      severity: 'medium' as const
    };

    return await this.planner.adjustPlan(planId, adjustmentTrigger, newInformation);
  }

  /**
   * フィードバックの取り込み
   */
  async incorporateFeedback(planId: string, itemId: string, feedback: any): Promise<void> {
    const executionFeedback = {
      planId,
      itemId,
      feedback: {
        actualTime: feedback.actualTime || 0,
        actualCost: feedback.actualCost || 0,
        qualityRating: feedback.qualityRating || 5,
        completionRate: feedback.completionRate || 0,
        challenges: feedback.challenges || [],
        insights: feedback.insights || [],
        recommendations: feedback.recommendations || []
      },
      timestamp: new Date().toISOString()
    };

    await this.planner.incorporateFeedback(executionFeedback);
  }

  /**
   * 計画の取得
   */
  getPlan(planId: string): any {
    return this.planner.getPlan(planId);
  }

  /**
   * アクティブな計画の取得
   */
  getActivePlan(): any {
    return this.planner.getActivePlan();
  }

  /**
   * 計画の状態取得
   */
  getState(): any {
    return this.planner.getState();
  }
}

// デフォルトエクスポート
export default AdvancedPlannerAgent;