/**
 * エラーハンドリングとリトライ機構
 */

import { AgentType } from './types';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

export interface ErrorContext {
  agent: AgentType;
  sessionId: string;
  operation: string;
  attempt: number;
  timestamp: string;
}

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public agent: AgentType,
    public recoverable: boolean = true,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public context?: any
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

export class ErrorHandler {
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBackoff: true,
      ...retryConfig
    };
  }

  /**
   * リトライ付きでオペレーションを実行
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryCondition?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          this.logRetrySuccess(context, attempt);
        }
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        const shouldRetry = this.shouldRetry(error as Error, attempt, retryCondition);
        
        this.logError(error as Error, { ...context, attempt });
        
        if (!shouldRetry) {
          break;
        }
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          this.logRetryAttempt(context, attempt + 1, delay);
          await this.sleep(delay);
        }
      }
    }
    
    throw new AgentError(
      `Operation failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
      'MAX_RETRIES_EXCEEDED',
      context.agent,
      false,
      { originalError: lastError, context }
    );
  }

  /**
   * エラーがリトライ可能かどうかを判定
   */
  private shouldRetry(
    error: Error,
    attempt: number,
    retryCondition?: (error: Error) => boolean
  ): boolean {
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    // カスタムリトライ条件が指定されている場合
    if (retryCondition) {
      return retryCondition(error);
    }

    // AgentError の場合
    if (error instanceof AgentError) {
      return error.recoverable;
    }

    // SystemError の場合
    if (error instanceof SystemError) {
      return error.severity !== 'critical';
    }

    // デフォルトのリトライ可能エラー
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_FAILURE'
    ];

    return retryableErrors.some(code => 
      error.message.includes(code) || 
      (error as any).code === code
    );
  }

  /**
   * リトライ遅延時間を計算
   */
  private calculateDelay(attempt: number): number {
    if (!this.retryConfig.exponentialBackoff) {
      return this.retryConfig.baseDelay;
    }

    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * スリープ関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * エラーログを記録
   */
  private logError(error: Error, context: ErrorContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      agent: context.agent,
      sessionId: context.sessionId,
      operation: context.operation,
      attempt: context.attempt,
      error: {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      }
    };

    console.error('[Agent Error]', JSON.stringify(logEntry, null, 2));
  }

  /**
   * リトライ試行ログを記録
   */
  private logRetryAttempt(context: ErrorContext, attempt: number, delay: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      agent: context.agent,
      sessionId: context.sessionId,
      operation: context.operation,
      message: `Retrying attempt ${attempt} after ${delay}ms delay`
    };

    console.warn('[Agent Retry]', JSON.stringify(logEntry, null, 2));
  }

  /**
   * リトライ成功ログを記録
   */
  private logRetrySuccess(context: ErrorContext, totalAttempts: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      agent: context.agent,
      sessionId: context.sessionId,
      operation: context.operation,
      message: `Operation succeeded after ${totalAttempts} retries`
    };

    console.info('[Agent Recovery]', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * よく使用されるエラー作成ヘルパー
 */
export const createAgentError = (
  message: string,
  code: string,
  agent: AgentType,
  recoverable: boolean = true,
  context?: any
): AgentError => {
  return new AgentError(message, code, agent, recoverable, context);
};

export const createSystemError = (
  message: string,
  code: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  context?: any
): SystemError => {
  return new SystemError(message, code, severity, context);
};

// デフォルトエラーハンドラーインスタンス
export const errorHandler = new ErrorHandler();