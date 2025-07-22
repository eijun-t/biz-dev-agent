/**
 * Enhanced Ideator Agent - Type Definitions
 * 強化されたアイデア生成エージェントの型定義
 */

// ============================================================================
// Core Types
// ============================================================================

export type BusinessScale = 'startup' | 'mid_market' | 'enterprise' | 'mega_corp';
export type RiskLevel = 'conservative' | 'balanced' | 'challenging' | 'disruptive';
export type ImplementationStage = 'foundation' | 'expansion' | 'optimization';
export type Language = 'ja' | 'en';
export type Region = 'japan' | 'asia' | 'global';

// ============================================================================
// Business Idea Structure
// ============================================================================

export interface BusinessIdea {
  readonly id: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly category: string;
  readonly riskLevel: RiskLevel;
  readonly businessScale: BusinessScale;
  readonly estimatedProfitJPY: number; // ≥10B JPY requirement
  readonly timeToMarket: string;
  readonly confidence: 'low' | 'medium' | 'high';
  readonly uniqueness: 'low' | 'medium' | 'high';
  readonly marketFit: 'poor' | 'fair' | 'good' | 'excellent';
  readonly businessModel: BusinessModel;
  readonly valueProposition: ValueProposition;
  readonly marketPositioning: MarketPositioning;
  readonly technicalRequirements: TechnicalRequirements;
  readonly implementationRoadmap: ImplementationRoadmap;
  readonly mitsubishiSynergy: MitsubishiSynergy;
  readonly competitiveAnalysis: CompetitiveAnalysis;
  readonly riskAssessment: RiskAssessment;
  readonly metadata: IdeaMetadata;
}

// ============================================================================
// Business Model
// ============================================================================

export interface BusinessModel {
  readonly primaryRevenue: string;
  readonly secondaryRevenue: string[];
  readonly costStructure: string[];
  readonly keyResources: string[];
  readonly keyPartners: string[];
  readonly customerSegments: string[];
  readonly channels: string[];
  readonly scalabilityFactors: string[];
}

// ============================================================================
// Value Proposition
// ============================================================================

export interface ValueProposition {
  readonly coreValue: string;
  readonly customerPainPoints: string[];
  readonly solutionOffering: string[];
  readonly competitiveDifferentiators: string[];
  readonly expectedOutcomes: string[];
  readonly measureableImpact: string[];
}

// ============================================================================
// Market Positioning
// ============================================================================

export interface MarketPositioning {
  readonly targetMarket: string;
  readonly marketSize: string;
  readonly marketGrowthRate: string;
  readonly competitivePosition: 'first_mover' | 'fast_follower' | 'challenger' | 'niche_leader';
  readonly pricingStrategy: string;
  readonly goToMarketStrategy: string;
  readonly marketingApproach: string[];
  readonly barriers: string[];
  readonly opportunities: string[];
}

// ============================================================================
// Technical Requirements
// ============================================================================

export interface TechnicalRequirements {
  readonly coreTechnologies: string[];
  readonly infrastructureNeeds: string[];
  readonly skillRequirements: string[];
  readonly developmentTimeline: string;
  readonly technicalRisks: string[];
  readonly scalabilityRequirements: string[];
  readonly securityConsiderations: string[];
  readonly complianceRequirements: string[];
}

// ============================================================================
// Implementation Roadmap
// ============================================================================

export interface ImplementationRoadmap {
  readonly foundation: RoadmapStage;
  readonly expansion: RoadmapStage;
  readonly optimization: RoadmapStage;
  readonly totalTimeline: string;
  readonly majorMilestones: Milestone[];
  readonly criticalPath: string[];
  readonly resourceRequirements: ResourceRequirement[];
}

export interface RoadmapStage {
  readonly duration: string;
  readonly objectives: string[];
  readonly deliverables: string[];
  readonly keyActivities: string[];
  readonly requiredResources: string[];
  readonly successMetrics: string[];
  readonly risks: string[];
}

