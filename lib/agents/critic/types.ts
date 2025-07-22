/**
 * Enhanced Critic Agent - Type Definitions
 * 強化された批評エージェントの型定義
 */

// ============================================================================
// Core Evaluation Types
// ============================================================================

export interface EvaluationScore {
  score: number;
  maxScore: number;
  details: string;
  breakdown?: Record<string, number>;
}

export interface ProfitScenarioEvaluation {
  revenue_model_validity: EvaluationScore;      // 15点
  market_size_consistency: EvaluationScore;     // 10点
  cost_structure_validity: EvaluationScore;     // 10点
  growth_scenario_credibility: EvaluationScore; // 5点
  total_score: number; // 40点満点
  overall_assessment: string;
}

export interface CapabilityUtilizationEvaluation {
  scenario_clarity: EvaluationScore;           // 10点: 活用シナリオの明確性
  depth_specificity: EvaluationScore;          // 15点: 活用の深度・具体性
  synergy_strength: EvaluationScore;           // 15点: シナジー効果の強烈さ
  total_score: number; // 40点満点
  referenced_capabilities: CapabilityReference[];
  overall_assessment: string;
}

export interface FeasibilityRiskEvaluation {
  technical_feasibility: EvaluationScore;      // 5点
  execution_difficulty: EvaluationScore;       // 5点
  market_risk: EvaluationScore;                // 3点
  competitive_risk: EvaluationScore;           // 3点
  regulatory_risk: EvaluationScore;            // 2点
  financial_risk: EvaluationScore;             // 2点
  total_score: number; // 20点満点
  overall_assessment: string;
}

// ============================================================================
// Capability Analysis Types
// ============================================================================

export interface CapabilityReference {
  capability_id: string;
  capability_name: string;
  level: 'major' | 'middle' | 'sub';
  strength_level: number; // 1-10
  usage_scenario: string;
  specificity_score: number; // 1-10
  synergy_potential: number; // 1-10
}

export interface CapabilityMatch {
  text_match: string;
  capability_id: string;
  confidence: number; // 0-1
  context: string;
}

// ============================================================================
// Business Idea Evaluation Types
// ============================================================================

export interface BusinessIdeaEvaluation {
  idea_id: string;
  idea_title: string;
  
  // 評価結果
  profit_scenario: ProfitScenarioEvaluation;
  capability_utilization: CapabilityUtilizationEvaluation;
  feasibility_risk: FeasibilityRiskEvaluation;
  
  // 総合評価
  total_score: number; // 100点満点
  rank: number;
  
  // 詳細分析
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  
  // メタデータ
  evaluation_timestamp: string;
  evaluation_confidence: number; // 0-1
}

export interface IdeaComparison {
  idea_a_id: string;
  idea_b_id: string;
  comparison_points: ComparisonPoint[];
  winner: string; // idea_a_id or idea_b_id
  reasoning: string;
}

export interface ComparisonPoint {
  category: string;
  idea_a_score: number;
  idea_b_score: number;
  difference: number;
  significance: 'high' | 'medium' | 'low';
  explanation: string;
}

// ============================================================================
// Portfolio Evaluation Types
// ============================================================================

export interface PortfolioEvaluation {
  session_id: string;
  evaluated_ideas: BusinessIdeaEvaluation[];
  
  // ランキング
  top_ranked_idea: BusinessIdeaEvaluation;
  ranking: BusinessIdeaEvaluation[];
  
  // 比較分析
  idea_comparisons: IdeaComparison[];
  
  // ポートフォリオ分析
  portfolio_diversity: PortfolioDiversityAnalysis;
  portfolio_risk_balance: PortfolioRiskAnalysis;
  
  // 推薦結果
  recommended_idea: BusinessIdeaEvaluation;
  recommendation_reasoning: string;
  alternative_considerations: string[];
  
  // メタデータ
  total_ideas_evaluated: number;
  evaluation_completed_at: string;
  evaluation_duration_ms: number;
}

export interface PortfolioDiversityAnalysis {
  category_distribution: Record<string, number>;
  risk_level_distribution: Record<string, number>;
  capability_usage_distribution: Record<string, number>;
  diversity_score: number; // 0-10
  diversity_assessment: string;
}

