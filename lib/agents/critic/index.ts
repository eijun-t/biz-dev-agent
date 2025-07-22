/**
 * Enhanced Critic Agent - Main Export Index
 * Enhanced Critic Agent のメインエクスポートインデックス
 */

export { EnhancedCriticAgent } from './enhanced-critic';
export { CapabilityAnalyzer } from './capability-analyzer';
export { EvaluationFramework } from './evaluation-framework';

export * from './types';

// Factory function for easy integration
export function createEnhancedCritic(config: any = {}) {
  return new EnhancedCriticAgent(config);
}