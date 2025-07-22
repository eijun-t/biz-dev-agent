/**
 * Enhanced Ideator Agent - Configuration
 * 強化されたアイデア生成エージェントの設定
 */

import {
  IdeatorConfig,
  GenerationConfig,
  FilteringConfig,
  MitsubishiConfig,
  QualityConfig,
  OutputConfig,
  MitsubishiAsset,
  QualityWeights,
  ValidationCriteria,
  RiskLevel,
  Language
} from './enhanced-ideator-types';

// ============================================================================
// Generation Configuration
// ============================================================================

export const GENERATION_CONFIG: GenerationConfig = {
  defaultIdeaCount: 6,
  maxIdeaCount: 8,
  minIdeaCount: 4,
  diversityThreshold: 0.7, // Ideas must be 70% different from each other
  creativityLevel: 0.8, // High creativity
  iterationLimit: 3 // Max iterations to generate quality ideas
};

// ============================================================================
// Filtering Configuration
// ============================================================================

export const FILTERING_CONFIG: FilteringConfig = {
  minProfitThreshold: 10_000_000_000, // 10B JPY minimum
  minSynergyScore: 6, // 6/10 minimum synergy with Mitsubishi Estate
  maxRiskLevel: 'challenging' as RiskLevel,
  requiredUniqueness: 'medium',
  feasibilityThreshold: 6 // 6/10 minimum feasibility
};

// ============================================================================
// Mitsubishi Estate Configuration
// ============================================================================

// 事業ポートフォリオ（展開している事業）
export const MITSUBISHI_BUSINESS_PORTFOLIO = {
  // 不動産開発事業
  urban_development: {
    name: '不動産開発事業',
    description: '大規模都市開発・複合施設開発',
    businesses: {
      marunouchi: {
        name: '丸の内エリア開発',
        description: '東京駅前の日本最大級ビジネス地区',
        scale: '約30棟のビル、延床面積約400万㎡',
        key_features: ['日本最高級立地', '大手企業本社集積', '国際的ブランド力', '最新インフラ'],
        synergy_potential: 10
      },
      minatomirai: {
        name: 'みなとみらい21開発',
        description: '横浜の現代的ビジネス・商業・居住複合地区',
        scale: '複数の超高層ビル、商業施設、ホテル',
        key_features: ['先進的都市デザイン', '国際会議場', '臨海立地', 'スマートシティ実証'],
        synergy_potential: 9
      }
    }
  },

  // 商業施設事業
  retail_facilities: {
    name: '商業施設事業',
    description: 'アウトレットモール・商業施設運営',
    businesses: {
      outlet_parks: {
        name: 'アウトレットパーク事業',
        description: '全国展開するプレミアムアウトレットモール',
        scale: '全国8箇所のアウトレットモール',
        key_features: ['高級ブランド集積', '広域集客力', '観光・レジャー要素'],
        synergy_potential: 8
      }
    }
  },

  // 住宅事業
  residential: {
    name: '住宅事業',
    description: '分譲マンション・住宅開発',
    businesses: {
      parkhouse: {
        name: 'ザ・パークハウス事業',
        description: '高級分譲マンションブランド',
        scale: '累計約700棟、約8万戸供給実績',
        key_features: ['高品質住宅ブランド', '富裕層顧客基盤', '長期管理ノウハウ'],
        synergy_potential: 7
      }
    }
  },

  // 国際事業
  international: {
    name: '国際事業',
    description: 'アジア・米国・欧州での不動産事業',
    businesses: {
      overseas_development: {
        name: '海外不動産開発',
        description: '海外市場での不動産開発・投資',
        scale: 'アジア・米国・欧州の主要都市',
        key_features: ['現地パートナーシップ', '国際基準対応', 'クロスボーダー投資'],
        synergy_potential: 7
      }
    }
  }
};

