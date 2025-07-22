/**
 * Advanced Planner Agent - Type Definitions
 * 詳細調査計画策定エージェントの型定義
 */

// ============================================================================
// Core Types
// ============================================================================

export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  targetMarket: string;
  revenueModel: string;
  businessModel: {
    type: string;
    description: string;
    keyComponents: string[];
  };
  valueProposition: string;
  competitiveAdvantage: string;
  riskLevel: 'conservative' | 'balanced' | 'challenging' | 'disruptive';
  businessScale: 'startup' | 'mid_market' | 'enterprise' | 'mega_corp';
  confidence: 'high' | 'medium' | 'low';
  estimatedROI: number;
  estimatedProfitJPY: number;
  timeToMarket: string;
  initialInvestment: number;
  marketSize: number;
  mitsubishiSynergy: {
    overallFit: number;
    capability: Array<{
      category: string;
      relevance: number;
      utilization: string;
    }>;
    businessPortfolio: Array<{
      division: string;
      synergy: number;
      integration: string;
    }>;
    networkAssets: Array<{
      type: string;
      value: number;
      accessibility: string;
    }>;
  };
  [key: string]: any;
}

// ============================================================================
// Research Planning Types
// ============================================================================

export type ResearchCategory = 
  | 'target_customer'     // ターゲット・課題調査
  | 'solution_technology' // ソリューション技術調査
  | 'market_competition'  // 市場・競合調査
  | 'risk_analysis'       // リスク要因調査
  | 'execution_planning'  // 実行計画調査

export type ResearchPriority = 'critical' | 'high' | 'medium' | 'low';
export type ResearchDifficulty = 'easy' | 'moderate' | 'difficult' | 'expert_required';
export type ResearchMethod = 'web_search' | 'database_query' | 'api_call' | 'survey' | 'interview' | 'analysis';

export interface ResearchItem {
  id: string;
  category: ResearchCategory;
  title: string;
  description: string;
  priority: ResearchPriority;
  difficulty: ResearchDifficulty;
  estimatedTimeHours: number;
  estimatedCost: number;
  methods: ResearchMethod[];
  dataSources: string[];
  expectedOutputs: string[];
  dependencies: string[]; // Other research item IDs
  keyQuestions: string[];
  successCriteria: string[];
  deliverables: string[];
  tags: string[];
}

export interface ResearchPlan {
  id: string;
  businessIdeaId: string;
  businessIdeaTitle: string;
  planCreatedAt: string;
  lastUpdatedAt: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  totalEstimatedTime: number;
  totalEstimatedCost: number;
  categories: {
    [K in ResearchCategory]: {
      items: ResearchItem[];
      totalItems: number;
      priorityDistribution: Record<ResearchPriority, number>;
      estimatedTime: number;
      estimatedCost: number;
    };
  };
  executionOrder: string[]; // Research item IDs in execution order
  criticalPath: string[];   // Critical path research item IDs
  milestones: ResearchMilestone[];
  contingencyPlans: ContingencyPlan[];
  resourceRequirements: ResourceRequirement[];
  qualityGates: QualityGate[];
  metadata: {
    plannerVersion: string;
    confidence: number;
    completeness: number;
    complexity: number;
    riskLevel: number;
    adaptability: number;
  };
}

export interface ResearchMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  dependencies: string[];
  deliverables: string[];
  completionCriteria: string[];
}

export interface ContingencyPlan {
  id: string;
  trigger: string;
  description: string;
  alternativeActions: string[];
  impactAssessment: {
    timeImpact: number;
    costImpact: number;
    qualityImpact: number;
  };
}

export interface ResourceRequirement {
  type: 'human' | 'technology' | 'financial' | 'external';
  description: string;
  quantity: number;
  duration: string;
  cost: number;
  availability: 'available' | 'needs_procurement' | 'uncertain';
}

export interface QualityGate {
  id: string;
  name: string;
  criteria: string[];
  requiredApproval: string[];
  exitCriteria: string[];
}

// ============================================================================
// Dynamic Planning Types
// ============================================================================

