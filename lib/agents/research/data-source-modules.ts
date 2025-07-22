/**
 * Data Source Modules for Enhanced Researcher Agent
 * 各データソース別の情報取得モジュール
 */

import * as cheerio from 'cheerio';
import { 
  DataSourceConfig, 
  DataCollectionResult, 
  ResearchError, 
  DataSourceType,
  Language,
  Region 
} from './enhanced-researcher-types';
import { ERROR_CODES } from './enhanced-researcher-config';

// 基底データソースクラス
export abstract class BaseDataSource {
  protected config: DataSourceConfig;
  protected requestCount: number = 0;
  protected lastRequest: number = 0;

  constructor(config: DataSourceConfig) {
    this.config = config;
  }

  // レート制限チェック
  protected checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastRequest < (60000 / this.config.rateLimit)) {
      return false;
    }
    return true;
  }

  // 抽象メソッド：サブクラスで実装
  abstract search(query: string, language: Language, region: Region, maxResults?: number): Promise<DataCollectionResult[]>;

  // 共通エラーハンドリング
  protected createError(code: string, message: string, source?: string): ResearchError {
    return {
      code,
      message,
      category: 'market_trends', // デフォルト、呼び出し元で上書き
      source: source || this.config.name,
      severity: 'medium',
      retryable: true,
      timestamp: new Date().toISOString()
    };
  }

  // HTTPリクエスト共通処理
  protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // HTMLパースと清掃
  protected cleanHtmlContent(html: string): string {
    const $ = cheerio.load(html);
    
    // 不要な要素を除去
    $('script, style, nav, footer, header, aside, .advertisement, .ad, .menu, .sidebar').remove();
    
    // メインコンテンツを抽出
    const mainContent = $('main, article, .content, .main-content, .post-content, .entry-content').text() ||
                       $('body').text();
    
    // テキストを正規化
    return mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 2000); // 2000文字に制限
  }

  // 関連性スコア計算
  protected calculateRelevance(title: string, content: string, keywords: string[]): number {
    const text = (title + ' ' + content).toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        score += 2;
        // タイトルに含まれている場合は追加ポイント
        if (title.toLowerCase().includes(keywordLower)) {
          score += 1;
        }
      }
    });
    
    return Math.min(score, 10);
  }

  // 品質スコア計算
  protected calculateQuality(title: string, content: string): number {
    let score = 5;
    
    // コンテンツの長さによる評価
    if (content.length > 1000) score += 1;
    if (content.length > 2000) score += 1;
    
    // タイトルの質による評価
    if (title.length > 50) score += 1;
    
    // 情報源の信頼性
    score += this.config.reliability === 'high' ? 2 : this.config.reliability === 'medium' ? 1 : 0;
    
    return Math.min(score, 10);
  }
}

// Serper検索モジュール
export class SerperNewsSource extends BaseDataSource {
  private apiKey: string;

  constructor(config: DataSourceConfig, apiKey: string) {
    super(config);
    this.apiKey = apiKey;
  }

  async search(query: string, language: Language, region: Region, maxResults: number = 10): Promise<DataCollectionResult[]> {
    if (!this.checkRateLimit()) {
      throw this.createError(ERROR_CODES.RATE_LIMIT_ERROR, 'Rate limit exceeded');
    }

    try {
      const searchParams = {
        q: query,
        num: Math.min(maxResults, 20),
        hl: language === 'ja' ? 'ja' : 'en',
        gl: region === 'japan' ? 'jp' : 'us'
      };

      const response = await this.fetchWithTimeout('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw this.createError(ERROR_CODES.API_LIMIT_EXCEEDED, `Serper API error: ${response.status}`);
      }

      const data = await response.json();
      this.lastRequest = Date.now();
      this.requestCount++;

      return data.news?.map((item: any, index: number) => ({
        id: `serper_news_${Date.now()}_${index}`,
        researchItemId: '',
        sourceType: 'news' as DataSourceType,
        sourceName: this.config.name,
        url: item.link,
        title: item.title,
        content: item.snippet || '',
        summary: item.snippet || '',
        relevanceScore: this.calculateRelevance(item.title, item.snippet, query.split(' ')),
        qualityScore: this.calculateQuality(item.title, item.snippet),
        publishedDate: item.date,
        extractedAt: new Date().toISOString(),
        metadata: {
          position: item.position,
          source: item.source
        }
      })) || [];

    } catch (error) {
      throw this.createError(ERROR_CODES.NETWORK_ERROR, `Serper search failed: ${error}`);
    }
  }
}

