/**
 * Analysis Phase Type Definitions
 * 詳細分析フェーズの型定義
 */

export interface MarketSizeAnalysis {
  tam: {
    value: number;
    unit: string;
    description: string;
    calculation_method: string;
    confidence_level: 'low' | 'medium' | 'high';
    sources: string[];
  };
  sam: {
    value: number;
    unit: string;
    description: string;
    market_share_assumption: number;
  };
  som: {
    value: number;
    unit: string;
    description: string;
    penetration_assumption: number;
  };
  market_growth_rate: number;
  market_maturity: 'emerging' | 'growth' | 'mature' | 'declining';
  regional_breakdown?: {
    [region: string]: {
      market_size: number;
      growth_rate: number;
      penetration_rate: number;
    };
  };
}

export interface CompetitiveAnalysis {
  direct_competitors: CompetitorProfile[];
  indirect_competitors: CompetitorProfile[];
  market_positioning: {
    our_position: string;
    differentiation_factors: string[];
    competitive_advantages: string[];
    potential_weaknesses: string[];
  };
  market_concentration: 'fragmented' | 'moderate' | 'concentrated';
  barriers_to_entry: string[];
  threat_level: 'low' | 'medium' | 'high';
}

export interface CompetitorProfile {
  name: string;
  market_share?: number;
  strengths: string[];
  weaknesses: string[];
  pricing_strategy?: string;
  key_offerings: string[];
  target_segments: string[];
  mitsubishi_advantage_over: string[];
}

export interface RiskAssessment {
  market_risks: RiskItem[];
  technology_risks: RiskItem[];
  competitive_risks: RiskItem[];
  financial_risks: RiskItem[];
  regulatory_risks: RiskItem[];
  operational_risks: RiskItem[];
  overall_risk_score: number; // 1-10
  mitigation_strategies: MitigationStrategy[];
}

export interface RiskItem {
  risk_name: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  risk_score: number; // 1-9 (probability * impact)
  timeframe: string;
}

export interface MitigationStrategy {
  risk_addressed: string;
  strategy: string;
  implementation_timeline: string;
  responsible_party: string;
  success_metrics: string[];
}

export interface FinancialProjections {
  revenue_projections: {
    year_1: number;
    year_2: number;
    year_3: number;
    year_5: number;
    assumptions: string[];
  };
  cost_structure: {
    initial_investment: number;
    operating_costs_annual: number;
    major_cost_categories: {
      [category: string]: number;
    };
  };
  profitability: {
    break_even_point: string;
    gross_margin: number;
    net_margin_projections: {
      year_1: number;
      year_2: number;
      year_3: number;
    };
  };
  funding_requirements: {
    total_funding_needed: number;
    funding_stages: {
      stage: string;
      amount: number;
      timeline: string;
      use_of_funds: string[];
    }[];
  };
  roi_analysis: {
    expected_roi: number;
    payback_period: string;
    npv_estimate?: number;
    sensitivity_analysis: string[];
  };
}

export interface ResearchRequest {
  id: string;
  requested_by: 'analyst';
  request_type: 'market_data' | 'competitor_info' | 'industry_trends' | 'regulatory_info' | 'customer_insights';
  specific_query: string;
  context: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  expected_data_format: string;
  business_idea_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
}

export interface ResearchResponse {
  request_id: string;
  data: any;
  confidence_level: 'low' | 'medium' | 'high';
  sources: string[];
  limitations: string[];
  additional_insights?: string[];
  completed_at: string;
}

export interface AnalysisResult {
  business_idea_id: string;
  market_analysis: MarketSizeAnalysis;
  competitive_analysis: CompetitiveAnalysis;
  risk_assessment: RiskAssessment;
  financial_projections: FinancialProjections;
  strategic_recommendations: string[];
  next_steps: string[];
  analysis_confidence: number; // 1-10
  analyst_notes: string;
  research_requests_made: string[];
  total_analysis_time: number; // milliseconds
  created_at: string;
  last_updated: string;
}

export interface AnalysisPhaseState {
  business_ideas: any[]; // From ideation phase
  selected_idea_for_analysis?: any;
  research_requests: ResearchRequest[];
  research_responses: ResearchResponse[];
  analysis_result?: AnalysisResult;
  phase_status: 'not_started' | 'research_phase' | 'analysis_phase' | 'completed' | 'failed';
  current_step: string;
  iteration_count: number;
  max_iterations: number;
  analysis_start_time?: string;
  logs: AnalysisLog[];
  errors: string[];
}

export interface AnalysisLog {
  timestamp: string;
  agent: 'analyst' | 'researcher' | 'coordinator';
  action: string;
  details: any;
  duration?: number;
}

export interface AnalysisConfig {
  max_research_requests: number;
  analysis_timeout: number; // milliseconds
  confidence_threshold: number;
  max_iterations: number;
  data_sources: {
    web_search_enabled: boolean;
    government_data_enabled: boolean;
    financial_apis_enabled: boolean;
  };
  financial_assumptions: {
    default_growth_rate: number;
    default_market_penetration: number;
    risk_free_rate: number;
    discount_rate: number;
  };
}

// Error types specific to analysis phase
export interface AnalysisError {
  error_type: 'data_insufficient' | 'calculation_error' | 'timeout' | 'external_api_error' | 'validation_error';
  message: string;
  context: string;
  timestamp: string;
  recoverable: boolean;
  retry_suggested: boolean;
}

// Validation schemas
export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number; // 0-1
}