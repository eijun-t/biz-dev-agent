/**
 * Cache Manager for Enhanced Researcher Agent
 * 軽量キャッシング機能とリアルタイム更新ロジック
 */

import { 
  CacheEntry, 
  ResearchCategory, 
  DataCollectionResult 
} from './enhanced-researcher-types';

// キャッシュ統計
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictedCount: number;
  hitRate: number;
  lastCleaned: string;
}

// LRU キャッシュエントリ
interface LRUCacheEntry extends CacheEntry {
  accessTime: number;
  priority: number;
}

export class CacheManager {
  private cache: Map<string, LRUCacheEntry>;
  private maxSize: number;
  private defaultTtl: number;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // カテゴリ別TTL設定（秒）
  private categoryTtl: Record<ResearchCategory, number> = {
    market_trends: 3600,      // 1時間
    technology: 7200,         // 2時間
    investment: 1800,         // 30分（変動が激しい）
    regulation: 86400,        // 24時間（比較的安定）
    consumer_behavior: 3600,  // 1時間
    competition: 3600,        // 1時間
    macroeconomics: 1800      // 30分（変動が激しい）
  };

  // リアルタイム更新対象カテゴリ
  private realTimeCategories: Set<ResearchCategory> = new Set([
    'investment',
    'macroeconomics'
  ]);

