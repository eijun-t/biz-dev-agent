/**
 * Enhanced Critic Agent - Capability Analyzer
 * ケイパビリティ分析モジュール
 */

import {
  MITSUBISHI_CORE_CAPABILITIES,
  MITSUBISHI_BUSINESS_PORTFOLIO,
  MITSUBISHI_NETWORK_ASSETS
} from '../ideation/enhanced-ideator-config';

import {
  CapabilityReference,
  CapabilityMatch,
  CapabilityUtilizationEvaluation,
  EvaluationScore
} from './types';

// ============================================================================
// Capability Analyzer Class
// ============================================================================

export class CapabilityAnalyzer {
  private capabilityKeywords: Map<string, string[]>;

  constructor() {
    this.initializeKeywordMapping();
  }

  // --------------------------------------------------------------------------
  // Main Analysis Methods
  // --------------------------------------------------------------------------

  /**
   * ビジネスアイデアのケイパビリティ活用度を評価
   */
  async analyzeCapabilityUtilization(businessIdea: any): Promise<CapabilityUtilizationEvaluation> {
    console.log(`🔍 Analyzing capability utilization for: ${businessIdea.title}`);

    // 1. ケイパビリティ参照の抽出
    const referencedCapabilities = this.extractCapabilityReferences(businessIdea);
    
    // 2. 各評価項目のスコア計算
    const scenarioClarity = this.evaluateScenarioClarity(businessIdea, referencedCapabilities);
    const depthSpecificity = this.evaluateDepthSpecificity(businessIdea, referencedCapabilities);
    const synergyStrength = this.evaluateSynergyStrength(businessIdea, referencedCapabilities);

    const totalScore = scenarioClarity.score + depthSpecificity.score + synergyStrength.score;

    const overallAssessment = this.generateOverallAssessment(
      totalScore, 
      referencedCapabilities,
      scenarioClarity,
      depthSpecificity,
      synergyStrength
    );

    console.log(`✅ Capability analysis completed: ${totalScore}/40 points`);

    return {
      scenario_clarity: scenarioClarity,
      depth_specificity: depthSpecificity,
      synergy_strength: synergyStrength,
      total_score: totalScore,
      referenced_capabilities: referencedCapabilities,
      overall_assessment: overallAssessment
    };
  }

  // --------------------------------------------------------------------------
  // Capability Reference Extraction
  // --------------------------------------------------------------------------

  private extractCapabilityReferences(businessIdea: any): CapabilityReference[] {
    const references: CapabilityReference[] = [];
    
    // ビジネスアイデアの全テキストを統合
    const ideaText = this.combineIdeaTexts(businessIdea);
    
    // 大項目レベルの分析
    const majorCapabilities = this.findMajorCapabilityReferences(ideaText, businessIdea);
    references.push(...majorCapabilities);
    
    // 中項目レベルの分析
    const middleCapabilities = this.findMiddleCapabilityReferences(ideaText, businessIdea);
    references.push(...middleCapabilities);
    
    // 小項目レベルの分析
    const subCapabilities = this.findSubCapabilityReferences(ideaText, businessIdea);
    references.push(...subCapabilities);

    // ネットワーク資産の分析
    const networkReferences = this.findNetworkAssetReferences(ideaText, businessIdea);
    references.push(...networkReferences);

    // 重複除去とスコアリング
    return this.deduplicateAndScore(references);
  }

  private combineIdeaTexts(businessIdea: any): string {
    const texts: string[] = [];
    
    if (businessIdea.title) texts.push(businessIdea.title);
    if (businessIdea.description) texts.push(businessIdea.description);
    if (businessIdea.shortDescription) texts.push(businessIdea.shortDescription);
    if (businessIdea.businessModel?.description) texts.push(businessIdea.businessModel.description);
    if (businessIdea.mitsubishiSynergy?.description) texts.push(businessIdea.mitsubishiSynergy.description);
    if (businessIdea.valueProposition?.solutionOffering) {
      texts.push(businessIdea.valueProposition.solutionOffering.join(' '));
    }
    if (businessIdea.implementationRoadmap?.phases) {
      businessIdea.implementationRoadmap.phases.forEach((phase: any) => {
        if (phase.activities) texts.push(phase.activities.join(' '));
      });
    }

    return texts.join(' ').toLowerCase();
  }