export interface PlanAdjustment {
  id: string;
  timestamp: string;
  trigger: PlanAdjustmentTrigger;
  changes: PlanChange[];
  rationale: string;
  impactAssessment: {
    timeImpact: number;
    costImpact: number;
    qualityImpact: number;
    riskImpact: number;
  };
  approval: {
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    approver?: string;
    timestamp?: string;
  };
}

export interface PlanAdjustmentTrigger {
  type: 'new_information' | 'external_change' | 'resource_change' | 'timeline_pressure' | 'quality_issue';
  source: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlanChange {
  type: 'add_item' | 'remove_item' | 'modify_item' | 'reorder_items' | 'adjust_resources';
  targetId?: string;
  before?: any;
  after?: any;
  description: string;
}

// ============================================================================
// Input/Output Types
// ============================================================================

export interface PlannerInput {
  businessIdea: BusinessIdea;
  context: {
    researcherCapabilities: string[];
    availableDataSources: string[];
    constraints: {
      maxTimeWeeks: number;
      maxBudget: number;
      restrictedSources: string[];
      complianceRequirements: string[];
    };
    stakeholderRequirements: string[];
  };
  preferences: {
    prioritizeSpeed: boolean;
    prioritizeDepth: boolean;
    prioritizeCost: boolean;
    riskTolerance: 'low' | 'medium' | 'high';
    innovationFocus: boolean;
  };
}

export interface PlannerOutput {
  researchPlan: ResearchPlan;
  executionGuidance: {
    quickWins: string[];
    criticalSuccessFactors: string[];
    potentialBottlenecks: string[];
    recommendedApproach: string[];
  };
  riskAssessment: {
    planRisks: Array<{
      risk: string;
      probability: number;
      impact: number;
      mitigation: string;
    }>;
    contingencyRecommendations: string[];
  };
  nextSteps: string[];
  qualityMetrics: {
    planCompleteness: number;
    feasibility: number;
    efficiency: number;
    adaptability: number;
    overallQuality: number;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PlannerConfig {
  planning: {
    maxItemsPerCategory: number;
    defaultTimeBufferPercent: number;
    defaultCostBufferPercent: number;
    qualityThresholds: {
      completeness: number;
      feasibility: number;
      efficiency: number;
    };
  };
  prioritization: {
    weights: {
      businessImpact: number;
      feasibility: number;
      cost: number;
      time: number;
      risk: number;
    };
    algorithms: {
      priorityCalculation: 'weighted_score' | 'ahp' | 'topsis';
      dependencyHandling: 'strict' | 'flexible';
    };
  };
  adaptation: {
    enableDynamicAdjustment: boolean;
    adjustmentThresholds: {
      minImpactForAdjustment: number;
      maxAdjustmentsPerDay: number;
    };
    autoApprovalLimits: {
      timeImpactPercent: number;
      costImpactPercent: number;
    };
  };
}

// ============================================================================
// State Management Types
// ============================================================================

export interface PlannerState {
  currentPlans: Map<string, ResearchPlan>;
  activePlanId: string | null;
  planHistory: PlanAdjustment[];
  executionFeedback: ExecutionFeedback[];
  performanceMetrics: PlannerPerformanceMetrics;
  lastExecution: string;
}

export interface ExecutionFeedback {
  planId: string;
  itemId: string;
  feedback: {
    actualTime: number;
    actualCost: number;
    qualityRating: number;
    completionRate: number;
    challenges: string[];
    insights: string[];
    recommendations: string[];
  };
  timestamp: string;
}

export interface PlannerPerformanceMetrics {
  totalPlansCreated: number;
  averagePlanQuality: number;
  averageExecutionAccuracy: number;
  adaptationRate: number;
  stakeholderSatisfaction: number;
  costEfficiency: number;
  timeEfficiency: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class PlanningError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PlanningError';
  }
}

export class ValidationError extends PlanningError {
  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', { field });
  }
}

export class ResourceError extends PlanningError {
  constructor(message: string, resource: string) {
    super(message, 'RESOURCE_ERROR', { resource });
  }
}

export class AdaptationError extends PlanningError {
  constructor(message: string, trigger: string) {
    super(message, 'ADAPTATION_ERROR', { trigger });
  }
}