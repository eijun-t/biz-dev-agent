/**
 * Ideation Coordinator - アイディエーションフェーズの統合管理
 */

import { ChatOpenAI } from '@langchain/openai';
import { IdeatorAgent } from './ideator';
import { CriticAgent } from './critic';
import { 
  BusinessIdea, 
  IdeaEvaluation, 
  IdeationPhaseState, 
  IdeationResult, 
  IdeationIteration 
} from './types';
import { ResearchSummary } from '../research/types';

export class IdeationCoordinator {
  private ideator: IdeatorAgent;
  private critic: CriticAgent;
  private llm: ChatOpenAI;
  private maxIterations: number;
  private passingScore: number;

  constructor(
    llm: ChatOpenAI,
    maxIterations: number = 2,
    passingScore: number = 70
  ) {
    this.llm = llm;
    this.ideator = new IdeatorAgent(llm);
    this.critic = new CriticAgent(llm);
    this.maxIterations = maxIterations;
    this.passingScore = passingScore;
  }

  /**
   * アイディエーションフェーズを実行
   */
  async executeIdeationPhase(
    researchSummaries: ResearchSummary[],
    userRequirements?: string,
    sessionId?: string
  ): Promise<IdeationResult> {
    const startTime = Date.now();
    console.log(`🚀 アイディエーションフェーズ開始: セッション ${sessionId || 'unknown'}`);

    // 研究データの十分性をチェック
    if (!this.validateResearchData(researchSummaries)) {
      throw new Error('研究データが不十分です。最低3件の高品質な研究要約が必要です。');
    }

    // 初期状態を作成
    let state: IdeationPhaseState = {
      research_summaries: researchSummaries,
      current_iteration: 0,
      max_iterations: this.maxIterations,
      ideas: [],
      evaluations: [],
      selected_idea: null,
      iteration_history: [],
      is_complete: false,
      next_action: 'generate_ideas',
      processing_start_time: new Date().toISOString(),
      total_processing_time: 0
    };

    try {
      // メインのアイディエーション・評価ループ
      while (!state.is_complete && state.current_iteration <= this.maxIterations) {
        console.log(`\n🔄 反復 ${state.current_iteration + 1}/${this.maxIterations + 1}`);

        // アイデア生成
        const ideas = await this.ideator.generateIdeas(
          researchSummaries,
          userRequirements,
          state.feedback_for_next_iteration,
          state.current_iteration
        );

        // アイデア検証
        const validation = this.ideator.validateIdeas(ideas);
        if (!validation.isValid) {
          console.warn('⚠️ アイデア検証エラー:', validation.issues);
        }

        state.ideas = ideas;

        // アイデア評価
        const evaluations = await this.critic.evaluateIdeas(ideas);
        state.evaluations = evaluations;

        // 反復記録を追加
        const iteration: IdeationIteration = {
          iteration_number: state.current_iteration,
          trigger: state.current_iteration === 0 ? 'initial' : 'critic_feedback',
          input_feedback: state.feedback_for_next_iteration,
          ideas_generated: ideas.length,
          best_score: Math.max(...evaluations.map(e => e.total_score)),
          action_taken: 'continue',
          timestamp: new Date().toISOString()
        };

        // 次のアクションを決定
        const decision = this.critic.shouldIterate(
          evaluations,
          state.current_iteration,
          this.maxIterations
        );

        if (!decision.shouldIterate) {
          // 最適なアイデアを選択
          const { bestIdea, bestEvaluation } = this.critic.selectBestIdea(ideas, evaluations);
          state.selected_idea = bestIdea;
          state.is_complete = true;
          iteration.action_taken = 'complete';
          
          console.log(`✅ アイディエーション完了: "${bestIdea?.title}" (${bestEvaluation?.total_score}点)`);
        } else {
          // 次の反復を準備
          state.feedback_for_next_iteration = decision.feedback;
          state.current_iteration++;
          iteration.action_taken = 'iterate';
          
          console.log(`🔄 反復継続: ${decision.reason}`);
        }

        state.iteration_history.push(iteration);
      }

      // 最終処理
      if (!state.selected_idea && state.ideas.length > 0) {
        // 最大反復に達した場合、最高スコアのアイデアを選択
        const { bestIdea } = this.critic.selectBestIdea(state.ideas, state.evaluations);
        state.selected_idea = bestIdea;
        console.log(`⏰ 最大反復数到達: 最高スコアアイデア選択 "${bestIdea?.title}"`);
      }

      // 結果を作成
      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;

      const result: IdeationResult = {
        session_id: sessionId || `ideation_${Date.now()}`,
        ideas: state.ideas,
        evaluations: state.evaluations,
        selected_idea: state.selected_idea,
        iteration_history: state.iteration_history,
        final_score: state.selected_idea ? 
          state.evaluations.find(e => e.idea_id === state.selected_idea!.id)?.total_score || 0 : 0,
        total_processing_time: totalProcessingTime,
        created_at: new Date().toISOString()
      };

      console.log(`\n🎉 アイディエーションフェーズ完了:`);
      console.log(`   💡 生成アイデア: ${result.ideas.length}個`);
      console.log(`   🔄 実行反復: ${result.iteration_history.length}回`);
      console.log(`   🏆 最終スコア: ${result.final_score}点`);
      console.log(`   ⏱️ 処理時間: ${(totalProcessingTime / 1000).toFixed(1)}秒`);

      return result;

    } catch (error) {
      console.error('❌ アイディエーションフェーズエラー:', error);
      throw error;
    }
  }

