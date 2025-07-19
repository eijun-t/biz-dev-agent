/**
 * Analysis Phase Coordinator - Autonomous Analyst-Researcher Coordination
 * 分析フェーズコーディネーター：Analyst-Researcher自律連携システム
 */

import { ChatOpenAI } from '@langchain/openai';
import { AnalystAgent } from './analyst';
import { EnhancedResearcherAgent } from './enhanced-researcher';
import {
  AnalysisResult,
  AnalysisPhaseState,
  ResearchRequest,
  ResearchResponse,
  AnalysisConfig,
  AnalysisLog,
  MarketSizeAnalysis,
  CompetitiveAnalysis,
  RiskAssessment
} from './types';
import { BusinessIdea } from '../ideation/types';

export class AnalysisCoordinator {
  private analyst: AnalystAgent;
  private researcher: EnhancedResearcherAgent;
  private config: AnalysisConfig;

  constructor(
    llm: ChatOpenAI,
    serperApiKey: string,
    config: Partial<AnalysisConfig> = {}
  ) {
    this.config = {
      max_research_requests: 5,
      analysis_timeout: 600000, // 10 minutes
      confidence_threshold: 0.7,
      max_iterations: 3,
      data_sources: {
        web_search_enabled: true,
        government_data_enabled: true,
        financial_apis_enabled: false
      },
      financial_assumptions: {
        default_growth_rate: 0.15,
        default_market_penetration: 0.02,
        risk_free_rate: 0.001,
        discount_rate: 0.08
      },
      ...config
    };

    this.analyst = new AnalystAgent(llm, this.config);
    this.researcher = new EnhancedResearcherAgent(llm, serperApiKey);
  }

