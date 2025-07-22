/**
 * Enhanced Researcher Agent Configuration
 * 包括的情報収集エージェントの設定管理
 */

import { 
  EnhancedResearcherConfig, 
  ResearchModule, 
  DataSourceConfig,
  ResearchCategory,
  DataSourceType 
} from './enhanced-researcher-types';

// 調査モジュール定義
export const RESEARCH_MODULES: ResearchModule[] = [
  {
    category: 'market_trends',
    name: '市場動向・規模分析',
    description: '市場規模、成長率、トレンド、セグメント分析',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['news', 'reports', 'statistics', 'corporate'],
    isEnabled: true,
    priority: 9
  },
  {
    category: 'technology',
    name: '新興技術・イノベーション',
    description: '新技術、特許、イノベーション動向、技術トレンド',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['academic', 'news', 'reports', 'corporate'],
    isEnabled: true,
    priority: 8
  },
  {
    category: 'investment',
    name: '投資・資金調達動向',
    description: 'VC投資、IPO、M&A、資金調達トレンド',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['news', 'reports', 'corporate'],
    isEnabled: true,
    priority: 7
  },
  {
    category: 'regulation',
    name: '規制・政策変化',
    description: '法規制、政策変更、コンプライアンス要件',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['government', 'news', 'reports'],
    isEnabled: true,
    priority: 8
  },
  {
    category: 'consumer_behavior',
    name: '消費者行動・ニーズ',
    description: '消費者動向、ニーズ変化、行動パターン',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['social', 'news', 'reports', 'statistics'],
    isEnabled: true,
    priority: 7
  },
  {
    category: 'competition',
    name: '競合動向・M&A',
    description: '競合分析、M&A活動、市場シェア、戦略',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['corporate', 'news', 'reports'],
    isEnabled: true,
    priority: 8
  },
  {
    category: 'macroeconomics',
    name: 'マクロ経済要因',
    description: '経済指標、金利、為替、GDP、インフレ',
    supportedLanguages: ['ja', 'en'],
    supportedRegions: ['japan', 'global'],
    dataSources: ['statistics', 'government', 'news'],
    isEnabled: true,
    priority: 6
  }
];

// データソース設定
export const DATA_SOURCE_CONFIGS: Record<string, DataSourceConfig> = {
  // ニュースソース
  'serper_news': {
    type: 'news',
    name: 'Serper News API',
    baseUrl: 'https://google.serper.dev/news',
    rateLimit: 100, // per minute
    timeout: 10000,
    reliability: 'high',
    isEnabled: true,
    cost: 10 // yen per request
  },
  'yahoo_news_jp': {
    type: 'news',
    name: 'Yahoo News Japan',
    baseUrl: 'https://news.yahoo.co.jp',
    rateLimit: 30,
    timeout: 15000,
    reliability: 'medium',
    isEnabled: true,
    cost: 0 // free scraping
  },
  'google_news': {
    type: 'news',
    name: 'Google News',
    baseUrl: 'https://news.google.com',
    rateLimit: 20,
    timeout: 15000,
    reliability: 'medium',
    isEnabled: true,
    cost: 0 // free scraping
  },

  // 統計・政府データ
  'estat_api': {
    type: 'statistics',
    name: 'e-Stat API',
    baseUrl: 'https://api.e-stat.go.jp',
    rateLimit: 60,
    timeout: 20000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free government API
  },
  'cabinet_office': {
    type: 'government',
    name: '内閣府',
    baseUrl: 'https://www.cao.go.jp',
    rateLimit: 10,
    timeout: 15000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free scraping
  },
  'meti': {
    type: 'government',
    name: '経済産業省',
    baseUrl: 'https://www.meti.go.jp',
    rateLimit: 10,
    timeout: 15000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free scraping
  },

  // 企業・業界情報
  'nikkei': {
    type: 'corporate',
    name: '日本経済新聞',
    baseUrl: 'https://www.nikkei.com',
    rateLimit: 15,
    timeout: 15000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free scraping (limited)
  },
  'diamond': {
    type: 'reports',
    name: 'ダイヤモンド・オンライン',
    baseUrl: 'https://diamond.jp',
    rateLimit: 15,
    timeout: 15000,
    reliability: 'medium',
    isEnabled: true,
    cost: 0 // free scraping
  },

  // ソーシャル・コミュニティ
  'reddit_api': {
    type: 'social',
    name: 'Reddit API',
    baseUrl: 'https://www.reddit.com/api',
    rateLimit: 60,
    timeout: 10000,
    reliability: 'medium',
    isEnabled: true,
    cost: 0 // free API
  },
  'twitter_search': {
    type: 'social',
    name: 'Twitter Search',
    baseUrl: 'https://twitter.com/search',
    rateLimit: 30,
    timeout: 10000,
    reliability: 'medium',
    isEnabled: false, // requires authentication
    cost: 0
  },

  // 学術情報
  'arxiv': {
    type: 'academic',
    name: 'arXiv',
    baseUrl: 'https://arxiv.org/search',
    rateLimit: 30,
    timeout: 15000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free API
  },
  'semantic_scholar': {
    type: 'academic',
    name: 'Semantic Scholar',
    baseUrl: 'https://api.semanticscholar.org',
    rateLimit: 100,
    timeout: 15000,
    reliability: 'high',
    isEnabled: true,
    cost: 0 // free API
  }
};

