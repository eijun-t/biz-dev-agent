/**
 * HTML Parser Utilities
 * 既存のdata-source-modules.tsからHTML処理機能を抽出・改良
 */

import * as cheerio from 'cheerio';

export interface ParsedContent {
  title: string;
  content: string;
  summary: string;
  links: string[];
  metadata: Record<string, any>;
}

export interface HtmlCleaningOptions {
  maxLength?: number;
  preserveLineBreaks?: boolean;
  removeElements?: string[];
  contentSelectors?: string[];
}

/**
 * HTMLコンテンツの清掃とメインコンテンツ抽出
 */
export function cleanHtmlContent(
  html: string, 
  options: HtmlCleaningOptions = {}
): string {
  const {
    maxLength = 2000,
    preserveLineBreaks = false,
    removeElements = ['script', 'style', 'nav', 'footer', 'header', 'aside', '.advertisement', '.ad', '.menu', '.sidebar'],
    contentSelectors = ['main', 'article', '.content', '.main-content', '.post-content', '.entry-content']
  } = options;

  try {
    const $ = cheerio.load(html);
    
    // 不要な要素を除去
    removeElements.forEach(selector => {
      $(selector).remove();
    });
    
    // メインコンテンツを抽出
    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        mainContent = element.text();
        break;
      }
    }
    
    // フォールバック: body全体
    if (!mainContent) {
      mainContent = $('body').text();
    }
    
    // テキストを正規化
    let cleaned = mainContent;
    if (!preserveLineBreaks) {
      cleaned = cleaned.replace(/\s+/g, ' ').replace(/\n+/g, '\n');
    }
    
    return cleaned.trim().substring(0, maxLength);
    
  } catch (error) {
    console.warn('HTML cleaning failed:', error);
    return html.substring(0, maxLength);
  }
}

/**
 * Yahoo News専用のHTML解析
 */
export function parseYahooNewsHtml(html: string): Array<{
  title: string;
  url: string;
  snippet: string;
  date: string;
}> {
  const results: Array<{ title: string; url: string; snippet: string; date: string }> = [];
  
  try {
    const $ = cheerio.load(html);
    
    // 複数のセレクターパターンを試行
    const selectors = [
      '.newsFeed_item',
      '[class*="newsFeed"] [class*="item"]',
      '.sc-gzVnrw',
      '.searchResult li'
    ];
    
    let itemsFound = false;
    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        items.each((index, element) => {
          const $item = $(element);
          
          // タイトルとURLを抽出
          const titleElement = $item.find('.newsFeed_item_title a, [class*="title"] a, h3 a, h2 a').first();
          const title = titleElement.text().trim();
          const url = titleElement.attr('href') || '';
          
          // スニペットを抽出
          const snippet = $item.find('.newsFeed_item_detail, [class*="detail"], p').first().text().trim();
          
          // 日付を抽出
          const date = $item.find('.newsFeed_item_date, [class*="date"], time').first().text().trim();
          
          if (title && title.length > 10) {
            results.push({
              title,
              url: url.startsWith('http') ? url : `https://news.yahoo.co.jp${url}`,
              snippet,
              date
            });
          }
        });
        itemsFound = true;
        break;
      }
    }
    
    if (!itemsFound) {
      console.warn('No Yahoo News items found with standard selectors');
    }
    
  } catch (error) {
    console.error('Yahoo News HTML parsing failed:', error);
  }
  
  return results;
}

/**
 * arXivのXML解析
 */
export function parseArxivXml(xmlText: string): Array<{
  title: string;
  summary: string;
  authors: string[];
  url: string;
  publishedDate: string;
  category: string;
}> {
  const results: Array<{
    title: string;
    summary: string;
    authors: string[];
    url: string;
    publishedDate: string;
    category: string;
  }> = [];
  
  try {
    // 簡易XMLパース（実際の実装ではより堅牢なパーサーを使用可能）
    const entryRegex = /<entry>(.*?)<\/entry>/gs;
    const entries = xmlText.match(entryRegex) || [];
    
    entries.forEach(entry => {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
      const linkMatch = entry.match(/<link.*?href="(.*?)".*?>/);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      const authorMatches = entry.match(/<name>(.*?)<\/name>/g);
      const categoryMatch = entry.match(/<category.*?term="(.*?)".*?>/);
      
      if (titleMatch && summaryMatch) {
        const title = titleMatch[1].trim().replace(/\s+/g, ' ');
        const summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
        const authors = authorMatches ? authorMatches.map(m => m.replace(/<\/?name>/g, '')) : [];
        
        results.push({
          title,
          summary,
          authors,
          url: linkMatch ? linkMatch[1] : '',
          publishedDate: publishedMatch ? publishedMatch[1] : '',
          category: categoryMatch ? categoryMatch[1] : ''
        });
      }
    });
    
  } catch (error) {
    console.error('arXiv XML parsing failed:', error);
  }
  
  return results;
}

/**
 * 汎用HTMLから構造化データを抽出
 */
export function parseGenericHtml(html: string): ParsedContent {
  const $ = cheerio.load(html);
  
  // タイトル抽出
  const title = $('title').first().text().trim() ||
                $('h1').first().text().trim() ||
                $('h2').first().text().trim() ||
                'Untitled';
  
  // メインコンテンツ抽出
  const content = cleanHtmlContent(html);
  
  // 要約作成（最初の200文字）
  const summary = content.substring(0, 200) + (content.length > 200 ? '...' : '');
  
  // リンク抽出
  const links: string[] = [];
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && href.startsWith('http')) {
      links.push(href);
    }
  });
  
  // メタデータ抽出
  const metadata: Record<string, any> = {};
  $('meta').each((_, element) => {
    const name = $(element).attr('name') || $(element).attr('property');
    const content = $(element).attr('content');
    if (name && content) {
      metadata[name] = content;
    }
  });
  
  return {
    title,
    content,
    summary,
    links: [...new Set(links)], // 重複除去
    metadata
  };
}

/**
 * HTMLの品質評価
 */
export function assessHtmlQuality(html: string): {
  score: number;
  factors: Record<string, number>;
} {
  const $ = cheerio.load(html);
  const factors: Record<string, number> = {};
  
  // コンテンツの長さ
  const textLength = $('body').text().length;
  factors.textLength = Math.min(textLength / 2000, 1); // 2000文字で満点
  
  // 構造化の度合い
  factors.structure = Math.min(($('h1, h2, h3').length + $('p').length) / 10, 1);
  
  // リンクの数
  factors.links = Math.min($('a[href]').length / 20, 1);
  
  // 画像の有無
  factors.media = Math.min($('img').length / 5, 1);
  
  // メタ情報
  factors.metadata = Math.min($('meta').length / 10, 1);
  
  // 総合スコア計算
  const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
  
  return {
    score: Math.round(score * 10), // 0-10スケール
    factors
  };
}

export default {
  cleanHtmlContent,
  parseYahooNewsHtml,
  parseArxivXml,
  parseGenericHtml,
  assessHtmlQuality
};