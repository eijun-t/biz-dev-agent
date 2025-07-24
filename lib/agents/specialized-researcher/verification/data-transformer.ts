/**
 * Data Transformer - Verification and Transformation System
 * 調査データの検証と構造化変換システム
 */

import {
  DomainType,
  DomainResearchResult,
  SpecializedResearchOutput,
  DataTransformationError,
  MarketFindings,
  CompetitorFindings,
  TechnologyFindings,
  RegulatoryFindings,
  FinancialFindings
} from '../types';

export class DataTransformer {
  
  /**
   * Transform domain results into structured output
   */
  async transformResults(
    researchPlanId: string,
    businessIdeaTitle: string,
    domainResults: DomainResearchResult[]
  ): Promise<SpecializedResearchOutput> {
    console.log('🔄 Transforming research data');
    
    try {
      // Validate domain results
      this.validateDomainResults(domainResults);
      
      // Generate summary from all findings
      const summary = this.generateSummary(domainResults);
      
      // Calculate performance metrics
      const performance = this.calculatePerformance(domainResults);
      
      const output: SpecializedResearchOutput = {
        id: `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        researchPlanId,
        businessIdeaTitle,
        executedAt: new Date().toISOString(),
        status: this.determineOverallStatus(domainResults),
        domainResults,
        summary,
        performance
      };
      
      console.log('✅ Data transformation completed');
      return output;
      
    } catch (error) {
      throw new DataTransformationError(
        `Failed to transform research data: ${error.message}`,
        { originalError: error }
      );
    }
  }
  
  /**
   * Validate domain results for completeness and consistency
   */
  private validateDomainResults(results: DomainResearchResult[]): void {
    if (!results || results.length === 0) {
      throw new DataTransformationError('No domain results to transform');
    }
    
    // Check for required domains (market and competitor)
    const domains = results.map(r => r.domain);
    if (!domains.includes('market')) {
      throw new DataTransformationError('Market investigation results are missing');
    }
    if (!domains.includes('competitor')) {
      throw new DataTransformationError('Competitor investigation results are missing');
    }
    
    // Validate each result structure
    results.forEach(result => {
      if (!result.findings || !result.metadata) {
        throw new DataTransformationError(
          `Invalid structure for ${result.domain} domain results`
        );
      }
    });
  }
  
  /**
   * Generate executive summary from all findings
   */
  private generateSummary(results: DomainResearchResult[]): any {
    const keyFindings: string[] = [];
    const criticalRisks: string[] = [];
    const majorOpportunities: string[] = [];
    const nextSteps: string[] = [];
    
    results.forEach(result => {
      switch (result.domain) {
        case 'market':
          this.extractMarketSummary(
            result.findings as MarketFindings,
            keyFindings,
            majorOpportunities
          );
          break;
          
        case 'competitor':
          this.extractCompetitorSummary(
            result.findings as CompetitorFindings,
            keyFindings,
            criticalRisks
          );
          break;
          
        case 'technology':
          this.extractTechnologySummary(
            result.findings as TechnologyFindings,
            keyFindings,
            criticalRisks
          );
          break;
          
        case 'regulatory':
          this.extractRegulatorySummary(
            result.findings as RegulatoryFindings,
            criticalRisks,
            nextSteps
          );
          break;
          
        case 'financial':
          this.extractFinancialSummary(
            result.findings as FinancialFindings,
            keyFindings,
            nextSteps
          );
          break;
      }
    });
    
    return {
      keyFindings: this.prioritizeFindings(keyFindings),
      criticalRisks: this.prioritizeRisks(criticalRisks),
      majorOpportunities: this.prioritizeOpportunities(majorOpportunities),
      nextSteps: this.prioritizeNextSteps(nextSteps)
    };
  }
  
  private extractMarketSummary(
    findings: MarketFindings,
    keyFindings: string[],
    opportunities: string[]
  ): void {
    // Market size finding
    if (findings.marketSize.total > 0) {
      keyFindings.push(
        `市場規模は${(findings.marketSize.total / 1000000000).toFixed(0)}億円、` +
        `年間成長率${(findings.marketSize.growthRate * 100).toFixed(1)}%`
      );
    }
    
    // Top segment
    if (findings.segments.length > 0) {
      const topSegment = findings.segments[0];
      keyFindings.push(
        `最大セグメントは「${topSegment.name}」で市場シェア${(topSegment.share * 100).toFixed(0)}%`
      );
    }
    
    // Opportunities
    findings.opportunities.forEach(opp => {
      opportunities.push(opp.description);
    });
  }
  
  private extractCompetitorSummary(
    findings: CompetitorFindings,
    keyFindings: string[],
    risks: string[]
  ): void {
    // Market concentration
    if (findings.directCompetitors.length > 0) {
      const totalShare = findings.directCompetitors.reduce((sum, c) => sum + c.marketShare, 0);
      keyFindings.push(
        `上位${findings.directCompetitors.length}社で市場シェア${(totalShare * 100).toFixed(0)}%を占有`
      );
    }
    
    // Competitive intensity
    if (findings.competitiveLandscape.intensity === 'high') {
      risks.push('競争環境が激化しており、差別化戦略が必須');
    }
    
    // Key differentiators
    if (findings.competitiveLandscape.differentiationOpportunities.length > 0) {
      keyFindings.push(
        `主要な差別化機会: ${findings.competitiveLandscape.differentiationOpportunities[0]}`
      );
    }
  }
  
  private extractTechnologySummary(
    findings: TechnologyFindings,
    keyFindings: string[],
    risks: string[]
  ): void {
    // Technical complexity
    const highComplexity = findings.coreTechnologies.filter(
      t => t.implementationComplexity === 'high'
    );
    if (highComplexity.length > 0) {
      risks.push(`${highComplexity.length}つの高難度技術の実装が必要`);
    }
    
    // Patent conflicts
    const conflicts = findings.patents.filter(p => p.potentialConflict);
    if (conflicts.length > 0) {
      risks.push(`${conflicts.length}件の特許関連リスクが存在`);
    }
    
    // Cost estimate
    if (findings.technicalRequirements.estimatedCost > 0) {
      keyFindings.push(
        `技術実装に必要な初期投資額: ${(findings.technicalRequirements.estimatedCost / 1000000).toFixed(0)}百万円`
      );
    }
  }
  
  private extractRegulatorySummary(
    findings: RegulatoryFindings,
    risks: string[],
    nextSteps: string[]
  ): void {
    // High impact regulations
    const highCostRegs = findings.applicableLaws.filter(
      law => law.complianceCost > 5000000
    );
    if (highCostRegs.length > 0) {
      risks.push(
        `${highCostRegs.length}つの高コスト規制への対応が必要（合計${
          (highCostRegs.reduce((sum, r) => sum + r.complianceCost, 0) / 1000000).toFixed(0)
        }百万円）`
      );
    }
    
    // Urgent licenses
    const urgentLicenses = findings.licenses.filter(
      lic => lic.timeline.includes('6ヶ月') || lic.timeline.includes('1年')
    );
    if (urgentLicenses.length > 0) {
      nextSteps.push('長期取得が必要なライセンスの申請準備を開始');
    }
    
    // Upcoming changes
    if (findings.upcomingChanges.length > 0) {
      nextSteps.push(
        `${findings.upcomingChanges[0].regulation}への対応準備（${findings.upcomingChanges[0].effectiveDate}施行）`
      );
    }
  }
  
  private extractFinancialSummary(
    findings: FinancialFindings,
    keyFindings: string[],
    nextSteps: string[]
  ): void {
    // Revenue potential
    if (findings.revenueProjections.realistic.length >= 3) {
      const year3Revenue = findings.revenueProjections.realistic[2].revenue;
      keyFindings.push(
        `3年目の予想売上高: ${(year3Revenue / 1000000).toFixed(0)}百万円`
      );
    }
    
    // Funding needs
    const totalInitial = Object.values(findings.costStructure.initial)
      .reduce((sum: number, cost: any) => sum + (typeof cost === 'number' ? cost : 0), 0);
    if (totalInitial > 0) {
      keyFindings.push(
        `必要初期投資額: ${(totalInitial / 1000000).toFixed(0)}百万円`
      );
    }
    
    // Investment environment
    if (findings.investmentEnvironment.sentiment === 'positive') {
      nextSteps.push('良好な投資環境を活かした資金調達活動の開始');
    }
  }
  
  private prioritizeFindings(findings: string[]): string[] {
    return findings.slice(0, 5);
  }
  
  private prioritizeRisks(risks: string[]): string[] {
    return risks.slice(0, 4);
  }
  
  private prioritizeOpportunities(opportunities: string[]): string[] {
    return opportunities.slice(0, 4);
  }
  
  private prioritizeNextSteps(steps: string[]): string[] {
    return steps.slice(0, 5);
  }
  
  /**
   * Calculate performance metrics
   */
  private calculatePerformance(results: DomainResearchResult[]): any {
    const startTimes = results
      .map(r => new Date(r.metadata.startTime).getTime())
      .filter(t => !isNaN(t));
    const endTimes = results
      .map(r => new Date(r.metadata.endTime).getTime())
      .filter(t => !isNaN(t));
    
    const totalTimeMs = startTimes.length > 0 && endTimes.length > 0
      ? Math.max(...endTimes) - Math.min(...startTimes)
      : 0;
    
    const dataPointsCollected = results.reduce((sum, r) => {
      return sum + r.researchItems.filter(item => item.status === 'completed').length;
    }, 0);
    
    const avgConfidence = results.reduce((sum, r) => {
      const confidenceScore = r.metadata.confidence === 'high' ? 1.0 
        : r.metadata.confidence === 'medium' ? 0.7 
        : 0.4;
      return sum + confidenceScore;
    }, 0) / results.length;
    
    return {
      totalTimeHours: totalTimeMs / (1000 * 60 * 60),
      domainsCompleted: results.length,
      dataPointsCollected,
      confidence: avgConfidence
    };
  }
  
  /**
   * Determine overall execution status
   */
  private determineOverallStatus(results: DomainResearchResult[]): 'success' | 'partial' | 'failed' {
    const failedCount = results.filter(r => 
      r.researchItems.every(item => item.status === 'failed')
    ).length;
    
    const requiredDomains = ['market', 'competitor'];
    const completedRequiredDomains = results.filter(r => 
      requiredDomains.includes(r.domain) &&
      r.researchItems.some(item => item.status === 'completed')
    ).length;
    
    if (failedCount === results.length) {
      return 'failed';
    } else if (completedRequiredDomains === requiredDomains.length && failedCount === 0) {
      return 'success';
    } else {
      return 'partial';
    }
  }
}