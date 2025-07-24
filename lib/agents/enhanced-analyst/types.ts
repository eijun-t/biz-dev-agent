/**
 * Enhanced Analyst Agent - Type Definitions
 * Writer向けレポートセクション生成のための型定義
 */

import { SpecializedResearchOutput } from '../specialized-researcher/types';

// ============================================================================
// Core Input Types
// ============================================================================

export interface AnalystInput {
  userInput: string; // ユーザーの元の要求・入力
  selectedIdea: any; // Enhanced Criticが選定したビジネスアイデア
  originalResearch: any; // Enhanced Researcherの初期調査結果
  specializedResearch?: SpecializedResearchOutput; // Specialized Researcherの専門調査結果
}

// ============================================================================
// Report Section Types (Writerが使用する7つのセクション)
// ============================================================================

// 1. 概要セクション
export interface ExecutiveSummary {
  businessConcept: string; // ビジネスコンセプトの簡潔な説明
  keyValueProposition: string; // 主要価値提案
  targetMarketSize: {
    total: number;
    addressable: number;
    currency: string;
    timeframe: string;
  };
  revenueProjection: {
    year3: number;
    year5: number;
    currency: string;
  };
  investmentRequired: {
    initial: number;
    total: number;
    currency: string;
  };
  keySuccessFactors: string[];
  expectedOutcomes: string[];
}

// 2. ターゲット・課題セクション
export interface TargetAndChallenges {
  primaryTarget: {
    segment: string;
    size: number;
    characteristics: string[];
    painPoints: string[];
    currentSolutions: string[];
    switchingBarriers: string[];
  };
  secondaryTargets: Array<{
    segment: string;
    size: number;
    opportunity: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  marketChallenges: Array<{
    challenge: string;
    impact: 'high' | 'medium' | 'low';
    currentGaps: string[];
    addressability: string;
  }>;
  customerJourney: {
    awareness: string;
    consideration: string;
    decision: string;
    retention: string;
  };
}

// 3. ソリューションセクション
export interface SolutionAnalysis {
  coreOffering: {
    productService: string;
    keyFeatures: string[];
    uniqueAdvantages: string[];
    technology: string[];
  };
  businessModel: {
    revenueStreams: Array<{
      stream: string;
      description: string;
      pricing: string;
      contribution: number; // percentage
    }>;
    costStructure: {
      fixedCosts: Record<string, number>;
      variableCosts: Record<string, number>;
      keyDrivers: string[];
    };
    operatingModel: string;
  };
  implementationApproach: {
    phases: Array<{
      phase: string;
      duration: string;
      milestones: string[];
      resources: string[];
    }>;
    criticalPath: string[];
    dependencies: string[];
  };
  scalabilityPlan: {
    domestic: string;
    international: string;
    verticalExpansion: string[];
    horizontalExpansion: string[];
  };
}

// 4. 市場・競合セクション
export interface MarketCompetitiveAnalysis {
  marketDynamics: {
    totalMarket: {
      size: number;
      growth: number;
      drivers: string[];
      trends: string[];
    };
    segments: Array<{
      name: string;
      size: number;
      growth: number;
      attractiveness: number; // 1-10 scale
    }>;
    entryBarriers: string[];
    successFactors: string[];
  };
  competitiveLandscape: {
    directCompetitors: Array<{
      name: string;
      marketShare: number;
      strengths: string[];
      weaknesses: string[];
      strategy: string;
    }>;
    indirectCompetitors: Array<{
      name: string;
      threat: 'high' | 'medium' | 'low';
      substitutionRisk: string;
    }>;
    competitiveAdvantages: string[];
    differentiationStrategy: string;
  };
  marketEntry: {
    strategy: string;
    channels: string[];
    partnerships: string[];
    timeline: string;
    investmentNeeds: number;
  };
}

// 5. 三菱地所の意義セクション
export interface MitsubishiEstateValue {
  strategicFit: {
    coreBusinessAlignment: string;
    portfolioSynergy: string;
    capabilityLeverage: string[];
    assetUtilization: string[];
  };
  competitiveAdvantages: {
    uniqueAssets: string[];
    networkValue: string[];
    brandStrength: string;
    marketPosition: string;
  };
  synergyOpportunities: Array<{
    type: 'revenue' | 'cost' | 'strategic';
    description: string;
    quantification: string;
    realizationPeriod: string;
  }>;
  riskMitigation: {
    diversification: string;
    expertise: string[];
    resources: string[];
  };
  longTermValue: {
    portfolioContribution: string;
    futureOptions: string[];
    strategicPositioning: string;
  };
}

// 6. 検証計画セクション
export interface ValidationPlan {
  marketValidation: {
    hypotheses: string[];
    methods: Array<{
      method: string;
      timeline: string;
      resources: string;
      successCriteria: string[];
    }>;
    pilots: Array<{
      name: string;
      scope: string;
      duration: string;
      budget: number;
      kpis: string[];
    }>;
  };
  technicalValidation: {
    prototypes: Array<{
      type: string;
      specifications: string[];
      timeline: string;
      validation: string[];
    }>;
    testing: Array<{
      testType: string;
      criteria: string[];
      timeline: string;
    }>;
  };
  businessModelValidation: {
    experiments: Array<{
      hypothesis: string;
      experiment: string;
      metrics: string[];
      timeline: string;
    }>;
    financialMilestones: Array<{
      milestone: string;
      target: string;
      timeline: string;
    }>;
  };
  goNoGoDecisionPoints: Array<{
    decision: string;
    criteria: string[];
    timeline: string;
    alternatives: string[];
  }>;
}

// 7. リスク分析セクション
export interface RiskAnalysis {
  marketRisks: Array<{
    risk: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string[];
    contingency: string;
  }>;
  technicalRisks: Array<{
    risk: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string[];
    timeline: string;
  }>;
  financialRisks: Array<{
    risk: string;
    probability: 'high' | 'medium' | 'low';
    impact: string; // quantified impact
    mitigation: string[];
    monitoring: string[];
  }>;
  regulatoryRisks: Array<{
    risk: string;
    jurisdiction: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string[];
    compliance: string[];
  }>;
  operationalRisks: Array<{
    risk: string;
    category: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string[];
  }>;
  scenarioAnalysis: {
    bestCase: {
      assumptions: string[];
      outcomes: Record<string, any>;
    };
    baseCase: {
      assumptions: string[];
      outcomes: Record<string, any>;
    };
    worstCase: {
      assumptions: string[];
      outcomes: Record<string, any>;
    };
  };
}

// ============================================================================
// Enhanced Analyst Output Type
// ============================================================================

export interface EnhancedAnalystOutput {
  id: string;
  businessIdeaId: string;
  businessIdeaTitle: string;
  analyzedAt: string;
  
