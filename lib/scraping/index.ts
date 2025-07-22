/**
 * Scraping System Main Export
 * リファクタリングされたスクレイピングシステムのメインエントリーポイント
 */

// Core modules
export { BaseScraper } from './core/base-scraper';
export type { ScrapingConfig, ScrapingResult, ScrapingError } from './core/base-scraper';
export { validateScrapingResult, sortScrapingResults } from './core/base-scraper';

// Relevance calculation
export { 
  calculateRelevance, 
  calculateQuality, 
  calculateBatchRelevance,
  filterByRelevance,
  calculateWeightedRelevance,
  calculateLanguageAwareRelevance,
  calculateSimilarity
} from './core/relevance-calculator';
export type { RelevanceOptions } from './core/relevance-calculator';

// HTML parsing utilities
export { 
  cleanHtmlContent,
  parseYahooNewsHtml,
  parseArxivXml,
  parseGenericHtml,
  assessHtmlQuality
} from './utils/html-parser';
export type { ParsedContent, HtmlCleaningOptions } from './utils/html-parser';

// Data source scrapers
export { YahooNewsScraper } from './sources/yahoo-news';
export type { YahooNewsOptions } from './sources/yahoo-news';

export { RedditScraper } from './sources/reddit';
export type { RedditOptions } from './sources/reddit';

// 将来追加予定のソース
// export { ArxivScraper } from './sources/arxiv';
// export { SerperNewsScraper } from './sources/serper';
// export { EStatScraper } from './sources/estat';

/**
 * スクレイピングシステムファクトリー
 * 既存のDataSourceFactoryを改良
 */
export class ScrapingFactory {
  /**
   * データソースタイプに応じてスクレイパーを作成
   */
  static createScraper(
    sourceType: 'yahoo-news' | 'reddit' | 'arxiv' | 'serper' | 'estat',
    config?: Partial<ScrapingConfig>
  ): BaseScraper {
    switch (sourceType) {
      case 'yahoo-news':
        return new YahooNewsScraper(config);
      case 'reddit':
        return new RedditScraper(config);
      // case 'arxiv':
      //   return new ArxivScraper(config);
      // case 'serper':
      //   return new SerperNewsScraper(config);
      // case 'estat':
      //   return new EStatScraper(config);
      default:
        throw new Error(`Unsupported scraper type: ${sourceType}`);
    }
  }

  /**
   * 利用可能なスクレイパータイプを取得
   */
  static getSupportedTypes(): string[] {
    return [
      'yahoo-news',
      'reddit',
      // 'arxiv',
      // 'serper',
      // 'estat'
    ];
  }

  /**
   * 複数のスクレイパーを一括作成
   */
  static createMultipleScrapers(
    configs: Array<{ type: string; config?: Partial<ScrapingConfig> }>
  ): BaseScraper[] {
    return configs.map(({ type, config }) => 
      this.createScraper(type as any, config)
    );
  }
}

/**
 * 統合検索機能
 * 複数のデータソースから一括検索
 */
export class UnifiedScraper {
  private scrapers: Map<string, BaseScraper> = new Map();

  constructor(configs: Array<{ name: string; type: string; config?: Partial<ScrapingConfig> }> = []) {
    if (configs.length === 0) {
      // デフォルト設定
      this.addScraper('yahoo-news', ScrapingFactory.createScraper('yahoo-news'));
      this.addScraper('reddit', ScrapingFactory.createScraper('reddit'));
    } else {
      configs.forEach(({ name, type, config }) => {
        const scraper = ScrapingFactory.createScraper(type as any, config);
        this.addScraper(name, scraper);
      });
    }
  }

  /**
   * スクレイパーを追加
   */
  addScraper(name: string, scraper: BaseScraper): void {
    this.scrapers.set(name, scraper);
  }

  /**
   * スクレイパーを取得
   */
  getScraper(name: string): BaseScraper | undefined {
    return this.scrapers.get(name);
  }

  /**
   * 全スクレイパーから並列検索
   */
  async searchAll(
    query: string,
    options: {
      maxResultsPerSource?: number;
      minRelevanceScore?: number;
      timeout?: number;
    } = {}
  ): Promise<Array<{ source: string; results: ScrapingResult[]; error?: string }>> {
    const {
      maxResultsPerSource = 10,
      minRelevanceScore = 3,
      timeout = 30000
    } = options;

    const searchPromises = Array.from(this.scrapers.entries()).map(async ([name, scraper]) => {
      try {
        const results = await Promise.race([
          scraper.search(query, { maxResults: maxResultsPerSource }),
          new Promise<ScrapingResult[]>((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout')), timeout)
          )
        ]);

        // 関連性フィルタリング
        const filteredResults = results.filter(result => 
          result.relevanceScore >= minRelevanceScore
        );

        return { source: name, results: filteredResults };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Search failed for ${name}:`, errorMessage);
        return { source: name, results: [], error: errorMessage };
      }
    });

    return Promise.all(searchPromises);
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const stats: Record<string, any> = {};
    this.scrapers.forEach((scraper, name) => {
      stats[name] = scraper.getStats();
    });
    return stats;
  }

  /**
   * 全スクレイパーをリセット
   */
  resetAll() {
    this.scrapers.forEach(scraper => scraper.reset());
  }
}

// 便利な関数
export async function quickSearch(
  query: string,
  sources: ('yahoo-news' | 'reddit')[] = ['yahoo-news', 'reddit'],
  maxResults: number = 20
): Promise<ScrapingResult[]> {
  const unified = new UnifiedScraper(
    sources.map(type => ({ name: type, type, config: {} }))
  );

  const searchResults = await unified.searchAll(query, { maxResultsPerSource: maxResults });
  
  // 全結果を統合してソート
  const allResults = searchResults.flatMap(({ results }) => results);
  return sortScrapingResults(allResults, 'relevance').slice(0, maxResults);
}

export default {
  ScrapingFactory,
  UnifiedScraper,
  quickSearch
};