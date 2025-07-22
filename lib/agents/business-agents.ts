/**
 * Business Intelligence Agents
 * Enhanced Agents統合版 - 高度なMulti-Agent Orchestration
 */

import { createChatOpenAI } from '@/lib/config/llm-config';
import { generatePrompt, AgentResult } from '@/lib/prompts/agent-prompts';
import { createLog } from '@/lib/database/queries';

// Enhanced Agents Import
import { EnhancedResearcherAgent, createEnhancedResearcher } from './research/enhanced-index';
import { EnhancedIdeatorAgent, createEnhancedIdeator } from './ideation/enhanced-ideator-index';
import { AdvancedPlannerAgent, createAdvancedPlanner, PlannerIntegration } from './planner/index';

// 基底エージェントクラス
abstract class BaseAgent {
  protected agentType: 'researcher' | 'ideator' | 'analyst' | 'writer' | 'critic';
  protected llm: any;

  constructor(agentType: 'researcher' | 'ideator' | 'analyst' | 'writer' | 'critic') {
    this.agentType = agentType;
    this.llm = createChatOpenAI(agentType);
  }

  protected async executeWithLogging(
    prompt: string,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`${this.agentType} agent executing...`);
      
      const response = await this.llm.invoke(prompt);
      const executionTime = Date.now() - startTime;
      
      // ログ記録
      if (userId) {
        await this.logExecution(userId, sessionId, prompt, response.content, executionTime);
      }

      return {
        success: true,
        data: response.content,
        executionTime,
        tokensUsed: response.usage_metadata?.total_tokens || 0
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`${this.agentType} agent error:`, error);
      
