/**
 * インメモリ共有状態管理システム
 */

import { SharedState, SessionInfo, AgentType, AgentExecution } from './types';
import { loadConfig } from './config';

export class StateManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private readonly config = loadConfig();

  /**
   * 新しいセッションを作成
   */
  createSession(userId: string, userInput: string, requirements?: string): string {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();
    
    const initialState: SharedState = {
      session_id: sessionId,
      user_id: userId,
      created_at: now,
      updated_at: now,
      user_input: userInput,
      requirements: requirements,
      current_agent: undefined,
      research_phase: 'ideation',
      iteration_count: 0,
      research_data: [],
      ideas: [],
      selected_idea: null,
      analysis_results: null,
      quality_scores: [],
      report: null,
      agent_history: [],
      is_completed: false,
      has_errors: false,
      total_tokens_used: 0,
      execution_start_time: now,
      last_activity: now
    };

    const session: SessionInfo = {
      id: sessionId,
      user_id: userId,
      created_at: now,
      last_activity: now,
      is_active: true,
      state: initialState
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // セッションタイムアウトチェック
    const now = Date.now();
    const lastActivity = new Date(session.last_activity).getTime();
    if (now - lastActivity > this.config.sessionTimeout) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * 状態を更新
   */
  updateState(sessionId: string, updates: Partial<SharedState>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const now = new Date().toISOString();
    session.state = {
      ...session.state,
      ...updates,
      updated_at: now
    };
    session.last_activity = now;

    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * エージェント実行記録を追加
   */
  addAgentExecution(sessionId: string, execution: Omit<AgentExecution, 'id'>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const executionWithId: AgentExecution = {
      ...execution,
      id: this.generateExecutionId()
    };

    session.state.agent_history.push(executionWithId);
    session.state.total_tokens_used += execution.tokens_used;
    session.state.current_agent = execution.agent;
    session.state.last_activity = new Date().toISOString();

    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * セッションを削除
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * セッションを完了状態に設定
   */
  completeSession(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.state.is_completed = true;
    session.state.updated_at = new Date().toISOString();
    session.is_active = false;

    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * エラー状態を設定
   */
  setError(sessionId: string, error: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.state.has_errors = true;
    session.state.updated_at = new Date().toISOString();
    
    // エラーをエージェント実行履歴に記録
    this.addAgentExecution(sessionId, {
      agent: session.state.current_agent || 'planner',
      timestamp: new Date().toISOString(),
      input: null,
      output: null,
      success: false,
      error: error,
      duration: 0,
      tokens_used: 0
    });

    return true;
  }

  /**
   * アクティブなセッション一覧を取得
   */
  getActiveSessions(): SessionInfo[] {
    const now = Date.now();
    const activeSessions: SessionInfo[] = [];

    for (const [sessionId, session] of this.sessions) {
      const lastActivity = new Date(session.last_activity).getTime();
      if (now - lastActivity <= this.config.sessionTimeout && session.is_active) {
        activeSessions.push(session);
      } else {
        // タイムアウトしたセッションを削除
        this.sessions.delete(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * セッション統計情報を取得
   */
  getSessionStats(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const state = session.state;
    const executionTime = Date.now() - new Date(state.execution_start_time).getTime();
    const successfulExecutions = state.agent_history.filter(exec => exec.success).length;
    const failedExecutions = state.agent_history.filter(exec => !exec.success).length;

    return {
      execution_time: executionTime,
      total_executions: state.agent_history.length,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      total_tokens_used: state.total_tokens_used,
      completion_rate: state.agent_history.length > 0 ? successfulExecutions / state.agent_history.length : 0
    };
  }

  /**
   * セッションIDを生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 実行IDを生成
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * メモリクリーンアップ（定期実行推奨）
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      const lastActivity = new Date(session.last_activity).getTime();
      if (now - lastActivity > this.config.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// シングルトンインスタンス
export const stateManager = new StateManager();