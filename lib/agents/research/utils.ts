/**
 * 研究フェーズの共通ユーティリティ
 */

import { MitsubishiCapability, ResearchCategory, Region, Language } from './types';

// 三菱地所のケイパビリティ定義
export const MITSUBISHI_CAPABILITIES: MitsubishiCapability[] = [
  {
    category: 'urban_development',
    name: 'まちづくり・都市開発',
    description: '大規模複合開発プロジェクトの企画・実行・管理',
    strength_level: 10,
    related_industries: ['不動産', '建設', '都市計画', 'インフラ'],
    examples: ['丸の内', 'みなとみらい', '横浜ランドマークタワー']
  },
  {
    category: 'real_estate_investment',
    name: '不動産投資・取得',
    description: '優良物件の発掘・取得・投資判断',
    strength_level: 9,
    related_industries: ['不動産', '金融', '投資', 'REIT'],
    examples: ['オフィスビル投資', '商業施設投資', '海外不動産投資']
  },
  {
    category: 'property_management',
    name: '不動産管理・運営',
    description: 'ビル管理・テナント管理・施設運営',
    strength_level: 9,
    related_industries: ['不動産', '施設管理', 'FM', 'テナント'],
    examples: ['オフィスビル管理', '商業施設運営', 'ホテル運営']
  },
  {
    category: 'leasing_brokerage',
    name: 'リーシング・仲介',
    description: 'テナント誘致・賃貸仲介・契約管理',
    strength_level: 8,
    related_industries: ['不動産', 'リーシング', '仲介', 'テナント'],
    examples: ['オフィステナント誘致', '商業テナント誘致', '住宅仲介']
  },
  {
    category: 'corporate_network',
    name: '企業ネットワーク',
    description: '大手企業・金融機関との幅広いネットワーク',
    strength_level: 9,
    related_industries: ['金融', '商社', '製造業', 'IT'],
    examples: ['三菱グループ', '大手金融機関', '上場企業']
  },
  {
    category: 'customer_base',
    name: '顧客基盤',
    description: '個人・法人の幅広い顧客基盤',
    strength_level: 8,
    related_industries: ['個人', '法人', '投資家', 'テナント'],
    examples: ['住宅購入者', 'オフィステナント', '商業テナント']
  },
  {
    category: 'financial_resources',
    name: '資金調達力',
    description: '大規模プロジェクトの資金調達・金融アレンジ',
    strength_level: 9,
    related_industries: ['金融', '投資', 'ファンド', '銀行'],
    examples: ['プロジェクトファイナンス', '不動産ファンド', '社債発行']
  },
  {
    category: 'regulatory_expertise',
    name: '法規制対応',
    description: '不動産・建設関連の法規制対応ノウハウ',
    strength_level: 8,
    related_industries: ['法務', '建設', '都市計画', '環境'],
    examples: ['建築基準法', '都市計画法', '環境法', '金融法']
  },
  {
    category: 'technology_adoption',
    name: 'テクノロジー活用',
    description: '不動産テックの導入・活用',
    strength_level: 7,
    related_industries: ['IT', 'PropTech', 'IoT', 'AI'],
    examples: ['スマートビル', 'IoT活用', 'AI分析', 'デジタルマーケティング']
  },
  {
    category: 'sustainability',
    name: 'サステナビリティ',
    description: '環境配慮・ESG経営の推進',
    strength_level: 8,
    related_industries: ['環境', 'ESG', '再生可能エネルギー', 'サステナビリティ'],
    examples: ['グリーンビル', 'カーボンニュートラル', '再エネ導入']
  }
];

// 研究カテゴリごとのキーワードテンプレート
export const RESEARCH_KEYWORDS = {
  startup_trends: {
    japan: ['スタートアップ', '新興企業', 'ベンチャー', '起業', '資金調達', 'IPO', 'ユニコーン'],
    usa: ['startup', 'venture', 'unicorn', 'funding', 'IPO', 'seed', 'series A', 'breakthrough'],
    global: ['startup ecosystem', 'venture capital', 'innovation', 'emerging companies', 'disruptive technology']
  },
  industry_challenges: {
    japan: ['業界課題', '市場問題', 'ペインポイント', '効率化', 'DX', 'デジタル変革', '人手不足'],
    usa: ['industry pain points', 'market challenges', 'efficiency problems', 'digital transformation', 'automation'],
    global: ['industry disruption', 'market inefficiencies', 'traditional challenges', 'modernization needs']
  },
  technology_developments: {
    japan: ['新技術', 'イノベーション', 'AI', 'IoT', 'ブロックチェーン', '自動化', 'ロボット'],
    usa: ['emerging technology', 'AI breakthrough', 'machine learning', 'blockchain', 'automation', 'robotics'],
    global: ['technological innovation', 'cutting-edge technology', 'future technology', 'tech disruption']
  },
  investment_patterns: {
    japan: ['投資動向', '資金調達', 'VC', '投資ファンド', 'M&A', '事業買収', '投資トレンド'],
    usa: ['investment trends', 'venture funding', 'private equity', 'M&A activity', 'capital allocation'],
    global: ['global investment', 'cross-border M&A', 'international funding', 'investment flows']
  }
};

