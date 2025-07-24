/**
 * Enhanced Analyst Data Extractor
 * Specialized Research結果からWriter用データを抽出・整理
 */

import {
  AnalystInput,
  DataExtractionError
} from './types';
import {
  SpecializedResearchOutput,
  MarketFindings,
  CompetitorFindings,
  TechnologyFindings,
  RegulatoryFindings,
  FinancialFindings
} from '../specialized-researcher/types';

export class DataExtractor {
  
  /**
   * Specialized Research結果から必要なデータを抽出
   */
  extractResearchData(input: AnalystInput): ExtractedData {
    try {
      const extracted: ExtractedData = {
        userOriginalRequest: input.userInput,
        businessIdea: this.extractBusinessIdea(input.selectedIdea),
        marketData: null,
        competitorData: null,
        technologyData: null,
        regulatoryData: null,
        financialData: null,
        originalResearchSummary: this.extractOriginalResearch(input.originalResearch)
      };

      // Specialized Research結果から各ドメインのデータを抽出
      if (input.specializedResearch?.domainResults) {
        input.specializedResearch.domainResults.forEach(result => {
          switch (result.domain) {
            case 'market':
              extracted.marketData = this.extractMarketData(result.findings as MarketFindings);
              break;
            case 'competitor':
              extracted.competitorData = this.extractCompetitorData(result.findings as CompetitorFindings);
              break;
            case 'technology':
              extracted.technologyData = this.extractTechnologyData(result.findings as TechnologyFindings);
              break;
            case 'regulatory':
              extracted.regulatoryData = this.extractRegulatoryData(result.findings as RegulatoryFindings);
              break;
            case 'financial':
              extracted.financialData = this.extractFinancialData(result.findings as FinancialFindings);
              break;
          }
        });
      }

      return extracted;
    } catch (error) {
      throw new DataExtractionError(
        'general',
        `Failed to extract research data: ${error.message}`,
        { originalError: error }
      );
    }
  }

  private extractBusinessIdea(selectedIdea: any): BusinessIdeaExtract {
    return {
      id: selectedIdea.id || selectedIdea.idea_id || 'unknown',
      title: selectedIdea.title || selectedIdea.name || 'Untitled Business Idea',
      description: selectedIdea.description || selectedIdea.shortDescription || '',
      targetMarket: selectedIdea.targetMarket || selectedIdea.target_market || '',
      valueProposition: selectedIdea.valueProposition || selectedIdea.value_proposition || '',
      revenueModel: selectedIdea.revenueModel || selectedIdea.revenue_model || '',
      businessModel: selectedIdea.businessModel || {},
      competitiveAdvantage: selectedIdea.competitiveAdvantage || selectedIdea.competitive_advantage || '',
      estimatedROI: selectedIdea.estimatedROI || 0,
      estimatedProfit: selectedIdea.estimatedProfitJPY || selectedIdea.estimated_profit || 0,
      initialInvestment: selectedIdea.initialInvestment || selectedIdea.initial_investment || 0,
      timeToMarket: selectedIdea.timeToMarket || selectedIdea.time_to_market || '',
      riskLevel: selectedIdea.riskLevel || 'medium',
      confidence: selectedIdea.confidence || 'medium'
    };
  }

  private extractOriginalResearch(originalResearch: any): OriginalResearchExtract {
    if (!originalResearch) return { available: false };

    return {
      available: true,
      highGrowthSectors: originalResearch.high_growth_sectors || {},
      technologyTrends: originalResearch.technology_trends || {},
      unmetNeeds: originalResearch.unmet_needs || {},
      regulatorySocialShifts: originalResearch.regulatory_social_shifts || {},
      competitiveLandscape: originalResearch.competitive_landscape || {},
      successCaseStudies: originalResearch.success_case_studies || {}
    };
  }

