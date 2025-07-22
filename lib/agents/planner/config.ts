/**
 * Advanced Planner Agent - Configuration
 * 詳細調査計画策定エージェントの設定
 */

import { PlannerConfig, ResearchCategory, ResearchPriority, ResearchDifficulty, ResearchMethod } from './types';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  planning: {
    maxItemsPerCategory: 15,
    defaultTimeBufferPercent: 20,
    defaultCostBufferPercent: 15,
    qualityThresholds: {
      completeness: 0.85,
      feasibility: 0.75,
      efficiency: 0.70
    }
  },
  prioritization: {
    weights: {
      businessImpact: 0.35,
      feasibility: 0.25,
      cost: 0.15,
      time: 0.15,
      risk: 0.10
    },
    algorithms: {
      priorityCalculation: 'weighted_score',
      dependencyHandling: 'flexible'
    }
  },
  adaptation: {
    enableDynamicAdjustment: true,
    adjustmentThresholds: {
      minImpactForAdjustment: 0.1,
      maxAdjustmentsPerDay: 5
    },
    autoApprovalLimits: {
      timeImpactPercent: 10,
      costImpactPercent: 5
    }
  }
};

// ============================================================================
// Research Categories Configuration
// ============================================================================

export const RESEARCH_CATEGORY_CONFIG = {
  target_customer: {
    name: 'ターゲット・課題調査',
    description: '詳細な顧客セグメント・ペインポイント分析',
    icon: '🎯',
    defaultPriority: 'high' as ResearchPriority,
    estimatedTimeRange: [8, 24], // hours
    estimatedCostRange: [50000, 200000], // JPY
    requiredMethods: ['web_search', 'database_query', 'survey'] as ResearchMethod[]
  },
  solution_technology: {
    name: 'ソリューション技術調査',
    description: '技術仕様・特許・実装可能性',
    icon: '💡',
    defaultPriority: 'high' as ResearchPriority,
    estimatedTimeRange: [12, 32], // hours
    estimatedCostRange: [80000, 300000], // JPY
    requiredMethods: ['web_search', 'database_query', 'api_call'] as ResearchMethod[]
  },
  market_competition: {
    name: '市場・競合調査',
    description: '市場規模・成長率・競合分析',
    icon: '📈',
    defaultPriority: 'critical' as ResearchPriority,
    estimatedTimeRange: [16, 40], // hours
    estimatedCostRange: [100000, 400000], // JPY
    requiredMethods: ['web_search', 'database_query', 'analysis'] as ResearchMethod[]
  },
  risk_analysis: {
    name: 'リスク要因調査',
    description: '技術・市場・規制・財務リスク詳細分析',
    icon: '⚠️',
    defaultPriority: 'high' as ResearchPriority,
    estimatedTimeRange: [10, 28], // hours
    estimatedCostRange: [60000, 250000], // JPY
    requiredMethods: ['web_search', 'analysis', 'expert_required'] as ResearchMethod[]
  },
  execution_planning: {
    name: '実行計画調査',
    description: 'パートナー候補・投資要件・規制対応',
    icon: '🚀',
    defaultPriority: 'medium' as ResearchPriority,
    estimatedTimeRange: [12, 30], // hours
    estimatedCostRange: [70000, 280000], // JPY
    requiredMethods: ['web_search', 'database_query', 'interview'] as ResearchMethod[]
  }
};

// ============================================================================
// Research Item Templates
// ============================================================================