// 地域と言語のマッピング
export const REGION_LANGUAGE_MAP: Record<Region, Language> = {
  japan: 'ja',
  usa: 'en',
  global: 'en'
};

// 研究項目のIDを生成
export function generateResearchItemId(category: ResearchCategory, region: Region, index: number): string {
  return `${category}_${region}_${index}_${Date.now()}`;
}

// 検索クエリを生成
export function generateSearchQuery(topic: string, keywords: string[], region: Region): string {
  const baseQuery = `${topic} ${keywords.join(' ')}`;
  
  // 地域別の検索クエリ調整
  switch (region) {
    case 'japan':
      return `${baseQuery} 日本`;
    case 'usa':
      return `${baseQuery} United States`;
    case 'global':
      return `${baseQuery} global trends`;
    default:
      return baseQuery;
  }
}

// 関連性スコアを計算
export function calculateRelevanceScore(
  title: string,
  snippet: string,
  keywords: string[]
): number {
  const text = `${title} ${snippet}`.toLowerCase();
  const keywordMatches = keywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length;
  
  return Math.min(10, (keywordMatches / keywords.length) * 10);
}

// 三菱地所のケイパビリティとの相乗効果を評価
export function evaluateMitsubishiSynergy(
  content: string,
  category: ResearchCategory
): number {
  const contentLower = content.toLowerCase();
  let synergyScore = 0;
  
  // ケイパビリティごとの関連キーワードをチェック
  MITSUBISHI_CAPABILITIES.forEach(capability => {
    const relatedKeywords = [
      ...capability.related_industries,
      ...capability.examples,
      capability.name
    ];
    
    const matches = relatedKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    ).length;
    
    if (matches > 0) {
      synergyScore += (matches / relatedKeywords.length) * capability.strength_level;
    }
  });
  
  // カテゴリ別の重み付け
  const categoryWeight = {
    startup_trends: 1.0,
    industry_challenges: 1.2,
    technology_developments: 1.1,
    investment_patterns: 0.9
  };
  
  return Math.min(10, synergyScore * categoryWeight[category]);
}

// 処理時間を推定
export function estimateProcessingTime(researchItems: number, parallelLimit: number): number {
  const avgTimePerItem = 15; // 秒
  const parallelBatches = Math.ceil(researchItems / parallelLimit);
  return parallelBatches * avgTimePerItem;
}

// 研究項目の優先度を計算
export function calculatePriority(
  category: ResearchCategory,
  region: Region,
  userInput: string
): number {
  let priority = 5; // ベース優先度
  
  // カテゴリ別の優先度
  const categoryPriority = {
    startup_trends: 8,
    industry_challenges: 9,
    technology_developments: 7,
    investment_patterns: 6
  };
  
  // 地域別の優先度
  const regionPriority = {
    japan: 9,
    usa: 8,
    global: 6
  };
  
  // ユーザー入力との関連性
  const inputRelevance = userInput.toLowerCase().includes(category.replace('_', ' ')) ? 2 : 0;
  
  return Math.min(10, 
    (categoryPriority[category] + regionPriority[region] + inputRelevance) / 3
  );
}

// 研究結果の十分性を評価
export function evaluateResearchSufficiency(
  summaries: any[],
  minSummariesPerCategory: number = 3
): boolean {
  const categoryCounts = {
    startup_trends: 0,
    industry_challenges: 0,
    technology_developments: 0,
    investment_patterns: 0
  };
  
  summaries.forEach(summary => {
    categoryCounts[summary.category as ResearchCategory]++;
  });
  
  return Object.values(categoryCounts).every(count => count >= minSummariesPerCategory);
}