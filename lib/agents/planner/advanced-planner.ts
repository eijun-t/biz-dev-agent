/**
 * Advanced Planner Agent - Main Implementation
 * 詳細調査計画策定エージェントのメイン実装
 */

import {
  BusinessIdea,
  PlannerInput,
  PlannerOutput,
  ResearchPlan,
  ResearchItem,
  ResearchCategory,
  ResearchPriority,
  ResearchDifficulty,
  PlannerConfig,
  PlannerState,
  PlanAdjustment,
  PlanAdjustmentTrigger,
  ExecutionFeedback,
  PlanningError,
  ValidationError,
  ResourceError
} from './types';

import {
  DEFAULT_PLANNER_CONFIG,
  RESEARCH_CATEGORY_CONFIG,
  RESEARCH_ITEM_TEMPLATES,
  PRIORITY_WEIGHTS,
  DATA_SOURCE_CONFIG,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from './config';

export class AdvancedPlannerAgent {
  private config: PlannerConfig;
  private state: PlannerState;

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = { ...DEFAULT_PLANNER_CONFIG, ...config };
    this.state = this.initializeState();

    console.log('🎯 Advanced Planner Agent initialized');
    console.log(`   Dynamic adjustment: ${this.config.adaptation.enableDynamicAdjustment ? 'enabled' : 'disabled'}`);
    console.log(`   Max items per category: ${this.config.planning.maxItemsPerCategory}`);
  }

  // ============================================================================
  // Main Planning Methods
  // ============================================================================

  async createResearchPlan(input: PlannerInput): Promise<PlannerOutput> {
    try {
      console.log('📋 Creating detailed research plan...');
      const startTime = Date.now();

      // Step 1: Validate input
      this.validateInput(input);

      // Step 2: Analyze business requirements
      const requirements = await this.analyzeBusinessRequirements(input.businessIdea);

      // Step 3: Generate research items
      const researchItems = await this.generateResearchItems(input, requirements);

      // Step 4: Prioritize and optimize
      const optimizedItems = await this.prioritizeAndOptimize(researchItems, input);

      // Step 5: Create execution order and dependencies
      const { executionOrder, criticalPath } = await this.calculateExecutionOrder(optimizedItems);

      // Step 6: Generate final plan
      const researchPlan = await this.generateResearchPlan(
        input,
        optimizedItems,
        executionOrder,
        criticalPath,
        Date.now() - startTime
      );

      // Step 7: Generate output
      const output = await this.generateOutput(researchPlan, input);

      // Store plan
      this.state.currentPlans.set(researchPlan.id, researchPlan);
      this.state.activePlanId = researchPlan.id;

      console.log(`✅ ${SUCCESS_MESSAGES.PLAN_CREATED}`);
      console.log(`   Total research items: ${researchItems.length}`);
      console.log(`   Estimated time: ${researchPlan.totalEstimatedTime} hours`);
      console.log(`   Estimated cost: ¥${researchPlan.totalEstimatedCost.toLocaleString()}`);

      return output;

    } catch (error) {
      console.error('❌ Research plan creation failed:', error);
      throw error;
    }
  }

  async adjustPlan(
    planId: string,
    trigger: PlanAdjustmentTrigger,
    newInformation: any
  ): Promise<PlanAdjustment> {
    try {
      console.log('🔄 Adjusting research plan...');

      const plan = this.state.currentPlans.get(planId);
      if (!plan) {
        throw new PlanningError('Plan not found', 'PLAN_NOT_FOUND');
      }

      // Analyze impact of new information
      const impactAnalysis = await this.analyzeAdjustmentImpact(plan, trigger, newInformation);

      // Generate plan changes
      const changes = await this.generatePlanChanges(plan, impactAnalysis);

      // Create adjustment record
      const adjustment: PlanAdjustment = {
        id: this.generateAdjustmentId(),
        timestamp: new Date().toISOString(),
        trigger,
        changes,
        rationale: this.generateAdjustmentRationale(impactAnalysis),
        impactAssessment: impactAnalysis,
        approval: {
          required: this.isApprovalRequired(impactAnalysis),
          status: 'pending'
        }
      };

      // Auto-approve if within limits
      if (!adjustment.approval.required) {
        adjustment.approval.status = 'approved';
        adjustment.approval.timestamp = new Date().toISOString();
        await this.applyPlanChanges(planId, changes);
      }

      // Store adjustment
      this.state.planHistory.push(adjustment);

      console.log('✅ Plan adjustment created');
      console.log(`   Changes: ${changes.length}`);
      console.log(`   Approval required: ${adjustment.approval.required}`);

      return adjustment;

    } catch (error) {
      console.error('❌ Plan adjustment failed:', error);
      throw error;
    }
  }

  async incorporateFeedback(feedback: ExecutionFeedback): Promise<void> {
    try {
      console.log('📊 Incorporating execution feedback...');

      // Store feedback
      this.state.executionFeedback.push(feedback);

      // Analyze feedback for plan improvements
      const insights = await this.analyzeFeedback(feedback);

      // Generate improvement suggestions
      if (insights.requiresAdjustment) {
        const trigger: PlanAdjustmentTrigger = {
          type: 'new_information',
          source: 'execution_feedback',
          description: `Execution feedback suggests plan adjustments: ${insights.summary}`,
          severity: insights.severity
        };

        await this.adjustPlan(feedback.planId, trigger, feedback);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(feedback);

      console.log('✅ Feedback incorporated');

    } catch (error) {
      console.error('❌ Feedback incorporation failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Business Requirements Analysis (Subtask 1)
  // ============================================================================

  private async analyzeBusinessRequirements(businessIdea: BusinessIdea): Promise<any> {
    console.log('🔍 Analyzing business execution requirements...');

    const requirements = {
      businessModel: this.analyzeBusinessModelRequirements(businessIdea),
      market: this.analyzeMarketRequirements(businessIdea),
      technology: this.analyzeTechnologyRequirements(businessIdea),
      regulatory: this.analyzeRegulatoryRequirements(businessIdea),
      financial: this.analyzeFinancialRequirements(businessIdea),
      operational: this.analyzeOperationalRequirements(businessIdea),
      strategic: this.analyzeStrategicRequirements(businessIdea)
    };

    console.log('   ✅ Business requirements analyzed');
    return requirements;
  }

  private analyzeBusinessModelRequirements(idea: BusinessIdea): any {
    return {
      type: idea.businessModel?.type || 'platform',
      keyComponents: idea.businessModel?.keyComponents || ['technology', 'service', 'operations'],
      revenueStreams: [idea.revenueModel || 'subscription'],
      valueProposition: idea.valueProposition || 'AI-driven value creation',
      targetSegments: [idea.targetMarket || 'enterprise'],
      distributionChannels: this.inferDistributionChannels(idea),
      keyResources: this.inferKeyResources(idea),
      keyPartnerships: this.inferKeyPartnerships(idea)
    };
  }

  private analyzeMarketRequirements(idea: BusinessIdea): any {
    return {
      targetMarket: idea.targetMarket,
      marketSize: idea.marketSize,
      estimatedGrowth: this.estimateMarketGrowth(idea),
      competitiveLandscape: 'requires_analysis',
      marketEntry: this.analyzeMarketEntry(idea),
      customerAcquisition: this.analyzeCustomerAcquisition(idea)
    };
  }

  private analyzeTechnologyRequirements(idea: BusinessIdea): any {
    const techComplexity = this.assessTechnologyComplexity(idea);
    return {
      coreTechnologies: this.identifyCoreTechnologies(idea),
      developmentComplexity: techComplexity,
      intellectualProperty: 'requires_analysis',
      scalabilityRequirements: this.analyzeScalability(idea),
      securityRequirements: this.analyzeSecurityNeeds(idea),
      integrationRequirements: this.analyzeIntegrationNeeds(idea)
    };
  }

  private analyzeRegulatoryRequirements(idea: BusinessIdea): any {
    return {
      industryRegulations: this.identifyIndustryRegulations(idea),
      dataPrivacy: this.assessDataPrivacyRequirements(idea),
      licensing: this.assessLicensingRequirements(idea),
      compliance: this.assessComplianceRequirements(idea)
    };
  }

  private analyzeFinancialRequirements(idea: BusinessIdea): any {
    return {
      initialInvestment: idea.initialInvestment,
      operationalCosts: this.estimateOperationalCosts(idea),
      revenueProjection: idea.estimatedProfitJPY,
      fundingRequirements: this.analyzeFundingNeeds(idea),
      financialRisks: this.identifyFinancialRisks(idea)
    };
  }

  private analyzeOperationalRequirements(idea: BusinessIdea): any {
    return {
      organizationStructure: this.designOrganizationStructure(idea),
      humanResources: this.analyzeHRRequirements(idea),
      processes: this.identifyKeyProcesses(idea),
      infrastructure: this.analyzeInfrastructureNeeds(idea),
      suppliers: this.identifySuppliers(idea)
    };
  }

  private analyzeStrategicRequirements(idea: BusinessIdea): any {
    return {
      mitsubishiSynergy: idea.mitsubishiSynergy,
      strategicFit: this.analyzeStrategicFit(idea),
      partnershipOpportunities: this.identifyPartnershipOpportunities(idea),
      competitivePositioning: this.analyzeCompetitivePositioning(idea)
    };
  }

  // ============================================================================
  // Research Items Generation
  // ============================================================================

  private async generateResearchItems(
    input: PlannerInput,
    requirements: any
  ): Promise<ResearchItem[]> {
    console.log('💡 Generating research items...');

    const items: ResearchItem[] = [];
    const categories: ResearchCategory[] = [
      'target_customer',
      'solution_technology',
      'market_competition',
      'risk_analysis',
      'execution_planning'
    ];

    for (const category of categories) {
      const categoryItems = await this.generateCategoryItems(category, input, requirements);
      items.push(...categoryItems);
    }

    // Filter and validate items
    const validItems = items.filter(item => this.validateResearchItem(item));

    console.log(`   Generated ${validItems.length} research items across ${categories.length} categories`);
    return validItems;
  }

  private async generateCategoryItems(
    category: ResearchCategory,
    input: PlannerInput,
    requirements: any
  ): Promise<ResearchItem[]> {
    const templates = RESEARCH_ITEM_TEMPLATES[category] || [];
    const items: ResearchItem[] = [];

    for (const template of templates) {
      // Customize template based on business idea
      const customizedItem = await this.customizeResearchItem(template, category, input, requirements);
      
      if (customizedItem) {
        items.push(customizedItem);
      }

      // Limit items per category
      if (items.length >= this.config.planning.maxItemsPerCategory) {
        break;
      }
    }

    // Add additional items based on requirements
    const additionalItems = await this.generateAdditionalItems(category, input, requirements);
    items.push(...additionalItems);

    return items.slice(0, this.config.planning.maxItemsPerCategory);
  }

  private async customizeResearchItem(
    template: any,
    category: ResearchCategory,
    input: PlannerInput,
    requirements: any
  ): Promise<ResearchItem | null> {
    try {
      const item: ResearchItem = {
        id: this.generateItemId(category),
        category,
        title: template.title,
        description: this.customizeDescription(template.description, input.businessIdea),
        priority: this.calculatePriority(template, input),
        difficulty: this.estimateDifficulty(template, requirements),
        estimatedTimeHours: this.estimateTime(template, category),
        estimatedCost: this.estimateCost(template, category),
        methods: template.methods || [],
        dataSources: this.identifyDataSources(template.methods),
        expectedOutputs: template.expectedOutputs || [],
        dependencies: [],
        keyQuestions: this.customizeKeyQuestions(template.keyQuestions, input.businessIdea),
        successCriteria: this.generateSuccessCriteria(template, input),
        deliverables: template.expectedOutputs || [],
        tags: this.generateTags(category, input.businessIdea)
      };

      return item;

    } catch (error) {
      console.warn(`Failed to customize research item: ${template.title}`, error);
      return null;
    }
  }

  // ============================================================================
  // Priority Calculation and Optimization (Subtask 2)
  // ============================================================================

  private async prioritizeAndOptimize(
    items: ResearchItem[],
    input: PlannerInput
  ): Promise<ResearchItem[]> {
    console.log('⚖️ Prioritizing and optimizing research items...');

    // Calculate priority scores
    const itemsWithScores = items.map(item => ({
      item,
      score: this.calculatePriorityScore(item, input)
    }));

    // Sort by priority score
    itemsWithScores.sort((a, b) => b.score - a.score);

    // Apply resource constraints
    const optimizedItems = await this.applyResourceConstraints(
      itemsWithScores.map(i => i.item),
      input
    );

    // Balance across categories
    const balancedItems = await this.balanceCategories(optimizedItems);

    console.log(`   ✅ ${SUCCESS_MESSAGES.PLAN_OPTIMIZED}`);
    console.log(`   Optimized from ${items.length} to ${balancedItems.length} items`);

    return balancedItems;
  }

  private calculatePriorityScore(item: ResearchItem, input: PlannerInput): number {
    const weights = this.config.prioritization.weights;

    // Business impact score (0-10)
    const businessImpactScore = this.calculateBusinessImpactScore(item, input.businessIdea);

    // Feasibility score (0-10)
    const feasibilityScore = this.calculateFeasibilityScore(item);

    // Cost efficiency score (0-10)
    const costScore = this.calculateCostEfficiencyScore(item);

    // Time efficiency score (0-10)
    const timeScore = this.calculateTimeEfficiencyScore(item);

    // Risk score (0-10, higher = lower risk)
    const riskScore = this.calculateRiskScore(item);

    // Weighted total
    const totalScore = 
      businessImpactScore * weights.businessImpact +
      feasibilityScore * weights.feasibility +
      costScore * weights.cost +
      timeScore * weights.time +
      riskScore * weights.risk;

    return totalScore;
  }

  private calculateBusinessImpactScore(item: ResearchItem, businessIdea: BusinessIdea): number {
    let score = 5; // Base score

    // Category importance
    const categoryImportance = {
      market_competition: 10,
      target_customer: 9,
      solution_technology: 8,
      risk_analysis: 7,
      execution_planning: 6
    };
    
    score = categoryImportance[item.category] || 5;

    // Adjust based on business idea characteristics
    if (item.category === 'solution_technology' && businessIdea.riskLevel === 'disruptive') {
      score += 2;
    }

    if (item.category === 'market_competition' && businessIdea.marketSize > 10_000_000_000) {
      score += 1;
    }

    return Math.min(score, 10);
  }

  private calculateFeasibilityScore(item: ResearchItem): number {
    const difficultyScores = {
      easy: 10,
      moderate: 8,
      difficult: 6,
      expert_required: 4
    };

    let score = difficultyScores[item.difficulty] || 5;

    // Adjust based on available methods
    if (item.methods.includes('web_search') && item.methods.includes('database_query')) {
      score += 1;
    }

    return Math.min(score, 10);
  }

  private calculateCostEfficiencyScore(item: ResearchItem): number {
    // Higher score for lower cost
    if (item.estimatedCost < 50000) return 10;
    if (item.estimatedCost < 100000) return 8;
    if (item.estimatedCost < 200000) return 6;
    if (item.estimatedCost < 300000) return 4;
    return 2;
  }

  private calculateTimeEfficiencyScore(item: ResearchItem): number {
    // Higher score for lower time
    if (item.estimatedTimeHours < 4) return 10;
    if (item.estimatedTimeHours < 8) return 8;
    if (item.estimatedTimeHours < 16) return 6;
    if (item.estimatedTimeHours < 24) return 4;
    return 2;
  }

  private calculateRiskScore(item: ResearchItem): number {
    let score = 5; // Base score

    // Lower risk for common methods
    if (item.methods.includes('web_search')) score += 2;
    if (item.methods.includes('database_query')) score += 1;
    if (item.methods.includes('expert_required')) score -= 2;

    // Lower risk for shorter duration
    if (item.estimatedTimeHours < 8) score += 1;

    return Math.max(Math.min(score, 10), 1);
  }

  private async applyResourceConstraints(
    items: ResearchItem[],
    input: PlannerInput
  ): Promise<ResearchItem[]> {
    const constraints = input.context.constraints;
    let filteredItems = [...items];

    // Time constraint
    if (constraints.maxTimeWeeks) {
      const maxHours = constraints.maxTimeWeeks * 40; // 40 hours per week
      let totalHours = 0;
      filteredItems = filteredItems.filter(item => {
        if (totalHours + item.estimatedTimeHours <= maxHours) {
          totalHours += item.estimatedTimeHours;
          return true;
        }
        return false;
      });
    }

    // Budget constraint
    if (constraints.maxBudget) {
      let totalCost = 0;
      filteredItems = filteredItems.filter(item => {
        if (totalCost + item.estimatedCost <= constraints.maxBudget) {
          totalCost += item.estimatedCost;
          return true;
        }
        return false;
      });
    }

    // Restricted sources
    if (constraints.restrictedSources.length > 0) {
      filteredItems = filteredItems.filter(item => {
        return !item.dataSources.some(source => 
          constraints.restrictedSources.includes(source)
        );
      });
    }

    return filteredItems;
  }

  private async balanceCategories(items: ResearchItem[]): Promise<ResearchItem[]> {
    const categoryGroups: Record<ResearchCategory, ResearchItem[]> = {
      target_customer: [],
      solution_technology: [],
      market_competition: [],
      risk_analysis: [],
      execution_planning: []
    };

    // Group by category
    items.forEach(item => {
      categoryGroups[item.category].push(item);
    });

    // Ensure minimum representation
    const balancedItems: ResearchItem[] = [];
    const minItemsPerCategory = 2;
    const maxItemsPerCategory = Math.floor(items.length / 5) + 2;

    Object.entries(categoryGroups).forEach(([category, categoryItems]) => {
      const count = Math.min(
        Math.max(categoryItems.length, minItemsPerCategory),
        maxItemsPerCategory
      );
      balancedItems.push(...categoryItems.slice(0, count));
    });

    return balancedItems;
  }

  // ============================================================================
  // Execution Order and Dependencies
  // ============================================================================

  private async calculateExecutionOrder(
    items: ResearchItem[]
  ): Promise<{ executionOrder: string[]; criticalPath: string[] }> {
    console.log('📊 Calculating execution order and critical path...');

    // Set up dependencies based on logical flow
    await this.establishDependencies(items);

    // Calculate execution order using topological sort
    const executionOrder = this.topologicalSort(items);

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(items, executionOrder);

    console.log(`   ✅ ${SUCCESS_MESSAGES.DEPENDENCIES_RESOLVED}`);
    console.log(`   Critical path: ${criticalPath.length} items`);

    return { executionOrder, criticalPath };
  }

  private async establishDependencies(items: ResearchItem[]): Promise<void> {
    // Define logical dependencies between research categories
    const categoryDependencies = {
      target_customer: [],
      solution_technology: [],
      market_competition: ['target_customer'],
      risk_analysis: ['solution_technology', 'market_competition'],
      execution_planning: ['target_customer', 'solution_technology', 'market_competition']
    };

    items.forEach(item => {
      const dependentCategories = categoryDependencies[item.category] || [];
      
      dependentCategories.forEach(depCategory => {
        const dependentItems = items.filter(i => i.category === depCategory);
        if (dependentItems.length > 0) {
          // Add dependency to the first item in the category (as a representative)
          const depItemId = dependentItems[0].id;
          if (!item.dependencies.includes(depItemId)) {
            item.dependencies.push(depItemId);
          }
        }
      });
    });
  }

  private topologicalSort(items: ResearchItem[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (itemId: string) => {
      if (visiting.has(itemId)) {
        throw new PlanningError(ERROR_MESSAGES.DEPENDENCY_LOOP, 'DEPENDENCY_LOOP');
      }
      
      if (visited.has(itemId)) {
        return;
      }

      visiting.add(itemId);
      
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.dependencies.forEach(depId => {
          if (items.find(i => i.id === depId)) {
            visit(depId);
          }
        });
      }
      
      visiting.delete(itemId);
      visited.add(itemId);
      result.push(itemId);
    };

    items.forEach(item => {
      if (!visited.has(item.id)) {
        visit(item.id);
      }
    });

    return result;
  }

  private calculateCriticalPath(items: ResearchItem[], executionOrder: string[]): string[] {
    // Simplified critical path calculation based on longest duration chain
    const itemMap = new Map(items.map(item => [item.id, item]));
    const pathLengths = new Map<string, number>();

    // Calculate path lengths
    executionOrder.forEach(itemId => {
      const item = itemMap.get(itemId);
      if (!item) return;

      let maxDepLength = 0;
      item.dependencies.forEach(depId => {
        const depLength = pathLengths.get(depId) || 0;
        maxDepLength = Math.max(maxDepLength, depLength);
      });

      pathLengths.set(itemId, maxDepLength + item.estimatedTimeHours);
    });

    // Find critical path (longest path)
    const criticalPath: string[] = [];
    let currentItem = executionOrder.reduce((longest, itemId) => {
      const currentLength = pathLengths.get(itemId) || 0;
      const longestLength = pathLengths.get(longest) || 0;
      return currentLength > longestLength ? itemId : longest;
    });

    // Backtrack to build critical path
    while (currentItem) {
      criticalPath.unshift(currentItem);
      const item = itemMap.get(currentItem);
      if (!item || item.dependencies.length === 0) break;

      // Find the dependency with the longest path
      currentItem = item.dependencies.reduce((longest, depId) => {
        const currentLength = pathLengths.get(depId) || 0;
        const longestLength = pathLengths.get(longest) || 0;
        return currentLength > longestLength ? depId : longest;
      }, '');
    }

    return criticalPath;
  }

  // ============================================================================
  // Research Plan Generation
  // ============================================================================

  private async generateResearchPlan(
    input: PlannerInput,
    items: ResearchItem[],
    executionOrder: string[],
    criticalPath: string[],
    executionTime: number
  ): Promise<ResearchPlan> {
    console.log('📋 Generating final research plan...');

    const planId = this.generatePlanId();
    const now = new Date().toISOString();

    // Calculate totals
    const totalEstimatedTime = items.reduce((sum, item) => sum + item.estimatedTimeHours, 0);
    const totalEstimatedCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);

    // Group items by category
    const categories = this.groupItemsByCategory(items);

    // Generate milestones
    const milestones = this.generateMilestones(items, executionOrder);

    // Generate contingency plans
    const contingencyPlans = this.generateContingencyPlans(items, input);

    // Generate resource requirements
    const resourceRequirements = this.generateResourceRequirements(items);

    // Generate quality gates
    const qualityGates = this.generateQualityGates(items);

    const plan: ResearchPlan = {
      id: planId,
      businessIdeaId: input.businessIdea.id,
      businessIdeaTitle: input.businessIdea.title,
      planCreatedAt: now,
      lastUpdatedAt: now,
      status: 'draft',
      totalEstimatedTime: Math.round(totalEstimatedTime * (1 + this.config.planning.defaultTimeBufferPercent / 100)),
      totalEstimatedCost: Math.round(totalEstimatedCost * (1 + this.config.planning.defaultCostBufferPercent / 100)),
      categories,
      executionOrder,
      criticalPath,
      milestones,
      contingencyPlans,
      resourceRequirements,
      qualityGates,
      metadata: {
        plannerVersion: '1.0.0',
        confidence: this.calculatePlanConfidence(items),
        completeness: this.calculatePlanCompleteness(items, input),
        complexity: this.calculatePlanComplexity(items),
        riskLevel: this.calculatePlanRiskLevel(items),
        adaptability: this.calculatePlanAdaptability(items)
      }
    };

    return plan;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private initializeState(): PlannerState {
    return {
      currentPlans: new Map(),
      activePlanId: null,
      planHistory: [],
      executionFeedback: [],
      performanceMetrics: {
        totalPlansCreated: 0,
        averagePlanQuality: 0,
        averageExecutionAccuracy: 0,
        adaptationRate: 0,
        stakeholderSatisfaction: 0,
        costEfficiency: 0,
        timeEfficiency: 0
      },
      lastExecution: new Date().toISOString()
    };
  }

  private validateInput(input: PlannerInput): void {
    if (!input.businessIdea) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_BUSINESS_IDEA, 'businessIdea');
    }

    if (!input.context) {
      throw new ValidationError(ERROR_MESSAGES.INSUFFICIENT_CONTEXT, 'context');
    }

    if (input.context.constraints.maxTimeWeeks <= 0) {
      throw new ResourceError(ERROR_MESSAGES.RESOURCE_CONSTRAINT, 'time');
    }

    if (input.context.constraints.maxBudget <= 0) {
      throw new ResourceError(ERROR_MESSAGES.RESOURCE_CONSTRAINT, 'budget');
    }
  }

  private validateResearchItem(item: ResearchItem): boolean {
    return (
      item.title.length > 0 &&
      item.description.length > 0 &&
      item.keyQuestions.length > 0 &&
      item.expectedOutputs.length > 0 &&
      item.estimatedTimeHours > 0 &&
      item.estimatedCost >= 0
    );
  }

  private generateItemId(category: ResearchCategory): string {
    return `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAdjustmentId(): string {
    return `adj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  // Placeholder methods for complex business logic
  private inferDistributionChannels(idea: BusinessIdea): string[] {
    return ['digital_platform', 'direct_sales', 'partner_network'];
  }

  private inferKeyResources(idea: BusinessIdea): string[] {
    return ['technology_platform', 'human_capital', 'brand', 'data'];
  }

  private inferKeyPartnerships(idea: BusinessIdea): string[] {
    return ['technology_partners', 'distribution_partners', 'strategic_alliances'];
  }

  private estimateMarketGrowth(idea: BusinessIdea): number {
    return idea.riskLevel === 'disruptive' ? 25 : 
           idea.riskLevel === 'challenging' ? 15 : 
           idea.riskLevel === 'balanced' ? 10 : 5;
  }

  private analyzeMarketEntry(idea: BusinessIdea): any {
    return {
      barriers: ['capital_requirements', 'regulatory_approval', 'brand_recognition'],
      strategy: 'gradual_rollout',
      timeline: idea.timeToMarket
    };
  }

  private analyzeCustomerAcquisition(idea: BusinessIdea): any {
    return {
      channels: ['digital_marketing', 'partnerships', 'direct_sales'],
      cost: Math.round(idea.estimatedProfitJPY * 0.1),
      strategy: 'freemium_model'
    };
  }

  private assessTechnologyComplexity(idea: BusinessIdea): string {
    return idea.riskLevel === 'disruptive' ? 'high' :
           idea.riskLevel === 'challenging' ? 'medium' : 'low';
  }

  private identifyCoreTechnologies(idea: BusinessIdea): string[] {
    const title = idea.title || idea.idea_title || '';
    const description = idea.description || idea.idea_description || '';
    
    if (title.includes('AI') || description.includes('AI') || title.includes('DX') || description.includes('DX')) {
      return ['machine_learning', 'natural_language_processing', 'cloud_computing'];
    }
    if (title.includes('スマート') || description.includes('スマート')) {
      return ['iot_sensors', 'data_analytics', 'connectivity'];
    }
    return ['web_technologies', 'database', 'security'];
  }

  // Continue with remaining helper methods...
  private async generateOutput(plan: ResearchPlan, input: PlannerInput): Promise<PlannerOutput> {
    return {
      researchPlan: plan,
      executionGuidance: {
        quickWins: this.identifyQuickWins(plan),
        criticalSuccessFactors: this.identifyCriticalSuccessFactors(plan),
        potentialBottlenecks: this.identifyPotentialBottlenecks(plan),
        recommendedApproach: this.generateRecommendedApproach(plan)
      },
      riskAssessment: {
        planRisks: this.assessPlanRisks(plan),
        contingencyRecommendations: this.generateContingencyRecommendations(plan)
      },
      nextSteps: this.generateNextSteps(plan),
      qualityMetrics: {
        planCompleteness: plan.metadata.completeness,
        feasibility: this.calculatePlanFeasibility(plan),
        efficiency: this.calculatePlanEfficiency(plan),
        adaptability: plan.metadata.adaptability,
        overallQuality: this.calculateOverallQuality(plan)
      }
    };
  }

  private identifyQuickWins(plan: ResearchPlan): string[] {
    const quickWins: string[] = [];
    
    Object.values(plan.categories).forEach(category => {
      const easyItems = category.items.filter(item => 
        item.difficulty === 'easy' && item.estimatedTimeHours <= 4
      );
      easyItems.forEach(item => {
        quickWins.push(`${item.title} (${item.estimatedTimeHours}時間)`);
      });
    });

    return quickWins.slice(0, 5);
  }

  private identifyCriticalSuccessFactors(plan: ResearchPlan): string[] {
    return [
      '市場規模の正確な把握',
      '競合優位性の明確化',
      '技術実装可能性の検証',
      'ターゲット顧客ニーズの詳細理解',
      '投資回収計画の精緻化'
    ];
  }

  private identifyPotentialBottlenecks(plan: ResearchPlan): string[] {
    const bottlenecks: string[] = [];
    
    // Critical path items with high difficulty
    const criticalItems = plan.criticalPath
      .map(itemId => this.findItemById(plan, itemId))
      .filter(item => item && item.difficulty === 'expert_required');

    criticalItems.forEach(item => {
      bottlenecks.push(`${item.title} (専門知識が必要)`);
    });

    return bottlenecks;
  }

  private generateRecommendedApproach(plan: ResearchPlan): string[] {
    return [
      '並行実行可能な調査項目の同時進行',
      '外部専門家の早期確保',
      '調査結果の段階的レビューとフィードバック',
      '重要仮説の優先的検証',
      '代替調査手法の準備'
    ];
  }

  private assessPlanRisks(plan: ResearchPlan): Array<{risk: string; probability: number; impact: number; mitigation: string}> {
    return [
      {
        risk: '専門情報の入手困難',
        probability: 0.3,
        impact: 0.7,
        mitigation: '複数の情報源と専門家ネットワークの活用'
      },
      {
        risk: '調査期間の延長',
        probability: 0.4,
        impact: 0.5,
        mitigation: 'バッファ時間の確保とマイルストーン管理'
      },
      {
        risk: '調査コストの超過',
        probability: 0.2,
        impact: 0.6,
        mitigation: '段階的予算管理とコスト監視'
      }
    ];
  }

  private generateContingencyRecommendations(plan: ResearchPlan): string[] {
    return [
      '代替情報源の事前特定',
      '調査スコープの段階的調整',
      '外部リソースの柔軟な活用',
      '中間評価による計画見直し'
    ];
  }

  private generateNextSteps(plan: ResearchPlan): string[] {
    return [
      '調査計画の承認と予算確保',
      '必要な外部リソースの確保',
      'Task 22 Researcher Agentでの調査実行開始',
      '第1マイルストーンまでの実行',
      '初期結果レビューと計画調整'
    ];
  }

  private calculatePlanFeasibility(plan: ResearchPlan): number {
    let totalScore = 0;
    let totalItems = 0;

    Object.values(plan.categories).forEach(category => {
      category.items.forEach(item => {
        const feasibilityScore = this.calculateFeasibilityScore(item);
        totalScore += feasibilityScore;
        totalItems++;
      });
    });

    return totalItems > 0 ? totalScore / totalItems / 10 : 0;
  }

  private calculatePlanEfficiency(plan: ResearchPlan): number {
    const timeEfficiency = Math.min(plan.totalEstimatedTime / (7 * 24), 1); // Normalize by week
    const costEfficiency = Math.min(plan.totalEstimatedCost / 1000000, 1); // Normalize by 1M yen
    return (timeEfficiency + costEfficiency) / 2;
  }

  private calculateOverallQuality(plan: ResearchPlan): number {
    return (
      plan.metadata.completeness * 0.3 +
      plan.metadata.confidence * 0.25 +
      this.calculatePlanFeasibility(plan) * 0.25 +
      plan.metadata.adaptability * 0.2
    );
  }

  private findItemById(plan: ResearchPlan, itemId: string): ResearchItem | null {
    for (const category of Object.values(plan.categories)) {
      const item = category.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  // Additional helper methods with placeholder implementations
  private customizeDescription(description: string, idea: BusinessIdea): string {
    return description.replace(/\{businessIdea\}/g, idea.title);
  }

  private calculatePriority(template: any, input: PlannerInput): ResearchPriority {
    return template.priority || 'medium';
  }

  private estimateDifficulty(template: any, requirements: any): ResearchDifficulty {
    return template.difficulty || 'moderate';
  }

  private estimateTime(template: any, category: ResearchCategory): number {
    const config = RESEARCH_CATEGORY_CONFIG[category];
    const [min, max] = config.estimatedTimeRange;
    return min + Math.random() * (max - min);
  }

  private estimateCost(template: any, category: ResearchCategory): number {
    const config = RESEARCH_CATEGORY_CONFIG[category];
    const [min, max] = config.estimatedCostRange;
    return min + Math.random() * (max - min);
  }

  private identifyDataSources(methods: string[]): string[] {
    const sources: string[] = [];
    methods.forEach(method => {
      if (method === 'web_search') sources.push('Google', 'Industry Reports');
      if (method === 'database_query') sources.push('Market Database', 'Patent Database');
      if (method === 'api_call') sources.push('API Services');
    });
    return sources;
  }

  private customizeKeyQuestions(questions: string[], idea: BusinessIdea): string[] {
    return questions.map(q => q.replace(/\{businessIdea\}/g, idea.title));
  }

  private generateSuccessCriteria(template: any, input: PlannerInput): string[] {
    return [
      '必要情報の網羅的収集',
      '信頼性の高いデータソース活用',
      '実行可能な提案の生成',
      'タイムライン内での完了'
    ];
  }

  private generateTags(category: ResearchCategory, idea: BusinessIdea): string[] {
    const tags = [category, idea.riskLevel, idea.businessScale];
    if (idea.title.includes('AI')) tags.push('AI');
    if (idea.title.includes('DX')) tags.push('DX');
    return tags;
  }

  private async generateAdditionalItems(
    category: ResearchCategory,
    input: PlannerInput,
    requirements: any
  ): Promise<ResearchItem[]> {
    // Placeholder: could generate additional items based on specific requirements
    return [];
  }

  private groupItemsByCategory(items: ResearchItem[]): ResearchPlan['categories'] {
    const categories: ResearchPlan['categories'] = {
      target_customer: { items: [], totalItems: 0, priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }, estimatedTime: 0, estimatedCost: 0 },
      solution_technology: { items: [], totalItems: 0, priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }, estimatedTime: 0, estimatedCost: 0 },
      market_competition: { items: [], totalItems: 0, priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }, estimatedTime: 0, estimatedCost: 0 },
      risk_analysis: { items: [], totalItems: 0, priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }, estimatedTime: 0, estimatedCost: 0 },
      execution_planning: { items: [], totalItems: 0, priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 }, estimatedTime: 0, estimatedCost: 0 }
    };

    items.forEach(item => {
      const category = categories[item.category];
      category.items.push(item);
      category.totalItems++;
      category.priorityDistribution[item.priority]++;
      category.estimatedTime += item.estimatedTimeHours;
      category.estimatedCost += item.estimatedCost;
    });

    return categories;
  }

  private generateMilestones(items: ResearchItem[], executionOrder: string[]): any[] {
    // Simplified milestone generation
    return [
      {
        id: 'milestone-1',
        name: 'フェーズ1完了',
        description: '基礎調査の完了',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        dependencies: executionOrder.slice(0, Math.floor(executionOrder.length / 3)),
        deliverables: ['基礎調査レポート'],
        completionCriteria: ['全項目の75%以上完了']
      }
    ];
  }

  private generateContingencyPlans(items: ResearchItem[], input: PlannerInput): any[] {
    return [
      {
        id: 'contingency-1',
        trigger: '専門情報の入手困難',
        description: '代替情報源への切り替え',
        alternativeActions: ['学術論文の活用', '業界専門家への直接コンタクト'],
        impactAssessment: { timeImpact: 0.2, costImpact: 0.1, qualityImpact: -0.1 }
      }
    ];
  }

  private generateResourceRequirements(items: ResearchItem[]): any[] {
    return [
      {
        type: 'human',
        description: '市場調査専門家',
        quantity: 1,
        duration: '4週間',
        cost: 400000,
        availability: 'needs_procurement'
      }
    ];
  }

  private generateQualityGates(items: ResearchItem[]): any[] {
    return [
      {
        id: 'quality-gate-1',
        name: '中間品質チェック',
        criteria: ['情報の信頼性確認', 'データの完全性チェック'],
        requiredApproval: ['プロジェクトマネージャー'],
        exitCriteria: ['品質スコア80%以上']
      }
    ];
  }

  private calculatePlanConfidence(items: ResearchItem[]): number {
    const confidenceSum = items.reduce((sum, item) => {
      const difficulty = item.difficulty;
      const confidenceScore = difficulty === 'easy' ? 0.9 :
                            difficulty === 'moderate' ? 0.8 :
                            difficulty === 'difficult' ? 0.6 : 0.4;
      return sum + confidenceScore;
    }, 0);

    return confidenceSum / items.length;
  }

  private calculatePlanCompleteness(items: ResearchItem[], input: PlannerInput): number {
    // Simplified completeness calculation
    const expectedCategories = 5;
    const actualCategories = new Set(items.map(item => item.category)).size;
    return actualCategories / expectedCategories;
  }

  private calculatePlanComplexity(items: ResearchItem[]): number {
    const complexitySum = items.reduce((sum, item) => {
      const difficultyScore = item.difficulty === 'easy' ? 1 :
                            item.difficulty === 'moderate' ? 2 :
                            item.difficulty === 'difficult' ? 3 : 4;
      return sum + difficultyScore;
    }, 0);

    return Math.min(complexitySum / (items.length * 4), 1);
  }

  private calculatePlanRiskLevel(items: ResearchItem[]): number {
    const riskSum = items.reduce((sum, item) => {
      const riskScore = 10 - this.calculateRiskScore(item);
      return sum + riskScore;
    }, 0);

    return Math.min(riskSum / (items.length * 10), 1);
  }

  private calculatePlanAdaptability(items: ResearchItem[]): number {
    // Higher adaptability for items with multiple methods and fewer dependencies
    const adaptabilitySum = items.reduce((sum, item) => {
      const methodScore = Math.min(item.methods.length / 3, 1);
      const dependencyScore = Math.max(1 - item.dependencies.length / 5, 0);
      return sum + (methodScore + dependencyScore) / 2;
    }, 0);

    return adaptabilitySum / items.length;
  }

  // Placeholder methods for dynamic adjustment (Subtask 3)
  private async analyzeAdjustmentImpact(plan: ResearchPlan, trigger: PlanAdjustmentTrigger, newInformation: any): Promise<any> {
    return {
      timeImpact: 0.1,
      costImpact: 0.05,
      qualityImpact: 0,
      riskImpact: 0.02
    };
  }

  private async generatePlanChanges(plan: ResearchPlan, impact: any): Promise<any[]> {
    return []; // Placeholder
  }

  private generateAdjustmentRationale(impact: any): string {
    return '新情報に基づく計画調整が必要です';
  }

  private isApprovalRequired(impact: any): boolean {
    return impact.timeImpact > this.config.adaptation.autoApprovalLimits.timeImpactPercent / 100 ||
           impact.costImpact > this.config.adaptation.autoApprovalLimits.costImpactPercent / 100;
  }

  private async applyPlanChanges(planId: string, changes: any[]): Promise<void> {
    // Placeholder
  }

  private async analyzeFeedback(feedback: ExecutionFeedback): Promise<any> {
    return {
      requiresAdjustment: false,
      severity: 'low' as const,
      summary: 'No significant issues'
    };
  }

  private updatePerformanceMetrics(feedback: ExecutionFeedback): void {
    // Placeholder
  }

  // Public methods for external access
  public getState(): PlannerState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<PlannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getPlan(planId: string): ResearchPlan | undefined {
    return this.state.currentPlans.get(planId);
  }

  public getActivePlan(): ResearchPlan | null {
    if (!this.state.activePlanId) return null;
    return this.state.currentPlans.get(this.state.activePlanId) || null;
  }

  // ============================================================================
  // Missing Helper Methods Implementation
  // ============================================================================

  private analyzeScalability(idea: BusinessIdea): any {
    return {
      technical: 'cloud-based scaling',
      operational: 'process automation',
      financial: 'sustainable unit economics'
    };
  }

  private analyzeSecurityNeeds(idea: BusinessIdea): any {
    return {
      dataProtection: 'encryption and access control',
      systemSecurity: 'secure infrastructure',
      compliance: 'GDPR and industry standards'
    };
  }

  private analyzeIntegrationNeeds(idea: BusinessIdea): any {
    return {
      systems: 'API integrations',
      partners: 'third-party services',
      infrastructure: 'cloud platforms'
    };
  }

  private identifyIndustryRegulations(idea: BusinessIdea): string[] {
    return ['data_protection', 'industry_specific', 'general_business'];
  }

  private assessDataPrivacyRequirements(idea: BusinessIdea): any {
    return {
      level: 'high',
      requirements: ['GDPR compliance', 'data encryption', 'consent management']
    };
  }

  private assessLicensingRequirements(idea: BusinessIdea): any {
    return {
      required: false,
      type: 'none'
    };
  }

  private assessComplianceRequirements(idea: BusinessIdea): any {
    return {
      frameworks: ['ISO27001', 'SOC2'],
      level: 'standard'
    };
  }

  private estimateOperationalCosts(idea: BusinessIdea): number {
    return Math.round(idea.initialInvestment * 0.3); // 30% of initial investment annually
  }

  private analyzeFundingNeeds(idea: BusinessIdea): any {
    return {
      amount: idea.initialInvestment,
      sources: ['venture_capital', 'corporate_investment'],
      timeline: '6-12 months'
    };
  }

  private identifyFinancialRisks(idea: BusinessIdea): string[] {
    return ['market_downturn', 'funding_gap', 'competitive_pricing'];
  }

  private designOrganizationStructure(idea: BusinessIdea): any {
    return {
      structure: 'flat_hierarchy',
      departments: ['development', 'marketing', 'operations'],
      size: 'startup'
    };
  }

  private analyzeHRRequirements(idea: BusinessIdea): any {
    return {
      keyRoles: ['technical_lead', 'product_manager', 'sales_lead'],
      skillsNeeded: ['AI/ML', 'business_development', 'project_management'],
      timeline: '3-6 months'
    };
  }

  private identifyKeyProcesses(idea: BusinessIdea): string[] {
    return ['product_development', 'customer_acquisition', 'quality_assurance'];
  }

  private analyzeInfrastructureNeeds(idea: BusinessIdea): any {
    return {
      technical: 'cloud_infrastructure',
      physical: 'remote_work_setup',
      tools: 'development_and_collaboration_tools'
    };
  }

  private identifySuppliers(idea: BusinessIdea): string[] {
    return ['cloud_providers', 'software_vendors', 'consulting_services'];
  }

  private analyzeStrategicFit(idea: BusinessIdea): any {
    return {
      alignment: 'high',
      synergies: idea.mitsubishiSynergy,
      strategic_value: 'significant'
    };
  }

  private identifyPartnershipOpportunities(idea: BusinessIdea): string[] {
    return ['technology_partners', 'distribution_partners', 'strategic_alliances'];
  }

  private analyzeCompetitivePositioning(idea: BusinessIdea): any {
    return {
      strategy: 'differentiation',
      advantages: [idea.competitiveAdvantage],
      positioning: 'premium_solution'
    };
  }
}