export const RESEARCH_ITEM_TEMPLATES = {
  target_customer: [
    {
      title: '詳細顧客セグメント分析',
      description: 'ターゲット顧客の属性、行動パターン、ニーズを詳細に分析',
      keyQuestions: [
        '主要ターゲット顧客セグメントの詳細な属性は？',
        '各セグメントの購買行動パターンは？',
        '顧客のペインポイント・アンメットニーズは？',
        'セグメント別の市場規模と成長性は？'
      ],
      methods: ['web_search', 'database_query', 'survey'],
      expectedOutputs: [
        '詳細な顧客ペルソナ',
        'セグメント別市場規模推定',
        'カスタマージャーニーマップ',
        'ニーズ・ペイン分析レポート'
      ]
    },
    {
      title: '顧客の課題・ニーズ深掘り調査',
      description: '既存ソリューションの課題と未解決ニーズの特定',
      keyQuestions: [
        '現在の顧客の課題解決方法は？',
        '既存ソリューションの不満点は？',
        '理想的なソリューション要件は？',
        '顧客の投資意思決定プロセスは？'
      ],
      methods: ['web_search', 'interview', 'survey'],
      expectedOutputs: [
        '課題・ニーズ優先順位マップ',
        '競合ソリューション課題分析',
        'VOC（Voice of Customer）分析',
        'ソリューション要件定義書'
      ]
    },
    {
      title: '購買意思決定プロセス分析',
      description: 'ターゲット顧客の購買プロセスと意思決定要因の分析',
      keyQuestions: [
        '購買意思決定の関係者は？',
        '意思決定プロセスの各段階は？',
        '重要な評価基準は？',
        '購買サイクルの期間は？'
      ],
      methods: ['web_search', 'interview', 'analysis'],
      expectedOutputs: [
        '購買意思決定プロセスマップ',
        'ステークホルダー分析',
        '評価基準・選定要因分析',
        '営業戦略提案書'
      ]
    }
  ],
  solution_technology: [
    {
      title: 'コア技術・特許状況調査',
      description: '必要技術の詳細仕様と特許ランドスケープ分析',
      keyQuestions: [
        '必要なコア技術の詳細仕様は？',
        '関連特許の状況は？',
        '技術的実装の難易度は？',
        'オープンソース活用可能性は？'
      ],
      methods: ['web_search', 'database_query', 'api_call'],
      expectedOutputs: [
        '技術仕様書',
        '特許ランドスケープ分析',
        '技術実装ロードマップ',
        'オープンソース活用指針'
      ]
    },
    {
      title: '技術実装可能性評価',
      description: '技術的実現可能性と開発リソース要件の評価',
      keyQuestions: [
        '技術実装の実現可能性は？',
        '必要な開発リソース・期間は？',
        '技術的リスクは？',
        'スケーラビリティは？'
      ],
      methods: ['analysis', 'expert_required', 'web_search'],
      expectedOutputs: [
        '技術実現可能性評価書',
        '開発リソース要件定義',
        '技術リスク評価',
        'アーキテクチャ設計書'
      ]
    },
    {
      title: '技術パートナー・ベンダー調査',
      description: '技術開発・提供可能なパートナー・ベンダーの調査',
      keyQuestions: [
        '技術提供可能なパートナーは？',
        '各パートナーの強み・実績は？',
        '協業条件・コストは？',
        'パートナーシップ戦略は？'
      ],
      methods: ['web_search', 'database_query', 'interview'],
      expectedOutputs: [
        'パートナー候補リスト',
        'パートナー評価マトリクス',
        '協業提案書',
        'パートナーシップ戦略'
      ]
    }
  ],
  market_competition: [
    {
      title: '詳細市場規模・成長性分析',
      description: '市場規模の詳細分解と成長ドライバー分析',
      keyQuestions: [
        '総合市場規模（TAM/SAM/SOM）は？',
        '市場成長率と成長ドライバーは？',
        'セグメント別市場動向は？',
        '市場成熟度と将来性は？'
      ],
      methods: ['web_search', 'database_query', 'analysis'],
      expectedOutputs: [
        '市場規模詳細分析レポート',
        '成長ドライバー分析',
        'セグメント別市場動向',
        '市場予測モデル'
      ]
    },
    {
      title: '競合企業詳細分析',
      description: '主要競合企業の戦略・強み・弱みの詳細分析',
      keyQuestions: [
        '主要競合企業は？',
        '各競合の戦略・ポジショニングは？',
        '競合の強み・弱みは？',
        '競合の財務状況・投資動向は？'
      ],
      methods: ['web_search', 'database_query', 'analysis'],
      expectedOutputs: [
        '競合企業プロファイル',
        '競合ポジショニングマップ',
        'SWOT分析',
        '競合戦略分析レポート'
      ]
    },
    {
      title: '競合優位性・差別化要因分析',
      description: '自社ソリューションの競合優位性と差別化ポイント',
      keyQuestions: [
        '競合に対する優位性は？',
        '差別化ポイントは？',
        '競合対抗戦略は？',
        '参入障壁・退出障壁は？'
      ],
      methods: ['analysis', 'web_search', 'expert_required'],
      expectedOutputs: [
        '競合優位性分析',
        '差別化戦略書',
        '競合対抗戦略',
        '参入障壁分析'
      ]
    }
  ],
  risk_analysis: [
    {
      title: '技術リスク詳細評価',
      description: '技術開発・実装に関するリスクの詳細評価',
      keyQuestions: [
        '技術開発の主要リスクは？',
        '技術的不確実性は？',
        '代替技術の脅威は？',
        '技術陳腐化リスクは？'
      ],
      methods: ['analysis', 'expert_required', 'web_search'],
      expectedOutputs: [
        '技術リスク評価マトリクス',
        'リスク軽減策',
        '技術代替シナリオ',
        '技術ロードマップ'
      ]
    },
    {
      title: '市場・事業リスク分析',
      description: '市場変化・事業運営に関するリスク分析',
      keyQuestions: [
        '市場変化リスクは？',
        '需要変動リスクは？',
        '競合参入リスクは？',
        '事業運営リスクは？'
      ],
      methods: ['analysis', 'web_search', 'database_query'],
      expectedOutputs: [
        '市場リスク評価',
        '需要予測シナリオ',
        '競合脅威分析',
        '事業継続計画'
      ]
    },
    {
      title: '規制・コンプライアンスリスク調査',
      description: '関連規制・法的要件とコンプライアンスリスク',
      keyQuestions: [
        '関連する規制・法的要件は？',
        '規制変更リスクは？',
        'コンプライアンス要件は？',
        '許認可取得の必要性は？'
      ],
      methods: ['web_search', 'database_query', 'expert_required'],
      expectedOutputs: [
        '規制要件マップ',
        '規制変更リスク評価',
        'コンプライアンス計画',
        '許認可取得計画'
      ]
    }
  ],
  execution_planning: [
    {
      title: '事業実行体制・組織設計',
      description: '事業実行に必要な組織・人材・体制の設計',
      keyQuestions: [
        '必要な組織体制は？',
        '必要な人材・スキルは？',
        '外部リソース活用方針は？',
        'プロジェクト管理体制は？'
      ],
      methods: ['analysis', 'web_search', 'interview'],
      expectedOutputs: [
        '組織設計書',
        '人材要件定義',
        '外部リソース活用計画',
        'プロジェクト管理計画'
      ]
    },
    {
      title: '投資・資金調達計画',
      description: '必要投資額と資金調達方法の詳細計画',
      keyQuestions: [
        '必要投資額の詳細は？',
        '資金調達方法・選択肢は？',
        '投資回収計画は？',
        '財務リスクと対策は？'
      ],
      methods: ['analysis', 'web_search', 'database_query'],
      expectedOutputs: [
        '投資計画書',
        '資金調達戦略',
        '財務計画・予測',
        'ROI分析'
      ]
    },
    {
      title: '戦略的パートナーシップ計画',
      description: '事業推進に必要な戦略パートナーとの協業計画',
      keyQuestions: [
        '必要な戦略パートナーは？',
        'パートナーシップの形態は？',
        '協業条件・契約内容は？',
        'パートナー管理方法は？'
      ],
      methods: ['web_search', 'database_query', 'interview'],
      expectedOutputs: [
        'パートナー戦略',
        '協業契約テンプレート',
        'パートナー管理計画',
        'アライアンス戦略'
      ]
    }
  ]
};