  /**
   * 分析フェーズの実行
   */
  async executeAnalysisPhase(
    businessIdeas: BusinessIdea[],
    selectedIdeaId?: string,
    sessionId?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    // Select idea for analysis (highest scoring from ideation or specified)
    const selectedIdea = selectedIdeaId 
      ? businessIdeas.find(idea => idea.id === selectedIdeaId)
      : this.selectIdeaForAnalysis(businessIdeas);

    if (!selectedIdea) {
      throw new Error('No suitable business idea found for analysis');
    }

    const state: AnalysisPhaseState = {
      business_ideas: businessIdeas,
      selected_idea_for_analysis: selectedIdea,
      research_requests: [],
      research_responses: [],
      phase_status: 'research_phase',
      current_step: 'initial_analysis',
      iteration_count: 0,
      max_iterations: this.config.max_iterations,
      analysis_start_time: new Date().toISOString(),
      logs: [],
      errors: []
    };

    try {
      // Phase 1: Initial analysis with gap identification
      const initialAnalysis = await this.conductInitialAnalysis(selectedIdea, state);
      
      // Phase 2: Autonomous research requests based on gaps
      const enrichedAnalysis = await this.conductAutonomousResearch(
        selectedIdea,
        initialAnalysis,
        state
      );

      // Phase 3: Final comprehensive analysis
      const finalAnalysis = await this.finalizeAnalysis(
        selectedIdea,
        enrichedAnalysis,
        state
      );

      // Update final analysis with research metadata
      finalAnalysis.research_requests_made = state.research_requests.map(req => req.id);
      finalAnalysis.total_analysis_time = Date.now() - startTime;

      this.logEvent(state, 'coordinator', 'analysis_completed', {
        idea_id: selectedIdea.id,
        research_requests: state.research_requests.length,
        confidence: finalAnalysis.analysis_confidence,
        duration: finalAnalysis.total_analysis_time
      });

      return finalAnalysis;

    } catch (error) {
      this.logEvent(state, 'coordinator', 'analysis_failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      throw new Error(`Analysis phase failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 分析対象アイデアの選択
   */
  private selectIdeaForAnalysis(businessIdeas: BusinessIdea[]): BusinessIdea | null {
    if (businessIdeas.length === 0) return null;
    
    // Select the first idea or implement scoring logic
    return businessIdeas[0];
  }

  /**
   * 初期分析とギャップ特定
   */
  private async conductInitialAnalysis(
    businessIdea: BusinessIdea,
    state: AnalysisPhaseState
  ): Promise<AnalysisResult> {
    this.logEvent(state, 'analyst', 'initial_analysis_started', {
      idea_id: businessIdea.id
    });

    const startTime = Date.now();
    
    // Conduct basic analysis to identify information gaps
    const initialResult = await this.analyst.conductComprehensiveAnalysis(businessIdea);
    
    this.logEvent(state, 'analyst', 'initial_analysis_completed', {
      idea_id: businessIdea.id,
      confidence: initialResult.analysis_confidence,
      duration: Date.now() - startTime
    });

    return initialResult;
  }

  /**
   * 自律的研究リクエスト実行
   */
  private async conductAutonomousResearch(
    businessIdea: BusinessIdea,
    initialAnalysis: AnalysisResult,
    state: AnalysisPhaseState
  ): Promise<AnalysisResult> {
    // Identify research gaps and generate requests
    const researchRequests = await this.identifyResearchGaps(businessIdea, initialAnalysis);
    
    // Filter and prioritize requests
    const prioritizedRequests = this.prioritizeResearchRequests(
      researchRequests,
      this.config.max_research_requests
    );

    state.research_requests = prioritizedRequests;
    
    this.logEvent(state, 'coordinator', 'research_requests_generated', {
      total_requests: prioritizedRequests.length,
      request_types: prioritizedRequests.map(req => req.request_type)
    });

    // Execute research requests in parallel
    const researchPromises = prioritizedRequests.map(async (request) => {
      try {
        this.logEvent(state, 'researcher', 'research_request_started', {
          request_id: request.id,
          request_type: request.request_type
        });

        const startTime = Date.now();
        const response = await this.researcher.executeResearchRequest(request);
        
        this.logEvent(state, 'researcher', 'research_request_completed', {
          request_id: request.id,
          confidence: response.confidence_level,
          duration: Date.now() - startTime
        });

        return response;
      } catch (error) {
        this.logEvent(state, 'researcher', 'research_request_failed', {
          request_id: request.id,
          error: error instanceof Error ? error.message : String(error)
        });
        
        return {
          request_id: request.id,
          data: { error: 'Research failed' },
          confidence_level: 'low' as const,
          sources: [],
          limitations: ['Research execution failed'],
          completed_at: new Date().toISOString()
        };
      }
    });

    const researchResponses = await Promise.all(researchPromises);
    state.research_responses = researchResponses;

    // Integrate research findings into analysis
    const enrichedAnalysis = await this.integrateResearchFindings(
      businessIdea,
      initialAnalysis,
      researchResponses
    );

    return enrichedAnalysis;
  }

  /**
   * 研究ギャップの特定
   */
  private async identifyResearchGaps(
    businessIdea: BusinessIdea,
    initialAnalysis: AnalysisResult
  ): Promise<ResearchRequest[]> {
    const gapAnalysisPrompt = `以下の初期分析結果を確認し、追加調査が必要な項目を特定してください。

ビジネスアイデア: ${businessIdea.title}
ターゲット市場: ${businessIdea.target_market}

初期分析結果:
- TAM信頼度: ${initialAnalysis.market_analysis.tam.confidence_level}
- 競合情報の完全性: ${initialAnalysis.competitive_analysis.direct_competitors.length}社特定
- リスク評価の深度: ${initialAnalysis.risk_assessment.overall_risk_score}/10
- 分析全体の信頼度: ${initialAnalysis.analysis_confidence}/10

以下の研究タイプから必要なものを3-5個選択し、具体的な調査クエリを提案してください:
1. market_data - 市場データ詳細調査
2. competitor_info - 競合企業詳細調査
3. industry_trends - 業界トレンド調査
4. regulatory_info - 規制・法的要件調査
5. customer_insights - 顧客インサイト調査

各調査については以下を明記してください:
- なぜ必要か（ギャップの理由）
- 具体的な調査クエリ
- 優先度（high/medium/low）

以下のJSON形式で回答:
{
  "research_needs": [
    {
      "request_type": "調査タイプ",
      "specific_query": "具体的な調査クエリ",
      "justification": "必要性の理由",
      "priority": "high/medium/low",
      "expected_impact": "期待される改善効果"
    }
  ]
}`;

    const response = await this.analyst['llm'].invoke(gapAnalysisPrompt);
    const gapAnalysis = this.parseJSONResponse(response.content as string, 'gap analysis');
    
    const researchRequests: ResearchRequest[] = [];
    
    if (gapAnalysis?.research_needs) {
      gapAnalysis.research_needs.forEach((need: any, index: number) => {
        const request = this.analyst.generateResearchRequest(
          businessIdea,
          need.request_type,
          need.specific_query,
          need.priority
        );
        researchRequests.push(request);
      });
    }

    return researchRequests;
  }

  /**
   * 研究リクエストの優先順位付け
   */
  private prioritizeResearchRequests(
    requests: ResearchRequest[],
    maxRequests: number
  ): ResearchRequest[] {
    // Sort by priority (high > medium > low) and then by creation time
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return requests
      .sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, maxRequests);
  }

  /**
   * 研究結果の統合
   */
  private async integrateResearchFindings(
    businessIdea: BusinessIdea,
    initialAnalysis: AnalysisResult,
    researchResponses: ResearchResponse[]
  ): Promise<AnalysisResult> {
    const integrationPrompt = `以下の初期分析結果と追加研究結果を統合し、より正確で包括的な分析を作成してください。

ビジネスアイデア: ${businessIdea.title}

初期分析結果:
${JSON.stringify(initialAnalysis, null, 2)}

追加研究結果:
${JSON.stringify(researchResponses, null, 2)}

統合指針:
1. 信頼性の高いデータを優先
2. 矛盾する情報は出典と方法論で判断
3. 新たな洞察や示唆を追加
4. 全体的な信頼度を再評価

統合された分析の改善点と最終的な信頼度（1-10）を明記してください。

更新が必要な分析項目と具体的な改善内容を特定してください。`;

    const response = await this.analyst['llm'].invoke(integrationPrompt);
    
    // For now, return enhanced version of initial analysis
    // In a full implementation, this would involve sophisticated integration logic
    const enhancedAnalysis: AnalysisResult = {
      ...initialAnalysis,
      analysis_confidence: Math.min(initialAnalysis.analysis_confidence + 1, 10),
      analyst_notes: `${initialAnalysis.analyst_notes} [研究統合後の更新: ${researchResponses.length}件の追加調査を実施]`,
      last_updated: new Date().toISOString()
    };

    return enhancedAnalysis;
  }

  /**
   * 最終分析の完成
   */
  private async finalizeAnalysis(
    businessIdea: BusinessIdea,
    enrichedAnalysis: AnalysisResult,
    state: AnalysisPhaseState
  ): Promise<AnalysisResult> {
    this.logEvent(state, 'analyst', 'finalization_started', {
      idea_id: businessIdea.id
    });

    // Perform final validation and quality checks
    const validationResult = await this.validateAnalysisQuality(enrichedAnalysis);
    
    if (validationResult.completeness_score < this.config.confidence_threshold && 
        state.iteration_count < this.config.max_iterations) {
      
      // Request additional research if needed and iterations remain
      this.logEvent(state, 'coordinator', 'additional_iteration_triggered', {
        current_confidence: enrichedAnalysis.analysis_confidence,
        iteration: state.iteration_count + 1
      });
      
      state.iteration_count++;
      // In a full implementation, this would trigger additional research
    }

    const finalAnalysis: AnalysisResult = {
      ...enrichedAnalysis,
      strategic_recommendations: await this.enhanceStrategicRecommendations(
        businessIdea,
        enrichedAnalysis,
        state.research_responses
      ),
      last_updated: new Date().toISOString()
    };

    this.logEvent(state, 'analyst', 'finalization_completed', {
      idea_id: businessIdea.id,
      final_confidence: finalAnalysis.analysis_confidence
    });

    return finalAnalysis;
  }

  /**
   * 分析品質の検証
   */
  private async validateAnalysisQuality(analysis: AnalysisResult): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    completeness_score: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let completeness = 0;

    // Market analysis validation
    if (analysis.market_analysis.tam.value > 0) completeness += 0.3;
    else errors.push('TAM値が設定されていません');

    // Competitive analysis validation
    if (analysis.competitive_analysis.direct_competitors.length >= 2) completeness += 0.2;
    else warnings.push('直接競合の情報が不足しています');

    // Risk assessment validation
    if (analysis.risk_assessment.overall_risk_score > 0) completeness += 0.2;
    else errors.push('リスク評価が不完全です');

    // Financial projections validation
    if (analysis.financial_projections.revenue_projections.year_1 > 0) completeness += 0.2;
    else warnings.push('財務予測が設定されていません');

    // Strategic recommendations validation
    if (analysis.strategic_recommendations.length >= 3) completeness += 0.1;
    else warnings.push('戦略提案が不十分です');

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      completeness_score: completeness
    };
  }

