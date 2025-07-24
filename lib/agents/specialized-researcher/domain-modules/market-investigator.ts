/**
 * Market Investigator Module
 * 市場規模・セグメント・動向の調査モジュール
 */

import {
  DomainType,
  DomainResearchResult,
  MarketFindings,
  ResearchItem,
  DomainResearchItem,
  ResearchMetadata,
  DomainExecutionError
} from '../types';
import { DATA_SOURCE_TEMPLATES, EXECUTION_MESSAGES } from '../config';

export class MarketInvestigator {
  private domain: DomainType = 'market';

  async investigate(researchItems: ResearchItem[]): Promise<DomainResearchResult> {
    console.log(EXECUTION_MESSAGES.DOMAIN_START.replace('{domain}', 'Market'));
    
    const startTime = new Date().toISOString();
    const domainItems: DomainResearchItem[] = [];
    const findings: MarketFindings = {
      marketSize: {
        total: 0,
        currency: 'JPY',
        year: new Date().getFullYear(),
        growthRate: 0,
        forecast: []
      },
      segments: [],
      trends: [],
      opportunities: []
    };

    try {
      // Filter and process relevant research items
      const marketItems = researchItems.filter(item => 
        item.category === 'market_competition' || 
        item.category === 'target_customer' ||
        item.title.toLowerCase().includes('market') ||
        item.title.toLowerCase().includes('顧客') ||
        item.title.toLowerCase().includes('市場')
      );

      for (const item of marketItems) {
        const domainItem = await this.processResearchItem(item);
        domainItems.push(domainItem);
        
        if (domainItem.status === 'completed') {
          await this.extractMarketData(item, findings);
        }
      }

      // Aggregate and analyze findings
      this.analyzeMarketData(findings);
      
      const endTime = new Date().toISOString();
      const metadata: ResearchMetadata = {
        startTime,
        endTime,
        dataSourcesUsed: this.getUsedDataSources(marketItems),
        confidence: this.calculateConfidence(findings),
        limitations: this.identifyLimitations(findings),
        recommendations: this.generateRecommendations(findings)
      };

      console.log(EXECUTION_MESSAGES.DOMAIN_COMPLETE.replace('{domain}', 'Market'));

      return {
        domain: this.domain,
        researchItems: domainItems,
        findings,
        metadata
      };

    } catch (error) {
      throw new DomainExecutionError(
        this.domain,
        `Market investigation failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  private async processResearchItem(item: ResearchItem): Promise<DomainResearchItem> {
    const domainItem: DomainResearchItem = {
      id: `market_${item.id}`,
      domain: this.domain,
      title: item.title,
      description: item.description,
      status: 'in_progress',
      startedAt: new Date().toISOString()
    };

    try {
      // Simulate research execution
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
    // Simulate API calls and data collection
    // In production, this would make actual API calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async extractMarketData(item: ResearchItem, findings: MarketFindings): Promise<void> {
    // Extract market size data
    if (item.title.includes('市場規模') || item.title.includes('market size')) {
      findings.marketSize = {
        total: Math.floor(Math.random() * 1000000000000) + 100000000000, // 100B - 1.1T JPY
        currency: 'JPY',
        year: new Date().getFullYear(),
        growthRate: Math.random() * 0.2 + 0.05, // 5-25% growth
        forecast: this.generateForecast()
      };
    }

    // Extract segment data
    if (item.title.includes('セグメント') || item.title.includes('segment')) {
      findings.segments.push(...this.generateSegments());
    }

    // Extract trends
    if (item.title.includes('トレンド') || item.title.includes('trend')) {
      findings.trends.push(...this.generateTrends());
    }

    // Extract opportunities
    if (item.title.includes('機会') || item.title.includes('opportunity')) {
      findings.opportunities.push(...this.generateOpportunities());
    }
  }

  private generateForecast(): Array<{ year: number; size: number; growthRate: number }> {
    const currentYear = new Date().getFullYear();
    const forecast = [];
    let baseSize = Math.floor(Math.random() * 1000000000000) + 100000000000;
    
    for (let i = 1; i <= 5; i++) {
      const growthRate = Math.random() * 0.15 + 0.05;
      baseSize = baseSize * (1 + growthRate);
      forecast.push({
        year: currentYear + i,
        size: Math.floor(baseSize),
        growthRate
      });
    }
    
    return forecast;
  }

  private generateSegments(): Array<any> {
    const segments = [
      { name: 'エンタープライズ', share: 0.35 },
      { name: '中小企業', share: 0.25 },
      { name: 'スタートアップ', share: 0.15 },
      { name: '個人事業主', share: 0.15 },
      { name: 'その他', share: 0.10 }
    ];

    return segments.map(seg => ({
      name: seg.name,
      size: Math.floor(Math.random() * 500000000000) + 50000000000,
      share: seg.share,
      growthRate: Math.random() * 0.2 + 0.05,
      keyPlayers: this.generateKeyPlayers()
    }));
  }

  private generateKeyPlayers(): string[] {
    const players = [
      'Microsoft', 'Google', 'Amazon', 'Salesforce', 'Oracle',
      'SAP', 'IBM', 'Adobe', 'ServiceNow', 'Workday'
    ];
    const count = Math.floor(Math.random() * 3) + 3;
    return players.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private generateTrends(): Array<any> {
    return [
      {
        name: 'AI/機械学習の活用拡大',
        impact: 'high' as const,
        timeframe: '1-2年',
        description: 'AIを活用した自動化・最適化ソリューションの需要が急増'
      },
      {
        name: 'クラウドネイティブへの移行',
        impact: 'high' as const,
        timeframe: '2-3年',
        description: 'オンプレミスからクラウドへの完全移行が加速'
      },
      {
        name: 'サステナビリティ重視',
        impact: 'medium' as const,
        timeframe: '3-5年',
        description: '環境配慮型ソリューションへの需要増加'
      }
    ];
  }

  private generateOpportunities(): Array<any> {
    return [
      {
        description: '中小企業向けAI導入支援サービス',
        potentialSize: 50000000000,
        difficulty: 'moderate' as const,
        timeToCapture: '6-12ヶ月'
      },
      {
        description: '業界特化型SaaSプラットフォーム',
        potentialSize: 80000000000,
        difficulty: 'difficult' as const,
        timeToCapture: '12-18ヶ月'
      }
    ];
  }

  private analyzeMarketData(findings: MarketFindings): void {
    // Calculate total addressable market
    if (findings.segments.length > 0) {
      findings.marketSize.total = findings.segments.reduce((sum, seg) => sum + seg.size, 0);
    }

    // Sort trends by impact
    findings.trends.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    // Sort opportunities by potential size
    findings.opportunities.sort((a, b) => b.potentialSize - a.potentialSize);
  }

  private getUsedDataSources(items: ResearchItem[]): string[] {
    const sources = new Set<string>();
    items.forEach(item => {
      item.dataSources.forEach(source => sources.add(source));
    });
    return Array.from(sources);
  }

  private calculateConfidence(findings: MarketFindings): 'high' | 'medium' | 'low' {
    let score = 0;
    
    if (findings.marketSize.total > 0) score += 0.3;
    if (findings.segments.length >= 3) score += 0.2;
    if (findings.trends.length >= 2) score += 0.2;
    if (findings.opportunities.length >= 1) score += 0.2;
    if (findings.marketSize.forecast.length >= 3) score += 0.1;
    
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private identifyLimitations(findings: MarketFindings): string[] {
    const limitations = [];
    
    if (!findings.marketSize.total || findings.marketSize.total === 0) {
      limitations.push('正確な市場規模データが不足');
    }
    if (findings.segments.length < 3) {
      limitations.push('市場セグメント分析が不完全');
    }
    if (findings.trends.length < 2) {
      limitations.push('市場トレンド情報が限定的');
    }
    
    return limitations;
  }

  private generateRecommendations(findings: MarketFindings): string[] {
    const recommendations = [];
    
    if (findings.marketSize.growthRate > 0.15) {
      recommendations.push('高成長市場への早期参入を推奨');
    }
    
    if (findings.opportunities.length > 0) {
      const easiest = findings.opportunities.find(o => o.difficulty === 'easy');
      if (easiest) {
        recommendations.push(`短期的には「${easiest.description}」から着手することを推奨`);
      }
    }
    
    if (findings.segments.length > 0) {
      const largest = findings.segments.sort((a, b) => b.size - a.size)[0];
      recommendations.push(`最大セグメント「${largest.name}」を優先ターゲットとすることを推奨`);
    }
    
    return recommendations;
  }
}