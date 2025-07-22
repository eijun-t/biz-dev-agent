/**
 * Enhanced Researcher Agent Types
 * 包括的情報収集エージェントの型定義
 */

// 調査カテゴリ（7つの主要領域）
export type ResearchCategory = 
  | 'market_trends'        // 市場動向・規模データ
  | 'technology'           // 新興技術・イノベーション
  | 'investment'           // 投資・資金調達トレンド
  | 'regulation'           // 規制・政策変化
  | 'consumer_behavior'    // 消費者行動・ニーズ変化
  | 'competition'          // 競合動向・M&A活動
  | 'macroeconomics';      // マクロ経済要因

// データソースタイプ
export type DataSourceType = 
  | 'news'               // ニュース記事
  | 'reports'            // 業界レポート
  | 'statistics'         // 統計データ
  | 'academic'           // 学術論文
  | 'social'             // ソーシャルメディア
  | 'government'         // 政府データ
  | 'corporate';         // 企業情報

// 情報品質レベル
export type QualityLevel = 'high' | 'medium' | 'low';

// 言語とリージョン
export type Language = 'ja' | 'en';
export type Region = 'japan' | 'global';

// 調査モジュールインターフェース
export interface ResearchModule {
  category: ResearchCategory;
  name: string;
  description: string;
  supportedLanguages: Language[];
  supportedRegions: Region[];
  dataSources: DataSourceConfig[];
  isEnabled: boolean;
  priority: number; // 1-10, 高いほど優先
}

// データソース設定
export interface DataSourceConfig {
  type: DataSourceType;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  timeout: number; // milliseconds
  reliability: QualityLevel;
  isEnabled: boolean;
  cost: number; // cost per request in yen
}

// 調査要求
export interface ResearchRequest {
  id: string;
  userInput: string;
  targetCategories: ResearchCategory[];
  language: Language;
  region: Region;
  maxResults: number;
  priorityFocus?: ResearchCategory;
  excludedSources?: string[];
  createdAt: string;
}

// 調査アイテム（各カテゴリでの具体的調査項目）
export interface EnhancedResearchItem {
  id: string;
  requestId: string;
  category: ResearchCategory;
  topic: string;
  keywords: string[];
  queries: string[];
  language: Language;
  region: Region;
  priority: number;
  estimatedCost: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// データ収集結果
export interface DataCollectionResult {
  id: string;
  researchItemId: string;
  sourceType: DataSourceType;
  sourceName: string;
  url?: string;
  title: string;
  content: string;
  summary: string;
  relevanceScore: number; // 1-10
  qualityScore: number; // 1-10
  publishedDate?: string;
  extractedAt: string;
  metadata: Record<string, any>;
}

// カテゴリ別サマリー
export interface CategorySummary {
  category: ResearchCategory;
  totalResults: number;
  averageQuality: number;
  keyFindings: string[];
  trendAnalysis: string;
  businessRelevance: number; // 1-10
  mitsubishiSynergy: number; // 1-10
  riskFactors: string[];
  opportunities: string[];
  dataSourceBreakdown: Record<DataSourceType, number>;
  confidence: QualityLevel;
  lastUpdated: string;
}

// 包括的ナレッジベース
export interface KnowledgeBase {
  requestId: string;
  userInput: string;
  categorySummaries: CategorySummary[];
  crossCategoryInsights: string[];
  overallBusinessPotential: number; // 1-10
  mitsubishiStrategicFit: number; // 1-10
  marketSizeEstimate: string;
  implementationComplexity: QualityLevel;
  timeToMarket: string;
  keyRisks: string[];
  keyOpportunities: string[];
  priorityRecommendations: string[];
  informationGaps: string[];
  totalDataPoints: number;
  averageDataQuality: number;
  costIncurred: number;
  executionTime: number; // seconds
  createdAt: string;
}

// モジュール実行結果
export interface ModuleExecutionResult {
  module: ResearchCategory;
  success: boolean;
  results: DataCollectionResult[];
  summary: CategorySummary;
  error?: string;
  executionTime: number;
  cost: number;
  tokensUsed?: number;
}

// エラーハンドリング
export interface ResearchError {
  code: string;
  message: string;
  category: ResearchCategory;
  source?: string;
  severity: 'low' | 'medium' | 'high';
  retryable: boolean;
  timestamp: string;
}

// キャッシュエントリ
export interface CacheEntry {
  key: string;
  data: any;
  category: ResearchCategory;
  ttl: number; // seconds
  createdAt: string;
  expiresAt: string;
  hits: number;
  size: number; // bytes
}

// コスト監視
export interface CostMonitor {
  totalSpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  costBreakdown: Record<DataSourceType, number>;
  alertThreshold: number;
  isOverBudget: boolean;
  estimatedMonthlyUsage: number;
  lastReset: string;
}

// パフォーマンスメトリクス
export interface PerformanceMetrics {
  requestId: string;
  totalExecutionTime: number;
  moduleExecutionTimes: Record<ResearchCategory, number>;
  dataSourceResponseTimes: Record<string, number>;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // items per second
  qualityScore: number;
  costEfficiency: number; // quality per yen
  timestamp: string;
}

// 設定
export interface EnhancedResearcherConfig {
  modules: ResearchModule[];
  dataSources: Record<string, DataSourceConfig>;
  defaultLanguage: Language;
  defaultRegion: Region;
  maxParallelRequests: number;
  globalTimeout: number;
  cacheConfig: {
    enabled: boolean;
    defaultTtl: number;
    maxSize: number; // bytes
    evictionPolicy: 'lru' | 'ttl';
  };
  costConfig: {
    monthlyBudget: number;
    alertThreshold: number;
    enforceLimit: boolean;
  };
  qualityConfig: {
    minRelevanceScore: number;
    minQualityScore: number;
    maxRetries: number;
  };
}