  // --------------------------------------------------------------------------
  // Major Capability Analysis (大項目レベル)
  // --------------------------------------------------------------------------

  private findMajorCapabilityReferences(ideaText: string, businessIdea: any): CapabilityReference[] {
    const references: CapabilityReference[] = [];

    // 不動産開発力の検出
    if (this.matchesCapabilityKeywords(ideaText, 'real_estate_development')) {
      references.push({
        capability_id: 'real_estate_development',
        capability_name: '不動産開発力',
        level: 'major',
        strength_level: MITSUBISHI_CORE_CAPABILITIES.real_estate_development.strength_level,
        usage_scenario: this.extractUsageScenario(ideaText, 'real_estate_development'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'real_estate_development'),
        synergy_potential: this.calculateSynergyPotential(ideaText, businessIdea, 'real_estate_development')
      });
    }

    // 不動産運営・管理力の検出
    if (this.matchesCapabilityKeywords(ideaText, 'property_operations')) {
      references.push({
        capability_id: 'property_operations',
        capability_name: '不動産運営・管理力',
        level: 'major',
        strength_level: MITSUBISHI_CORE_CAPABILITIES.property_operations.strength_level,
        usage_scenario: this.extractUsageScenario(ideaText, 'property_operations'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'property_operations'),
        synergy_potential: this.calculateSynergyPotential(ideaText, businessIdea, 'property_operations')
      });
    }

    // 金融・投資力の検出
    if (this.matchesCapabilityKeywords(ideaText, 'financial_capabilities')) {
      references.push({
        capability_id: 'financial_capabilities',
        capability_name: '金融・投資力',
        level: 'major',
        strength_level: MITSUBISHI_CORE_CAPABILITIES.financial_capabilities.strength_level,
        usage_scenario: this.extractUsageScenario(ideaText, 'financial_capabilities'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'financial_capabilities'),
        synergy_potential: this.calculateSynergyPotential(ideaText, businessIdea, 'financial_capabilities')
      });
    }

    // 事業創造・イノベーション力の検出
    if (this.matchesCapabilityKeywords(ideaText, 'innovation_capabilities')) {
      references.push({
        capability_id: 'innovation_capabilities',
        capability_name: '事業創造・イノベーション力',
        level: 'major',
        strength_level: MITSUBISHI_CORE_CAPABILITIES.innovation_capabilities.strength_level,
        usage_scenario: this.extractUsageScenario(ideaText, 'innovation_capabilities'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'innovation_capabilities'),
        synergy_potential: this.calculateSynergyPotential(ideaText, businessIdea, 'innovation_capabilities')
      });
    }

    return references;
  }

  // --------------------------------------------------------------------------
  // Middle Capability Analysis (中項目レベル)
  // --------------------------------------------------------------------------

