/**
 * Enhanced Analyst Agent - Main Implementation
 * Specialized Research結果をWriter向けに分析・構造化するエージェント
 */

import {
  AnalystInput,
  EnhancedAnalystOutput,
  EnhancedAnalystConfig,
  EnhancedAnalystError
} from './types';
import { DataExtractor, ExtractedData } from './data-extractor';
import { SectionAnalyzers } from './section-analyzers';

export class EnhancedAnalystAgent {
  private config: EnhancedAnalystConfig;
  private dataExtractor: DataExtractor;
  private sectionAnalyzers: SectionAnalyzers;

  constructor(config: Partial<EnhancedAnalystConfig> = {}) {
    this.config = {
      analysis: {
        depth: 'detailed',
        includeQuantitativeAnalysis: true,
        includeScenarioPlanning: true,
        ...config.analysis
      },
      output: {
        includeConfidenceScores: true,
        includeDataLineage: false,
        detailLevel: 'detailed',
        ...config.output
      },
      validation: {
        requireMinDataPoints: 3,
        enforceDataQuality: true,
        flagInconsistencies: true,
        ...config.validation
      }
    };

    this.dataExtractor = new DataExtractor();
    this.sectionAnalyzers = new SectionAnalyzers();

    console.log('🧠 Enhanced Analyst Agent initialized');
    console.log(`   Analysis depth: ${this.config.analysis.depth}`);
    console.log(`   Output detail level: ${this.config.output.detailLevel}`);
  }

