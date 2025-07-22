/**
 * Cost Monitor and Language Switching for Enhanced Researcher Agent
 * コスト監視と言語切り替え機能
 */

import { 
  CostMonitor, 
  DataSourceType, 
  ResearchCategory, 
  Language, 
  Region,
  ResearchError 
} from './enhanced-researcher-types';
import { ERROR_CODES } from './enhanced-researcher-config';

// 使用量記録
interface UsageRecord {
  timestamp: string;
  sourceType: DataSourceType;
  sourceName: string;
  cost: number;
  requestCount: number;
  category: ResearchCategory;
  language: Language;
  region: Region;
}

// 予算アラート
interface BudgetAlert {
  id: string;
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  timestamp: string;
  category?: ResearchCategory;
  sourceType?: DataSourceType;
}

// 言語戦略設定
interface LanguageStrategy {
  category: ResearchCategory;
  phase: 'ideation' | 'market_research' | 'detailed_analysis';
  preferredLanguage: Language;
  fallbackLanguage?: Language;
  regionRestriction?: Region;
}

export class CostMonitoringSystem {
  private costMonitor: CostMonitor;
  private usageHistory: UsageRecord[] = [];
  private alerts: BudgetAlert[] = [];
  private languageStrategies: LanguageStrategy[] = [];
  private lastResetDate: string;

  // データソース別コスト（円/リクエスト）
  private sourceCosts: Record<string, number> = {
    'serper_news': 10,
    'serper_search': 10,
    'openai_api': 50,
    'yahoo_news_jp': 0,
    'google_news': 0,
    'estat_api': 0,
    'cabinet_office': 0,
    'meti': 0,
    'nikkei': 0,
    'diamond': 0,
    'reddit_api': 0,
    'arxiv': 0,
    'semantic_scholar': 0
  };

  constructor(monthlyBudget: number = 2000, alertThreshold: number = 0.8) {
    this.lastResetDate = this.getMonthStart();
    this.costMonitor = {
      totalSpent: 0,
      monthlyBudget,
      remainingBudget: monthlyBudget,
      costBreakdown: {
        news: 0,
        reports: 0,
        statistics: 0,
        academic: 0,
        social: 0,
        government: 0,
        corporate: 0
      },
      alertThreshold,
      isOverBudget: false,
      estimatedMonthlyUsage: 0,
      lastReset: this.lastResetDate
    };

    this.initializeLanguageStrategies();
  }

