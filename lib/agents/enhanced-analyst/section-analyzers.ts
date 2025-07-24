/**
 * Enhanced Analyst Section Analyzers
 * Writer向けの7つのレポートセクション用アナライザー
 */

import {
  ExecutiveSummary,
  TargetAndChallenges,
  SolutionAnalysis,
  MarketCompetitiveAnalysis,
  MitsubishiEstateValue,
  ValidationPlan,
  RiskAnalysis,
  AnalysisError
} from './types';
import { ExtractedData } from './data-extractor';

export class SectionAnalyzers {

  // ============================================================================
  // 1. 概要セクション
  // ============================================================================
  
  generateExecutiveSummary(data: ExtractedData): ExecutiveSummary {
    try {
      const marketSize = data.marketData?.marketSize?.total || 0;
      const addressableMarket = Math.round(marketSize * 0.3); // Assume 30% addressable
      
      return {
        businessConcept: this.synthesizeBusinessConcept(data),
        keyValueProposition: data.businessIdea.valueProposition || 
          this.deriveValueProposition(data),
        targetMarketSize: {
          total: marketSize,
          addressable: addressableMarket,
          currency: data.marketData?.marketSize?.currency || 'JPY',
          timeframe: `${data.marketData?.marketSize?.year || new Date().getFullYear()}-${(data.marketData?.marketSize?.year || new Date().getFullYear()) + 5}`
        },
        revenueProjection: this.calculateRevenueProjection(data),
        investmentRequired: this.calculateInvestmentRequirements(data),
        keySuccessFactors: this.identifySuccessFactors(data),
        expectedOutcomes: this.defineExpectedOutcomes(data)
      };
    } catch (error) {
      throw new AnalysisError('executiveSummary', `Failed to generate executive summary: ${error.message}`);
    }
  }

  // ============================================================================
  // 2. ターゲット・課題セクション
  // ============================================================================
  
  generateTargetAndChallenges(data: ExtractedData): TargetAndChallenges {
    try {
      const primarySegment = data.marketData?.segments?.[0] || null;
      
      return {
        primaryTarget: {
          segment: primarySegment?.name || data.businessIdea.targetMarket || '大企業・中堅企業',
          size: primarySegment?.size || Math.round((data.marketData?.marketSize?.total || 0) * 0.4),
          characteristics: this.deriveTargetCharacteristics(data),
          painPoints: this.identifyPainPoints(data),
          currentSolutions: this.identifyCurrentSolutions(data),
          switchingBarriers: this.identifySwitchingBarriers(data)
        },
        secondaryTargets: this.identifySecondaryTargets(data),
        marketChallenges: this.identifyMarketChallenges(data),
        customerJourney: this.mapCustomerJourney(data)
      };
    } catch (error) {
      throw new AnalysisError('targetAndChallenges', `Failed to generate target and challenges: ${error.message}`);
    }
  }

  // ============================================================================
  // 3. ソリューションセクション
  // ============================================================================
  
  generateSolutionAnalysis(data: ExtractedData): SolutionAnalysis {
    try {
      return {
        coreOffering: {
          productService: data.businessIdea.description || '革新的なデジタルソリューション',
          keyFeatures: this.identifyKeyFeatures(data),
          uniqueAdvantages: this.identifyUniqueAdvantages(data),
          technology: data.technologyData?.coreTechnologies?.map(t => t.name) || []
        },
        businessModel: {
          revenueStreams: this.analyzeRevenueStreams(data),
          costStructure: this.analyzeCostStructure(data),
          operatingModel: this.defineOperatingModel(data)
        },
        implementationApproach: this.defineImplementationApproach(data),
        scalabilityPlan: this.defineScalabilityPlan(data)
      };
    } catch (error) {
      throw new AnalysisError('solutionAnalysis', `Failed to generate solution analysis: ${error.message}`);
    }
  }

  // ============================================================================
  // 4. 市場・競合セクション
  // ============================================================================
  
  generateMarketCompetitiveAnalysis(data: ExtractedData): MarketCompetitiveAnalysis {
    try {
      return {
        marketDynamics: {
          totalMarket: {
            size: data.marketData?.marketSize?.total || 0,
            growth: data.marketData?.marketSize?.growthRate || 0,
            drivers: this.identifyMarketDrivers(data),
            trends: data.marketData?.trends?.map(t => t.name) || []
          },
          segments: data.marketData?.segments?.map(seg => ({
            name: seg.name,
            size: seg.size,
            growth: seg.growthRate,
            attractiveness: seg.attractiveness
          })) || [],
          entryBarriers: data.competitorData?.landscape?.barriers || [],
          successFactors: data.competitorData?.landscape?.keySuccessFactors || []
        },
        competitiveLandscape: {
          directCompetitors: data.competitorData?.directCompetitors || [],
          indirectCompetitors: data.competitorData?.indirectCompetitors || [],
          competitiveAdvantages: this.identifyCompetitiveAdvantages(data),
          differentiationStrategy: this.defineDifferentiationStrategy(data)
        },
        marketEntry: this.defineMarketEntryStrategy(data)
      };
    } catch (error) {
      throw new AnalysisError('marketCompetitiveAnalysis', `Failed to generate market competitive analysis: ${error.message}`);
    }
  }

