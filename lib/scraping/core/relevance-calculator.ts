/**
 * Relevance Calculator
 * 既存のcalculateRelevance機能を抽出・改良したモジュール
 */

export interface RelevanceOptions {
  keywordWeight: number;
  titleBonus: number;
  exactMatchBonus: number;
  languageBonus: number;
  maxScore: number;
}

const DEFAULT_OPTIONS: RelevanceOptions = {
  keywordWeight: 2,
  titleBonus: 1,
  exactMatchBonus: 0.5,
  languageBonus: 1,
  maxScore: 10
};

/**
 * テキストとキーワードの関連性スコアを計算
 */
export function calculateRelevance(
  title: string,
  content: string,
  keywords: string[],
  options: Partial<RelevanceOptions> = {}
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const text = (title + ' ' + content).toLowerCase();
  let score = 0;

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    if (text.includes(keywordLower)) {
      // 基本ポイント
      score += opts.keywordWeight;
      
      // タイトルに含まれている場合のボーナス
      if (title.toLowerCase().includes(keywordLower)) {
        score += opts.titleBonus;
      }
      
      // 完全一致のボーナス
      const exactMatches = text.match(new RegExp(`\\b${escapeRegExp(keywordLower)}\\b`, 'g'));
      if (exactMatches) {
        score += exactMatches.length * opts.exactMatchBonus;
      }
    }
  });

  return Math.min(score, opts.maxScore);
}

/**
 * コンテンツの品質スコアを計算
 */
export function calculateQuality(
  title: string,
  content: string,
  options: {
    reliability?: 'high' | 'medium' | 'low';
    minLength?: number;
    titleMinLength?: number;
  } = {}
): number {
  const {
    reliability = 'medium',
    minLength = 500,
    titleMinLength = 20
  } = options;

  let score = 5; // ベーススコア

  // コンテンツの長さによる評価
  if (content.length > minLength) score += 1;
  if (content.length > minLength * 2) score += 1;
  if (content.length > minLength * 4) score += 1;

  // タイトルの品質
  if (title.length > titleMinLength) score += 1;
  if (title.length > titleMinLength * 2) score += 0.5;

  // ソースの信頼性
  const reliabilityBonus = {
    high: 2,
    medium: 1,
    low: 0
  };
  score += reliabilityBonus[reliability];

  // 構造化されたコンテンツのボーナス
  if (hasStructuredContent(content)) score += 1;

  return Math.min(score, 10);
}

/**
 * 複数のコンテンツの関連性を一括計算
 */
export function calculateBatchRelevance(
  items: Array<{ title: string; content: string }>,
  keywords: string[],
  options?: Partial<RelevanceOptions>
): number[] {
  return items.map(item => 
    calculateRelevance(item.title, item.content, keywords, options)
  );
}

/**
 * 関連性による自動フィルタリング
 */
export function filterByRelevance<T extends { title: string; content: string }>(
  items: T[],
  keywords: string[],
  minScore: number = 4,
  options?: Partial<RelevanceOptions>
): Array<T & { relevanceScore: number }> {
  return items
    .map(item => ({
      ...item,
      relevanceScore: calculateRelevance(item.title, item.content, keywords, options)
    }))
    .filter(item => item.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * キーワード重要度による重み付き計算
 */
export function calculateWeightedRelevance(
  title: string,
  content: string,
  weightedKeywords: Array<{ keyword: string; weight: number }>,
  options?: Partial<RelevanceOptions>
): number {
  const text = (title + ' ' + content).toLowerCase();
  let totalScore = 0;
  let totalWeight = 0;

  weightedKeywords.forEach(({ keyword, weight }) => {
    const keywordScore = calculateRelevance(title, content, [keyword], options);
    totalScore += keywordScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * 言語別の関連性計算
 */
export function calculateLanguageAwareRelevance(
  title: string,
  content: string,
  keywords: string[],
  detectedLanguage: 'ja' | 'en' | 'other' = 'other',
  options?: Partial<RelevanceOptions>
): number {
  const baseScore = calculateRelevance(title, content, keywords, options);
  
  // 日本語コンテンツの場合のボーナス/ペナルティ
  if (detectedLanguage === 'ja') {
    // 日本語キーワードがある場合はボーナス
    const hasJapaneseKeywords = keywords.some(k => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(k));
    if (hasJapaneseKeywords) {
      return Math.min(baseScore * 1.2, 10);
    }
  }
  
  return baseScore;
}

/**
 * コンテンツの類似性計算（簡易版）
 */
export function calculateSimilarity(
  text1: string,
  text2: string,
  method: 'jaccard' | 'cosine' = 'jaccard'
): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  if (method === 'jaccard') {
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  
  // コサイン類似度（簡易実装）
  const allWords = new Set([...words1, ...words2]);
  const vector1 = Array.from(allWords).map(w => words1.has(w) ? 1 : 0);
  const vector2 = Array.from(allWords).map(w => words2.has(w) ? 1 : 0);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const norm1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (norm1 * norm2) || 0;
}

// ヘルパー関数
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasStructuredContent(content: string): boolean {
  // 構造化されたコンテンツの特徴を検出
  const structureIndicators = [
    /^\d+\./m,  // 番号リスト
    /^[-*•]/m,  // 箇条書き
    /\n\s*\n/,  // 段落区切り
    /[：:]\s*$/m, // 見出し的な行
  ];
  
  return structureIndicators.some(regex => regex.test(content));
}

export default {
  calculateRelevance,
  calculateQuality,
  calculateBatchRelevance,
  filterByRelevance,
  calculateWeightedRelevance,
  calculateLanguageAwareRelevance,
  calculateSimilarity
};