/**
 * Enhanced Researcher Agent for Targeted Market Research
 * ターゲット市場調査のための強化されたResearcherエージェント
 */

import { ChatOpenAI } from '@langchain/openai';
import { ResearchRequest, ResearchResponse } from './types';
import { BusinessIdea } from '../ideation/types';

export class EnhancedResearcherAgent {
  private llm: ChatOpenAI;
  private serperApiKey: string;
  private timeout: number;

  constructor(
    llm: ChatOpenAI,
    serperApiKey: string,
    timeout: number = 180000 // 3 minutes for targeted research
  ) {
    this.llm = llm;
    this.serperApiKey = serperApiKey;
    this.timeout = timeout;
  }

  /**
   * 研究リクエストの実行
   */
  async executeResearchRequest(request: ResearchRequest): Promise<ResearchResponse> {
    const startTime = Date.now();
    
    try {
      let data: any;
      let sources: string[] = [];
      let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
      let limitations: string[] = [];

      switch (request.request_type) {
        case 'market_data':
          const marketData = await this.conductMarketDataResearch(request);
          data = marketData.data;
          sources = marketData.sources;
          confidenceLevel = marketData.confidence;
          limitations = marketData.limitations;
          break;

        case 'competitor_info':
          const competitorData = await this.conductCompetitorResearch(request);
          data = competitorData.data;
          sources = competitorData.sources;
          confidenceLevel = competitorData.confidence;
          limitations = competitorData.limitations;
          break;

        case 'industry_trends':
          const trendsData = await this.conductIndustryTrendsResearch(request);
          data = trendsData.data;
          sources = trendsData.sources;
          confidenceLevel = trendsData.confidence;
          limitations = trendsData.limitations;
          break;

        case 'regulatory_info':
          const regulatoryData = await this.conductRegulatoryResearch(request);
          data = regulatoryData.data;
          sources = regulatoryData.sources;
          confidenceLevel = regulatoryData.confidence;
          limitations = regulatoryData.limitations;
          break;

        case 'customer_insights':
          const customerData = await this.conductCustomerInsightsResearch(request);
          data = customerData.data;
          sources = customerData.sources;
          confidenceLevel = customerData.confidence;
          limitations = customerData.limitations;
          break;

        default:
          throw new Error(`Unsupported research type: ${request.request_type}`);
      }

      return {
        request_id: request.id,
        data,
        confidence_level: confidenceLevel,
        sources,
        limitations,
        additional_insights: await this.generateAdditionalInsights(request, data),
        completed_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Research request failed: ${request.id}`, error);
      
      return {
        request_id: request.id,
        data: {
          error: 'Research failed',
          details: error instanceof Error ? error.message : String(error)
        },
        confidence_level: 'low',
        sources: [],
        limitations: ['Research execution failed'],
        completed_at: new Date().toISOString()
      };
    }
  }

  /**
   * 市場データ調査
   */
  private async conductMarketDataResearch(request: ResearchRequest): Promise<{
    data: any;
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    limitations: string[];
  }> {
    // 政府統計データを優先的に検索
    const govSearchQueries = [
      `${request.specific_query} 統計 政府 site:stat.go.jp`,
      `${request.specific_query} 経済センサス site:e-stat.go.jp`,
      `${request.specific_query} 総務省統計 経済産業省`,
      `${request.specific_query} 市場規模 調査レポート`
    ];

    const searchResults = [];
    const sources: string[] = [];

    for (const query of govSearchQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 3)
          });
          
          // Collect sources
          result.organic.slice(0, 3).forEach((item: any) => {
            if (item.link && !sources.includes(item.link)) {
              sources.push(item.link);
            }
          });
        }
      } catch (error) {
        console.error(`Market data search failed for: ${query}`, error);
      }
    }

    // AI分析で構造化データに変換
    const analysisPrompt = `以下の検索結果から市場データを抽出し、構造化してください。

調査クエリ: ${request.specific_query}
コンテキスト: ${request.context}

検索結果:
${JSON.stringify(searchResults, null, 2)}

以下の形式で市場データを抽出してください:
{
  "market_size": {
    "value": 数値または"不明",
    "unit": "単位",
    "year": "対象年",
    "source": "データソース"
  },
  "growth_rate": {
    "annual_rate": 数値または"不明",
    "forecast_period": "予測期間",
    "source": "データソース"
  },
  "market_segments": [
    {
      "segment_name": "セグメント名",
      "size_or_share": "規模または割合",
      "characteristics": "特徴"
    }
  ],
  "key_players": ["主要企業1", "主要企業2"],
  "market_trends": ["トレンド1", "トレンド2"],
  "data_reliability": "high/medium/low",
  "data_limitations": ["制約1", "制約2"]
}

政府統計データを優先し、信頼性の高い情報源からのデータを抽出してください。`;

    const response = await this.llm.invoke(analysisPrompt);
    const data = this.parseJSONResponse(response.content as string, 'market data');

    return {
      data: data || { error: 'Failed to extract market data' },
      sources,
      confidence: data?.data_reliability === 'high' ? 'high' : 
                 data?.data_reliability === 'medium' ? 'medium' : 'low',
      limitations: data?.data_limitations || ['Limited data availability']
    };
  }

  /**
   * 競合情報調査
   */
  private async conductCompetitorResearch(request: ResearchRequest): Promise<{
    data: any;
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    limitations: string[];
  }> {
    const competitorQueries = [
      `${request.specific_query} 企業情報 会社概要`,
      `${request.specific_query} サービス内容 事業内容`,
      `${request.specific_query} 売上 業績 IR情報`,
      `${request.specific_query} 競合比較 市場シェア`
    ];

    const searchResults = [];
    const sources: string[] = [];

    for (const query of competitorQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 4)
          });
          
          result.organic.slice(0, 4).forEach((item: any) => {
            if (item.link && !sources.includes(item.link)) {
              sources.push(item.link);
            }
          });
        }
      } catch (error) {
        console.error(`Competitor search failed for: ${query}`, error);
      }
    }

    const analysisPrompt = `以下の検索結果から競合企業情報を抽出し、構造化してください。

調査対象: ${request.specific_query}
コンテキスト: ${request.context}

検索結果:
${JSON.stringify(searchResults, null, 2)}

以下の形式で競合情報を抽出してください:
{
  "company_profiles": [
    {
      "company_name": "企業名",
      "business_model": "ビジネスモデル",
      "key_services": ["主要サービス1", "主要サービス2"],
      "target_market": "ターゲット市場",
      "revenue": "売上情報（判明する場合）",
      "market_position": "市場ポジション",
      "strengths": ["強み1", "強み2"],
      "recent_developments": ["最近の動向1", "最近の動向2"]
    }
  ],
  "market_dynamics": {
    "competition_level": "high/medium/low",
    "key_success_factors": ["成功要因1", "成功要因2"],
    "market_gaps": ["市場ギャップ1", "市場ギャップ2"]
  },
  "mitsubishi_opportunities": ["三菱地所の機会1", "三菱地所の機会2"],
  "data_completeness": "high/medium/low",
  "information_gaps": ["情報ギャップ1", "情報ギャップ2"]
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const data = this.parseJSONResponse(response.content as string, 'competitor data');

    return {
      data: data || { error: 'Failed to extract competitor data' },
      sources,
      confidence: data?.data_completeness === 'high' ? 'high' : 
                 data?.data_completeness === 'medium' ? 'medium' : 'low',
      limitations: data?.information_gaps || ['Limited competitive intelligence']
    };
  }

  /**
   * 業界トレンド調査
   */
  private async conductIndustryTrendsResearch(request: ResearchRequest): Promise<{
    data: any;
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    limitations: string[];
  }> {
    const trendQueries = [
      `${request.specific_query} 業界動向 トレンド 2024 2025`,
      `${request.specific_query} 技術革新 イノベーション`,
      `${request.specific_query} 市場予測 将来展望`,
      `${request.specific_query} 業界レポート 調査会社`
    ];

    const searchResults = [];
    const sources: string[] = [];

    for (const query of trendQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 3)
          });
          
          result.organic.slice(0, 3).forEach((item: any) => {
            if (item.link && !sources.includes(item.link)) {
              sources.push(item.link);
            }
          });
        }
      } catch (error) {
        console.error(`Trends search failed for: ${query}`, error);
      }
    }

    const analysisPrompt = `以下の検索結果から業界トレンドを抽出し、構造化してください。

調査テーマ: ${request.specific_query}
コンテキスト: ${request.context}

検索結果:
${JSON.stringify(searchResults, null, 2)}

以下の形式でトレンド情報を抽出してください:
{
  "current_trends": [
    {
      "trend_name": "トレンド名",
      "description": "詳細説明",
      "impact_level": "high/medium/low",
      "timeline": "期間",
      "key_drivers": ["要因1", "要因2"]
    }
  ],
  "emerging_technologies": [
    {
      "technology": "技術名",
      "maturity_level": "実証段階/商用化段階/成熟段階",
      "business_impact": "ビジネス影響",
      "adoption_timeline": "普及予測"
    }
  ],
  "market_shifts": [
    {
      "shift_description": "変化の説明",
      "implications": "含意",
      "opportunities": "機会"
    }
  ],
  "future_outlook": {
    "3_year_prediction": "3年後の予測",
    "5_year_prediction": "5年後の予測",
    "key_uncertainties": ["不確実性1", "不確実性2"]
  },
  "information_quality": "high/medium/low"
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const data = this.parseJSONResponse(response.content as string, 'industry trends');

    return {
      data: data || { error: 'Failed to extract trend data' },
      sources,
      confidence: data?.information_quality === 'high' ? 'high' : 
                 data?.information_quality === 'medium' ? 'medium' : 'low',
      limitations: ['Trend predictions inherently uncertain', 'Limited future visibility']
    };
  }

  /**
   * 規制情報調査
   */
  private async conductRegulatoryResearch(request: ResearchRequest): Promise<{
    data: any;
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    limitations: string[];
  }> {
    const regulatoryQueries = [
      `${request.specific_query} 規制 法律 site:gov.go.jp`,
      `${request.specific_query} ガイドライン 指針 官庁`,
      `${request.specific_query} コンプライアンス 法的要件`,
      `${request.specific_query} 許認可 免許 届出`
    ];

    const searchResults = [];
    const sources: string[] = [];

    for (const query of regulatoryQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 3)
          });
          
          result.organic.slice(0, 3).forEach((item: any) => {
            if (item.link && !sources.includes(item.link)) {
              sources.push(item.link);
            }
          });
        }
      } catch (error) {
        console.error(`Regulatory search failed for: ${query}`, error);
      }
    }

    const analysisPrompt = `以下の検索結果から規制・法的要件を抽出し、構造化してください。

