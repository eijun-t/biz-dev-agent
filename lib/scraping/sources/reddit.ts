/**
 * Reddit API Scraper
 * 既存のRedditSourceクラスを改良・独立化
 */

import { BaseScraper, ScrapingConfig, ScrapingResult } from '../core/base-scraper';
import { calculateRelevance, calculateQuality } from '../core/relevance-calculator';

export interface RedditOptions {
  language?: 'ja' | 'en' | 'any';
  region?: 'japan' | 'us' | 'global';
  maxResults?: number;
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'hot' | 'new' | 'top' | 'comments';
  subreddits?: string[]; // 特定のsubredditに絞り込み
}

interface RedditPost {
  title: string;
  selftext: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  author: string;
  subreddit: string;
  url: string;
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

/**
 * Reddit API スクレイパー
 */
export class RedditScraper extends BaseScraper {

  constructor(config?: Partial<ScrapingConfig>) {
    super({
      name: 'Reddit API',
      timeout: 15000,
      rateLimit: 60, // Reddit API allows 60 requests per minute
      reliability: 'medium',
      retryAttempts: 2,
      ...config
    });
  }

  /**
   * Redditから投稿を検索
   */
  async search(
    query: string,
    options: RedditOptions = {}
  ): Promise<ScrapingResult[]> {
    const {
      maxResults = 10,
      timeRange = 'month',
      sortBy = 'relevance',
      subreddits
    } = options;

    try {
      let searchUrl: string;
      
      if (subreddits && subreddits.length > 0) {
        // 特定のsubredditから検索
        const subredditQuery = subreddits.map(sr => `subreddit:${sr}`).join(' OR ');
        const fullQuery = `${query} (${subredditQuery})`;
        searchUrl = this.buildSearchUrl(fullQuery, maxResults, timeRange, sortBy);
      } else {
        // 全Reddit検索
        searchUrl = this.buildSearchUrl(query, maxResults, timeRange, sortBy);
      }

      const response = await this.fetchWithRetry(searchUrl);

      if (!response.ok) {
        throw this.createError('HTTP_ERROR', `HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: RedditApiResponse = await response.json();
      
      if (!apiResponse.data?.children) {
        console.warn(`No Reddit posts found for query: "${query}"`);
        return [];
      }

      const results = apiResponse.data.children.map((item, index) => 
        this.createScrapingResult(item.data, query, index)
      );

      return results.filter(result => result.title.length > 5);

    } catch (error) {
      console.error('Reddit scraping error:', error);
      throw this.createError(
        'SCRAPING_ERROR',
        `Failed to scrape Reddit: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 検索URLを構築
   */
  private buildSearchUrl(
    query: string,
    limit: number,
    timeRange: string,
    sortBy: string
  ): string {
    const encodedQuery = encodeURIComponent(query);
    const params = new URLSearchParams({
      q: query,
      limit: Math.min(limit, 100).toString(),
      sort: sortBy,
      t: timeRange,
      type: 'link',
      restrict_sr: 'false'
    });

    return `https://www.reddit.com/search.json?${params.toString()}`;
  }

  /**
   * Reddit投稿からScrapingResultを作成
   */
  private createScrapingResult(
    post: RedditPost,
    query: string,
    index: number
  ): ScrapingResult {
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    const content = post.selftext || post.title;
    const summary = content.length > 300 ? content.substring(0, 300) + '...' : content;

    return {
      id: this.generateResultId('reddit', index),
      sourceType: 'social',
      sourceName: this.config.name,
      url: `https://www.reddit.com${post.permalink}`,
      title: post.title,
      content,
      summary,
      relevanceScore: calculateRelevance(post.title, content, keywords),
      qualityScore: this.calculateRedditQuality(post),
      publishedDate: new Date(post.created_utc * 1000).toISOString(),
      extractedAt: new Date().toISOString(),
      metadata: {
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        author: post.author,
        originalUrl: post.url,
        queryUsed: query
      }
    };
  }

  /**
   * Reddit特有の品質計算
   */
  private calculateRedditQuality(post: RedditPost): number {
    let score = 5; // ベーススコア

    // スコア（アップvote数）による評価
    if (post.score > 10) score += 1;
    if (post.score > 100) score += 1;
    if (post.score > 1000) score += 1;

    // コメント数による評価
    if (post.num_comments > 5) score += 0.5;
    if (post.num_comments > 20) score += 0.5;
    if (post.num_comments > 100) score += 1;

    // コンテンツの長さ
    const contentLength = (post.selftext || '').length;
    if (contentLength > 200) score += 0.5;
    if (contentLength > 500) score += 0.5;

    // タイトルの品質
    if (post.title.length > 20 && post.title.length < 200) score += 0.5;

    return Math.min(score, 10);
  }

  /**
   * 特定のsubredditから検索
   */
  async searchSubreddits(
    query: string,
    subreddits: string[],
    options: Omit<RedditOptions, 'subreddits'> = {}
  ): Promise<ScrapingResult[]> {
    return this.search(query, { ...options, subreddits });
  }

  /**
   * 日本関連のsubredditから検索
   */
  async searchJapanRelated(
    query: string,
    options: RedditOptions = {}
  ): Promise<ScrapingResult[]> {
    const japanSubreddits = [
      'japan',
      'japantravel', 
      'japanlife',
      'tokyo',
      'osaka',
      'kyoto',
      'JapanFinance',
      'japannews',
      'japancirclejerk',
      'learnjapanese'
    ];

    return this.searchSubreddits(query, japanSubreddits, options);
  }

  /**
   * テック関連のsubredditから検索
   */
  async searchTech(
    query: string,
    options: RedditOptions = {}
  ): Promise<ScrapingResult[]> {
    const techSubreddits = [
      'technology',
      'programming',
      'MachineLearning',
      'artificial',
      'startups',
      'entrepreneur',
      'investing',
      'stocks',
      'cryptocurrency'
    ];

    return this.searchSubreddits(query, techSubreddits, options);
  }

  /**
   * 複数クエリでの並列検索
   */
  async searchMultipleQueries(
    queries: string[],
    options: RedditOptions = {}
  ): Promise<ScrapingResult[]> {
    const searchPromises = queries.map(query => 
      this.search(query, options).catch(error => {
        console.warn(`Query "${query}" failed:`, error);
        return [];
      })
    );

    const results = await Promise.all(searchPromises);
    const flatResults = results.flat();

    // 重複除去（URLベース）
    const uniqueResults = flatResults.filter((result, index, array) => 
      array.findIndex(r => r.url === result.url) === index
    );

    // 関連性スコアでソート
    return uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * トレンド投稿の取得
   */
  async getTrendingPosts(
    subreddits: string[] = ['all'],
    options: { limit?: number; timeRange?: RedditOptions['timeRange'] } = {}
  ): Promise<ScrapingResult[]> {
    const { limit = 25, timeRange = 'day' } = options;

    try {
      const subredditPath = subreddits.join('+');
      const url = `https://www.reddit.com/r/${subredditPath}/hot.json?limit=${limit}&t=${timeRange}`;
      
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const apiResponse: RedditApiResponse = await response.json();
      
      return apiResponse.data.children.map((item, index) => 
        this.createScrapingResult(item.data, 'trending', index)
      );

    } catch (error) {
      console.error('Failed to get trending posts:', error);
      throw this.createError('TRENDING_ERROR', `Failed to get trending posts: ${error}`);
    }
  }
}

export default RedditScraper;