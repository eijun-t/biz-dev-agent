/**
 * Enhanced Analyst Agent - Public API
 * Writer向けレポートセクション生成エージェントの公開API
 */

// Main agent
export { EnhancedAnalystAgent } from './enhanced-analyst';

// Types
export {
  // Input/Output types
  AnalystInput,
  EnhancedAnalystOutput,
  
  // Section types
  ExecutiveSummary,
  TargetAndChallenges,
  SolutionAnalysis,
  MarketCompetitiveAnalysis,
  MitsubishiEstateValue,
  ValidationPlan,
  RiskAnalysis,
  
  // Configuration
  EnhancedAnalystConfig,
  
  // Error types
  EnhancedAnalystError,
  DataExtractionError,
  AnalysisError
} from './types';

// Utilities (for advanced usage)
export { DataExtractor } from './data-extractor';
export { SectionAnalyzers } from './section-analyzers';

// Helper function for easy integration
export function createEnhancedAnalyst(config?: any) {
  return new EnhancedAnalystAgent(config);
}