// ネットワーク資産
export const MITSUBISHI_NETWORK_ASSETS = {
  // 企業ネットワーク
  corporate_networks: {
    name: '企業ネットワーク',
    description: '長年の事業を通じて構築された企業間関係',
    networks: {
      tenant_companies: {
        name: '丸の内テナント企業群',
        description: '丸の内エリアに拠点を置く大手企業ネットワーク',
        composition: ['東証プライム上場企業', '金融機関', '商社', 'グローバル製造業', 'IT企業'],
        relationship_depth: '長期賃貸契約・戦略的パートナーシップ',
        business_potential: ['新規事業共創', 'イノベーション実証', 'データ連携'],
        synergy_potential: 10
      },
      retail_tenants: {
        name: '商業テナント企業群',
        description: 'アウトレット・商業施設のテナント企業ネットワーク',
        composition: ['高級ブランド', '専門店', '飲食チェーン', 'サービス企業'],
        relationship_depth: '出店契約・マーケティング連携',
        business_potential: ['新業態実験', 'オムニチャネル展開', '消費者データ活用'],
        synergy_potential: 8
      },
      mitsubishi_group: {
        name: '三菱グループ',
        description: '三菱グループ各社との連携ネットワーク',
        composition: ['三菱商事', '三菱UFJ銀行', '三菱重工', '三菱電機', '三菱ケミカル等'],
        relationship_depth: '資本関係・事業連携・人材交流',
        business_potential: ['シナジー創出', '技術連携', 'グローバル展開'],
        synergy_potential: 9
      }
    }
  },

  // パートナーネットワーク
  partner_networks: {
    name: 'パートナーネットワーク',
    description: '事業推進のためのパートナー関係',
    networks: {
      construction_partners: {
        name: '建設・設計パートナー',
        description: '大手建設会社・設計事務所との連携',
        composition: ['大手ゼネコン', '設計事務所', '専門工事会社'],
        relationship_depth: '長期取引関係・技術協力',
        business_potential: ['技術革新', 'コスト最適化', '品質向上'],
        synergy_potential: 8
      },
      financial_partners: {
        name: '金融パートナー',
        description: '金融機関・投資ファンドとの関係',
        composition: ['メガバンク', '地方銀行', '投資ファンド', '保険会社'],
        relationship_depth: 'プロジェクトファイナンス・投資関係',
        business_potential: ['資金調達', 'リスク分散', '新商品開発'],
        synergy_potential: 9
      },
      government_relations: {
        name: '政府・自治体関係',
        description: '中央政府・地方自治体との関係',
        composition: ['国土交通省', '経済産業省', '東京都', '横浜市等'],
        relationship_depth: '政策協力・規制対応・まちづくり連携',
        business_potential: ['政策活用', '規制緩和', '公民連携'],
        synergy_potential: 8
      }
    }
  }
};

