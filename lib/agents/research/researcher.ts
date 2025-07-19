/**
 * Researcher Agent - Web検索と情報収集
 */

import { ChatOpenAI } from '@langchain/openai';
import * as cheerio from 'cheerio';
import { 
  ResearchItem, 
  SearchResult, 
  ResearchSummary, 
  SerperResponse,
  Language,
  Region
} from './types';
import { 
  generateSearchQuery, 
  calculateRelevanceScore, 
  evaluateMitsubishiSynergy 
} from './utils';

export class ResearcherAgent {
  private llm: ChatOpenAI;
  private serperApiKey: string;
  private timeout: number;

  constructor(llm: ChatOpenAI, serperApiKey: string, timeout: number = 120000) {
    this.llm = llm;
    this.serperApiKey = serperApiKey;
    this.timeout = timeout;
  }

  /**
   * 研究項目を実行
   */
  async executeResearch(researchItem: ResearchItem): Promise<{
    searchResults: SearchResult[];
    summary: ResearchSummary;
  }> {
    console.log(`🔍 Researcher Agent: ${researchItem.topic} の調査を開始`);

    try {
      // Web検索を実行
      const searchResults = await this.performWebSearch(researchItem);
      
      // 検索結果をフィルタリング
      const filteredResults = this.filterSearchResults(searchResults, researchItem);
      
      // 重要な結果については詳細スクレイピング
      const enrichedResults = await this.enrichWithScraping(filteredResults.slice(0, 5));
      
      // 情報を要約
      const summary = await this.generateSummary(enrichedResults, researchItem);
      
      console.log(`✅ 調査完了: ${researchItem.topic} (${enrichedResults.length}件の結果)`);
      return {
        searchResults: enrichedResults,
        summary
      };
    } catch (error) {
      console.error(`❌ 調査エラー: ${researchItem.topic}`, error);
      throw error;
    }
  }

