/**
 * Base Scraper Class - Core Foundation for All Data Sources
 * 既存のBaseDataSourceクラスを改良・モジュール化したバージョン
 */

export interface ScrapingConfig {
  name: string;
  timeout: number;
  rateLimit: number; // requests per minute
  reliability: 'high' | 'medium' | 'low';
  retryAttempts: number;
  userAgent?: string;
}

export interface ScrapingResult {
  id: string;
  sourceType: 'news' | 'academic' | 'social' | 'statistics' | 'general';
  sourceName: string;
  url: string;
  title: string;
  content: string;
  summary: string;
  relevanceScore: number;
  qualityScore: number;
  publishedDate?: string;
  extractedAt: string;
  metadata: Record<string, any>;
}

export interface ScrapingError {
  code: string;
  message: string;
  source: string;
  retryable: boolean;
  timestamp: string;
}

/**
 * 基底スクレイパークラス
 * 全てのデータソースの共通機能を提供
 */
export abstract class BaseScraper {
  protected config: ScrapingConfig;
  protected requestCount: number = 0;
  protected lastRequest: number = 0;

  constructor(config: ScrapingConfig) {
    this.config = {
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
  }

  /**
   * メイン検索メソッド - サブクラスで実装必須
   */
  abstract search(
    query: string, 
    options?: {
      language?: 'ja' | 'en';
      region?: 'japan' | 'us' | 'global';
      maxResults?: number;
    }
  ): Promise<ScrapingResult[]>;

  /**
   * レート制限チェック
   */
  protected checkRateLimit(): boolean {
    const now = Date.now();
    const minInterval = 60000 / this.config.rateLimit; // ms between requests
    return (now - this.lastRequest) >= minInterval;
  }

  /**
   * レート制限待機
   */
  protected async waitForRateLimit(): Promise<void> {
    if (!this.checkRateLimit()) {
      const waitTime = (60000 / this.config.rateLimit) - (Date.now() - this.lastRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * HTTPリクエスト実行（タイムアウト・リトライ対応）
   */
  protected async fetchWithRetry(
    url: string, 
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<Response> {
    await this.waitForRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent!,
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      this.lastRequest = Date.now();
      this.requestCount++;

      if (!response.ok && attempt < this.config.retryAttempts) {
        console.warn(`Request failed (attempt ${attempt}/${this.config.retryAttempts}): ${response.status}`);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this.config.retryAttempts) {
        console.warn(`Request error (attempt ${attempt}/${this.config.retryAttempts}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // exponential backoff
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * エラー作成ヘルパー
   */
  protected createError(code: string, message: string): ScrapingError {
    return {
      code,
      message,
      source: this.config.name,
      retryable: code !== 'PARSING_ERROR',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 結果ID生成
   */
  protected generateResultId(prefix: string, index: number): string {
    return `${prefix}_${Date.now()}_${index}`;
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequest: this.lastRequest ? new Date(this.lastRequest).toISOString() : null,
      config: {
        name: this.config.name,
        rateLimit: this.config.rateLimit,
        reliability: this.config.reliability
      }
    };
  }

  /**
   * リセット
   */
  reset() {
    this.requestCount = 0;
    this.lastRequest = 0;
  }
}

/**
 * スクレイピング結果のバリデーション
 */
export function validateScrapingResult(result: Partial<ScrapingResult>): result is ScrapingResult {
  return !!(
    result.id &&
    result.sourceType &&
    result.sourceName &&
    result.title &&
    result.content &&
    result.extractedAt
  );
}

/**
 * 複数の結果を品質とスコアでソート
 */
export function sortScrapingResults(
  results: ScrapingResult[], 
  sortBy: 'relevance' | 'quality' | 'date' = 'relevance'
): ScrapingResult[] {
  return [...results].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return b.relevanceScore - a.relevanceScore;
      case 'quality':
        return b.qualityScore - a.qualityScore;
      case 'date':
        const dateA = new Date(a.publishedDate || a.extractedAt).getTime();
        const dateB = new Date(b.publishedDate || b.extractedAt).getTime();
        return dateB - dateA;
      default:
        return 0;
    }
  });
}

export default BaseScraper;