  /**
   * 月初日を取得
   */
  private getMonthStart(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  /**
   * 言語戦略を初期化
   */
  private initializeLanguageStrategies(): void {
    this.languageStrategies = [
      // Ideation段階：幅広い情報収集（日英両方）
      { category: 'market_trends', phase: 'ideation', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'technology', phase: 'ideation', preferredLanguage: 'en', fallbackLanguage: 'ja' },
      { category: 'investment', phase: 'ideation', preferredLanguage: 'en', fallbackLanguage: 'ja' },
      { category: 'regulation', phase: 'ideation', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'consumer_behavior', phase: 'ideation', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'competition', phase: 'ideation', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'macroeconomics', phase: 'ideation', preferredLanguage: 'ja', fallbackLanguage: 'en' },

      // Market Research段階：日本市場重視
      { category: 'market_trends', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'technology', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'investment', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'regulation', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'consumer_behavior', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'competition', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'macroeconomics', phase: 'market_research', preferredLanguage: 'ja', regionRestriction: 'japan' },

      // Detailed Analysis段階：詳細分析（必要に応じて英語も）
      { category: 'market_trends', phase: 'detailed_analysis', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'technology', phase: 'detailed_analysis', preferredLanguage: 'en', fallbackLanguage: 'ja' },
      { category: 'investment', phase: 'detailed_analysis', preferredLanguage: 'en', fallbackLanguage: 'ja' },
      { category: 'regulation', phase: 'detailed_analysis', preferredLanguage: 'ja', regionRestriction: 'japan' },
      { category: 'consumer_behavior', phase: 'detailed_analysis', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'competition', phase: 'detailed_analysis', preferredLanguage: 'ja', fallbackLanguage: 'en' },
      { category: 'macroeconomics', phase: 'detailed_analysis', preferredLanguage: 'ja', fallbackLanguage: 'en' }
    ];
  }

  /**
   * コスト記録
   */
  recordUsage(
    sourceType: DataSourceType,
    sourceName: string,
    requestCount: number,
    category: ResearchCategory,
    language: Language,
    region: Region
  ): number {
    // 月初リセットチェック
    this.checkMonthlyReset();

    const costPerRequest = this.sourceCosts[sourceName] || 0;
    const totalCost = costPerRequest * requestCount;

    // 使用記録を保存
    const usageRecord: UsageRecord = {
      timestamp: new Date().toISOString(),
      sourceType,
      sourceName,
      cost: totalCost,
      requestCount,
      category,
      language,
      region
    };

    this.usageHistory.push(usageRecord);

    // コスト監視を更新
    this.costMonitor.totalSpent += totalCost;
    this.costMonitor.remainingBudget = this.costMonitor.monthlyBudget - this.costMonitor.totalSpent;
    this.costMonitor.costBreakdown[sourceType] += totalCost;
    this.costMonitor.isOverBudget = this.costMonitor.totalSpent > this.costMonitor.monthlyBudget;

    // 月次使用量推定を更新
    this.updateMonthlyEstimate();

    // アラートチェック
    this.checkAlerts();

    console.log(`Cost recorded: ${sourceName} ${requestCount} requests = ¥${totalCost}`);

    return totalCost;
  }

  /**
   * 月次リセットチェック
   */
  private checkMonthlyReset(): void {
    const currentMonthStart = this.getMonthStart();
    
    if (currentMonthStart !== this.lastResetDate) {
      this.resetMonthlyCosts();
      this.lastResetDate = currentMonthStart;
    }
  }

  /**
   * 月次コストリセット
   */
  private resetMonthlyCosts(): void {
    console.log('Monthly cost reset');
    
    this.costMonitor.totalSpent = 0;
    this.costMonitor.remainingBudget = this.costMonitor.monthlyBudget;
    this.costMonitor.isOverBudget = false;
    this.costMonitor.costBreakdown = {
      news: 0,
      reports: 0,
      statistics: 0,
      academic: 0,
      social: 0,
      government: 0,
      corporate: 0
    };
    this.costMonitor.lastReset = this.lastResetDate;

    // 古い使用履歴をアーカイブ（過去3ヶ月分を保持）
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    this.usageHistory = this.usageHistory.filter(
      record => new Date(record.timestamp) > threeMonthsAgo
    );

    // アラートをクリア
    this.alerts = [];
  }

  /**
   * 月次使用量推定を更新
   */
  private updateMonthlyEstimate(): void {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    this.costMonitor.estimatedMonthlyUsage = (this.costMonitor.totalSpent / daysElapsed) * daysInMonth;
  }

  /**
   * アラートチェック
   */
  private checkAlerts(): void {
    const usagePercentage = this.costMonitor.totalSpent / this.costMonitor.monthlyBudget;

    // 予算アラート
    if (usagePercentage >= 1.0 && !this.hasRecentAlert('exceeded')) {
      this.createAlert('exceeded', `予算を超過しました（¥${this.costMonitor.totalSpent}/¥${this.costMonitor.monthlyBudget}）`);
    } else if (usagePercentage >= 0.9 && !this.hasRecentAlert('critical')) {
      this.createAlert('critical', `予算の90%に達しました（¥${this.costMonitor.totalSpent}/¥${this.costMonitor.monthlyBudget}）`);
    } else if (usagePercentage >= this.costMonitor.alertThreshold && !this.hasRecentAlert('warning')) {
      this.createAlert('warning', `予算の${Math.round(usagePercentage * 100)}%に達しました（¥${this.costMonitor.totalSpent}/¥${this.costMonitor.monthlyBudget}）`);
    }

    // 推定月次使用量アラート
    if (this.costMonitor.estimatedMonthlyUsage > this.costMonitor.monthlyBudget * 1.2) {
      if (!this.hasRecentAlert('critical', 'estimated_overage')) {
        this.createAlert('critical', `推定月次使用量が予算を大幅に超過する見込み（¥${Math.round(this.costMonitor.estimatedMonthlyUsage)}）`, 'estimated_overage');
      }
    }
  }

  /**
   * 最近のアラート存在チェック
   */
  private hasRecentAlert(level: string, type?: string): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alerts.some(alert => 
      alert.level === level && 
      new Date(alert.timestamp) > oneHourAgo &&
      (!type || alert.id.includes(type))
    );
  }