  private extractMarketData(findings: MarketFindings): MarketDataExtract {
    return {
      marketSize: {
        total: findings.marketSize.total || 0,
        currency: findings.marketSize.currency || 'JPY',
        year: findings.marketSize.year || new Date().getFullYear(),
        growthRate: findings.marketSize.growthRate || 0,
        forecast: findings.marketSize.forecast || []
      },
      segments: findings.segments.map(segment => ({
        name: segment.name,
        size: segment.size || 0,
        share: segment.share || 0,
        growthRate: segment.growthRate || 0,
        keyPlayers: segment.keyPlayers || [],
        attractiveness: this.calculateSegmentAttractiveness(segment)
      })),
      trends: findings.trends.map(trend => ({
        name: trend.name,
        impact: trend.impact,
        timeframe: trend.timeframe,
        description: trend.description,
        businessImplications: this.deriveTrendImplications(trend)
      })),
      opportunities: findings.opportunities.map(opp => ({
        description: opp.description,
        potentialSize: opp.potentialSize || 0,
        difficulty: opp.difficulty,
        timeToCapture: opp.timeToCapture,
        prerequisites: this.deriveOpportunityPrerequisites(opp)
      }))
    };
  }

  private extractCompetitorData(findings: CompetitorFindings): CompetitorDataExtract {
    return {
      directCompetitors: findings.directCompetitors.map(comp => ({
        name: comp.name,
        marketShare: comp.marketShare || 0,
        strengths: comp.strengths || [],
        weaknesses: comp.weaknesses || [],
        products: comp.products || [],
        strategy: comp.strategy || '',
        recentMoves: comp.recentMoves || []
      })),
      indirectCompetitors: findings.indirectCompetitors.map(comp => ({
        name: comp.name,
        threat: comp.threat,
        overlappingAreas: comp.overlappingAreas || [],
        potentialImpact: comp.potentialImpact || ''
      })),
      landscape: {
        intensity: findings.competitiveLandscape.intensity,
        barriers: findings.competitiveLandscape.barriers || [],
        keySuccessFactors: findings.competitiveLandscape.keySuccessFactors || [],
        differentiationOpportunities: findings.competitiveLandscape.differentiationOpportunities || []
      },
      benchmarking: findings.benchmarking || {}
    };
  }

  private extractTechnologyData(findings: TechnologyFindings): TechnologyDataExtract {
    return {
      coreTechnologies: findings.coreTechnologies.map(tech => ({
        name: tech.name,
        maturity: tech.maturity,
        adoptionRate: tech.adoptionRate || 0,
        implementationComplexity: tech.implementationComplexity,
        vendors: tech.vendors || [],
        investmentRequired: this.estimateTechnologyInvestment(tech)
      })),
      patents: findings.patents.map(patent => ({
        title: patent.title,
        holder: patent.holder,
        filingDate: patent.filingDate,
        relevance: patent.relevance,
        potentialConflict: patent.potentialConflict,
        workarounds: this.derivePatentWorkarounds(patent)
      })),
      implementationExamples: findings.implementationExamples || [],
      requirements: {
        infrastructure: findings.technicalRequirements.infrastructure || [],
        skills: findings.technicalRequirements.skills || [],
        tools: findings.technicalRequirements.tools || [],
        estimatedCost: findings.technicalRequirements.estimatedCost || 0
      }
    };
  }

  private extractRegulatoryData(findings: RegulatoryFindings): RegulatoryDataExtract {
    return {
      applicableLaws: findings.applicableLaws.map(law => ({
        name: law.name,
        jurisdiction: law.jurisdiction,
        requirements: law.requirements || [],
        penalties: law.penalties || '',
        complianceCost: law.complianceCost || 0,
        timeline: this.deriveComplianceTimeline(law)
      })),
      licenses: findings.licenses.map(license => ({
        type: license.type,
        authority: license.issuingAuthority,
        requirements: license.requirements || [],
        timeline: license.timeline,
        cost: license.cost || 0,
        criticality: this.assessLicenseCriticality(license)
      })),
      standards: findings.standards || [],
      upcomingChanges: findings.upcomingChanges.map(change => ({
        regulation: change.regulation,
        effectiveDate: change.effectiveDate,
        impact: change.impact,
        requiredActions: change.requiredActions || [],
        preparationTime: this.calculatePreparationTime(change)
      }))
    };
  }