  // ============================================================================
  // 5. 三菱地所の意義セクション
  // ============================================================================
  
  generateMitsubishiEstateValue(data: ExtractedData): MitsubishiEstateValue {
    try {
      return {
        strategicFit: {
          coreBusinessAlignment: this.assessCoreBusinessAlignment(data),
          portfolioSynergy: this.assessPortfolioSynergy(data),
          capabilityLeverage: this.identifyCapabilityLeverage(data),
          assetUtilization: this.identifyAssetUtilization(data)
        },
        competitiveAdvantages: {
          uniqueAssets: this.identifyUniqueAssets(data),
          networkValue: this.identifyNetworkValue(data),
          brandStrength: '不動産業界における圧倒的なブランド力と信頼性',
          marketPosition: '国内不動産業界のリーディングカンパニーとしての地位'
        },
        synergyOpportunities: this.identifySynergyOpportunities(data),
        riskMitigation: {
          diversification: this.assessDiversificationValue(data),
          expertise: this.identifyExpertiseBenefits(data),
          resources: this.identifyResourceBenefits(data)
        },
        longTermValue: {
          portfolioContribution: this.assessPortfolioContribution(data),
          futureOptions: this.identifyFutureOptions(data),
          strategicPositioning: this.assessStrategicPositioning(data)
        }
      };
    } catch (error) {
      throw new AnalysisError('mitsubishiEstateValue', `Failed to generate Mitsubishi Estate value: ${error.message}`);
    }
  }

  // ============================================================================
  // 6. 検証計画セクション
  // ============================================================================
  
  generateValidationPlan(data: ExtractedData): ValidationPlan {
    try {
      return {
        marketValidation: {
          hypotheses: this.identifyMarketHypotheses(data),
          methods: this.defineValidationMethods(data),
          pilots: this.definePilotPrograms(data)
        },
        technicalValidation: {
          prototypes: this.definePrototypes(data),
          testing: this.defineTechnicalTesting(data)
        },
        businessModelValidation: {
          experiments: this.defineBusinessExperiments(data),
          financialMilestones: this.defineFinancialMilestones(data)
        },
        goNoGoDecisionPoints: this.defineDecisionPoints(data)
      };
    } catch (error) {
      throw new AnalysisError('validationPlan', `Failed to generate validation plan: ${error.message}`);
    }
  }

  // ============================================================================
  // 7. リスク分析セクション
  // ============================================================================
  
  generateRiskAnalysis(data: ExtractedData): RiskAnalysis {
    try {
      return {
        marketRisks: this.identifyMarketRisks(data),
        technicalRisks: this.identifyTechnicalRisks(data),
        financialRisks: this.identifyFinancialRisks(data),
        regulatoryRisks: this.identifyRegulatoryRisks(data),
        operationalRisks: this.identifyOperationalRisks(data),
        scenarioAnalysis: this.conductScenarioAnalysis(data)
      };
    } catch (error) {
      throw new AnalysisError('riskAnalysis', `Failed to generate risk analysis: ${error.message}`);
    }
  }

  // ============================================================================
  // Helper Methods for Executive Summary
  // ============================================================================

  private synthesizeBusinessConcept(data: ExtractedData): string {
    const idea = data.businessIdea;
    const market = data.marketData;
    const userRequest = data.userOriginalRequest;
    
    // ユーザーの元の要求を反映したビジネスコンセプト
    const requestContext = userRequest ? `「${userRequest}」というご要望に対し、` : '';
    const marketScale = market?.marketSize?.total ? `${Math.round(market.marketSize.total / 1000000000000)}兆円規模の` : '大規模な';
    
    return `${requestContext}${idea.description}を通じて、${marketScale}${idea.targetMarket}市場における${idea.valueProposition}を実現するビジネス。三菱地所の強みを活かした革新的なアプローチで、ユーザーの期待に応える価値創造を目指します。`;
  }

  private deriveValueProposition(data: ExtractedData): string {
    if (data.businessIdea.competitiveAdvantage) {
      return data.businessIdea.competitiveAdvantage;
    }
    
    // Derive value proposition from user's original request
    if (data.userOriginalRequest) {
      const userRequest = data.userOriginalRequest.toLowerCase();
      if (userRequest.includes('ai') || userRequest.includes('人工知能')) {
        return 'AI技術により従来の課題を解決し、効率性と利便性を大幅に向上させる革新的ソリューション';
      }
      if (userRequest.includes('スマート') || userRequest.includes('都市')) {
        return 'スマートテクノロジーを活用して都市の機能を最適化し、住民の生活品質を向上させる包括的プラットフォーム';
      }
      if (userRequest.includes('環境') || userRequest.includes('サステナ')) {
        return '環境負荷削減と経済活動の両立を実現する持続可能なビジネスソリューション';
      }
      if (userRequest.includes('高齢') || userRequest.includes('シニア')) {
        return '高齢社会の課題に対応し、シニア世代の生活品質向上を実現するサービス';
      }
    }
    
    const painPoints = this.identifyPainPoints(data);
    if (painPoints.length > 0) {
      return `${painPoints[0]}を解決する革新的ソリューション`;
    }
    
    return `${data.businessIdea.title}による市場ニーズに応える差別化されたソリューション`;
  }