// コアケイパビリティ（3層構造）
export const MITSUBISHI_CORE_CAPABILITIES = {
  // 大項目1: 不動産開発力
  real_estate_development: {
    name: '不動産開発力',
    description: '土地取得から竣工まで一気通貫した開発能力',
    strength_level: 10,
    capabilities: {
      // 中項目1-1: 設計業務ノウハウ
      design_expertise: {
        name: '設計業務ノウハウ',
        description: '建築設計から都市計画まで幅広い設計能力',
        strength_level: 9,
        sub_capabilities: {
          initial_design: {
            name: '初期設計・ボリュームチェック',
            description: 'ボリュームスタディ、初期的図面作成、事業性検討',
            strength_level: 9,
            specific_skills: ['敷地分析', '容積率検討', 'ボリューム最適化', '収益性試算']
          },
          detailed_design: {
            name: '実施設計・詳細設計',
            description: '実施設計図書作成、詳細仕様決定、施工図調整',
            strength_level: 8,
            specific_skills: ['構造設計連携', '設備設計調整', 'BIM活用', '施工性検討']
          },
          asset_specific_design: {
            name: '各種アセット対応設計',
            description: 'オフィス・商業・住宅・ホテル等の用途別設計',
            strength_level: 9,
            specific_skills: ['オフィス設計', '商業施設設計', '住宅設計', 'ホテル設計', '複合用途設計']
          },
          urban_planning: {
            name: '都市計画・マスタープラン',
            description: '都市計画マスタープラン、地区計画、まちづくり計画',
            strength_level: 10,
            specific_skills: ['都市計画法対応', '地区計画策定', '交通計画', 'インフラ計画', '景観計画']
          }
        }
      },

      // 中項目1-2: プロジェクトマネジメント力
      project_management: {
        name: 'プロジェクトマネジメント力',
        description: '大規模開発プロジェクトの統合管理能力',
        strength_level: 10,
        sub_capabilities: {
          cost_management: {
            name: '収支管理・コスト管理',
            description: '事業収支管理、建設費管理、運営費最適化',
            strength_level: 9,
            specific_skills: ['事業収支計画', 'キャッシュフロー管理', '予算統制', 'コスト分析']
          },
          contractor_management: {
            name: 'ゼネコン・協力会社管理',
            description: '建設会社との関係管理、品質・工程管理',
            strength_level: 9,
            specific_skills: ['ゼネコン選定', '契約交渉', '工程管理', '品質管理', '安全管理']
          },
          construction_cost_control: {
            name: '工事費管理・VE/CD',
            description: '建設コスト最適化、VE（価値工学）・CD（コストダウン）',
            strength_level: 8,
            specific_skills: ['VE提案評価', 'CDアイデア実装', '仕様最適化', '代替案検討']
          },
          schedule_management: {
            name: 'スケジュール管理',
            description: '開発スケジュール策定・進捗管理・調整',
            strength_level: 9,
            specific_skills: ['工程計画', 'クリティカルパス管理', 'リスク対応', '関係者調整']
          }
        }
      },

      // 中項目1-3: 用地取得・投資判断
      land_acquisition: {
        name: '用地取得・投資判断力',
        description: '優良用地の発掘・取得・投資判断',
        strength_level: 9,
        sub_capabilities: {
          site_evaluation: {
            name: '立地評価・市場分析',
            description: '立地ポテンシャル評価、市場動向分析',
            strength_level: 9,
            specific_skills: ['立地分析', '市場調査', '競合分析', '将来性評価']
          },
          acquisition_negotiation: {
            name: '用地取得交渉',
            description: '地権者交渉、取得条件調整、権利関係整理',
            strength_level: 8,
            specific_skills: ['地権者対応', '価格交渉', '権利調整', 'デューデリジェンス']
          },
          investment_analysis: {
            name: '投資分析・リスク評価',
            description: '投資収益性分析、リスク評価、意思決定支援',
            strength_level: 9,
            specific_skills: ['DCF分析', 'IRR計算', 'リスク分析', 'ポートフォリオ管理']
          }
        }
      }
    }
  },

  // 大項目2: 不動産運営・管理力
  property_operations: {
    name: '不動産運営・管理力',
    description: '竣工後の建物運営・テナント管理・収益最大化',
    strength_level: 9,
    capabilities: {
      // 中項目2-1: ビル管理・FM
      facility_management: {
        name: 'ビル管理・ファシリティマネジメント',
        description: '建物の維持管理・運営最適化',
        strength_level: 9,
        sub_capabilities: {
          building_maintenance: {
            name: '建物維持管理',
            description: '設備保守、清掃、警備等の維持管理業務',
            strength_level: 8,
            specific_skills: ['設備保守計画', '予防保全', '緊急対応', '品質管理']
          },
          energy_management: {
            name: 'エネルギー管理・省エネ',
            description: 'エネルギー使用量最適化、省エネ施策実行',
            strength_level: 8,
            specific_skills: ['エネルギー分析', '省エネ提案', 'BEMS活用', 'CO2削減']
          },
          smart_building: {
            name: 'スマートビル運営',
            description: 'IoT・AIを活用した建物運営最適化',
            strength_level: 7,
            specific_skills: ['IoTセンサー活用', 'AI分析', 'データ可視化', '自動制御']
          }
        }
      },

      // 中項目2-2: テナントリレーション
      tenant_relations: {
        name: 'テナントリレーション',
        description: 'テナント満足度向上・長期関係構築',
        strength_level: 9,
        sub_capabilities: {
          leasing_sales: {
            name: 'リーシング・営業',
            description: 'テナント誘致、契約交渉、営業活動',
            strength_level: 9,
            specific_skills: ['テナント開拓', '提案営業', '契約条件交渉', 'クロージング']
          },
          tenant_service: {
            name: 'テナントサービス',
            description: 'テナント向けサービス提供・満足度向上',
            strength_level: 8,
            specific_skills: ['コンシェルジュサービス', 'イベント企画', 'コミュニティ形成', '要望対応']
          },
          contract_management: {
            name: '契約管理・更新',
            description: '賃貸借契約管理、更新交渉、条件調整',
            strength_level: 8,
            specific_skills: ['契約更新', '賃料改定', '契約条件見直し', '法務対応']
          }
        }
      }
    }
  },

  // 大項目3: 金融・投資力
  financial_capabilities: {
    name: '金融・投資力',
    description: '資金調達・投資・金融商品開発能力',
    strength_level: 9,
    capabilities: {
      // 中項目3-1: 資金調達力
      funding_capabilities: {
        name: '資金調達力',
        description: '多様な資金調達手段の活用能力',
        strength_level: 9,
        sub_capabilities: {
          project_finance: {
            name: 'プロジェクトファイナンス',
            description: '大規模開発プロジェクトの資金調達',
            strength_level: 9,
            specific_skills: ['ストラクチャー構築', '金融機関交渉', 'リスク分担', '担保設定']
          },
          capital_market: {
            name: '資本市場調達',
            description: '社債発行、株式発行等の直接金融',
            strength_level: 8,
            specific_skills: ['社債発行', '格付対応', 'IR活動', '投資家対応']
          },
          fund_creation: {
            name: 'ファンド組成・運営',
            description: '不動産ファンドの組成・運営',
            strength_level: 8,
            specific_skills: ['ファンド設計', '投資家募集', 'アセットマネジメント', '運用報告']
          }
        }
      }
    }
  },

  // 大項目4: 事業創造・イノベーション力
  innovation_capabilities: {
    name: '事業創造・イノベーション力',
    description: '新規事業創出・技術革新・デジタル変革能力',
    strength_level: 7,
    capabilities: {
      // 中項目4-1: デジタル変革・DX
      digital_transformation: {
        name: 'デジタル変革・DX推進',
        description: 'デジタル技術活用による事業変革',
        strength_level: 7,
        sub_capabilities: {
          proptech_adoption: {
            name: 'PropTech導入・活用',
            description: '不動産テクノロジーの導入・事業化',
            strength_level: 7,
            specific_skills: ['PropTech評価', 'パイロット実行', 'スケール展開', '効果測定']
          },
          data_analytics: {
            name: 'データ分析・活用',
            description: '不動産・顧客データの分析・活用',
            strength_level: 6,
            specific_skills: ['データ収集', '分析モデル構築', 'インサイト抽出', '意思決定支援']
          }
        }
      },

      // 中項目4-2: 新規事業創出
      new_business_development: {
        name: '新規事業創出',
        description: '既存事業を超えた新たな事業領域の開拓',
        strength_level: 6,
        sub_capabilities: {
          startup_collaboration: {
            name: 'スタートアップ連携・CVC',
            description: 'スタートアップとの協業・投資',
            strength_level: 6,
            specific_skills: ['スタートアップ評価', 'CVC投資', '協業推進', 'エコシステム構築']
          },
          business_model_innovation: {
            name: 'ビジネスモデル革新',
            description: '従来の不動産業を超えた新モデル創出',
            strength_level: 5,
            specific_skills: ['ビジネスモデル設計', 'プロトタイプ開発', '市場検証', 'スケール戦略']
          }
        }
      }
    }
  }
};