  private extractFinancialData(findings: FinancialFindings): FinancialDataExtract {
    return {
      fundingOptions: findings.fundingOptions.map(option => ({
        type: option.type,
        amountRange: option.amount,
        requirements: option.requirements || [],
        timeline: option.timeline,
        pros: option.pros || [],
        cons: option.cons || [],
        suitability: this.assessFundingSuitability(option)
      })),
      revenueProjections: findings.revenueProjections,
      costStructure: findings.costStructure,
      investmentEnvironment: {
        sentiment: findings.investmentEnvironment.sentiment,
        activeInvestors: findings.investmentEnvironment.activeInvestors || [],
        recentDeals: findings.investmentEnvironment.recentDeals || [],
        valuationBenchmarks: findings.investmentEnvironment.valuationBenchmarks || {}
      }
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateSegmentAttractiveness(segment: any): number {
    // Size (40%) + Growth (30%) + Competition (30%)
    const sizeScore = Math.min(segment.size / 100000000000, 1) * 0.4; // Normalize to 100B
    const growthScore = Math.min(segment.growthRate / 0.2, 1) * 0.3; // Normalize to 20%
    const competitionScore = (1 - Math.min((segment.keyPlayers?.length || 0) / 10, 1)) * 0.3;
    return Math.round((sizeScore + growthScore + competitionScore) * 10);
  }

  private deriveTrendImplications(trend: any): string[] {
    // Derive business implications from trend data
    const implications = [];
    if (trend.impact === 'high') {
      implications.push('市場構造の根本的変化');
      implications.push('新規参入機会の創出');
    }
    if (trend.timeframe.includes('1-2')) {
      implications.push('早期対応が競争優位に直結');
    }
    return implications;
  }

  private deriveOpportunityPrerequisites(opportunity: any): string[] {
    const prerequisites = [];
    if (opportunity.difficulty === 'difficult') {
      prerequisites.push('専門技術の獲得');
      prerequisites.push('戦略的パートナーシップ');
    }
    if (opportunity.potentialSize > 50000000000) {
      prerequisites.push('大規模投資の準備');
    }
    return prerequisites;
  }

  private estimateTechnologyInvestment(tech: any): number {
    const baseInvestment = 50000000; // 50M JPY base
    const complexityMultiplier = tech.implementationComplexity === 'high' ? 3 :
                                tech.implementationComplexity === 'medium' ? 2 : 1;
    const maturityMultiplier = tech.maturity === 'emerging' ? 2 : 1;
    return baseInvestment * complexityMultiplier * maturityMultiplier;
  }

  private derivePatentWorkarounds(patent: any): string[] {
    if (!patent.potentialConflict) return [];
    return [
      '代替技術の開発',
      'ライセンス取得',
      'デザインアラウンド',
      '共同開発パートナーシップ'
    ];
  }

  private deriveComplianceTimeline(law: any): string {
    const cost = law.complianceCost || 0;
    if (cost > 10000000) return '12-18ヶ月';
    if (cost > 5000000) return '6-12ヶ月';
    return '3-6ヶ月';
  }

  private assessLicenseCriticality(license: any): 'critical' | 'important' | 'optional' {
    if (license.timeline.includes('1年')) return 'critical';
    if (license.cost > 1000000) return 'important';
    return 'optional';
  }

  private calculatePreparationTime(change: any): string {
    const effectiveDate = new Date(change.effectiveDate);
    const now = new Date();
    const monthsRemaining = Math.max(0, (effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsRemaining < 6) return '緊急対応が必要';
    if (monthsRemaining < 12) return '6ヶ月以内に準備完了';
    return '十分な準備期間あり';
  }

  private assessFundingSuitability(option: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const amount = (option.amount.min + option.amount.max) / 2;
    const timeline = option.timeline;
    
    if (amount > 500000000 && timeline.includes('6ヶ月')) return 'excellent';
    if (amount > 100000000) return 'good';
    if (amount > 50000000) return 'fair';
    return 'poor';
  }
}

// ============================================================================
// Extracted Data Types
// ============================================================================

export interface ExtractedData {
  userOriginalRequest: string; // ユーザーの元の要求
  businessIdea: BusinessIdeaExtract;
  marketData: MarketDataExtract | null;
  competitorData: CompetitorDataExtract | null;
  technologyData: TechnologyDataExtract | null;
  regulatoryData: RegulatoryDataExtract | null;
  financialData: FinancialDataExtract | null;
  originalResearchSummary: OriginalResearchExtract;
}

export interface BusinessIdeaExtract {
  id: string;
  title: string;
  description: string;
  targetMarket: string;
  valueProposition: string;
  revenueModel: string;
  businessModel: any;
  competitiveAdvantage: string;
  estimatedROI: number;
  estimatedProfit: number;
  initialInvestment: number;
  timeToMarket: string;
  riskLevel: string;
  confidence: string;
}

export interface OriginalResearchExtract {
  available: boolean;
  highGrowthSectors?: any;
  technologyTrends?: any;
  unmetNeeds?: any;
  regulatorySocialShifts?: any;
  competitiveLandscape?: any;
  successCaseStudies?: any;
}

export interface MarketDataExtract {
  marketSize: {
    total: number;
    currency: string;
    year: number;
    growthRate: number;
    forecast: any[];
  };
  segments: Array<{
    name: string;
    size: number;
    share: number;
    growthRate: number;
    keyPlayers: string[];
    attractiveness: number;
  }>;
  trends: Array<{
    name: string;
    impact: string;
    timeframe: string;
    description: string;
    businessImplications: string[];
  }>;
  opportunities: Array<{
    description: string;
    potentialSize: number;
    difficulty: string;
    timeToCapture: string;
    prerequisites: string[];
  }>;
}

export interface CompetitorDataExtract {
  directCompetitors: Array<{
    name: string;
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
    products: any[];
    strategy: string;
    recentMoves: string[];
  }>;
  indirectCompetitors: Array<{
    name: string;
    threat: string;
    overlappingAreas: string[];
    potentialImpact: string;
  }>;
  landscape: {
    intensity: string;
    barriers: string[];
    keySuccessFactors: string[];
    differentiationOpportunities: string[];
  };
  benchmarking: any;
}

export interface TechnologyDataExtract {
  coreTechnologies: Array<{
    name: string;
    maturity: string;
    adoptionRate: number;
    implementationComplexity: string;
    vendors: string[];
    investmentRequired: number;
  }>;
  patents: Array<{
    title: string;
    holder: string;
    filingDate: string;
    relevance: string;
    potentialConflict: boolean;
    workarounds: string[];
  }>;
  implementationExamples: any[];
  requirements: {
    infrastructure: string[];
    skills: string[];
    tools: string[];
    estimatedCost: number;
  };
}

export interface RegulatoryDataExtract {
  applicableLaws: Array<{
    name: string;
    jurisdiction: string;
    requirements: string[];
    penalties: string;
    complianceCost: number;
    timeline: string;
  }>;
  licenses: Array<{
    type: string;
    authority: string;
    requirements: string[];
    timeline: string;
    cost: number;
    criticality: string;
  }>;
  standards: any[];
  upcomingChanges: Array<{
    regulation: string;
    effectiveDate: string;
    impact: string;
    requiredActions: string[];
    preparationTime: string;
  }>;
}

export interface FinancialDataExtract {
  fundingOptions: Array<{
    type: string;
    amountRange: { min: number; max: number };
    requirements: string[];
    timeline: string;
    pros: string[];
    cons: string[];
    suitability: string;
  }>;
  revenueProjections: any;
  costStructure: any;
  investmentEnvironment: {
    sentiment: string;
    activeInvestors: string[];
    recentDeals: any[];
    valuationBenchmarks: any;
  };
}