  /**
   * アラート作成
   */
  private createAlert(level: 'warning' | 'critical' | 'exceeded', message: string, type?: string): void {
    const alert: BudgetAlert = {
      id: `alert_${type || level}_${Date.now()}`,
      level,
      message,
      currentSpend: this.costMonitor.totalSpent,
      budgetLimit: this.costMonitor.monthlyBudget,
      percentage: (this.costMonitor.totalSpent / this.costMonitor.monthlyBudget) * 100,
      timestamp: new Date().toISOString()
    };

    this.alerts.push(alert);
    console.warn(`Budget Alert [${level.toUpperCase()}]: ${message}`);
  }

  /**
   * 使用前コストチェック
   */
  canAffordRequest(
    sourceName: string, 
    requestCount: number = 1
  ): { canAfford: boolean; estimatedCost: number; reason?: string } {
    const estimatedCost = (this.sourceCosts[sourceName] || 0) * requestCount;
    
    if (this.costMonitor.isOverBudget) {
      return {
        canAfford: false,
        estimatedCost,
        reason: '月次予算を既に超過しています'
      };
    }

    if (this.costMonitor.totalSpent + estimatedCost > this.costMonitor.monthlyBudget) {
      return {
        canAfford: false,
        estimatedCost,
        reason: 'この操作により月次予算を超過します'
      };
    }

    return { canAfford: true, estimatedCost };
  }

  /**
   * 言語戦略取得
   */
  getLanguageStrategy(
    category: ResearchCategory,
    phase: 'ideation' | 'market_research' | 'detailed_analysis'
  ): { language: Language; region?: Region; fallback?: Language } {
    const strategy = this.languageStrategies.find(
      s => s.category === category && s.phase === phase
    );

    if (!strategy) {
      // デフォルト戦略
      return { language: 'ja', region: 'japan' };
    }

    return {
      language: strategy.preferredLanguage,
      region: strategy.regionRestriction,
      fallback: strategy.fallbackLanguage
    };
  }

  /**
   * 言語戦略更新
   */
  updateLanguageStrategy(
    category: ResearchCategory,
    phase: 'ideation' | 'market_research' | 'detailed_analysis',
    language: Language,
    region?: Region,
    fallbackLanguage?: Language
  ): void {
    const index = this.languageStrategies.findIndex(
      s => s.category === category && s.phase === phase
    );

    const newStrategy: LanguageStrategy = {
      category,
      phase,
      preferredLanguage: language,
      fallbackLanguage,
      regionRestriction: region
    };

    if (index >= 0) {
      this.languageStrategies[index] = newStrategy;
    } else {
      this.languageStrategies.push(newStrategy);
    }
  }