  private calculateRevenueProjection(data: ExtractedData): any {
    const financialData = data.financialData;
    if (financialData?.revenueProjections?.realistic) {
      const projections = financialData.revenueProjections.realistic;
      return {
        year3: projections.find(p => p.year === new Date().getFullYear() + 3)?.revenue || 0,
        year5: projections.find(p => p.year === new Date().getFullYear() + 5)?.revenue || 0,
        currency: 'JPY'
      };
    }
    
    // Fallback calculation based on market size
    const marketSize = data.marketData?.marketSize?.total || 0;
    const marketShare = 0.01; // Assume 1% market share
    
    return {
      year3: Math.round(marketSize * marketShare * 0.5),
      year5: Math.round(marketSize * marketShare),
      currency: 'JPY'
    };
  }

  private calculateInvestmentRequirements(data: ExtractedData): any {
    const initial = data.businessIdea.initialInvestment || 
                  data.technologyData?.requirements?.estimatedCost || 
                  1000000000; // 1B JPY default
    
    return {
      initial,
      total: Math.round(initial * 1.5), // 50% additional for scaling
      currency: 'JPY'
    };
  }

  private identifySuccessFactors(data: ExtractedData): string[] {
    const factors = [];
    
    // From competitive landscape
    if (data.competitorData?.landscape?.keySuccessFactors) {
      factors.push(...data.competitorData.landscape.keySuccessFactors.slice(0, 3));
    }
    
    // From technology requirements
    if (data.technologyData?.coreTechnologies?.length > 0) {
      factors.push('先進技術の適切な実装と運用');
    }
    
    // From market trends
    if (data.marketData?.trends?.some(t => t.impact === 'high')) {
      factors.push('市場トレンドへの迅速な対応');
    }
    
    // Add user-specific factors based on original request
    if (data.userOriginalRequest) {
      const userRequest = data.userOriginalRequest.toLowerCase();
      if (userRequest.includes('ai') || userRequest.includes('人工知能')) {
        factors.push('AI技術の継続的な改善と最適化');
      }
      if (userRequest.includes('スマート') || userRequest.includes('iot')) {
        factors.push('IoTインフラとの効果的な連携');
      }
      if (userRequest.includes('環境') || userRequest.includes('サステナ')) {
        factors.push('持続可能性への取り組みとESG対応');
      }
      if (userRequest.includes('地方') || userRequest.includes('都市')) {
        factors.push('地域特性に応じたカスタマイゼーション');
      }
    }
    
    // Default factors if none identified
    if (factors.length === 0) {
      factors.push(
        `${data.businessIdea.title}の差別化戦略`,
        '三菱地所の既存アセット活用',
        '効率的な事業展開とスケーリング',
        'ステークホルダーとの戦略的連携'
      );
    }
    
    return factors.slice(0, 5);
  }

  private defineExpectedOutcomes(data: ExtractedData): string[] {
    const outcomes = [];
    
    // Revenue outcome
    const revenueProjection = this.calculateRevenueProjection(data);
    if (revenueProjection.year5 > 0) {
      outcomes.push(`5年以内に年間売上高${Math.round(revenueProjection.year5 / 100000000)}億円達成`);
    }
    
    // Market share outcome
    if (data.marketData?.marketSize?.total > 0) {
      outcomes.push('対象市場における主要プレイヤーとしての地位確立');
    }
    
    // Technology outcome
    if (data.technologyData?.coreTechnologies?.length > 0) {
      outcomes.push('技術的優位性による競争優位の確立');
    }
    
    // User-specific outcomes based on original request
    if (data.userOriginalRequest) {
      const userRequest = data.userOriginalRequest.toLowerCase();
      if (userRequest.includes('ai') || userRequest.includes('人工知能')) {
        outcomes.push('AI技術を活用した業界のデジタル変革リーダーシップ確立');
      }
      if (userRequest.includes('スマート') || userRequest.includes('都市')) {
        outcomes.push('スマートシティ分野での包括的ソリューション提供体制構築');
      }
      if (userRequest.includes('環境') || userRequest.includes('サステナ')) {
        outcomes.push('環境負荷削減と経済成長の両立によるESG価値向上');
      }
      if (userRequest.includes('高齢') || userRequest.includes('シニア')) {
        outcomes.push('高齢社会における新たな価値創造モデルの確立');
      }
    }
    
    // Strategic outcome
    outcomes.push(`「${data.userOriginalRequest || 'ユーザー要求'}」に応える三菱地所独自のソリューション提供`);
    outcomes.push('新規事業領域における持続的成長基盤の構築');
    
    return outcomes.slice(0, 5);
  }