export interface Milestone {
  readonly name: string;
  readonly timeline: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly successCriteria: string[];
}

export interface ResourceRequirement {
  readonly type: 'human' | 'financial' | 'technological' | 'partnership';
  readonly description: string;
  readonly quantity: string;
  readonly timeline: string;
  readonly criticality: 'low' | 'medium' | 'high';
}

// ============================================================================
// Mitsubishi Estate Synergy
// ============================================================================

export interface MitsubishiSynergy {
  readonly overallFit: number; // 1-10
  readonly existingAssetUtilization: AssetUtilization[];
  readonly brandSynergy: string[];
  readonly networkEffects: string[];
  readonly operationalSynergies: string[];
  readonly strategicAdvantages: string[];
  readonly riskMitigation: string[];
  readonly synergyScore: SynergyScore;
}

export interface AssetUtilization {
  readonly assetType: 'real_estate' | 'tenant_network' | 'brand' | 'operations' | 'technology';
  readonly specificAsset: string;
  readonly utilizationMethod: string;
  readonly expectedBenefit: string;
  readonly implementationComplexity: 'low' | 'medium' | 'high';
}

export interface SynergyScore {
  readonly realEstate: number; // 1-10
  readonly tenantNetwork: number; // 1-10
  readonly brandLeverage: number; // 1-10
  readonly operationalIntegration: number; // 1-10
  readonly strategicAlignment: number; // 1-10
  readonly riskReduction: number; // 1-10
}

// ============================================================================
// Competitive Analysis
// ============================================================================

export interface CompetitiveAnalysis {
  readonly mainCompetitors: Competitor[];
  readonly competitiveAdvantages: string[];
  readonly competitiveThreats: string[];
  readonly marketDifferentiation: string[];
  readonly competitiveLandscape: string;
  readonly entryBarriers: string[];
  readonly competitiveStrategy: string;
}

export interface Competitor {
  readonly name: string;
  readonly type: 'direct' | 'indirect' | 'substitute';
  readonly marketShare: string;
  readonly strengths: string[];
  readonly weaknesses: string[];
  readonly strategy: string;
  readonly threat_level: 'low' | 'medium' | 'high';
}

// ============================================================================
// Risk Assessment
// ============================================================================

export interface RiskAssessment {
  readonly marketRisks: Risk[];
  readonly technicalRisks: Risk[];
  readonly operationalRisks: Risk[];
  readonly financialRisks: Risk[];
  readonly regulatoryRisks: Risk[];
  readonly competitiveRisks: Risk[];
  readonly mitigationStrategies: string[];
  readonly overallRiskLevel: RiskLevel;
}

export interface Risk {
  readonly type: string;
  readonly description: string;
  readonly probability: 'low' | 'medium' | 'high';
  readonly impact: 'low' | 'medium' | 'high';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly mitigation: string;
  readonly contingency: string;
}

// ============================================================================
// Metadata
// ============================================================================

export interface IdeaMetadata {
  readonly generatedAt: string;
  readonly sourceResearchData: string[];
  readonly confidenceFactors: string[];
  readonly assumptions: string[];
  readonly keyDataSources: string[];
  readonly validationStatus: 'draft' | 'reviewed' | 'validated' | 'approved';
  readonly lastUpdated: string;
  readonly version: string;
}

// ============================================================================
// Ideation Request & Response
// ============================================================================

export interface IdeationRequest {
  readonly userInput: string;
  readonly researchData: any; // From Enhanced Researcher Agent
  readonly preferences: IdeationPreferences;
  readonly constraints: IdeationConstraints;
  readonly language: Language;
  readonly region: Region;
}

export interface IdeationPreferences {
  readonly riskBalance: RiskBalance;
  readonly focusAreas: string[];
  readonly businessScales: BusinessScale[];
  readonly timeHorizon: 'short_term' | 'medium_term' | 'long_term';
  readonly innovationLevel: 'incremental' | 'breakthrough' | 'disruptive';
  readonly prioritizeSynergy: boolean;
}