export interface PortfolioRiskAnalysis {
  average_risk_score: number;
  risk_distribution: Record<string, number>;
  risk_balance_score: number; // 0-10
  risk_assessment: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface CriticConfig {
  // 評価設定
  evaluation_weights: {
    profit_scenario_weight: number;    // デフォルト: 0.4
    capability_utilization_weight: number; // デフォルト: 0.4
    feasibility_risk_weight: number;   // デフォルト: 0.2
  };
  
  // 評価基準
  profit_threshold: number; // デフォルト: 10_000_000_000 (10億円)
  min_capability_clarity_score: number; // デフォルト: 6
  max_acceptable_risk_score: number; // デフォルト: 7
  
  // 処理設定
  enable_detailed_analysis: boolean;
  enable_idea_comparisons: boolean;
  enable_improvement_suggestions: boolean;
  
  // 出力設定
  output_language: 'ja' | 'en';
  include_confidence_scores: boolean;
  include_metadata: boolean;
}

export const DEFAULT_CRITIC_CONFIG: CriticConfig = {
  evaluation_weights: {
    profit_scenario_weight: 0.4,
    capability_utilization_weight: 0.4,
    feasibility_risk_weight: 0.2
  },
  profit_threshold: 10_000_000_000,
  min_capability_clarity_score: 6,
  max_acceptable_risk_score: 7,
  enable_detailed_analysis: true,
  enable_idea_comparisons: true,
  enable_improvement_suggestions: true,
  output_language: 'ja',
  include_confidence_scores: true,
  include_metadata: true
};

// ============================================================================
// Input/Output Types
// ============================================================================

export interface CriticInput {
  session_id: string;
  business_ideas: any[]; // BusinessIdea[] from ideation
  research_results?: any; // ResearchResult from research phase
  user_preferences?: {
    prioritize_low_risk?: boolean;
    prioritize_high_synergy?: boolean;
    minimum_profit_requirement?: number;
  };
}

export interface CriticOutput {
  portfolio_evaluation: PortfolioEvaluation;
  selected_idea_for_next_phase: any; // BusinessIdea
  evaluation_summary: {
    total_processing_time_ms: number;
    ideas_evaluated: number;
    top_score: number;
    average_score: number;
    confidence_level: number;
  };
  recommendations_for_writer_agent: {
    focus_areas: string[];
    key_differentiators: string[];
    risk_mitigation_points: string[];
    synergy_highlights: string[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface CriticError {
  error_type: 'EVALUATION_FAILED' | 'CAPABILITY_ANALYSIS_FAILED' | 'INSUFFICIENT_DATA' | 'CONFIG_ERROR';
  message: string;
  idea_id?: string;
  details?: any;
  timestamp: string;
}

// ============================================================================
// Analysis Result Types for Writer Integration
// ============================================================================

export interface AnalysisResultForWriter {
  // Writer Agentが期待するAnalysisResult形式に準拠
  business_idea_id: string;
  
  // 市場分析（Criticの評価から生成）
  market_analysis: {
    tam: string;
    sam: string;
    som: string;
    market_growth_rate: string;
    market_size_assessment: string;
  };
  
  // 競合分析
  competitive_analysis: {
    direct_competitors: string[];
    competitive_advantage_score: number;
    market_position: string;
  };
  
  // リスク評価
  risk_assessment: {
    market_risks: string[];
    technology_risks: string[];
    overall_risk_score: number;
    mitigation_strategies: string[];
  };
  
  // 財務予測
  financial_projections: {
    revenue_projections: string;
    cost_structure: string;
    profitability: string;
    profit_scenario_validity: number;
  };
  
  // 戦略推薦
  strategic_recommendations: string[];
  next_steps: string[];
  
  // Critic固有の追加情報
  critic_evaluation: {
    total_score: number;
    capability_utilization_score: number;
    synergy_strength: number;
    key_differentiators: string[];
  };
  
  // メタデータ
  analysis_confidence: number;
  analyst_notes: string;
  created_at: string;
  last_updated: string;
}