// キーワードマッピング（カテゴリ別の検索キーワード）
export const CATEGORY_KEYWORDS: Record<ResearchCategory, Record<string, string[]>> = {
  market_trends: {
    ja: ['市場規模', '市場動向', '業界分析', '成長率', 'シェア', 'セグメント', 'トレンド'],
    en: ['market size', 'market trends', 'industry analysis', 'growth rate', 'market share', 'segment', 'trends']
  },
  technology: {
    ja: ['新技術', 'イノベーション', 'AI', 'DX', 'デジタル変革', '特許', '技術動向'],
    en: ['new technology', 'innovation', 'AI', 'digital transformation', 'patents', 'tech trends', 'emerging tech']
  },
  investment: {
    ja: ['投資', 'VC', '資金調達', 'IPO', 'M&A', 'スタートアップ', '投資動向'],
    en: ['investment', 'venture capital', 'funding', 'IPO', 'M&A', 'startup', 'investment trends']
  },
  regulation: {
    ja: ['規制', '法律', '政策', '制度', 'コンプライアンス', '法改正', '政府'],
    en: ['regulation', 'law', 'policy', 'compliance', 'legal', 'government', 'regulatory']
  },
  consumer_behavior: {
    ja: ['消費者', '顧客ニーズ', '行動変化', 'ライフスタイル', '購買行動', 'トレンド'],
    en: ['consumer', 'customer needs', 'behavior change', 'lifestyle', 'purchasing behavior', 'consumer trends']
  },
  competition: {
    ja: ['競合', '競争', '市場シェア', '企業戦略', 'M&A', '業界動向'],
    en: ['competition', 'competitors', 'market share', 'corporate strategy', 'M&A', 'industry dynamics']
  },
  macroeconomics: {
    ja: ['経済', 'GDP', 'インフレ', '金利', '為替', '経済指標', '景気'],
    en: ['economy', 'GDP', 'inflation', 'interest rates', 'exchange rates', 'economic indicators', 'economic outlook']
  }
};

// デフォルト設定
export const DEFAULT_CONFIG: EnhancedResearcherConfig = {
  modules: RESEARCH_MODULES,
  dataSources: DATA_SOURCE_CONFIGS,
  defaultLanguage: 'ja',
  defaultRegion: 'japan',
  maxParallelRequests: 5,
  globalTimeout: 120000, // 2 minutes
  cacheConfig: {
    enabled: true,
    defaultTtl: 3600, // 1 hour
    maxSize: 100 * 1024 * 1024, // 100MB
    evictionPolicy: 'lru'
  },
  costConfig: {
    monthlyBudget: 2000, // 2000 yen
    alertThreshold: 0.8, // 80%
    enforceLimit: true
  },
  qualityConfig: {
    minRelevanceScore: 5,
    minQualityScore: 6,
    maxRetries: 3
  }
};

// カテゴリ別のデータソース優先順位
export const CATEGORY_SOURCE_PRIORITY: Record<ResearchCategory, string[]> = {
  market_trends: ['serper_news', 'nikkei', 'diamond', 'estat_api'],
  technology: ['arxiv', 'semantic_scholar', 'serper_news', 'nikkei'],
  investment: ['serper_news', 'nikkei', 'diamond'],
  regulation: ['cabinet_office', 'meti', 'serper_news', 'nikkei'],
  consumer_behavior: ['serper_news', 'reddit_api', 'nikkei', 'estat_api'],
  competition: ['nikkei', 'diamond', 'serper_news'],
  macroeconomics: ['estat_api', 'cabinet_office', 'nikkei', 'serper_news']
};

// 三菱地所との関連性評価キーワード
export const MITSUBISHI_SYNERGY_KEYWORDS = {
  ja: [
    '不動産', '都市開発', 'オフィス', '商業施設', 'まちづくり',
    '丸の内', '大手町', '有楽町', 'テナント', '賃貸',
    '投資', '開発', '建設', '建築', 'インフラ',
    'エネルギー', 'スマートシティ', 'サステナビリティ',
    'ホテル', '観光', '小売', '飲食', 'エンターテイメント'
  ],
  en: [
    'real estate', 'urban development', 'office', 'commercial', 'city planning',
    'tenant', 'rental', 'leasing', 'property management',
    'investment', 'development', 'construction', 'infrastructure',
    'energy', 'smart city', 'sustainability',
    'hotel', 'tourism', 'retail', 'dining', 'entertainment'
  ]
};

// エラーコード定義
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_LIMIT_EXCEEDED: 'API_LIMIT_EXCEEDED',
  PARSING_ERROR: 'PARSING_ERROR',
  QUALITY_TOO_LOW: 'QUALITY_TOO_LOW',
  COST_LIMIT_EXCEEDED: 'COST_LIMIT_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
} as const;