調査対象: ${request.specific_query}
コンテキスト: ${request.context}

検索結果:
${JSON.stringify(searchResults, null, 2)}

以下の形式で規制情報を抽出してください:
{
  "applicable_laws": [
    {
      "law_name": "法律名",
      "relevant_provisions": "関連条項",
      "compliance_requirements": "コンプライアンス要件",
      "penalties": "罰則"
    }
  ],
  "required_licenses": [
    {
      "license_type": "許認可の種類",
      "issuing_authority": "許可官庁",
      "requirements": "取得要件",
      "validity_period": "有効期間"
    }
  ],
  "regulatory_trends": [
    {
      "trend": "規制動向",
      "expected_changes": "予想される変更",
      "timeline": "時期",
      "business_impact": "事業影響"
    }
  ],
  "compliance_risks": [
    {
      "risk": "コンプライアンスリスク",
      "mitigation": "対策",
      "monitoring_requirements": "モニタリング要件"
    }
  ],
  "regulatory_certainty": "high/medium/low"
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const data = this.parseJSONResponse(response.content as string, 'regulatory data');

    return {
      data: data || { error: 'Failed to extract regulatory data' },
      sources,
      confidence: data?.regulatory_certainty === 'high' ? 'high' : 
                 data?.regulatory_certainty === 'medium' ? 'medium' : 'low',
      limitations: ['Regulatory landscape can change', 'Legal interpretation may vary']
    };
  }

  /**
   * 顧客インサイト調査
   */
  private async conductCustomerInsightsResearch(request: ResearchRequest): Promise<{
    data: any;
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    limitations: string[];
  }> {
    const customerQueries = [
      `${request.specific_query} 顧客ニーズ 消費者動向`,
      `${request.specific_query} ユーザー調査 アンケート`,
      `${request.specific_query} 購買行動 利用実態`,
      `${request.specific_query} 満足度 課題 改善要望`
    ];

    const searchResults = [];
    const sources: string[] = [];

    for (const query of customerQueries) {
      try {
        const result = await this.performWebSearch(query);
        if (result && result.organic) {
          searchResults.push({
            query,
            results: result.organic.slice(0, 3)
          });
          
          result.organic.slice(0, 3).forEach((item: any) => {
            if (item.link && !sources.includes(item.link)) {
              sources.push(item.link);
            }
          });
        }
      } catch (error) {
        console.error(`Customer insights search failed for: ${query}`, error);
      }
    }

    const analysisPrompt = `以下の検索結果から顧客インサイトを抽出し、構造化してください。

調査対象: ${request.specific_query}
コンテキスト: ${request.context}

検索結果:
${JSON.stringify(searchResults, null, 2)}

以下の形式で顧客インサイトを抽出してください:
{
  "customer_segments": [
    {
      "segment_name": "セグメント名",
      "demographics": "デモグラフィック",
      "needs": ["ニーズ1", "ニーズ2"],
      "pain_points": ["課題1", "課題2"],
      "behaviors": ["行動パターン1", "行動パターン2"]
    }
  ],
  "unmet_needs": [
    {
      "need": "未充足ニーズ",
      "importance": "high/medium/low",
      "current_alternatives": "現在の代替手段",
      "opportunity_size": "機会の大きさ"
    }
  ],
  "customer_journey": [
    {
      "stage": "段階",
      "touchpoints": ["接点1", "接点2"],
      "emotions": "感情",
      "friction_points": ["摩擦点1", "摩擦点2"]
    }
  ],
  "preferences": {
    "preferred_channels": ["チャネル1", "チャネル2"],
    "decision_factors": ["決定要因1", "決定要因2"],
    "price_sensitivity": "high/medium/low"
  },
  "insights_quality": "high/medium/low"
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const data = this.parseJSONResponse(response.content as string, 'customer insights');

    return {
      data: data || { error: 'Failed to extract customer insights' },
      sources,
      confidence: data?.insights_quality === 'high' ? 'high' : 
                 data?.insights_quality === 'medium' ? 'medium' : 'low',
      limitations: ['Customer research based on public information', 'May not reflect latest preferences']
    };
  }

  /**
   * 追加インサイトの生成
   */
  private async generateAdditionalInsights(
    request: ResearchRequest,
    data: any
  ): Promise<string[]> {
    const insightsPrompt = `以下の調査結果から、3つの追加的なインサイトや示唆を抽出してください。

調査タイプ: ${request.request_type}
調査内容: ${request.specific_query}

調査結果:
${JSON.stringify(data, null, 2)}

ビジネス戦略や意思決定に役立つ洞察を簡潔に提示してください。
各インサイトは1-2文で記述してください。

追加インサイト:`;

    const response = await this.llm.invoke(insightsPrompt);
    const content = response.content as string;
    
    const insights = content
      .split('\n')
      .filter(line => line.trim().match(/^[1-9\-\*•]/))
      .map(line => line.replace(/^[1-9\-\*•]\s*/, '').trim())
      .filter(line => line.length > 10);
      
    return insights.slice(0, 3);
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
   * JSONレスポンスのパース
   */
  private parseJSONResponse(content: string, context: string): any {
    try {
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
}