  /**
   * 研究データの妥当性を検証
   */
  private validateResearchData(researchSummaries: ResearchSummary[]): boolean {
    if (researchSummaries.length < 3) {
      console.warn('研究要約が不足しています');
      return false;
    }

    // 高品質な研究要約の数をチェック
    const highQualitySummaries = researchSummaries.filter(s => 
      s.business_potential >= 6 && s.mitsubishi_synergy_potential >= 5
    );

    if (highQualitySummaries.length < 2) {
      console.warn('高品質な研究要約が不足しています');
      return false;
    }

    // カテゴリの多様性をチェック
    const categories = new Set(researchSummaries.map(s => s.category));
    if (categories.size < 2) {
      console.warn('研究カテゴリの多様性が不足しています');
      return false;
    }

    return true;
  }

  /**
   * アイディエーションの健全性チェック
   */
  async healthCheck(state: IdeationPhaseState): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 処理時間チェック
    const currentTime = Date.now();
    const processingTime = currentTime - new Date(state.processing_start_time).getTime();
    if (processingTime > 300000) { // 5分
      issues.push('処理時間が長すぎます');
      recommendations.push('アイデア生成の最適化を検討');
    }

    // アイデア品質チェック
    if (state.evaluations.length > 0) {
      const averageScore = state.evaluations.reduce((sum, e) => sum + e.total_score, 0) / state.evaluations.length;
      if (averageScore < 50) {
        issues.push('アイデアの平均品質が低い');
        recommendations.push('研究データの再評価または追加調査を実施');
      }
    }

    // 反復効率チェック
    if (state.iteration_history.length > 1) {
      const scores = state.iteration_history.map(h => h.best_score);
      const isImproving = scores[scores.length - 1] > scores[scores.length - 2];
      if (!isImproving) {
        issues.push('反復による改善が見られない');
        recommendations.push('フィードバックの質を向上させる');
      }
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * アイディエーションの統計情報を取得
   */
  getIdeationStatistics(result: IdeationResult): {
    efficiency: {
      ideas_per_iteration: number;
      score_improvement_rate: number;
      time_per_idea: number;
    };
    quality: {
      average_score: number;
      best_score: number;
      passing_rate: number;
    };
    process: {
      total_iterations: number;
      completion_reason: string;
      success_rate: number;
    };
  } {
    const averageScore = result.evaluations.reduce((sum, e) => sum + e.total_score, 0) / result.evaluations.length;
    const bestScore = Math.max(...result.evaluations.map(e => e.total_score));
    const passingCount = result.evaluations.filter(e => e.total_score >= this.passingScore).length;

    // スコア改善率を計算
    const scores = result.iteration_history.map(h => h.best_score);
    let scoreImprovementRate = 0;
    if (scores.length > 1) {
      const initialScore = scores[0];
      const finalScore = scores[scores.length - 1];
      scoreImprovementRate = initialScore > 0 ? ((finalScore - initialScore) / initialScore) * 100 : 0;
    }

    // 完了理由を判定
    let completionReason = 'unknown';
    if (result.final_score >= this.passingScore) {
      completionReason = 'target_achieved';
    } else if (result.iteration_history.length > this.maxIterations) {
      completionReason = 'max_iterations_reached';
    } else {
      completionReason = 'early_termination';
    }

    return {
      efficiency: {
        ideas_per_iteration: result.ideas.length / result.iteration_history.length,
        score_improvement_rate: scoreImprovementRate,
        time_per_idea: result.total_processing_time / result.ideas.length
      },
      quality: {
        average_score: averageScore,
        best_score: bestScore,
        passing_rate: (passingCount / result.evaluations.length) * 100
      },
      process: {
        total_iterations: result.iteration_history.length,
        completion_reason: completionReason,
        success_rate: result.final_score >= this.passingScore ? 100 : 0
      }
    };
  }

  /**
   * アイディエーション結果をサマリー表示用に整形
   */
  formatResultSummary(result: IdeationResult): {
    selected_idea: {
      title: string;
      score: number;
      strengths: string[];
      target_market: string;
    } | null;
    alternatives: Array<{
      title: string;
      score: number;
      recommendation: string;
    }>;
    process_summary: {
      iterations: number;
      processing_time: string;
      success: boolean;
    };
  } {
    let selectedIdea = null;
    if (result.selected_idea) {
      const evaluation = result.evaluations.find(e => e.idea_id === result.selected_idea!.id);
      selectedIdea = {
        title: result.selected_idea.title,
        score: evaluation?.total_score || 0,
        strengths: evaluation?.feedback.strengths || [],
        target_market: result.selected_idea.target_market
      };
    }

    const alternatives = result.ideas
      .filter(idea => idea.id !== result.selected_idea?.id)
      .map(idea => {
        const evaluation = result.evaluations.find(e => e.idea_id === idea.id);
        return {
          title: idea.title,
          score: evaluation?.total_score || 0,
          recommendation: evaluation?.recommendation || 'unknown'
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      selected_idea: selectedIdea,
      alternatives,
      process_summary: {
        iterations: result.iteration_history.length,
        processing_time: `${(result.total_processing_time / 1000).toFixed(1)}秒`,
        success: result.final_score >= this.passingScore
      }
    };
  }
}