/**
 * Financial Investigator Module
 * 資金調達・収益性・投資環境の調査モジュール
 */

import {
  DomainType,
  DomainResearchResult,
  FinancialFindings,
  ResearchItem,
  DomainResearchItem,
  ResearchMetadata,
  DomainExecutionError
} from '../types';
import { EXECUTION_MESSAGES } from '../config';

export class FinancialInvestigator {
  private domain: DomainType = 'financial';

  async investigate(researchItems: ResearchItem[]): Promise<DomainResearchResult> {
    console.log(EXECUTION_MESSAGES.DOMAIN_START.replace('{domain}', 'Financial'));
    
    const startTime = new Date().toISOString();
    const domainItems: DomainResearchItem[] = [];
    const findings: FinancialFindings = {
      fundingOptions: [],
      revenueProjections: {
        conservative: [],
        realistic: [],
        optimistic: []
      },
      costStructure: {
        initial: {},
        operational: {},
        scaling: {}
      },
      investmentEnvironment: {
        sentiment: 'neutral',
        activeInvestors: [],
        recentDeals: [],
        valuationBenchmarks: {}
      }
    };

    try {
      // Filter and process relevant research items
      const financialItems = researchItems.filter(item => 
        item.category === 'risk_analysis' || 
        item.category === 'execution_planning' ||
        item.title.toLowerCase().includes('資金') ||
        item.title.toLowerCase().includes('収益') ||
        item.title.toLowerCase().includes('financial') ||
        item.title.toLowerCase().includes('investment')
      );

      for (const item of financialItems) {
        const domainItem = await this.processResearchItem(item);
        domainItems.push(domainItem);
        
        if (domainItem.status === 'completed') {
          await this.extractFinancialData(item, findings);
        }
      }

      // Analyze financial viability
      this.analyzeFinancialMetrics(findings);
      
      const endTime = new Date().toISOString();
      const metadata: ResearchMetadata = {
        startTime,
        endTime,
        dataSourcesUsed: this.getUsedDataSources(financialItems),
        confidence: this.calculateConfidence(findings),
        limitations: this.identifyLimitations(findings),
        recommendations: this.generateRecommendations(findings)
      };

      console.log(EXECUTION_MESSAGES.DOMAIN_COMPLETE.replace('{domain}', 'Financial'));

      return {
        domain: this.domain,
        researchItems: domainItems,
        findings,
        metadata
      };

    } catch (error) {
      throw new DomainExecutionError(
        this.domain,
        `Financial investigation failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  private async processResearchItem(item: ResearchItem): Promise<DomainResearchItem> {
    const domainItem: DomainResearchItem = {
      id: `financial_${item.id}`,
      domain: this.domain,
      title: item.title,
      description: item.description,
      status: 'in_progress',
      startedAt: new Date().toISOString()
    };

    try {
      await this.performResearch(item);
      domainItem.status = 'completed';
      domainItem.completedAt = new Date().toISOString();
    } catch (error) {
      domainItem.status = 'failed';
      domainItem.error = error.message;
      domainItem.completedAt = new Date().toISOString();
    }

    return domainItem;
  }

  private async performResearch(item: ResearchItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async extractFinancialData(item: ResearchItem, findings: FinancialFindings): Promise<void> {
    // Extract funding options
    if (item.title.includes('資金調達') || item.title.includes('funding')) {
      findings.fundingOptions.push(...this.generateFundingOptions());
    }

    // Extract revenue projections
    if (item.title.includes('収益') || item.title.includes('revenue')) {
      this.generateRevenueProjections(findings.revenueProjections);
    }

    // Extract cost structure
    if (item.title.includes('コスト') || item.title.includes('cost')) {
      this.updateCostStructure(findings.costStructure);
    }

    // Extract investment environment
    if (item.title.includes('投資') || item.title.includes('investment')) {
      this.updateInvestmentEnvironment(findings.investmentEnvironment);
    }
  }

  private generateFundingOptions(): Array<any> {
    return [
      {
        type: 'ベンチャーキャピタル',
        amount: { min: 100000000, max: 1000000000 },
        requirements: [
          '明確な成長戦略',
          'スケーラブルなビジネスモデル',
          '強力な経営チーム',
          '大規模市場へのアクセス'
        ],
        timeline: '3-6ヶ月',
        pros: [
          '大規模な資金調達が可能',
          '経営支援・ネットワーク活用',
          'ブランド価値向上'
        ],
        cons: [
          '株式希薄化',
          '経営の自由度低下',
          '成長プレッシャー'
        ]
      },
      {
        type: '銀行融資',
        amount: { min: 10000000, max: 300000000 },
        requirements: [
          '事業計画書',
          '財務諸表（3期分）',
          '担保・保証人',
          '安定した収益'
        ],
        timeline: '1-2ヶ月',
        pros: [
          '株式希薄化なし',
          '経営の独立性維持',
          '予測可能な返済計画'
        ],
        cons: [
          '個人保証リスク',
          '返済義務',
          '審査基準が厳格'
        ]
      },
      {
        type: 'クラウドファンディング',
        amount: { min: 1000000, max: 50000000 },
        requirements: [
          '魅力的なプロダクト',
          'マーケティング力',
          'コミュニティ構築',
          '透明性の確保'
        ],
        timeline: '2-3ヶ月',
        pros: [
          '市場検証が同時に可能',
          '初期顧客獲得',
          'ブランド認知度向上'
        ],
        cons: [
          '成功の不確実性',
          '公開情報の増加',
          '顧客対応負荷'
        ]
      }
    ];
  }

  private generateRevenueProjections(projections: any): void {
    const currentYear = new Date().getFullYear();
    
    for (let i = 1; i <= 5; i++) {
      projections.conservative.push({
        year: currentYear + i,
        revenue: 50000000 * i * 1.2
      });
      
      projections.realistic.push({
        year: currentYear + i,
        revenue: 100000000 * i * 1.5
      });
      
      projections.optimistic.push({
        year: currentYear + i,
        revenue: 200000000 * i * 2
      });
    }
  }

  private updateCostStructure(costStructure: any): void {
    costStructure.initial = {
      '開発費用': 50000000,
      'マーケティング初期費用': 20000000,
      '法務・ライセンス費用': 10000000,
      '設備・インフラ': 15000000,
      '運転資金': 30000000
    };
    
    costStructure.operational = {
      '人件費': 40000000,
      'マーケティング費用': 15000000,
      'インフラ・システム運用': 8000000,
      '営業費用': 10000000,
      '管理費': 7000000
    };
    
    costStructure.scaling = {
      '追加開発費用': 30000000,
      '営業チーム拡大': 25000000,
      '国際展開費用': 40000000,
      'カスタマーサポート強化': 15000000
    };
  }

  private updateInvestmentEnvironment(environment: any): void {
    environment.sentiment = 'positive';
    
    environment.activeInvestors = [
      'グローバル・ブレイン',
      'JAFCO',
      'DNX Ventures',
      'Coral Capital',
      'サイバーエージェント・キャピタル'
    ];
    
    environment.recentDeals = [
      {
        company: 'TechStartup A',
        amount: 500000000,
        investors: ['VC Fund X', 'Angel Y'],
        valuation: 2000000000
      },
      {
        company: 'SaaS Company B',
        amount: 1000000000,
        investors: ['Global VC Z', 'Corporate VC'],
        valuation: 5000000000
      },
      {
        company: 'AI Startup C',
        amount: 300000000,
        investors: ['Seed Fund', 'Angel Group'],
        valuation: 1500000000
      }
    ];
    
    environment.valuationBenchmarks = {
      'プレシード': { min: 100000000, max: 500000000 },
      'シード': { min: 500000000, max: 2000000000 },
      'シリーズA': { min: 2000000000, max: 10000000000 },
      'シリーズB': { min: 10000000000, max: 50000000000 }
    };
  }

  private analyzeFinancialMetrics(findings: FinancialFindings): void {
    // Calculate total initial investment needed
    const totalInitial = Object.values(findings.costStructure.initial)
      .reduce((sum: number, cost: any) => sum + (typeof cost === 'number' ? cost : 0), 0);
    
    // Calculate annual operational cost
    const annualOperational = Object.values(findings.costStructure.operational)
      .reduce((sum: number, cost: any) => sum + (typeof cost === 'number' ? cost : 0), 0) * 12;
    
    // Update funding recommendations based on calculations
    if (totalInitial > 0) {
      findings.fundingOptions.forEach(option => {
        if (option.amount.min < totalInitial) {
          option.amount.min = totalInitial;
        }
      });
    }
  }

  private getUsedDataSources(items: ResearchItem[]): string[] {
    const sources = new Set<string>();
    items.forEach(item => {
      item.dataSources.forEach(source => sources.add(source));
    });
    return Array.from(sources);
  }

  private calculateConfidence(findings: FinancialFindings): 'high' | 'medium' | 'low' {
    let score = 0;
    
    if (findings.fundingOptions.length >= 2) score += 0.25;
    if (findings.revenueProjections.realistic.length >= 3) score += 0.25;
    if (Object.keys(findings.costStructure.initial).length >= 3) score += 0.25;
    if (findings.investmentEnvironment.recentDeals.length >= 2) score += 0.25;
    
    if (score >= 0.75) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private identifyLimitations(findings: FinancialFindings): string[] {
    const limitations = [];
    
    if (findings.fundingOptions.length < 3) {
      limitations.push('資金調達オプションの検討が不十分');
    }
    if (findings.revenueProjections.realistic.length < 5) {
      limitations.push('中長期的な収益予測が不完全');
    }
    if (!findings.costStructure.scaling || Object.keys(findings.costStructure.scaling).length === 0) {
      limitations.push('スケーリング時のコスト見積もりが不足');
    }
    
    return limitations;
  }

  private generateRecommendations(findings: FinancialFindings): string[] {
    const recommendations = [];
    
    // Funding strategy recommendation
    if (findings.fundingOptions.length > 0) {
      const vcOption = findings.fundingOptions.find(opt => opt.type === 'ベンチャーキャピタル');
      if (vcOption && findings.investmentEnvironment.sentiment === 'positive') {
        recommendations.push('現在の良好な投資環境を活かしてVC調達を優先的に検討することを推奨');
      }
    }
    
    // Revenue growth recommendation
    if (findings.revenueProjections.realistic.length > 0) {
      const year3Revenue = findings.revenueProjections.realistic[2]?.revenue;
      if (year3Revenue > 300000000) {
        recommendations.push('3年目での黒字化を目指した積極的な成長戦略を推奨');
      }
    }
    
    // Cost optimization recommendation
    const operationalCosts = Object.values(findings.costStructure.operational);
    if (operationalCosts.length > 0) {
      recommendations.push('初期段階では固定費を抑えた変動費型のコスト構造を推奨');
    }
    
    // Investment timing recommendation
    if (findings.investmentEnvironment.recentDeals.length > 2) {
      recommendations.push('類似企業の調達実績を参考に、適切なバリュエーションでの資金調達を推奨');
    }
    
    return recommendations;
  }
}