  /**
   * Main analysis method - converts Specialized Research results to Writer-ready format
   */
  async analyzeBusinessIdea(input: AnalystInput): Promise<EnhancedAnalystOutput> {
    const startTime = Date.now();
    
    try {
      console.log('🔬 Enhanced Analyst: Starting comprehensive analysis...');
      
      // Step 1: Extract and prepare data
      console.log('📊 Extracting data from research results...');
      console.log('🔍 Debug - Input data structure:', JSON.stringify({
        userInput: input.userInput?.substring(0, 100) + '...',
        selectedIdea: input.selectedIdea ? Object.keys(input.selectedIdea) : 'None',
        originalResearch: input.originalResearch ? 'Available' : 'None',
        specializedResearch: input.specializedResearch ? {
          status: input.specializedResearch.status,
          domainResults: input.specializedResearch.domainResults?.length || 0
        } : 'None'
      }, null, 2));
      
      const extractedData = this.dataExtractor.extractResearchData(input);
      
      console.log('🔍 Debug - Extracted data structure:', JSON.stringify({
        userOriginalRequest: extractedData.userOriginalRequest?.substring(0, 100) + '...',
        businessIdea: extractedData.businessIdea ? Object.keys(extractedData.businessIdea) : 'None',
        marketData: extractedData.marketData ? 'Available' : 'None',
        competitorData: extractedData.competitorData ? 'Available' : 'None',
        originalResearchSummary: extractedData.originalResearchSummary?.available || false
      }, null, 2));
      
      // Step 2: Validate data quality
      this.validateDataQuality(extractedData);
      
      // Step 3: Generate all 7 report sections
      console.log('📝 Generating report sections...');
      const sections = await this.generateAllSections(extractedData);
      
      // Step 4: Calculate metadata and quality metrics
      const dataQuality = this.assessDataQuality(extractedData);
      const processingMetadata = this.generateProcessingMetadata(input, startTime);
      
      // Step 5: Assemble final output
      const output: EnhancedAnalystOutput = {
        id: `ea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        businessIdeaId: extractedData.businessIdea.id,
        businessIdeaTitle: extractedData.businessIdea.title,
        analyzedAt: new Date().toISOString(),
        ...sections,
        dataQuality,
        processingMetadata
      };
      
      console.log('✅ Enhanced Analyst: Analysis completed successfully');
      console.log(`   Processing time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      console.log(`   Data quality score: ${(dataQuality.completeness * 100).toFixed(0)}%`);
      
      return output;
      
    } catch (error) {
      console.error('❌ Enhanced Analyst: Analysis failed:', error);
      throw new EnhancedAnalystError(
        'Analysis execution failed',
        'ANALYSIS_EXECUTION_ERROR',
        undefined,
        { originalError: error, processingTime: Date.now() - startTime }
      );
    }
  }

  /**
   * Generate all 7 report sections
   */
  private async generateAllSections(data: ExtractedData) {
    const sections = {
      executiveSummary: null,
      targetAndChallenges: null,
      solutionAnalysis: null,
      marketCompetitiveAnalysis: null,
      mitsubishiEstateValue: null,
      validationPlan: null,
      riskAnalysis: null
    };

    try {
      // Generate sections in parallel for efficiency
      const [
        executiveSummary,
        targetAndChallenges,
        solutionAnalysis,
        marketCompetitiveAnalysis,
        mitsubishiEstateValue,
        validationPlan,
        riskAnalysis
      ] = await Promise.all([
        this.generateSectionSafely('executiveSummary', () => 
          this.sectionAnalyzers.generateExecutiveSummary(data)
        ),
        this.generateSectionSafely('targetAndChallenges', () => 
          this.sectionAnalyzers.generateTargetAndChallenges(data)
        ),
        this.generateSectionSafely('solutionAnalysis', () => 
          this.sectionAnalyzers.generateSolutionAnalysis(data)
        ),
        this.generateSectionSafely('marketCompetitiveAnalysis', () => 
          this.sectionAnalyzers.generateMarketCompetitiveAnalysis(data)
        ),
        this.generateSectionSafely('mitsubishiEstateValue', () => 
          this.sectionAnalyzers.generateMitsubishiEstateValue(data)
        ),
        this.generateSectionSafely('validationPlan', () => 
          this.sectionAnalyzers.generateValidationPlan(data)
        ),
        this.generateSectionSafely('riskAnalysis', () => 
          this.sectionAnalyzers.generateRiskAnalysis(data)
        )
      ]);

      return {
        executiveSummary,
        targetAndChallenges,
        solutionAnalysis,
        marketCompetitiveAnalysis,
        mitsubishiEstateValue,
        validationPlan,
        riskAnalysis
      };

    } catch (error) {
      throw new EnhancedAnalystError(
        'Section generation failed',
        'SECTION_GENERATION_ERROR',
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Safely generate a section with error handling
   */
  private async generateSectionSafely<T>(
    sectionName: string, 
    generator: () => T
  ): Promise<T> {
    try {
      console.log(`   Generating ${sectionName}...`);
      const result = generator();
      console.log(`   ✅ ${sectionName} completed with real data`);
      return result;
    } catch (error) {
      console.error(`   ❌ ${sectionName} failed:`, error.message);
      console.error(`   🔍 Error details:`, error);
      if (this.config.validation.enforceDataQuality) {
        throw error;
      }
      // Return a minimal fallback structure if quality enforcement is disabled
      console.warn(`   ⚠️ Using fallback data for ${sectionName} due to data quality enforcement disabled`);
      return this.createFallbackSection(sectionName) as T;
    }
  }

  /**
   * Create fallback section when generation fails
   */
  private createFallbackSection(sectionName: string): any {
    const fallbackMessage = `${sectionName} analysis could not be completed due to insufficient data.`;
    
    switch (sectionName) {
      case 'executiveSummary':
        return {
          businessConcept: fallbackMessage,
          keyValueProposition: 'データ不足により算出不可',
          targetMarketSize: { total: 0, addressable: 0, currency: 'JPY', timeframe: 'TBD' },
          revenueProjection: { year3: 0, year5: 0, currency: 'JPY' },
          investmentRequired: { initial: 0, total: 0, currency: 'JPY' },
          keySuccessFactors: ['データ収集の完了'],
          expectedOutcomes: ['分析の再実行が必要']
        };
      
      case 'targetAndChallenges':
        return {
          primaryTarget: {
            segment: 'TBD',
            size: 0,
            characteristics: [fallbackMessage],
            painPoints: ['データ不足'],
            currentSolutions: ['不明'],
            switchingBarriers: ['分析不可']
          },
          secondaryTargets: [],
          marketChallenges: [],
          customerJourney: {
            awareness: fallbackMessage,
            consideration: fallbackMessage,
            decision: fallbackMessage,
            retention: fallbackMessage
          }
        };
      
      default:
        return { error: fallbackMessage };
    }
  }

  /**
   * Validate extracted data quality
   */
  private validateDataQuality(data: ExtractedData): void {
    if (!this.config.validation.enforceDataQuality) return;

    const issues = [];
    
    // Check business idea completeness
    if (!data.businessIdea.title || !data.businessIdea.description) {
      issues.push('Business idea information is incomplete');
    }
    
    // Check data availability
    let availableDataSources = 0;
    if (data.marketData) availableDataSources++;
    if (data.competitorData) availableDataSources++;
    if (data.technologyData) availableDataSources++;
    if (data.regulatoryData) availableDataSources++;
    if (data.financialData) availableDataSources++;
    
    if (availableDataSources < this.config.validation.requireMinDataPoints) {
      issues.push(`Insufficient data sources: ${availableDataSources}/${this.config.validation.requireMinDataPoints} required`);
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Data quality issues detected:', issues);
      if (this.config.validation.enforceDataQuality) {
        throw new EnhancedAnalystError(
          'Data quality validation failed',
          'DATA_QUALITY_ERROR',
          undefined,
          { issues }
        );
      }
    }
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(data: ExtractedData): any {
    let completenessScore = 0;
    let confidenceScore = 0;
    const dataGaps = [];
    const recommendations = [];

    // Assess completeness
    const dataTypes = ['marketData', 'competitorData', 'technologyData', 'regulatoryData', 'financialData'];
    const availableTypes = dataTypes.filter(type => data[type as keyof ExtractedData] !== null);
    completenessScore = availableTypes.length / dataTypes.length;

    // Assess confidence based on data richness
    if (data.marketData?.marketSize?.total > 0) confidenceScore += 0.2;
    if (data.competitorData?.directCompetitors?.length > 0) confidenceScore += 0.2;
    if (data.technologyData?.coreTechnologies?.length > 0) confidenceScore += 0.2;
    if (data.originalResearchSummary.available) confidenceScore += 0.2;
    if (data.businessIdea.confidence === 'high') confidenceScore += 0.2;

    // Identify gaps
    dataTypes.forEach(type => {
      if (data[type as keyof ExtractedData] === null) {
        dataGaps.push(`${type} not available`);
      }
    });

    // Generate recommendations
    if (completenessScore < 0.6) {
      recommendations.push('収集データの拡充が必要');
    }
    if (confidenceScore < 0.5) {
      recommendations.push('データの信頼性向上が必要');
    }
    if (dataGaps.length > 2) {
      recommendations.push('追加調査の実施を推奨');
    }

    return {
      completeness: Math.round(completenessScore * 100) / 100,
      confidence: Math.round(confidenceScore * 100) / 100,
      dataGaps,
      recommendations
    };
  }

  /**
   * Generate processing metadata
   */
  private generateProcessingMetadata(input: AnalystInput, startTime: number): any {
    return {
      originalResearchUsed: !!input.originalResearch,
      specializedResearchUsed: !!input.specializedResearch,
      analysisDepth: this.config.analysis.depth,
      processingTime: Math.round((Date.now() - startTime) / 1000 * 100) / 100
    };
  }

  /**
   * Get processing statistics (for monitoring/debugging)
   */
  getProcessingStats(): any {
    return {
      agentVersion: '1.0.0',
      configuredDepth: this.config.analysis.depth,
      qualityEnforcement: this.config.validation.enforceDataQuality,
      supportedSections: [
        'executiveSummary',
        'targetAndChallenges', 
        'solutionAnalysis',
        'marketCompetitiveAnalysis',
        'mitsubishiEstateValue',
        'validationPlan',
        'riskAnalysis'
      ]
    };
  }
}