  /**
   * コスト効率分析
   */
  getCostEfficiencyAnalysis(): {
    totalRequests: number;
    averageCostPerRequest: number;
    mostExpensiveSource: string;
    cheapestSource: string;
    categoryEfficiency: Record<ResearchCategory, { cost: number; requests: number; efficiency: number }>;
    recommendations: string[];
  } {
    if (this.usageHistory.length === 0) {
      return {
        totalRequests: 0,
        averageCostPerRequest: 0,
        mostExpensiveSource: '',
        cheapestSource: '',
        categoryEfficiency: {} as any,
        recommendations: []
      };
    }

    const totalRequests = this.usageHistory.reduce((sum, record) => sum + record.requestCount, 0);
    const averageCostPerRequest = this.costMonitor.totalSpent / totalRequests;

    // ソース別効率性分析
    const sourceEfficiency = new Map<string, { cost: number; requests: number }>();
    this.usageHistory.forEach(record => {
      const current = sourceEfficiency.get(record.sourceName) || { cost: 0, requests: 0 };
      sourceEfficiency.set(record.sourceName, {
        cost: current.cost + record.cost,
        requests: current.requests + record.requestCount
      });
    });

    let mostExpensiveSource = '';
    let cheapestSource = '';
    let highestCost = 0;
    let lowestCost = Infinity;

    for (const [source, data] of sourceEfficiency.entries()) {
      const avgCost = data.cost / data.requests;
      if (avgCost > highestCost) {
        highestCost = avgCost;
        mostExpensiveSource = source;
      }
      if (avgCost < lowestCost && avgCost > 0) {
        lowestCost = avgCost;
        cheapestSource = source;
      }
    }

    // カテゴリ別効率性
    const categoryEfficiency: Record<ResearchCategory, { cost: number; requests: number; efficiency: number }> = {
      market_trends: { cost: 0, requests: 0, efficiency: 0 },
      technology: { cost: 0, requests: 0, efficiency: 0 },
      investment: { cost: 0, requests: 0, efficiency: 0 },
      regulation: { cost: 0, requests: 0, efficiency: 0 },
      consumer_behavior: { cost: 0, requests: 0, efficiency: 0 },
      competition: { cost: 0, requests: 0, efficiency: 0 },
      macroeconomics: { cost: 0, requests: 0, efficiency: 0 }
    };

    this.usageHistory.forEach(record => {
      categoryEfficiency[record.category].cost += record.cost;
      categoryEfficiency[record.category].requests += record.requestCount;
    });

    // 効率性スコア計算（リクエスト数/コスト）
    Object.keys(categoryEfficiency).forEach(category => {
      const data = categoryEfficiency[category as ResearchCategory];
      data.efficiency = data.cost > 0 ? data.requests / data.cost : 0;
    });

    // 推奨事項生成
    const recommendations: string[] = [];
    
    if (this.costMonitor.totalSpent > this.costMonitor.monthlyBudget * 0.8) {
      recommendations.push('無料データソースの活用を増やして、コストを削減することを推奨します');
    }

    if (mostExpensiveSource && highestCost > averageCostPerRequest * 2) {
      recommendations.push(`${mostExpensiveSource}の使用頻度を見直し、代替ソースの活用を検討してください`);
    }

    return {
      totalRequests,
      averageCostPerRequest,
      mostExpensiveSource,
      cheapestSource,
      categoryEfficiency,
      recommendations
    };
  }

  /**
   * 予算調整提案
   */
  getBudgetAdjustmentSuggestion(): {
    currentBudget: number;
    estimatedMonthlyUsage: number;
    suggestedBudget: number;
    reasoning: string;
  } {
    const buffer = 1.2; // 20%のバッファ
    const suggestedBudget = Math.ceil(this.costMonitor.estimatedMonthlyUsage * buffer);

    let reasoning = '';
    
    if (this.costMonitor.estimatedMonthlyUsage > this.costMonitor.monthlyBudget) {
      reasoning = '現在の使用ペースでは予算を超過する見込みです。予算の増額を推奨します。';
    } else if (this.costMonitor.estimatedMonthlyUsage < this.costMonitor.monthlyBudget * 0.6) {
      reasoning = '予算に対して使用量が少ないため、予算の減額または他の用途への配分を検討できます。';
    } else {
      reasoning = '現在の予算は適切な範囲内です。';
    }

    return {
      currentBudget: this.costMonitor.monthlyBudget,
      estimatedMonthlyUsage: this.costMonitor.estimatedMonthlyUsage,
      suggestedBudget,
      reasoning
    };
  }

  /**
   * 現在の状態取得
   */
  getCurrentStatus(): CostMonitor & {
    recentAlerts: BudgetAlert[];
    usageToday: number;
    usageThisWeek: number;
    topExpensiveSources: Array<{name: string; cost: number; percentage: number}>;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const usageToday = this.usageHistory
      .filter(record => new Date(record.timestamp) >= today)
      .reduce((sum, record) => sum + record.cost, 0);

    const usageThisWeek = this.usageHistory
      .filter(record => new Date(record.timestamp) >= thisWeek)
      .reduce((sum, record) => sum + record.cost, 0);

    // 上位コスト源
    const sourceCosts = new Map<string, number>();
    this.usageHistory.forEach(record => {
      sourceCosts.set(record.sourceName, (sourceCosts.get(record.sourceName) || 0) + record.cost);
    });

    const topExpensiveSources = Array.from(sourceCosts.entries())
      .map(([name, cost]) => ({
        name,
        cost,
        percentage: (cost / this.costMonitor.totalSpent) * 100
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      ...this.costMonitor,
      recentAlerts: this.alerts.slice(-5),
      usageToday,
      usageThisWeek,
      topExpensiveSources
    };
  }
}