/**
 * Enhanced Analyst Agent for Deep Market Analysis
 * 詳細市場分析のための強化されたAnalystエージェント
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  MarketSizeAnalysis,
  CompetitiveAnalysis,
  RiskAssessment,
  FinancialProjections,
  AnalysisResult,
  ResearchRequest,
  ResearchResponse,
  AnalysisPhaseState,
  AnalysisConfig,
  AnalysisError
} from './types';
import { BusinessIdea } from '../ideation/types';

export class AnalystAgent {
  private llm: ChatOpenAI;
  private config: AnalysisConfig;
  private serperApiKey: string;

  constructor(
    llm: ChatOpenAI,
    config: Partial<AnalysisConfig> = {}
  ) {
    this.llm = llm;
    this.serperApiKey = process.env.SERPER_API_KEY || '';
    
    this.config = {
      max_research_requests: 5,
      analysis_timeout: 600000, // 10 minutes
      confidence_threshold: 0.7,
      max_iterations: 3,
      data_sources: {
        web_search_enabled: true,
        government_data_enabled: true,
        financial_apis_enabled: false // No paid APIs as per requirements
      },
      financial_assumptions: {
        default_growth_rate: 0.15,
        default_market_penetration: 0.02,
        risk_free_rate: 0.001, // Japan 10Y bond
        discount_rate: 0.08
      },
      ...config
    };
  }

  /**
   * 包括的な市場分析を実行
   */
  async conductComprehensiveAnalysis(
    businessIdea: BusinessIdea,
    existingResearch?: ResearchResponse[]
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 1. TAM高精度分析（Web検索 + フェルミ推定）
      const marketAnalysis = await this.conductTAMAnalysis(businessIdea);
      
      // 2. 競合分析（リスト作成 + 概要分析）
      const competitiveAnalysis = await this.conductCompetitiveAnalysis(businessIdea);
      
      // 3. リスク評価
      const riskAssessment = await this.conductRiskAssessment(businessIdea);
      
      // 4. 財務予測
      const financialProjections = await this.generateFinancialProjections(
        businessIdea, 
        marketAnalysis
      );
      
      // 5. 戦略提案の生成
      const strategicRecommendations = await this.generateStrategicRecommendations(
        businessIdea,
        marketAnalysis,
        competitiveAnalysis,
        riskAssessment
      );

      // 6. 信頼度評価
      const analysisConfidence = this.calculateAnalysisConfidence(
        marketAnalysis,
        competitiveAnalysis,
        riskAssessment
      );

      const analysisResult: AnalysisResult = {
        business_idea_id: businessIdea.id,
        market_analysis: marketAnalysis,
        competitive_analysis: competitiveAnalysis,
        risk_assessment: riskAssessment,
        financial_projections: financialProjections,
        strategic_recommendations: strategicRecommendations,
        next_steps: this.generateNextSteps(businessIdea, riskAssessment),
        analysis_confidence: analysisConfidence,
        analyst_notes: await this.generateAnalystNotes(businessIdea, marketAnalysis),
        research_requests_made: [], // Will be populated by coordinator
        total_analysis_time: Date.now() - startTime,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      return analysisResult;

    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * TAM高精度分析（Web検索 + フェルミ推定）
   */
  private async conductTAMAnalysis(businessIdea: BusinessIdea): Promise<MarketSizeAnalysis> {
    // 1. Web検索で既存市場データを収集
    const marketData = await this.searchMarketData(businessIdea);
    
    // 2. フェルミ推定で補完
    const fermiEstimation = await this.performFermiEstimation(businessIdea);
    
    // 3. 政府統計データの活用
    const governmentStats = await this.searchGovernmentStatistics(businessIdea);
    
    // 4. 複数手法の統合分析
    const integratedAnalysis = await this.integrateMarketSizeAnalysis(
      marketData,
      fermiEstimation,
      governmentStats,
      businessIdea
    );

    return integratedAnalysis;
  }

  /**
   * Web検索による市場データ収集
   */
  private async searchMarketData(businessIdea: BusinessIdea): Promise<any> {
    const queries = [
      `${businessIdea.target_market} 市場規模 日本 統計`,
      `${businessIdea.solution} 市場調査 TAM SAM`,
      `${businessIdea.title} 業界レポート 市場動向`,
      `${businessIdea.target_market} 市場成長率 予測`
    ];

    const searchResults = [];
    for (const query of queries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 3)
          });
        }
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
      }
    }

    return searchResults;
  }

  /**
   * Web検索実行
   */
  private async performWebSearch(query: string): Promise<any> {
    if (!this.serperApiKey) {
      return null;
    }

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: 10,
          hl: 'ja',
          gl: 'jp'
        })
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Web search error:', error);
      return null;
    }
  }

  /**
   * フェルミ推定による市場規模算出
   */
  private async performFermiEstimation(businessIdea: BusinessIdea): Promise<any> {
    const fermiPrompt = `以下のビジネスアイデアについて、フェルミ推定を用いて日本市場のTAMを算出してください。

ビジネスアイデア:
- タイトル: ${businessIdea.title}
- ターゲット市場: ${businessIdea.target_market}
- 解決する問題: ${businessIdea.problem_statement}
- ソリューション: ${businessIdea.solution}

フェルミ推定のステップ:
1. 対象となる人口/企業数の推定
2. そのうち潜在顧客となる割合
3. 平均的な年間支出額/利用料金
4. 市場浸透率の仮定
5. 最終的なTAM算出

各ステップで使用した仮定と計算根拠を明示してください。
保守的、標準的、楽観的の3つのシナリオで算出してください。

以下のJSON形式で回答:
{
  "conservative_scenario": {
    "tam_billion_yen": 数値,
    "assumptions": ["仮定1", "仮定2", "..."],
    "calculation_steps": ["ステップ1", "ステップ2", "..."]
  },
  "standard_scenario": {
    "tam_billion_yen": 数値,
    "assumptions": ["仮定1", "仮定2", "..."],
    "calculation_steps": ["ステップ1", "ステップ2", "..."]
  },
  "optimistic_scenario": {
    "tam_billion_yen": 数値,
    "assumptions": ["仮定1", "仮定2", "..."],
    "calculation_steps": ["ステップ1", "ステップ2", "..."]
  },
  "recommended_estimate": "conservative/standard/optimistic",
  "confidence_level": "low/medium/high",
  "key_assumptions": ["最も重要な仮定1", "最も重要な仮定2"]
}`;

    const response = await this.llm.invoke(fermiPrompt);
    return this.parseJSONResponse(response.content as string, 'fermi estimation');
  }

  /**
   * 政府統計データの検索
   */
  private async searchGovernmentStatistics(businessIdea: BusinessIdea): Promise<any> {
    const govQueries = [
      `${businessIdea.target_market} 統計 総務省 経済産業省`,
      `${businessIdea.solution} 産業統計 政府統計`,
      `日本 ${businessIdea.target_market} 市場 統計データ site:stat.go.jp`,
      `${businessIdea.title} 業界 経済センサス site:e-stat.go.jp`
    ];

    const govSearchResults = [];
    for (const query of govQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          govSearchResults.push({
            query,
            results: result.organic.slice(0, 2)
          });
        }
      } catch (error) {
        console.error(`Gov search failed for query: ${query}`, error);
      }
    }

    return govSearchResults;
  }

  /**
   * 市場規模分析の統合
   */
  private async integrateMarketSizeAnalysis(
    marketData: any,
    fermiEstimation: any,
    governmentStats: any,
    businessIdea: BusinessIdea
  ): Promise<MarketSizeAnalysis> {
    const integrationPrompt = `以下のデータを統合して、信頼性の高いTAM/SAM/SOM分析を実施してください。

ビジネスアイデア: ${businessIdea.title}
ターゲット市場: ${businessIdea.target_market}

収集データ:
1. Web検索結果:
${JSON.stringify(marketData, null, 2)}

2. フェルミ推定結果:
${JSON.stringify(fermiEstimation, null, 2)}

3. 政府統計検索結果:
${JSON.stringify(governmentStats, null, 2)}

以下の方針で統合分析してください:
- 複数ソースのデータを比較検証
- 矛盾する情報は根拠の信頼性で判断
- TAMは高精度分析、SAM/SOMは概算レベル
- 信頼度レベルを明示

以下のJSON形式で回答:
{
  "tam": {
    "value": 数値（億円）,
    "unit": "億円",
    "description": "TAMの詳細説明",
    "calculation_method": "算出方法の詳細",
    "confidence_level": "low/medium/high",
    "sources": ["ソース1", "ソース2", "..."]
  },
  "sam": {
    "value": 数値（億円）,
    "unit": "億円", 
    "description": "SAMの概算説明",
    "market_share_assumption": 数値（0-1の割合）
  },
  "som": {
    "value": 数値（億円）,
    "unit": "億円",
    "description": "SOMの概算説明", 
    "penetration_assumption": 数値（0-1の割合）
  },
  "market_growth_rate": 数値（年率）,
  "market_maturity": "emerging/growth/mature/declining"
}`;

    const response = await this.llm.invoke(integrationPrompt);
    const result = this.parseJSONResponse(response.content as string, 'market size analysis');
    
    // Default values if parsing fails
    return {
      tam: {
        value: result?.tam?.value || 0,
        unit: '億円',
        description: result?.tam?.description || '算出不可',
        calculation_method: result?.tam?.calculation_method || 'データ不足',
        confidence_level: result?.tam?.confidence_level || 'low',
        sources: result?.tam?.sources || []
      },
      sam: {
        value: result?.sam?.value || 0,
        unit: '億円',
        description: result?.sam?.description || '算出不可',
        market_share_assumption: result?.sam?.market_share_assumption || 0.1
      },
      som: {
        value: result?.som?.value || 0,
        unit: '億円', 
        description: result?.som?.description || '算出不可',
        penetration_assumption: result?.som?.penetration_assumption || 0.01
      },
      market_growth_rate: result?.market_growth_rate || 0.05,
      market_maturity: result?.market_maturity || 'growth'
    };
  }

  /**
   * 競合分析（リスト作成 + 概要分析レベル）
   */
  private async conductCompetitiveAnalysis(businessIdea: BusinessIdea): Promise<CompetitiveAnalysis> {
    // 競合企業の検索
    const competitorData = await this.searchCompetitors(businessIdea);
    
    // 競合分析の実行
    const analysisPrompt = `以下のビジネスアイデアの競合分析を実施してください。

ビジネスアイデア:
- タイトル: ${businessIdea.title}
- ソリューション: ${businessIdea.solution}
- ターゲット市場: ${businessIdea.target_market}
- 三菱地所シナジー: ${businessIdea.mitsubishi_synergy}

検索された競合情報:
${JSON.stringify(competitorData, null, 2)}

分析要件:
- 直接競合3-5社のリスト作成と概要分析
- 間接競合2-3社の特定
- 三菱地所の競合優位性の明確化
- 市場ポジショニングの提案

以下のJSON形式で回答:
{
  "direct_competitors": [
    {
      "name": "競合企業名",
      "market_share": 数値または null,
      "strengths": ["強み1", "強み2"],
      "weaknesses": ["弱み1", "弱み2"],
      "key_offerings": ["主要サービス1", "主要サービス2"],
      "target_segments": ["ターゲット1", "ターゲット2"],
      "mitsubishi_advantage_over": ["優位性1", "優位性2"]
    }
  ],
  "indirect_competitors": [
    {
      "name": "間接競合名",
      "strengths": ["強み1"],
      "weaknesses": ["弱み1"],
      "key_offerings": ["代替サービス"],
      "target_segments": ["ターゲット"],
      "mitsubishi_advantage_over": ["優位性"]
    }
  ],
  "market_positioning": {
    "our_position": "市場での位置づけ説明",
    "differentiation_factors": ["差別化要因1", "差別化要因2"],
    "competitive_advantages": ["競合優位性1", "競合優位性2"],
    "potential_weaknesses": ["潜在的弱み1", "潜在的弱み2"]
  },
  "market_concentration": "fragmented/moderate/concentrated",
  "barriers_to_entry": ["参入障壁1", "参入障壁2"],
  "threat_level": "low/medium/high"
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const result = this.parseJSONResponse(response.content as string, 'competitive analysis');
    
    return {
      direct_competitors: result?.direct_competitors || [],
      indirect_competitors: result?.indirect_competitors || [],
      market_positioning: result?.market_positioning || {
        our_position: '分析不可',
        differentiation_factors: [],
        competitive_advantages: [],
        potential_weaknesses: []
      },
      market_concentration: result?.market_concentration || 'moderate',
      barriers_to_entry: result?.barriers_to_entry || [],
      threat_level: result?.threat_level || 'medium'
    };
  }

  /**
   * 競合企業検索
   */
  private async searchCompetitors(businessIdea: BusinessIdea): Promise<any> {
    const competitorQueries = [
      `${businessIdea.title} 競合 競合他社 日本`,
      `${businessIdea.solution} 提供企業 サービス比較`,
      `${businessIdea.target_market} 主要プレイヤー 企業一覧`,
      `${businessIdea.title} 類似サービス 代替案`
    ];

    const competitorResults = [];
    for (const query of competitorQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          competitorResults.push({
            query,
            results: result.organic.slice(0, 4)
          });
        }
      } catch (error) {
        console.error(`Competitor search failed: ${query}`, error);
      }
    }

    return competitorResults;
  }

  /**
   * リスク評価
   */
  private async conductRiskAssessment(businessIdea: BusinessIdea): Promise<RiskAssessment> {
    const riskPrompt = `以下のビジネスアイデアの包括的なリスク評価を実施してください。

ビジネスアイデア:
- タイトル: ${businessIdea.title}
- 問題: ${businessIdea.problem_statement}
- ソリューション: ${businessIdea.solution}
- ターゲット市場: ${businessIdea.target_market}
- ビジネスモデル: ${businessIdea.business_model}

以下のリスクカテゴリーで評価してください:
1. 市場リスク（需要変動、市場成長鈍化等）
2. 技術リスク（技術的実現性、技術革新等）
3. 競合リスク（新規参入、価格競争等）
4. 財務リスク（資金調達、収益性等）
5. 規制リスク（法規制変更、コンプライアンス等）
6. 運営リスク（人材確保、オペレーション等）

各リスクの確率（low/medium/high）と影響度（low/medium/high）を評価し、
リスクスコア（1-9）と軽減策を提案してください。

以下のJSON形式で回答:
{
  "market_risks": [
    {
      "risk_name": "リスク名",
      "description": "詳細説明",
      "probability": "low/medium/high",
      "impact": "low/medium/high", 
      "risk_score": 数値(1-9),
      "timeframe": "期間"
    }
  ],
  "technology_risks": [...],
  "competitive_risks": [...],
  "financial_risks": [...],
  "regulatory_risks": [...],
  "operational_risks": [...],
  "overall_risk_score": 数値(1-10),
  "mitigation_strategies": [
    {
      "risk_addressed": "対象リスク",
      "strategy": "軽減策",
      "implementation_timeline": "実装期間",
      "responsible_party": "責任者", 
      "success_metrics": ["成功指標1", "成功指標2"]
    }
  ]
}`;

    const response = await this.llm.invoke(riskPrompt);
    const result = this.parseJSONResponse(response.content as string, 'risk assessment');
    
    return {
      market_risks: result?.market_risks || [],
      technology_risks: result?.technology_risks || [],
      competitive_risks: result?.competitive_risks || [],
      financial_risks: result?.financial_risks || [],
      regulatory_risks: result?.regulatory_risks || [],
      operational_risks: result?.operational_risks || [],
      overall_risk_score: result?.overall_risk_score || 5,
      mitigation_strategies: result?.mitigation_strategies || []
    };
  }

  /**
   * 財務予測生成
   */
  private async generateFinancialProjections(
    businessIdea: BusinessIdea,
    marketAnalysis: MarketSizeAnalysis
  ): Promise<FinancialProjections> {
    const financialPrompt = `以下の情報に基づいて財務予測を作成してください。

ビジネスアイデア:
- タイトル: ${businessIdea.title}
- ビジネスモデル: ${businessIdea.business_model}
- ターゲット市場: ${businessIdea.target_market}

市場分析結果:
- TAM: ${marketAnalysis.tam.value}${marketAnalysis.tam.unit}
- SAM: ${marketAnalysis.sam.value}${marketAnalysis.sam.unit}
- SOM: ${marketAnalysis.som.value}${marketAnalysis.som.unit}
- 市場成長率: ${marketAnalysis.market_growth_rate}

以下の前提条件を使用:
- 市場浸透率: ${this.config.financial_assumptions.default_market_penetration * 100}%
- 割引率: ${this.config.financial_assumptions.discount_rate * 100}%

5年間の財務予測を作成してください。

以下のJSON形式で回答:
{
  "revenue_projections": {
    "year_1": 数値（百万円）,
    "year_2": 数値（百万円）,
    "year_3": 数値（百万円）,
    "year_5": 数値（百万円）,
    "assumptions": ["前提条件1", "前提条件2", "..."]
  },
  "cost_structure": {
    "initial_investment": 数値（百万円）,
    "operating_costs_annual": 数値（百万円）,
    "major_cost_categories": {
      "人件費": 数値,
      "マーケティング": 数値,
      "技術開発": 数値,
      "運営費": 数値
    }
  },
  "profitability": {
    "break_even_point": "期間",
    "gross_margin": 数値（0-1）,
    "net_margin_projections": {
      "year_1": 数値（0-1）,
      "year_2": 数値（0-1）,
      "year_3": 数値（0-1）
    }
  },
  "funding_requirements": {
    "total_funding_needed": 数値（百万円）,
    "funding_stages": [
      {
        "stage": "ステージ名",
        "amount": 数値（百万円）,
        "timeline": "期間", 
        "use_of_funds": ["用途1", "用途2"]
      }
    ]
  },
  "roi_analysis": {
    "expected_roi": 数値（0-1）,
    "payback_period": "期間",
    "sensitivity_analysis": ["感度要因1", "感度要因2"]
  }
}`;

    const response = await this.llm.invoke(financialPrompt);
    const result = this.parseJSONResponse(response.content as string, 'financial projections');
    
    return {
      revenue_projections: result?.revenue_projections || {
        year_1: 0,
        year_2: 0,
        year_3: 0,
        year_5: 0,
        assumptions: []
      },
      cost_structure: result?.cost_structure || {
        initial_investment: 0,
        operating_costs_annual: 0,
        major_cost_categories: {}
      },
      profitability: result?.profitability || {
        break_even_point: '不明',
        gross_margin: 0,
        net_margin_projections: { year_1: 0, year_2: 0, year_3: 0 }
      },
      funding_requirements: result?.funding_requirements || {
        total_funding_needed: 0,
        funding_stages: []
      },
      roi_analysis: result?.roi_analysis || {
        expected_roi: 0,
        payback_period: '不明',
        sensitivity_analysis: []
      }
    };
  }

  /**
   * 戦略提案生成
   */
  private async generateStrategicRecommendations(
    businessIdea: BusinessIdea,
    marketAnalysis: MarketSizeAnalysis,
    competitiveAnalysis: CompetitiveAnalysis,
    riskAssessment: RiskAssessment
  ): Promise<string[]> {
    const strategyPrompt = `以下の分析結果に基づいて、三菱地所としての戦略提案を3-5個作成してください。

ビジネスアイデア: ${businessIdea.title}
三菱地所シナジー: ${businessIdea.mitsubishi_synergy}

分析結果:
- TAM: ${marketAnalysis.tam.value}${marketAnalysis.tam.unit}
- 市場成熟度: ${marketAnalysis.market_maturity}
- 競合脅威レベル: ${competitiveAnalysis.threat_level}
- 全体リスクスコア: ${riskAssessment.overall_risk_score}/10

三菱地所の強みを活かした具体的で実行可能な戦略を提案してください。
各提案は1-2文で簡潔に記述してください。

戦略提案:`;

    const response = await this.llm.invoke(strategyPrompt);
    const content = response.content as string;
    
    // Extract bullet points or numbered items
    const strategies = content
      .split('\n')
      .filter(line => line.trim().match(/^[1-9\-\*•]/))
      .map(line => line.replace(/^[1-9\-\*•]\s*/, '').trim())
      .filter(line => line.length > 10);
      
    return strategies.slice(0, 5);
  }

  /**
   * 次のステップ生成
   */
  private generateNextSteps(businessIdea: BusinessIdea, riskAssessment: RiskAssessment): string[] {
    const baseSteps = [
      '詳細な事業計画書の作成',
      'ステークホルダーとの協議',
      'プロトタイプ開発の検討'
    ];

    // High risk items require additional steps
    if (riskAssessment.overall_risk_score >= 7) {
      baseSteps.unshift('リスク軽減策の詳細検討');
    }

    // Market-specific steps
    if (businessIdea.target_market.includes('不動産')) {
      baseSteps.push('既存不動産事業との統合検討');
    }

    return baseSteps;
  }

  /**
   * アナリスト注記生成
   */
  private async generateAnalystNotes(
    businessIdea: BusinessIdea,
    marketAnalysis: MarketSizeAnalysis
  ): Promise<string> {
    const notesPrompt = `アナリストとして、以下のビジネスアイデア分析に関する重要な注記を200文字以内で作成してください。

ビジネスアイデア: ${businessIdea.title}
TAM信頼度: ${marketAnalysis.tam.confidence_level}
市場成熟度: ${marketAnalysis.market_maturity}

注意点、制約事項、追加調査が必要な項目等を含めてください。

アナリスト注記:`;

    const response = await this.llm.invoke(notesPrompt);
    return (response.content as string).slice(0, 200);
  }

  /**
   * 分析信頼度の計算
   */
  private calculateAnalysisConfidence(
    marketAnalysis: MarketSizeAnalysis,
    competitiveAnalysis: CompetitiveAnalysis,
    riskAssessment: RiskAssessment
  ): number {
    let confidence = 5; // Base confidence

    // Market analysis confidence
    if (marketAnalysis.tam.confidence_level === 'high') confidence += 2;
    else if (marketAnalysis.tam.confidence_level === 'medium') confidence += 1;

    // Competitive analysis confidence
    if (competitiveAnalysis.direct_competitors.length >= 3) confidence += 1;
    if (competitiveAnalysis.market_positioning.competitive_advantages.length >= 2) confidence += 1;

    // Risk assessment confidence  
    if (riskAssessment.mitigation_strategies.length >= 3) confidence += 1;

    return Math.min(confidence, 10);
  }

  /**
   * JSONレスポンスのパース
   */
  private parseJSONResponse(content: string, context: string): any {
    try {
      // Extract JSON from markdown code blocks or plain text
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
      }
    } catch (error) {
      console.error(`JSON parsing failed for ${context}:`, error);
    }
    
    return null;
  }

  /**
   * 研究要請の生成（Researcher連携用）
   */
  generateResearchRequest(
    businessIdea: BusinessIdea,
    requestType: 'market_data' | 'competitor_info' | 'industry_trends' | 'regulatory_info' | 'customer_insights',
    specificQuery: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): ResearchRequest {
    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requested_by: 'analyst',
      request_type: requestType,
      specific_query: specificQuery,
      context: `Analysis for business idea: ${businessIdea.title}`,
      priority,
      expected_data_format: 'structured_json',
      business_idea_id: businessIdea.id,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
}