// 統合設定
export const MITSUBISHI_CONFIG: MitsubishiConfig = {
  business_portfolio: MITSUBISHI_BUSINESS_PORTFOLIO,
  network_assets: MITSUBISHI_NETWORK_ASSETS,
  core_capabilities: MITSUBISHI_CORE_CAPABILITIES,
  strategic_priorities: [
    'デジタル変革・DX推進',
    '新規事業創出・イノベーション',
    '国際事業展開強化',
    'ESG・持続可能性向上',
    'テナント・顧客価値向上',
    'スマートシティ・都市OS',
    '脱炭素・環境技術',
    'ヘルスケア・ウェルビーイング'
  ],
  brand_values: [
    '信頼性・誠実性',
    '高品質・プレミアム',
    '革新性・先進性',
    '持続可能性・社会貢献',
    '国際性・グローバル',
    '協調性・パートナーシップ'
  ]
};

// ============================================================================
// Quality Configuration
// ============================================================================

export const QUALITY_WEIGHTS: QualityWeights = {
  originality: 0.15, // 独創性
  feasibility: 0.25, // 実現可能性
  marketViability: 0.20, // 市場性
  synergyAlignment: 0.25, // シナジー適合性
  competitiveAdvantage: 0.10, // 競合優位性
  riskBalance: 0.05 // リスクバランス
};

