/**
 * Yahoo News Japan Scraper
 * 既存のYahooNewsSourceクラスを改良・独立化
 */

import { BaseScraper, ScrapingConfig, ScrapingResult } from '../core/base-scraper';
import { parseYahooNewsHtml } from '../utils/html-parser';
import { calculateRelevance, calculateQuality } from '../core/relevance-calculator';

export interface YahooNewsOptions {
  language?: 'ja';
  region?: 'japan';
  maxResults?: number;
}

/**
 * Yahoo News Japan専用スクレイパー
 */
export class YahooNewsScraper extends BaseScraper {
  
  constructor(config?: Partial<ScrapingConfig>) {
    super({
      name: 'Yahoo News Japan',
      timeout: 10000,
      rateLimit: 30, // 30 requests per minute
      reliability: 'high',
      retryAttempts: 3,
      ...config
    });
  }

  /**
   * Yahoo News Japanから記事を検索
   */
  async search(
    query: string, 
    options: YahooNewsOptions = {}
  ): Promise<ScrapingResult[]> {
    const {
      language = 'ja',
      region = 'japan',
      maxResults = 10
    } = options;

    // Yahoo News Japanは日本語のみ対応
    if (language !== 'ja' || region !== 'japan') {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://news.yahoo.co.jp/search?p=${encodedQuery}&ei=UTF-8`;
      
      const response = await this.fetchWithRetry(searchUrl);
      
      if (!response.ok) {
        throw this.createError('HTTP_ERROR', `HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const parsedItems = parseYahooNewsHtml(html);
      
      if (parsedItems.length === 0) {
        console.warn(`No news items found for query: "${query}"`);
      }

      const results = parsedItems
        .slice(0, maxResults)
        .map((item, index) => this.createScrapingResult(item, query, index));

      return results.filter(result => result.title.length > 10);

    } catch (error) {
      console.error('Yahoo News scraping error:', error);
      throw this.createError(
        'SCRAPING_ERROR',
        `Failed to scrape Yahoo News: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * パースされたアイテムからScrapingResultを作成
   */
  private createScrapingResult(
    item: { title: string; url: string; snippet: string; date: string },
    query: string,
    index: number
  ): ScrapingResult {
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    
    return {
      id: this.generateResultId('yahoo_news', index),
      sourceType: 'news',
      sourceName: this.config.name,
      url: item.url,
      title: item.title,
      content: item.snippet,
      summary: item.snippet.length > 200 ? item.snippet.substring(0, 200) + '...' : item.snippet,
      relevanceScore: calculateRelevance(item.title, item.snippet, keywords),
      qualityScore: calculateQuality(item.title, item.snippet, { reliability: this.config.reliability }),
      publishedDate: this.parseYahooDate(item.date),
      extractedAt: new Date().toISOString(),
      metadata: {
        originalDate: item.date,
        source: 'Yahoo News Japan',
        queryUsed: query
      }
    };
  }

  /**
   * Yahoo Newsの日付フォーマットを標準形式に変換
   */
  private parseYahooDate(dateString: string): string | undefined {
    if (!dateString) return undefined;
    
    try {
      // "7/21(日) 14:30" 形式の処理
      const match = dateString.match(/(\d+)\/(\d+).+?(\d+):(\d+)/);
      if (match) {
        const [, month, day, hour, minute] = match;
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        return date.toISOString();
      }
      
      // その他のフォーマットの処理
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
    } catch (error) {
      console.warn(`Failed to parse Yahoo News date: ${dateString}`);
    }
    
    return undefined;
  }

  /**
   * 検索クエリの最適化
   */
  optimizeQuery(originalQuery: string): string {
    // 日本語クエリの最適化ロジック
    let optimized = originalQuery.trim();
    
    // 長すぎるクエリを短縮
    if (optimized.length > 50) {
      optimized = optimized.substring(0, 50).trim();
    }
    
    // 特殊文字をエスケープ
    optimized = optimized.replace(/[+\-()]/g, ' ');
    
    return optimized;
  }

  /**
   * Yahoo News特有のエラーハンドリング
   */
  async searchWithErrorRecovery(
    query: string,
    options: YahooNewsOptions = {}
  ): Promise<ScrapingResult[]> {
    try {
      return await this.search(query, options);
    } catch (error) {
      console.warn('Primary search failed, trying optimized query...');
      
      // クエリを最適化して再試行
      const optimizedQuery = this.optimizeQuery(query);
      if (optimizedQuery !== query) {
        try {
          return await this.search(optimizedQuery, options);
        } catch (retryError) {
          console.error('Optimized query also failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  /**
   * 検索結果の品質フィルタリング
   */
  async searchHighQuality(
    query: string,
    options: YahooNewsOptions & { minQuality?: number; minRelevance?: number } = {}
  ): Promise<ScrapingResult[]> {
    const {
      minQuality = 6,
      minRelevance = 4,
      ...searchOptions
    } = options;

    const results = await this.search(query, searchOptions);
    
    return results.filter(result => 
      result.qualityScore >= minQuality && 
      result.relevanceScore >= minRelevance
    );
  }
}

export default YahooNewsScraper;