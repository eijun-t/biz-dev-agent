/**
 * Enhanced Critic Agent - Main Implementation
 * 複数のビジネスアイデアを多面的に評価して最優秀案を選定
 */

import { CapabilityAnalyzer } from './capability-analyzer';
import { EvaluationFramework } from './evaluation-framework';
import {
  BusinessIdeaEvaluation,
  PortfolioEvaluation,
  CriticInput,
  CriticOutput,
  CriticConfig,
  DEFAULT_CRITIC_CONFIG,
  IdeaComparison,
  ComparisonPoint,
  PortfolioDiversityAnalysis,
  PortfolioRiskAnalysis,
  AnalysisResultForWriter
} from './types';

// ============================================================================
// Enhanced Critic Agent
// ============================================================================

export class EnhancedCriticAgent {
  private capabilityAnalyzer: CapabilityAnalyzer;
  private evaluationFramework: EvaluationFramework;
  private config: CriticConfig;

  constructor(config: Partial<CriticConfig> = {}) {
    this.config = { ...DEFAULT_CRITIC_CONFIG, ...config };
    this.capabilityAnalyzer = new CapabilityAnalyzer();
    this.evaluationFramework = new EvaluationFramework(
      this.config.profit_threshold,
      this.config.max_acceptable_risk_score
    );

    console.log('🎯 Enhanced Critic Agent initialized');
    console.log(`   Profit threshold: ¥${(this.config.profit_threshold / 100000000).toFixed(0)}億円`);
    console.log(`   Language: ${this.config.output_language}`);
  }

  // --------------------------------------------------------------------------
  // Main Evaluation Method
  // --------------------------------------------------------------------------