  // ============================================================================
  // Helper Methods for Target and Challenges
  // ============================================================================

  private deriveTargetCharacteristics(data: ExtractedData): string[] {
    const characteristics = [];
    
    if (data.businessIdea.targetMarket.includes('企業')) {
      characteristics.push('DX推進に積極的');
      characteristics.push('年間売上100億円以上');
      characteristics.push('イノベーションへの投資意欲が高い');
    }
    
    if (data.marketData?.trends?.some(t => t.name.includes('AI'))) {
      characteristics.push('AI・機械学習技術の導入を検討');
    }
    
    if (characteristics.length === 0) {
      characteristics.push(
        '成長志向が強い',
        '技術革新に前向き',
        '品質重視',
        '長期的パートナーシップを重視'
      );
    }
    
    return characteristics;
  }

  private identifyPainPoints(data: ExtractedData): string[] {
    const painPoints = [];
    
    // From original research unmet needs
    if (data.originalResearchSummary.available && data.originalResearchSummary.unmetNeeds?.corporate_pain_points) {
      painPoints.push(...data.originalResearchSummary.unmetNeeds.corporate_pain_points.slice(0, 3));
    }
    
    // From market trends (derive pain points)
    data.marketData?.trends?.forEach(trend => {
      if (trend.impact === 'high') {
        painPoints.push(`${trend.name}への対応遅れによる競争力低下`);
      }
    });
    
    // Default pain points
    if (painPoints.length === 0) {
      painPoints.push(
        '既存システムの非効率性',
        'デジタル変革の遅れ',
        '人材不足とスキルギャップ',
        'コスト削減圧力の増大'
      );
    }
    
    return painPoints.slice(0, 5);
  }

  private identifyCurrentSolutions(data: ExtractedData): string[] {
    const solutions = [];
    
    // From competitor data
    data.competitorData?.directCompetitors?.forEach(comp => {
      comp.products?.forEach(product => {
        if (product.name && !solutions.includes(product.name)) {
          solutions.push(product.name);
        }
      });
    });
    
    // Default solutions
    if (solutions.length === 0) {
      solutions.push(
        '従来型システム・ツール',
        '手動プロセス',
        '部分的デジタル化ソリューション',
        '汎用的SaaSサービス'
      );
    }
    
    return solutions.slice(0, 4);
  }

  private identifySwitchingBarriers(data: ExtractedData): string[] {
    return [
      '既存システムからの移行コスト',
      '従業員の学習コストと抵抗',
      'データ移行の複雑さ',
      'ベンダーロックイン',
      '業務プロセスの変更に伴うリスク'
    ];
  }

  private identifySecondaryTargets(data: ExtractedData): any[] {
    const targets = [];
    
    // From market segments
    if (data.marketData?.segments && data.marketData.segments.length > 1) {
      data.marketData.segments.slice(1, 4).forEach((segment, index) => {
        targets.push({
          segment: segment.name,
          size: segment.size,
          opportunity: `${segment.name}セグメントでの展開機会`,
          priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
        });
      });
    }
    
    // Default secondary targets
    if (targets.length === 0) {
      targets.push(
        {
          segment: '中小企業',
          size: 50000000000,
          opportunity: '簡易版サービスによる市場拡大',
          priority: 'medium' as const
        },
        {
          segment: '個人・フリーランス',
          size: 10000000000,
          opportunity: 'B2C市場への展開',
          priority: 'low' as const
        }
      );
    }
    
    return targets;
  }

  private identifyMarketChallenges(data: ExtractedData): any[] {
    const challenges = [];
    
    // From competitive landscape barriers
    if (data.competitorData?.landscape?.barriers) {
      data.competitorData.landscape.barriers.forEach(barrier => {
        challenges.push({
          challenge: barrier,
          impact: 'high' as const,
          currentGaps: ['適切な対応策の不足'],
          addressability: '戦略的アプローチにより対応可能'
        });
      });
    }
    
    // From regulatory risks
    if (data.regulatoryData?.upcomingChanges) {
      data.regulatoryData.upcomingChanges.forEach(change => {
        if (change.impact === 'high') {
          challenges.push({
            challenge: `${change.regulation}への対応`,
            impact: 'high' as const,
            currentGaps: change.requiredActions,
            addressability: change.preparationTime
          });
        }
      });
    }
    
    return challenges.slice(0, 5);
  }

  private mapCustomerJourney(data: ExtractedData): any {
    return {
      awareness: '課題認識とソリューション探索段階での情報提供',
      consideration: '他社比較・ROI検証段階でのデモ・トライアル提供',
      decision: '導入決定段階での個別カスタマイゼーション提案',
      retention: '導入後のサポート・追加機能提案による関係深化'
    };
  }

