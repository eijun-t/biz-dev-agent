/**
 * LangGraph.js基盤 - メインエクスポート
 */

// 設定関連
export { 
  loadConfig, 
  validateConfig, 
  createLLM,
  type LLMConfig,
  type SystemConfig 
} from './config';

// 型定義
export type {
  AgentType,
  ResearchPhase,
  SharedState,
  SessionInfo,
  AgentExecution,
  AgentResult,
  ResearchData,
  BusinessIdea,
  AnalysisResult,
  QualityScore,
  HTMLReport
} from './types';

// 状態管理
export { 
  StateManager,
  stateManager 
} from './state-manager';

// エラーハンドリング
export {
  ErrorHandler,
  AgentError,
  SystemError,
  errorHandler,
  createAgentError,
  createSystemError,
  type RetryConfig,
  type ErrorContext
} from './error-handler';

// バージョン情報
export const LANGGRAPH_FOUNDATION_VERSION = '1.0.0';