// Yahoo News Japanスクレイピングモジュール
export class YahooNewsSource extends BaseDataSource {
  async search(query: string, language: Language, region: Region, maxResults: number = 10): Promise<DataCollectionResult[]> {
    if (language !== 'ja' || region !== 'japan') {
      return []; // Yahoo News Japanは日本語のみ
    }

    if (!this.checkRateLimit()) {
      throw this.createError(ERROR_CODES.RATE_LIMIT_ERROR, 'Rate limit exceeded');
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://news.yahoo.co.jp/search?p=${encodedQuery}&ei=UTF-8`;

      const response = await this.fetchWithTimeout(searchUrl);
      if (!response.ok) {
        throw this.createError(ERROR_CODES.NETWORK_ERROR, `Yahoo News fetch failed: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: DataCollectionResult[] = [];

      $('.newsFeed_item').slice(0, maxResults).each((index, element) => {
        const $item = $(element);
        const title = $item.find('.newsFeed_item_title').text().trim();
        const snippet = $item.find('.newsFeed_item_detail').text().trim();
        const url = $item.find('.newsFeed_item_link').attr('href');
        const dateText = $item.find('.newsFeed_item_date').text().trim();

        if (title && url) {
          results.push({
            id: `yahoo_news_${Date.now()}_${index}`,
            researchItemId: '',
            sourceType: 'news',
            sourceName: this.config.name,
            url: url.startsWith('http') ? url : `https://news.yahoo.co.jp${url}`,
            title,
            content: snippet,
            summary: snippet,
            relevanceScore: this.calculateRelevance(title, snippet, query.split(' ')),
            qualityScore: this.calculateQuality(title, snippet),
            publishedDate: dateText,
            extractedAt: new Date().toISOString(),
            metadata: {}
          });
        }
      });

      this.lastRequest = Date.now();
      this.requestCount++;
      return results;

    } catch (error) {
      throw this.createError(ERROR_CODES.PARSING_ERROR, `Yahoo News scraping failed: ${error}`);
    }
  }
}

