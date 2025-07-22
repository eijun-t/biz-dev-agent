/**
 * Enhanced Researcher Agent - Main Implementation
 * 包括的情報収集エージェントのメイン実装
 */

import {
  ResearchRequest,
  EnhancedResearchItem,
  ModuleExecutionResult,
  KnowledgeBase,
  ResearchCategory,
  Language,
  Region,
  PerformanceMetrics,
  EnhancedResearcherConfig
} from './enhanced-researcher-types';

import { 
  DEFAULT_CONFIG,
  RESEARCH_MODULES,
  CATEGORY_KEYWORDS,
  CATEGORY_SOURCE_PRIORITY 
} from './enhanced-researcher-config';

import { DataSourceFactory, BaseDataSource } from './data-source-modules';
import { CacheManager } from './cache-manager';
import { CostMonitoringSystem } from './cost-monitor';
import { KnowledgeAggregator } from './knowledge-aggregator';

export class EnhancedResearcherAgent {
  private config: EnhancedResearcherConfig;
  private dataSources: Map<string, BaseDataSource>;
  private cacheManager: CacheManager;
  private costMonitor: CostMonitoringSystem;
  private knowledgeAggregator: KnowledgeAggregator;
  private apiKeys: Record<string, string>;

  constructor(
    config: Partial<EnhancedResearcherConfig> = {},
    apiKeys: Record<string, string> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.apiKeys = {
      serper: process.env.SERPER_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      estat: process.env.ESTAT_API_KEY || '',
      ...apiKeys
    };

    this.initializeComponents();
  }

  /**
   * コンポーネント初期化
   */
  private initializeComponents(): void {
    // データソース初期化
    this.dataSources = new Map();
    for (const [sourceName, sourceConfig] of Object.entries(this.config.dataSources)) {
      if (sourceConfig.isEnabled) {
        try {
          const dataSource = DataSourceFactory.createDataSource(sourceConfig, this.apiKeys);
          this.dataSources.set(sourceName, dataSource);
        } catch (error) {
          console.warn(`Failed to initialize data source ${sourceName}:`, error);
        }
      }
    }

    // キャッシュマネージャー初期化
    this.cacheManager = new CacheManager(
      this.config.cacheConfig.maxSize,
      this.config.cacheConfig.defaultTtl
    );

    // コスト監視システム初期化
    this.costMonitor = new CostMonitoringSystem(
      this.config.costConfig.monthlyBudget,
      this.config.costConfig.alertThreshold
    );

    // ナレッジ集約器初期化
    this.knowledgeAggregator = new KnowledgeAggregator();

    console.log(`Enhanced Researcher Agent initialized with ${this.dataSources.size} data sources`);
  }

  /**
   * 包括的調査実行
   */
  async executeComprehensiveResearch(
    userInput: string,
    targetCategories: ResearchCategory[] = Object.keys(CATEGORY_KEYWORDS) as ResearchCategory[],
    language: Language = this.config.defaultLanguage,
    region: Region = this.config.defaultRegion,
    maxResults: number = 10
  ): Promise<KnowledgeBase> {
    const startTime = Date.now();
    const requestId = `research_${Date.now()}`;

    console.log(`🔍 Starting comprehensive research: "${userInput}"`);
    console.log(`📊 Target categories: ${targetCategories.join(', ')}`);

    try {
      // 1. 調査リクエスト作成
      const researchRequest: ResearchRequest = {
        id: requestId,
        userInput,
        targetCategories,
        language,
        region,
        maxResults,
        createdAt: new Date().toISOString()
      };

      // 2. 調査項目生成
      const researchItems = await this.generateResearchItems(researchRequest);
      console.log(`📝 Generated ${researchItems.length} research items`);

      // 3. カテゴリ別並列実行
      const moduleResults = await this.executeModulesInParallel(researchItems);
      console.log(`✅ Completed ${moduleResults.length} module executions`);

      // 4. ナレッジベース生成
      const knowledgeBase = await this.knowledgeAggregator.generateKnowledgeBase(
        requestId,
        userInput,
        moduleResults,
        language
      );

      // 5. パフォーマンスメトリクス記録
      const metrics = this.generatePerformanceMetrics(requestId, startTime, moduleResults);
      console.log(`📈 Research completed in ${metrics.totalExecutionTime}s`);

      return knowledgeBase;

    } catch (error) {
      console.error('Comprehensive research failed:', error);
      throw error;
    }
  }

