/**
 * Report Generation Types
 * レポート生成の型定義
 */

import { ResearchSummary } from '../research/types';
import { BusinessIdea, IdeationResult } from '../ideation/types';
import { AnalysisResult } from '../analysis/types';

// 統合データ型：全フェーズの結果を含む
export interface ComprehensiveBusinessReport {
  id: string;
  session_id: string;
  title: string;
  research_phase_result: ResearchSummary[];
  ideation_phase_result: IdeationResult;
  analysis_phase_result: AnalysisResult;
  selected_business_idea: BusinessIdea;
  report_generation_result?: ReportGenerationResult;
  created_at: string;
  last_updated: string;
  status: 'draft' | 'generated' | 'reviewed' | 'finalized';
}

// レポート生成結果
export interface ReportGenerationResult {
  report_id: string;
  sections: ReportSection[];
  generation_process: GenerationProcess[];
  quality_assessment: QualityAssessment;
  revision_history: RevisionRecord[];
  final_score: number;
  generation_time: number;
  word_count: number;
  created_at: string;
  last_updated: string;
}

// レポートセクション（7タブに対応）
export interface ReportSection {
  section_id: string;
  tab_name: '概要' | '想定ターゲットと課題' | 'ソリューション仮説・ビジネスモデル' | '市場規模・競合' | '三菱地所が取り組む意義' | '検証アクション' | 'リスク';
  title: string;
  content: string; // HTML形式
  subsections?: ReportSubsection[];
  data_sources: string[];
  confidence_level: 'low' | 'medium' | 'high';
  completeness_score: number; // 0-100
  last_updated: string;
}

export interface ReportSubsection {
  subtitle: string;
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
}

export interface ChartData {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'funnel';
  title: string;
  data: any;
  description: string;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  description: string;
}

// 生成プロセスの可視化用
export interface GenerationProcess {
  step_id: string;
  agent: 'writer' | 'critic' | 'researcher' | 'analyst' | 'coordinator';
  action: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  duration?: number;
  output_summary?: string;
  error_message?: string;
  progress_percentage: number; // 0-100
}

// 品質評価
export interface QualityAssessment {
  overall_score: number; // 0-100
  section_scores: SectionScore[];
  evaluation_criteria: EvaluationCriteria;
  improvement_suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  meets_threshold: boolean; // 80点以上かどうか
  assessed_at: string;
  assessed_by: 'critic_agent';
}

export interface SectionScore {
  section_name: string;
  score: number;
  criteria_breakdown: {
    logical_consistency: number;
    actionable_specificity: number;
    data_support: number;
    clarity: number;
  };
  feedback: string;
}

export interface EvaluationCriteria {
  logical_consistency_weight: number; // 0-1
  actionable_specificity_weight: number; // 0-1
  data_support_weight: number; // 0-1
  clarity_weight: number; // 0-1
  minimum_passing_score: number; // 80
}

// 修正履歴
export interface RevisionRecord {
  revision_id: string;
  revision_number: number;
  trigger_reason: string;
  sections_modified: string[];
  changes_made: ChangeRecord[];
  previous_score: number;
  new_score: number;
  created_at: string;
}

export interface ChangeRecord {
  section: string;
  change_type: 'content_update' | 'structure_change' | 'data_addition' | 'clarification';
  old_content?: string;
  new_content: string;
  reason: string;
}

// チャット機能用
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  related_section?: string;
  context_data?: any;
}

export interface ChatContext {
  report_data: ComprehensiveBusinessReport;
  current_section?: string;
  conversation_history: ChatMessage[];
}

// Writer Agent設定
export interface WriterConfig {
  max_section_length: number;
  min_section_length: number;
  include_charts: boolean;
  include_tables: boolean;
  writing_style: 'formal' | 'business' | 'analytical';
  target_audience: 'executives' | 'analysts' | 'general';
  language: 'ja' | 'en';
  template_version: string;
}

// Critic Agent設定
export interface CriticConfig {
  passing_threshold: number; // 80
  max_revisions: number; // 2
  evaluation_criteria: EvaluationCriteria;
  detailed_feedback: boolean;
  auto_request_revisions: boolean;
}

// レポートテンプレート
export interface ReportTemplate {
  template_id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  style_config: StyleConfig;
  created_at: string;
}

export interface TemplateSection {
  section_name: string;
  required_fields: string[];
  optional_fields: string[];
  content_structure: string;
  example_content?: string;
}

export interface StyleConfig {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  header_styles: any;
  body_styles: any;
  chart_colors: string[];
}

// UI状態管理
export interface ReportUIState {
  current_tab: string;
  is_generating: boolean;
  generation_progress: number;
  active_processes: GenerationProcess[];
  chat_open: boolean;
  chat_messages: ChatMessage[];
  edit_mode: boolean;
  unsaved_changes: boolean;
}

// エラー処理
export interface ReportError {
  error_type: 'generation_failed' | 'data_missing' | 'template_error' | 'quality_check_failed';
  message: string;
  section?: string;
  timestamp: string;
  recoverable: boolean;
  suggested_action: string;
}

// API レスポンス型
export interface ReportGenerationResponse {
  success: boolean;
  report_id?: string;
  report?: ReportGenerationResult;
  progress?: GenerationProcess[];
  error?: ReportError;
  session_id: string;
}

export interface ReportChatResponse {
  success: boolean;
  message: ChatMessage;
  context_updated?: boolean;
  suggested_questions?: string[];
}

// Supabase保存用の型
export interface ReportStorageData {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  content_json: string; // JSON.stringify(ReportGenerationResult)
  raw_data_json: string; // JSON.stringify(ComprehensiveBusinessReport)
  status: string;
  final_score: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

// 検索・フィルタリング用
export interface ReportFilter {
  status?: string[];
  score_range?: [number, number];
  date_range?: [string, string];
  search_query?: string;
  tags?: string[];
}

export interface ReportSearchResult {
  reports: ReportStorageData[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: ReportFilter;
}