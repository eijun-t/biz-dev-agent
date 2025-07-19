import { AgentState, AgentStage, StageQualityAssessment } from "./types";
import { createLog } from "@/lib/database/queries";

export class AgentCoordinator {
  private maxRetries: number;
  private maxExecutionTime: number;
  
  constructor() {
    this.maxRetries = parseInt(process.env.MAX_STAGE_RETRIES || "3");
    this.maxExecutionTime = parseInt(process.env.MAX_EXECUTION_TIME || "600000");
  }

  /**
   * ステージの品質を評価し、次のアクションを決定
   */
  async assessStageQuality(state: AgentState): Promise<StageQualityAssessment> {
    const currentStage = state.stage;
    let qualityScore = 0;
    let isSufficient = false;
    const areasForImprovement: string[] = [];
    
    switch (currentStage) {
      case 'initial_research':
        if (state.initial_research) {
          qualityScore = state.initial_research.quality_score;
          isSufficient = qualityScore >= 7 && 
            state.initial_research.industry_trends.length > 100 &&
            state.initial_research.market_gaps.length > 100 &&
            state.initial_research.sources.length >= 3;
          
          if (!isSufficient) {
            if (state.initial_research.industry_trends.length < 100) {
              areasForImprovement.push("業界トレンドの詳細情報が不足");
            }
            if (state.initial_research.market_gaps.length < 100) {
              areasForImprovement.push("市場ギャップの分析が不十分");
            }
            if (state.initial_research.sources.length < 3) {
              areasForImprovement.push("情報源が不足（最低3つ必要）");
            }
          }
        }
        break;
        
      case 'ideation':
        if (state.ideation) {
          qualityScore = state.ideation.quality_score;
          isSufficient = qualityScore >= 7 && 
            state.ideation.generated_ideas.length >= 3 &&
            state.ideation.generated_ideas.every(idea => 
              idea.title.length > 0 && 
              idea.description.length > 50 &&
              idea.mitsubishi_synergy.length > 50
            );
            
          if (!isSufficient) {
            if (state.ideation.generated_ideas.length < 3) {
              areasForImprovement.push("アイデア数が不足（最低3つ必要）");
            }
            areasForImprovement.push("各アイデアの詳細度を向上させる必要");
          }
        }
        break;
        
      case 'evaluation':
        if (state.evaluation) {
          qualityScore = state.evaluation.quality_score;
          isSufficient = qualityScore >= 7 && 
            state.evaluation.selected_idea.selection_reasoning.length > 100;
            
          if (!isSufficient) {
            areasForImprovement.push("選択理由の詳細化が必要");
          }
        }
        break;
        
      case 'detailed_research':
        if (state.detailed_research) {
          qualityScore = state.detailed_research.quality_score;
          isSufficient = qualityScore >= 7 && 
            state.detailed_research.market_size.tam.length > 50 &&
            state.detailed_research.competitive_analysis.direct_competitors.length >= 2;
            
          if (!isSufficient) {
            if (state.detailed_research.market_size.tam.length < 50) {
              areasForImprovement.push("市場規模分析の詳細化が必要");
            }
            if (state.detailed_research.competitive_analysis.direct_competitors.length < 2) {
              areasForImprovement.push("競合分析が不十分（最低2社必要）");
            }
          }
        }
        break;
        
      case 'report_generation':
        if (state.final_report) {
          qualityScore = state.final_report.quality_score;
          isSufficient = qualityScore >= 7 && 
            state.final_report.html_content.length > 1000;
            
          if (!isSufficient) {
            areasForImprovement.push("レポートの詳細度を向上させる必要");
          }
        }
        break;
    }
    
    // リトライ回数制限チェック
    const retryCount = state.iteration;
    let recommendation: 'advance' | 'retry' | 'fail' = 'advance';
    
    if (!isSufficient) {
      if (retryCount >= this.maxRetries) {
        recommendation = 'fail';
      } else {
        recommendation = 'retry';
      }
    }
    
    return {
      stage: currentStage,
      quality_score: qualityScore,
      is_sufficient: isSufficient,
      areas_for_improvement: areasForImprovement,
      recommendation
    };
  }

  /**
   * 次のステージを決定
   */
  getNextStage(currentStage: AgentStage): AgentStage {
    const stageOrder: AgentStage[] = [
      'initial_research',
      'ideation', 
      'evaluation',
      'detailed_research',
      'report_generation',
      'completed'
    ];
    
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      return stageOrder[currentIndex + 1];
    }
    return 'completed';
  }

  /**
   * 実行時間制限チェック
   */
  isExecutionTimeExceeded(startTime: string): boolean {
    const elapsed = Date.now() - new Date(startTime).getTime();
    return elapsed > this.maxExecutionTime;
  }

  /**
   * ログを記録
   */
  async logExecution(
    userId: string, 
    action: string, 
    details: Record<string, unknown>, 
    tokensUsed: number = 0
  ): Promise<void> {
    try {
      await createLog({
        user_id: userId,
        event_type: 'agent_execution',
        details: {
          action,
          ...details
        },
        tokens_used: tokensUsed
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }
}