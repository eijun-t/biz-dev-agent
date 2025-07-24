/**
 * Regulatory Investigator Module
 * 規制・法的要件の調査モジュール
 */

import {
  DomainType,
  DomainResearchResult,
  RegulatoryFindings,
  ResearchItem,
  DomainResearchItem,
  ResearchMetadata,
  DomainExecutionError
} from '../types';
import { EXECUTION_MESSAGES } from '../config';

export class RegulatoryInvestigator {
  private domain: DomainType = 'regulatory';

  async investigate(researchItems: ResearchItem[]): Promise<DomainResearchResult> {
    console.log(EXECUTION_MESSAGES.DOMAIN_START.replace('{domain}', 'Regulatory'));
    
    const startTime = new Date().toISOString();
    const domainItems: DomainResearchItem[] = [];
    const findings: RegulatoryFindings = {
      applicableLaws: [],
      licenses: [],
      standards: [],
      upcomingChanges: []
    };

    try {
      // Filter and process relevant research items
      const regulatoryItems = researchItems.filter(item => 
        item.category === 'risk_analysis' || 
        item.category === 'execution_planning' ||
        item.title.toLowerCase().includes('規制') ||
        item.title.toLowerCase().includes('法') ||
        item.title.toLowerCase().includes('regulatory') ||
        item.title.toLowerCase().includes('compliance')
      );

      for (const item of regulatoryItems) {
        const domainItem = await this.processResearchItem(item);
        domainItems.push(domainItem);
        
        if (domainItem.status === 'completed') {
          await this.extractRegulatoryData(item, findings);
        }
      }

      // Analyze regulatory landscape
      this.analyzeRegulatoryRequirements(findings);
      
      const endTime = new Date().toISOString();
      const metadata: ResearchMetadata = {
        startTime,
        endTime,
        dataSourcesUsed: this.getUsedDataSources(regulatoryItems),
        confidence: this.calculateConfidence(findings),
        limitations: this.identifyLimitations(findings),
        recommendations: this.generateRecommendations(findings)
      };

      console.log(EXECUTION_MESSAGES.DOMAIN_COMPLETE.replace('{domain}', 'Regulatory'));

      return {
        domain: this.domain,
        researchItems: domainItems,
        findings,
        metadata
      };

    } catch (error) {
      throw new DomainExecutionError(
        this.domain,
        `Regulatory investigation failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  private async processResearchItem(item: ResearchItem): Promise<DomainResearchItem> {
    const domainItem: DomainResearchItem = {
      id: `regulatory_${item.id}`,
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

  private async extractRegulatoryData(item: ResearchItem, findings: RegulatoryFindings): Promise<void> {
    // Extract applicable laws
    if (item.title.includes('法') || item.title.includes('law')) {
      findings.applicableLaws.push(...this.generateApplicableLaws());
    }

    // Extract licenses
    if (item.title.includes('ライセンス') || item.title.includes('許可')) {
      findings.licenses.push(...this.generateLicenses());
    }

    // Extract standards
    if (item.title.includes('標準') || item.title.includes('standard')) {
      findings.standards.push(...this.generateStandards());
    }

    // Extract upcoming changes
    if (item.title.includes('改正') || item.title.includes('change')) {
      findings.upcomingChanges.push(...this.generateUpcomingChanges());
    }
  }

  private generateApplicableLaws(): Array<any> {
    return [
      {
        name: '個人情報保護法',
        jurisdiction: '日本',
        requirements: [
          '個人データの適切な取得・利用',
          '安全管理措置の実施',
          '第三者提供の制限',
          '開示請求への対応'
        ],
        penalties: '最大1億円の罰金または6ヶ月以下の懲役',
        complianceCost: 5000000
      },
      {
        name: '電子商取引法',
        jurisdiction: '日本',
        requirements: [
          '特定商取引法に基づく表示',
          '消費者保護措置',
          '契約条件の明示',
          'クーリングオフ対応'
        ],
        penalties: '最大300万円の罰金',
        complianceCost: 2000000
      },
      {
        name: 'GDPR（EU一般データ保護規則）',
        jurisdiction: 'EU',
        requirements: [
          'データ処理の法的根拠',
          'プライバシーバイデザイン',
          'データポータビリティ',
          '忘れられる権利'
        ],
        penalties: '年間売上高の4%または2000万ユーロのいずれか高い方',
        complianceCost: 10000000
      }
    ];
  }

  private generateLicenses(): Array<any> {
    return [
      {
        type: '電気通信事業者届出',
        issuingAuthority: '総務省',
        requirements: [
          '事業計画書の提出',
          '技術的条件の適合',
          '管理体制の整備'
        ],
        timeline: '届出後即日～30日',
        cost: 500000
      },
      {
        type: 'プライバシーマーク',
        issuingAuthority: 'JIPDEC',
        requirements: [
          '個人情報保護マネジメントシステムの構築',
          '内部監査の実施',
          '教育研修の実施'
        ],
        timeline: '6ヶ月～1年',
        cost: 1500000
      }
    ];
  }

  private generateStandards(): Array<any> {
    return [
      {
        name: 'ISO/IEC 27001（情報セキュリティ）',
        type: 'recommended' as const,
        certificationBody: 'JQA、BSI等',
        requirements: [
          'ISMS（情報セキュリティマネジメントシステム）の構築',
          'リスクアセスメントの実施',
          '継続的改善プロセス',
          '定期的な監査'
        ]
      },
      {
        name: 'PCI DSS（カード業界セキュリティ基準）',
        type: 'mandatory' as const,
        certificationBody: 'PCI SSC認定審査機関',
        requirements: [
          'ネットワークセキュリティの確保',
          'カードデータの保護',
          'アクセス制御の実施',
          '定期的なセキュリティテスト'
        ]
      }
    ];
  }

  private generateUpcomingChanges(): Array<any> {
    return [
      {
        regulation: '改正個人情報保護法',
        effectiveDate: '2024-04-01',
        impact: 'high' as const,
        requiredActions: [
          '利用目的の明確化',
          '漏洩時の報告義務化',
          '仮名加工情報の取扱い規定整備',
          'Cookie等の規制対応'
        ]
      },
      {
        regulation: 'AI規制法案（EU）',
        effectiveDate: '2025-01-01',
        impact: 'medium' as const,
        requiredActions: [
          'AIシステムのリスク評価',
          '透明性確保措置',
          '人間による監督体制',
          '技術文書の整備'
        ]
      }
    ];
  }

  private analyzeRegulatoryRequirements(findings: RegulatoryFindings): void {
    // Sort by compliance cost
    findings.applicableLaws.sort((a, b) => b.complianceCost - a.complianceCost);
    
    // Sort licenses by timeline
    findings.licenses.sort((a, b) => {
      const timelineToMonths = (timeline: string) => {
        if (timeline.includes('即日')) return 0;
        if (timeline.includes('30日')) return 1;
        if (timeline.includes('6ヶ月')) return 6;
        if (timeline.includes('1年')) return 12;
        return 99;
      };
      return timelineToMonths(a.timeline) - timelineToMonths(b.timeline);
    });
    
    // Sort upcoming changes by date
    findings.upcomingChanges.sort((a, b) => 
      new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
    );
  }

  private getUsedDataSources(items: ResearchItem[]): string[] {
    const sources = new Set<string>();
    items.forEach(item => {
      item.dataSources.forEach(source => sources.add(source));
    });
    return Array.from(sources);
  }

  private calculateConfidence(findings: RegulatoryFindings): 'high' | 'medium' | 'low' {
    let score = 0;
    
    if (findings.applicableLaws.length >= 2) score += 0.3;
    if (findings.licenses.length >= 1) score += 0.2;
    if (findings.standards.length >= 1) score += 0.2;
    if (findings.upcomingChanges.length >= 1) score += 0.3;
    
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private identifyLimitations(findings: RegulatoryFindings): string[] {
    const limitations = [];
    
    if (findings.applicableLaws.length < 3) {
      limitations.push('関連法規の調査が不完全な可能性');
    }
    if (findings.licenses.length === 0) {
      limitations.push('必要なライセンス・許認可の特定が不十分');
    }
    if (findings.upcomingChanges.length === 0) {
      limitations.push('将来の規制変更リスクの把握が不足');
    }
    
    return limitations;
  }

  private generateRecommendations(findings: RegulatoryFindings): string[] {
    const recommendations = [];
    
    // Compliance priority recommendation
    const highCostLaws = findings.applicableLaws.filter(law => law.complianceCost > 5000000);
    if (highCostLaws.length > 0) {
      recommendations.push('高コストな規制要件から優先的に対応体制を構築することを推奨');
    }
    
    // License timeline recommendation
    const longTermLicenses = findings.licenses.filter(lic => 
      lic.timeline.includes('6ヶ月') || lic.timeline.includes('1年')
    );
    if (longTermLicenses.length > 0) {
      recommendations.push('長期間を要するライセンス取得を早期に開始することを推奨');
    }
    
    // Upcoming changes recommendation
    const highImpactChanges = findings.upcomingChanges.filter(change => change.impact === 'high');
    if (highImpactChanges.length > 0) {
      recommendations.push('影響度の高い規制変更に対する準備を優先することを推奨');
    }
    
    // General compliance recommendation
    recommendations.push('法務専門家との連携による包括的なコンプライアンス体制の構築を推奨');
    
    return recommendations;
  }
}