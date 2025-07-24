/**
 * Specialized Researcher Agent - Configuration
 * 専門分野別調査エージェントの設定
 */

import { 
  SpecializedResearcherConfig, 
  DomainType,
  DomainModuleConfig 
} from './types';

// ============================================================================
// Domain Module Configurations
// ============================================================================

const MARKET_MODULE_CONFIG: DomainModuleConfig = {
  maxConcurrentRequests: 5,
  timeoutMinutes: 30,
  retryAttempts: 3,
  dataSources: [
    'market_reports',
    'industry_analysis',
    'statistical_databases',
    'trade_associations',
    'government_statistics'
  ],
  priorityWeights: {
    marketSize: 0.3,
    growthRate: 0.25,
    segments: 0.25,
    trends: 0.2
  }
};

const COMPETITOR_MODULE_CONFIG: DomainModuleConfig = {
  maxConcurrentRequests: 5,
  timeoutMinutes: 30,
  retryAttempts: 3,
  dataSources: [
    'company_websites',
    'financial_reports',
    'product_databases',
    'customer_reviews',
    'industry_news'
  ],
  priorityWeights: {
    directCompetitors: 0.4,
    competitiveLandscape: 0.3,
    benchmarking: 0.2,
    indirectCompetitors: 0.1
  }
};

const TECHNOLOGY_MODULE_CONFIG: DomainModuleConfig = {
  maxConcurrentRequests: 3,
  timeoutMinutes: 20,
  retryAttempts: 2,
  dataSources: [
    'patent_databases',
    'technical_papers',
    'github_repositories',
    'technology_blogs',
    'vendor_documentation'
  ],
  priorityWeights: {
    coreTechnologies: 0.35,
    implementationExamples: 0.3,
    technicalRequirements: 0.2,
    patents: 0.15
  }
};

const REGULATORY_MODULE_CONFIG: DomainModuleConfig = {
  maxConcurrentRequests: 2,
  timeoutMinutes: 20,
  retryAttempts: 2,
  dataSources: [
    'government_portals',
    'legal_databases',
    'regulatory_bodies',
    'compliance_guides',
    'industry_standards'
  ],
  priorityWeights: {
    applicableLaws: 0.4,
    licenses: 0.3,
    standards: 0.2,
    upcomingChanges: 0.1
  }
};

const FINANCIAL_MODULE_CONFIG: DomainModuleConfig = {
  maxConcurrentRequests: 3,
  timeoutMinutes: 25,
  retryAttempts: 2,
  dataSources: [
    'financial_databases',
    'investment_reports',
    'venture_capital_data',
    'market_analytics',
    'economic_indicators'
  ],
  priorityWeights: {
    revenueProjections: 0.3,
    fundingOptions: 0.25,
    costStructure: 0.25,
    investmentEnvironment: 0.2
  }
};

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: SpecializedResearcherConfig = {
  domains: {
    market: MARKET_MODULE_CONFIG,
    competitor: COMPETITOR_MODULE_CONFIG,
    technology: TECHNOLOGY_MODULE_CONFIG,
    regulatory: REGULATORY_MODULE_CONFIG,
    financial: FINANCIAL_MODULE_CONFIG
  },
  execution: {
    parallel: true,
    maxConcurrentDomains: 3,
    failureStrategy: 'continue_on_error'
  },
  output: {
    includeRawData: false,
    summaryDepth: 'detailed'
  }
};

// ============================================================================
// Domain Priority Configuration (市場と競合を優先)
// ============================================================================

export const DOMAIN_PRIORITIES: Record<DomainType, number> = {
  market: 1.0,      // 最高優先度
  competitor: 0.9,  // 高優先度
  technology: 0.6,
  financial: 0.5,
  regulatory: 0.4
};

// ============================================================================
// Research Category to Domain Mapping
// ============================================================================

export const CATEGORY_TO_DOMAIN_MAPPING: Record<string, DomainType[]> = {
  'target_customer': ['market', 'competitor'],
  'solution_technology': ['technology', 'competitor'],
  'market_competition': ['market', 'competitor'],
  'risk_analysis': ['regulatory', 'financial', 'competitor'],
  'execution_planning': ['financial', 'regulatory', 'technology']
};

// ============================================================================
// Data Source Templates
// ============================================================================

export const DATA_SOURCE_TEMPLATES = {
  market_reports: {
    searchQueries: [
      '{industry} market size {year}',
      '{industry} market forecast',
      '{industry} market segmentation',
      '{industry} growth trends'
    ],
    requiredFields: ['marketSize', 'growthRate', 'segments']
  },
  company_websites: {
    searchQueries: [
      '{company} products services',
      '{company} pricing',
      '{company} customer reviews',
      '{company} market position'
    ],
    requiredFields: ['products', 'pricing', 'marketPosition']
  },
  patent_databases: {
    searchQueries: [
      '{technology} patents',
      '{technology} intellectual property',
      '{technology} patent landscape',
      '{technology} patent holders'
    ],
    requiredFields: ['patentTitle', 'holder', 'filingDate']
  }
};

// ============================================================================
// Execution Messages
// ============================================================================

export const EXECUTION_MESSAGES = {
  START: '🚀 Specialized Research execution started',
  DOMAIN_START: '🔍 Starting {domain} investigation',
  DOMAIN_COMPLETE: '✅ {domain} investigation completed',
  DOMAIN_FAILED: '❌ {domain} investigation failed: {error}',
  TRANSFORM_START: '🔄 Transforming research data',
  TRANSFORM_COMPLETE: '✅ Data transformation completed',
  COMPLETE: '🎯 Specialized Research completed successfully',
  PARTIAL: '⚠️ Specialized Research completed with some failures',
  FAILED: '❌ Specialized Research failed'
};

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION_RULES = {
  minResearchItems: 1,
  maxResearchItems: 50,
  minConfidence: 0.6,
  requiredDomains: ['market', 'competitor'] as DomainType[],
  minDataPoints: {
    market: 5,
    competitor: 3,
    technology: 3,
    regulatory: 2,
    financial: 3
  }
};