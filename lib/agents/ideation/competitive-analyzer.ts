/**
 * Competitive Analysis and Risk Balancing Module
 * 競合分析とリスクバランシング機能
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  BusinessIdea,
  CompetitiveAnalysis,
  Competitor,
  RiskAssessment,
  Risk,
  RiskLevel,
  IdeationContext
} from './enhanced-ideator-types';

// ============================================================================
// Competitive Analyzer
// ============================================================================

export class CompetitiveAnalyzer {
  private llm: ChatOpenAI;

  constructor(llmConfig: { apiKey?: string; model?: string } = {}) {
    this.llm = new ChatOpenAI({
      openAIApiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY,
      modelName: llmConfig.model || 'gpt-4',
      temperature: 0.3, // Lower temperature for analytical tasks
      maxTokens: 3000
    });
  }

  // --------------------------------------------------------------------------
  // Main Competitive Analysis
  // --------------------------------------------------------------------------

  async analyzeCompetitiveLandscape(
    businessIdea: BusinessIdea,
    context: IdeationContext
  ): Promise<CompetitiveAnalysis> {
    try {
      console.log(`   🔍 Analyzing competitive landscape for: ${businessIdea.title}`);

      // Identify main competitors
      const mainCompetitors = await this.identifyMainCompetitors(businessIdea, context);

      // Analyze competitive advantages
      const competitiveAdvantages = await this.analyzeCompetitiveAdvantages(businessIdea, mainCompetitors);

      // Identify competitive threats
      const competitiveThreats = await this.identifyCompetitiveThreats(businessIdea, mainCompetitors, context);

      // Generate market differentiation strategy
      const marketDifferentiation = await this.generateMarketDifferentiation(businessIdea, mainCompetitors);

      // Assess entry barriers
      const entryBarriers = await this.assessEntryBarriers(businessIdea, context);

      // Generate competitive strategy
      const competitiveStrategy = await this.generateCompetitiveStrategy(businessIdea, mainCompetitors);

      const analysis: CompetitiveAnalysis = {
        mainCompetitors,
        competitiveAdvantages,
        competitiveThreats,
        marketDifferentiation,
        competitiveLandscape: this.summarizeCompetitiveLandscape(mainCompetitors, context),
        entryBarriers,
        competitiveStrategy
      };

      console.log(`   ✅ Competitive analysis completed: ${mainCompetitors.length} competitors identified`);
      return analysis;

    } catch (error) {
      console.error('   ❌ Competitive analysis failed:', error);
      return this.generateFallbackAnalysis(businessIdea);
    }
  }

  // --------------------------------------------------------------------------
  // Competitor Identification
  // --------------------------------------------------------------------------

  private async identifyMainCompetitors(
    businessIdea: BusinessIdea,
    context: IdeationContext
  ): Promise<Competitor[]> {
    const prompt = `ビジネスアイデア「${businessIdea.title}」の主要競合企業を特定してください。

## ビジネス概要：
- カテゴリ: ${businessIdea.category}
- 説明: ${businessIdea.shortDescription}
- 対象市場: ${businessIdea.marketPositioning.targetMarket}

## 市場環境：
${context.competitiveLandscape.map((item, i) => `${i + 1}. ${item}`).join('\n')}

直接競合、間接競合、代替手段となる企業・サービスを3-5社特定し、以下のJSON形式で回答してください：

{
  "competitors": [
    {
      "name": "競合企業名",
      "type": "direct/indirect/substitute",
      "marketShare": "市場シェア（推定）",
      "strengths": ["強み1", "強み2", "強み3"],
      "weaknesses": ["弱み1", "弱み2"],
      "strategy": "主要戦略の説明",
      "threat_level": "low/medium/high"
    }
  ]
}`;

    try {
      const response = await this.llm.call([{ role: 'user', content: prompt }]);
      const result = JSON.parse(response.content as string);
      return result.competitors || [];
    } catch (error) {
      console.error('Failed to identify competitors:', error);
      return this.generateFallbackCompetitors(businessIdea);
    }
  }

  private generateFallbackCompetitors(businessIdea: BusinessIdea): Competitor[] {
    const baseCompetitors: Competitor[] = [
      {
        name: '大手IT企業A',
        type: 'direct',
        marketShare: '15%',
        strengths: ['技術力', '資金力', 'ブランド認知度'],
        weaknesses: ['業界理解不足', '顧客との距離'],
        strategy: 'テクノロジー先行型戦略',
        threat_level: 'high'
      },
      {
        name: '業界大手B',
        type: 'indirect',
        marketShare: '25%',
        strengths: ['業界ネットワーク', '営業力', '資金力'],
        weaknesses: ['技術革新の遅れ', 'デジタル化遅延'],
        strategy: '既存顧客深耕戦略',
        threat_level: 'medium'
      },
      {
        name: 'スタートアップC',
        type: 'direct',
        marketShare: '3%',
        strengths: ['革新的技術', 'スピード', '柔軟性'],
        weaknesses: ['資金力不足', '信頼性不足', '営業力不足'],
        strategy: 'ニッチ市場特化戦略',
        threat_level: 'medium'
      }
    ];

    return baseCompetitors;
  }

  // --------------------------------------------------------------------------
  // Competitive Advantage Analysis
  // --------------------------------------------------------------------------

  private async analyzeCompetitiveAdvantages(
    businessIdea: BusinessIdea,
    competitors: Competitor[]
  ): Promise<string[]> {
    const prompt = `ビジネスアイデア「${businessIdea.title}」の競合優位性を分析してください。

## 三菱地所の主要資産・強み：
- 丸の内エリア（日本最高立地）
- 大手企業テナントネットワーク
- 130年の歴史と信頼性
- 高級不動産ブランド
- 国際事業展開経験

## 主要競合：
${competitors.map(comp => `- ${comp.name}: ${comp.strengths.join(', ')}`).join('\n')}

## 三菱地所シナジー：
- 不動産活用: ${businessIdea.mitsubishiSynergy.synergyScore.realEstate}/10
- テナントネットワーク: ${businessIdea.mitsubishiSynergy.synergyScore.tenantNetwork}/10
- ブランド活用: ${businessIdea.mitsubishiSynergy.synergyScore.brandLeverage}/10

競合に対する明確な優位性を5-7個特定し、文字列配列で回答してください：
["優位性1", "優位性2", "優位性3", ...]`;

    try {
      const response = await this.llm.call([{ role: 'user', content: prompt }]);
      const advantages = JSON.parse(response.content as string);
      return Array.isArray(advantages) ? advantages : [];
    } catch (error) {
      return this.generateFallbackAdvantages(businessIdea);
    }
  }

  private generateFallbackAdvantages(businessIdea: BusinessIdea): string[] {
    return [
      '日本最高立地（丸の内）でのブランド力とアクセス優位性',
      '大手企業テナントとの既存関係と信頼性',
      '130年の歴史による安定性と長期視点での投資能力',
      '物理的不動産資産とデジタルサービスの統合優位性',
      '三菱グループ全体のネットワークとシナジー効果',
      '政府・自治体との良好な関係と社会的信頼性',
      '国際事業展開経験による海外市場進出能力'
    ];
  }

  // --------------------------------------------------------------------------
  // Threat Identification
  // --------------------------------------------------------------------------

  private async identifyCompetitiveThreats(
    businessIdea: BusinessIdea,
    competitors: Competitor[],
    context: IdeationContext
  ): Promise<string[]> {
    const highThreatCompetitors = competitors.filter(comp => comp.threat_level === 'high');
    const threatFactors = [
      'テクノロジー企業の業界参入',
      '既存プレイヤーのデジタル変革',
      'スタートアップの革新的ソリューション',
      '顧客の内製化・直接調達',
      '海外企業の日本市場参入',
      '規制変更による市場構造変化',
      '新技術による既存モデル破壊'
    ];

    return threatFactors.slice(0, 4); // Top 4 threats
  }

  // --------------------------------------------------------------------------
  // Market Differentiation Strategy
  // --------------------------------------------------------------------------

  private async generateMarketDifferentiation(
    businessIdea: BusinessIdea,
    competitors: Competitor[]
  ): Promise<string[]> {
    return [
      '物理・デジタル統合型ソリューション',
      '長期パートナーシップ重視アプローチ',
      '三菱地所ブランドによる信頼性・安定性',
      'エンタープライズ向け高品質サービス',
      '日本市場特化のローカライゼーション',
      'ESG・持続可能性への強いコミット'
    ];
  }

  // --------------------------------------------------------------------------
  // Entry Barriers Assessment
  // --------------------------------------------------------------------------

  private async assessEntryBarriers(
    businessIdea: BusinessIdea,
    context: IdeationContext
  ): Promise<string[]> {
    return [
      '高い初期投資とインフラ投資',
      '業界知識と顧客関係構築の困難',
      '規制・法的要件への対応',
      '技術人材とドメイン専門家の確保',
      'ブランド認知度と信頼性の獲得',
      '既存プレイヤーとの競争激化'
    ];
  }

  // --------------------------------------------------------------------------
  // Competitive Strategy Generation
  // --------------------------------------------------------------------------

  private async generateCompetitiveStrategy(
    businessIdea: BusinessIdea,
    competitors: Competitor[]
  ): Promise<string> {
    const strategy = `三菱地所の既存資産を最大活用した差別化戦略。
物理的立地優位性とデジタル技術を統合し、
長期パートナーシップによる顧客ロックイン効果を重視。
段階的市場展開により競合の追随を困難にする。`;

    return strategy;
  }

  // --------------------------------------------------------------------------
  // Competitive Landscape Summary
  // --------------------------------------------------------------------------

  private summarizeCompetitiveLandscape(
    competitors: Competitor[],
    context: IdeationContext
  ): string {
    const directCompetitors = competitors.filter(c => c.type === 'direct').length;
    const indirectCompetitors = competitors.filter(c => c.type === 'indirect').length;
    const highThreats = competitors.filter(c => c.threat_level === 'high').length;

    return `市場には${directCompetitors}社の直接競合、${indirectCompetitors}社の間接競合が存在。
${highThreats}社が高脅威レベル。市場成長期にあり競争は激化傾向。
技術革新とパートナーシップが競争力の鍵。`;
  }

  // --------------------------------------------------------------------------
  // Fallback Analysis
  // --------------------------------------------------------------------------

  private generateFallbackAnalysis(businessIdea: BusinessIdea): CompetitiveAnalysis {
    return {
      mainCompetitors: this.generateFallbackCompetitors(businessIdea),
      competitiveAdvantages: this.generateFallbackAdvantages(businessIdea),
      competitiveThreats: [
        'テクノロジー企業の参入',
        'スタートアップの革新',
        '既存企業のデジタル化',
        '顧客の内製化'
      ],
      marketDifferentiation: [
        '統合型ソリューション',
        '三菱地所ブランド',
        '長期パートナーシップ',
        '物理・デジタル融合'
      ],
      competitiveLandscape: '成長市場での競争激化、差別化が重要',
      entryBarriers: [
        '初期投資',
        '業界知識',
        '顧客関係',
        '技術人材'
      ],
      competitiveStrategy: '差別化とパートナーシップ重視戦略'
    };
  }
}

// ============================================================================
// Risk Balancing Manager
// ============================================================================

export class RiskBalancingManager {
  private targetDistribution: Record<RiskLevel, number>;

  constructor(riskDistribution?: Record<RiskLevel, number>) {
    this.targetDistribution = riskDistribution || {
      conservative: 0.25,
      balanced: 0.50,
      challenging: 0.20,
      disruptive: 0.05
    };
  }

  // --------------------------------------------------------------------------
  // Risk Balance Analysis
  // --------------------------------------------------------------------------

  analyzeRiskBalance(ideas: BusinessIdea[]): {
    currentDistribution: Record<RiskLevel, number>;
    targetDistribution: Record<RiskLevel, number>;
    isBalanced: boolean;
    recommendations: string[];
    adjustments: RiskBalanceAdjustment[];
  } {
    const currentDistribution = this.calculateCurrentDistribution(ideas);
    const isBalanced = this.isRiskBalanced(currentDistribution);
    const recommendations = this.generateRiskRecommendations(currentDistribution);
    const adjustments = this.calculateRequiredAdjustments(currentDistribution, ideas.length);

    return {
      currentDistribution,
      targetDistribution: this.targetDistribution,
      isBalanced,
      recommendations,
      adjustments
    };
  }

  // --------------------------------------------------------------------------
  // Risk Distribution Calculation
  // --------------------------------------------------------------------------

  private calculateCurrentDistribution(ideas: BusinessIdea[]): Record<RiskLevel, number> {
    if (ideas.length === 0) {
      return {
        conservative: 0,
        balanced: 0,
        challenging: 0,
        disruptive: 0
      };
    }

    const counts = ideas.reduce((acc, idea) => {
      acc[idea.riskLevel] = (acc[idea.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = ideas.length;
    return {
      conservative: (counts.conservative || 0) / total,
      balanced: (counts.balanced || 0) / total,
      challenging: (counts.challenging || 0) / total,
      disruptive: (counts.disruptive || 0) / total
    };
  }

  // --------------------------------------------------------------------------
  // Risk Balance Validation
  // --------------------------------------------------------------------------

  private isRiskBalanced(current: Record<RiskLevel, number>): boolean {
    const tolerance = 0.15; // 15% tolerance

    return Object.entries(this.targetDistribution).every(([level, target]) => {
      const currentValue = current[level as RiskLevel];
      return Math.abs(currentValue - target) <= tolerance;
    });
  }

  // --------------------------------------------------------------------------
  // Risk Recommendations
  // --------------------------------------------------------------------------

  private generateRiskRecommendations(current: Record<RiskLevel, number>): string[] {
    const recommendations: string[] = [];

    Object.entries(this.targetDistribution).forEach(([level, target]) => {
      const currentValue = current[level as RiskLevel];
      const diff = target - currentValue;

      if (Math.abs(diff) > 0.1) {
        if (diff > 0) {
          recommendations.push(`${level}レベルのアイデアを${Math.round(diff * 100)}%増加させることを推奨`);
        } else {
          recommendations.push(`${level}レベルのアイデアを${Math.round(-diff * 100)}%削減することを推奨`);
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('リスクバランスは適切です');
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Adjustment Calculations
  // --------------------------------------------------------------------------

  private calculateRequiredAdjustments(
    current: Record<RiskLevel, number>,
    totalIdeas: number
  ): RiskBalanceAdjustment[] {
    const adjustments: RiskBalanceAdjustment[] = [];

    Object.entries(this.targetDistribution).forEach(([level, target]) => {
      const currentValue = current[level as RiskLevel];
      const currentCount = Math.round(currentValue * totalIdeas);
      const targetCount = Math.round(target * totalIdeas);
      const adjustment = targetCount - currentCount;

      if (adjustment !== 0) {
        adjustments.push({
          riskLevel: level as RiskLevel,
          currentCount,
          targetCount,
          adjustment,
          priority: Math.abs(adjustment) > 1 ? 'high' : 'medium'
        });
      }
    });

    return adjustments.sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));
  }

  // --------------------------------------------------------------------------
  // Idea Selection for Balance
  // --------------------------------------------------------------------------

  selectIdeasForBalance(
    candidateIdeas: BusinessIdea[],
    targetCount: number
  ): BusinessIdea[] {
    const selected: BusinessIdea[] = [];
    const riskGroups = this.groupIdeasByRisk(candidateIdeas);

    // Calculate target counts for each risk level
    const targetCounts = Object.fromEntries(
      Object.entries(this.targetDistribution).map(([level, ratio]) => [
        level,
        Math.round(targetCount * ratio)
      ])
    );

    // Select ideas from each risk group
    Object.entries(targetCounts).forEach(([level, count]) => {
      const availableIdeas = riskGroups[level as RiskLevel] || [];
      const sortedIdeas = availableIdeas.sort((a, b) => {
        // Sort by quality and synergy
        const qualityA = this.calculateIdeaScore(a);
        const qualityB = this.calculateIdeaScore(b);
        return qualityB - qualityA;
      });

      selected.push(...sortedIdeas.slice(0, count));
    });

    // Fill remaining slots with best available ideas
    const remaining = targetCount - selected.length;
    if (remaining > 0) {
      const unusedIdeas = candidateIdeas.filter(idea => !selected.includes(idea));
      const sortedUnused = unusedIdeas.sort((a, b) => 
        this.calculateIdeaScore(b) - this.calculateIdeaScore(a)
      );
      selected.push(...sortedUnused.slice(0, remaining));
    }

    return selected.slice(0, targetCount);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private groupIdeasByRisk(ideas: BusinessIdea[]): Record<RiskLevel, BusinessIdea[]> {
    return ideas.reduce((groups, idea) => {
      const level = idea.riskLevel;
      if (!groups[level]) groups[level] = [];
      groups[level].push(idea);
      return groups;
    }, {} as Record<RiskLevel, BusinessIdea[]>);
  }

  private calculateIdeaScore(idea: BusinessIdea): number {
    // Simple scoring based on synergy and confidence
    let score = idea.mitsubishiSynergy.overallFit;
    
    // Confidence bonus
    if (idea.confidence === 'high') score += 2;
    else if (idea.confidence === 'medium') score += 1;
    
    // Market fit bonus
    if (idea.marketFit === 'excellent') score += 2;
    else if (idea.marketFit === 'good') score += 1;
    
    return score;
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  updateTargetDistribution(newDistribution: Partial<Record<RiskLevel, number>>): void {
    this.targetDistribution = { ...this.targetDistribution, ...newDistribution };
    
    // Normalize to ensure sum equals 1
    const sum = Object.values(this.targetDistribution).reduce((a, b) => a + b, 0);
    if (sum !== 1) {
      Object.keys(this.targetDistribution).forEach(key => {
        this.targetDistribution[key as RiskLevel] /= sum;
      });
    }
  }

  getTargetDistribution(): Record<RiskLevel, number> {
    return { ...this.targetDistribution };
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface RiskBalanceAdjustment {
  riskLevel: RiskLevel;
  currentCount: number;
  targetCount: number;
  adjustment: number; // positive = need more, negative = need fewer
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// Exports
// ============================================================================

// Export only interfaces and types to avoid duplicate class exports
export type { RiskBalanceAdjustment };