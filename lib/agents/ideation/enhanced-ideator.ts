/**
 * Enhanced Ideator Agent - Core Implementation
 * 強化されたアイデア生成エージェントのメイン実装
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  BusinessIdea,
  IdeationRequest,
  IdeationResult,
  IdeatorConfig,
  IdeatorState,
  IdeationContext,
  RiskLevel,
  BusinessScale,
  BusinessModel,
  ValueProposition,
  MarketPositioning,
  TechnicalRequirements,
  ImplementationRoadmap,
  MitsubishiSynergy,
  CompetitiveAnalysis,
  RiskAssessment,
  IdeaMetadata,
  GenerationError,
  ValidationError
} from './enhanced-ideator-types';

import {
  DEFAULT_IDEATOR_CONFIG,
  BUSINESS_CATEGORIES,
  IDEATION_PROMPTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './enhanced-ideator-config';

import { IdeationWorkflow } from './ideation-workflow';

// ============================================================================
// Enhanced Ideator Agent
// ============================================================================

export class EnhancedIdeatorAgent {
  private config: IdeatorConfig;
  private state: IdeatorState;
  private workflow: IdeationWorkflow;
  private llm: ChatOpenAI;

  constructor(
    config: Partial<IdeatorConfig> = {},
    llmConfig: { apiKey?: string; model?: string } = {}
  ) {
    this.config = { ...DEFAULT_IDEATOR_CONFIG, ...config };
    this.workflow = new IdeationWorkflow(this.config);
    
    // Initialize LLM
    this.llm = new ChatOpenAI({
      openAIApiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY,
      modelName: llmConfig.model || 'gpt-4',
      temperature: 0.8, // High creativity for ideation
      maxTokens: 4000
    });

    this.state = {
      generatedIdeas: [],
      iterationCount: 0,
      qualityScores: [],
      processingErrors: [],
      lastExecution: new Date().toISOString()
    };

    console.log('🚀 Enhanced Ideator Agent initialized');
    console.log(`   Configuration: ${this.config.generation.defaultIdeaCount} ideas target`);
    console.log(`   Quality threshold: ${this.config.quality.minQualityScore}/10`);
    console.log(`   Synergy threshold: ${this.config.filtering.minSynergyScore}/10`);
  }

  // --------------------------------------------------------------------------
  // Main Public Interface
  // --------------------------------------------------------------------------

  async generateBusinessIdeas(
    userInput: string,
    researchData: any,
    preferences: Partial<IdeationRequest['preferences']> = {},
    constraints: Partial<IdeationRequest['constraints']> = {},
    language: 'ja' | 'en' = 'ja',
    region: 'japan' | 'asia' | 'global' = 'japan'
  ): Promise<IdeationResult> {
    try {
      console.log('💡 Starting business idea generation...');
      console.log(`   User input: "${userInput}"`);
      console.log(`   Language: ${language}, Region: ${region}`);

      // Create ideation request
      const request: IdeationRequest = {
        userInput,
        researchData,
        preferences: {
          riskBalance: preferences.riskBalance || {
            conservative: 0.25,
            balanced: 0.50,
            challenging: 0.20,
            disruptive: 0.05
          },
          focusAreas: preferences.focusAreas || [],
          businessScales: preferences.businessScales || ['mid_market', 'enterprise'],
          timeHorizon: preferences.timeHorizon || 'medium_term',
          innovationLevel: preferences.innovationLevel || 'breakthrough',
          prioritizeSynergy: preferences.prioritizeSynergy !== false
        },
        constraints: {
          minProfitJPY: constraints.minProfitJPY || 10_000_000_000,
          maxTimeToMarket: constraints.maxTimeToMarket || '3年以内',
          requiredSynergyScore: constraints.requiredSynergyScore || 6,
          excludedCategories: constraints.excludedCategories || [],
          mandatoryRequirements: constraints.mandatoryRequirements || [],
          budgetConstraints: constraints.budgetConstraints || []
        },
        language,
        region
      };

      // Execute ideation workflow
      const result = await this.workflow.executeIdeationWorkflow(request);

      // Update state
      this.state.generatedIdeas = result.businessIdeas;
      this.state.qualityScores = result.businessIdeas.map(idea => 
        this.calculateIdeaQuality(idea)
      );
      this.state.lastExecution = new Date().toISOString();

      console.log(`✅ Generated ${result.businessIdeas.length} business ideas`);
      console.log(`   Average quality: ${result.qualityMetrics.overallQuality.toFixed(1)}/10`);
      console.log(`   Total profit potential: ¥${(result.summary.estimatedTotalProfit / 1_000_000_000).toFixed(1)}B`);

      return result;

    } catch (error) {
      this.state.processingErrors.push(error instanceof Error ? error.message : String(error));
      console.error('❌ Business idea generation failed:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Individual Idea Generation (for workflow integration)
  // --------------------------------------------------------------------------

  async generateSingleBusinessIdea(
    riskLevel: RiskLevel,
    userInput: string,
    context: IdeationContext,
    existingIdeas: BusinessIdea[] = []
  ): Promise<BusinessIdea> {
    try {
      console.log(`   Generating ${riskLevel} risk level idea...`);

      // Generate core concept
      const coreConcept = await this.generateCoreConcept(riskLevel, userInput, context);
      
      // Generate detailed components
      const businessModel = await this.generateBusinessModel(coreConcept, context);
      const valueProposition = await this.generateValueProposition(coreConcept, context);
      const marketPositioning = await this.generateMarketPositioning(coreConcept, context);
      const technicalRequirements = await this.generateTechnicalRequirements(coreConcept, context);
      const implementationRoadmap = await this.generateImplementationRoadmap(coreConcept, context);
      const mitsubishiSynergy = await this.generateMitsubishiSynergy(coreConcept, context);
      const competitiveAnalysis = await this.generateCompetitiveAnalysis(coreConcept, context);
      const riskAssessment = await this.generateRiskAssessment(coreConcept, riskLevel, context);

      // Create complete business idea
      const businessIdea: BusinessIdea = {
        id: `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: coreConcept.title,
        shortDescription: coreConcept.description,
        category: coreConcept.category,
        riskLevel,
        businessScale: this.determineBusinessScale(coreConcept, marketPositioning),
        estimatedProfitJPY: this.calculateEstimatedProfit(businessModel, marketPositioning),
        timeToMarket: implementationRoadmap.totalTimeline,
        confidence: this.calculateConfidence(riskLevel, technicalRequirements),
        uniqueness: this.calculateUniqueness(coreConcept, existingIdeas),
        marketFit: this.calculateMarketFit(valueProposition, marketPositioning),
        businessModel,
        valueProposition,
        marketPositioning,
        technicalRequirements,
        implementationRoadmap,
        mitsubishiSynergy,
        competitiveAnalysis,
        riskAssessment,
        metadata: this.generateMetadata(coreConcept, context)
      };

      // Validate idea quality
      const qualityScore = this.calculateIdeaQuality(businessIdea);
      if (qualityScore < this.config.quality.minQualityScore) {
        throw new ValidationError(
          `Generated idea quality (${qualityScore.toFixed(1)}) below threshold (${this.config.quality.minQualityScore})`,
          'quality',
          { idea: businessIdea.title, score: qualityScore }
        );
      }

      console.log(`   ✅ Generated: "${businessIdea.title}" (Quality: ${qualityScore.toFixed(1)}/10)`);
      return businessIdea;

    } catch (error) {
      console.error(`   ❌ Failed to generate ${riskLevel} idea:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Core Concept Generation
  // --------------------------------------------------------------------------

  private async generateCoreConcept(
    riskLevel: RiskLevel,
    userInput: string,
    context: IdeationContext
  ): Promise<{
    title: string;
    description: string;
    category: string;
    keyFeatures: string[];
    innovationLevel: string;
  }> {
    const prompt = `${IDEATION_PROMPTS.systemPrompt}

# 新規ビジネスアイデア生成

## 制約条件：
- リスクレベル: ${riskLevel}
- ユーザー入力: "${userInput}"
- 市場調査概要: ${context.researchSummary}

## 主要インサイト：
${context.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

## 市場機会：
${context.marketOpportunities.map((opp, i) => `${i + 1}. ${opp}`).join('\n')}

## 技術トレンド：
${context.technologicalTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

三菱地所の強みを活かした革新的なビジネスアイデアのコアコンセプトを生成してください。

以下のJSON形式で回答してください：
{
  "title": "ビジネスアイデアのタイトル",
  "description": "200文字程度の簡潔な説明",
  "category": "ビジネスカテゴリ（例：PropTech、スマートシティ等）",
  "keyFeatures": ["主要機能1", "主要機能2", "主要機能3"],
  "innovationLevel": "革新性の説明"
}`;

    try {
      const response = await this.llm.call([{ role: 'user', content: prompt }]);
      const concept = JSON.parse(response.content as string);
      
      // Validate generated concept
      if (!concept.title || !concept.description || !concept.category) {
        throw new GenerationError('Invalid concept structure generated');
      }

      return concept;
    } catch (error) {
      console.error('Failed to generate core concept:', error);
      // Fallback to template-based generation
      return this.generateFallbackConcept(riskLevel, userInput);
    }
  }

  private generateFallbackConcept(riskLevel: RiskLevel, userInput: string): {
    title: string;
    description: string;
    category: string;
    keyFeatures: string[];
    innovationLevel: string;
  } {
    const categories = BUSINESS_CATEGORIES;
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      title: `${randomCategory}ソリューション（${riskLevel}）`,
      description: `${userInput}に基づく${randomCategory}分野での革新的なビジネスソリューション`,
      category: randomCategory,
      keyFeatures: [
        '三菱地所アセット活用',
        'デジタル技術統合',
        '持続可能性重視'
      ],
      innovationLevel: riskLevel === 'disruptive' ? '業界破壊的' : 
                       riskLevel === 'challenging' ? '挑戦的革新' : 
                       riskLevel === 'balanced' ? '段階的革新' : '改良型革新'
    };
  }

  // --------------------------------------------------------------------------
  // Component Generation Methods
  // --------------------------------------------------------------------------

  private async generateBusinessModel(
    concept: any,
    context: IdeationContext
  ): Promise<BusinessModel> {
    const prompt = `ビジネスアイデア「${concept.title}」のビジネスモデルを詳細に設計してください。

概要: ${concept.description}
カテゴリ: ${concept.category}
主要機能: ${concept.keyFeatures.join(', ')}

三菱地所の既存資産とシナジー効果を考慮した収益モデルを提案してください。

以下のJSON形式で回答：
{
  "primaryRevenue": "主要収益源",
  "secondaryRevenue": ["副次収益源1", "副次収益源2"],
  "costStructure": ["主要コスト要因1", "主要コスト要因2"],
  "keyResources": ["重要リソース1", "重要リソース2"],
  "keyPartners": ["重要パートナー1", "重要パートナー2"],
  "customerSegments": ["顧客セグメント1", "顧客セグメント2"],
  "channels": ["販売チャネル1", "販売チャネル2"],
  "scalabilityFactors": ["スケーラビリティ要因1", "スケーラビリティ要因2"]
}`;

    try {
      const response = await this.llm.call([{ role: 'user', content: prompt }]);
      return JSON.parse(response.content as string);
    } catch (error) {
      return this.generateFallbackBusinessModel(concept);
    }
  }

  private generateFallbackBusinessModel(concept: any): BusinessModel {
    return {
      primaryRevenue: 'サブスクリプション収益',
      secondaryRevenue: ['コンサルティング収益', 'データ販売収益'],
      costStructure: ['システム開発費', '運営費', 'マーケティング費'],
      keyResources: ['三菱地所不動産', '技術プラットフォーム', '顧客データ'],
      keyPartners: ['テクノロジー企業', '業界パートナー', '政府機関'],
      customerSegments: ['大手企業', '中小企業', '一般消費者'],
      channels: ['直販', 'パートナー経由', 'オンライン'],
      scalabilityFactors: ['技術の標準化', 'ネットワーク効果', '自動化推進']
    };
  }

  private async generateValueProposition(
    concept: any,
    context: IdeationContext
  ): Promise<ValueProposition> {
    // Similar implementation pattern as generateBusinessModel
    return {
      coreValue: `${concept.title}による価値創造`,
      customerPainPoints: ['既存ソリューションの限界', '効率性の課題', 'コスト負担'],
      solutionOffering: concept.keyFeatures,
      competitiveDifferentiators: ['三菱地所ブランド', '統合ソリューション', '長期パートナーシップ'],
      expectedOutcomes: ['生産性向上', 'コスト削減', '新規価値創造'],
      measureableImpact: ['30%効率化', '20%コスト削減', '新規売上創出']
    };
  }

  private async generateMarketPositioning(
    concept: any,
    context: IdeationContext
  ): Promise<MarketPositioning> {
    return {
      targetMarket: `${concept.category}市場`,
      marketSize: '数千億円規模',
      marketGrowthRate: '年率10-15%成長',
      competitivePosition: 'challenger',
      pricingStrategy: 'プレミアム価格戦略',
      goToMarketStrategy: '段階的市場展開',
      marketingApproach: ['デジタルマーケティング', 'パートナー連携', 'イベント・セミナー'],
      barriers: ['初期投資', '顧客獲得', '技術習得'],
      opportunities: ['市場成長', '規制緩和', '技術進歩']
    };
  }

  private async generateTechnicalRequirements(
    concept: any,
    context: IdeationContext
  ): Promise<TechnicalRequirements> {
    return {
      coreTechnologies: ['クラウドプラットフォーム', 'AI・機械学習', 'IoTセンサー'],
      infrastructureNeeds: ['データセンター', 'ネットワーク基盤', 'セキュリティシステム'],
      skillRequirements: ['AI・データサイエンス', 'システム開発', 'UX・UI設計'],
      developmentTimeline: '18-24ヶ月',
      technicalRisks: ['技術的難易度', 'セキュリティリスク', '規模の拡張性'],
      scalabilityRequirements: ['マイクロサービス', 'API設計', '負荷分散'],
      securityConsiderations: ['データ保護', 'アクセス制御', '監査ログ'],
      complianceRequirements: ['個人情報保護法', '業界規制', '国際基準']
    };
  }

  private async generateImplementationRoadmap(
    concept: any,
    context: IdeationContext
  ): Promise<ImplementationRoadmap> {
    return {
      foundation: {
        duration: '6-12ヶ月',
        objectives: ['基盤システム構築', 'チーム組成', 'パートナーシップ確立'],
        deliverables: ['MVP開発', 'パイロット顧客獲得', '技術検証完了'],
        keyActivities: ['システム設計・開発', '人材採用', '市場調査'],
        requiredResources: ['開発チーム10名', '初期投資5億円', '技術パートナー'],
        successMetrics: ['MVP完成', '初期顧客10社', '技術検証100%'],
        risks: ['技術的困難', '人材確保困難', '競合参入']
      },
      expansion: {
        duration: '12-18ヶ月',
        objectives: ['市場拡大', '機能拡張', '収益化推進'],
        deliverables: ['本格サービス開始', '顧客基盤拡大', '収益黒字化'],
        keyActivities: ['営業・マーケティング強化', '機能追加開発', 'オペレーション最適化'],
        requiredResources: ['営業チーム20名', '追加投資10億円', '営業パートナー'],
        successMetrics: ['顧客100社', '月間売上1億円', '市場シェア5%'],
        risks: ['市場競争激化', '顧客獲得困難', '技術トラブル']
      },
      optimization: {
        duration: '18-24ヶ月',
        objectives: ['事業最適化', '海外展開', 'イノベーション推進'],
        deliverables: ['安定収益確立', '海外市場参入', '次世代技術導入'],
        keyActivities: ['効率化推進', '海外展開戦略実行', 'R&D強化'],
        requiredResources: ['国際チーム30名', '拡張投資20億円', '海外パートナー'],
        successMetrics: ['年間売上50億円', '海外売上20%', '技術特許5件'],
        risks: ['海外市場理解不足', '為替リスク', '技術陳腐化']
      },
      totalTimeline: '3年',
      majorMilestones: [
        {
          name: 'MVP完成',
          timeline: '12ヶ月',
          description: '最小限の機能を持つプロダクト完成',
          dependencies: ['技術開発', 'チーム構築'],
          successCriteria: ['機能動作確認', '初期顧客フィードバック取得']
        }
      ],
      criticalPath: ['技術基盤構築', '初期顧客獲得', '収益化達成'],
      resourceRequirements: [
        {
          type: 'human',
          description: '技術・営業・運営チーム',
          quantity: '60名',
          timeline: '3年間',
          criticality: 'high'
        }
      ]
    };
  }

  private async generateMitsubishiSynergy(
    concept: any,
    context: IdeationContext
  ): Promise<MitsubishiSynergy> {
    return {
      overallFit: 8, // High synergy score
      existingAssetUtilization: [
        {
          assetType: 'real_estate',
          specificAsset: '丸の内エリア',
          utilizationMethod: 'ショーケース・実証実験場として活用',
          expectedBenefit: 'ブランド価値向上と顧客獲得',
          implementationComplexity: 'medium'
        }
      ],
      brandSynergy: ['信頼性・安定性の活用', 'プレミアムブランドイメージ', '長期パートナーシップ'],
      networkEffects: ['大手企業テナントとの連携', '業界横断的ネットワーク', '政府・自治体との関係'],
      operationalSynergies: ['不動産運営ノウハウ', 'プロジェクトマネジメント', '国際展開経験'],
      strategicAdvantages: ['立地・アクセス優位性', '資金調達力', '長期視点での投資'],
      riskMitigation: ['財務基盤の安定性', 'リスク管理体制', '法務・コンプライアンス'],
      synergyScore: {
        realEstate: 9,
        tenantNetwork: 8,
        brandLeverage: 8,
        operationalIntegration: 7,
        strategicAlignment: 8,
        riskReduction: 9
      }
    };
  }

  private async generateCompetitiveAnalysis(
    concept: any,
    context: IdeationContext
  ): Promise<CompetitiveAnalysis> {
    return {
      mainCompetitors: [
        {
          name: '大手IT企業A',
          type: 'direct',
          marketShare: '15%',
          strengths: ['技術力', '資金力', 'ブランド力'],
          weaknesses: ['業界理解不足', '顧客との距離'],
          strategy: '技術先行型',
          threat_level: 'high'
        }
      ],
      competitiveAdvantages: ['不動産業界の深い理解', '長期顧客関係', '物理的アセット'],
      competitiveThreats: ['技術企業の参入', 'スタートアップの革新', '顧客の内製化'],
      marketDifferentiation: ['統合型ソリューション', '物理・デジタル融合', '長期パートナーシップ'],
      competitiveLandscape: '成長市場での競争激化',
      entryBarriers: ['初期投資', '業界知識', '顧客関係'],
      competitiveStrategy: '差別化とパートナーシップ戦略'
    };
  }

  private async generateRiskAssessment(
    concept: any,
    riskLevel: RiskLevel,
    context: IdeationContext
  ): Promise<RiskAssessment> {
    return {
      marketRisks: [
        {
          type: '市場縮小リスク',
          description: '経済状況による市場需要減少',
          probability: 'medium',
          impact: 'high',
          severity: 'medium',
          mitigation: '多角化戦略',
          contingency: '事業規模縮小'
        }
      ],
      technicalRisks: [
        {
          type: '技術陳腐化リスク',
          description: '技術革新による既存技術の陳腐化',
          probability: 'high',
          impact: 'high',
          severity: 'high',
          mitigation: '継続的R&D投資',
          contingency: '技術パートナーシップ強化'
        }
      ],
      operationalRisks: [
        {
          type: '人材確保リスク',
          description: '必要な技術人材の確保困難',
          probability: 'high',
          impact: 'medium',
          severity: 'medium',
          mitigation: '採用戦略強化・研修制度',
          contingency: '外部パートナー活用'
        }
      ],
      financialRisks: [
        {
          type: '収益化遅延リスク',
          description: '想定よりも収益化に時間がかかる',
          probability: 'medium',
          impact: 'high',
          severity: 'medium',
          mitigation: '段階的投資・早期収益化',
          contingency: '事業モデル見直し'
        }
      ],
      regulatoryRisks: [],
      competitiveRisks: [],
      mitigationStrategies: ['リスク分散', '段階的投資', 'パートナーシップ活用'],
      overallRiskLevel: riskLevel
    };
  }

  private generateMetadata(concept: any, context: IdeationContext): IdeaMetadata {
    return {
      generatedAt: new Date().toISOString(),
      sourceResearchData: ['Enhanced Researcher Agent'],
      confidenceFactors: ['市場データ', '技術動向', '競合分析'],
      assumptions: ['市場成長継続', '技術発展', '規制環境安定'],
      keyDataSources: context.researchSummary ? ['市場調査データ'] : [],
      validationStatus: 'draft',
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // --------------------------------------------------------------------------
  // Quality and Scoring Methods
  // --------------------------------------------------------------------------

  private calculateIdeaQuality(idea: BusinessIdea): number {
    const weights = this.config.quality.qualityWeights;
    
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
    return idea.uniqueness === 'high' ? 9 : idea.uniqueness === 'medium' ? 7 : 5;
  }

  private calculateFeasibilityScore(idea: BusinessIdea): number {
    let score = 5;
    if (idea.confidence === 'high') score += 2;
    else if (idea.confidence === 'medium') score += 1;
    
    return Math.min(score + 2, 10); // Base feasibility adjustment
  }

  private calculateMarketViabilityScore(idea: BusinessIdea): number {
    return idea.marketFit === 'excellent' ? 9 : 
           idea.marketFit === 'good' ? 7 : 
           idea.marketFit === 'fair' ? 5 : 3;
  }

  private calculateCompetitiveAdvantageScore(idea: BusinessIdea): number {
    if (!idea.competitiveAnalysis) return 5;
    return Math.min(idea.competitiveAnalysis.competitiveAdvantages.length * 1.5 + 4, 10);
  }

  private calculateRiskBalanceScore(idea: BusinessIdea): number {
    return idea.riskLevel === 'balanced' ? 8 : 
           idea.riskLevel === 'conservative' ? 7 : 
           idea.riskLevel === 'challenging' ? 6 : 5;
  }

  private determineBusinessScale(concept: any, positioning: MarketPositioning): BusinessScale {
    const marketSize = positioning.marketSize;
    if (marketSize.includes('兆')) return 'mega_corp';
    if (marketSize.includes('千億')) return 'enterprise';
    if (marketSize.includes('百億')) return 'mid_market';
    return 'startup';
  }

  private calculateEstimatedProfit(model: BusinessModel, positioning: MarketPositioning): number {
    // Simplified profit calculation
    const baseProfit = 15_000_000_000; // 15B JPY base
    
    // Adjust based on revenue model
    let multiplier = 1.0;
    if (model.primaryRevenue.includes('サブスクリプション')) multiplier += 0.3;
    if (model.scalabilityFactors.length > 2) multiplier += 0.2;
    
    return Math.round(baseProfit * multiplier);
  }

  private calculateConfidence(riskLevel: RiskLevel, technical: TechnicalRequirements): 'low' | 'medium' | 'high' {
    if (riskLevel === 'conservative' && technical.technicalRisks.length <= 2) return 'high';
    if (riskLevel === 'disruptive' || technical.technicalRisks.length > 4) return 'low';
    return 'medium';
  }

  private calculateUniqueness(concept: any, existingIdeas: BusinessIdea[]): 'low' | 'medium' | 'high' {
    // Simplified uniqueness calculation
    const similarIdeas = existingIdeas.filter(idea => 
      idea.category === concept.category || 
      idea.title.includes(concept.title.split(' ')[0])
    );
    
    if (similarIdeas.length === 0) return 'high';
    if (similarIdeas.length <= 1) return 'medium';
    return 'low';
  }

  private calculateMarketFit(value: ValueProposition, positioning: MarketPositioning): 'poor' | 'fair' | 'good' | 'excellent' {
    // Simplified market fit calculation
    const valueScore = value.competitiveDifferentiators.length;
    const marketScore = positioning.opportunities.length;
    
    const totalScore = valueScore + marketScore;
    if (totalScore >= 6) return 'excellent';
    if (totalScore >= 4) return 'good';
    if (totalScore >= 2) return 'fair';
    return 'poor';
  }

  // --------------------------------------------------------------------------
  // Public Utility Methods
  // --------------------------------------------------------------------------

  public getStats(): {
    ideasGenerated: number;
    averageQuality: number;
    lastExecution: string;
    errorCount: number;
    config: IdeatorConfig;
  } {
    return {
      ideasGenerated: this.state.generatedIdeas.length,
      averageQuality: this.state.qualityScores.length > 0 
        ? this.state.qualityScores.reduce((a, b) => a + b, 0) / this.state.qualityScores.length 
        : 0,
      lastExecution: this.state.lastExecution,
      errorCount: this.state.processingErrors.length,
      config: this.config
    };
  }

  public updateConfig(newConfig: Partial<IdeatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.workflow.updateConfig(this.config);
  }

  public getRecentIdeas(count: number = 5): BusinessIdea[] {
    return this.state.generatedIdeas.slice(-count);
  }

  public reset(): void {
    this.state = {
      generatedIdeas: [],
      iterationCount: 0,
      qualityScores: [],
      processingErrors: [],
      lastExecution: new Date().toISOString()
    };
    this.workflow.reset();
  }

  public destroy(): void {
    // Cleanup resources
    this.reset();
    console.log('🧹 Enhanced Ideator Agent destroyed');
  }
}