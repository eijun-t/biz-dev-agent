import { AgentState, AgentStage } from "./types";
import { AgentCoordinator } from "./coordinator";
import { ResearcherAgent } from "./researcher";
import { IdeatorAgent } from "./ideator";
import { CriticAgent } from "./critic";
import { AnalystAgent } from "./analyst";
import { WriterAgent } from "./writer";

export class BusinessIdeationWorkflow {
  private coordinator: AgentCoordinator;
  private researcher: ResearcherAgent;
  private ideator: IdeatorAgent;
  private critic: CriticAgent;
  private analyst: AnalystAgent;
  private writer: WriterAgent;

  constructor() {
    this.coordinator = new AgentCoordinator();
    this.researcher = new ResearcherAgent();
    this.ideator = new IdeatorAgent();
    this.critic = new CriticAgent();
    this.analyst = new AnalystAgent();
    this.writer = new WriterAgent();
  }

  /**
   * 簡単なステージベースワークフロー実行
   */
  private async executeStage(state: AgentState): Promise<AgentState> {
    console.log(`[Workflow] Executing stage: ${state.stage}, iteration: ${state.iteration}`);

    // 実行時間チェック
    if (this.coordinator.isExecutionTimeExceeded(state.start_time)) {
      return {
        ...state,
        stage: 'completed',
        errors: [...state.errors, '実行時間が上限に達しました']
      };
    }

    // 完了チェック
    if (state.stage === 'completed') {
      return state;
    }

    try {
      let result;
      
      switch (state.stage) {
        case 'initial_research':
          result = await this.researcher.executeInitialResearch(state);
          break;
        case 'ideation':
          result = await this.ideator.executeIdeation(state);
          break;
        case 'evaluation':
          result = await this.critic.executeEvaluation(state);
          break;
        case 'detailed_research':
          result = await this.analyst.executeDetailedResearch(state);
          break;
        case 'report_generation':
          result = await this.writer.executeReportGeneration(state);
          break;
        default:
          return {
            ...state,
            stage: 'completed',
            errors: [...state.errors, `未知のステージ: ${state.stage}`]
          };
      }

      if (!result.success) {
        // リトライ判定
        if (state.iteration >= 2) {
          return {
            ...result.updated_state,
            stage: 'completed',
            errors: [...result.updated_state.errors, `ステージ ${state.stage} で最大リトライ回数に達しました`]
          };
        }
        
        // リトライ
        return {
          ...result.updated_state,
          iteration: state.iteration + 1
        };
      }

      // 成功時の品質評価
      const assessment = await this.coordinator.assessStageQuality(result.updated_state);
      
      if (assessment.is_sufficient) {
        const nextStage = this.coordinator.getNextStage(state.stage);
        return {
          ...result.updated_state,
          stage: nextStage,
          iteration: 0
        };
      } else {
        if (assessment.recommendation === 'fail' || state.iteration >= 2) {
          return {
            ...result.updated_state,
            stage: 'completed',
            errors: [...result.updated_state.errors, `ステージ ${state.stage} で品質基準を満たせませんでした`]
          };
        }
        
        // 品質不足でリトライ
        return {
          ...result.updated_state,
          iteration: state.iteration + 1
        };
      }

    } catch (error) {
      console.error(`Stage ${state.stage} error:`, error);
      return {
        ...state,
        stage: 'completed',
        errors: [...state.errors, `ステージ ${state.stage} で予期しないエラーが発生しました`]
      };
    }
  }

  /**
   * ワークフローの実行
   */
  async execute(topic: string, requirements?: string, userId?: string): Promise<AgentState> {
    let currentState: AgentState = {
      stage: 'initial_research',
      iteration: 0,
      start_time: new Date().toISOString(),
      tokens_used: 0,
      topic: topic,
      requirements: requirements,
      errors: [],
      logs: []
    };

    try {
      // ワークフローの実行開始をログ
      if (userId) {
        await this.coordinator.logExecution(
          userId,
          'workflow_started',
          { topic, requirements }
        );
      }

      // ステージベースでループ実行
      while (currentState.stage !== 'completed') {
        const previousStage = currentState.stage;
        currentState = await this.executeStage(currentState);
        
        // 無限ループ防止
        if (currentState.stage === previousStage && currentState.iteration === 0) {
          console.error('Workflow stuck in same stage');
          break;
        }
      }

      // 実行完了をログ
      if (userId) {
        await this.coordinator.logExecution(
          userId,
          'workflow_completed',
          { 
            final_stage: currentState.stage,
            total_tokens: currentState.tokens_used,
            execution_time: Date.now() - new Date(currentState.start_time).getTime()
          },
          currentState.tokens_used
        );
      }

      return currentState;

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      if (userId) {
        await this.coordinator.logExecution(
          userId,
          'workflow_failed',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }

      return {
        ...currentState,
        stage: 'completed',
        errors: [...currentState.errors, `ワークフロー実行エラー: ${error}`]
      };
    }
  }
}