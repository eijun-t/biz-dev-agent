/**
 * Enhanced Critic Agent - Main Export Index
 * Enhanced Critic Agent のメインエクスポートインデックス
 */

import { EnhancedCriticAgent } from './enhanced-critic';
import { CapabilityAnalyzer } from './capability-analyzer';
import { EvaluationFramework } from './evaluation-framework';

export { EnhancedCriticAgent, CapabilityAnalyzer, EvaluationFramework };
export * from './types';

// Factory function for easy integration
export function createEnhancedCritic(config: any = {}) {
  return new EnhancedCriticAgent(config);
}