  constructor(maxSize: number = 100 * 1024 * 1024, defaultTtl: number = 3600) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictedCount: 0,
      hitRate: 0,
      lastCleaned: new Date().toISOString()
    };

    // 定期クリーンアップ（5分ごと）
    this.startCleanupTimer();
  }

  /**
   * キャッシュキーを生成
   */
  private generateKey(
    category: ResearchCategory, 
    query: string, 
    language: string, 
    region: string
  ): string {
    const normalized = query.toLowerCase().trim();
    return `${category}:${language}:${region}:${normalized}`;
  }

  /**
   * データサイズを概算
   */
  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // 文字数 × 2バイト
  }

  /**
   * TTLを取得（カテゴリ別）
   */
  private getTtl(category: ResearchCategory): number {
    return this.categoryTtl[category] || this.defaultTtl;
  }

  /**
   * リアルタイム更新対象かチェック
   */
  private isRealTimeCategory(category: ResearchCategory): boolean {
    return this.realTimeCategories.has(category);
  }

  /**
   * キャッシュから取得
   */
  get(
    category: ResearchCategory, 
    query: string, 
    language: string, 
    region: string
  ): DataCollectionResult[] | null {
    const key = this.generateKey(category, query, language, region);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // 有効期限チェック
    const now = Date.now();
    if (now > new Date(entry.expiresAt).getTime()) {
      this.cache.delete(key);
      this.stats.missCount++;
      this.stats.evictedCount++;
      this.updateStats();
      return null;
    }

    // リアルタイム更新対象の場合、TTLを短縮
    if (this.isRealTimeCategory(category)) {
      const realTimeTtl = this.getTtl(category) / 4; // 通常の1/4
      const realTimeExpiry = new Date(entry.createdAt).getTime() + (realTimeTtl * 1000);
      
      if (now > realTimeExpiry) {
        this.cache.delete(key);
        this.stats.missCount++;
        this.stats.evictedCount++;
        this.updateStats();
        return null;
      }
    }

    // アクセス時間を更新（LRU用）
    entry.accessTime = now;
    entry.hits++;
    this.cache.set(key, entry);

    this.stats.hitCount++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * キャッシュに保存
   */
  set(
    category: ResearchCategory,
    query: string,
    language: string,
    region: string,
    data: DataCollectionResult[],
    priority: number = 5
  ): boolean {
    const key = this.generateKey(category, query, language, region);
    const now = Date.now();
    const ttl = this.getTtl(category);
    const size = this.estimateSize(data);

    // サイズ制限チェック
    if (size > this.maxSize / 10) { // 最大キャッシュサイズの10%を超える場合は保存しない
      console.warn(`Cache entry too large: ${size} bytes`);
      return false;
    }

    // 容量チェック・クリーンアップ
    this.ensureCapacity(size);

    const entry: LRUCacheEntry = {
      key,
      data,
      category,
      ttl,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl * 1000).toISOString(),
      hits: 0,
      size,
      accessTime: now,
      priority
    };

    this.cache.set(key, entry);
    this.updateStats();

    return true;
  }

  /**
   * 容量確保（LRU + 優先度による退避）
   */
  private ensureCapacity(newEntrySize: number): void {
    const targetSize = this.maxSize - newEntrySize;
    
    while (this.stats.totalSize > targetSize && this.cache.size > 0) {
      // LRUアルゴリズム + 優先度考慮
      let oldestEntry: [string, LRUCacheEntry] | null = null;
      let oldestScore = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        // スコア = アクセス時間の古さ / 優先度
        const ageScore = (Date.now() - entry.accessTime) / (entry.priority || 1);
        
        if (ageScore < oldestScore) {
          oldestScore = ageScore;
          oldestEntry = [key, entry];
        }
      }

      if (oldestEntry) {
        this.cache.delete(oldestEntry[0]);
        this.stats.evictedCount++;
      } else {
        break;
      }
    }
  }

  /**
   * 期限切れエントリをクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > new Date(entry.expiresAt).getTime()) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictedCount++;
    });

    this.updateStats();
    this.stats.lastCleaned = new Date().toISOString();

    console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
  }

  /**
   * 統計更新
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    this.updateHitRate();
  }

  /**
   * ヒット率更新
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }

  /**
   * クリーンアップタイマー開始
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5分ごと
  }

  /**
   * 特定カテゴリのキャッシュを無効化
   */
  invalidateCategory(category: ResearchCategory): number {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.category === category) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      invalidatedCount++;
    });

    this.updateStats();
    console.log(`Invalidated ${invalidatedCount} entries for category: ${category}`);

    return invalidatedCount;
  }

  /**
   * 特定キーのキャッシュを無効化
   */
  invalidate(category: ResearchCategory, query: string, language: string, region: string): boolean {
    const key = this.generateKey(category, query, language, region);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.updateStats();
    }
    
    return deleted;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictedCount: 0,
      hitRate: 0,
      lastCleaned: new Date().toISOString()
    };
  }

  /**
   * 統計情報を取得
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * キャッシュ使用量詳細を取得
   */
  getUsageDetails(): {
    totalSize: number;
    maxSize: number;
    usagePercent: number;
    entryCount: number;
    categoryBreakdown: Record<ResearchCategory, number>;
    topEntries: Array<{key: string; hits: number; size: number; age: number}>;
  } {
    this.updateStats();
    
    const categoryBreakdown: Record<ResearchCategory, number> = {
      market_trends: 0,
      technology: 0,
      investment: 0,
      regulation: 0,
      consumer_behavior: 0,
      competition: 0,
      macroeconomics: 0
    };

    const entries: Array<{key: string; hits: number; size: number; age: number}> = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      categoryBreakdown[entry.category]++;
      entries.push({
        key,
        hits: entry.hits,
        size: entry.size,
        age: now - new Date(entry.createdAt).getTime()
      });
    }

    // ヒット数でソート
    entries.sort((a, b) => b.hits - a.hits);

    return {
      totalSize: this.stats.totalSize,
      maxSize: this.maxSize,
      usagePercent: (this.stats.totalSize / this.maxSize) * 100,
      entryCount: this.stats.totalEntries,
      categoryBreakdown,
      topEntries: entries.slice(0, 10)
    };
  }

  /**
   * TTL設定を更新
   */
  updateTtl(category: ResearchCategory, ttl: number): void {
    this.categoryTtl[category] = ttl;
  }

  /**
   * リアルタイム更新カテゴリを設定
   */
  setRealTimeCategories(categories: ResearchCategory[]): void {
    this.realTimeCategories.clear();
    categories.forEach(category => this.realTimeCategories.add(category));
  }

  /**
   * クリーンアップタイマー停止
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * キャッシュエクスポート（バックアップ用）
   */
  export(): Array<{key: string; entry: LRUCacheEntry}> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry
    }));
  }

  /**
   * キャッシュインポート（復元用）
   */
  import(data: Array<{key: string; entry: LRUCacheEntry}>): number {
    let importedCount = 0;
    const now = Date.now();

    for (const {key, entry} of data) {
      // 有効期限チェック
      if (now <= new Date(entry.expiresAt).getTime()) {
        this.cache.set(key, entry);
        importedCount++;
      }
    }

    this.updateStats();
    return importedCount;
  }
}