  // Writer向けの7つのセクション
  executiveSummary: ExecutiveSummary;
  targetAndChallenges: TargetAndChallenges;
  solutionAnalysis: SolutionAnalysis;
  marketCompetitiveAnalysis: MarketCompetitiveAnalysis;
  mitsubishiEstateValue: MitsubishiEstateValue;
  validationPlan: ValidationPlan;
  riskAnalysis: RiskAnalysis;
  
  // メタデータ
  dataQuality: {
    completeness: number; // 0-1 scale
    confidence: number; // 0-1 scale
    dataGaps: string[];
    recommendations: string[];
  };
  
  // 処理情報
  processingMetadata: {
    originalResearchUsed: boolean;
    specializedResearchUsed: boolean;
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    processingTime: number;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface EnhancedAnalystConfig {
  analysis: {
    depth: 'basic' | 'detailed' | 'comprehensive';
    includeQuantitativeAnalysis: boolean;
    includeScenarioPlanning: boolean;
  };
  output: {
    includeConfidenceScores: boolean;
    includeDataLineage: boolean;
    detailLevel: 'summary' | 'detailed' | 'exhaustive';
  };
  validation: {
    requireMinDataPoints: number;
    enforceDataQuality: boolean;
    flagInconsistencies: boolean;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class EnhancedAnalystError extends Error {
  constructor(
    message: string,
    public code: string,
    public section?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EnhancedAnalystError';
  }
}

export class DataExtractionError extends EnhancedAnalystError {
  constructor(section: string, message: string, details?: any) {
    super(message, 'DATA_EXTRACTION_ERROR', section, details);
  }
}

export class AnalysisError extends EnhancedAnalystError {
  constructor(section: string, message: string, details?: any) {
    super(message, 'ANALYSIS_ERROR', section, details);
  }
}