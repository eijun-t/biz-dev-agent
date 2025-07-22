/**
 * Enhanced Critic Agent - Evaluation Framework
 * 評価フレームワーク - 営業利益10億円シナリオ妥当性とリスク・実現可能性評価
 */

import {
  ProfitScenarioEvaluation,
  FeasibilityRiskEvaluation,
  EvaluationScore,
  AnalysisResultForWriter
} from './types';

// ============================================================================
// Evaluation Framework Class
// ============================================================================

export class EvaluationFramework {
  private profitThreshold: number;
  private riskToleranceLevel: number;

  constructor(profitThreshold: number = 10_000_000_000, riskToleranceLevel: number = 7) {
    this.profitThreshold = profitThreshold;
    this.riskToleranceLevel = riskToleranceLevel;
  }

  // --------------------------------------------------------------------------
  // Main Evaluation Methods
  // --------------------------------------------------------------------------

  /**
   * 営業利益10億円シナリオの妥当性評価 (40点満点)
   */
  async evaluateProfitScenario(businessIdea: any): Promise<ProfitScenarioEvaluation> {
    console.log(`💰 Evaluating profit scenario for: ${businessIdea.title}`);

    const revenueModelValidity = this.evaluateRevenueModelValidity(businessIdea);
    const marketSizeConsistency = this.evaluateMarketSizeConsistency(businessIdea);
    const costStructureValidity = this.evaluateCostStructureValidity(businessIdea);
    const growthScenarioCredibility = this.evaluateGrowthScenarioCredibility(businessIdea);

    const totalScore = revenueModelValidity.score + marketSizeConsistency.score + 
                       costStructureValidity.score + growthScenarioCredibility.score;

    const overallAssessment = this.generateProfitScenarioAssessment(
      totalScore,
      businessIdea,
      revenueModelValidity,
      marketSizeConsistency,
      costStructureValidity,
      growthScenarioCredibility
    );

    console.log(`✅ Profit scenario evaluation completed: ${totalScore}/40 points`);

    return {
      revenue_model_validity: revenueModelValidity,
      market_size_consistency: marketSizeConsistency,
      cost_structure_validity: costStructureValidity,
      growth_scenario_credibility: growthScenarioCredibility,
      total_score: totalScore,
      overall_assessment: overallAssessment
    };
  }

  /**
   * 実現可能性・リスク評価 (20点満点)
   */
  async evaluateFeasibilityAndRisk(businessIdea: any): Promise<FeasibilityRiskEvaluation> {
    console.log(`⚖️ Evaluating feasibility and risk for: ${businessIdea.title}`);

    const technicalFeasibility = this.evaluateTechnicalFeasibility(businessIdea);
    const executionDifficulty = this.evaluateExecutionDifficulty(businessIdea);
    const marketRisk = this.evaluateMarketRisk(businessIdea);
    const competitiveRisk = this.evaluateCompetitiveRisk(businessIdea);
    const regulatoryRisk = this.evaluateRegulatoryRisk(businessIdea);
    const financialRisk = this.evaluateFinancialRisk(businessIdea);

    const totalScore = technicalFeasibility.score + executionDifficulty.score + 
                       marketRisk.score + competitiveRisk.score + 
                       regulatoryRisk.score + financialRisk.score;

    const overallAssessment = this.generateFeasibilityRiskAssessment(
      totalScore,
      businessIdea,
      { technicalFeasibility, executionDifficulty, marketRisk, competitiveRisk, regulatoryRisk, financialRisk }
    );

    console.log(`✅ Feasibility & risk evaluation completed: ${totalScore}/20 points`);

    return {
      technical_feasibility: technicalFeasibility,
      execution_difficulty: executionDifficulty,
      market_risk: marketRisk,
      competitive_risk: competitiveRisk,
      regulatory_risk: regulatoryRisk,
      financial_risk: financialRisk,
      total_score: totalScore,
      overall_assessment: overallAssessment
    };
  }