  async evaluateBusinessIdeas(input: CriticInput): Promise<CriticOutput> {
    const startTime = Date.now();
    console.log('🎯 Enhanced Critic Agent: Starting comprehensive evaluation...');
    console.log(`   Session ID: ${input.session_id}`);
    console.log(`   Ideas to evaluate: ${input.business_ideas.length}`);

    try {
      // Step 1: Individual idea evaluation
      const evaluatedIdeas = await this.evaluateIndividualIdeas(input.business_ideas);
      
      // Step 2: Portfolio analysis
      const portfolioEvaluation = await this.analyzePortfolio(
        input.session_id,
        evaluatedIdeas,
        input.user_preferences
      );

      // Step 3: Generate recommendations for Writer Agent
      const writerRecommendations = this.generateWriterRecommendations(portfolioEvaluation);

      // Step 4: Create final output
      const executionTime = Date.now() - startTime;
      const result = this.createCriticOutput(
        portfolioEvaluation,
        writerRecommendations,
        executionTime
      );

      console.log('✅ Enhanced Critic Agent evaluation completed');
      console.log(`   Top score: ${result.evaluation_summary.top_score}/100`);
      console.log(`   Selected idea: ${result.selected_idea_for_next_phase.title}`);
      console.log(`   Execution time: ${executionTime}ms`);

      return result;

    } catch (error) {
      console.error('❌ Enhanced Critic Agent evaluation failed:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Individual Idea Evaluation
  // --------------------------------------------------------------------------

  private async evaluateIndividualIdeas(businessIdeas: any[]): Promise<BusinessIdeaEvaluation[]> {
    console.log('🔍 Evaluating individual business ideas...');
    
    const evaluations: BusinessIdeaEvaluation[] = [];

    for (let i = 0; i < businessIdeas.length; i++) {
      const idea = businessIdeas[i];
      console.log(`   Evaluating idea ${i + 1}/${businessIdeas.length}: ${idea.title}`);

      try {
        const evaluation = await this.evaluateSingleIdea(idea, i + 1);
        evaluations.push(evaluation);
      } catch (error) {
        console.error(`   ❌ Failed to evaluate idea: ${idea.title}`, error);
        // Create minimal evaluation for failed ideas
        evaluations.push(this.createFailedEvaluation(idea, error));
      }
    }

    // Sort by total score (descending)
    evaluations.sort((a, b) => b.total_score - a.total_score);
    
    // Assign ranks
    evaluations.forEach((evaluation, index) => {
      evaluation.rank = index + 1;
    });

    console.log(`✅ Individual evaluations completed: ${evaluations.length} ideas processed`);
    return evaluations;
  }

  private async evaluateSingleIdea(businessIdea: any, index: number): Promise<BusinessIdeaEvaluation> {
    const startTime = Date.now();

    // 1. Capability Utilization Analysis (40点)
    const capabilityEvaluation = await this.capabilityAnalyzer.analyzeCapabilityUtilization(businessIdea);

    // 2. Profit Scenario Evaluation (40点)
    const profitEvaluation = await this.evaluationFramework.evaluateProfitScenario(businessIdea);

    // 3. Feasibility & Risk Evaluation (20点)
    const feasibilityRiskEvaluation = await this.evaluationFramework.evaluateFeasibilityAndRisk(businessIdea);

    // 4. Calculate total score and confidence
    const totalScore = capabilityEvaluation.total_score + 
                       profitEvaluation.total_score + 
                       feasibilityRiskEvaluation.total_score;

    const evaluationConfidence = this.calculateEvaluationConfidence(
      capabilityEvaluation,
      profitEvaluation,
      feasibilityRiskEvaluation
    );

    // 5. Generate strengths, weaknesses, and improvement suggestions
    const { strengths, weaknesses, improvementSuggestions } = this.generateIdeaInsights(
      businessIdea,
      capabilityEvaluation,
      profitEvaluation,
      feasibilityRiskEvaluation
    );

    const executionTime = Date.now() - startTime;

    return {
      idea_id: businessIdea.id || `idea_${index}`,
      idea_title: businessIdea.title || 'Untitled Business Idea',
      
      profit_scenario: profitEvaluation,
      capability_utilization: capabilityEvaluation,
      feasibility_risk: feasibilityRiskEvaluation,
      
      total_score: totalScore,
      rank: 0, // Will be assigned after sorting
      
      strengths,
      weaknesses,
      improvement_suggestions: improvementSuggestions,
      
      evaluation_timestamp: new Date().toISOString(),
      evaluation_confidence: evaluationConfidence
    };
  }

  // --------------------------------------------------------------------------
  // Portfolio Analysis
  // --------------------------------------------------------------------------

  private async analyzePortfolio(
    sessionId: string,
    evaluatedIdeas: BusinessIdeaEvaluation[],
    userPreferences?: any
  ): Promise<PortfolioEvaluation> {
    console.log('📊 Analyzing idea portfolio...');

    // Generate idea comparisons
    const ideaComparisons = this.config.enable_idea_comparisons ? 
      await this.generateIdeaComparisons(evaluatedIdeas) : [];

    // Analyze portfolio diversity
    const portfolioDiversity = this.analyzePortfolioDiversity(evaluatedIdeas);

    // Analyze portfolio risk balance
    const portfolioRiskBalance = this.analyzePortfolioRiskBalance(evaluatedIdeas);

    // Select recommended idea
    const recommendedIdea = this.selectRecommendedIdea(evaluatedIdeas, userPreferences);
    const recommendationReasoning = this.generateRecommendationReasoning(
      recommendedIdea,
      evaluatedIdeas,
      userPreferences
    );

    // Generate alternative considerations
    const alternativeConsiderations = this.generateAlternativeConsiderations(
      evaluatedIdeas,
      recommendedIdea
    );

    const portfolioEvaluation: PortfolioEvaluation = {
      session_id: sessionId,
      evaluated_ideas: evaluatedIdeas,
      
      top_ranked_idea: evaluatedIdeas[0],
      ranking: evaluatedIdeas,
      
      idea_comparisons: ideaComparisons,
      
      portfolio_diversity: portfolioDiversity,
      portfolio_risk_balance: portfolioRiskBalance,
      
      recommended_idea: recommendedIdea,
      recommendation_reasoning: recommendationReasoning,
      alternative_considerations: alternativeConsiderations,
      
      total_ideas_evaluated: evaluatedIdeas.length,
      evaluation_completed_at: new Date().toISOString(),
      evaluation_duration_ms: 0 // Will be set by caller
    };

    console.log(`✅ Portfolio analysis completed`);
    console.log(`   Recommended: ${recommendedIdea.idea_title} (${recommendedIdea.total_score}/100)`);
    console.log(`   Diversity score: ${portfolioDiversity.diversity_score}/10`);
    console.log(`   Risk balance score: ${portfolioRiskBalance.risk_balance_score}/10`);

    return portfolioEvaluation;
  }

  // --------------------------------------------------------------------------
  // Idea Comparison Generation
  // --------------------------------------------------------------------------

  private async generateIdeaComparisons(evaluatedIdeas: BusinessIdeaEvaluation[]): Promise<IdeaComparison[]> {
    const comparisons: IdeaComparison[] = [];
    
    // Compare top 3 ideas with each other
    const topIdeas = evaluatedIdeas.slice(0, Math.min(3, evaluatedIdeas.length));
    
    for (let i = 0; i < topIdeas.length; i++) {
      for (let j = i + 1; j < topIdeas.length; j++) {
        const comparison = await this.compareIdeas(topIdeas[i], topIdeas[j]);
        comparisons.push(comparison);
      }
    }
    
    return comparisons;
  }

  private async compareIdeas(ideaA: BusinessIdeaEvaluation, ideaB: BusinessIdeaEvaluation): Promise<IdeaComparison> {
    const comparisonPoints: ComparisonPoint[] = [
      {
        category: 'ケイパビリティ活用度',
        idea_a_score: ideaA.capability_utilization.total_score,
        idea_b_score: ideaB.capability_utilization.total_score,
        difference: ideaA.capability_utilization.total_score - ideaB.capability_utilization.total_score,
        significance: this.assessSignificance(Math.abs(ideaA.capability_utilization.total_score - ideaB.capability_utilization.total_score), 40),
        explanation: `ケイパビリティ活用度で${Math.abs(ideaA.capability_utilization.total_score - ideaB.capability_utilization.total_score)}点の差`
      },
      {
        category: '収益シナリオ妥当性',
        idea_a_score: ideaA.profit_scenario.total_score,
        idea_b_score: ideaB.profit_scenario.total_score,
        difference: ideaA.profit_scenario.total_score - ideaB.profit_scenario.total_score,
        significance: this.assessSignificance(Math.abs(ideaA.profit_scenario.total_score - ideaB.profit_scenario.total_score), 40),
        explanation: `収益シナリオで${Math.abs(ideaA.profit_scenario.total_score - ideaB.profit_scenario.total_score)}点の差`
      },
      {
        category: '実現可能性・リスク',
        idea_a_score: ideaA.feasibility_risk.total_score,
        idea_b_score: ideaB.feasibility_risk.total_score,
        difference: ideaA.feasibility_risk.total_score - ideaB.feasibility_risk.total_score,
        significance: this.assessSignificance(Math.abs(ideaA.feasibility_risk.total_score - ideaB.feasibility_risk.total_score), 20),
        explanation: `実現可能性・リスクで${Math.abs(ideaA.feasibility_risk.total_score - ideaB.feasibility_risk.total_score)}点の差`
      }
    ];

    const winner = ideaA.total_score > ideaB.total_score ? ideaA.idea_id : ideaB.idea_id;
    const totalDifference = Math.abs(ideaA.total_score - ideaB.total_score);
    
    let reasoning = `総合評価で${totalDifference}点の差。`;
    const majorDifferences = comparisonPoints.filter(point => point.significance === 'high');
    if (majorDifferences.length > 0) {
      reasoning += ` 主な違いは${majorDifferences.map(p => p.category).join('、')}での優位性。`;
    }

    return {
      idea_a_id: ideaA.idea_id,
      idea_b_id: ideaB.idea_id,
      comparison_points: comparisonPoints,
      winner,
      reasoning
    };
  }

  private assessSignificance(difference: number, maxScore: number): 'high' | 'medium' | 'low' {
    const percentage = (difference / maxScore) * 100;
    if (percentage >= 25) return 'high';      // 25%以上の差
    if (percentage >= 10) return 'medium';    // 10%以上の差
    return 'low';                             // 10%未満の差
  }

  // --------------------------------------------------------------------------
  // Portfolio Diversity & Risk Analysis
  // --------------------------------------------------------------------------

  private analyzePortfolioDiversity(evaluatedIdeas: BusinessIdeaEvaluation[]): PortfolioDiversityAnalysis {
    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    evaluatedIdeas.forEach(idea => {
      // Extract category from capability references or business model
      const categories = idea.capability_utilization.referenced_capabilities.map(ref => ref.capability_name);
      categories.forEach(category => {
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });
    });

    // Risk level distribution (approximated from feasibility scores)
    const riskDistribution: Record<string, number> = {};
    evaluatedIdeas.forEach(idea => {
      const riskScore = idea.feasibility_risk.total_score;
      let riskLevel: string;
      if (riskScore >= 16) riskLevel = 'low_risk';
      else if (riskScore >= 12) riskLevel = 'medium_risk';
      else riskLevel = 'high_risk';
      
      riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;
    });

    // Capability usage distribution
    const capabilityDistribution: Record<string, number> = {};
    evaluatedIdeas.forEach(idea => {
      const capabilityScore = idea.capability_utilization.total_score;
      let capabilityLevel: string;
      if (capabilityScore >= 32) capabilityLevel = 'high_synergy';
      else if (capabilityScore >= 24) capabilityLevel = 'medium_synergy';
      else capabilityLevel = 'low_synergy';
      
      capabilityDistribution[capabilityLevel] = (capabilityDistribution[capabilityLevel] || 0) + 1;
    });

    // Calculate diversity score
    const categoryCount = Object.keys(categoryDistribution).length;
    const riskLevelCount = Object.keys(riskDistribution).length;
    const capabilityLevelCount = Object.keys(capabilityDistribution).length;
    
    const diversityScore = Math.min(10, (categoryCount * 3 + riskLevelCount * 2 + capabilityLevelCount * 2));

    let diversityAssessment: string;
    if (diversityScore >= 8) diversityAssessment = '非常に多様性の高いアイデアポートフォリオ';
    else if (diversityScore >= 6) diversityAssessment = '適度な多様性を持つアイデアポートフォリオ';
    else if (diversityScore >= 4) diversityAssessment = '限定的な多様性のアイデアポートフォリオ';
    else diversityAssessment = '多様性の乏しいアイデアポートフォリオ、幅広い検討が推奨';

    return {
      category_distribution: categoryDistribution,
      risk_level_distribution: riskDistribution,
      capability_usage_distribution: capabilityDistribution,
      diversity_score: diversityScore,
      diversity_assessment: diversityAssessment
    };
  }

  private analyzePortfolioRiskBalance(evaluatedIdeas: BusinessIdeaEvaluation[]): PortfolioRiskAnalysis {
    const riskScores = evaluatedIdeas.map(idea => idea.feasibility_risk.total_score);
    const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;

    // Risk distribution by score ranges
    const riskDistribution: Record<string, number> = {
      'low_risk': riskScores.filter(score => score >= 16).length,
      'medium_risk': riskScores.filter(score => score >= 12 && score < 16).length,
      'high_risk': riskScores.filter(score => score < 12).length
    };

    // Calculate risk balance score
    const total = evaluatedIdeas.length;
    const lowRiskRatio = riskDistribution.low_risk / total;
    const mediumRiskRatio = riskDistribution.medium_risk / total;
    const highRiskRatio = riskDistribution.high_risk / total;

    // Ideal distribution: some low risk (40-60%), some medium risk (30-50%), limited high risk (0-20%)
    let riskBalanceScore = 5; // Base score

    if (lowRiskRatio >= 0.4 && lowRiskRatio <= 0.6) riskBalanceScore += 3;
    else if (lowRiskRatio >= 0.3) riskBalanceScore += 2;
    else if (lowRiskRatio >= 0.2) riskBalanceScore += 1;

    if (mediumRiskRatio >= 0.3 && mediumRiskRatio <= 0.5) riskBalanceScore += 2;
    else if (mediumRiskRatio >= 0.2) riskBalanceScore += 1;

    if (highRiskRatio <= 0.2) riskBalanceScore += 1;
    else if (highRiskRatio >= 0.5) riskBalanceScore -= 1;

    riskBalanceScore = Math.min(Math.max(riskBalanceScore, 0), 10);

    let riskAssessment: string;
    if (riskBalanceScore >= 8) riskAssessment = '優秀なリスクバランス、多様性と安定性を両立';
    else if (riskBalanceScore >= 6) riskAssessment = '適切なリスクバランス';
    else if (riskBalanceScore >= 4) riskAssessment = 'リスクバランスに改善の余地あり';
    else riskAssessment = 'リスクが偏っており、バランス調整が必要';

    return {
      average_risk_score: averageRiskScore,
      risk_distribution: riskDistribution,
      risk_balance_score: riskBalanceScore,
      risk_assessment: riskAssessment
    };
  }

  // --------------------------------------------------------------------------
  // Recommendation Selection
  // --------------------------------------------------------------------------

  private selectRecommendedIdea(
    evaluatedIdeas: BusinessIdeaEvaluation[],
    userPreferences?: any
  ): BusinessIdeaEvaluation {
    if (evaluatedIdeas.length === 0) {
      throw new Error('No evaluated ideas available for recommendation');
    }

    let candidates = [...evaluatedIdeas];

    // Apply user preferences if provided
    if (userPreferences) {
      if (userPreferences.prioritize_low_risk) {
        candidates = candidates.filter(idea => idea.feasibility_risk.total_score >= 14);
      }
      if (userPreferences.prioritize_high_synergy) {
        candidates = candidates.filter(idea => idea.capability_utilization.total_score >= 30);
      }
      if (userPreferences.minimum_profit_requirement) {
        candidates = candidates.filter(idea => 
          idea.profit_scenario.total_score >= (userPreferences.minimum_profit_requirement / 100) * 40
        );
      }
    }

    // If filtering removed all candidates, use original list
    if (candidates.length === 0) {
      candidates = evaluatedIdeas;
    }

    // Select the highest scoring candidate
    return candidates[0];
  }

  private generateRecommendationReasoning(
    recommendedIdea: BusinessIdeaEvaluation,
    allIdeas: BusinessIdeaEvaluation[],
    userPreferences?: any
  ): string {
    let reasoning = `「${recommendedIdea.idea_title}」を最優秀案として推薦。`;
    reasoning += `\n\n【総合評価】${recommendedIdea.total_score}/100点 (ランキング${recommendedIdea.rank}位)`;
    
    reasoning += `\n\n【評価詳細】`;
    reasoning += `\n・ケイパビリティ活用度: ${recommendedIdea.capability_utilization.total_score}/40点`;
    reasoning += `\n・収益シナリオ妥当性: ${recommendedIdea.profit_scenario.total_score}/40点`;
    reasoning += `\n・実現可能性・リスク: ${recommendedIdea.feasibility_risk.total_score}/20点`;

    reasoning += `\n\n【推薦理由】`;
    if (recommendedIdea.strengths.length > 0) {
      reasoning += `\n${recommendedIdea.strengths.slice(0, 3).map(s => `・${s}`).join('\n')}`;
    }

    // Add comparison with alternatives if available
    if (allIdeas.length > 1) {
      const secondBest = allIdeas[1];
      const scoreDifference = recommendedIdea.total_score - secondBest.total_score;
      reasoning += `\n\n【代替案との比較】`;
      reasoning += `\n2位「${secondBest.idea_title}」と${scoreDifference}点差での選定。`;
    }

    return reasoning;
  }

  private generateAlternativeConsiderations(
    evaluatedIdeas: BusinessIdeaEvaluation[],
    recommendedIdea: BusinessIdeaEvaluation
  ): string[] {
    const considerations: string[] = [];
    
    // Second choice consideration
    if (evaluatedIdeas.length > 1) {
      const secondChoice = evaluatedIdeas[1];
      considerations.push(`2位「${secondChoice.idea_title}」は${secondChoice.strengths[0]}で優位性あり`);
    }
    
    // High synergy alternative
    const highSynergyIdea = evaluatedIdeas.find(idea => 
      idea.idea_id !== recommendedIdea.idea_id && idea.capability_utilization.total_score >= 35
    );
    if (highSynergyIdea) {
      considerations.push(`「${highSynergyIdea.idea_title}」は三菱地所とのシナジー効果が特に高い`);
    }
    
    // Low risk alternative
    const lowRiskIdea = evaluatedIdeas.find(idea => 
      idea.idea_id !== recommendedIdea.idea_id && idea.feasibility_risk.total_score >= 18
    );
    if (lowRiskIdea) {
      considerations.push(`「${lowRiskIdea.idea_title}」はリスクが低く確実性重視の選択肢`);
    }

    return considerations.length > 0 ? considerations : ['他の代替案も一定の評価を得ている'];
  }

  // --------------------------------------------------------------------------
  // Writer Agent Integration
  // --------------------------------------------------------------------------

  private generateWriterRecommendations(portfolioEvaluation: PortfolioEvaluation) {
    const recommendedIdea = portfolioEvaluation.recommended_idea;
    
    return {
      focus_areas: [
        '営業利益10億円達成の具体的シナリオ',
        '三菱地所ケイパビリティの戦略的活用',
        '競合優位性と差別化ポイント',
        'リスク軽減策と実行計画'
      ],
      key_differentiators: recommendedIdea.capability_utilization.referenced_capabilities
        .map(ref => ref.capability_name)
        .slice(0, 3),
      risk_mitigation_points: [
        recommendedIdea.feasibility_risk.technical_feasibility.details,
        recommendedIdea.feasibility_risk.market_risk.details
      ].filter(Boolean),
      synergy_highlights: [
        recommendedIdea.capability_utilization.overall_assessment.split('\n')[0]
      ]
    };
  }

  // --------------------------------------------------------------------------
  // Output Generation
  // --------------------------------------------------------------------------

  private createCriticOutput(
    portfolioEvaluation: PortfolioEvaluation,
    writerRecommendations: any,
    executionTime: number
  ): CriticOutput {
    const recommendedIdea = portfolioEvaluation.recommended_idea;
    const topScore = portfolioEvaluation.evaluated_ideas[0]?.total_score || 0;
    const averageScore = portfolioEvaluation.evaluated_ideas.length > 0 ?
      portfolioEvaluation.evaluated_ideas.reduce((sum, idea) => sum + idea.total_score, 0) / portfolioEvaluation.evaluated_ideas.length : 0;

    return {
      portfolio_evaluation: portfolioEvaluation,
      selected_idea_for_next_phase: recommendedIdea, // This will be passed to Writer Agent
      evaluation_summary: {
        total_processing_time_ms: executionTime,
        ideas_evaluated: portfolioEvaluation.evaluated_ideas.length,
        top_score: topScore,
        average_score: averageScore,
        confidence_level: recommendedIdea.evaluation_confidence
      },
      recommendations_for_writer_agent: writerRecommendations
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private calculateEvaluationConfidence(
    capabilityEvaluation: any,
    profitEvaluation: any,
    feasibilityRiskEvaluation: any
  ): number {
    // Base confidence from scores
    const totalScore = capabilityEvaluation.total_score + profitEvaluation.total_score + feasibilityRiskEvaluation.total_score;
    const scoreBasedConfidence = totalScore / 100;

    // Adjust based on data completeness
    const capabilityDataCompleteness = capabilityEvaluation.referenced_capabilities.length > 0 ? 1.0 : 0.7;
    const profitDataCompleteness = profitEvaluation.revenue_model_validity.score > 0 ? 1.0 : 0.8;

    return Math.min(scoreBasedConfidence * capabilityDataCompleteness * profitDataCompleteness, 1.0);
  }

  private generateIdeaInsights(
    businessIdea: any,
    capabilityEvaluation: any,
    profitEvaluation: any,
    feasibilityRiskEvaluation: any
  ): {
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvementSuggestions: string[] = [];

    // Analyze strengths
    if (capabilityEvaluation.total_score >= 32) {
      strengths.push('三菱地所ケイパビリティの効果的活用');
    }
    if (profitEvaluation.total_score >= 32) {
      strengths.push('営業利益10億円達成の高い蓋然性');
    }
    if (feasibilityRiskEvaluation.total_score >= 16) {
      strengths.push('実現可能性が高くリスクが適切に管理されている');
    }

    // Analyze weaknesses
    if (capabilityEvaluation.total_score < 24) {
      weaknesses.push('三菱地所ケイパビリティの活用が不十分');
      improvementSuggestions.push('三菱地所の既存資産との連携を具体化・詳細化する');
    }
    if (profitEvaluation.total_score < 28) {
      weaknesses.push('収益シナリオの妥当性に疑問');
      improvementSuggestions.push('収益モデルの見直しと市場規模との整合性確認');
    }
    if (feasibilityRiskEvaluation.total_score < 12) {
      weaknesses.push('実現可能性が低いまたはリスクが高い');
      improvementSuggestions.push('技術的実現可能性の検証とリスク軽減策の具体化');
    }

    // Generic improvement suggestions
    if (improvementSuggestions.length === 0) {
      improvementSuggestions.push('既存の強みをさらに強化し、差別化ポイントを明確化する');
    }

    return { strengths, weaknesses, improvementSuggestions };
  }

  private createFailedEvaluation(businessIdea: any, error: any): BusinessIdeaEvaluation {
    return {
      idea_id: businessIdea.id || 'failed_idea',
      idea_title: businessIdea.title || 'Failed to Evaluate',
      
      profit_scenario: {
        revenue_model_validity: { score: 0, maxScore: 15, details: 'Evaluation failed' },
        market_size_consistency: { score: 0, maxScore: 10, details: 'Evaluation failed' },
        cost_structure_validity: { score: 0, maxScore: 10, details: 'Evaluation failed' },
        growth_scenario_credibility: { score: 0, maxScore: 5, details: 'Evaluation failed' },
        total_score: 0,
        overall_assessment: 'Evaluation failed due to error'
      },
      
      capability_utilization: {
        scenario_clarity: { score: 0, maxScore: 10, details: 'Evaluation failed' },
        depth_specificity: { score: 0, maxScore: 15, details: 'Evaluation failed' },
        synergy_strength: { score: 0, maxScore: 15, details: 'Evaluation failed' },
        total_score: 0,
        referenced_capabilities: [],
        overall_assessment: 'Evaluation failed due to error'
      },
      
      feasibility_risk: {
        technical_feasibility: { score: 0, maxScore: 5, details: 'Evaluation failed' },
        execution_difficulty: { score: 0, maxScore: 5, details: 'Evaluation failed' },
        market_risk: { score: 0, maxScore: 3, details: 'Evaluation failed' },
        competitive_risk: { score: 0, maxScore: 3, details: 'Evaluation failed' },
        regulatory_risk: { score: 0, maxScore: 2, details: 'Evaluation failed' },
        financial_risk: { score: 0, maxScore: 2, details: 'Evaluation failed' },
        total_score: 0,
        overall_assessment: 'Evaluation failed due to error'
      },
      
      total_score: 0,
      rank: 999,
      
      strengths: [],
      weaknesses: ['評価処理中にエラーが発生'],
      improvement_suggestions: ['エラーの原因を調査し、データの完全性を確認する'],
      
      evaluation_timestamp: new Date().toISOString(),
      evaluation_confidence: 0
    };
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  public updateConfig(newConfig: Partial<CriticConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sub-components if needed
    this.evaluationFramework = new EvaluationFramework(
      this.config.profit_threshold,
      this.config.max_acceptable_risk_score
    );
  }

  public getConfig(): CriticConfig {
    return { ...this.config };
  }

  // --------------------------------------------------------------------------
  // Writer Agent Integration Helper
  // --------------------------------------------------------------------------

  /**
   * Generate AnalysisResult for Writer Agent
   */
  generateAnalysisResultForWriter(portfolioEvaluation: PortfolioEvaluation): AnalysisResultForWriter {
    const recommendedIdea = portfolioEvaluation.recommended_idea;
    
    return this.evaluationFramework.generateAnalysisResultForWriter(
      recommendedIdea, // Pass the actual business idea object (you might need to get this from input)
      recommendedIdea.profit_scenario,
      recommendedIdea.feasibility_risk,
      recommendedIdea.capability_utilization.total_score,
      recommendedIdea.capability_utilization.synergy_strength.score,
      recommendedIdea.capability_utilization.referenced_capabilities.map(ref => ref.capability_name)
    );
  }
}