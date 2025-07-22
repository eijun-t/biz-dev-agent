/**
 * Enhanced Ideator Agent - Workflow and Filtering Logic
 * アイデア生成ワークフローとフィルタリングロジック
 */

import {
  BusinessIdea,
  IdeationRequest,
  IdeationResult,
  IdeatorConfig,
  IdeatorState,
  IdeationContext,
  RiskLevel,
  BusinessScale,
  QualityMetrics,
  IdeationSummary,
  GenerationError,
  ValidationError,
  QualityError
} from './enhanced-ideator-types';

import {
  DEFAULT_IDEATOR_CONFIG,
  RISK_LEVEL_DISTRIBUTION,
  BUSINESS_SCALE_DISTRIBUTION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './enhanced-ideator-config';

// ============================================================================
// Workflow Orchestrator
// ============================================================================

export class IdeationWorkflow {
  private config: IdeatorConfig;
  private state: IdeatorState;

  constructor(config: Partial<IdeatorConfig> = {}) {
    this.config = { ...DEFAULT_IDEATOR_CONFIG, ...config };
    this.state = this.initializeState();
  }

  // --------------------------------------------------------------------------
  // Main Workflow Execution
  // --------------------------------------------------------------------------

  async executeIdeationWorkflow(request: IdeationRequest): Promise<IdeationResult> {
    try {
      console.log('🚀 Starting Enhanced Ideation Workflow...');
      const startTime = Date.now();

      // Step 1: Validate and prepare context
      const context = await this.prepareIdeationContext(request);
      
      // Step 2: Generate diverse ideas
      const rawIdeas = await this.generateDiverseIdeas(request, context);
      
      // Step 3: Apply filtering and quality checks
      const filteredIdeas = await this.applyFilteringLogic(rawIdeas, request);
      
      // Step 4: Optimize synergy and balance
      const optimizedIdeas = await this.optimizeSynergyAndBalance(filteredIdeas, request);
      
      // Step 5: Generate final result
      const result = await this.generateFinalResult(
        request, 
        optimizedIdeas, 
        context, 
        Date.now() - startTime
      );

      console.log(`✅ ${SUCCESS_MESSAGES.IDEAS_GENERATED.replace('{count}', result.businessIdeas.length.toString())}`);
      return result;

    } catch (error) {
      console.error('❌ Ideation workflow failed:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Step 1: Context Preparation
  // --------------------------------------------------------------------------

  private async prepareIdeationContext(request: IdeationRequest): Promise<IdeationContext> {
    console.log('📋 Preparing ideation context...');

    const researchData = request.researchData;
    
    // Extract key insights from research data
    const context: IdeationContext = {
      researchSummary: this.extractResearchSummary(researchData),
      keyInsights: this.extractKeyInsights(researchData),
      marketOpportunities: this.extractMarketOpportunities(researchData),
      technologicalTrends: this.extractTechnologicalTrends(researchData),
      competitiveLandscape: this.extractCompetitiveLandscape(researchData),
      regulatoryEnvironment: this.extractRegulatoryEnvironment(researchData),
      userConstraints: this.extractUserConstraints(request)
    };

    // Validate context completeness
    if (!this.validateContext(context)) {
      throw new ValidationError(ERROR_MESSAGES.INSUFFICIENT_RESEARCH_DATA, 'context');
    }

    return context;
  }

  // --------------------------------------------------------------------------
  // Step 2: Diverse Idea Generation
  // --------------------------------------------------------------------------

  private async generateDiverseIdeas(
    request: IdeationRequest, 
    context: IdeationContext
  ): Promise<BusinessIdea[]> {
    console.log('💡 Generating diverse business ideas...');

    const targetCount = request.preferences.riskBalance 
      ? this.calculateTargetCount(request) 
      : this.config.generation.defaultIdeaCount;

    const ideas: BusinessIdea[] = [];
    let iteration = 0;

    while (ideas.length < targetCount && iteration < this.config.generation.iterationLimit) {
      iteration++;
      console.log(`   Iteration ${iteration}: Generating ideas...`);

      // Generate ideas for each risk level
      const riskLevels = this.calculateRiskDistribution(request, targetCount);
      
      for (const [riskLevel, count] of Object.entries(riskLevels)) {
        if (count > 0) {
          const riskIdeas = await this.generateIdeasForRiskLevel(
            riskLevel as RiskLevel,
            count,
            request,
            context,
            ideas // Existing ideas for diversity check
          );
          ideas.push(...riskIdeas);
        }
      }

      // Remove duplicates and low-quality ideas
      const uniqueIdeas = this.removeDuplicateIdeas(ideas);
      ideas.splice(0, ideas.length, ...uniqueIdeas);
    }

    if (ideas.length === 0) {
      throw new GenerationError(ERROR_MESSAGES.GENERATION_TIMEOUT);
    }

    console.log(`   Generated ${ideas.length} diverse ideas`);
    return ideas;
  }

  // --------------------------------------------------------------------------
  // Step 3: Filtering Logic
  // --------------------------------------------------------------------------

  private async applyFilteringLogic(
    ideas: BusinessIdea[], 
    request: IdeationRequest
  ): Promise<BusinessIdea[]> {
    console.log('🔍 Applying filtering logic...');

    const filteredIdeas: BusinessIdea[] = [];

    for (const idea of ideas) {
      try {
        // Basic validation
        if (!this.validateBasicRequirements(idea)) {
          console.log(`   ❌ Rejected: ${idea.title} (basic requirements)`);
          continue;
        }

        // Profit threshold
        if (!this.validateProfitThreshold(idea)) {
          console.log(`   ❌ Rejected: ${idea.title} (profit threshold)`);
          continue;
        }

        // Synergy score
        if (!this.validateSynergyScore(idea)) {
          console.log(`   ❌ Rejected: ${idea.title} (synergy score)`);
          continue;
        }

        // Risk level
        if (!this.validateRiskLevel(idea)) {
          console.log(`   ❌ Rejected: ${idea.title} (risk level)`);
          continue;
        }

        // Feasibility
        if (!this.validateFeasibility(idea)) {
          console.log(`   ❌ Rejected: ${idea.title} (feasibility)`);
          continue;
        }

        // Custom constraints
        if (!this.validateCustomConstraints(idea, request)) {
          console.log(`   ❌ Rejected: ${idea.title} (custom constraints)`);
          continue;
        }

        console.log(`   ✅ Approved: ${idea.title}`);
        filteredIdeas.push(idea);

      } catch (error) {
        console.log(`   ⚠️  Error filtering ${idea.title}:`, error);
      }
    }

    if (filteredIdeas.length === 0) {
      throw new ValidationError(ERROR_MESSAGES.QUALITY_CHECK_FAILED, 'filtering');
    }

    console.log(`   Filtered to ${filteredIdeas.length} qualifying ideas`);
    return filteredIdeas;
  }

  // --------------------------------------------------------------------------
  // Step 4: Synergy and Balance Optimization
  // --------------------------------------------------------------------------

  private async optimizeSynergyAndBalance(
    ideas: BusinessIdea[], 
    request: IdeationRequest
  ): Promise<BusinessIdea[]> {
    console.log('⚖️ Optimizing synergy and balance...');

    // Sort by synergy score and quality
    const sortedIdeas = ideas.sort((a, b) => {
      const synergyDiff = b.mitsubishiSynergy.overallFit - a.mitsubishiSynergy.overallFit;
      if (Math.abs(synergyDiff) > 0.5) return synergyDiff;
      
      return this.calculateOverallQuality(b) - this.calculateOverallQuality(a);
    });

    // Ensure risk balance
    const balancedIdeas = this.ensureRiskBalance(sortedIdeas, request);

    // Ensure business scale diversity
    const diverseIdeas = this.ensureScaleDiversity(balancedIdeas, request);

    // Final selection based on target count
    const targetCount = Math.min(
      this.config.generation.maxIdeaCount,
      request.preferences.riskBalance ? 
        this.calculateTargetCount(request) : 
        this.config.generation.defaultIdeaCount
    );

    const finalIdeas = diverseIdeas.slice(0, targetCount);

    console.log(`   Optimized to ${finalIdeas.length} balanced ideas`);
    console.log(`   ${SUCCESS_MESSAGES.SYNERGY_OPTIMIZED}`);
    console.log(`   ${SUCCESS_MESSAGES.RISK_BALANCED}`);

    return finalIdeas;
  }

  // --------------------------------------------------------------------------
  // Step 5: Final Result Generation
  // --------------------------------------------------------------------------

  private async generateFinalResult(
    request: IdeationRequest,
    ideas: BusinessIdea[],
    context: IdeationContext,
    executionTime: number
  ): Promise<IdeationResult> {
    console.log('📊 Generating final result...');

    const summary = this.generateSummary(ideas);
    const qualityMetrics = this.calculateQualityMetrics(ideas);
    const recommendations = this.generateRecommendations(ideas, context);
    const nextSteps = this.generateNextSteps(ideas, request);

    const result: IdeationResult = {
      requestId: this.generateRequestId(),
      businessIdeas: ideas,
      summary,
      qualityMetrics,
      recommendations,
      nextSteps,
      metadata: {
        executionTime,
        dataSourcesUsed: this.extractDataSources(context),
        processingSteps: this.getProcessingSteps(),
        qualityChecks: this.getQualityChecks(ideas),
        generationParameters: {
          targetIdeaCount: ideas.length,
          diversityWeight: this.config.generation.diversityThreshold,
          synergyWeight: this.config.quality.qualityWeights.synergyAlignment,
          innovationWeight: this.config.quality.qualityWeights.originality,
          feasibilityWeight: this.config.quality.qualityWeights.feasibility,
          algorithmVersion: '1.0.0'
        },
        timestamp: new Date().toISOString()
      }
    };

    console.log(`   📈 Overall quality score: ${qualityMetrics.overallQuality.toFixed(1)}/10`);
    console.log(`   🏢 Average synergy score: ${summary.averageSynergyScore.toFixed(1)}/10`);
    console.log(`   💰 Total estimated profit: ¥${(summary.estimatedTotalProfit / 1_000_000_000).toFixed(1)}B`);

    return result;
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private initializeState(): IdeatorState {
    return {
      generatedIdeas: [],
      iterationCount: 0,
      qualityScores: [],
      processingErrors: [],
      lastExecution: new Date().toISOString()
    };
  }

  private extractResearchSummary(researchData: any): string {
    // Extract and summarize research data
    if (researchData?.summary) {
      return researchData.summary;
    }
    return '市場調査データが提供されました';
  }

  private extractKeyInsights(researchData: any): string[] {
    if (researchData?.crossCategoryInsights) {
      return researchData.crossCategoryInsights.slice(0, 5);
    }
    return ['市場成長トレンド', '技術革新の機会', '競合環境の変化'];
  }

  private extractMarketOpportunities(researchData: any): string[] {
    if (researchData?.keyOpportunities) {
      return researchData.keyOpportunities.slice(0, 5);
    }
    return ['新規市場機会', 'デジタル変革需要', '持続可能性重視'];
  }

  private extractTechnologicalTrends(researchData: any): string[] {
    // Extract technology trends from research data
    const trends: string[] = [];
    
    if (researchData?.categorySummaries) {
      const techCategory = researchData.categorySummaries.find(
        (cat: any) => cat.category === 'technology'
      );
      if (techCategory?.keyFindings) {
        trends.push(...techCategory.keyFindings.slice(0, 3));
      }
    }
    
    return trends.length > 0 ? trends : ['AI・機械学習', 'IoT・センサー技術', 'クラウド・エッジコンピューティング'];
  }

  private extractCompetitiveLandscape(researchData: any): string[] {
    // Extract competitive landscape from research data
    const landscape: string[] = [];
    
    if (researchData?.categorySummaries) {
      const compCategory = researchData.categorySummaries.find(
        (cat: any) => cat.category === 'competition'
      );
      if (compCategory?.keyFindings) {
        landscape.push(...compCategory.keyFindings.slice(0, 3));
      }
    }
    
    return landscape.length > 0 ? landscape : ['大手企業の参入', 'スタートアップの台頭', '業界再編の可能性'];
  }

  private extractRegulatoryEnvironment(researchData: any): string[] {
    // Extract regulatory environment from research data
    const regulations: string[] = [];
    
    if (researchData?.categorySummaries) {
      const regCategory = researchData.categorySummaries.find(
        (cat: any) => cat.category === 'regulation'
      );
      if (regCategory?.keyFindings) {
        regulations.push(...regCategory.keyFindings.slice(0, 3));
      }
    }
    
    return regulations.length > 0 ? regulations : ['規制緩和の動き', '新法令の制定', '国際基準の導入'];
  }

  private extractUserConstraints(request: IdeationRequest): string[] {
    const constraints: string[] = [];
    
    if (request.constraints.excludedCategories.length > 0) {
      constraints.push(`除外カテゴリ: ${request.constraints.excludedCategories.join(', ')}`);
    }
    
    if (request.constraints.maxTimeToMarket) {
      constraints.push(`最大開発期間: ${request.constraints.maxTimeToMarket}`);
    }
    
    if (request.constraints.minProfitJPY > 10_000_000_000) {
      constraints.push(`最低利益: ${request.constraints.minProfitJPY / 1_000_000_000}B円`);
    }
    
    return constraints;
  }

  private validateContext(context: IdeationContext): boolean {
    return (
      context.researchSummary.length > 0 &&
      context.keyInsights.length > 0 &&
      context.marketOpportunities.length > 0
    );
  }

  private calculateTargetCount(request: IdeationRequest): number {
    const baseCount = this.config.generation.defaultIdeaCount;
    const complexityFactor = request.preferences.innovationLevel === 'disruptive' ? 1.5 : 1.0;
    const riskFactor = Object.values(request.preferences.riskBalance).reduce((a, b) => a + b, 0);
    
    return Math.min(
      Math.max(
        Math.round(baseCount * complexityFactor * riskFactor),
        this.config.generation.minIdeaCount
      ),
      this.config.generation.maxIdeaCount
    );
  }

  private calculateRiskDistribution(request: IdeationRequest, targetCount: number): Record<string, number> {
    const distribution = request.preferences.riskBalance || RISK_LEVEL_DISTRIBUTION;
    
    return {
      conservative: Math.round(targetCount * distribution.conservative),
      balanced: Math.round(targetCount * distribution.balanced),
      challenging: Math.round(targetCount * distribution.challenging),
      disruptive: Math.round(targetCount * distribution.disruptive)
    };
  }

  private async generateIdeasForRiskLevel(
    riskLevel: RiskLevel,
    count: number,
    request: IdeationRequest,
    context: IdeationContext,
    existingIdeas: BusinessIdea[]
  ): Promise<BusinessIdea[]> {
    // This would integrate with AI/LLM for actual idea generation
    // For now, return placeholder ideas
    const ideas: BusinessIdea[] = [];
    
    for (let i = 0; i < count; i++) {
      const idea = await this.generateSingleIdea(riskLevel, request, context, existingIdeas);
      if (idea) {
        ideas.push(idea);
      }
    }
    
    return ideas;
  }

  private async generateSingleIdea(
    riskLevel: RiskLevel,
    request: IdeationRequest,
    context: IdeationContext,
    existingIdeas: BusinessIdea[]
  ): Promise<BusinessIdea | null> {
    try {
      const ideaId = `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate complete business idea based on context and risk level
      const riskDescriptions = {
        conservative: '安定性重視の低リスク',
        balanced: 'バランス型の中リスク',
        challenging: '成長性重視の高リスク',
        disruptive: '革新的な破壊的'
      };

      const userInput = request.userInput || 'AI・DX';
      const riskDesc = riskDescriptions[riskLevel] || 'バランス型';
      
      // Create comprehensive business idea
      const businessIdea: BusinessIdea = {
        id: ideaId,
        title: `${userInput}を活用した${riskDesc}ビジネス`,
        description: `${userInput}分野における${riskDesc}なアプローチで、三菱地所の既存事業との相乗効果を最大化する革新的ビジネスモデル。`,
        shortDescription: `${userInput}技術と三菱地所の強みを組み合わせた${riskDesc}ビジネス`,
        targetMarket: `${userInput}関連企業・事業者、および三菱地所既存顧客`,
        revenueModel: `プラットフォーム利用料 + コンサルティングサービス + データ分析サービス`,
        businessModel: {
          type: 'platform',
          description: 'デジタルプラットフォーム型ビジネスモデル',
          keyComponents: ['技術基盤', 'サービス提供', '顧客サポート']
        },
        valueProposition: `${userInput}を活用した革新的なソリューションで、顧客の課題解決と価値創造を実現`,
        competitiveAdvantage: '三菱地所の不動産ノウハウと最新技術の融合による差別化',
        riskLevel,
        businessScale: riskLevel === 'conservative' ? 'mid_market' : riskLevel === 'challenging' ? 'enterprise' : 'startup',
        confidence: riskLevel === 'conservative' ? 'high' : riskLevel === 'challenging' ? 'medium' : 'low',
        estimatedROI: riskLevel === 'conservative' ? 150 : riskLevel === 'challenging' ? 300 : 200,
        estimatedProfitJPY: riskLevel === 'conservative' ? 5000000000 : riskLevel === 'challenging' ? 15000000000 : 10000000000, // 50-150億円
        timeToMarket: riskLevel === 'conservative' ? '12ヶ月' : riskLevel === 'challenging' ? '24ヶ月' : '18ヶ月',
        initialInvestment: riskLevel === 'conservative' ? 50000000 : riskLevel === 'challenging' ? 200000000 : 100000000,
        marketSize: riskLevel === 'conservative' ? 10000000000 : riskLevel === 'challenging' ? 50000000000 : 25000000000,
        mitsubishiSynergy: {
          overallFit: riskLevel === 'conservative' ? 8.5 : riskLevel === 'challenging' ? 7.0 : 7.8,
          capability: [
            {
              category: '不動産開発・管理',
              relevance: 9,
              utilization: 'existing_assets'
            },
            {
              category: '顧客ネットワーク',
              relevance: 8,
              utilization: 'customer_base'
            }
          ],
          businessPortfolio: [
            {
              division: 'オフィス',
              synergy: 8,
              integration: 'high'
            }
          ],
          networkAssets: [
            {
              type: 'partnership',
              value: 7,
              accessibility: 'direct'
            }
          ]
        },
        qualityScore: {
          overall: riskLevel === 'conservative' ? 8.2 : riskLevel === 'challenging' ? 7.5 : 7.9,
          feasibility: riskLevel === 'conservative' ? 9 : riskLevel === 'challenging' ? 6 : 7.5,
          marketPotential: riskLevel === 'conservative' ? 7 : riskLevel === 'challenging' ? 9 : 8,
          innovation: riskLevel === 'conservative' ? 6 : riskLevel === 'challenging' ? 9 : 7.5,
          synergyAlignment: 8.5,
          financialViability: riskLevel === 'conservative' ? 8.5 : riskLevel === 'challenging' ? 7 : 8,
          implementability: riskLevel === 'conservative' ? 9 : riskLevel === 'challenging' ? 6 : 7.5
        },
        implementationSteps: [
          '市場調査と競合分析',
          '技術プラットフォーム開発',
          'パイロット事業実施',
          '本格展開'
        ],
        keyRisks: [
          {
            type: riskLevel === 'conservative' ? 'market' : 'technology',
            level: riskLevel === 'conservative' ? 'low' : riskLevel === 'challenging' ? 'high' : 'medium',
            description: `${riskLevel}レベルに応じた主要リスク`,
            mitigation: '適切なリスク軽減策'
          }
        ],
        successMetrics: [
          '月間アクティブユーザー数',
          '収益成長率',
          '顧客満足度'
        ]
      };

      return businessIdea;

    } catch (error) {
      console.error('Error generating single idea:', error);
      return null;
    }
  }

  private removeDuplicateIdeas(ideas: BusinessIdea[]): BusinessIdea[] {
    const uniqueIdeas: BusinessIdea[] = [];
    const seenTitles = new Set<string>();
    
    for (const idea of ideas) {
      const normalizedTitle = idea.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueIdeas.push(idea);
      }
    }
    
    return uniqueIdeas;
  }

  private validateBasicRequirements(idea: BusinessIdea): boolean {
    return (
      idea.title.length > 0 &&
      idea.shortDescription.length > 0 &&
      idea.businessModel != null &&
      idea.valueProposition != null &&
      idea.mitsubishiSynergy != null
    );
  }

  private validateProfitThreshold(idea: BusinessIdea): boolean {
    return idea.estimatedProfitJPY >= this.config.filtering.minProfitThreshold;
  }

  private validateSynergyScore(idea: BusinessIdea): boolean {
    return idea.mitsubishiSynergy.overallFit >= this.config.filtering.minSynergyScore;
  }

  private validateRiskLevel(idea: BusinessIdea): boolean {
    const maxRisk = this.config.filtering.maxRiskLevel;
    const riskLevels: RiskLevel[] = ['conservative', 'balanced', 'challenging', 'disruptive'];
    const ideaRiskIndex = riskLevels.indexOf(idea.riskLevel);
    const maxRiskIndex = riskLevels.indexOf(maxRisk);
    
    return ideaRiskIndex <= maxRiskIndex;
  }

  private validateFeasibility(idea: BusinessIdea): boolean {
    // Calculate feasibility score based on various factors
    const feasibilityScore = this.calculateFeasibilityScore(idea);
    return feasibilityScore >= this.config.filtering.feasibilityThreshold;
  }

  private calculateFeasibilityScore(idea: BusinessIdea): number {
    // Simplified feasibility calculation
    let score = 5; // Base score
    
    // Adjust based on confidence
    if (idea.confidence === 'high') score += 2;
    else if (idea.confidence === 'medium') score += 1;
    
    // Adjust based on market fit
    if (idea.marketFit === 'excellent') score += 2;
    else if (idea.marketFit === 'good') score += 1;
    
    return Math.min(score, 10);
  }

  private validateCustomConstraints(idea: BusinessIdea, request: IdeationRequest): boolean {
    // Check excluded categories
    if (request.constraints.excludedCategories.includes(idea.category)) {
      return false;
    }
    
    // Check time to market
    if (request.constraints.maxTimeToMarket) {
      // Simplified time comparison - would need more sophisticated parsing
      const maxMonths = this.parseTimeToMarket(request.constraints.maxTimeToMarket);
      const ideaMonths = this.parseTimeToMarket(idea.timeToMarket);
      if (ideaMonths > maxMonths) {
        return false;
      }
    }
    
    return true;
  }

  private parseTimeToMarket(timeStr: string): number {
    // Simple parser for time strings like "2年", "18ヶ月", etc.
    const yearMatch = timeStr.match(/(\d+)年/);
    const monthMatch = timeStr.match(/(\d+)ヶ?月/);
    
    let months = 0;
    if (yearMatch) months += parseInt(yearMatch[1]) * 12;
    if (monthMatch) months += parseInt(monthMatch[1]);
    
    return months || 24; // Default to 24 months if can't parse
  }

  private ensureRiskBalance(ideas: BusinessIdea[], request: IdeationRequest): BusinessIdea[] {
    const targetDistribution = request.preferences.riskBalance || RISK_LEVEL_DISTRIBUTION;
    const targetCount = ideas.length;
    
    const balanced: BusinessIdea[] = [];
    const riskGroups: Record<RiskLevel, BusinessIdea[]> = {
      conservative: [],
      balanced: [],
      challenging: [],
      disruptive: []
    };
    
    // Group ideas by risk level
    ideas.forEach(idea => {
      riskGroups[idea.riskLevel].push(idea);
    });
    
    // Select ideas according to target distribution
    Object.entries(targetDistribution).forEach(([riskLevel, ratio]) => {
      const targetForRisk = Math.round(targetCount * ratio);
      const availableIdeas = riskGroups[riskLevel as RiskLevel];
      
      balanced.push(...availableIdeas.slice(0, targetForRisk));
    });
    
    // Fill remaining slots with best available ideas
    const remaining = targetCount - balanced.length;
    if (remaining > 0) {
      const unusedIdeas = ideas.filter(idea => !balanced.includes(idea));
      const sortedUnused = unusedIdeas.sort((a, b) => 
        this.calculateOverallQuality(b) - this.calculateOverallQuality(a)
      );
      balanced.push(...sortedUnused.slice(0, remaining));
    }
    
    return balanced.slice(0, targetCount);
  }

  private ensureScaleDiversity(ideas: BusinessIdea[], request: IdeationRequest): BusinessIdea[] {
    // Ensure diversity in business scales
    const scaleGroups: Record<BusinessScale, BusinessIdea[]> = {
      startup: [],
      mid_market: [],
      enterprise: [],
      mega_corp: []
    };
    
    ideas.forEach(idea => {
      scaleGroups[idea.businessScale].push(idea);
    });
    
    // Ensure at least one idea from each scale (if available)
    const diverse: BusinessIdea[] = [];
    Object.values(scaleGroups).forEach(group => {
      if (group.length > 0) {
        diverse.push(group[0]); // Add best from each scale
      }
    });
    
    // Add remaining ideas
    const remaining = ideas.filter(idea => !diverse.includes(idea));
    diverse.push(...remaining);
    
    return diverse;
  }

  private calculateOverallQuality(idea: BusinessIdea): number {
    const weights = this.config.quality.qualityWeights;
    
    // Calculate individual scores (simplified)
    const originality = this.calculateOriginalityScore(idea);
    const feasibility = this.calculateFeasibilityScore(idea);
    const marketViability = this.calculateMarketViabilityScore(idea);
    const synergyAlignment = idea.mitsubishiSynergy.overallFit;
    const competitiveAdvantage = this.calculateCompetitiveAdvantageScore(idea);
    const riskBalance = this.calculateRiskBalanceScore(idea);
    
    return (
      originality * weights.originality +
      feasibility * weights.feasibility +
      marketViability * weights.marketViability +
      synergyAlignment * weights.synergyAlignment +
      competitiveAdvantage * weights.competitiveAdvantage +
      riskBalance * weights.riskBalance
    );
  }

  private calculateOriginalityScore(idea: BusinessIdea): number {
    // Simplified originality calculation
    return idea.uniqueness === 'high' ? 9 : idea.uniqueness === 'medium' ? 7 : 5;
  }

  private calculateMarketViabilityScore(idea: BusinessIdea): number {
    // Simplified market viability calculation
    return idea.marketFit === 'excellent' ? 9 : 
           idea.marketFit === 'good' ? 7 : 
           idea.marketFit === 'fair' ? 5 : 3;
  }

  private calculateCompetitiveAdvantageScore(idea: BusinessIdea): number {
    // Simplified competitive advantage calculation
    if (!idea.competitiveAnalysis) return 5;
    return idea.competitiveAnalysis.competitiveAdvantages.length * 1.5 + 4;
  }

  private calculateRiskBalanceScore(idea: BusinessIdea): number {
    // Simplified risk balance calculation
    return idea.riskLevel === 'balanced' ? 8 : 
           idea.riskLevel === 'conservative' ? 7 : 
           idea.riskLevel === 'challenging' ? 6 : 5;
  }

  private generateSummary(ideas: BusinessIdea[]): IdeationSummary {
    const riskDistribution = ideas.reduce((acc, idea) => {
      acc[idea.riskLevel] = (acc[idea.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<RiskLevel, number>);

    const scaleDistribution = ideas.reduce((acc, idea) => {
      acc[idea.businessScale] = (acc[idea.businessScale] || 0) + 1;
      return acc;
    }, {} as Record<BusinessScale, number>);

    const averageConfidence = ideas.reduce((sum, idea) => {
      const score = idea.confidence === 'high' ? 8 : idea.confidence === 'medium' ? 6 : 4;
      return sum + score;
    }, 0) / ideas.length;

    const averageSynergyScore = ideas.reduce((sum, idea) => 
      sum + idea.mitsubishiSynergy.overallFit, 0) / ideas.length;

    const topCategories = [...new Set(ideas.map(idea => idea.category))]
      .slice(0, 5);

    const estimatedTotalProfit = ideas.reduce((sum, idea) => 
      sum + idea.estimatedProfitJPY, 0);

    return {
      totalIdeas: ideas.length,
      riskDistribution,
      scaleDistribution,
      averageConfidence,
      averageSynergyScore,
      topCategories,
      estimatedTotalProfit,
      averageTimeToMarket: '18ヶ月' // Simplified
    };
  }

  private calculateQualityMetrics(ideas: BusinessIdea[]): QualityMetrics {
    const totalScores = ideas.reduce((acc, idea) => {
      acc.originality += this.calculateOriginalityScore(idea);
      acc.feasibility += this.calculateFeasibilityScore(idea);
      acc.marketViability += this.calculateMarketViabilityScore(idea);
      acc.synergyAlignment += idea.mitsubishiSynergy.overallFit;
      acc.competitiveAdvantage += this.calculateCompetitiveAdvantageScore(idea);
      acc.riskBalance += this.calculateRiskBalanceScore(idea);
      return acc;
    }, {
      originality: 0,
      feasibility: 0,
      marketViability: 0,
      synergyAlignment: 0,
      competitiveAdvantage: 0,
      riskBalance: 0
    });

    const count = ideas.length;
    const metrics = {
      originality: totalScores.originality / count,
      feasibility: totalScores.feasibility / count,
      marketViability: totalScores.marketViability / count,
      synergyAlignment: totalScores.synergyAlignment / count,
      competitiveAdvantage: totalScores.competitiveAdvantage / count,
      riskBalance: totalScores.riskBalance / count,
      overallQuality: 0
    };

    metrics.overallQuality = (
      metrics.originality * this.config.quality.qualityWeights.originality +
      metrics.feasibility * this.config.quality.qualityWeights.feasibility +
      metrics.marketViability * this.config.quality.qualityWeights.marketViability +
      metrics.synergyAlignment * this.config.quality.qualityWeights.synergyAlignment +
      metrics.competitiveAdvantage * this.config.quality.qualityWeights.competitiveAdvantage +
      metrics.riskBalance * this.config.quality.qualityWeights.riskBalance
    );

    return metrics;
  }

  private generateRecommendations(ideas: BusinessIdea[], context: IdeationContext): string[] {
    const recommendations: string[] = [];
    
    // High synergy ideas
    const highSynergyIdeas = ideas.filter(idea => idea.mitsubishiSynergy.overallFit >= 8);
    if (highSynergyIdeas.length > 0) {
      recommendations.push(`${highSynergyIdeas.length}個の高シナジーアイデアの優先実装を推奨`);
    }
    
    // Risk diversity
    const riskLevels = new Set(ideas.map(idea => idea.riskLevel));
    if (riskLevels.size >= 3) {
      recommendations.push('多様なリスクレベルでポートフォリオ効果を活用可能');
    }
    
    // Market opportunities
    if (context.marketOpportunities.length > 0) {
      recommendations.push('特定された市場機会に基づく迅速な実行を推奨');
    }
    
    return recommendations;
  }

  private generateNextSteps(ideas: BusinessIdea[], request: IdeationRequest): string[] {
    return [
      '選定されたアイデアの詳細ビジネスプラン策定',
      '技術的実現可能性の詳細検証',
      '市場検証・顧客インタビューの実施',
      '必要な投資・リソース計画の策定',
      'パイロットプロジェクトの企画・実行'
    ];
  }

  private generateRequestId(): string {
    return `ideation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractDataSources(context: IdeationContext): string[] {
    return ['Enhanced Researcher Agent', 'Market Database', 'Competitive Intelligence'];
  }

  private getProcessingSteps(): string[] {
    return [
      'Context Preparation',
      'Diverse Idea Generation',
      'Filtering Logic Application',
      'Synergy and Balance Optimization',
      'Final Result Generation'
    ];
  }

  private getQualityChecks(ideas: BusinessIdea[]): any[] {
    return ideas.map(idea => ({
      checkType: 'Comprehensive Quality Check',
      status: 'passed' as const,
      details: `${idea.title} passed all quality criteria`,
      score: this.calculateOverallQuality(idea)
    }));
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  public getState(): IdeatorState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<IdeatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public reset(): void {
    this.state = this.initializeState();
  }
}