  // ============================================================================
  // Helper Methods for Solution Analysis
  // ============================================================================

  private identifyKeyFeatures(data: ExtractedData): string[] {
    const features = [];
    
    // From technology data
    if (data.technologyData?.coreTechnologies) {
      data.technologyData.coreTechnologies.forEach(tech => {
        features.push(`${tech.name}を活用した高度な機能`);
      });
    }
    
    // From competitive advantages
    if (data.businessIdea.competitiveAdvantage) {
      features.push(data.businessIdea.competitiveAdvantage);
    }
    
    // Default features
    if (features.length === 0) {
      features.push(
        '直感的なユーザーインターフェース',
        'リアルタイムデータ分析',
        'カスタマイズ可能なダッシュボード',
        'セキュアなクラウド基盤',
        'API連携による既存システム統合'
      );
    }
    
    return features.slice(0, 6);
  }

  private identifyUniqueAdvantages(data: ExtractedData): string[] {
    const advantages = [];
    
    // From competitive differentiation
    if (data.competitorData?.landscape?.differentiationOpportunities) {
      advantages.push(...data.competitorData.landscape.differentiationOpportunities.slice(0, 3));
    }
    
    // From Mitsubishi Estate assets
    advantages.push('三菱地所の豊富な不動産ポートフォリオとの連携');
    advantages.push('大手デベロッパーとしての信頼性とブランド力');
    
    return advantages.slice(0, 5);
  }

  private analyzeRevenueStreams(data: ExtractedData): any[] {
    const streams = [];
    
    // From financial data
    if (data.financialData?.revenueProjections) {
      streams.push({
        stream: 'サブスクリプション収益',
        description: '月額・年額サブスクリプション収益',
        pricing: 'ユーザー数・利用量ベース',
        contribution: 60
      });
    }
    
    streams.push(
      {
        stream: '初期導入費用',
        description: 'システム導入・カスタマイゼーション費用',
        pricing: 'プロジェクトベース',
        contribution: 25
      },
      {
        stream: 'サポート・コンサルティング',
        description: '技術サポート・業務コンサルティング',
        pricing: '時間単価ベース',
        contribution: 15
      }
    );
    
    return streams;
  }

  private analyzeCostStructure(data: ExtractedData): any {
    const techCost = data.technologyData?.requirements?.estimatedCost || 0;
    const regulatoryCost = data.regulatoryData?.applicableLaws?.reduce((sum, law) => sum + law.complianceCost, 0) || 0;
    
    return {
      fixedCosts: {
        '人件費': techCost * 0.6,
        'インフラ・システム運用': techCost * 0.2,
        '研究開発費': techCost * 0.15,
        'コンプライアンス': regulatoryCost,
        '管理費': techCost * 0.05
      },
      variableCosts: {
        'マーケティング費用': '売上の15%',
        '営業費用': '売上の10%',
        'カスタマーサポート': '売上の8%',
        'パートナー手数料': '売上の5%'
      },
      keyDrivers: [
        'エンジニア・専門人材の確保',
        'クラウドインフラのスケーリング',
        'マーケティング投資の効率性'
      ]
    };
  }

  private defineOperatingModel(data: ExtractedData): string {
    if (data.technologyData?.coreTechnologies?.some(t => t.name.includes('SaaS') || t.name.includes('クラウド'))) {
      return 'SaaS型のサブスクリプションモデル';
    }
    
    return 'ライセンス提供とサポートサービスのハイブリッドモデル';
  }

  private defineImplementationApproach(data: ExtractedData): any {
    return {
      phases: [
        {
          phase: 'Phase 1: MVP開発・検証',
          duration: '6ヶ月',
          milestones: ['MVP完成', 'パイロット顧客獲得', '初期フィードバック収集'],
          resources: ['開発チーム5名', 'マーケティング2名', 'セールス1名']
        },
        {
          phase: 'Phase 2: 本格展開',
          duration: '12ヶ月',
          milestones: ['正式版リリース', '50社導入達成', '黒字化達成'],
          resources: ['開発チーム10名', 'マーケティング5名', 'セールス3名']
        },
        {
          phase: 'Phase 3: スケーリング',
          duration: '18ヶ月',
          milestones: ['市場シェア5%獲得', '海外展開開始', '新機能リリース'],
          resources: ['開発チーム20名', 'マーケティング10名', 'セールス8名']
        }
      ],
      criticalPath: [
        'コア技術の開発完了',
        '主要パートナーとの契約締結',
        '規制対応の完了',
        '初期顧客の獲得'
      ],
      dependencies: [
        '技術人材の確保',
        '資金調達の完了',
        'パートナーシップの構築',
        '規制当局の承認'
      ]
    };
  }