  /**
   * 調査項目生成
   */
  private async generateResearchItems(request: ResearchRequest): Promise<EnhancedResearchItem[]> {
    const items: EnhancedResearchItem[] = [];

    for (const category of request.targetCategories) {
      // カテゴリ別キーワード取得
      const keywords = CATEGORY_KEYWORDS[category]?.[request.language] || [];
      
      // クエリ生成（ユーザー入力 + カテゴリキーワード）
      const queries = this.generateQueries(request.userInput, keywords, category);

      // 調査アイテム作成
      for (let i = 0; i < Math.min(queries.length, 3); i++) { // カテゴリごと最大3クエリ
        const item: EnhancedResearchItem = {
          id: `item_${category}_${i}_${Date.now()}`,
          requestId: request.id,
          category,
          topic: queries[i],
          keywords: keywords.slice(0, 5),
          queries: [queries[i]],
          language: request.language,
          region: request.region,
          priority: this.calculateItemPriority(category, request.priorityFocus),
          estimatedCost: this.estimateCost(category),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        items.push(item);
      }
    }

    // 優先度でソート
    return items.sort((a, b) => b.priority - a.priority);
  }

  /**
   * クエリ生成
   */
  private generateQueries(userInput: string, keywords: string[], category: ResearchCategory): string[] {
    const queries: string[] = [];
    
    // 基本クエリ
    queries.push(`${userInput} ${keywords.slice(0, 3).join(' ')}`);
    
    // カテゴリ特化クエリ
    const categorySpecific = this.getCategorySpecificQueries(userInput, category);
    queries.push(...categorySpecific);

    return queries.slice(0, 3);
  }

  /**
   * カテゴリ特化クエリ生成
   */
  private getCategorySpecificQueries(userInput: string, category: ResearchCategory): string[] {
    const base = userInput;
    
    switch (category) {
      case 'market_trends':
        return [`${base} 市場規模`, `${base} 市場動向`];
      case 'technology':
        return [`${base} 技術革新`, `${base} 特許`];
      case 'investment':
        return [`${base} 投資`, `${base} 資金調達`];
      case 'regulation':
        return [`${base} 規制`, `${base} 政策`];
      case 'consumer_behavior':
        return [`${base} 消費者`, `${base} ニーズ`];
      case 'competition':
        return [`${base} 競合`, `${base} 企業戦略`];
      case 'macroeconomics':
        return [`${base} 経済`, `${base} 市場環境`];
      default:
        return [`${base} 分析`];
    }
  }

  /**
   * アイテム優先度計算
   */
  private calculateItemPriority(category: ResearchCategory, priorityFocus?: ResearchCategory): number {
    const moduleConfig = RESEARCH_MODULES.find(m => m.category === category);
    let priority = moduleConfig?.priority || 5;
    
    if (priorityFocus === category) {
      priority += 2; // 優先フォーカスカテゴリにボーナス
    }
    
    return Math.min(priority, 10);
  }

  /**
   * コスト推定
   */
  private estimateCost(category: ResearchCategory): number {
    const sources = CATEGORY_SOURCE_PRIORITY[category] || [];
    const paidSources = sources.filter(source => 
      this.config.dataSources[source]?.cost > 0
    );
    
    return paidSources.length * 10; // 基本的なコスト推定
  }

  /**
   * モジュール並列実行
   */
  private async executeModulesInParallel(items: EnhancedResearchItem[]): Promise<ModuleExecutionResult[]> {
    const results: ModuleExecutionResult[] = [];
    
    // カテゴリでグループ化
    const itemsByCategory = new Map<ResearchCategory, EnhancedResearchItem[]>();
    items.forEach(item => {
      const categoryItems = itemsByCategory.get(item.category) || [];
      categoryItems.push(item);
      itemsByCategory.set(item.category, categoryItems);
    });

    // 並列実行用のPromise配列
    const promises: Promise<ModuleExecutionResult>[] = [];

    for (const [category, categoryItems] of itemsByCategory) {
      promises.push(this.executeModuleForCategory(category, categoryItems));
    }

    // 並列実行（最大同時実行数を制限）
    const batchSize = this.config.maxParallelRequests;
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Module execution failed:', result.reason);
          // 失敗したモジュールのデフォルト結果を作成
          results.push(this.createFailedModuleResult(result.reason));
        }
      });
    }

    return results;
  }

  /**
   * カテゴリ別モジュール実行
   */
  private async executeModuleForCategory(
    category: ResearchCategory,
    items: EnhancedResearchItem[]
  ): Promise<ModuleExecutionResult> {
    const startTime = Date.now();
    let totalCost = 0;

    console.log(`🔍 Executing ${category} module with ${items.length} items`);

    try {
      const allResults = [];
      
      for (const item of items) {
        // キャッシュチェック
        const cachedResults = this.cacheManager.get(
          category, 
          item.topic, 
          item.language, 
          item.region
        );

        if (cachedResults) {
          console.log(`💾 Cache hit for ${category}: ${item.topic}`);
          allResults.push(...cachedResults);
          continue;
        }

        // データソース実行
        const itemResults = await this.executeDataSourcesForItem(item);
        allResults.push(...itemResults);

        // キャッシュに保存
        if (itemResults.length > 0) {
          this.cacheManager.set(
            category,
            item.topic,
            item.language,
            item.region,
            itemResults,
            item.priority
          );
        }

        // コスト記録
        const itemCost = this.costMonitor.recordUsage(
          'news', // 簡略化
          'multiple_sources',
          itemResults.length,
          category,
          item.language,
          item.region
        );
        totalCost += itemCost;
      }

      const executionTime = Date.now() - startTime;

      return {
        module: category,
        success: true,
        results: allResults,
        summary: await this.generateCategorySummary(category, allResults),
        executionTime,
        cost: totalCost
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Module ${category} failed:`, error);

      return {
        module: category,
        success: false,
        results: [],
        summary: this.createDefaultSummary(category),
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        cost: totalCost
      };
    }
  }

  /**
   * アイテム用データソース実行
   */
  private async executeDataSourcesForItem(item: EnhancedResearchItem) {
    const results = [];
    const prioritySources = CATEGORY_SOURCE_PRIORITY[item.category] || [];

    for (const sourceName of prioritySources.slice(0, 3)) { // 上位3ソースを使用
      const dataSource = this.dataSources.get(sourceName);
      if (!dataSource) continue;

      // コストチェック
      const costCheck = this.costMonitor.canAffordRequest(sourceName, 1);
      if (!costCheck.canAfford) {
        console.warn(`Skipping ${sourceName}: ${costCheck.reason}`);
        continue;
      }

      try {
        const sourceResults = await dataSource.search(
          item.topic,
          item.language,
          item.region,
          5 // ソースごとに最大5件
        );

        sourceResults.forEach(result => {
          result.researchItemId = item.id;
        });

        results.push(...sourceResults);
        
        // 品質が高い結果が得られた場合は他のソースをスキップ
        if (sourceResults.length > 0 && sourceResults[0].qualityScore >= 8) {
          break;
        }
      } catch (error) {
        console.warn(`Data source ${sourceName} failed:`, error);
      }
    }

    return results;
  }

  /**
   * パフォーマンスメトリクス生成
   */
  private generatePerformanceMetrics(
    requestId: string,
    startTime: number,
    moduleResults: ModuleExecutionResult[]
  ): PerformanceMetrics {
    const totalExecutionTime = (Date.now() - startTime) / 1000;
    
    const moduleExecutionTimes: Record<ResearchCategory, number> = {} as any;
    moduleResults.forEach(result => {
      moduleExecutionTimes[result.module] = result.executionTime / 1000;
    });

    const totalResults = moduleResults.reduce((sum, result) => sum + result.results.length, 0);
    const cacheStats = this.cacheManager.getStats();

    return {
      requestId,
      totalExecutionTime,
      moduleExecutionTimes,
      dataSourceResponseTimes: {}, // 詳細実装時に追加
      cacheHitRate: cacheStats.hitRate,
      errorRate: moduleResults.filter(r => !r.success).length / moduleResults.length,
      throughput: totalResults / totalExecutionTime,
      qualityScore: this.calculateOverallQuality(moduleResults),
      costEfficiency: totalResults / moduleResults.reduce((sum, r) => sum + r.cost, 1),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 全体品質計算
   */
  private calculateOverallQuality(moduleResults: ModuleExecutionResult[]): number {
    const allResults = moduleResults.flatMap(r => r.results);
    if (allResults.length === 0) return 0;
    
    const totalQuality = allResults.reduce((sum, result) => sum + result.qualityScore, 0);
    return totalQuality / allResults.length;
  }

  /**
   * ヘルパーメソッド：失敗したモジュール結果作成
   */
  private createFailedModuleResult(error: any): ModuleExecutionResult {
    return {
      module: 'market_trends', // デフォルト
      success: false,
      results: [],
      summary: this.createDefaultSummary('market_trends'),
      error: String(error),
      executionTime: 0,
      cost: 0
    };
  }

  /**
   * ヘルパーメソッド：デフォルトサマリー作成
   */
  private createDefaultSummary(category: ResearchCategory) {
    return {
      category,
      totalResults: 0,
      averageQuality: 0,
      keyFindings: [],
      trendAnalysis: 'データ収集に失敗しました',
      businessRelevance: 0,
      mitsubishiSynergy: 0,
      riskFactors: [],
      opportunities: [],
      dataSourceBreakdown: {} as any,
      confidence: 'low' as const,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * カテゴリサマリー生成（簡略版）
   */
  private async generateCategorySummary(category: ResearchCategory, results: any[]) {
    // 実際の実装では knowledgeAggregator を使用
    return this.createDefaultSummary(category);
  }

  /**
   * リソース解放
   */
  destroy(): void {
    this.cacheManager.destroy();
    console.log('Enhanced Researcher Agent destroyed');
  }

  /**
   * 設定更新
   */
  updateConfig(newConfig: Partial<EnhancedResearcherConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Configuration updated');
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      cache: this.cacheManager.getStats(),
      cost: this.costMonitor.getCurrentStatus(),
      dataSources: this.dataSources.size,
      config: this.config
    };
  }
}