export const VALIDATION_CRITERIA: ValidationCriteria = {
  minMarketSize: '1000億円以上',
  maxTimeToMarket: '3年以内',
  requiredTechnologies: [
    'proven', // 実証済み技術
    'emerging', // 新興技術
    'innovative' // 革新的技術
  ],
  prohibitedRisks: [
    '規制違反リスク',
    '重大な環境リスク',
    '倫理的問題',
    '反社会的要素'
  ],
  mandatoryFeatures: [
    '三菱地所資産活用',
    '収益性明確化',
    '競合差別化',
    '実装ロードマップ',
    'ESG配慮'
  ]
};

export const QUALITY_CONFIG: QualityConfig = {
  enableQualityChecks: true,
  minQualityScore: 7.0, // 10段階中7.0以上
  qualityWeights: QUALITY_WEIGHTS,
  validationCriteria: VALIDATION_CRITERIA
};

// ============================================================================
// Output Configuration
// ============================================================================

export const OUTPUT_CONFIG: OutputConfig = {
  format: 'detailed',
  includeRoadmap: true,
  includeCompetitors: true,
  includeRisks: true,
  includeMetadata: true,
  language: 'ja' as Language
};

// ============================================================================
// Main Configuration
// ============================================================================

export const DEFAULT_IDEATOR_CONFIG: IdeatorConfig = {
  generation: GENERATION_CONFIG,
  filtering: FILTERING_CONFIG,
  mitsubishi: MITSUBISHI_CONFIG,
  quality: QUALITY_CONFIG,
  output: OUTPUT_CONFIG
};

// ============================================================================
// Category Templates
// ============================================================================

export const BUSINESS_CATEGORIES = [
  'PropTech・不動産テック',
  'スマートシティ・都市OS',
  'FinTech・金融テック',
  'HealthTech・ヘルスケア',
  'RetailTech・小売テック',
  'WorkTech・働き方改革',
  'GreenTech・環境テック',
  'EdTech・教育テック',
  'MobilityTech・モビリティ',
  'FoodTech・フードテック',
  'TravelTech・観光テック',
  'EntertainmentTech・エンタメテック'
] as const;

// ============================================================================
// Risk Level Templates
// ============================================================================

export const RISK_LEVEL_DISTRIBUTION = {
  conservative: 0.25, // 25% - 低リスク・確実性重視
  balanced: 0.50, // 50% - バランス型
  challenging: 0.20, // 20% - 挑戦的・高リターン
  disruptive: 0.05 // 5% - 破壊的イノベーション
};

// ============================================================================
// Business Scale Templates
// ============================================================================

export const BUSINESS_SCALE_DISTRIBUTION = {
  startup: 0.10, // 10% - スタートアップ規模
  mid_market: 0.30, // 30% - 中規模市場
  enterprise: 0.50, // 50% - 大企業市場
  mega_corp: 0.10 // 10% - 超大企業・グローバル市場
};

