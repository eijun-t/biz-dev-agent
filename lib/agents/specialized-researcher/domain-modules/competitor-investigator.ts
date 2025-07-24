/**
 * Competitor Investigator Module
 * 競合分析調査モジュール
 */

import {
  DomainType,
  DomainResearchResult,
  CompetitorFindings,
  ResearchItem,
  DomainResearchItem,
  ResearchMetadata,
  DomainExecutionError
} from '../types';
import { DATA_SOURCE_TEMPLATES, EXECUTION_MESSAGES } from '../config';

export class CompetitorInvestigator {
  private domain: DomainType = 'competitor';

  async investigate(researchItems: ResearchItem[]): Promise<DomainResearchResult> {
    console.log(EXECUTION_MESSAGES.DOMAIN_START.replace('{domain}', 'Competitor'));
    
    const startTime = new Date().toISOString();
    const domainItems: DomainResearchItem[] = [];
    const findings: CompetitorFindings = {
      directCompetitors: [],
      indirectCompetitors: [],
      competitiveLandscape: {
        intensity: 'medium',
        barriers: [],
        keySuccessFactors: [],
        differentiationOpportunities: []
      },
      benchmarking: {
        pricingComparison: {},
        featureComparison: {},
        marketPositioning: {}
      }
    };

    try {
      // Filter and process relevant research items
      const competitorItems = researchItems.filter(item => 
        item.category === 'market_competition' || 
        item.title.toLowerCase().includes('競合') ||
        item.title.toLowerCase().includes('competitor') ||
        item.title.toLowerCase().includes('competition')
      );

      for (const item of competitorItems) {
        const domainItem = await this.processResearchItem(item);
        domainItems.push(domainItem);
        
        if (domainItem.status === 'completed') {
          await this.extractCompetitorData(item, findings);
        }
      }

      // Analyze competitive landscape
      this.analyzeCompetitiveLandscape(findings);
      
      const endTime = new Date().toISOString();
      const metadata: ResearchMetadata = {
        startTime,
        endTime,
        dataSourcesUsed: this.getUsedDataSources(competitorItems),
        confidence: this.calculateConfidence(findings),
        limitations: this.identifyLimitations(findings),
        recommendations: this.generateRecommendations(findings)
      };

      console.log(EXECUTION_MESSAGES.DOMAIN_COMPLETE.replace('{domain}', 'Competitor'));

      return {
        domain: this.domain,
        researchItems: domainItems,
        findings,
        metadata
      };

    } catch (error) {
      throw new DomainExecutionError(
        this.domain,
        `Competitor investigation failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  private async processResearchItem(item: ResearchItem): Promise<DomainResearchItem> {
    const domainItem: DomainResearchItem = {
      id: `competitor_${item.id}`,
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
    // Simulate API calls and competitive intelligence gathering
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async extractCompetitorData(item: ResearchItem, findings: CompetitorFindings): Promise<void> {
    // Extract direct competitors
    if (item.title.includes('直接競合') || item.title.includes('direct competitor')) {
      findings.directCompetitors.push(...this.generateDirectCompetitors());
    }

    // Extract indirect competitors
    if (item.title.includes('間接競合') || item.title.includes('indirect')) {
      findings.indirectCompetitors.push(...this.generateIndirectCompetitors());
    }

    // Extract competitive landscape
    if (item.title.includes('競争環境') || item.title.includes('landscape')) {
      this.updateCompetitiveLandscape(findings.competitiveLandscape);
    }

    // Extract benchmarking data
    if (item.title.includes('ベンチマーク') || item.title.includes('benchmark')) {
      this.updateBenchmarking(findings.benchmarking);
    }
  }

  private generateDirectCompetitors(): Array<any> {
    const competitors = [
      {
        name: 'TechCorp Solutions',
        marketShare: 0.25,
        strengths: [
          '強力なブランド認知度',
          '豊富な資金力',
          '広範な販売ネットワーク'
        ],
        weaknesses: [
          'レガシーシステムへの依存',
          '価格競争力の低下',
          'イノベーションの遅れ'
        ],
        products: [
          {
            name: 'Enterprise Suite Pro',
            marketPosition: 'リーダー',
            pricing: '高価格帯（月額50万円～）'
          },
          {
            name: 'Cloud Platform X',
            marketPosition: 'チャレンジャー',
            pricing: '中価格帯（月額20万円～）'
          }
        ],
        strategy: '大企業向けの包括的ソリューション提供',
        recentMoves: [
          'AI機能の大幅強化発表',
          '中堅企業向け新プラン導入',
          'パートナー企業との提携拡大'
        ]
      },
      {
        name: 'InnovateTech Inc.',
        marketShare: 0.18,
        strengths: [
          '最新技術への素早い対応',
          '柔軟な価格設定',
          '優れたユーザーエクスペリエンス'
        ],
        weaknesses: [
          '限定的な市場プレゼンス',
          'サポート体制の不足',
          'エンタープライズ機能の未成熟'
        ],
        products: [
          {
            name: 'NextGen Platform',
            marketPosition: 'ニッチプレイヤー',
            pricing: '低価格帯（月額5万円～）'
          }
        ],
        strategy: 'スタートアップ・中小企業向けの革新的ソリューション',
        recentMoves: [
          'シリーズB資金調達完了',
          '新機能の月次リリース開始',
          'フリーミアムプラン導入'
        ]
      }
    ];

    return competitors;
  }

  private generateIndirectCompetitors(): Array<any> {
    return [
      {
        name: 'GlobalConsulting Partners',
        threat: 'high' as const,
        overlappingAreas: ['ビジネス変革支援', 'デジタル化推進'],
        potentialImpact: 'コンサルティングサービスとの統合ソリューション提供により市場シェアを奪われる可能性'
      },
      {
        name: 'OpenSource Community',
        threat: 'medium' as const,
        overlappingAreas: ['基本機能の無料提供', '開発者コミュニティ'],
        potentialImpact: '価格感度の高い顧客層が流出する可能性'
      }
    ];
  }

  private updateCompetitiveLandscape(landscape: any): void {
    landscape.intensity = 'high';
    landscape.barriers = [
      '高い初期投資要件',
      '技術的専門知識の必要性',
      '既存顧客の高いスイッチングコスト',
      '規制・コンプライアンス要件'
    ];
    landscape.keySuccessFactors = [
      '継続的なイノベーション',
      '顧客サポートの質',
      'プラットフォームの拡張性',
      '価格競争力',
      'パートナーエコシステム'
    ];
    landscape.differentiationOpportunities = [
      '業界特化型ソリューションの開発',
      'AI/MLを活用した高度な自動化',
      '優れたユーザーエクスペリエンス',
      '柔軟な価格モデル',
      '包括的なセキュリティ機能'
    ];
  }

  private updateBenchmarking(benchmarking: any): void {
    benchmarking.pricingComparison = {
      'TechCorp Solutions': {
        entry: 500000,
        mid: 1000000,
        enterprise: 3000000
      },
      'InnovateTech Inc.': {
        entry: 50000,
        mid: 200000,
        enterprise: 800000
      },
      'Industry Average': {
        entry: 200000,
        mid: 600000,
        enterprise: 1500000
      }
    };

    benchmarking.featureComparison = {
      'AI/ML機能': {
        'TechCorp Solutions': 4,
        'InnovateTech Inc.': 5,
        'Industry Average': 3
      },
      'カスタマイズ性': {
        'TechCorp Solutions': 5,
        'InnovateTech Inc.': 3,
        'Industry Average': 4
      },
      'スケーラビリティ': {
        'TechCorp Solutions': 5,
        'InnovateTech Inc.': 4,
        'Industry Average': 4
      }
    };

    benchmarking.marketPositioning = {
      leaders: ['TechCorp Solutions', 'GlobalTech Giants'],
      challengers: ['InnovateTech Inc.', 'CloudFirst Systems'],
      niche: ['SpecializedSoft', 'IndustryFocus Ltd.'],
      visionaries: ['FutureTech Ventures', 'NextGen Innovations']
    };
  }

  private analyzeCompetitiveLandscape(findings: CompetitorFindings): void {
    // Calculate competitive intensity
    const totalMarketShare = findings.directCompetitors.reduce((sum, c) => sum + c.marketShare, 0);
    if (totalMarketShare > 0.6) {
      findings.competitiveLandscape.intensity = 'high';
    } else if (totalMarketShare > 0.4) {
      findings.competitiveLandscape.intensity = 'medium';
    } else {
      findings.competitiveLandscape.intensity = 'low';
    }

    // Sort competitors by market share
    findings.directCompetitors.sort((a, b) => b.marketShare - a.marketShare);
  }

  private getUsedDataSources(items: ResearchItem[]): string[] {
    const sources = new Set<string>();
    items.forEach(item => {
      item.dataSources.forEach(source => sources.add(source));
    });
    return Array.from(sources);
  }

  private calculateConfidence(findings: CompetitorFindings): 'high' | 'medium' | 'low' {
    let score = 0;
    
    if (findings.directCompetitors.length >= 2) score += 0.3;
    if (findings.indirectCompetitors.length >= 1) score += 0.2;
    if (findings.competitiveLandscape.barriers.length >= 3) score += 0.2;
    if (Object.keys(findings.benchmarking.pricingComparison).length >= 2) score += 0.2;
    if (Object.keys(findings.benchmarking.featureComparison).length >= 2) score += 0.1;
    
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private identifyLimitations(findings: CompetitorFindings): string[] {
    const limitations = [];
    
    if (findings.directCompetitors.length < 3) {
      limitations.push('主要競合の分析が不完全');
    }
    if (!findings.benchmarking.pricingComparison || 
        Object.keys(findings.benchmarking.pricingComparison).length < 2) {
      limitations.push('価格比較データが不足');
    }
    if (findings.competitiveLandscape.differentiationOpportunities.length < 3) {
      limitations.push('差別化機会の分析が限定的');
    }
    
    return limitations;
  }

  private generateRecommendations(findings: CompetitorFindings): string[] {
    const recommendations = [];
    
    // Price positioning recommendation
    if (findings.benchmarking.pricingComparison['Industry Average']) {
      recommendations.push('業界平均価格を考慮した競争力のある価格設定を推奨');
    }
    
    // Differentiation recommendation
    if (findings.competitiveLandscape.differentiationOpportunities.length > 0) {
      const topOpp = findings.competitiveLandscape.differentiationOpportunities[0];
      recommendations.push(`差別化戦略として「${topOpp}」に注力することを推奨`);
    }
    
    // Competitive strategy recommendation
    if (findings.directCompetitors.length > 0) {
      const leader = findings.directCompetitors[0];
      recommendations.push(`市場リーダー「${leader.name}」の弱みを突く戦略の策定を推奨`);
    }
    
    // Partnership recommendation
    if (findings.competitiveLandscape.intensity === 'high') {
      recommendations.push('競争激化に対応するため戦略的パートナーシップの構築を推奨');
    }
    
    return recommendations;
  }
}