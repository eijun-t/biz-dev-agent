/**
 * Specialized Researcher Agent - Public API
 * 専門分野別調査エージェントの公開API
 */

// Main agent
export { SpecializedResearcherAgent } from './specialized-researcher';

// Types
export {
  // Core types
  DomainType,
  SpecializedResearchRequest,
  SpecializedResearchOutput,
  DomainResearchResult,
  DomainResearchItem,
  ResearchMetadata,
  
  // Domain-specific findings
  DomainFindings,
  MarketFindings,
  CompetitorFindings,
  TechnologyFindings,
  RegulatoryFindings,
  FinancialFindings,
  
  // Configuration
  SpecializedResearcherConfig,
  DomainModuleConfig,
  
  // Errors
  SpecializedResearchError,
  DomainExecutionError,
  DataTransformationError
} from './types';

// Configuration
export {
  DEFAULT_CONFIG,
  DOMAIN_PRIORITIES,
  CATEGORY_TO_DOMAIN_MAPPING
} from './config';

// Domain modules (for advanced usage)
export { MarketInvestigator } from './domain-modules/market-investigator';
export { CompetitorInvestigator } from './domain-modules/competitor-investigator';
export { TechnologyInvestigator } from './domain-modules/technology-investigator';
export { RegulatoryInvestigator } from './domain-modules/regulatory-investigator';
export { FinancialInvestigator } from './domain-modules/financial-investigator';

// Data transformer (for advanced usage)
export { DataTransformer } from './verification/data-transformer';