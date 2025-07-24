/**
 * Specialized Researcher Agent - Type Definitions
 * 専門分野別調査エージェントの型定義
 */

import { ResearchPlan, ResearchItem, ResearchCategory } from '../planner/types';

// ============================================================================
// Core Types
// ============================================================================

export type DomainType = 
  | 'market'       // 市場規模・セグメント・動向
  | 'competitor'   // 競合分析
  | 'technology'   // 技術・特許・実装事例
  | 'regulatory'   // 規制・法的要件
  | 'financial';   // 資金調達・収益性・投資環境

export interface SpecializedResearchRequest {
  researchPlan: ResearchPlan;
  targetDomains?: DomainType[];
  timeConstraints?: {
    maxHours: number;
    deadline?: string;
  };
  priorityOverrides?: {
    market?: boolean;
    competitor?: boolean;
  };
}

// ============================================================================
// Domain Module Types
// ============================================================================

export interface DomainResearchItem {
  id: string;
  domain: DomainType;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface DomainResearchResult {
  domain: DomainType;
  researchItems: DomainResearchItem[];
  findings: DomainFindings;
  metadata: ResearchMetadata;
}

// ============================================================================
// Market Investigation Types
// ============================================================================

export interface MarketFindings {
  marketSize: {
    total: number;
    currency: string;
    year: number;
    growthRate: number;
    forecast: Array<{
      year: number;
      size: number;
      growthRate: number;
    }>;
  };
  segments: Array<{
    name: string;
    size: number;
    share: number;
    growthRate: number;
    keyPlayers: string[];
  }>;
  trends: Array<{
    name: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    description: string;
  }>;
  opportunities: Array<{
    description: string;
    potentialSize: number;
    difficulty: 'easy' | 'moderate' | 'difficult';
    timeToCapture: string;
  }>;
}

// ============================================================================
// Competitor Investigation Types
// ============================================================================

export interface CompetitorFindings {
  directCompetitors: Array<{
    name: string;
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
    products: Array<{
      name: string;
      marketPosition: string;
      pricing: string;
    }>;
    strategy: string;
    recentMoves: string[];
  }>;
  indirectCompetitors: Array<{
    name: string;
    threat: 'high' | 'medium' | 'low';
    overlappingAreas: string[];
    potentialImpact: string;
  }>;
  competitiveLandscape: {
    intensity: 'high' | 'medium' | 'low';
    barriers: string[];
    keySuccessFactors: string[];
    differentiationOpportunities: string[];
  };
  benchmarking: {
    pricingComparison: Record<string, any>;
    featureComparison: Record<string, any>;
    marketPositioning: Record<string, any>;
  };
}

// ============================================================================
// Technology Investigation Types
// ============================================================================

export interface TechnologyFindings {
  coreTechnologies: Array<{
    name: string;
    maturity: 'emerging' | 'growth' | 'mature' | 'declining';
    adoptionRate: number;
    implementationComplexity: 'low' | 'medium' | 'high';
    vendors: string[];
  }>;
  patents: Array<{
    title: string;
    holder: string;
    filingDate: string;
    relevance: 'critical' | 'important' | 'related';
    potentialConflict: boolean;
  }>;
  implementationExamples: Array<{
    company: string;
    technology: string;
    useCase: string;
    outcome: string;
    lessons: string[];
  }>;
  technicalRequirements: {
    infrastructure: string[];
    skills: string[];
    tools: string[];
    estimatedCost: number;
  };
}

// ============================================================================
// Regulatory Investigation Types
// ============================================================================

export interface RegulatoryFindings {
  applicableLaws: Array<{
    name: string;
    jurisdiction: string;
    requirements: string[];
    penalties: string;
    complianceCost: number;
  }>;
  licenses: Array<{
    type: string;
    issuingAuthority: string;
    requirements: string[];
    timeline: string;
    cost: number;
  }>;
  standards: Array<{
    name: string;
    type: 'mandatory' | 'recommended';
    certificationBody: string;
    requirements: string[];
  }>;
  upcomingChanges: Array<{
    regulation: string;
    effectiveDate: string;
    impact: 'high' | 'medium' | 'low';
    requiredActions: string[];
  }>;
}

// ============================================================================
// Financial Investigation Types
// ============================================================================

export interface FinancialFindings {
  fundingOptions: Array<{
    type: string;
    amount: { min: number; max: number };
    requirements: string[];
    timeline: string;
    pros: string[];
    cons: string[];
  }>;
  revenueProjections: {
    conservative: Array<{ year: number; revenue: number; }>;
    realistic: Array<{ year: number; revenue: number; }>;
    optimistic: Array<{ year: number; revenue: number; }>;
  };
  costStructure: {
    initial: Record<string, number>;
    operational: Record<string, number>;
    scaling: Record<string, number>;
  };
  investmentEnvironment: {
    sentiment: 'positive' | 'neutral' | 'negative';
    activeInvestors: string[];
    recentDeals: Array<{
      company: string;
      amount: number;
      investors: string[];
      valuation?: number;
    }>;
    valuationBenchmarks: Record<string, any>;
  };
}

// ============================================================================
// Unified Types
// ============================================================================

export type DomainFindings = 
  | MarketFindings 
  | CompetitorFindings 
  | TechnologyFindings 
  | RegulatoryFindings 
  | FinancialFindings;

export interface ResearchMetadata {
  startTime: string;
  endTime: string;
  dataSourcesUsed: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  recommendations: string[];
}

export interface SpecializedResearchOutput {
  id: string;
  researchPlanId: string;
  businessIdeaTitle: string;
  executedAt: string;
  status: 'success' | 'partial' | 'failed';
  domainResults: DomainResearchResult[];
  summary: {
    keyFindings: string[];
    criticalRisks: string[];
    majorOpportunities: string[];
    nextSteps: string[];
  };
  performance: {
    totalTimeHours: number;
    domainsCompleted: number;
    dataPointsCollected: number;
    confidence: number;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DomainModuleConfig {
  maxConcurrentRequests: number;
  timeoutMinutes: number;
  retryAttempts: number;
  dataSources: string[];
  priorityWeights: Record<string, number>;
}

export interface SpecializedResearcherConfig {
  domains: Record<DomainType, DomainModuleConfig>;
  execution: {
    parallel: boolean;
    maxConcurrentDomains: number;
    failureStrategy: 'fail_fast' | 'continue_on_error';
  };
  output: {
    includeRawData: boolean;
    summaryDepth: 'concise' | 'detailed' | 'comprehensive';
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class SpecializedResearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public domain?: DomainType,
    public details?: any
  ) {
    super(message);
    this.name = 'SpecializedResearchError';
  }
}

export class DomainExecutionError extends SpecializedResearchError {
  constructor(domain: DomainType, message: string, details?: any) {
    super(message, 'DOMAIN_EXECUTION_ERROR', domain, details);
  }
}

export class DataTransformationError extends SpecializedResearchError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_TRANSFORMATION_ERROR', undefined, details);
  }
}