  // --------------------------------------------------------------------------
  // Profit Scenario Evaluation Methods (40点満点)
  // --------------------------------------------------------------------------

  private evaluateRevenueModelValidity(businessIdea: any): EvaluationScore {
    let score = 0;
    const maxScore = 15;
    const details: string[] = [];

    // 収益モデルの明確性
    const hasRevenueModel = businessIdea.businessModel?.primaryRevenue || businessIdea.businessModel?.revenueStreams;
    if (hasRevenueModel) {
      score += 3;
      details.push('収益モデルが明確に定義されている');
    } else {
      details.push('収益モデルの明確化が必要');
    }

    // 収益源の多様性
    const revenueStreams = businessIdea.businessModel?.revenueStreams || [];
    if (revenueStreams.length >= 3) {
      score += 3;
      details.push('複数の収益源による安定性');
    } else if (revenueStreams.length >= 2) {
      score += 2;
      details.push('2つの収益源あり');
    } else if (revenueStreams.length >= 1) {
      score += 1;
      details.push('単一収益源、多様化検討が推奨');
    }

    // 収益性の妥当性
    const estimatedProfit = businessIdea.estimatedProfitJPY || 0;
    if (estimatedProfit >= this.profitThreshold * 2) {
      score += 4;
      details.push(`高い収益性 (${(estimatedProfit / 100000000).toFixed(0)}億円)`);
    } else if (estimatedProfit >= this.profitThreshold) {
      score += 3;
      details.push(`目標達成レベルの収益性 (${(estimatedProfit / 100000000).toFixed(0)}億円)`);
    } else if (estimatedProfit >= this.profitThreshold * 0.7) {
      score += 1;
      details.push('収益性がやや不足、改善余地あり');
    } else {
      details.push('収益性が大幅に不足、モデル見直しが必要');
    }

    // 価格設定の根拠
    const hasPricingStrategy = businessIdea.businessModel?.pricingStrategy || 
                               businessIdea.valueProposition?.pricingModel;
    if (hasPricingStrategy) {
      score += 2;
      details.push('価格設定の根拠が示されている');
    } else {
      details.push('価格設定根拠の明確化が必要');
    }

    // スケーラビリティ
    const scalabilityFactors = businessIdea.businessModel?.scalabilityFactors || [];
    if (scalabilityFactors.length >= 2) {
      score += 3;
      details.push('明確なスケーラビリティ要素');
    } else if (scalabilityFactors.length >= 1) {
      score += 1;
      details.push('限定的なスケーラビリティ');
    } else {
      details.push('スケーラビリティの明確化が必要');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateMarketSizeConsistency(businessIdea: any): EvaluationScore {
    let score = 0;
    const maxScore = 10;
    const details: string[] = [];

    // 市場規模の言及
    const marketSize = businessIdea.marketPositioning?.marketSize || '';
    if (marketSize.includes('兆') || marketSize.includes('兆円')) {
      score += 4;
      details.push('兆円規模の大規模市場');
    } else if (marketSize.includes('千億') || marketSize.includes('1000億')) {
      score += 3;
      details.push('千億円規模の大規模市場');
    } else if (marketSize.includes('億') && !marketSize.includes('数十億')) {
      score += 2;
      details.push('億円規模の中規模市場');
    } else if (marketSize) {
      score += 1;
      details.push('市場規模が小規模または不明確');
    } else {
      details.push('市場規模の明示が必要');
    }

    // ターゲット市場の明確性
    const targetMarket = businessIdea.marketPositioning?.targetMarket || businessIdea.target_market;
    if (targetMarket && targetMarket.length > 20) {
      score += 2;
      details.push('ターゲット市場が明確');
    } else if (targetMarket) {
      score += 1;
      details.push('ターゲット市場の詳細化が有効');
    } else {
      details.push('ターゲット市場の明確化が必要');
    }

    // 市場成長性
    const marketGrowth = businessIdea.marketPositioning?.growthRate || 
                        businessIdea.marketPositioning?.marketTrends || [];
    if (marketGrowth && (marketGrowth.includes('成長') || marketGrowth.length > 0)) {
      score += 2;
      details.push('市場成長性が示されている');
    } else {
      details.push('市場成長性の分析が必要');
    }

    // 収益性との整合性
    const estimatedProfit = businessIdea.estimatedProfitJPY || 0;
    const profitMarketRatio = this.assessProfitMarketSizeConsistency(estimatedProfit, marketSize);
    if (profitMarketRatio >= 0.8) {
      score += 2;
      details.push('収益性と市場規模の整合性が高い');
    } else if (profitMarketRatio >= 0.5) {
      score += 1;
      details.push('収益性と市場規模がおおむね整合');
    } else {
      details.push('収益性と市場規模の整合性確認が必要');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateCostStructureValidity(businessIdea: any): EvaluationScore {
    let score = 0;
    const maxScore = 10;
    const details: string[] = [];

    // コスト構造の明示
    const costStructure = businessIdea.businessModel?.costStructure || 
                         businessIdea.financialProjections?.costBreakdown;
    if (costStructure && Object.keys(costStructure).length >= 3) {
      score += 3;
      details.push('詳細なコスト構造が示されている');
    } else if (costStructure) {
      score += 2;
      details.push('基本的なコスト構造あり');
    } else {
      details.push('コスト構造の詳細化が必要');
    }

    // 固定費・変動費の区別
    const hasFixedCosts = businessIdea.businessModel?.fixedCosts || 
                         (costStructure && costStructure.fixed);
    const hasVariableCosts = businessIdea.businessModel?.variableCosts || 
                            (costStructure && costStructure.variable);
    if (hasFixedCosts && hasVariableCosts) {
      score += 2;
      details.push('固定費・変動費の区別が明確');
    } else if (hasFixedCosts || hasVariableCosts) {
      score += 1;
      details.push('コスト分類の詳細化が有効');
    }

    // 利益率の妥当性
    const revenue = businessIdea.estimatedRevenueJPY || businessIdea.estimatedProfitJPY * 1.5;
    const profit = businessIdea.estimatedProfitJPY || 0;
    const profitMargin = revenue > 0 ? profit / revenue : 0;
    
    if (profitMargin >= 0.3) {
      score += 3;
      details.push(`高い利益率 (${(profitMargin * 100).toFixed(1)}%)`);
    } else if (profitMargin >= 0.2) {
      score += 2;
      details.push(`適切な利益率 (${(profitMargin * 100).toFixed(1)}%)`);
    } else if (profitMargin >= 0.1) {
      score += 1;
      details.push('利益率の改善余地あり');
    } else if (profit > 0) {
      details.push('利益率が低い、コスト削減検討が必要');
    }

    // 三菱地所資産活用によるコストメリット
    const synergyText = businessIdea.mitsubishiSynergy?.description || '';
    if (synergyText.includes('コスト') || synergyText.includes('効率') || synergyText.includes('削減')) {
      score += 2;
      details.push('三菱地所資産活用によるコストメリット');
    } else {
      details.push('コスト面でのシナジー活用検討が推奨');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateGrowthScenarioCredibility(businessIdea: any): EvaluationScore {
    let score = 0;
    const maxScore = 5;
    const details: string[] = [];

    // 成長シナリオの明示
    const growthPlan = businessIdea.implementationRoadmap?.phases || 
                      businessIdea.businessModel?.growthStrategy;
    if (growthPlan && Array.isArray(growthPlan) && growthPlan.length >= 3) {
      score += 2;
      details.push('段階的な成長計画が示されている');
    } else if (growthPlan) {
      score += 1;
      details.push('成長計画の詳細化が有効');
    } else {
      details.push('成長シナリオの明確化が必要');
    }

    // 時期設定の妥当性
    const timeToMarket = businessIdea.timeToMarket || '';
    if (timeToMarket.includes('1年') || timeToMarket.includes('12ヶ月')) {
      score += 2;
      details.push('迅速な市場投入計画');
    } else if (timeToMarket.includes('2年') || timeToMarket.includes('18ヶ月')) {
      score += 1;
      details.push('適切な市場投入時期');
    } else if (timeToMarket.includes('3年')) {
      details.push('市場投入時期がやや長期');
    } else {
      details.push('市場投入時期の明確化が必要');
    }

    // スケール拡大の根拠
    const scalabilityFactors = businessIdea.businessModel?.scalabilityFactors || [];
    if (scalabilityFactors.length >= 2 && scalabilityFactors.some((f: string) => f.includes('自動') || f.includes('システム'))) {
      score += 1;
      details.push('システム化によるスケール拡大が可能');
    } else if (scalabilityFactors.length >= 1) {
      details.push('スケール拡大の根拠強化が有効');
    }

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: details.join('; ')
    };
  }

  // --------------------------------------------------------------------------
  // Feasibility and Risk Evaluation Methods (20点満点)
  // --------------------------------------------------------------------------

  private evaluateTechnicalFeasibility(businessIdea: any): EvaluationScore {
    let score = 3; // 基本点
    const maxScore = 5;
    const details: string[] = [];

    // 技術要件の明確性
    const techRequirements = businessIdea.technicalRequirements;
    if (techRequirements?.coreTechnologies?.length >= 2) {
      score += 1;
      details.push('明確な技術要件');
    } else if (techRequirements?.coreTechnologies?.length >= 1) {
      details.push('技術要件の詳細化が有効');
    } else {
      score -= 1;
      details.push('技術要件の明確化が必要');
    }

    // 技術成熟度
    const technologies = techRequirements?.coreTechnologies || [];
    const matureTechCount = technologies.filter((tech: string) => 
      tech.includes('既存') || tech.includes('実証済') || tech.includes('標準')
    ).length;
    
    if (matureTechCount >= technologies.length * 0.8) {
      score += 1;
      details.push('成熟技術中心で実現可能性高');
    } else if (matureTechCount >= technologies.length * 0.5) {
      details.push('新技術との組み合わせバランス良好');
    } else {
      score -= 1;
      details.push('新技術依存度が高くリスクあり');
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateExecutionDifficulty(businessIdea: any): EvaluationScore {
    let score = 3; // 基本点
    const maxScore = 5;
    const details: string[] = [];

    // 実装ロードマップの詳細性
    const roadmap = businessIdea.implementationRoadmap?.phases || [];
    if (roadmap.length >= 3) {
      score += 1;
      details.push('詳細な実装計画');
    } else if (roadmap.length >= 2) {
      details.push('基本的な実装計画');
    } else {
      score -= 1;
      details.push('実装計画の詳細化が必要');
    }

    // 必要スキルの評価
    const skillRequirements = businessIdea.technicalRequirements?.skillRequirements || [];
    const complexSkills = skillRequirements.filter((skill: string) => 
      skill.includes('AI') || skill.includes('機械学習') || skill.includes('ブロックチェーン')
    ).length;
    
    if (complexSkills === 0) {
      score += 1;
      details.push('標準的なスキルセットで実行可能');
    } else if (complexSkills <= 2) {
      details.push('一部専門スキル要求');
    } else {
      score -= 1;
      details.push('高度な専門スキル依存度高');
    }

    // パートナーシップの必要性
    const partnerships = businessIdea.implementationRoadmap?.keyPartners || [];
    if (partnerships.length <= 2) {
      score += 1;
      details.push('限定的なパートナーシップで実行可能');
    } else {
      details.push('多数のパートナーシップ要求');
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateMarketRisk(businessIdea: any): EvaluationScore {
    let score = 2; // 基本点（3点満点なので高めの基本点）
    const maxScore = 3;
    const details: string[] = [];

    // 市場の安定性
    const marketTrends = businessIdea.marketPositioning?.marketTrends || [];
    const stableMarket = marketTrends.some((trend: string) => 
      trend.includes('安定') || trend.includes('成熟') || trend.includes('継続')
    );
    
    if (stableMarket) {
      score += 1;
      details.push('安定した市場環境');
    } else {
      const volatileMarket = marketTrends.some((trend: string) => 
        trend.includes('変動') || trend.includes('不安定') || trend.includes('新興')
      );
      if (volatileMarket) {
        score -= 1;
        details.push('市場変動リスクあり');
      }
    }

    // 競合環境
    const competitors = businessIdea.competitiveAnalysis?.directCompetitors || [];
    if (competitors.length <= 3) {
      details.push('適度な競合環境');
    } else if (competitors.length <= 5) {
      details.push('競合が多い環境');
    } else {
      score -= 1;
      details.push('激しい競合環境、差別化重要');
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateCompetitiveRisk(businessIdea: any): EvaluationScore {
    let score = 2; // 基本点
    const maxScore = 3;
    const details: string[] = [];

    // 競合優位性の強度
    const competitiveAdvantages = businessIdea.valueProposition?.competitiveDifferentiators || [];
    if (competitiveAdvantages.length >= 3) {
      score += 1;
      details.push('多面的な競合優位性');
    } else if (competitiveAdvantages.length >= 2) {
      details.push('一定の競合優位性');
    } else {
      score -= 1;
      details.push('競合優位性の強化が必要');
    }

    // 参入障壁
    const barriers = businessIdea.marketPositioning?.barriers || [];
    const entryBarriers = barriers.filter((barrier: string) => 
      barrier.includes('資本') || barrier.includes('規制') || barrier.includes('ブランド')
    ).length;
    
    if (entryBarriers >= 2) {
      details.push('一定の参入障壁あり');
    } else {
      score -= 1;
      details.push('参入障壁が限定的');
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateRegulatoryRisk(businessIdea: any): EvaluationScore {
    let score = 2; // 基本点（2点満点なので高めの基本点）
    const maxScore = 2;
    const details: string[] = [];

    // 規制業界での事業か
    const title = businessIdea.title?.toLowerCase() || '';
    const description = (businessIdea.description || businessIdea.shortDescription || '').toLowerCase();
    const text = `${title} ${description}`;
    
    const highRegulationKeywords = ['金融', 'fintech', '医療', 'healthtech', '教育', 'edtech'];
    const hasHighRegulation = highRegulationKeywords.some(keyword => text.includes(keyword));
    
    if (hasHighRegulation) {
      score -= 1;
      details.push('規制の多い業界、コンプライアンス重要');
    } else {
      details.push('比較的規制の少ない分野');
    }

    // 新しい規制リスク
    const riskAssessment = businessIdea.riskAssessment?.regulatoryRisks || [];
    if (riskAssessment.length === 0) {
      details.push('規制リスクは限定的');
    } else if (riskAssessment.length <= 2) {
      details.push('一定の規制対応が必要');
    } else {
      score -= 1;
      details.push('複数の規制リスクに要注意');
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  private evaluateFinancialRisk(businessIdea: any): EvaluationScore {
    let score = 2; // 基本点（2点満点なので高めの基本点）
    const maxScore = 2;
    const details: string[] = [];

    // 初期投資規模
    const initialInvestment = businessIdea.financialProjections?.initialInvestment || 
                             businessIdea.implementationRoadmap?.totalInvestment;
    
    if (initialInvestment && typeof initialInvestment === 'string') {
      if (initialInvestment.includes('100億') || initialInvestment.includes('千億')) {
        score -= 1;
        details.push('高額な初期投資、資金調達リスクあり');
      } else if (initialInvestment.includes('10億') || initialInvestment.includes('数十億')) {
        details.push('適度な初期投資');
      } else {
        details.push('相対的に少額な初期投資');
      }
    } else {
      details.push('初期投資額の明確化が必要');
    }

    // キャッシュフロー回収期間
    const paybackPeriod = businessIdea.financialProjections?.paybackPeriod;
    if (paybackPeriod) {
      if (paybackPeriod.includes('1年') || paybackPeriod.includes('12ヶ月')) {
        details.push('短期回収期間、財務リスク低');
      } else if (paybackPeriod.includes('3年')) {
        details.push('中期回収期間');
      } else if (paybackPeriod.includes('5年') || paybackPeriod.includes('長期')) {
        score -= 1;
        details.push('長期回収期間、財務リスクあり');
      }
    }

    return {
      score: Math.max(Math.min(score, maxScore), 0),
      maxScore,
      details: details.join('; ')
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private assessProfitMarketSizeConsistency(estimatedProfit: number, marketSize: string): number {
    if (!marketSize || estimatedProfit === 0) return 0;
    
    // 簡易的な整合性評価
    if (marketSize.includes('兆')) {
      return estimatedProfit >= 50_000_000_000 ? 1.0 : 0.7; // 50億円以上なら整合
    } else if (marketSize.includes('千億')) {
      return estimatedProfit >= 20_000_000_000 ? 1.0 : 0.8; // 20億円以上なら整合
    } else if (marketSize.includes('億')) {
      return estimatedProfit >= 10_000_000_000 ? 1.0 : 0.6; // 10億円以上なら整合
    }
    
    return 0.5; // 不明確な場合
  }

  // --------------------------------------------------------------------------
  // Assessment Generators
  // --------------------------------------------------------------------------

  private generateProfitScenarioAssessment(
    totalScore: number,
    businessIdea: any,
    revenueModel: EvaluationScore,
    marketSize: EvaluationScore,
    costStructure: EvaluationScore,
    growthScenario: EvaluationScore
  ): string {
    const percentage = (totalScore / 40) * 100;
    
    let assessment = `営業利益10億円シナリオ妥当性: ${totalScore}/40点 (${percentage.toFixed(1)}%)\n\n`;
    
    if (percentage >= 85) {
      assessment += '【優秀】収益シナリオが非常に説得力があり、10億円達成の可能性が高い。';
    } else if (percentage >= 70) {
      assessment += '【良好】収益シナリオに妥当性があり、目標達成が期待できる。';
    } else if (percentage >= 50) {
      assessment += '【普通】収益シナリオに改善の余地があるが基本的な妥当性はある。';
    } else {
      assessment += '【要改善】収益シナリオの大幅な見直しが必要。';
    }
    
    assessment += `\n\n詳細評価:`;
    assessment += `\n- 収益モデル妥当性: ${revenueModel.score}/15点`;
    assessment += `\n- 市場規模整合性: ${marketSize.score}/10点`;
    assessment += `\n- コスト構造妥当性: ${costStructure.score}/10点`;
    assessment += `\n- 成長シナリオ納得感: ${growthScenario.score}/5点`;
    
    return assessment;
  }

  private generateFeasibilityRiskAssessment(
    totalScore: number,
    businessIdea: any,
    scores: Record<string, EvaluationScore>
  ): string {
    const percentage = (totalScore / 20) * 100;
    
    let assessment = `実現可能性・リスク評価: ${totalScore}/20点 (${percentage.toFixed(1)}%)\n\n`;
    
    if (percentage >= 85) {
      assessment += '【優秀】実現可能性が高く、リスクも適切に管理可能。';
    } else if (percentage >= 70) {
      assessment += '【良好】実現可能性があり、リスクは許容範囲内。';
    } else if (percentage >= 50) {
      assessment += '【普通】実現可能だがリスク管理に注意が必要。';
    } else {
      assessment += '【要改善】実現可能性・リスク面で大幅な改善が必要。';
    }
    
    assessment += `\n\n詳細評価:`;
    assessment += `\n- 技術的実現可能性: ${scores.technicalFeasibility.score}/5点`;
    assessment += `\n- 事業実行難易度: ${scores.executionDifficulty.score}/5点`;
    assessment += `\n- 市場リスク: ${scores.marketRisk.score}/3点`;
    assessment += `\n- 競合リスク: ${scores.competitiveRisk.score}/3点`;
    assessment += `\n- 規制・法的リスク: ${scores.regulatoryRisk.score}/2点`;
    assessment += `\n- 財務リスク: ${scores.financialRisk.score}/2点`;
    
    return assessment;
  }

  // --------------------------------------------------------------------------
  // Writer Agent Integration Helper
  // --------------------------------------------------------------------------

  /**
   * Writer Agentが期待するAnalysisResult形式に変換
   */
  generateAnalysisResultForWriter(
    businessIdea: any,
    profitEvaluation: ProfitScenarioEvaluation,
    feasibilityRiskEvaluation: FeasibilityRiskEvaluation,
    capabilityScore: number,
    synergyStrength: number,
    keyDifferentiators: string[]
  ): AnalysisResultForWriter {
    return {
      business_idea_id: businessIdea.id || 'unknown',
      
      market_analysis: {
        tam: this.extractMarketSizeFromIdea(businessIdea, 'tam'),
        sam: this.extractMarketSizeFromIdea(businessIdea, 'sam'),
        som: this.extractMarketSizeFromIdea(businessIdea, 'som'),
        market_growth_rate: this.extractGrowthRateFromIdea(businessIdea),
        market_size_assessment: profitEvaluation.market_size_consistency.details
      },
      
      competitive_analysis: {
        direct_competitors: this.extractCompetitorsFromIdea(businessIdea),
        competitive_advantage_score: Math.round((profitEvaluation.total_score / 40) * 10),
        market_position: this.generateMarketPositionAssessment(businessIdea, profitEvaluation)
      },
      
      risk_assessment: {
        market_risks: this.extractRisksFromEvaluation(feasibilityRiskEvaluation, 'market'),
        technology_risks: this.extractRisksFromEvaluation(feasibilityRiskEvaluation, 'technology'),
        overall_risk_score: Math.round((feasibilityRiskEvaluation.total_score / 20) * 10),
        mitigation_strategies: this.generateMitigationStrategies(feasibilityRiskEvaluation)
      },
      
      financial_projections: {
        revenue_projections: this.extractRevenueProjections(businessIdea),
        cost_structure: profitEvaluation.cost_structure_validity.details,
        profitability: this.extractProfitability(businessIdea),
        profit_scenario_validity: Math.round((profitEvaluation.total_score / 40) * 10)
      },
      
      strategic_recommendations: this.generateStrategicRecommendations(profitEvaluation, feasibilityRiskEvaluation),
      next_steps: this.generateNextSteps(businessIdea, profitEvaluation, feasibilityRiskEvaluation),
      
      critic_evaluation: {
        total_score: profitEvaluation.total_score + capabilityScore + feasibilityRiskEvaluation.total_score,
        capability_utilization_score: capabilityScore,
        synergy_strength: synergyStrength,
        key_differentiators: keyDifferentiators
      },
      
      analysis_confidence: this.calculateAnalysisConfidence(profitEvaluation, feasibilityRiskEvaluation),
      analyst_notes: `Enhanced Critic Agent による包括的評価結果。営業利益10億円達成シナリオの妥当性と三菱地所ケイパビリティ活用度を中心に評価。`,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };
  }

  // Writer Agent Integration Helper Methods
  private extractMarketSizeFromIdea(businessIdea: any, type: 'tam' | 'sam' | 'som'): string {
    const marketSize = businessIdea.marketPositioning?.marketSize || '市場規模未明示';
    // 簡易的な分割（実際にはより精緻な分析が必要）
    if (type === 'tam') return marketSize;
    if (type === 'sam') return '推定可能市場規模を分析中';
    return '実現可能市場規模を分析中';
  }

  private extractGrowthRateFromIdea(businessIdea: any): string {
    return businessIdea.marketPositioning?.growthRate || '成長率分析が必要';
  }

  private extractCompetitorsFromIdea(businessIdea: any): string[] {
    return businessIdea.competitiveAnalysis?.directCompetitors || ['競合分析を実施中'];
  }

  private generateMarketPositionAssessment(businessIdea: any, profitEvaluation: ProfitScenarioEvaluation): string {
    const score = profitEvaluation.total_score;
    if (score >= 32) return '市場リーダーポジション狙い可能';
    if (score >= 24) return '有力な市場プレイヤーポジション';
    if (score >= 16) return 'ニッチリーダーポジション';
    return '市場参入者ポジション';
  }

  private extractRisksFromEvaluation(evaluation: FeasibilityRiskEvaluation, type: 'market' | 'technology'): string[] {
    if (type === 'market') {
      return [evaluation.market_risk.details, evaluation.competitive_risk.details].filter(Boolean);
    }
    return [evaluation.technical_feasibility.details].filter(Boolean);
  }

  private generateMitigationStrategies(evaluation: FeasibilityRiskEvaluation): string[] {
    const strategies: string[] = [];
    
    if (evaluation.market_risk.score < 2) {
      strategies.push('市場調査の継続実施と戦略的パートナーシップ構築');
    }
    if (evaluation.technical_feasibility.score < 4) {
      strategies.push('技術実証とプロトタイプ開発の先行実施');
    }
    if (evaluation.financial_risk.score < 2) {
      strategies.push('段階的投資と早期収益化モデルの構築');
    }
    
    return strategies.length > 0 ? strategies : ['リスク管理体制の整備'];
  }

  private extractRevenueProjections(businessIdea: any): string {
    const profit = businessIdea.estimatedProfitJPY;
    if (profit) {
      return `年間営業利益${(profit / 100000000).toFixed(0)}億円を目標とする収益計画`;
    }
    return '収益予測の詳細化が必要';
  }

  private extractProfitability(businessIdea: any): string {
    const profit = businessIdea.estimatedProfitJPY;
    if (profit >= this.profitThreshold) {
      return `目標営業利益${(profit / 100000000).toFixed(0)}億円達成見込み`;
    }
    return '収益性の改善が必要';
  }

  private generateStrategicRecommendations(
    profitEvaluation: ProfitScenarioEvaluation,
    feasibilityRiskEvaluation: FeasibilityRiskEvaluation
  ): string[] {
    const recommendations: string[] = [];
    
    if (profitEvaluation.total_score < 28) {
      recommendations.push('収益モデルの見直しと収益源の多様化検討');
    }
    if (feasibilityRiskEvaluation.total_score < 14) {
      recommendations.push('リスク軽減策の具体化とコンティンジェンシープラン作成');
    }
    
    recommendations.push('三菱地所の既存アセットとの連携強化');
    recommendations.push('段階的な市場投入戦略の実行');
    
    return recommendations;
  }

  private generateNextSteps(
    businessIdea: any,
    profitEvaluation: ProfitScenarioEvaluation,
    feasibilityRiskEvaluation: FeasibilityRiskEvaluation
  ): string[] {
    const nextSteps: string[] = [];
    
    nextSteps.push('詳細なビジネスプラン策定');
    nextSteps.push('市場調査と競合分析の実施');
    
    if (feasibilityRiskEvaluation.technical_feasibility.score < 4) {
      nextSteps.push('技術的実現可能性の検証とプロトタイプ開発');
    }
    if (profitEvaluation.revenue_model_validity.score < 10) {
      nextSteps.push('収益モデルの詳細設計と検証');
    }
    
    nextSteps.push('ステークホルダーとの協議と合意形成');
    
    return nextSteps;
  }

  private calculateAnalysisConfidence(
    profitEvaluation: ProfitScenarioEvaluation,
    feasibilityRiskEvaluation: FeasibilityRiskEvaluation
  ): number {
    const totalPossibleScore = 60; // 40 + 20
    const totalActualScore = profitEvaluation.total_score + feasibilityRiskEvaluation.total_score;
    
    return Math.round((totalActualScore / totalPossibleScore) * 10);
  }
}