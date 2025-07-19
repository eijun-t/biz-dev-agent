/**
 * LangGraph.js 共有状態とエージェント型定義
 */

// エージェントの種類
export type AgentType = 'planner' | 'researcher' | 'ideator' | 'analyst' | 'critic' | 'writer';

// 調査フェーズ
export type ResearchPhase = 'ideation' | 'analysis' | 'complete';

// エージェント実行記録
export interface AgentExecution {
  id: string;
  agent: AgentType;
  timestamp: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
  duration: number;
  tokens_used: number;
}

// 調査データ
export interface ResearchData {
  id: string;
  query: string;
  source: string;
  content: string;
  timestamp: string;
  relevance_score: number;
  agent: AgentType;
}

// ビジネスアイデア
export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  target_market: string;
  value_proposition: string;
  revenue_model: string;
  mitsubishi_synergy: string;
  confidence_score: number;
  created_by: AgentType;
  created_at: string;
}

// 分析結果
export interface AnalysisResult {
  market_size: {
    tam: number;
    pam: number;
    sam: number;
    currency: string;
    methodology: string;
  };
  competitive_landscape: {
    direct_competitors: string[];
    indirect_competitors: string[];
    competitive_advantages: string[];
  };
  risk_assessment: {
    technical_risks: string[];
    market_risks: string[];
    regulatory_risks: string[];
    mitigation_strategies: string[];
  };
  financial_projection: {
    revenue_forecast: number[];
    cost_structure: Record<string, number>;
    break_even_period: number;
  };
}

// 品質スコア
export interface QualityScore {
  stage: string;
  score: number;
  max_score: number;
  criteria: Record<string, number>;
  feedback: string;
  needs_improvement: boolean;
}

// HTMLレポート
export interface HTMLReport {
  id: string;
  title: string;
  content: string;
  generated_at: string;
  quality_score: number;
  word_count: number;
}

// 共有状態インターフェース
export interface SharedState {
  // セッション情報
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  
  // ユーザー入力
  user_input: string;
  requirements?: string;
  
  // ワークフロー状態
  current_agent?: AgentType;
  research_phase: ResearchPhase;
  iteration_count: number;
  
  // データ
  research_data: ResearchData[];
  ideas: BusinessIdea[];
  selected_idea: BusinessIdea | null;
  analysis_results: AnalysisResult | null;
  quality_scores: QualityScore[];
  report: HTMLReport | null;
  
  // 実行履歴
  agent_history: AgentExecution[];
  
  // システム状態
  is_completed: boolean;
  has_errors: boolean;
  total_tokens_used: number;
  execution_start_time: string;
  last_activity: string;
}

// エージェント実行結果
export interface AgentResult {
  success: boolean;
  output: any;
  next_agent?: AgentType;
  should_continue: boolean;
  error?: string;
  tokens_used: number;
  duration: number;
}

// セッション管理
export interface SessionInfo {
  id: string;
  user_id: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  state: SharedState;
}