  private defineScalabilityPlan(data: ExtractedData): any {
    return {
      domestic: '国内全主要都市への展開、業界縦展開による市場深耕',
      international: 'アジア太平洋地域への展開、現地パートナーとの協業',
      verticalExpansion: [
        '不動産以外の業界への展開',
        '個人向けサービスの開発',
        '政府・自治体向けソリューション'
      ],
      horizontalExpansion: [
        '周辺機能の追加開発',
        'AIアナリティクス機能の強化',
        'IoT連携機能の拡充'
      ]
    };
  }

  // ============================================================================
  // Additional Helper Methods (継続...)
  // ============================================================================

  private identifyMarketDrivers(data: ExtractedData): string[] {
    const drivers = [];
    
    if (data.marketData?.trends) {
      data.marketData.trends.forEach(trend => {
        if (trend.impact === 'high') {
          drivers.push(trend.description);
        }
      });
    }
    
    if (drivers.length === 0) {
      drivers.push(
        'デジタル変革の加速',
        '効率性向上への需要',
        '規制要件の厳格化',
        '競争環境の激化'
      );
    }
    
    return drivers.slice(0, 4);
  }

  private identifyCompetitiveAdvantages(data: ExtractedData): string[] {
    const advantages = [];
    
    if (data.businessIdea.competitiveAdvantage) {
      advantages.push(data.businessIdea.competitiveAdvantage);
    }
    
    advantages.push(
      '三菱地所ブランドの信頼性',
      '豊富な不動産・建設業界ネットワーク',
      '大規模プロジェクトの実行力',
      '長期的視点での投資能力'
    );
    
    return advantages.slice(0, 5);
  }

  private defineDifferentiationStrategy(data: ExtractedData): string {
    if (data.competitorData?.landscape?.differentiationOpportunities?.length > 0) {
      return `${data.competitorData.landscape.differentiationOpportunities[0]}を軸とした差別化戦略`;
    }
    
    return '三菱地所の業界知見と技術力を組み合わせた独自価値提案';
  }

  private defineMarketEntryStrategy(data: ExtractedData): any {
    return {
      strategy: '段階的市場浸透戦略',
      channels: [
        '直接営業',
        'パートナー経由',
        'デジタルマーケティング',
        '業界イベント・展示会'
      ],
      partnerships: [
        'システムインテグレーター',
        'コンサルティングファーム',
        '業界団体',
        '技術パートナー'
      ],
      timeline: '18ヶ月での主要市場カバー',
      investmentNeeds: data.businessIdea.initialInvestment || 1000000000
    };
  }

  // ============================================================================
  // Mitsubishi Estate Value Helper Methods
  // ============================================================================

  private assessCoreBusinessAlignment(data: ExtractedData): string {
    return `不動産業界のDX推進という当社のコア戦略と完全に整合し、${data.businessIdea.targetMarket}における新たな価値創造機会を提供`;
  }

  private assessPortfolioSynergy(data: ExtractedData): string {
    return '既存の不動産開発・運営事業との相乗効果により、顧客への提供価値を大幅に向上させ、事業ポートフォリオの競争力を強化';
  }

  private identifyCapabilityLeverage(data: ExtractedData): string[] {
    return [
      '不動産開発・運営の豊富な経験',
      '大規模プロジェクトマネジメント能力',
      '金融・投資に関する専門知識',
      '規制対応・政府折衝能力',
      '長期的視点での事業構築力'
    ];
  }

  private identifyAssetUtilization(data: ExtractedData): string[] {
    return [
      '全国の保有不動産での実証実験',
      '既存テナント・顧客との関係活用',
      '三菱グループネットワークの活用',
      'ブランド力・信頼性の活用',
      '豊富な資金力の活用'
    ];
  }

  private identifyUniqueAssets(data: ExtractedData): string[] {
    return [
      '丸の内・大手町等のプレミアム立地',
      '全国主要都市の開発・運営実績',
      '大手企業との長期信頼関係',
      '三菱グループ各社との連携基盤',
      '豊富な不動産データ・知見'
    ];
  }

  private identifyNetworkValue(data: ExtractedData): string[] {
    return [
      '主要企業の経営陣とのネットワーク',
      '政府・自治体との政策対話チャネル',
      '金融機関との強固な関係',
      '海外デベロッパーとの提携関係',
      '業界団体での影響力'
    ];
  }

  private identifySynergyOpportunities(data: ExtractedData): any[] {
    return [
      {
        type: 'revenue' as const,
        description: '既存顧客への新サービス提供',
        quantification: '年間50億円の追加収益機会',
        realizationPeriod: '2-3年'
      },
      {
        type: 'cost' as const,
        description: '既存インフラ・人材の活用',
        quantification: '初期投資20%削減',
        realizationPeriod: '初年度から'
      },
      {
        type: 'strategic' as const,
        description: '新規事業領域でのポジション確立',
        quantification: '長期的な競争優位の構築',
        realizationPeriod: '3-5年'
      }
    ];
  }

