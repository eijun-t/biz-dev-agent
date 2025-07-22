/**
 * Enhanced Researcher Agent - Main Export
 * 包括的情報収集エージェントのメインエクスポート
 */

// メインクラス
export { EnhancedResearcherAgent } from './enhanced-researcher';

// 型定義
export type {
  ResearchCategory,
  DataSourceType,
  Language,
  Region,
  QualityLevel,
  ResearchRequest,
  EnhancedResearchItem,
  DataCollectionResult,
  CategorySummary,
  KnowledgeBase,
  ModuleExecutionResult,
  CostMonitor,
  PerformanceMetrics,
  EnhancedResearcherConfig
} from './enhanced-researcher-types';

// 設定とコンフィグ
export {
  DEFAULT_CONFIG,
  RESEARCH_MODULES,
  CATEGORY_KEYWORDS,
  CATEGORY_SOURCE_PRIORITY,
  MITSUBISHI_SYNERGY_KEYWORDS,
  ERROR_CODES
} from './enhanced-researcher-config';

// コンポーネント
export { CacheManager } from './cache-manager';
export { CostMonitoringSystem } from './cost-monitor';
export { KnowledgeAggregator } from './knowledge-aggregator';
export { DataSourceFactory } from './data-source-modules';

// 使用例
export const createEnhancedResearcher = (
  apiKeys: Record<string, string> = {},
  config: any = {}
) => {
  return new EnhancedResearcherAgent(config, {
    serper: process.env.SERPER_API_KEY || apiKeys.serper || '',
    openai: process.env.OPENAI_API_KEY || apiKeys.openai || '',
    estat: process.env.ESTAT_API_KEY || apiKeys.estat || '',
    ...apiKeys
  });
};