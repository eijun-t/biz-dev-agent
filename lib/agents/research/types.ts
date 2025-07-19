/**
 * 研究フェーズの型定義
 */

// 研究カテゴリ
export type ResearchCategory = 'startup_trends' | 'industry_challenges' | 'technology_developments' | 'investment_patterns';

// 地域
export type Region = 'japan' | 'usa' | 'global';

// 言語
export type Language = 'ja' | 'en';

// 研究項目
export interface ResearchItem {
  id: string;
  category: ResearchCategory;
  topic: string;
  keywords: string[];
  region: Region;
  language: Language;
  priority: number;
  estimated_effort: number; // 予想処理時間（秒）
}

// 検索結果
export interface SearchResult {
  id: string;
  research_item_id: string;
  query: string;
  source: string;
  title: string;
  snippet: string;
  url: string;
  published_date?: string;
  relevance_score: number;
  scraped_content?: string;
  language: Language;
  region: Region;
}

// 要約された研究情報
export interface ResearchSummary {
  id: string;
  research_item_id: string;
  category: ResearchCategory;
  topic: string;
  summary: string;
  key_insights: string[];
  business_potential: number; // 1-10
  mitsubishi_synergy_potential: number; // 1-10
  market_size_indicator: string;
  technology_maturity: string;
  competitive_landscape: string;
  regulatory_environment: string;
  sources: string[];
  language: Language;
  region: Region;
  created_at: string;
}

// 三菱地所のケイパビリティ
export interface MitsubishiCapability {
  category: string;
  name: string;
  description: string;
  strength_level: number; // 1-10
  related_industries: string[];
  examples: string[];
}

// 研究計画
export interface ResearchPlan {
  id: string;
  user_input: string;
  research_items: ResearchItem[];
  total_estimated_time: number;
  priority_order: string[];
  created_at: string;
}

// 研究結果の評価
export interface ResearchEvaluation {
  research_item_id: string;
  information_sufficiency: number; // 1-10
  quality_score: number; // 1-10
  business_relevance: number; // 1-10
  mitsubishi_synergy_score: number; // 1-10
  needs_additional_research: boolean;
  additional_keywords?: string[];
  evaluation_reason: string;
}

// 研究フェーズの状態
export interface ResearchPhaseState {
  plan: ResearchPlan;
  completed_items: string[];
  search_results: SearchResult[];
  summaries: ResearchSummary[];
  evaluations: ResearchEvaluation[];
  is_sufficient: boolean;
  total_processing_time: number;
  next_action: 'continue_research' | 'proceed_to_ideation' | 'need_replanning';
}

// 並列処理用のタスク
export interface ResearchTask {
  id: string;
  research_item: ResearchItem;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time?: string;
  end_time?: string;
  error?: string;
  result?: SearchResult[];
}

// Serper.dev API レスポンス
export interface SerperResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
  };
  organic: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }>;
  totalResults: number;
  timeTaken: number;
}

// エラー情報
export interface ResearchError {
  research_item_id: string;
  error_type: 'api_error' | 'scraping_error' | 'processing_error' | 'timeout_error';
  error_message: string;
  timestamp: string;
  retry_count: number;
  is_recoverable: boolean;
}