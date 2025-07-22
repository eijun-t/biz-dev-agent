/**
 * Ideation Validator - Quality and Consistency Validation
 * アイデア品質・一貫性検証モジュール
 */

import {
  BusinessIdea,
  IdeationResult,
  QualityMetrics,
  ValidationCriteria,
  QualityCheck,
  ValidationError,
  QualityError
} from './enhanced-ideator-types';

import { DEFAULT_IDEATOR_CONFIG } from './enhanced-ideator-config';

// ============================================================================
// Ideation Validator
// ============================================================================

export class IdeationValidator {
  private validationCriteria: ValidationCriteria;
  private qualityThreshold: number;

  constructor(
    criteria: Partial<ValidationCriteria> = {},
    qualityThreshold: number = 7.0
  ) {
    this.validationCriteria = {
      ...DEFAULT_IDEATOR_CONFIG.quality.validationCriteria,
      ...criteria
    };
    this.qualityThreshold = qualityThreshold;
  }

  // --------------------------------------------------------------------------
  // Main Validation Methods
  // --------------------------------------------------------------------------

  async validateIdeationResult(result: IdeationResult): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive ideation validation...');

    const validationResult: ValidationResult = {
      isValid: true,
      overallScore: 0,
      qualityChecks: [],
      consistencyChecks: [],
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // 1. Individual idea validation
      for (const idea of result.businessIdeas) {
        const ideaValidation = await this.validateIndividualIdea(idea);
        validationResult.qualityChecks.push(...ideaValidation.checks);
        validationResult.errors.push(...ideaValidation.errors);
        validationResult.warnings.push(...ideaValidation.warnings);
      }

      // 2. Portfolio consistency validation
      const consistencyValidation = await this.validatePortfolioConsistency(result.businessIdeas);
      validationResult.consistencyChecks = consistencyValidation.checks;
      validationResult.errors.push(...consistencyValidation.errors);
      validationResult.warnings.push(...consistencyValidation.warnings);

      // 3. Overall quality assessment
      const qualityAssessment = await this.assessOverallQuality(result);
      validationResult.overallScore = qualityAssessment.score;
      validationResult.recommendations.push(...qualityAssessment.recommendations);

      // 4. Determine final validation status
      validationResult.isValid = this.determineValidationStatus(validationResult);

      console.log(`✅ Validation completed: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
      console.log(`   Overall score: ${validationResult.overallScore.toFixed(1)}/10`);
      console.log(`   Errors: ${validationResult.errors.length}, Warnings: ${validationResult.warnings.length}`);

      return validationResult;

    } catch (error) {
      console.error('❌ Validation failed:', error);
      validationResult.isValid = false;
      validationResult.errors.push(`Validation process failed: ${error}`);
      return validationResult;
    }
  }

  // --------------------------------------------------------------------------
  // Individual Idea Validation
  // --------------------------------------------------------------------------

  private async validateIndividualIdea(idea: BusinessIdea): Promise<{
    checks: QualityCheck[];
    errors: string[];
    warnings: string[];
  }> {
    const checks: QualityCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    const structureCheck = this.validateStructure(idea);
    checks.push(structureCheck);
    if (structureCheck.status === 'failed') {
      errors.push(structureCheck.details);
    }

    // Business viability validation
    const viabilityCheck = this.validateBusinessViability(idea);
    checks.push(viabilityCheck);
    if (viabilityCheck.status === 'failed') {
      errors.push(viabilityCheck.details);
    } else if (viabilityCheck.status === 'warning') {
      warnings.push(viabilityCheck.details);
    }

    // Technical feasibility validation
    const feasibilityCheck = this.validateTechnicalFeasibility(idea);
    checks.push(feasibilityCheck);
    if (feasibilityCheck.status === 'failed') {
      errors.push(feasibilityCheck.details);
    } else if (feasibilityCheck.status === 'warning') {
      warnings.push(feasibilityCheck.details);
    }

    // Market fit validation
    const marketCheck = this.validateMarketFit(idea);
    checks.push(marketCheck);
    if (marketCheck.status === 'failed') {
      errors.push(marketCheck.details);
    } else if (marketCheck.status === 'warning') {
      warnings.push(marketCheck.details);
    }

    // Synergy validation
    const synergyCheck = this.validateSynergy(idea);
    checks.push(synergyCheck);
    if (synergyCheck.status === 'failed') {
      errors.push(synergyCheck.details);
    } else if (synergyCheck.status === 'warning') {
      warnings.push(synergyCheck.details);
    }

    // Risk assessment validation
    const riskCheck = this.validateRiskAssessment(idea);
    checks.push(riskCheck);
    if (riskCheck.status === 'failed') {
      errors.push(riskCheck.details);
    } else if (riskCheck.status === 'warning') {
      warnings.push(riskCheck.details);
    }

    return { checks, errors, warnings };
  }

  // --------------------------------------------------------------------------
  // Structure Validation
  // --------------------------------------------------------------------------

  private validateStructure(idea: BusinessIdea): QualityCheck {
    const requiredFields = [
      'title', 'shortDescription', 'category', 'businessModel',
      'valueProposition', 'marketPositioning', 'technicalRequirements',
      'implementationRoadmap', 'mitsubishiSynergy', 'competitiveAnalysis'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = (idea as any)[field];
      return !value || (typeof value === 'object' && Object.keys(value).length === 0);
    });

    if (missingFields.length > 0) {
      return {
        checkType: 'Structure Validation',
        status: 'failed',
        details: `Missing or empty required fields: ${missingFields.join(', ')}`,
        score: 0
      };
    }

    // Check for minimum content quality
    if (idea.title.length < 5 || idea.shortDescription.length < 20) {
      return {
        checkType: 'Structure Validation',
        status: 'warning',
        details: 'Title or description may be too short',
        score: 6
      };
    }

    return {
      checkType: 'Structure Validation',
      status: 'passed',
      details: 'All required fields present with adequate content',
      score: 10
    };
  }

  // --------------------------------------------------------------------------
  // Business Viability Validation
  // --------------------------------------------------------------------------

  private validateBusinessViability(idea: BusinessIdea): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    // Profit threshold check
    if (idea.estimatedProfitJPY < 10_000_000_000) {
      score -= 4;
      issues.push(`Estimated profit (¥${(idea.estimatedProfitJPY / 1_000_000_000).toFixed(1)}B) below minimum threshold (¥10B)`);
    }

    // Market size validation
    const marketSize = idea.marketPositioning.marketSize;
    if (!marketSize.includes('億') && !marketSize.includes('兆')) {
      score -= 2;
      issues.push('Market size may be insufficient');
    }

    // Revenue model validation
    if (!idea.businessModel.primaryRevenue || idea.businessModel.primaryRevenue.length < 5) {
      score -= 2;
      issues.push('Primary revenue model unclear');
    }

    // Scalability validation
    if (idea.businessModel.scalabilityFactors.length < 2) {
      score -= 1;
      issues.push('Limited scalability factors identified');
    }

    // Time to market validation
    const timeToMarket = idea.timeToMarket;
    if (timeToMarket.includes('5年') || timeToMarket.includes('6年')) {
      score -= 1;
      issues.push('Time to market may be too long');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Business viability concerns: ${issues.join('; ')}`
      : 'Business viability validated successfully';

    return {
      checkType: 'Business Viability',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Technical Feasibility Validation
  // --------------------------------------------------------------------------

  private validateTechnicalFeasibility(idea: BusinessIdea): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    const tech = idea.technicalRequirements;

    // Core technologies validation
    if (tech.coreTechnologies.length === 0) {
      score -= 3;
      issues.push('No core technologies specified');
    }

    // Skill requirements validation
    if (tech.skillRequirements.length === 0) {
      score -= 2;
      issues.push('Skill requirements not defined');
    }

    // Technical risks assessment
    if (tech.technicalRisks.length > 5) {
      score -= 2;
      issues.push('High number of technical risks identified');
    } else if (tech.technicalRisks.length === 0) {
      score -= 1;
      issues.push('No technical risks identified (unrealistic)');
    }

    // Development timeline validation
    const timeline = tech.developmentTimeline;
    if (!timeline || timeline === '') {
      score -= 2;
      issues.push('Development timeline not specified');
    }

    // Scalability requirements
    if (tech.scalabilityRequirements.length < 2) {
      score -= 1;
      issues.push('Limited scalability requirements defined');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Technical feasibility concerns: ${issues.join('; ')}`
      : 'Technical feasibility validated successfully';

    return {
      checkType: 'Technical Feasibility',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Market Fit Validation
  // --------------------------------------------------------------------------

  private validateMarketFit(idea: BusinessIdea): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    const value = idea.valueProposition;
    const positioning = idea.marketPositioning;

    // Value proposition validation
    if (value.customerPainPoints.length === 0) {
      score -= 2;
      issues.push('No customer pain points identified');
    }

    if (value.solutionOffering.length === 0) {
      score -= 2;
      issues.push('Solution offering not clearly defined');
    }

    if (value.competitiveDifferentiators.length < 2) {
      score -= 1;
      issues.push('Limited competitive differentiators');
    }

    // Market positioning validation
    if (!positioning.targetMarket || positioning.targetMarket.length < 5) {
      score -= 2;
      issues.push('Target market not clearly defined');
    }

    if (positioning.barriers.length > positioning.opportunities.length + 2) {
      score -= 1;
      issues.push('Barriers significantly outweigh opportunities');
    }

    // Market fit score validation
    if (idea.marketFit === 'poor') {
      score -= 3;
      issues.push('Poor market fit assessment');
    } else if (idea.marketFit === 'fair') {
      score -= 1;
      issues.push('Fair market fit - room for improvement');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Market fit concerns: ${issues.join('; ')}`
      : 'Market fit validated successfully';

    return {
      checkType: 'Market Fit',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Synergy Validation
  // --------------------------------------------------------------------------

  private validateSynergy(idea: BusinessIdea): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    const synergy = idea.mitsubishiSynergy;

    // Overall synergy score validation
    if (synergy.overallFit < 6) {
      score -= 4;
      issues.push(`Overall synergy score (${synergy.overallFit}) below minimum threshold (6)`);
    }

    // Asset utilization validation
    if (synergy.existingAssetUtilization.length === 0) {
      score -= 3;
      issues.push('No specific asset utilization identified');
    }

    // Individual synergy scores validation
    const synergyScores = synergy.synergyScore;
    const lowScores = Object.entries(synergyScores).filter(([_, score]) => score < 5);
    if (lowScores.length > 2) {
      score -= 2;
      issues.push(`Multiple low synergy scores: ${lowScores.map(([key, _]) => key).join(', ')}`);
    }

    // Strategic advantages validation
    if (synergy.strategicAdvantages.length < 3) {
      score -= 1;
      issues.push('Limited strategic advantages identified');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Synergy concerns: ${issues.join('; ')}`
      : 'Mitsubishi Estate synergy validated successfully';

    return {
      checkType: 'Synergy Validation',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Risk Assessment Validation
  // --------------------------------------------------------------------------

  private validateRiskAssessment(idea: BusinessIdea): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    const risk = idea.riskAssessment;

    // Risk coverage validation
    const riskCategories = [
      risk.marketRisks, risk.technicalRisks, risk.operationalRisks, 
      risk.financialRisks, risk.regulatoryRisks, risk.competitiveRisks
    ];

    const emptyCategories = riskCategories.filter(category => category.length === 0).length;
    if (emptyCategories > 3) {
      score -= 2;
      issues.push('Insufficient risk category coverage');
    }

    // High-severity risks validation
    const allRisks = riskCategories.flat();
    const criticalRisks = allRisks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 2) {
      score -= 2;
      issues.push('Too many critical risks identified');
    }

    // Mitigation strategies validation
    if (risk.mitigationStrategies.length < 3) {
      score -= 1;
      issues.push('Limited mitigation strategies defined');
    }

    // Risk level consistency
    const riskCounts = allRisks.reduce((acc, r) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (idea.riskLevel === 'conservative' && (riskCounts.high || 0) + (riskCounts.critical || 0) > 2) {
      score -= 1;
      issues.push('Risk level inconsistent with conservative classification');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Risk assessment concerns: ${issues.join('; ')}`
      : 'Risk assessment validated successfully';

    return {
      checkType: 'Risk Assessment',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Portfolio Consistency Validation
  // --------------------------------------------------------------------------

  private async validatePortfolioConsistency(ideas: BusinessIdea[]): Promise<{
    checks: QualityCheck[];
    errors: string[];
    warnings: string[];
  }> {
    const checks: QualityCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Diversity validation
    const diversityCheck = this.validateDiversity(ideas);
    checks.push(diversityCheck);
    if (diversityCheck.status === 'failed') {
      errors.push(diversityCheck.details);
    } else if (diversityCheck.status === 'warning') {
      warnings.push(diversityCheck.details);
    }

    // Risk balance validation
    const riskBalanceCheck = this.validateRiskBalance(ideas);
    checks.push(riskBalanceCheck);
    if (riskBalanceCheck.status === 'failed') {
      errors.push(riskBalanceCheck.details);
    } else if (riskBalanceCheck.status === 'warning') {
      warnings.push(riskBalanceCheck.details);
    }

    // Quality consistency validation
    const qualityConsistencyCheck = this.validateQualityConsistency(ideas);
    checks.push(qualityConsistencyCheck);
    if (qualityConsistencyCheck.status === 'failed') {
      errors.push(qualityConsistencyCheck.details);
    } else if (qualityConsistencyCheck.status === 'warning') {
      warnings.push(qualityConsistencyCheck.details);
    }

    // Overlap validation
    const overlapCheck = this.validateIdeaOverlap(ideas);
    checks.push(overlapCheck);
    if (overlapCheck.status === 'failed') {
      errors.push(overlapCheck.details);
    } else if (overlapCheck.status === 'warning') {
      warnings.push(overlapCheck.details);
    }

    return { checks, errors, warnings };
  }

  private validateDiversity(ideas: BusinessIdea[]): QualityCheck {
    const categories = new Set(ideas.map(idea => idea.category));
    const riskLevels = new Set(ideas.map(idea => idea.riskLevel));
    const businessScales = new Set(ideas.map(idea => idea.businessScale));

    let score = 10;
    const issues: string[] = [];

    if (categories.size < Math.min(ideas.length, 4)) {
      score -= 2;
      issues.push('Limited category diversity');
    }

    if (riskLevels.size < 3) {
      score -= 2;
      issues.push('Limited risk level diversity');
    }

    if (businessScales.size < 2) {
      score -= 1;
      issues.push('Limited business scale diversity');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Diversity concerns: ${issues.join('; ')}`
      : 'Portfolio diversity validated successfully';

    return {
      checkType: 'Portfolio Diversity',
      status,
      details,
      score
    };
  }

  private validateRiskBalance(ideas: BusinessIdea[]): QualityCheck {
    const riskCounts = ideas.reduce((acc, idea) => {
      acc[idea.riskLevel] = (acc[idea.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = ideas.length;
    const balancedRatio = (riskCounts.balanced || 0) / total;
    const conservativeRatio = (riskCounts.conservative || 0) / total;
    const challengingRatio = (riskCounts.challenging || 0) / total;

    let score = 10;
    const issues: string[] = [];

    // Expect balanced ideas to dominate
    if (balancedRatio < 0.3) {
      score -= 2;
      issues.push('Insufficient balanced risk ideas');
    }

    // Conservative should be significant but not dominant
    if (conservativeRatio > 0.4) {
      score -= 1;
      issues.push('Too many conservative ideas');
    }

    // Challenging ideas should be present but limited
    if (challengingRatio > 0.3) {
      score -= 1;
      issues.push('Too many challenging risk ideas');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Risk balance concerns: ${issues.join('; ')}`
      : 'Risk balance validated successfully';

    return {
      checkType: 'Risk Balance',
      status,
      details,
      score
    };
  }

  private validateQualityConsistency(ideas: BusinessIdea[]): QualityCheck {
    const synergyScores = ideas.map(idea => idea.mitsubishiSynergy.overallFit);
    const estimatedProfits = ideas.map(idea => idea.estimatedProfitJPY);

    const avgSynergy = synergyScores.reduce((a, b) => a + b, 0) / synergyScores.length;
    const avgProfit = estimatedProfits.reduce((a, b) => a + b, 0) / estimatedProfits.length;

    let score = 10;
    const issues: string[] = [];

    // Check for outliers
    const lowSynergyIdeas = ideas.filter(idea => idea.mitsubishiSynergy.overallFit < avgSynergy - 2);
    if (lowSynergyIdeas.length > ideas.length * 0.2) {
      score -= 2;
      issues.push('Too many low-synergy outliers');
    }

    const lowProfitIdeas = ideas.filter(idea => idea.estimatedProfitJPY < 10_000_000_000);
    if (lowProfitIdeas.length > 0) {
      score -= 3;
      issues.push('Ideas below minimum profit threshold');
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Quality consistency concerns: ${issues.join('; ')}`
      : 'Quality consistency validated successfully';

    return {
      checkType: 'Quality Consistency',
      status,
      details,
      score
    };
  }

  private validateIdeaOverlap(ideas: BusinessIdea[]): QualityCheck {
    let score = 10;
    const issues: string[] = [];

    // Check for title similarity
    const titles = ideas.map(idea => idea.title.toLowerCase());
    const similarTitles = this.findSimilarStrings(titles, 0.7);
    if (similarTitles.length > 0) {
      score -= 2;
      issues.push(`Similar titles detected: ${similarTitles.join(', ')}`);
    }

    // Check for category concentration
    const categoryCount = ideas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantCategories = Object.entries(categoryCount).filter(([_, count]) => count > ideas.length * 0.4);
    if (dominantCategories.length > 0) {
      score -= 1;
      issues.push(`Category concentration: ${dominantCategories.map(([cat, _]) => cat).join(', ')}`);
    }

    const status = score >= 7 ? 'passed' : score >= 5 ? 'warning' : 'failed';
    const details = issues.length > 0 
      ? `Overlap concerns: ${issues.join('; ')}`
      : 'Idea overlap validated successfully';

    return {
      checkType: 'Idea Overlap',
      status,
      details,
      score
    };
  }

  // --------------------------------------------------------------------------
  // Overall Quality Assessment
  // --------------------------------------------------------------------------

  private async assessOverallQuality(result: IdeationResult): Promise<{
    score: number;
    recommendations: string[];
  }> {
    const qualityMetrics = result.qualityMetrics;
    const summary = result.summary;

    // Calculate weighted overall score
    const weights = {
      originality: 0.15,
      feasibility: 0.25,
      marketViability: 0.20,
      synergyAlignment: 0.25,
      competitiveAdvantage: 0.10,
      riskBalance: 0.05
    };

    const overallScore = (
      qualityMetrics.originality * weights.originality +
      qualityMetrics.feasibility * weights.feasibility +
      qualityMetrics.marketViability * weights.marketViability +
      qualityMetrics.synergyAlignment * weights.synergyAlignment +
      qualityMetrics.competitiveAdvantage * weights.competitiveAdvantage +
      qualityMetrics.riskBalance * weights.riskBalance
    );

    const recommendations: string[] = [];

    // Generate recommendations based on scores
    if (qualityMetrics.originality < 7) {
      recommendations.push('アイデアの独創性向上が必要');
    }
    if (qualityMetrics.feasibility < 7) {
      recommendations.push('実現可能性の詳細検討が必要');
    }
    if (qualityMetrics.synergyAlignment < 8) {
      recommendations.push('三菱地所とのシナジー効果強化が必要');
    }
    if (summary.averageSynergyScore < 7) {
      recommendations.push('全体的なシナジー効果の底上げが必要');
    }
    if (overallScore >= 8) {
      recommendations.push('高品質なアイデアポートフォリオ - 実行準備を推奨');
    }

    return {
      score: overallScore,
      recommendations
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private determineValidationStatus(result: ValidationResult): boolean {
    return (
      result.errors.length === 0 &&
      result.overallScore >= this.qualityThreshold &&
      result.qualityChecks.filter(check => check.status === 'failed').length === 0
    );
  }

  private findSimilarStrings(strings: string[], threshold: number): string[] {
    const similar: string[] = [];
    
    for (let i = 0; i < strings.length; i++) {
      for (let j = i + 1; j < strings.length; j++) {
        const similarity = this.calculateStringSimilarity(strings[i], strings[j]);
        if (similarity >= threshold) {
          similar.push(`"${strings[i]}" and "${strings[j]}"`);
        }
      }
    }
    
    return similar;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  public updateValidationCriteria(criteria: Partial<ValidationCriteria>): void {
    this.validationCriteria = { ...this.validationCriteria, ...criteria };
  }

  public updateQualityThreshold(threshold: number): void {
    this.qualityThreshold = threshold;
  }

  public getValidationCriteria(): ValidationCriteria {
    return { ...this.validationCriteria };
  }

  public getQualityThreshold(): number {
    return this.qualityThreshold;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  overallScore: number;
  qualityChecks: QualityCheck[];
  consistencyChecks: QualityCheck[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// Cross-Dataset Consistency Tester
// ============================================================================

export class ConsistencyTester {
  private validator: IdeationValidator;

  constructor(validator: IdeationValidator) {
    this.validator = validator;
  }

  async testConsistencyAcrossDatasets(
    generateIdeasFn: (dataset: any) => Promise<IdeationResult>,
    testDatasets: any[]
  ): Promise<ConsistencyTestResult> {
    console.log('🧪 Testing consistency across multiple datasets...');

    const results: IdeationResult[] = [];
    const validationResults: ValidationResult[] = [];

    // Generate ideas for each dataset
    for (let i = 0; i < testDatasets.length; i++) {
      const dataset = testDatasets[i];
      console.log(`   Testing dataset ${i + 1}/${testDatasets.length}...`);
      
      try {
        const ideationResult = await generateIdeasFn(dataset);
        const validationResult = await this.validator.validateIdeationResult(ideationResult);
        
        results.push(ideationResult);
        validationResults.push(validationResult);
      } catch (error) {
        console.error(`   Failed to process dataset ${i + 1}:`, error);
      }
    }

    // Analyze consistency
    const consistencyAnalysis = this.analyzeConsistency(results, validationResults);

    console.log(`✅ Consistency testing completed: ${results.length}/${testDatasets.length} datasets processed`);
    console.log(`   Average quality: ${consistencyAnalysis.averageQuality.toFixed(1)}/10`);
    console.log(`   Quality variance: ${consistencyAnalysis.qualityVariance.toFixed(2)}`);

    return {
      totalDatasets: testDatasets.length,
      successfulRuns: results.length,
      results,
      validationResults,
      consistencyAnalysis
    };
  }

  private analyzeConsistency(
    results: IdeationResult[],
    validations: ValidationResult[]
  ): ConsistencyAnalysis {
    const qualityScores = validations.map(v => v.overallScore);
    const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const qualityVariance = this.calculateVariance(qualityScores);

    const synergyScores = results.map(r => r.summary.averageSynergyScore);
    const averageSynergy = synergyScores.reduce((a, b) => a + b, 0) / synergyScores.length;
    const synergyVariance = this.calculateVariance(synergyScores);

    const ideaCounts = results.map(r => r.businessIdeas.length);
    const averageIdeaCount = ideaCounts.reduce((a, b) => a + b, 0) / ideaCounts.length;

    return {
      averageQuality,
      qualityVariance,
      averageSynergy,
      synergyVariance,
      averageIdeaCount,
      isConsistent: qualityVariance < 1.0 && synergyVariance < 1.0,
      consistencyScore: Math.max(0, 10 - (qualityVariance + synergyVariance))
    };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

// ============================================================================
// Supporting Types for Consistency Testing
// ============================================================================

export interface ConsistencyTestResult {
  totalDatasets: number;
  successfulRuns: number;
  results: IdeationResult[];
  validationResults: ValidationResult[];
  consistencyAnalysis: ConsistencyAnalysis;
}

export interface ConsistencyAnalysis {
  averageQuality: number;
  qualityVariance: number;
  averageSynergy: number;
  synergyVariance: number;
  averageIdeaCount: number;
  isConsistent: boolean;
  consistencyScore: number;
}

// ============================================================================
// Exports
// ============================================================================

// Export only types to avoid duplicate class exports