export interface RiskBalance {
  readonly conservative: number; // 0-1
  readonly balanced: number; // 0-1
  readonly challenging: number; // 0-1
  readonly disruptive: number; // 0-1
}

export interface IdeationConstraints {
  readonly minProfitJPY: number; // Default: 10B
  readonly maxTimeToMarket: string;
  readonly requiredSynergyScore: number; // 1-10
  readonly excludedCategories: string[];
  readonly mandatoryRequirements: string[];
  readonly budgetConstraints: BudgetConstraint[];
}

export interface BudgetConstraint {
  readonly type: 'development' | 'marketing' | 'operations' | 'total';
  readonly maxAmount: number;
  readonly currency: 'JPY' | 'USD';
  readonly timeline: string;
}

// ============================================================================
// Ideation Result
// ============================================================================

export interface IdeationResult {
  readonly requestId: string;
  readonly businessIdeas: BusinessIdea[];
  readonly summary: IdeationSummary;
  readonly qualityMetrics: QualityMetrics;
  readonly recommendations: string[];
  readonly nextSteps: string[];
  readonly metadata: ResultMetadata;
}

export interface IdeationSummary {
  readonly totalIdeas: number;
  readonly riskDistribution: Record<RiskLevel, number>;
  readonly scaleDistribution: Record<BusinessScale, number>;
  readonly averageConfidence: number;
  readonly averageSynergyScore: number;
  readonly topCategories: string[];
  readonly estimatedTotalProfit: number;
  readonly averageTimeToMarket: string;
}

export interface QualityMetrics {
  readonly originality: number; // 1-10
  readonly feasibility: number; // 1-10
  readonly marketViability: number; // 1-10
  readonly synergyAlignment: number; // 1-10
  readonly competitiveAdvantage: number; // 1-10
  readonly riskBalance: number; // 1-10
  readonly overallQuality: number; // 1-10
}

export interface ResultMetadata {
  readonly executionTime: number; // milliseconds
  readonly dataSourcesUsed: string[];
  readonly processingSteps: string[];
  readonly qualityChecks: QualityCheck[];
  readonly generationParameters: GenerationParameters;
  readonly timestamp: string;
}

export interface QualityCheck {
  readonly checkType: string;
  readonly status: 'passed' | 'failed' | 'warning';
  readonly details: string;
  readonly score?: number;
}