  private findMiddleCapabilityReferences(ideaText: string, businessIdea: any): CapabilityReference[] {
    const references: CapabilityReference[] = [];

    // 設計業務ノウハウ
    if (this.matchesCapabilityKeywords(ideaText, 'design_expertise')) {
      references.push(this.createCapabilityReference(
        'design_expertise', '設計業務ノウハウ', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.real_estate_development.capabilities.design_expertise.strength_level,
        ideaText, businessIdea
      ));
    }

    // プロジェクトマネジメント力
    if (this.matchesCapabilityKeywords(ideaText, 'project_management')) {
      references.push(this.createCapabilityReference(
        'project_management', 'プロジェクトマネジメント力', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.real_estate_development.capabilities.project_management.strength_level,
        ideaText, businessIdea
      ));
    }

    // ビル管理・ファシリティマネジメント
    if (this.matchesCapabilityKeywords(ideaText, 'facility_management')) {
      references.push(this.createCapabilityReference(
        'facility_management', 'ビル管理・ファシリティマネジメント', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.property_operations.capabilities.facility_management.strength_level,
        ideaText, businessIdea
      ));
    }

    // テナントリレーション
    if (this.matchesCapabilityKeywords(ideaText, 'tenant_relations')) {
      references.push(this.createCapabilityReference(
        'tenant_relations', 'テナントリレーション', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.property_operations.capabilities.tenant_relations.strength_level,
        ideaText, businessIdea
      ));
    }

    // 資金調達力
    if (this.matchesCapabilityKeywords(ideaText, 'funding_capabilities')) {
      references.push(this.createCapabilityReference(
        'funding_capabilities', '資金調達力', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.financial_capabilities.capabilities.funding_capabilities.strength_level,
        ideaText, businessIdea
      ));
    }

    // デジタル変革・DX推進
    if (this.matchesCapabilityKeywords(ideaText, 'digital_transformation')) {
      references.push(this.createCapabilityReference(
        'digital_transformation', 'デジタル変革・DX推進', 'middle',
        MITSUBISHI_CORE_CAPABILITIES.innovation_capabilities.capabilities.digital_transformation.strength_level,
        ideaText, businessIdea
      ));
    }

    return references;
  }

  // --------------------------------------------------------------------------
  // Sub Capability Analysis (小項目レベル)
  // --------------------------------------------------------------------------

  private findSubCapabilityReferences(ideaText: string, businessIdea: any): CapabilityReference[] {
    const references: CapabilityReference[] = [];

    // スマートビル運営（具体例）
    if (ideaText.includes('スマートビル') || ideaText.includes('iot') || ideaText.includes('ai活用') || ideaText.includes('自動制御')) {
      references.push(this.createCapabilityReference(
        'smart_building', 'スマートビル運営', 'sub',
        MITSUBISHI_CORE_CAPABILITIES.property_operations.capabilities.facility_management.sub_capabilities.smart_building.strength_level,
        ideaText, businessIdea
      ));
    }

    // PropTech導入・活用
    if (ideaText.includes('proptech') || ideaText.includes('プロップテック') || ideaText.includes('不動産テック')) {
      references.push(this.createCapabilityReference(
        'proptech_adoption', 'PropTech導入・活用', 'sub',
        MITSUBISHI_CORE_CAPABILITIES.innovation_capabilities.capabilities.digital_transformation.sub_capabilities.proptech_adoption.strength_level,
        ideaText, businessIdea
      ));
    }

    // 都市計画・マスタープラン
    if (ideaText.includes('都市計画') || ideaText.includes('まちづくり') || ideaText.includes('都市開発')) {
      references.push(this.createCapabilityReference(
        'urban_planning', '都市計画・マスタープラン', 'sub',
        MITSUBISHI_CORE_CAPABILITIES.real_estate_development.capabilities.design_expertise.sub_capabilities.urban_planning.strength_level,
        ideaText, businessIdea
      ));
    }

    return references;
  }

  // --------------------------------------------------------------------------
  // Network Asset Analysis
  // --------------------------------------------------------------------------

  private findNetworkAssetReferences(ideaText: string, businessIdea: any): CapabilityReference[] {
    const references: CapabilityReference[] = [];

    // 丸の内テナント企業群
    if (ideaText.includes('丸の内') || ideaText.includes('テナント') || ideaText.includes('大手企業')) {
      references.push({
        capability_id: 'tenant_companies',
        capability_name: '丸の内テナント企業群ネットワーク',
        level: 'major',
        strength_level: 10,
        usage_scenario: this.extractUsageScenario(ideaText, 'tenant_network'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'tenant_network'),
        synergy_potential: MITSUBISHI_NETWORK_ASSETS.corporate_networks.networks.tenant_companies.synergy_potential
      });
    }

    // 三菱グループネットワーク
    if (ideaText.includes('三菱グループ') || ideaText.includes('三菱商事') || ideaText.includes('三菱ufj')) {
      references.push({
        capability_id: 'mitsubishi_group',
        capability_name: '三菱グループネットワーク',
        level: 'major',
        strength_level: 9,
        usage_scenario: this.extractUsageScenario(ideaText, 'mitsubishi_group'),
        specificity_score: this.calculateSpecificityScore(ideaText, 'mitsubishi_group'),
        synergy_potential: MITSUBISHI_NETWORK_ASSETS.corporate_networks.networks.mitsubishi_group.synergy_potential
      });
    }

    return references;
  }