// ============================================================================
// Ideation Prompts and Templates
// ============================================================================

export const IDEATION_PROMPTS = {
  systemPrompt: `あなたは三菱地所の新規事業開発を専門とする戦略コンサルタントです。
包括的な市場調査データを基に、三菱地所の既存資産とシナジー効果を最大化する
革新的なビジネスアイデアを生成してください。

## 重要な制約条件：
- 最低利益：10億円以上/年
- 三菱地所シナジー：6/10以上
- 実現可能性：6/10以上
- 市場投入：3年以内

## 三菱地所の主要資産：
- 丸の内エリア（日本最高立地）
- 大手企業テナントネットワーク
- 高級住宅ブランド「ザ・パークハウス」
- アウトレットモール事業
- 国際事業展開力

各アイデアは詳細なビジネスモデル、実装ロードマップ、
競合分析、リスク評価を含めてください。`,

  ideaGenerationPrompt: `以下の調査データを基に、{targetCount}個の多様なビジネスアイデアを生成してください：

調査データ：
{researchData}

ユーザー入力：
{userInput}

要求される多様性：
- 異なるビジネスモデル
- 異なるリスクレベル（保守的、バランス、挑戦的）
- 異なる市場セグメント
- 異なる技術要件

各アイデアには以下を必須で含めてください：
1. 明確な価値提案
2. 具体的な収益モデル
3. 三菱地所資産の具体的活用方法
4. 3段階の実装ロードマップ
5. 主要競合3-5社の分析
6. リスク評価と軽減策`,

  synergyAnalysisPrompt: `このビジネスアイデアと三菱地所の既存資産との
シナジー効果を詳細に分析してください：

ビジネスアイデア：
{businessIdea}

利用可能な三菱地所資産：
{mitsubishiAssets}

以下の観点で分析してください：
1. 不動産資産の具体的活用方法
2. テナントネットワークとの連携
3. ブランド力の相乗効果
4. 運営ノウハウの活用
5. 技術・システムの連携
6. リスク軽減効果

シナジースコア（1-10）と具体的な実現方法を提示してください。`,

  competitiveAnalysisPrompt: `以下のビジネスアイデアの競合環境を分析してください：

ビジネスアイデア：
{businessIdea}

市場データ：
{marketData}

以下を含む分析を行ってください：
1. 直接競合3-5社の特定と分析
2. 間接競合・代替手段の分析
3. 競合優位性の特定
4. 市場ポジショニング戦略
5. 参入障壁の評価
6. 競合対策・差別化戦略

各競合の強み・弱み・脅威度を具体的に分析してください。`
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  INSUFFICIENT_RESEARCH_DATA: '調査データが不十分です。より詳細な市場調査が必要です。',
  LOW_SYNERGY_SCORE: '三菱地所とのシナジー効果が基準値を下回っています。',
  INSUFFICIENT_PROFIT: '推定利益が最低基準（10億円）を下回っています。',
  HIGH_RISK_LEVEL: 'リスクレベルが許容範囲を超えています。',
  LOW_FEASIBILITY: '実現可能性が基準値を下回っています。',
  DUPLICATE_IDEA: '類似のアイデアが既に生成されています。',
  GENERATION_TIMEOUT: 'アイデア生成がタイムアウトしました。',
  QUALITY_CHECK_FAILED: '品質チェックに失敗しました。',
  VALIDATION_ERROR: 'バリデーションエラーが発生しました。',
  CONFIG_ERROR: '設定エラーが発生しました。'
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  IDEAS_GENERATED: '{count}個の高品質なビジネスアイデアが生成されました。',
  QUALITY_APPROVED: '全てのアイデアが品質基準をクリアしました。',
  SYNERGY_OPTIMIZED: '三菱地所とのシナジー効果が最適化されました。',
  RISK_BALANCED: 'リスクバランスが適切に調整されました。',
  COMPETITION_ANALYZED: '競合分析が完了しました。',
  ROADMAP_GENERATED: '実装ロードマップが生成されました。'
};

// Exports removed to avoid conflicts - all constants are already exported inline