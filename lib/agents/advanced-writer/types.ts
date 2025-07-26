/**
 * Advanced Writer Agent - Type Definitions
 * 詳細で高品質なレポート生成のための型定義
 */

import { EnhancedAnalystOutput } from '../enhanced-analyst/types';

// ============================================================================
// Core Types
// ============================================================================

export interface AdvancedWriterInput {
  userOriginalRequest: string;
  selectedBusinessIdea: any;
  researchData: any;
  enhancedAnalysisResults: EnhancedAnalystOutput;
}

export interface AdvancedWriterOutput {
  id: string;
  businessIdeaTitle: string;
  generatedAt: string;
  sections: DetailedReportSection[];
  totalWordCount: number;
  generationMetadata: GenerationMetadata;
}

// ============================================================================
// Section Types
// ============================================================================

export interface DetailedReportSection {
  section_id: string;
  tab_name: string;
  title: string;
  content: string; // Rich HTML content
  subsections: ReportSubsection[];
  data_sources: string[];
  confidence_level: 'low' | 'medium' | 'high';
  completeness_score: number;
  word_count: number;
  visualizations: DataVisualization[];
  last_updated: string;
}

export interface ReportSubsection {
  subtitle: string;
  content: string; // Rich HTML content
  visualizations?: DataVisualization[];
  word_count: number;
}

// ============================================================================
// Data Visualization Types
// ============================================================================

export interface DataVisualization {
  id: string;
  type: 'table' | 'chart' | 'infographic' | 'timeline' | 'matrix';
  title: string;
  data: any;
  html_content: string; // Rendered HTML
}

export interface ChartVisualization extends DataVisualization {
  type: 'chart';
  chart_type: 'bar' | 'line' | 'pie' | 'area';
  x_axis_label?: string;
  y_axis_label?: string;
}

export interface TableVisualization extends DataVisualization {
  type: 'table';
  headers: string[];
  rows: any[][];
  styling?: 'basic' | 'striped' | 'bordered';
}

export interface MatrixVisualization extends DataVisualization {
  type: 'matrix';
  matrix_type: 'risk' | 'competitive' | 'strategic';
  x_axis: string;
  y_axis: string;
  quadrant_labels: string[];
}

// ============================================================================
// Section Generation Types
// ============================================================================

export interface SectionGenerationRequest {
  section_type: SectionType;
  input_data: AdvancedWriterInput;
  target_word_count: number;
  include_visualizations: boolean;
}

export interface SectionGenerationResult {
  section: DetailedReportSection;
  generation_time: number;
  success: boolean;
  error?: string;
}

export type SectionType = 
  | 'executive_summary'
  | 'target_challenges'
  | 'solution_model'
  | 'market_competition'
  | 'mitsubishi_value'
  | 'verification_plan'
  | 'risk_analysis';

// ============================================================================
// Generation Configuration
// ============================================================================

export interface AdvancedWriterConfig {
  content: {
    target_word_count_per_section: number;
    detail_level: 'standard' | 'detailed' | 'comprehensive';
    include_data_visualizations: boolean;
    include_financial_models: boolean;
  };
  processing: {
    enable_parallel_generation: boolean;
    max_concurrent_sections: number;
    timeout_per_section: number; // milliseconds
  };
  quality: {
    enforce_min_word_count: boolean;
    require_data_backing: boolean;
    enable_consistency_check: boolean;
  };
}

// ============================================================================
// Generation Metadata
// ============================================================================

export interface GenerationMetadata {
  total_generation_time: number;
  sections_generated_in_parallel: boolean;
  section_generation_times: Record<string, number>;
  data_sources_used: string[];
  visualization_count: number;
  quality_checks_passed: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class AdvancedWriterError extends Error {
  constructor(
    public section: string,
    message: string,
    public code: string,
    public metadata?: any
  ) {
    super(message);
    this.name = 'AdvancedWriterError';
  }
}

export class SectionGenerationError extends AdvancedWriterError {
  constructor(section: string, message: string, metadata?: any) {
    super(section, message, 'SECTION_GENERATION_ERROR', metadata);
  }
}

export class VisualizationError extends AdvancedWriterError {
  constructor(section: string, message: string, metadata?: any) {
    super(section, message, 'VISUALIZATION_ERROR', metadata);
  }
}