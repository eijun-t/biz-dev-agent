/**
 * Advanced Writer Agent - Public API
 * Task 023: Implement Advanced Writer Agent for Comprehensive Report Generation
 */

import { AdvancedWriterAgent } from './advanced-writer';

// Main agent
export { AdvancedWriterAgent } from './advanced-writer';

// Types
export {
  // Input/Output types
  AdvancedWriterInput,
  AdvancedWriterOutput,
  
  // Section types
  DetailedReportSection,
  ReportSubsection,
  SectionGenerationRequest,
  SectionGenerationResult,
  SectionType,
  
  // Visualization types
  DataVisualization,
  ChartVisualization,
  TableVisualization,
  MatrixVisualization,
  
  // Configuration
  AdvancedWriterConfig,
  GenerationMetadata,
  
  // Error types
  AdvancedWriterError,
  SectionGenerationError,
  VisualizationError
} from './types';

// Utilities
export { DataVisualizer } from './data-visualizer';
export { SectionEngines } from './section-engines';

// Helper function for easy integration
export function createAdvancedWriter(config?: any) {
  return new AdvancedWriterAgent(config);
}