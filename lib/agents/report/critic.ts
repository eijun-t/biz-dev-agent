/**
 * Enhanced Critic Agent for Report Quality Assessment
 * レポート品質評価のための強化されたCriticエージェント
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  ReportSection,
  QualityAssessment,
  SectionScore,
  EvaluationCriteria,
  CriticConfig,
  ReportGenerationResult,
  ComprehensiveBusinessReport
} from './types';

export class EnhancedCriticAgent {
  private llm: ChatOpenAI;
  private config: CriticConfig;

  constructor(
    llm: ChatOpenAI,
    config: Partial<CriticConfig> = {}
  ) {
    this.llm = llm;
    this.config = {
      passing_threshold: 80,
      max_revisions: 2,
      evaluation_criteria: {
        logical_consistency_weight: 0.35,
        actionable_specificity_weight: 0.35,
        data_support_weight: 0.15,
        clarity_weight: 0.15,
        minimum_passing_score: 80
      },
      detailed_feedback: true,
      auto_request_revisions: true,
      ...config
    };
  }

  /**
   * レポート全体の品質評価
   */
  async evaluateReport(
    report: ReportGenerationResult,
    originalData: ComprehensiveBusinessReport
  ): Promise<QualityAssessment> {
    try {
      // 各セクションの評価
      const sectionScores = await this.evaluateAllSections(report.sections, originalData);
      
      // 全体スコアの計算
      const overallScore = this.calculateOverallScore(sectionScores);
      
      // 改善提案と強み・弱みの特定
      const analysis = await this.generateQualityAnalysis(report, sectionScores, originalData);
      
      const qualityAssessment: QualityAssessment = {
        overall_score: overallScore,
        section_scores: sectionScores,
        evaluation_criteria: this.config.evaluation_criteria,
        improvement_suggestions: analysis.improvement_suggestions,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        meets_threshold: overallScore >= this.config.passing_threshold,
        assessed_at: new Date().toISOString(),
        assessed_by: 'critic_agent'
      };

      return qualityAssessment;

    } catch (error) {
      throw new Error(`Report evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 全セクションの評価
   */
  private async evaluateAllSections(
    sections: ReportSection[],
    originalData: ComprehensiveBusinessReport
  ): Promise<SectionScore[]> {
    const sectionScores: SectionScore[] = [];

    for (const section of sections) {
      try {
        const score = await this.evaluateSection(section, originalData);
        sectionScores.push(score);
      } catch (error) {
        // エラーの場合は低いスコアを設定
        sectionScores.push({
          section_name: section.tab_name,
          score: 30,
          criteria_breakdown: {
            logical_consistency: 30,
            actionable_specificity: 30,
            data_support: 30,
            clarity: 30
          },
          feedback: `評価エラー: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    return sectionScores;
  }

  /**
   * 個別セクションの評価
   */
  private async evaluateSection(
    section: ReportSection,
    originalData: ComprehensiveBusinessReport
  ): Promise<SectionScore> {
    const evaluationPrompt = `以下の${section.tab_name}セクションを4つの基準で評価してください。

セクション内容:
${section.content}

元データ:
ビジネスアイデア: ${originalData.selected_business_idea.title}
分析結果の信頼度: ${originalData.analysis_phase_result?.analysis_confidence}/10

評価基準:
1. 論理的一貫性 (35%): 内容が論理的で矛盾がないか
2. 実行可能な具体性 (35%): 具体的で実行可能な提案があるか
3. データ裏付け (15%): 定量的データや根拠が示されているか
4. 明瞭性 (15%): 分かりやすく構造化されているか

各基準を0-100で評価し、以下のJSON形式で回答してください:
{
  "logical_consistency": 数値,
  "actionable_specificity": 数値,
  "data_support": 数値,
  "clarity": 数値,
  "detailed_feedback": "具体的なフィードバック",
  "strengths": ["強みポイント1", "強みポイント2"],
  "weaknesses": ["改善点1", "改善点2"],
  "specific_improvements": ["具体的改善提案1", "具体的改善提案2"]
}`;

    const response = await this.llm.invoke(evaluationPrompt);
    const evaluation = this.parseEvaluationResponse(response.content as string);

    // 重み付きスコアの計算
    const weightedScore = 
      evaluation.logical_consistency * this.config.evaluation_criteria.logical_consistency_weight +
      evaluation.actionable_specificity * this.config.evaluation_criteria.actionable_specificity_weight +
      evaluation.data_support * this.config.evaluation_criteria.data_support_weight +
      evaluation.clarity * this.config.evaluation_criteria.clarity_weight;

    return {
      section_name: section.tab_name,
      score: Math.round(weightedScore),
      criteria_breakdown: {
        logical_consistency: evaluation.logical_consistency,
        actionable_specificity: evaluation.actionable_specificity,
        data_support: evaluation.data_support,
        clarity: evaluation.clarity
      },
      feedback: evaluation.detailed_feedback || `${section.tab_name}の評価が完了しました。`
    };
  }

  /**
   * 全体品質分析の生成
   */
  private async generateQualityAnalysis(
    report: ReportGenerationResult,
    sectionScores: SectionScore[],
    originalData: ComprehensiveBusinessReport
  ): Promise<{
    improvement_suggestions: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    const analysisPrompt = `以下のレポート評価結果に基づいて、全体的な品質分析を行ってください。

レポートタイトル: ${originalData.selected_business_idea.title}
全体スコア: ${this.calculateOverallScore(sectionScores)}点

セクション別評価:
${sectionScores.map(score => 
  `- ${score.section_name}: ${score.score}点 (論理性:${score.criteria_breakdown.logical_consistency}, 具体性:${score.criteria_breakdown.actionable_specificity})`
).join('\n')}

生成時間: ${Math.round(report.generation_time / 1000)}秒
文字数: ${report.word_count}文字

以下の観点で分析してください:
1. レポート全体の強み（3-5個）
2. 改善が必要な弱み（3-5個）  
3. 具体的な改善提案（5-7個）

以下のJSON形式で回答してください:
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱み1", "弱み2", "弱み3"],
  "improvement_suggestions": ["改善提案1", "改善提案2", "改善提案3", "改善提案4", "改善提案5"]
}`;

    const response = await this.llm.invoke(analysisPrompt);
    const analysis = this.parseAnalysisResponse(response.content as string);

    return {
      improvement_suggestions: analysis.improvement_suggestions || [
        '定量的データの追加',
        '具体的なアクションプランの詳細化',
        'リスク軽減策の具体化'
      ],
      strengths: analysis.strengths || [
        '包括的な分析',
        '構造化された内容'
      ],
      weaknesses: analysis.weaknesses || [
        'より詳細な市場データが必要'
      ]
    };
  }

  /**
   * 修正が必要なセクションの特定
   */
  identifyRevisionNeeds(qualityAssessment: QualityAssessment): {
    needs_revision: boolean;
    sections_to_revise: string[];
    priority_issues: string[];
  } {
    const lowScoreSections = qualityAssessment.section_scores
      .filter(score => score.score < this.config.passing_threshold)
      .map(score => score.section_name);

    const priorityIssues: string[] = [];

    // 特に重要な問題の特定
    qualityAssessment.section_scores.forEach(score => {
      if (score.criteria_breakdown.logical_consistency < 60) {
        priorityIssues.push(`${score.section_name}の論理的一貫性を改善`);
      }
      if (score.criteria_breakdown.actionable_specificity < 60) {
        priorityIssues.push(`${score.section_name}の具体性を向上`);
      }
    });

    return {
      needs_revision: !qualityAssessment.meets_threshold,
      sections_to_revise: lowScoreSections,
      priority_issues: priorityIssues
    };
  }

  /**
   * 修正指示の生成
   */
  async generateRevisionInstructions(
    section: ReportSection,
    sectionScore: SectionScore,
    originalData: ComprehensiveBusinessReport
  ): Promise<{
    revision_type: 'content_update' | 'structure_change' | 'data_addition' | 'clarification';
    specific_instructions: string[];
    expected_improvements: string[];
  }> {
    const instructionPrompt = `以下のセクションの品質向上のための具体的な修正指示を作成してください。

セクション: ${section.tab_name}
現在のスコア: ${sectionScore.score}点
目標スコア: ${this.config.passing_threshold}点以上

評価詳細:
- 論理的一貫性: ${sectionScore.criteria_breakdown.logical_consistency}点
- 実行可能な具体性: ${sectionScore.criteria_breakdown.actionable_specificity}点
- データ裏付け: ${sectionScore.criteria_breakdown.data_support}点
- 明瞭性: ${sectionScore.criteria_breakdown.clarity}点

フィードバック: ${sectionScore.feedback}

以下のJSON形式で修正指示を提供してください:
{
  "revision_type": "content_update/structure_change/data_addition/clarification",
  "specific_instructions": [
    "具体的な修正指示1",
    "具体的な修正指示2",
    "具体的な修正指示3"
  ],
  "expected_improvements": [
    "期待される改善1",
    "期待される改善2"
  ]
}`;

    const response = await this.llm.invoke(instructionPrompt);
    const instructions = this.parseInstructionResponse(response.content as string);

    return {
      revision_type: instructions.revision_type || 'content_update',
      specific_instructions: instructions.specific_instructions || [
        'より具体的なデータを追加してください',
        '論理的な流れを改善してください'
      ],
      expected_improvements: instructions.expected_improvements || [
        'データ裏付けの向上',
        '論理的一貫性の向上'
      ]
    };
  }

  /**
   * 全体スコアの計算
   */
  private calculateOverallScore(sectionScores: SectionScore[]): number {
    if (sectionScores.length === 0) return 0;
    
    const totalScore = sectionScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round(totalScore / sectionScores.length);
  }

  /**
   * 評価レスポンスのパース
   */
  private parseEvaluationResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Evaluation response parsing failed:', error);
    }
    
    // フォールバック
    return {
      logical_consistency: 60,
      actionable_specificity: 60,
      data_support: 50,
      clarity: 70,
      detailed_feedback: '評価の解析に失敗しました',
      strengths: [],
      weaknesses: [],
      specific_improvements: []
    };
  }

  /**
   * 分析レスポンスのパース
   */
  private parseAnalysisResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Analysis response parsing failed:', error);
    }
    
    return {
      strengths: ['基本的な構造が整っている'],
      weaknesses: ['詳細な分析が不足'],
      improvement_suggestions: ['データの追加', '具体性の向上']
    };
  }

  /**
   * 指示レスポンスのパース
   */
  private parseInstructionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Instruction response parsing failed:', error);
    }
    
    return {
      revision_type: 'content_update',
      specific_instructions: ['内容を詳しく記述してください'],
      expected_improvements: ['品質の向上']
    };
  }

  /**
   * セクション固有の評価基準調整
   */
  private adjustCriteriaForSection(sectionName: string): Partial<EvaluationCriteria> {
    const adjustments: { [key: string]: Partial<EvaluationCriteria> } = {
      '概要': {
        logical_consistency_weight: 0.4,
        actionable_specificity_weight: 0.2,
        data_support_weight: 0.2,
        clarity_weight: 0.2
      },
      '市場規模・競合': {
        logical_consistency_weight: 0.2,
        actionable_specificity_weight: 0.2,
        data_support_weight: 0.4,
        clarity_weight: 0.2
      },
      '検証アクション': {
        logical_consistency_weight: 0.2,
        actionable_specificity_weight: 0.5,
        data_support_weight: 0.1,
        clarity_weight: 0.2
      },
      'リスク': {
        logical_consistency_weight: 0.3,
        actionable_specificity_weight: 0.4,
        data_support_weight: 0.2,
        clarity_weight: 0.1
      }
    };

    return adjustments[sectionName] || this.config.evaluation_criteria;
  }

  /**
   * 品質トレンド分析
   */
  analyzeQualityTrend(
    previousAssessments: QualityAssessment[],
    currentAssessment: QualityAssessment
  ): {
    overall_trend: 'improving' | 'declining' | 'stable';
    section_trends: { [section: string]: 'improving' | 'declining' | 'stable' };
    insights: string[];
  } {
    if (previousAssessments.length === 0) {
      return {
        overall_trend: 'stable',
        section_trends: {},
        insights: ['初回評価のため、トレンド分析はできません']
      };
    }

    const latestPrevious = previousAssessments[previousAssessments.length - 1];
    const scoreDiff = currentAssessment.overall_score - latestPrevious.overall_score;
    
    let overall_trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (scoreDiff > 5) overall_trend = 'improving';
    else if (scoreDiff < -5) overall_trend = 'declining';

    const section_trends: { [section: string]: 'improving' | 'declining' | 'stable' } = {};
    const insights: string[] = [];

    currentAssessment.section_scores.forEach(currentSection => {
      const previousSection = latestPrevious.section_scores.find(
        s => s.section_name === currentSection.section_name
      );
      
      if (previousSection) {
        const sectionDiff = currentSection.score - previousSection.score;
        if (sectionDiff > 10) {
          section_trends[currentSection.section_name] = 'improving';
          insights.push(`${currentSection.section_name}セクションが大幅に改善されました`);
        } else if (sectionDiff < -10) {
          section_trends[currentSection.section_name] = 'declining';
          insights.push(`${currentSection.section_name}セクションの品質が低下しています`);
        } else {
          section_trends[currentSection.section_name] = 'stable';
        }
      }
    });

    if (overall_trend === 'improving') {
      insights.push('レポート全体の品質が向上しています');
    } else if (overall_trend === 'declining') {
      insights.push('レポート全体の品質改善が必要です');
    }

    return {
      overall_trend,
      section_trends,
      insights
    };
  }
}