  private assessDiversificationValue(data: ExtractedData): string {
    return '従来の不動産事業に加え、テクノロジー・サービス事業への展開により、事業ポートフォリオの多様化と安定性向上を実現';
  }

  private identifyExpertiseBenefits(data: ExtractedData): string[] {
    return [
      '不動産業界の深い理解',
      'B2B営業・マーケティングの実績',
      '大型投資判断の経験',
      'リスク管理・コンプライアンス体制',
      '長期事業運営のノウハウ'
    ];
  }

  private identifyResourceBenefits(data: ExtractedData): string[] {
    return [
      '潤沢な資金力による安定した事業推進',
      '優秀な人材の確保・育成力',
      '信頼性の高い経営基盤',
      'グループ会社からの支援体制',
      '長期的視点での投資継続力'
    ];
  }

  private assessPortfolioContribution(data: ExtractedData): string {
    const revenue = this.calculateRevenueProjection(data);
    return `5年以内に年間${Math.round(revenue.year5 / 100000000)}億円規模の新規収益源として、グループ全体の成長に大きく貢献`;
  }

  private identifyFutureOptions(data: ExtractedData): string[] {
    return [
      '海外市場への展開基盤',
      '新技術・新サービスへの投資機会',
      'M&A・提携による事業拡大',
      '関連業界への事業展開',
      'スピンオフ・IPOによる価値実現'
    ];
  }

  private assessStrategicPositioning(data: ExtractedData): string {
    return 'デジタル変革時代における不動産業界のイノベーションリーダーとしての地位確立';
  }

  // ============================================================================
  // Validation Plan Helper Methods
  // ============================================================================

  private identifyMarketHypotheses(data: ExtractedData): string[] {
    return [
      `${data.businessIdea.targetMarket}は提案ソリューションに高い価値を感じる`,
      `現在の課題解決に年間${Math.round(data.businessIdea.initialInvestment / 100000000)}億円以上を投資する意思がある`,
      '競合他社よりも優れた機能・サービスとして認識される',
      '導入後のROIが明確に実証される'
    ];
  }

  private defineValidationMethods(data: ExtractedData): any[] {
    return [
      {
        method: '顧客インタビュー',
        timeline: '3ヶ月',
        resources: '営業・マーケティングチーム',
        successCriteria: ['50社以上との面談実施', '80%以上の課題共感', '60%以上の導入意向']
      },
      {
        method: 'MVP検証',
        timeline: '6ヶ月',
        resources: '開発チーム・パイロット顧客',
        successCriteria: ['5社でのPOC実施', 'NPS 50以上', '継続利用率80%以上']
      }
    ];
  }

  private definePilotPrograms(data: ExtractedData): any[] {
    return [
      {
        name: '大手企業向けパイロット',
        scope: '主要機能の6ヶ月間利用',
        duration: '6ヶ月',
        budget: 50000000,
        kpis: ['利用継続率', 'ROI実証', '追加機能要望数']
      },
      {
        name: '三菱地所グループ内実証',
        scope: '社内業務での実用検証',
        duration: '3ヶ月',
        budget: 20000000,
        kpis: ['業務効率向上率', '従業員満足度', 'コスト削減効果']
      }
    ];
  }

  private definePrototypes(data: ExtractedData): any[] {
    return [
      {
        type: 'コア機能プロトタイプ',
        specifications: data.technologyData?.coreTechnologies?.map(t => t.name) || ['基本機能'],
        timeline: '3ヶ月',
        validation: ['技術実現性', 'パフォーマンス', 'スケーラビリティ']
      },
      {
        type: 'UI/UXプロトタイプ',
        specifications: ['ユーザーインターフェース', 'ユーザーエクスペリエンス'],
        timeline: '2ヶ月',
        validation: ['ユーザビリティ', '学習コスト', '満足度']
      }
    ];
  }

  private defineTechnicalTesting(data: ExtractedData): any[] {
    return [
      {
        testType: '負荷テスト',
        criteria: ['同時接続数1000以上', 'レスポンス時間3秒以下'],
        timeline: '1ヶ月'
      },
      {
        testType: 'セキュリティテスト',
        criteria: ['脆弱性ゼロ', '情報漏洩リスクなし'],
        timeline: '2ヶ月'
      }
    ];
  }

  private defineBusinessExperiments(data: ExtractedData): any[] {
    return [
      {
        hypothesis: '価格設定の最適化',
        experiment: '複数価格帯でのA/Bテスト',
        metrics: ['契約率', '解約率', 'ARPU'],
        timeline: '3ヶ月'
      },
      {
        hypothesis: 'チャネル戦略の検証',
        experiment: '直販vs代理店の効果測定',
        metrics: ['獲得コスト', '契約期間', '満足度'],
        timeline: '6ヶ月'
      }
    ];
  }