  /**
   * Web検索を実行
   */
  private async performWebSearch(researchItem: ResearchItem): Promise<SearchResult[]> {
    const query = generateSearchQuery(researchItem.topic, researchItem.keywords, researchItem.region);
    
    const searchParams = {
      q: query,
      num: 10,
      hl: researchItem.language === 'ja' ? 'ja' : 'en',
      gl: researchItem.region === 'japan' ? 'jp' : researchItem.region === 'usa' ? 'us' : 'us'
    };

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`Serper API エラー: ${response.status} ${response.statusText}`);
      }

      const data: SerperResponse = await response.json();
      
      return data.organic.map((result, index) => ({
        id: `search_${researchItem.id}_${index}`,
        research_item_id: researchItem.id,
        query,
        source: 'serper',
        title: result.title,
        snippet: result.snippet,
        url: result.link,
        published_date: result.date,
        relevance_score: calculateRelevanceScore(result.title, result.snippet, researchItem.keywords),
        language: researchItem.language,
        region: researchItem.region
      }));
    } catch (error) {
      console.error('Web検索エラー:', error);
      throw error;
    }
  }

  /**
   * 検索結果をフィルタリング
   */
  private filterSearchResults(
    results: SearchResult[], 
    researchItem: ResearchItem
  ): SearchResult[] {
    return results
      .filter(result => {
        // 関連性スコアが低いものを除外
        if (result.relevance_score < 3) return false;
        
        // 明らかに関係のないサイトを除外
        const excludeDomains = ['wikipedia.org', 'yahoo.com', 'bing.com'];
        const domain = new URL(result.url).hostname;
        if (excludeDomains.some(exclude => domain.includes(exclude))) return false;
        
        // 古すぎる情報を除外
        if (result.published_date) {
          const publishedDate = new Date(result.published_date);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          if (publishedDate < twoYearsAgo) return false;
        }
        
        return true;
      })
      .sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * 重要な結果について詳細スクレイピング
   */
  private async enrichWithScraping(searchResults: SearchResult[]): Promise<SearchResult[]> {
    const enrichedResults: SearchResult[] = [];
    
    for (const result of searchResults) {
      try {
        // 関連性スコアが高いもののみスクレイピング
        if (result.relevance_score >= 7) {
          const scrapedContent = await this.scrapeContent(result.url);
          enrichedResults.push({
            ...result,
            scraped_content: scrapedContent
          });
        } else {
          enrichedResults.push(result);
        }
      } catch (error) {
        console.warn(`スクレイピング失敗: ${result.url}`, error);
        enrichedResults.push(result);
      }
    }
    
    return enrichedResults;
  }

  /**
   * Webページのコンテンツをスクレイピング
   */
  private async scrapeContent(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // 不要な要素を除去
      $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();
      
      // メインコンテンツを抽出
      const mainContent = $('main, article, .content, .main-content, .post-content, .entry-content').text() ||
                         $('body').text();
      
      // テキストを正規化
      const cleanText = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      // 3000文字以内に制限
      return cleanText.length > 3000 ? cleanText.substring(0, 3000) + '...' : cleanText;
    } catch (error) {
      console.warn(`スクレイピングエラー: ${url}`, error);
      return '';
    }
  }

  /**
   * 情報を要約
   */
  private async generateSummary(
    searchResults: SearchResult[],
    researchItem: ResearchItem
  ): Promise<ResearchSummary> {
    const content = searchResults.map(result => ({
      title: result.title,
      snippet: result.snippet,
      content: result.scraped_content || result.snippet,
      url: result.url
    }));

    const prompt = `
あなたは新事業開発の専門家です。以下の検索結果を分析し、構造化された要約を作成してください。

研究トピック: ${researchItem.topic}
カテゴリ: ${researchItem.category}
地域: ${researchItem.region}

検索結果:
${content.map((item, index) => `
${index + 1}. ${item.title}
   内容: ${item.content}
   URL: ${item.url}
`).join('\n')}

以下の形式で回答してください：

## 要約
[3-5文での簡潔な要約]

## 重要なインサイト
1. [インサイト1]
2. [インサイト2]
3. [インサイト3]

## ビジネス規模
[市場規模や事業規模の評価: 小規模/中規模/大規模/巨大]

## 技術成熟度
[技術の成熟度: 研究段階/実証段階/商用化初期/成熟段階]

## 競合環境
[競合の状況: 未開拓/少数競合/競合多数/レッドオーシャン]

## 法規制環境
[規制の状況: 規制なし/緩い規制/厳格な規制/規制不明]

三菱地所のケイパビリティ（都市開発、不動産投資、企業ネットワーク、資金調達力など）との相乗効果を1-10で評価してください。
`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      // レスポンスをパース
      const sections = this.parseAISummary(content);
      
      // 相乗効果スコアを計算
      const synergyScore = evaluateMitsubishiSynergy(
        searchResults.map(r => r.snippet + ' ' + (r.scraped_content || '')).join(' '),
        researchItem.category
      );
      
      const summary: ResearchSummary = {
        id: `summary_${researchItem.id}_${Date.now()}`,
        research_item_id: researchItem.id,
        category: researchItem.category,
        topic: researchItem.topic,
        summary: sections.summary || content.substring(0, 500),
        key_insights: sections.insights || [],
        business_potential: this.evaluateBusinessPotential(sections.marketSize, sections.techMaturity),
        mitsubishi_synergy_potential: synergyScore,
        market_size_indicator: sections.marketSize || '不明',
        technology_maturity: sections.techMaturity || '不明',
        competitive_landscape: sections.competitive || '不明',
        regulatory_environment: sections.regulatory || '不明',
        sources: searchResults.map(r => r.url),
        language: researchItem.language,
        region: researchItem.region,
        created_at: new Date().toISOString()
      };
      
      return summary;
    } catch (error) {
      console.error('要約生成エラー:', error);
      // フォールバック要約
      return this.generateFallbackSummary(searchResults, researchItem);
    }
  }

  /**
   * AI要約レスポンスをパース
   */
  private parseAISummary(content: string): {
    summary?: string;
    insights?: string[];
    marketSize?: string;
    techMaturity?: string;
    competitive?: string;
    regulatory?: string;
  } {
    const sections: any = {};
    
    // 要約セクションを抽出
    const summaryMatch = content.match(/## 要約\s*\n(.*?)(?=\n## |\n$)/s);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }
    
    // インサイトセクションを抽出
    const insightsMatch = content.match(/## 重要なインサイト\s*\n(.*?)(?=\n## |\n$)/s);
    if (insightsMatch) {
      const insightsList = insightsMatch[1]
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
      sections.insights = insightsList;
    }
    
    // その他のセクションを抽出
    const marketSizeMatch = content.match(/## ビジネス規模\s*\n(.*?)(?=\n## |\n$)/s);
    if (marketSizeMatch) {
      sections.marketSize = marketSizeMatch[1].trim();
    }
    
    const techMaturityMatch = content.match(/## 技術成熟度\s*\n(.*?)(?=\n## |\n$)/s);
    if (techMaturityMatch) {
      sections.techMaturity = techMaturityMatch[1].trim();
    }
    
    const competitiveMatch = content.match(/## 競合環境\s*\n(.*?)(?=\n## |\n$)/s);
    if (competitiveMatch) {
      sections.competitive = competitiveMatch[1].trim();
    }
    
    const regulatoryMatch = content.match(/## 法規制環境\s*\n(.*?)(?=\n## |\n$)/s);
    if (regulatoryMatch) {
      sections.regulatory = regulatoryMatch[1].trim();
    }
    
    return sections;
  }

  /**
   * ビジネス潜在性を評価
   */
  private evaluateBusinessPotential(marketSize?: string, techMaturity?: string): number {
    let score = 5;
    
    if (marketSize) {
      if (marketSize.includes('巨大') || marketSize.includes('大規模')) score += 3;
      else if (marketSize.includes('中規模')) score += 1;
      else if (marketSize.includes('小規模')) score -= 1;
    }
    
    if (techMaturity) {
      if (techMaturity.includes('成熟段階')) score += 2;
      else if (techMaturity.includes('商用化初期')) score += 1;
      else if (techMaturity.includes('実証段階')) score += 0;
      else if (techMaturity.includes('研究段階')) score -= 1;
    }
    
    return Math.max(1, Math.min(10, score));
  }

  /**
   * フォールバック要約を生成
   */
  private generateFallbackSummary(
    searchResults: SearchResult[],
    researchItem: ResearchItem
  ): ResearchSummary {
    const combinedContent = searchResults.map(r => r.snippet).join(' ');
    
    return {
      id: `summary_${researchItem.id}_${Date.now()}`,
      research_item_id: researchItem.id,
      category: researchItem.category,
      topic: researchItem.topic,
      summary: combinedContent.substring(0, 500),
      key_insights: [`${researchItem.topic}に関する情報が収集されました`],
      business_potential: 5,
      mitsubishi_synergy_potential: evaluateMitsubishiSynergy(combinedContent, researchItem.category),
      market_size_indicator: '不明',
      technology_maturity: '不明',
      competitive_landscape: '不明',
      regulatory_environment: '不明',
      sources: searchResults.map(r => r.url),
      language: researchItem.language,
      region: researchItem.region,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 並列で複数の研究項目を実行
   */
  async executeParallelResearch(
    researchItems: ResearchItem[],
    parallelLimit: number = 5
  ): Promise<{
    searchResults: SearchResult[];
    summaries: ResearchSummary[];
    errors: any[];
  }> {
    const allSearchResults: SearchResult[] = [];
    const allSummaries: ResearchSummary[] = [];
    const errors: any[] = [];

    // 並列処理用のバッチを作成
    const batches = [];
    for (let i = 0; i < researchItems.length; i += parallelLimit) {
      batches.push(researchItems.slice(i, i + parallelLimit));
    }

    console.log(`🔄 並列処理開始: ${researchItems.length}項目を${batches.length}バッチで処理`);

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.executeResearch(item);
          return { success: true, item, result };
        } catch (error) {
          console.error(`研究項目処理エラー: ${item.topic}`, error);
          return { success: false, item, error };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { success, item, result: researchResult, error } = result.value;
          if (success && researchResult) {
            allSearchResults.push(...researchResult.searchResults);
            allSummaries.push(researchResult.summary);
          } else {
            errors.push({ item, error });
          }
        } else {
          errors.push({ error: result.reason });
        }
      });
    }

    console.log(`✅ 並列処理完了: ${allSummaries.length}項目成功, ${errors.length}項目失敗`);

    return {
      searchResults: allSearchResults,
      summaries: allSummaries,
      errors
    };
  }
}