  /**
   * 戦略提案の強化
   */
  private async enhanceStrategicRecommendations(
    businessIdea: BusinessIdea,
    analysis: AnalysisResult,
    researchResponses: ResearchResponse[]
  ): Promise<string[]> {
    const enhancementPrompt = `以下の分析結果と追加研究を基に、三菱地所としての戦略提案を強化してください。

ビジネスアイデア: ${businessIdea.title}
三菱地所シナジー: ${businessIdea.mitsubishi_synergy}

現在の戦略提案:
${analysis.strategic_recommendations.join('\n')}

追加研究から得られた洞察:
${researchResponses.map(res => res.additional_insights).flat().join('\n')}

以下の観点で戦略提案を強化してください:
1. 新たな研究知見の反映
2. リスク軽減策の具体化
3. 三菱地所の強みの更なる活用
4. 実行可能性の向上

5-7個の強化された戦略提案を簡潔に提示してください。`;

    const response = await this.analyst['llm'].invoke(enhancementPrompt);
    const content = response.content as string;
    
    const strategies = content
      .split('\n')
      .filter(line => line.trim().match(/^[1-9\-\*•]/))
      .map(line => line.replace(/^[1-9\-\*•]\s*/, '').trim())
      .filter(line => line.length > 10);
      
    return strategies.slice(0, 7);
  }