  private defineFinancialMilestones(data: ExtractedData): any[] {
    return [
      {
        milestone: '初期売上達成',
        target: '月間売上1億円',
        timeline: '12ヶ月'
      },
      {
        milestone: '黒字化達成',
        target: '営業黒字転換',
        timeline: '24ヶ月'
      },
      {
        milestone: '目標ROI達成',
        target: 'ROI 20%以上',
        timeline: '36ヶ月'
      }
    ];
  }

  private defineDecisionPoints(data: ExtractedData): any[] {
    return [
      {
        decision: 'MVP開発継続判断',
        criteria: ['技術実現性確認', '市場ニーズ確認', '競合優位性確認'],
        timeline: '6ヶ月後',
        alternatives: ['開発継続', '仕様変更', '開発中止']
      },
      {
        decision: '本格事業化判断',
        criteria: ['パイロット成功', '収益性確認', 'スケール可能性確認'],
        timeline: '12ヶ月後',
        alternatives: ['本格展開', '規模縮小', '事業転換']
      }
    ];
  }

  // ============================================================================
  // Risk Analysis Helper Methods
  // ============================================================================

  private identifyMarketRisks(data: ExtractedData): any[] {
    const risks = [];
    
    if (data.marketData?.marketSize?.growthRate < 0.05) {
      risks.push({
        risk: '市場成長の鈍化',
        probability: 'medium' as const,
        impact: 'high' as const,
        mitigation: ['代替市場の開拓', '新機能による市場創造'],
        contingency: '他業界への転用'
      });
    }
    
    if (data.competitorData?.landscape?.intensity === 'high') {
      risks.push({
        risk: '競争激化による価格下落',
        probability: 'high' as const,
        impact: 'high' as const,
        mitigation: ['差別化機能の強化', 'ブランド価値向上'],
        contingency: 'ニッチ市場への特化'
      });
    }
    
    return risks;
  }

  private identifyTechnicalRisks(data: ExtractedData): any[] {
    const risks = [];
    
    data.technologyData?.coreTechnologies?.forEach(tech => {
      if (tech.implementationComplexity === 'high') {
        risks.push({
          risk: `${tech.name}の実装難易度`,
          probability: 'medium' as const,
          impact: 'high' as const,
          mitigation: ['専門人材の確保', '外部パートナーとの協業'],
          timeline: '開発初期段階'
        });
      }
    });
    
    return risks;
  }

  private identifyFinancialRisks(data: ExtractedData): any[] {
    return [
      {
        risk: '開発コストの増大',
        probability: 'medium' as const,
        impact: `初期投資の20-30%増加（${Math.round(data.businessIdea.initialInvestment * 0.25 / 100000000)}億円）`,
        mitigation: ['段階的開発', 'コスト管理強化'],
        monitoring: ['月次予算実績管理', '開発進捗監視']
      },
      {
        risk: '売上計画未達',
        probability: 'medium' as const,
        impact: 'ROI目標未達、追加投資必要',
        mitigation: ['柔軟な価格戦略', 'マーケティング強化'],
        monitoring: ['月次売上分析', '顧客獲得コスト監視']
      }
    ];
  }

  private identifyRegulatoryRisks(data: ExtractedData): any[] {
    const risks = [];
    
    data.regulatoryData?.upcomingChanges?.forEach(change => {
      if (change.impact === 'high') {
        risks.push({
          risk: `${change.regulation}の規制強化`,
          jurisdiction: '日本',
          probability: 'high' as const,
          impact: 'high' as const,
          mitigation: change.requiredActions,
          compliance: ['法務チームの強化', '外部専門家の活用']
        });
      }
    });
    
    return risks;
  }

  private identifyOperationalRisks(data: ExtractedData): any[] {
    return [
      {
        risk: 'キーパーソンの離職',
        category: '人材リスク',
        probability: 'medium' as const,
        impact: 'medium' as const,
        mitigation: ['人材育成・後継者計画', '魅力的な待遇提供']
      },
      {
        risk: 'システム障害・セキュリティ事故',
        category: '技術リスク',
        probability: 'low' as const,
        impact: 'high' as const,
        mitigation: ['冗長化設計', '24時間監視体制']
      }
    ];
  }

  private conductScenarioAnalysis(data: ExtractedData): any {
    const baseRevenue = this.calculateRevenueProjection(data);
    
    return {
      bestCase: {
        assumptions: ['市場成長率20%', '市場シェア5%獲得', '競合優位確立'],
        outcomes: {
          revenue: Math.round(baseRevenue.year5 * 1.5),
          profitMargin: '25%',
          ROI: '35%'
        }
      },
      baseCase: {
        assumptions: ['市場成長率10%', '市場シェア2%獲得', '順調な事業推進'],
        outcomes: {
          revenue: baseRevenue.year5,
          profitMargin: '15%',
          ROI: '20%'
        }
      },
      worstCase: {
        assumptions: ['市場成長率3%', '市場シェア0.5%', '競争激化'],
        outcomes: {
          revenue: Math.round(baseRevenue.year5 * 0.4),
          profitMargin: '5%',
          ROI: '8%'
        }
      }
    };
  }
}