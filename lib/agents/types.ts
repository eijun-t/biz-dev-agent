// Agent system types and interfaces

export type AgentStage = 
  | 'initial_research'
  | 'ideation'
  | 'evaluation'
  | 'detailed_research'
  | 'report_generation'
  | 'completed';

export type AgentRole = 
  | 'researcher'
  | 'ideator'
  | 'critic'
  | 'analyst'
  | 'writer';

// Report content structure
export interface ReportContent {
  idea_title: string;
  target: string;
  challenges: string;
  monetization: string;
  market_tam: string;
  competitors: string;
  mitsubishi_synergy: string;
  risks: string;
  roadmap: string;
}

export interface AgentState {
  // Execution metadata
  stage: AgentStage;
  iteration: number;
  start_time: string;
  tokens_used: number;
  
  // Input from user
  topic: string;
  requirements?: string;
  
  // Stage 1: Initial Research Results
  initial_research?: {
    industry_trends: string;
    market_gaps: string;
    technology_trends: string;
    regulatory_environment: string;
    sources: string[];
    quality_score: number;
  };
  
  // Stage 2: Ideation Results
  ideation?: {
    generated_ideas: Array<{
      title: string;
      description: string;
      target_customer: string;
      value_proposition: string;
      mitsubishi_synergy: string;
    }>;
    quality_score: number;
  };
  
  // Stage 3: Evaluation Results
  evaluation?: {
    selected_idea: {
      title: string;
      description: string;
      target_customer: string;
      value_proposition: string;
      mitsubishi_synergy: string;
      selection_reasoning: string;
    };
    quality_score: number;
  };
  
  // Stage 4: Detailed Research Results
  detailed_research?: {
    market_size: {
      tam: string;
      pam: string;
      sam: string;
      calculation_method: string;
    };
    competitive_analysis: {
      direct_competitors: string[];
      indirect_competitors: string[];
      competitive_advantages: string;
    };
    risks: {
      market_risks: string;
      technical_risks: string;
      regulatory_risks: string;
      mitigation_strategies: string;
    };
    implementation_roadmap: string;
    quality_score: number;
  };
  
  // Stage 5: Final Report
  final_report?: {
    html_content: string;
    structured_data: ReportContent;
    quality_score: number;
  };
  
  // System state
  errors: string[];
  logs: Array<{
    timestamp: string;
    agent: AgentRole;
    action: string;
    details: Record<string, unknown>;
  }>;
}

export interface AgentExecutionResult {
  success: boolean;
  updated_state: AgentState;
  next_action: 'continue_stage' | 'advance_stage' | 'complete' | 'retry' | 'fail';
  quality_score: number;
  tokens_used: number;
  error?: string;
}

export interface StageQualityAssessment {
  stage: AgentStage;
  quality_score: number;
  is_sufficient: boolean;
  areas_for_improvement: string[];
  recommendation: 'advance' | 'retry' | 'fail';
}

// Helper types for creating records
export type CreateReportInput = Omit<ReportContent, 'id' | 'created_at' | 'updated_at'>;
export type UpdateReportInput = Partial<Omit<ReportContent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type CreateScoreInput = {
  report_id: string;
  user_id: string;
  market_score: number;
  synergy_score: number;
  target_score: number;
  comment: string | null;
};
export type CreateLogInput = {
  user_id: string;
  event_type: string;
  details: Record<string, unknown>;
  tokens_used: number;
};