/**
 * アイディエーションフェーズの型定義
 */

import { ResearchSummary } from '../research/types';

// ビジネスアイデア
export interface BusinessIdea {
  id: string;
  title: string;
  target_market: string;
  problem_statement: string;
  solution: string;
  business_model: string;
  mitsubishi_synergy: string;
  generated_at: string;
  iteration_count: number;
  source_research_ids: string[]; // 参照した研究要約のID
}

// アイデア評価スコア
export interface IdeaEvaluation {
  idea_id: string;
  scores: {
    market_potential: number; // 市場有望性 (0-35)
    strategic_fit: number; // 戦略適合性 (0-35)
    competitive_advantage: number; // 競争優位性 (0-15)
    profitability: number; // 収益性 (0-15)
  };
  total_score: number; // 0-100
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions: string[];
  };
  recommendation: 'proceed' | 'iterate' | 'reject';
  evaluation_reason: string;
  evaluated_at: string;
}

// アイディエーション結果
export interface IdeationResult {
  session_id: string;
  ideas: BusinessIdea[];
  evaluations: IdeaEvaluation[];
  selected_idea: BusinessIdea | null;
  iteration_history: IdeationIteration[];
  final_score: number;
  total_processing_time: number;
  created_at: string;
}

// 反復記録
export interface IdeationIteration {
  iteration_number: number;
  trigger: 'initial' | 'critic_feedback' | 'research_insufficient';
  input_feedback?: string;
  ideas_generated: number;
  best_score: number;
  action_taken: 'continue' | 'iterate' | 'complete';
  timestamp: string;
}

// アイディエーションフェーズの状態
export interface IdeationPhaseState {
  research_summaries: ResearchSummary[];
  current_iteration: number;
  max_iterations: number;
  ideas: BusinessIdea[];
  evaluations: IdeaEvaluation[];
  selected_idea: BusinessIdea | null;
  iteration_history: IdeationIteration[];
  is_complete: boolean;
  next_action: 'generate_ideas' | 'evaluate_ideas' | 'iterate' | 'complete' | 'need_more_research';
  feedback_for_next_iteration?: string;
  processing_start_time: string;
  total_processing_time: number;
}

// アイデア生成のコンテキスト
export interface IdeationContext {
  research_insights: string[];
  market_opportunities: string[];
  technology_trends: string[];
  mitsubishi_strengths: string[];
  user_requirements?: string;
  previous_feedback?: string;
}

// 評価基準の重み
export interface EvaluationWeights {
  market_potential: number; // 35
  strategic_fit: number; // 35
  competitive_advantage: number; // 15
  profitability: number; // 15
}

// 評価基準の詳細
export interface EvaluationCriteria {
  market_potential: {
    description: string;
    max_score: number;
    scoring_guide: string[];
  };
  strategic_fit: {
    description: string;
    max_score: number;
    scoring_guide: string[];
  };
  competitive_advantage: {
    description: string;
    max_score: number;
    scoring_guide: string[];
  };
  profitability: {
    description: string;
    max_score: number;
    scoring_guide: string[];
  };
}

// アイデア改善のためのフィードバック
export interface ImprovementFeedback {
  target_score_gap: number;
  priority_areas: string[];
  specific_suggestions: string[];
  research_gaps?: string[];
  market_focus_recommendations?: string[];
}

// アイディエーションエラー
export interface IdeationError {
  phase: 'generation' | 'evaluation' | 'iteration';
  error_type: 'llm_error' | 'validation_error' | 'timeout_error' | 'insufficient_data';
  error_message: string;
  retry_count: number;
  timestamp: string;
  context?: any;
}