// ============================================================================
// Priority Calculation Weights
// ============================================================================

export const PRIORITY_WEIGHTS = {
  businessImpact: {
    revenue: 0.4,
    strategic: 0.3,
    competitive: 0.2,
    synergy: 0.1
  },
  feasibility: {
    technical: 0.35,
    resource: 0.25,
    timeline: 0.25,
    cost: 0.15
  },
  urgency: {
    market_timing: 0.4,
    competitive_pressure: 0.3,
    regulatory_deadline: 0.2,
    internal_deadline: 0.1
  }
};

// ============================================================================
// Data Source Capabilities
// ============================================================================

export const DATA_SOURCE_CONFIG = {
  web_search: {
    capabilities: ['general_info', 'news', 'trends', 'public_data'],
    costPerQuery: 100, // JPY
    timePerQuery: 0.25, // hours
    reliability: 0.7
  },
  database_query: {
    capabilities: ['market_data', 'financial_data', 'patent_data', 'company_data'],
    costPerQuery: 500, // JPY
    timePerQuery: 0.5, // hours
    reliability: 0.9
  },
  api_call: {
    capabilities: ['real_time_data', 'structured_data', 'technical_specs'],
    costPerQuery: 200, // JPY
    timePerQuery: 0.1, // hours
    reliability: 0.95
  },
  survey: {
    capabilities: ['customer_insights', 'market_feedback', 'preference_data'],
    costPerQuery: 10000, // JPY
    timePerQuery: 8, // hours
    reliability: 0.85
  },
  interview: {
    capabilities: ['expert_insights', 'detailed_feedback', 'strategic_advice'],
    costPerQuery: 50000, // JPY
    timePerQuery: 2, // hours
    reliability: 0.95
  },
  analysis: {
    capabilities: ['data_interpretation', 'trend_analysis', 'modeling'],
    costPerQuery: 0, // Internal resource
    timePerQuery: 1, // hours
    reliability: 0.8
  }
};

// ============================================================================
// Quality Criteria
// ============================================================================

export const QUALITY_CRITERIA = {
  completeness: {
    excellent: 0.95,
    good: 0.85,
    acceptable: 0.75,
    poor: 0.60
  },
  accuracy: {
    excellent: 0.95,
    good: 0.90,
    acceptable: 0.80,
    poor: 0.70
  },
  timeliness: {
    excellent: 0.95,
    good: 0.85,
    acceptable: 0.75,
    poor: 0.60
  },
  relevance: {
    excellent: 0.95,
    good: 0.85,
    acceptable: 0.75,
    poor: 0.60
  }
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  PLAN_CREATED: '詳細調査計画が正常に生成されました',
  PLAN_OPTIMIZED: '調査計画の優先順位最適化が完了しました',
  DEPENDENCIES_RESOLVED: '調査項目の依存関係が解決されました',
  RESOURCES_ALLOCATED: '必要リソースの割り当てが完了しました',
  QUALITY_VALIDATED: '計画品質の検証が完了しました'
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  INVALID_BUSINESS_IDEA: 'ビジネスアイデアの形式が不正です',
  INSUFFICIENT_CONTEXT: 'コンテキスト情報が不足しています',
  RESOURCE_CONSTRAINT: 'リソース制約により計画生成できません',
  DEPENDENCY_LOOP: '調査項目に循環依存が検出されました',
  QUALITY_THRESHOLD: '計画品質が最低基準を満たしていません'
};