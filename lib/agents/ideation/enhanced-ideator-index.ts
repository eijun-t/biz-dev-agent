/**
 * Enhanced Ideator Agent - Main Index and Integration
 * 強化されたアイデア生成エージェントのメインインデックス
 */

import { EnhancedIdeatorAgent } from './enhanced-ideator';
import { IdeationWorkflow } from './ideation-workflow';
import { CompetitiveAnalyzer, RiskBalancingManager } from './competitive-analyzer';
import { IdeationValidator, ConsistencyTester } from './ideation-validator';

import {
  BusinessIdea,
  IdeationRequest,
  IdeationResult,
  IdeatorConfig,
  IdeatorState,
  IdeationContext,
  RiskLevel,
  BusinessScale,
  QualityMetrics
} from './enhanced-ideator-types';

import {
  DEFAULT_IDEATOR_CONFIG,
  BUSINESS_CATEGORIES,
  IDEATION_PROMPTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './enhanced-ideator-config';

// ============================================================================
// Factory Function for Easy Integration
// ============================================================================

export function createEnhancedIdeator(
  llmConfig: { apiKey?: string; model?: string } = {},
  ideatorConfig: Partial<IdeatorConfig> = {}
): EnhancedIdeatorIntegration {
  return new EnhancedIdeatorIntegration(llmConfig, ideatorConfig);
}

// ============================================================================
// Enhanced Ideator Integration Class
// ============================================================================

export class EnhancedIdeatorIntegration {
  private ideatorAgent: EnhancedIdeatorAgent;
  private competitiveAnalyzer: CompetitiveAnalyzer;
  private riskBalancer: RiskBalancingManager;
  private validator: IdeationValidator;
  private consistencyTester: ConsistencyTester;
  private config: IdeatorConfig;

  constructor(
    llmConfig: { apiKey?: string; model?: string } = {},
    ideatorConfig: Partial<IdeatorConfig> = {}
  ) {
    this.config = { ...DEFAULT_IDEATOR_CONFIG, ...ideatorConfig };
    
    // Initialize core components
    this.ideatorAgent = new EnhancedIdeatorAgent(this.config, llmConfig);
    this.competitiveAnalyzer = new CompetitiveAnalyzer(llmConfig);
    this.riskBalancer = new RiskBalancingManager(this.config.generation.diversityThreshold ? undefined : {
      conservative: 0.25,
      balanced: 0.50,
      challenging: 0.20,
      disruptive: 0.05
    });
    this.validator = new IdeationValidator(
      this.config.quality.validationCriteria,
      this.config.quality.minQualityScore
    );
    this.consistencyTester = new ConsistencyTester(this.validator);

    console.log('🚀 Enhanced Ideator Integration initialized');
    console.log(`   Target ideas: ${this.config.generation.defaultIdeaCount}`);
    console.log(`   Quality threshold: ${this.config.quality.minQualityScore}/10`);
    console.log(`   Synergy threshold: ${this.config.filtering.minSynergyScore}/10`);
  }

  // --------------------------------------------------------------------------
  // Main Public Interface
  // --------------------------------------------------------------------------

  async generateBusinessIdeas(
    userInput: string,
    researchData: any,
    options: IdeationOptions = {}
  ): Promise<EnhancedIdeationResult> {
    try {
      console.log('💡 Starting enhanced business idea generation...');
      console.log(`   User input: "${userInput}"`);
      console.log(`   Research data: ${researchData ? 'Available' : 'Not provided'}`);

      const startTime = Date.now();

      // Prepare ideation request
      const request = this.prepareIdeationRequest(userInput, researchData, options);

      // Generate ideas using the core agent
      const ideationResult = await this.ideatorAgent.generateBusinessIdeas(
        request.userInput,
        request.researchData,
        request.preferences,
        request.constraints,
        request.language,
        request.region
      );

      // Enhanced processing if enabled
      let enhancedResult = ideationResult;
      if (options.enableEnhancedProcessing !== false) {
        enhancedResult = await this.enhanceIdeationResult(ideationResult, request);
      }

      // Validation if enabled
      let validationResult = undefined;
      if (options.enableValidation !== false) {
        validationResult = await this.validator.validateIdeationResult(enhancedResult);
      }

      const executionTime = Date.now() - startTime;

      // Create comprehensive result
      const result: EnhancedIdeationResult = {
        ...enhancedResult,
        validationResult,
        enhancedMetadata: {
          ...enhancedResult.metadata,
          executionTime,
          enhancementApplied: options.enableEnhancedProcessing !== false,
          validationApplied: options.enableValidation !== false,
          processingVersion: '1.0.0'
        }
      };

      console.log(`✅ Enhanced ideation completed in ${executionTime}ms`);
      console.log(`   Generated ${result.businessIdeas.length} ideas`);
      console.log(`   Overall quality: ${result.qualityMetrics.overallQuality.toFixed(1)}/10`);
      console.log(`   Validation: ${validationResult ? (validationResult.isValid ? 'PASSED' : 'FAILED') : 'SKIPPED'}`);

      return result;

    } catch (error) {
      console.error('❌ Enhanced ideation failed:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Enhanced Processing
  // --------------------------------------------------------------------------

  private async enhanceIdeationResult(
    result: IdeationResult,
    request: IdeationRequest
  ): Promise<IdeationResult> {
    console.log('⚡ Applying enhanced processing...');

    let enhancedIdeas = [...result.businessIdeas];

    // 1. Competitive analysis enhancement
    for (let i = 0; i < enhancedIdeas.length; i++) {
      const idea = enhancedIdeas[i];
      console.log(`   Enhancing competitive analysis for: ${idea.title}`);
      
      try {
        const context: IdeationContext = {
          researchSummary: 'Enhanced processing context',
          keyInsights: [],
          marketOpportunities: [],
          technologicalTrends: [],
          competitiveLandscape: [],
          regulatoryEnvironment: [],
          userConstraints: []
        };

        const enhancedCompetitiveAnalysis = await this.competitiveAnalyzer.analyzeCompetitiveLandscape(idea, context);
        enhancedIdeas[i] = {
          ...idea,
          competitiveAnalysis: enhancedCompetitiveAnalysis
        };
      } catch (error) {
        console.warn(`   ⚠️ Failed to enhance competitive analysis for ${idea.title}:`, error);
      }
    }

    // 2. Risk balancing optimization
    console.log('   Optimizing risk balance...');
    const riskBalance = this.riskBalancer.analyzeRiskBalance(enhancedIdeas);
    if (!riskBalance.isBalanced) {
      console.log(`   Rebalancing risks: ${riskBalance.recommendations.join('; ')}`);
      enhancedIdeas = this.riskBalancer.selectIdeasForBalance(enhancedIdeas, enhancedIdeas.length);
    }

    // 3. Quality optimization
    console.log('   Applying quality optimization...');
    enhancedIdeas = this.optimizeIdeaQuality(enhancedIdeas);

    // Recalculate metrics
    const enhancedSummary = this.recalculateSummary(enhancedIdeas);
    const enhancedQualityMetrics = this.recalculateQualityMetrics(enhancedIdeas);

    console.log('   ✅ Enhanced processing completed');

    return {
      ...result,
      businessIdeas: enhancedIdeas,
      summary: enhancedSummary,
      qualityMetrics: enhancedQualityMetrics
    };
  }

  // --------------------------------------------------------------------------
  // Quality Optimization
  // --------------------------------------------------------------------------

  private optimizeIdeaQuality(ideas: BusinessIdea[]): BusinessIdea[] {
    // Sort by quality score and select top ideas
    const scoredIdeas = ideas.map(idea => ({
      idea,
      score: this.calculateIdeaQualityScore(idea)
    }));

    scoredIdeas.sort((a, b) => b.score - a.score);

    return scoredIdeas.map(item => item.idea);
  }

  private calculateIdeaQualityScore(idea: BusinessIdea): number {
    const weights = this.config.quality.qualityWeights;
    
    // Simplified quality scoring
    const synergy = idea.mitsubishiSynergy.overallFit;
    const confidence = idea.confidence === 'high' ? 8 : idea.confidence === 'medium' ? 6 : 4;
    const marketFit = idea.marketFit === 'excellent' ? 9 : 
                     idea.marketFit === 'good' ? 7 : 
                     idea.marketFit === 'fair' ? 5 : 3;
    const uniqueness = idea.uniqueness === 'high' ? 9 : idea.uniqueness === 'medium' ? 7 : 5;
    
    return (
      synergy * weights.synergyAlignment +
      confidence * weights.feasibility +
      marketFit * weights.marketViability +
      uniqueness * weights.originality +
      6 * weights.competitiveAdvantage + // Default competitive score
      7 * weights.riskBalance // Default risk balance score
    );
  }

  // --------------------------------------------------------------------------
  // Metric Recalculation
  // --------------------------------------------------------------------------

  private recalculateSummary(ideas: BusinessIdea[]): IdeationResult['summary'] {
    const riskDistribution = ideas.reduce((acc, idea) => {
      acc[idea.riskLevel] = (acc[idea.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<RiskLevel, number>);

    const scaleDistribution = ideas.reduce((acc, idea) => {
      acc[idea.businessScale] = (acc[idea.businessScale] || 0) + 1;
      return acc;
    }, {} as Record<BusinessScale, number>);

    const averageConfidence = ideas.reduce((sum, idea) => {
      const score = idea.confidence === 'high' ? 8 : idea.confidence === 'medium' ? 6 : 4;
      return sum + score;
    }, 0) / ideas.length;

    const averageSynergyScore = ideas.reduce((sum, idea) => 
      sum + idea.mitsubishiSynergy.overallFit, 0) / ideas.length;

    const topCategories = [...new Set(ideas.map(idea => idea.category))]
      .slice(0, 5);

    const estimatedTotalProfit = ideas.reduce((sum, idea) => 
      sum + idea.estimatedProfitJPY, 0);

    return {
      totalIdeas: ideas.length,
      riskDistribution,
      scaleDistribution,
      averageConfidence,
      averageSynergyScore,
      topCategories,
      estimatedTotalProfit,
      averageTimeToMarket: '18ヶ月'
    };
  }

  private recalculateQualityMetrics(ideas: BusinessIdea[]): QualityMetrics {
    const scores = ideas.map(idea => this.calculateIdeaQualityScore(idea));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      originality: avgScore * 0.9, // Approximate breakdown
      feasibility: avgScore * 1.0,
      marketViability: avgScore * 0.95,
      synergyAlignment: ideas.reduce((sum, idea) => sum + idea.mitsubishiSynergy.overallFit, 0) / ideas.length,
      competitiveAdvantage: avgScore * 0.8,
      riskBalance: avgScore * 0.85,
      overallQuality: avgScore
    };
  }

  // --------------------------------------------------------------------------
  // Request Preparation
  // --------------------------------------------------------------------------

  private prepareIdeationRequest(
    userInput: string,
    researchData: any,
    options: IdeationOptions
  ): IdeationRequest {
    return {
      userInput,
      researchData: researchData || {
        summary: 'No research data provided',
        categorySummaries: [],
        crossCategoryInsights: [],
        keyOpportunities: []
      },
      preferences: {
        riskBalance: options.riskBalance || {
          conservative: 0.25,
          balanced: 0.50,
          challenging: 0.20,
          disruptive: 0.05
        },
        focusAreas: options.focusAreas || [],
        businessScales: options.businessScales || ['mid_market', 'enterprise'],
        timeHorizon: options.timeHorizon || 'medium_term',
        innovationLevel: options.innovationLevel || 'breakthrough',
        prioritizeSynergy: options.prioritizeSynergy !== false
      },
      constraints: {
        minProfitJPY: options.minProfitJPY || 10_000_000_000,
        maxTimeToMarket: options.maxTimeToMarket || '3年以内',
        requiredSynergyScore: options.requiredSynergyScore || 6,
        excludedCategories: options.excludedCategories || [],
        mandatoryRequirements: options.mandatoryRequirements || [],
        budgetConstraints: options.budgetConstraints || []
      },
      language: options.language || 'ja',
      region: options.region || 'japan'
    };
  }

  // --------------------------------------------------------------------------
  // Testing and Validation
  // --------------------------------------------------------------------------

  async testConsistencyAcrossDatasets(testDatasets: any[]): Promise<any> {
    console.log('🧪 Running consistency tests across datasets...');

    const generateIdeasFn = async (dataset: any) => {
      return await this.generateBusinessIdeas(
        'テストケース',
        dataset,
        { enableEnhancedProcessing: false, enableValidation: false }
      );
    };

    return await this.consistencyTester.testConsistencyAcrossDatasets(generateIdeasFn, testDatasets);
  }

  // --------------------------------------------------------------------------
  // Configuration and Stats
  // --------------------------------------------------------------------------

  public getStats(): {
    agent: any;
    config: IdeatorConfig;
    lastExecution: string;
  } {
    return {
      agent: this.ideatorAgent.getStats(),
      config: this.config,
      lastExecution: new Date().toISOString()
    };
  }

  public updateConfig(newConfig: Partial<IdeatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.ideatorAgent.updateConfig(this.config);
    this.validator.updateValidationCriteria(this.config.quality.validationCriteria);
    this.validator.updateQualityThreshold(this.config.quality.minQualityScore);
  }

  public reset(): void {
    this.ideatorAgent.reset();
  }

  public destroy(): void {
    this.ideatorAgent.destroy();
    console.log('🧹 Enhanced Ideator Integration destroyed');
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface IdeationOptions {
  // Risk and Innovation
  riskBalance?: Record<RiskLevel, number>;
  innovationLevel?: 'incremental' | 'breakthrough' | 'disruptive';
  
  // Focus Areas
  focusAreas?: string[];
  businessScales?: BusinessScale[];
  timeHorizon?: 'short_term' | 'medium_term' | 'long_term';
  
  // Constraints
  minProfitJPY?: number;
  maxTimeToMarket?: string;
  requiredSynergyScore?: number;
  excludedCategories?: string[];
  mandatoryRequirements?: string[];
  budgetConstraints?: any[];
  
  // Preferences
  prioritizeSynergy?: boolean;
  language?: 'ja' | 'en';
  region?: 'japan' | 'asia' | 'global';
  
  // Processing Options
  enableEnhancedProcessing?: boolean;
  enableValidation?: boolean;
}

export interface EnhancedIdeationResult extends IdeationResult {
  validationResult?: any;
  enhancedMetadata: {
    executionTime: number;
    enhancementApplied: boolean;
    validationApplied: boolean;
    processingVersion: string;
    [key: string]: any;
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Main Classes
  EnhancedIdeatorAgent,
  IdeationWorkflow,
  CompetitiveAnalyzer,
  RiskBalancingManager,
  IdeationValidator,
  ConsistencyTester,
  
  // Types
  BusinessIdea,
  IdeationRequest,
  IdeationResult,
  IdeatorConfig,
  RiskLevel,
  BusinessScale,
  
  // Config
  DEFAULT_IDEATOR_CONFIG,
  BUSINESS_CATEGORIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};