  // --------------------------------------------------------------------------
  // Evaluation Methods
  // --------------------------------------------------------------------------

  private evaluateScenarioClarity(businessIdea: any, references: CapabilityReference[]): EvaluationScore {
    let score = 0;
    const maxScore = 10;
    
    if (references.length === 0) {
      return {
        score: 0,
        maxScore,
        details: 'ケイパビリティの活用シナリオが不明確。具体的な三菱地所の強みの活用方法を明記する必要がある。'
      };
    }

    // シナリオの明確性評価
    const hasSpecificScenario = references.some(ref => ref.usage_scenario && ref.usage_scenario.length > 20);
    const hasMultipleReferences = references.length >= 2;
    const hasHighSpecificity = references.some(ref => ref.specificity_score >= 7);

    if (hasSpecificScenario && hasHighSpecificity) score += 4;
    else if (hasSpecificScenario) score += 2;

    if (hasMultipleReferences) score += 3;
    else if (references.length >= 1) score += 2;

    if (references.some(ref => ref.level === 'sub')) score += 2; // 小項目まで具体的
    else if (references.some(ref => ref.level === 'middle')) score += 1;

    score += 1; // 基本点

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: this.generateScenarioClarityDetails(score, references, hasSpecificScenario, hasMultipleReferences)
    };
  }

  private evaluateDepthSpecificity(businessIdea: any, references: CapabilityReference[]): EvaluationScore {
    let score = 0;
    const maxScore = 15;

    if (references.length === 0) {
      return {
        score: 0,
        maxScore,
        details: 'ケイパビリティの活用が表面的。具体的なスキル・ノウハウの活用方法を詳述する必要がある。'
      };
    }

    // 活用の深度評価
    const averageSpecificity = references.reduce((sum, ref) => sum + ref.specificity_score, 0) / references.length;
    const hasSubLevel = references.some(ref => ref.level === 'sub');
    const hasMiddleLevel = references.some(ref => ref.level === 'middle');
    const detailedReferences = references.filter(ref => ref.usage_scenario.length > 30).length;

    // 階層の深さによるスコア
    if (hasSubLevel) score += 5;
    else if (hasMiddleLevel) score += 3;
    else score += 1;

    // 具体性の深さによるスコア
    if (averageSpecificity >= 8) score += 5;
    else if (averageSpecificity >= 6) score += 3;
    else if (averageSpecificity >= 4) score += 1;

    // 詳細な活用シナリオの数
    if (detailedReferences >= 3) score += 3;
    else if (detailedReferences >= 2) score += 2;
    else if (detailedReferences >= 1) score += 1;

    // 高強度ケイパビリティの活用
    const highStrengthRefs = references.filter(ref => ref.strength_level >= 9).length;
    if (highStrengthRefs >= 2) score += 2;
    else if (highStrengthRefs >= 1) score += 1;

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: this.generateDepthSpecificityDetails(score, references, averageSpecificity, hasSubLevel, detailedReferences)
    };
  }

  private evaluateSynergyStrength(businessIdea: any, references: CapabilityReference[]): EvaluationScore {
    let score = 0;
    const maxScore = 15;

    if (references.length === 0) {
      return {
        score: 0,
        maxScore,
        details: 'シナジー効果が不明確。競合が真似できない独自性のある価値創造シナリオを明示する必要がある。'
      };
    }

    // シナジー強度の評価
    const averageSynergyPotential = references.reduce((sum, ref) => sum + ref.synergy_potential, 0) / references.length;
    const maxSynergyPotential = Math.max(...references.map(ref => ref.synergy_potential));
    const uniqueAdvantage = this.assessUniqueAdvantage(businessIdea, references);
    const competitiveBarrier = this.assessCompetitiveBarrier(businessIdea, references);

    // 平均シナジーポテンシャル
    if (averageSynergyPotential >= 9) score += 4;
    else if (averageSynergyPotential >= 7) score += 3;
    else if (averageSynergyPotential >= 5) score += 1;

    // 最大シナジーポテンシャル
    if (maxSynergyPotential >= 10) score += 4;
    else if (maxSynergyPotential >= 8) score += 2;

    // 独自性
    if (uniqueAdvantage >= 8) score += 4;
    else if (uniqueAdvantage >= 6) score += 2;
    else if (uniqueAdvantage >= 4) score += 1;

    // 競合障壁
    if (competitiveBarrier >= 7) score += 3;
    else if (competitiveBarrier >= 5) score += 1;

    return {
      score: Math.min(score, maxScore),
      maxScore,
      details: this.generateSynergyStrengthDetails(score, averageSynergyPotential, maxSynergyPotential, uniqueAdvantage, competitiveBarrier)
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private createCapabilityReference(
    capabilityId: string,
    capabilityName: string,
    level: 'major' | 'middle' | 'sub',
    strengthLevel: number,
    ideaText: string,
    businessIdea: any
  ): CapabilityReference {
    return {
      capability_id: capabilityId,
      capability_name: capabilityName,
      level,
      strength_level: strengthLevel,
      usage_scenario: this.extractUsageScenario(ideaText, capabilityId),
      specificity_score: this.calculateSpecificityScore(ideaText, capabilityId),
      synergy_potential: this.calculateSynergyPotential(ideaText, businessIdea, capabilityId)
    };
  }

  private matchesCapabilityKeywords(ideaText: string, capabilityId: string): boolean {
    const keywords = this.capabilityKeywords.get(capabilityId) || [];
    return keywords.some(keyword => ideaText.includes(keyword.toLowerCase()));
  }

  private extractUsageScenario(ideaText: string, capabilityId: string): string {
    // 簡単な実装: キーワード周辺のテキストを抽出
    const keywords = this.capabilityKeywords.get(capabilityId) || [];
    for (const keyword of keywords) {
      const index = ideaText.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(ideaText.length, index + keyword.length + 100);
        return ideaText.substring(start, end).trim();
      }
    }
    return '活用シナリオの詳細な記述が必要';
  }

  private calculateSpecificityScore(ideaText: string, capabilityId: string): number {
    const keywords = this.capabilityKeywords.get(capabilityId) || [];
    let score = 0;
    
    // キーワードの一致数に基づく基本スコア
    const matchCount = keywords.filter(keyword => ideaText.includes(keyword.toLowerCase())).length;
    score += Math.min(matchCount * 2, 6);

    // 具体的な記述の長さ
    const scenario = this.extractUsageScenario(ideaText, capabilityId);
    if (scenario.length > 100) score += 2;
    else if (scenario.length > 50) score += 1;

    // 数値・具体例の言及
    if (/\d+/.test(scenario)) score += 1; // 数値が含まれている
    if (scenario.includes('具体的') || scenario.includes('詳細')) score += 1;

    return Math.min(score, 10);
  }

  private calculateSynergyPotential(ideaText: string, businessIdea: any, capabilityId: string): number {
    // 基本的なシナジーポテンシャル（設定ファイルから）
    let basePotential = 7; // デフォルト

    // ビジネスアイデアの規模・重要性
    const profitMention = businessIdea.estimatedProfitJPY || 0;
    if (profitMention >= 50_000_000_000) basePotential += 2; // 50億円以上
    else if (profitMention >= 20_000_000_000) basePotential += 1; // 20億円以上

    // 独自性・差別化の言及
    if (ideaText.includes('独自') || ideaText.includes('競合優位') || ideaText.includes('差別化')) {
      basePotential += 1;
    }

    // 三菱地所ブランド・立地の活用
    if (ideaText.includes('丸の内') || ideaText.includes('三菱地所ブランド') || ideaText.includes('一等地')) {
      basePotential += 1;
    }

    return Math.min(basePotential, 10);
  }

  private assessUniqueAdvantage(businessIdea: any, references: CapabilityReference[]): number {
    let score = 5; // 基本点

    // 高強度ケイパビリティの組み合わせ
    const highStrengthCount = references.filter(ref => ref.strength_level >= 9).length;
    score += Math.min(highStrengthCount, 3);

    // ネットワーク資産の活用
    const networkReferences = references.filter(ref => 
      ref.capability_id.includes('tenant') || ref.capability_id.includes('group')
    );
    if (networkReferences.length > 0) score += 2;

    return Math.min(score, 10);
  }

  private assessCompetitiveBarrier(businessIdea: any, references: CapabilityReference[]): number {
    let score = 4; // 基本点

    // 複数ケイパビリティの組み合わせによる障壁
    if (references.length >= 3) score += 2;
    else if (references.length >= 2) score += 1;

    // 長期構築された資産の活用
    const developmentRefs = references.filter(ref => ref.capability_id.includes('development') || ref.capability_id.includes('real_estate'));
    if (developmentRefs.length > 0) score += 1;

    return Math.min(score, 10);
  }

  private deduplicateAndScore(references: CapabilityReference[]): CapabilityReference[] {
    const uniqueRefs = new Map<string, CapabilityReference>();
    
    references.forEach(ref => {
      const existing = uniqueRefs.get(ref.capability_id);
      if (!existing || ref.specificity_score > existing.specificity_score) {
        uniqueRefs.set(ref.capability_id, ref);
      }
    });
    
    return Array.from(uniqueRefs.values());
  }

  // --------------------------------------------------------------------------
  // Assessment Detail Generators
  // --------------------------------------------------------------------------

  private generateOverallAssessment(
    totalScore: number,
    references: CapabilityReference[],
    scenarioClarity: EvaluationScore,
    depthSpecificity: EvaluationScore,
    synergyStrength: EvaluationScore
  ): string {
    const percentage = (totalScore / 40) * 100;
    
    let assessment = `ケイパビリティ活用度: ${totalScore}/40点 (${percentage.toFixed(1)}%)\n\n`;
    
    if (percentage >= 85) {
      assessment += '【優秀】三菱地所の強みを極めて効果的に活用する優れたビジネスアイデア。';
    } else if (percentage >= 70) {
      assessment += '【良好】三菱地所のケイパビリティを適切に活用している。';
    } else if (percentage >= 50) {
      assessment += '【普通】ケイパビリティの活用に改善の余地がある。';
    } else {
      assessment += '【要改善】三菱地所固有の強みの活用が不十分。';
    }
    
    assessment += `\n\n参照ケイパビリティ数: ${references.length}個`;
    if (references.length > 0) {
      assessment += '\n主要活用領域: ' + references.map(ref => ref.capability_name).join(', ');
    }
    
    return assessment;
  }

  private generateScenarioClarityDetails(
    score: number,
    references: CapabilityReference[],
    hasSpecificScenario: boolean,
    hasMultipleReferences: boolean
  ): string {
    let details = `活用シナリオの明確性: ${score}/10点\n`;
    
    if (score >= 8) {
      details += '活用シナリオが非常に明確で具体的。';
    } else if (score >= 6) {
      details += '活用シナリオが概ね明確。';
    } else if (score >= 4) {
      details += '活用シナリオにやや曖昧な部分がある。';
    } else {
      details += '活用シナリオが不明確で改善が必要。';
    }

    if (!hasSpecificScenario) {
      details += '\n改善点: より具体的な活用方法の記述が必要。';
    }
    if (!hasMultipleReferences && references.length === 1) {
      details += '\n改善点: 複数のケイパビリティ連携も検討することで更なるシナジー創出が可能。';
    }

    return details;
  }

  private generateDepthSpecificityDetails(
    score: number,
    references: CapabilityReference[],
    averageSpecificity: number,
    hasSubLevel: boolean,
    detailedReferences: number
  ): string {
    let details = `活用の深度・具体性: ${score}/15点\n`;
    
    if (score >= 12) {
      details += '非常に具体的で深い活用計画。';
    } else if (score >= 9) {
      details += '適切な深度での活用計画。';
    } else if (score >= 6) {
      details += '基本的な活用計画だが深度に改善余地。';
    } else {
      details += '表面的な活用に留まっており深掘りが必要。';
    }

    if (!hasSubLevel) {
      details += '\n改善点: より詳細なスキル・ノウハウレベルでの活用検討が推奨。';
    }
    if (averageSpecificity < 6) {
      details += '\n改善点: 活用方法の具体性向上が必要。';
    }
    if (detailedReferences < 2) {
      details += '\n改善点: 詳細な活用シナリオの追加記述が有効。';
    }

    return details;
  }

  private generateSynergyStrengthDetails(
    score: number,
    averageSynergyPotential: number,
    maxSynergyPotential: number,
    uniqueAdvantage: number,
    competitiveBarrier: number
  ): string {
    let details = `シナジー効果の強烈さ: ${score}/15点\n`;
    
    if (score >= 12) {
      details += '極めて強力で競合困難なシナジー効果。';
    } else if (score >= 9) {
      details += '強いシナジー効果による競合優位性。';
    } else if (score >= 6) {
      details += '一定のシナジー効果は期待できる。';
    } else {
      details += 'シナジー効果が限定的で強化が必要。';
    }

    details += `\n- 平均シナジーポテンシャル: ${averageSynergyPotential.toFixed(1)}/10`;
    details += `\n- 最大シナジーポテンシャル: ${maxSynergyPotential}/10`;
    details += `\n- 独自性評価: ${uniqueAdvantage}/10`;
    details += `\n- 競合障壁評価: ${competitiveBarrier}/10`;

    return details;
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  private initializeKeywordMapping(): void {
    this.capabilityKeywords = new Map([
      // 大項目レベル
      ['real_estate_development', ['不動産開発', '設計', '建設', '用地取得', 'プロジェクト管理', '開発', '建築', '都市計画']],
      ['property_operations', ['不動産運営', '管理', 'ビル管理', 'テナント', 'ファシリティ', 'fm', '運営', '保守', 'メンテナンス']],
      ['financial_capabilities', ['資金調達', 'ファイナンス', '投資', '金融', 'プロジェクトファイナンス', 'ファンド', '資本市場']],
      ['innovation_capabilities', ['イノベーション', 'dx', 'デジタル', 'proptech', '新規事業', 'スタートアップ', '技術革新']],
      
      // 中項目レベル
      ['design_expertise', ['設計', '建築設計', '都市計画', 'マスタープラン', 'ボリューム', '実施設計']],
      ['project_management', ['プロジェクト管理', '工程管理', 'スケジュール', 'コスト管理', '品質管理']],
      ['facility_management', ['ファシリティマネジメント', 'ビル管理', '設備保守', '清掃', '警備', 'エネルギー管理']],
      ['tenant_relations', ['テナント', 'リーシング', '営業', 'テナントサービス', '契約管理']],
      ['funding_capabilities', ['資金調達', 'プロジェクトファイナンス', '社債', 'ファンド組成']],
      ['digital_transformation', ['dx', 'デジタル変革', 'proptech', 'データ分析', 'ai活用']],
      
      // 小項目・特殊項目
      ['smart_building', ['スマートビル', 'iot', 'ai', '自動制御', 'センサー', 'bems']],
      ['proptech_adoption', ['proptech', 'プロップテック', '不動産テック', '技術導入']],
      ['urban_planning', ['都市計画', 'まちづくり', '地区計画', '都市開発', 'マスタープラン']],
      
      // ネットワーク資産
      ['tenant_network', ['丸の内', 'テナント企業', '大手企業', '企業ネットワーク']],
      ['mitsubishi_group', ['三菱グループ', '三菱商事', '三菱ufj', '三菱重工', '三菱電機']]
    ]);
  }
}