// e-Stat APIモジュール
export class EStatSource extends BaseDataSource {
  async search(query: string, language: Language, region: Region, maxResults: number = 10): Promise<DataCollectionResult[]> {
    if (language !== 'ja' || region !== 'japan') {
      return []; // e-Statは日本の統計のみ
    }

    if (!this.checkRateLimit()) {
      throw this.createError(ERROR_CODES.RATE_LIMIT_ERROR, 'Rate limit exceeded');
    }

    try {
      // e-Stat APIの統計表情報取得
      const apiUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList`;
      const params = new URLSearchParams({
        appId: process.env.ESTAT_API_KEY || 'dummy',
        searchWord: query,
        limit: maxResults.toString()
      });

      const response = await this.fetchWithTimeout(`${apiUrl}?${params}`);
      if (!response.ok) {
        throw this.createError(ERROR_CODES.API_LIMIT_EXCEEDED, `e-Stat API error: ${response.status}`);
      }

      const data = await response.json();
      this.lastRequest = Date.now();
      this.requestCount++;

      if (!data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF) {
        return [];
      }

      const tables = Array.isArray(data.GET_STATS_LIST.DATALIST_INF.TABLE_INF) 
        ? data.GET_STATS_LIST.DATALIST_INF.TABLE_INF 
        : [data.GET_STATS_LIST.DATALIST_INF.TABLE_INF];

      return tables.map((table: any, index: number) => ({
        id: `estat_${Date.now()}_${index}`,
        researchItemId: '',
        sourceType: 'statistics' as DataSourceType,
        sourceName: this.config.name,
        url: `https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=${table['@id']}`,
        title: table.STAT_NAME?.['#text'] || table.TITLE?.['#text'] || '',
        content: table.TITLE?.['#text'] || '',
        summary: table.TITLE?.['#text'] || '',
        relevanceScore: this.calculateRelevance(table.TITLE?.['#text'] || '', table.STAT_NAME?.['#text'] || '', query.split(' ')),
        qualityScore: 8, // 政府統計は高品質
        publishedDate: table.CYCLE || table.SURVEY_DATE,
        extractedAt: new Date().toISOString(),
        metadata: {
          tableId: table['@id'],
          govOrg: table.GOV_ORG?.['#text'],
          statisticsName: table.STAT_NAME?.['#text']
        }
      }));

    } catch (error) {
      throw this.createError(ERROR_CODES.NETWORK_ERROR, `e-Stat search failed: ${error}`);
    }
  }
}

// arXivモジュール
export class ArxivSource extends BaseDataSource {
  async search(query: string, language: Language, region: Region, maxResults: number = 10): Promise<DataCollectionResult[]> {
    if (!this.checkRateLimit()) {
      throw this.createError(ERROR_CODES.RATE_LIMIT_ERROR, 'Rate limit exceeded');
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

      const response = await this.fetchWithTimeout(apiUrl);
      if (!response.ok) {
        throw this.createError(ERROR_CODES.NETWORK_ERROR, `arXiv API error: ${response.status}`);
      }

      const xmlText = await response.text();
      // XMLパースは簡略化（実際にはxml2jsなどを使用）
      const results: DataCollectionResult[] = [];
      
      // 簡易XMLパース（実際の実装ではより堅牢なパーサーを使用）
      const entryRegex = /<entry>(.*?)<\/entry>/gs;
      const entries = xmlText.match(entryRegex) || [];

      entries.slice(0, maxResults).forEach((entry, index) => {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
        const linkMatch = entry.match(/<link.*?href="(.*?)".*?>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);

        if (titleMatch && summaryMatch) {
          const title = titleMatch[1].trim().replace(/\s+/g, ' ');
          const summary = summaryMatch[1].trim().replace(/\s+/g, ' ');

          results.push({
            id: `arxiv_${Date.now()}_${index}`,
            researchItemId: '',
            sourceType: 'academic',
            sourceName: this.config.name,
            url: linkMatch ? linkMatch[1] : '',
            title,
            content: summary,
            summary,
            relevanceScore: this.calculateRelevance(title, summary, query.split(' ')),
            qualityScore: 9, // 学術論文は高品質
            publishedDate: publishedMatch ? publishedMatch[1] : undefined,
            extractedAt: new Date().toISOString(),
            metadata: {
              source: 'arXiv'
            }
          });
        }
      });

      this.lastRequest = Date.now();
      this.requestCount++;
      return results;

    } catch (error) {
      throw this.createError(ERROR_CODES.PARSING_ERROR, `arXiv search failed: ${error}`);
    }
  }
}

// Redditモジュール
export class RedditSource extends BaseDataSource {
  async search(query: string, language: Language, region: Region, maxResults: number = 10): Promise<DataCollectionResult[]> {
    if (!this.checkRateLimit()) {
      throw this.createError(ERROR_CODES.RATE_LIMIT_ERROR, 'Rate limit exceeded');
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&limit=${maxResults}&sort=relevance`;

      const response = await this.fetchWithTimeout(apiUrl);
      if (!response.ok) {
        throw this.createError(ERROR_CODES.NETWORK_ERROR, `Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      this.lastRequest = Date.now();
      this.requestCount++;

      return data.data?.children?.map((item: any, index: number) => {
        const post = item.data;
        return {
          id: `reddit_${Date.now()}_${index}`,
          researchItemId: '',
          sourceType: 'social' as DataSourceType,
          sourceName: this.config.name,
          url: `https://www.reddit.com${post.permalink}`,
          title: post.title,
          content: post.selftext || post.title,
          summary: post.selftext ? post.selftext.substring(0, 200) : post.title,
          relevanceScore: this.calculateRelevance(post.title, post.selftext || '', query.split(' ')),
          qualityScore: Math.min(post.score / 10, 8), // アップvote数で品質評価
          publishedDate: new Date(post.created_utc * 1000).toISOString(),
          extractedAt: new Date().toISOString(),
          metadata: {
            subreddit: post.subreddit,
            score: post.score,
            num_comments: post.num_comments
          }
        };
      }) || [];

    } catch (error) {
      throw this.createError(ERROR_CODES.NETWORK_ERROR, `Reddit search failed: ${error}`);
    }
  }
}

// データソースファクトリー
export class DataSourceFactory {
  static createDataSource(config: DataSourceConfig, apiKeys: Record<string, string>): BaseDataSource {
    switch (config.name) {
      case 'Serper News API':
        return new SerperNewsSource(config, apiKeys.serper || '');
      case 'Yahoo News Japan':
        return new YahooNewsSource(config);
      case 'e-Stat API':
        return new EStatSource(config);
      case 'arXiv':
        return new ArxivSource(config);
      case 'Reddit API':
        return new RedditSource(config);
      default:
        throw new Error(`Unsupported data source: ${config.name}`);
    }
  }

  static getSupportedSources(): string[] {
    return [
      'Serper News API',
      'Yahoo News Japan', 
      'e-Stat API',
      'arXiv',
      'Reddit API'
    ];
  }
}