export interface GenerationParameters {
  readonly targetIdeaCount: number;
  readonly diversityWeight: number;
  readonly synergyWeight: number;
  readonly innovationWeight: number;
  readonly feasibilityWeight: number;
  readonly algorithmVersion: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface IdeatorConfig {
  readonly generation: GenerationConfig;
  readonly filtering: FilteringConfig;
  readonly mitsubishi: MitsubishiConfig;
  readonly quality: QualityConfig;
  readonly output: OutputConfig;
}

export interface GenerationConfig {
  readonly defaultIdeaCount: number;
  readonly maxIdeaCount: number;
  readonly minIdeaCount: number;
  readonly diversityThreshold: number;
  readonly creativityLevel: number;
  readonly iterationLimit: number;
}

export interface FilteringConfig {
  readonly minProfitThreshold: number;
  readonly minSynergyScore: number;
  readonly maxRiskLevel: RiskLevel;
  readonly requiredUniqueness: 'low' | 'medium' | 'high';
  readonly feasibilityThreshold: number;
}

export interface MitsubishiConfig {
  readonly business_portfolio: BusinessPortfolio;
  readonly network_assets: NetworkAssets;
  readonly core_capabilities: CoreCapabilities;
  readonly strategic_priorities: string[];
  readonly brand_values: string[];
}

// 事業ポートフォリオの型定義
export interface BusinessPortfolio {
  readonly [key: string]: BusinessCategory;
}

export interface BusinessCategory {
  readonly name: string;
  readonly description: string;
  readonly businesses: {
    readonly [key: string]: BusinessUnit;
  };
}

export interface BusinessUnit {
  readonly name: string;
  readonly description: string;
  readonly scale: string;
  readonly key_features: string[];
  readonly synergy_potential: number;
}

// ネットワーク資産の型定義
export interface NetworkAssets {
  readonly [key: string]: NetworkCategory;
}

export interface NetworkCategory {
  readonly name: string;
  readonly description: string;
  readonly networks: {
    readonly [key: string]: NetworkUnit;
  };
}

export interface NetworkUnit {
  readonly name: string;
  readonly description: string;
  readonly composition: string[];
  readonly relationship_depth: string;
  readonly business_potential: string[];
  readonly synergy_potential: number;
}

// コアケイパビリティの型定義
export interface CoreCapabilities {
  readonly [key: string]: MajorCapability;
}

export interface MajorCapability {
  readonly name: string;
  readonly description: string;
  readonly strength_level: number;
  readonly capabilities: {
    readonly [key: string]: MiddleCapability;
  };
}

export interface MiddleCapability {
  readonly name: string;
  readonly description: string;
  readonly strength_level: number;
  readonly sub_capabilities: {
    readonly [key: string]: SubCapability;
  };
}

export interface SubCapability {
  readonly name: string;
  readonly description: string;
  readonly strength_level: number;
  readonly specific_skills: string[];
}

// 旧型定義（後方互換性のため残す）
export interface MitsubishiAsset {
  readonly type: 'real_estate' | 'tenant_network' | 'brand' | 'operations' | 'technology';
  readonly name: string;
  readonly description: string;
  readonly location?: string;
  readonly capacity?: string;
  readonly attributes: string[];
  readonly synergyPotential: number; // 1-10
}

export interface QualityConfig {
  readonly enableQualityChecks: boolean;
  readonly minQualityScore: number;
  readonly qualityWeights: QualityWeights;
  readonly validationCriteria: ValidationCriteria;
}

export interface QualityWeights {
  readonly originality: number;
  readonly feasibility: number;
  readonly marketViability: number;
  readonly synergyAlignment: number;
  readonly competitiveAdvantage: number;
  readonly riskBalance: number;
}

export interface ValidationCriteria {
  readonly minMarketSize: string;
  readonly maxTimeToMarket: string;
  readonly requiredTechnologies: string[];
  readonly prohibitedRisks: string[];
  readonly mandatoryFeatures: string[];
}

export interface OutputConfig {
  readonly format: 'detailed' | 'summary' | 'executive';
  readonly includeRoadmap: boolean;
  readonly includeCompetitors: boolean;
  readonly includeRisks: boolean;
  readonly includeMetadata: boolean;
  readonly language: Language;
}

// ============================================================================
// Agent State & Context
// ============================================================================

export interface IdeatorState {
  readonly currentRequest?: IdeationRequest;
  readonly generatedIdeas: BusinessIdea[];
  readonly iterationCount: number;
  readonly qualityScores: number[];
  readonly processingErrors: string[];
  readonly lastExecution: string;
}

export interface IdeationContext {
  readonly researchSummary: string;
  readonly keyInsights: string[];
  readonly marketOpportunities: string[];
  readonly technologicalTrends: string[];
  readonly competitiveLandscape: string[];
  readonly regulatoryEnvironment: string[];
  readonly userConstraints: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export class IdeationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'IdeationError';
  }
}

export class ValidationError extends IdeationError {
  constructor(message: string, public readonly field: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

export class GenerationError extends IdeationError {
  constructor(message: string, context?: any) {
    super(message, 'GENERATION_ERROR', context);
  }
}

export class QualityError extends IdeationError {
  constructor(message: string, public readonly qualityScore: number, context?: any) {
    super(message, 'QUALITY_ERROR', context);
  }
}

// ============================================================================
// Exports (removed to avoid conflicts - all types are already exported inline)
// ============================================================================