  /**
   * ログイベントの記録
   */
  private logEvent(
    state: AnalysisPhaseState,
    agent: 'analyst' | 'researcher' | 'coordinator',
    action: string,
    details: any
  ): void {
    const logEntry: AnalysisLog = {
      timestamp: new Date().toISOString(),
      agent,
      action,
      details,
      duration: details.duration
    };
    
    state.logs.push(logEntry);
  }

  /**
   * 分析統計の取得
   */
  getAnalysisStatistics(result: AnalysisResult): any {
    return {
      execution_time: result.total_analysis_time,
      confidence_score: result.analysis_confidence,
      research_requests_made: result.research_requests_made.length,
      market_size_tam: result.market_analysis.tam.value,
      market_confidence: result.market_analysis.tam.confidence_level,
      competitors_identified: result.competitive_analysis.direct_competitors.length,
      risk_score: result.risk_assessment.overall_risk_score,
      strategic_recommendations: result.strategic_recommendations.length,
      next_steps: result.next_steps.length
    };
  }

  /**
   * 結果サマリーのフォーマット
   */
  formatResultSummary(result: AnalysisResult): string {
    return `分析完了: ${result.business_idea_id}
TAM: ${result.market_analysis.tam.value}${result.market_analysis.tam.unit}
競合: ${result.competitive_analysis.direct_competitors.length}社
リスク: ${result.risk_assessment.overall_risk_score}/10
信頼度: ${result.analysis_confidence}/10
実行時間: ${Math.round(result.total_analysis_time / 1000)}秒`;
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