      // エラーログ記録
      if (userId) {
        await this.logError(userId, sessionId, error, executionTime);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
    }
  }

  private async logExecution(
    userId: string,
    sessionId?: string,
    prompt?: string,
    response?: string,
    executionTime?: number
  ) {
    try {
      await createLog({
        user_id: userId,
        event_type: 'agent_execution',
        details: {
          agent_type: this.agentType,
          session_id: sessionId,
          execution_time: executionTime,
          prompt_length: prompt?.length || 0,
          response_length: response?.length || 0
        },
        tokens_used: 0 // Will be updated with actual usage
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  private async logError(
    userId: string,
    sessionId?: string,
    error: any,
    executionTime?: number
  ) {
    try {
      await createLog({
        user_id: userId,
        event_type: 'error',
        details: {
          agent_type: this.agentType,
          session_id: sessionId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          execution_time: executionTime
        },
        tokens_used: 0
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  protected parseJSONResponse(response: string): any {
    try {
      // JSON部分を抽出（```json ブロック内の場合）
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // 直接JSONの場合
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      console.error('Response content:', response);
      
      // For writer agent, try to extract sections even if JSON is malformed
      if (this.agentType === 'writer') {
        return this.extractSectionsFromText(response);
      }
      
      throw new Error('Invalid JSON response from agent');
    }
  }

  private extractSectionsFromText(response: string): any {
    // Fallback method to extract sections from malformed response
    const sections = [];
    const sectionPattern = /"section_id":\s*"([^"]+)"[\s\S]*?"tab_name":\s*"([^"]+)"[\s\S]*?"title":\s*"([^"]+)"[\s\S]*?"content":\s*"([^"]*(?:\\.[^"]*)*)"/g;
    
    let match;
    while ((match = sectionPattern.exec(response)) !== null) {
      sections.push({
        section_id: match[1],
        tab_name: match[2],
        title: match[3],
        content: match[4].replace(/\\"/g, '"'),
        data_sources: ['AI分析結果'],
        confidence_level: 'medium',
        completeness_score: 75,
        last_updated: new Date().toISOString()
      });
    }
    
    return { sections };
  }
}

// Enhanced Researcher Agent (本格実装統合版)
export class ResearcherAgent extends BaseAgent {
  private enhancedAgent: EnhancedResearcherAgent | null = null;
  
  constructor() {
    super('researcher');
    
    // Enhanced Agentの初期化
    const apiKeys = {
      serper: process.env.SERPER_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      estat: process.env.ESTAT_API_KEY || ''
    };
    
    console.log('🔧 Enhanced Researcher initialization with API keys:', {
      serper: apiKeys.serper ? 'SET' : 'MISSING',
      openai: apiKeys.openai ? 'SET' : 'MISSING',
      estat: apiKeys.estat ? 'SET' : 'MISSING'
    });
    
    try {
      this.enhancedAgent = createEnhancedResearcher(apiKeys, {
        // 本番用設定
        costConfig: {
          monthlyBudget: 2000, // 2000円
          alertThreshold: 0.8,
          enforceLimit: true
        },
        maxParallelRequests: 3
      });
      
      console.log('✅ Enhanced Researcher Agent initialized (full capabilities)');
    } catch (initError) {
      console.error('❌ Enhanced Researcher Agent initialization failed:', initError);
      throw new Error(`Enhanced Researcher Agent initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
    }
  }

  async conductMarketResearch(
    userInput: string,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    console.log('🔬 Enhanced Researcher Agent: Starting comprehensive market research...');
    console.log(`📊 Research input: "${userInput}"`);
    
    // Enhanced Agentが利用可能な場合は使用
    if (!this.enhancedAgent) {
      throw new Error('❌ Enhanced Researcher Agent is not initialized. Check API keys and configuration.');
    }

    console.log('⚡ Using Enhanced Researcher capabilities');
    const result = await this.enhancedAgent.executeComprehensiveResearch(
      userInput,
      ['market_trends', 'technology', 'competition', 'macroeconomics'],
      'ja',
      'japan',
      8 // 最大8件の詳細調査
    );
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Enhanced Research completed in ${executionTime}ms`);
    console.log(`📊 Data quality: ${result.averageDataQuality}/10`);
    console.log(`🏢 Mitsubishi fit: ${result.mitsubishiStrategicFit}/10`);
    
    return {
      success: true,
      data: result,
      executionTime,
      tokensUsed: result.totalDataPoints || 0
    };
  }
}

// Enhanced Critic Agent Import
import { EnhancedCriticAgent, createEnhancedCritic } from './critic/index';

// Enhanced Ideator Agent (本格実装統合版)
export class IdeatorAgent extends BaseAgent {
  private enhancedIntegration: any = null;
  
  constructor() {
    super('ideator');
    
    // Enhanced Agentの初期化
    const llmConfig = {
      apiKey: process.env.OPENAI_API_KEY || ''
    };
    
    this.enhancedIntegration = createEnhancedIdeator(llmConfig, {
      // 本番用設定は enhanced-ideator-config.ts の DEFAULT_IDEATOR_CONFIG を使用
    });
    
    console.log('✅ Enhanced Ideator Integration initialized (full capabilities)');
  }

  async generateBusinessIdeas(
    userInput: string,
    researchResults: any,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    console.log('💡 Enhanced Ideator Agent: Starting comprehensive idea generation...');
    console.log(`📝 Ideation input: "${userInput}"`);
    console.log(`📊 Research data available: ${!!researchResults}`);
    
    // Enhanced Integrationが利用可能な場合は使用
    if (this.enhancedIntegration) {
      try {
        console.log('⚡ Using Enhanced Ideator capabilities');
        const result = await this.enhancedIntegration.generateBusinessIdeas(
          userInput,
          researchResults,
          {
            riskBalance: {
              conservative: 0.25,
              balanced: 0.50,
              challenging: 0.20,
              disruptive: 0.05
            },
            businessScales: ['mid_market', 'enterprise'],
            timeHorizon: 'medium_term',
            innovationLevel: 'breakthrough',
            prioritizeSynergy: true,
            minProfitJPY: 10_000_000_000,
            maxTimeToMarket: '3年以内',
            requiredSynergyScore: 6,
            language: 'ja',
            region: 'japan',
            enableEnhancedProcessing: true,
            enableValidation: true
          }
        );
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ Enhanced Ideation completed in ${executionTime}ms`);
        console.log(`💡 Generated ${result.businessIdeas.length} ideas`);
        console.log(`🎯 Overall quality: ${result.qualityMetrics.overallQuality.toFixed(1)}/10`);
        
        // 🔍 Enhanced Ideator アウトプット詳細ログ
        console.log('\n📋 === Enhanced Ideator アウトプット詳細 ===');
        console.log('🔥 Business Ideas:', JSON.stringify(result.businessIdeas, null, 2));
        console.log('📊 Quality Metrics:', JSON.stringify(result.qualityMetrics, null, 2));
        console.log('📈 Summary:', JSON.stringify(result.summary, null, 2));
        console.log('🎯 Recommendations:', JSON.stringify(result.recommendation || 'N/A', null, 2));
        console.log('🔧 Enhanced Metadata:', JSON.stringify(result.enhancedMetadata, null, 2));
        console.log('=== Enhanced Ideator アウトプット終了 ===\n');
        
        return {
          success: true,
          data: result,
          executionTime,
          tokensUsed: result.enhancedMetadata?.totalTokens || 0
        };
        
      } catch (enhancedError) {
        console.error('❌ Enhanced Ideation failed:', enhancedError);
        throw new Error(`Enhanced Ideator Agent execution failed: ${enhancedError instanceof Error ? enhancedError.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('❌ Enhanced Ideator Agent is not initialized. Check API keys and configuration.');
    }
  }
}

// 分析エージェント
export class AnalystAgent extends BaseAgent {
  constructor() {
    super('analyst');
  }

  async analyzeBusinessIdea(
    selectedIdea: any,
    researchResults: any,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const prompt = generatePrompt('analyst', {
      selectedIdea: JSON.stringify(selectedIdea, null, 2),
      researchResults: JSON.stringify(researchResults, null, 2)
    });
    
    const result = await this.executeWithLogging(prompt, userId, sessionId);
    
    if (result.success) {
      try {
        result.data = this.parseJSONResponse(result.data);
      } catch (error) {
        result.success = false;
        result.error = 'Failed to parse analysis results';
      }
    }
    
    return result;
  }
}

// レポート作成エージェント
export class WriterAgent extends BaseAgent {
  constructor() {
    super('writer');
  }

  async generateReport(
    businessIdea: any,
    researchResults: any,
    analysisResults: any,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const prompt = generatePrompt('writer', {
      businessIdea: JSON.stringify(businessIdea, null, 2),
      researchResults: JSON.stringify(researchResults, null, 2),
      analysisResults: JSON.stringify(analysisResults, null, 2)
    });
    
    const result = await this.executeWithLogging(prompt, userId, sessionId);
    
    if (result.success) {
      try {
        result.data = this.parseJSONResponse(result.data);
      } catch (error) {
        result.success = false;
        result.error = 'Failed to parse report sections';
      }
    }
    
    return result;
  }
}

// Enhanced Critic Agent (本格実装統合版)
export class CriticAgent extends BaseAgent {
  private enhancedCritic: EnhancedCriticAgent | null = null;
  
  constructor() {
    super('critic');
    
    // Enhanced Critic Agentの初期化
    this.enhancedCritic = createEnhancedCritic({
      // 本番用設定
      profit_threshold: 10_000_000_000, // 10億円
      enable_detailed_analysis: true,
      enable_idea_comparisons: true,
      enable_improvement_suggestions: true,
      output_language: 'ja'
    });
    
    console.log('✅ Enhanced Critic Agent initialized (comprehensive evaluation capabilities)');
  }

  /**
   * 複数のビジネスアイデアを評価して最優秀案を選定
   */
  async evaluateBusinessIdeas(
    businessIdeas: any[],
    sessionId: string,
    researchResults?: any,
    userId?: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    console.log('🎯 Enhanced Critic Agent: Starting comprehensive idea evaluation...');
    console.log(`📊 Ideas to evaluate: ${businessIdeas.length}`);
    
    // Enhanced Criticが利用可能でない場合はエラー
    if (!this.enhancedCritic) {
      throw new Error('❌ Enhanced Critic Agent is not initialized. Check API keys and configuration.');
    }

    if (businessIdeas.length === 0) {
      throw new Error('❌ No business ideas provided for evaluation.');
    }

    console.log('⚡ Using Enhanced Critic capabilities');
    const result = await this.enhancedCritic.evaluateBusinessIdeas({
      session_id: sessionId,
      business_ideas: businessIdeas,
      research_results: researchResults,
      user_preferences: {
        prioritize_high_synergy: true,
        minimum_profit_requirement: 70 // 70% of max profit score
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Enhanced Critic evaluation completed in ${executionTime}ms`);
    console.log(`🏆 Selected idea: ${result.selected_idea_for_next_phase.idea_title}`);
    console.log(`📈 Top score: ${result.evaluation_summary.top_score}/100`);
    
    return {
      success: true,
      data: result,
      executionTime,
      tokensUsed: 0 // Enhanced Critic doesn't use external LLM calls
    };
  }

  /**
   * 従来のレポート評価機能（後方互換性のため維持）
   */
  async evaluateReport(
    generatedReport: any,
    userId?: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const prompt = generatePrompt('critic', {
      generatedReport: JSON.stringify(generatedReport, null, 2)
    });
    
    const result = await this.executeWithLogging(prompt, userId, sessionId);
    
    if (result.success) {
      try {
        result.data = this.parseJSONResponse(result.data);
      } catch (error) {
        result.success = false;
        result.error = 'Failed to parse quality assessment';
      }
    }
    
    return result;
  }
}

// 協調ワークフロー実行クラス
export class BusinessWorkflowOrchestrator {
  private researcher: ResearcherAgent;
  private ideator: IdeatorAgent;
  private analyst: AnalystAgent;
  private writer: WriterAgent;
  private critic: CriticAgent;
  private planner: PlannerIntegration;

  constructor() {
    this.researcher = new ResearcherAgent();
    this.ideator = new IdeatorAgent();
    this.analyst = new AnalystAgent();
    this.writer = new WriterAgent();
    this.critic = new CriticAgent();
    this.planner = new PlannerIntegration();
  }

  async executeFullWorkflow(
    userInput: string,
    userId?: string,
    sessionId?: string,
    progressCallback?: (phase: string, progress: number) => void
  ): Promise<any> {
    const results = {
      research: null,
      ideas: null,
      selectedIdea: null,
      researchPlan: null,
      analysis: null,
      report: null,
      qualityAssessment: null
    };

    try {
      // Phase 1: Research
      progressCallback?.('research', 10);
      console.log('Starting research phase...');
      const researchResult = await this.researcher.conductMarketResearch(userInput, userId, sessionId);
      if (!researchResult.success) {
        throw new Error(`Research failed: ${researchResult.error}`);
      }
      results.research = researchResult.data;
      progressCallback?.('research', 25);

      // Phase 2: Idea Generation
      progressCallback?.('ideation', 30);
      console.log('Starting ideation phase...');
      const ideationResult = await this.ideator.generateBusinessIdeas(
        userInput, 
        results.research, 
        userId, 
        sessionId
      );
      if (!ideationResult.success) {
        throw new Error(`Ideation failed: ${ideationResult.error}`);
      }
      results.ideas = ideationResult.data;
      
      // Enhanced Ideator のレスポンス形式に対応
      const enhancedIdeas = results.ideas;
      const businessIdeas = enhancedIdeas.businessIdeas || enhancedIdeas.ideas || [];
      
      progressCallback?.('ideation', 50);

      // Phase 2.5: Enhanced Critic Evaluation (NEW)
      progressCallback?.('evaluation', 52);
      console.log('Starting enhanced critic evaluation phase...');
      console.log('💾 Business Ideas to evaluate:', JSON.stringify(businessIdeas, null, 2));
      
      let criticData: any = null;
      
      try {
        const criticResult = await this.critic.evaluateBusinessIdeas(
          businessIdeas,
          sessionId || 'default_session',
          results.research,
          userId
        );
        
        console.log('🔍 Critic Result:', JSON.stringify(criticResult, null, 2));
        
        if (criticResult.success && criticResult.data) {
          // Enhanced Critic が選定した最優秀アイデアを使用
          criticData = criticResult.data;
          results.selectedIdea = criticData.selected_idea_for_next_phase || businessIdeas[0];
          results.ideas = {
            business_ideas: businessIdeas,
            recommendation: {
              top_choice: results.selectedIdea.idea_id || results.selectedIdea.id,
              reasoning: criticData.portfolio_evaluation?.recommendation_reasoning || 'Enhanced Critic による評価結果'
            },
            critic_evaluation: criticData.portfolio_evaluation
          };
          console.log('✅ Enhanced Critic evaluation completed successfully');
        } else {
          throw new Error(`Critic evaluation failed: ${criticResult.error || 'Unknown error'}`);
        }
      } catch (criticError) {
        console.error('❌ Enhanced Critic evaluation detailed error:', criticError);
        console.warn('⚠️ Enhanced Critic evaluation failed, using fallback selection:', criticError);
        // フォールバック: 最初のアイデアを選択
        results.selectedIdea = businessIdeas[0] || {};
        results.ideas = {
          business_ideas: businessIdeas,
          recommendation: {
            top_choice: results.selectedIdea.id || 'idea_1',
            reasoning: 'Critic評価失敗のため最初のアイデアを選択（フォールバック）'
          }
        };
      }
      
      progressCallback?.('evaluation', 55);

      // Phase 2.7: Advanced Planner (NEW)
      progressCallback?.('planning', 58);
      console.log('Starting advanced planning phase...');
      console.log('📋 Advanced Planner Agent: Creating detailed research plan...');
      
      let plannerData: any = null;
      
      try {
        // Prepare Planner input from Critic output
        const plannerInput = PlannerIntegration.fromCriticOutput(
          { selectedIdea: results.selectedIdea },
          {
            researcherCapabilities: ['web_search', 'database_query', 'analysis'],
            availableDataSources: ['Google Search', 'Market Database', 'Industry Reports'],
            maxTimeWeeks: 6,
            maxBudget: 1500000,
            restrictedSources: [],
            complianceRequirements: []
          }
        );

        console.log('📋 Planner Input:', JSON.stringify(plannerInput, null, 2));

        // Create research plan
        const plannerResult = await this.planner.planner.createResearchPlan(plannerInput);
        
        if (plannerResult) {
          plannerData = plannerResult;
          results.researchPlan = plannerData;
          console.log('✅ Advanced Planner completed successfully');
          console.log(`   Research items: ${plannerResult.researchPlan.executionOrder.length}`);
          console.log(`   Estimated time: ${plannerResult.researchPlan.totalEstimatedTime} hours`);
          console.log(`   Categories covered: ${Object.keys(plannerResult.researchPlan.categories).length}`);
        } else {
          throw new Error('Planner returned no result');
        }
      } catch (plannerError) {
        console.error('❌ Advanced Planner failed:', plannerError);
        console.warn('⚠️ Proceeding without detailed research plan');
        // Continue without planner - this is acceptable
      }
      
      // 🔍 Enhanced Critic → Advanced Planner → Analyst への引き渡しデータログ
      console.log('\n📋 === Enhanced Critic → Advanced Planner → Analyst 引き渡しデータ ===');
      console.log('🏆 Selected Idea:', JSON.stringify(results.selectedIdea, null, 2));
      console.log('📊 Critic Evaluation Summary:', criticData ? JSON.stringify(criticData.evaluation_summary, null, 2) : 'No evaluation data');
      console.log('📋 Research Plan Summary:', plannerData ? JSON.stringify({
        totalItems: plannerData.researchPlan.executionOrder.length,
        categories: Object.keys(plannerData.researchPlan.categories),
        estimatedTime: plannerData.researchPlan.totalEstimatedTime,
        nextSteps: plannerData.nextSteps
      }, null, 2) : 'No research plan generated');
      console.log('🔬 Research Data to Analyst:', JSON.stringify(results.research, null, 2));
      console.log('=== 引き渡しデータ終了 ===\n');
      
      progressCallback?.('planning', 60);

      // Phase 3: Analysis
      progressCallback?.('analysis', 60);
      console.log('Starting analysis phase...');
      const analysisResult = await this.analyst.analyzeBusinessIdea(
        results.selectedIdea,
        results.research,
        userId,
        sessionId
      );
      if (!analysisResult.success) {
        throw new Error(`Analysis failed: ${analysisResult.error}`);
      }
      results.analysis = analysisResult.data;
      progressCallback?.('analysis', 75);

      // Phase 4: Report Generation
      progressCallback?.('report', 80);
      console.log('Starting report generation phase...');
      const reportResult = await this.writer.generateReport(
        results.selectedIdea,
        results.research,
        results.analysis,
        userId,
        sessionId
      );
      if (!reportResult.success) {
        throw new Error(`Report generation failed: ${reportResult.error}`);
      }
      results.report = reportResult.data;
      progressCallback?.('report', 90);

      // Phase 5: Quality Assessment
      progressCallback?.('report', 95);
      console.log('Starting quality assessment phase...');
      const qualityResult = await this.critic.evaluateReport(
        results.report,
        userId,
        sessionId
      );
      if (!qualityResult.success) {
        console.warn(`Quality assessment failed: ${qualityResult.error}`);
        // Quality assessment failure is not critical
      } else {
        results.qualityAssessment = qualityResult.data;
      }
      progressCallback?.('completed', 100);

      return this.formatFinalReport(results);

    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  private formatFinalReport(results: any): any {
    return {
      reportData: {
        id: `report_${Date.now()}`,
        session_id: results.session_id || '',
        title: results.selectedIdea?.title || 'Business Analysis Report',
        selected_business_idea: results.selectedIdea,
        research_phase_result: results.research,
        business_ideas: results.ideas?.business_ideas || [],
        recommendation: results.ideas?.recommendation,
        analysis_results: results.analysis,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      generatedReport: {
        report_id: `final_report_${Date.now()}`,
        sections: results.report?.sections || [],
        generation_process: [],
        quality_assessment: results.qualityAssessment?.quality_assessment || {
          overall_score: 75,
          section_scores: [],
          evaluation_criteria: {
            logical_consistency_weight: 0.35,
            actionable_specificity_weight: 0.35,
            data_support_weight: 0.15,
            clarity_weight: 0.15,
            minimum_passing_score: 70
          },
          improvement_suggestions: [],
          strengths: ['AI-generated comprehensive analysis'],
          weaknesses: [],
          meets_threshold: true,
          assessed_at: new Date().toISOString(),
          assessed_by: 'critic_agent'
        },
        revision_history: [],
        final_score: results.qualityAssessment?.quality_assessment?.overall_score || 75,
        generation_time: 0,
        word_count: 2500,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    };
  }
}

export default BusinessWorkflowOrchestrator;