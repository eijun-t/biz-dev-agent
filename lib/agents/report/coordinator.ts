/**
 * Report Generation Coordinator with Autonomous Revision Loop
 * 自律修正ループ付きレポート生成コーディネーター
 */

import { ChatOpenAI } from '@langchain/openai';
import { WriterAgent } from './writer';
import { EnhancedCriticAgent } from './critic';
import {
  ComprehensiveBusinessReport,
  ReportGenerationResult,
  QualityAssessment,
  GenerationProcess,
  RevisionRecord,
  ChangeRecord,
  ReportSection
} from './types';

export class ReportCoordinator {
  private writer: WriterAgent;
  private critic: EnhancedCriticAgent;
  private maxRevisions: number;

  constructor(
    llm: ChatOpenAI,
    maxRevisions: number = 2
  ) {
    this.writer = new WriterAgent(llm);
    this.critic = new EnhancedCriticAgent(llm);
    this.maxRevisions = maxRevisions;
  }

  /**
   * 自律修正ループ付きレポート生成
   */
  async generateReportWithRevisions(
    reportData: ComprehensiveBusinessReport,
    onProcessUpdate?: (process: GenerationProcess) => void
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();
    let currentReport: ReportGenerationResult | null = null;
    let revisionCount = 0;

    try {
      // 初回レポート生成
      const initialProcess = this.createProcess('writer', '初回レポート生成', 
        '全7セクションの初回生成を開始しています...');
      if (onProcessUpdate) onProcessUpdate(initialProcess);

      this.updateProcess(initialProcess, 'in_progress', 10);
      if (onProcessUpdate) onProcessUpdate(initialProcess);

      currentReport = await this.writer.generateComprehensiveReport(
        reportData,
        onProcessUpdate
      );

      this.updateProcess(initialProcess, 'completed', 100, 
        `初回レポート生成完了 (${currentReport.sections.length}セクション, ${currentReport.word_count}文字)`);
      if (onProcessUpdate) onProcessUpdate(initialProcess);

      // 自律修正ループ
      while (revisionCount < this.maxRevisions) {
        // 品質評価
        const evaluationProcess = this.createProcess('critic', 
          `品質評価 (${revisionCount + 1}回目)`, 
          'レポートの品質を評価しています...');
        if (onProcessUpdate) onProcessUpdate(evaluationProcess);

        this.updateProcess(evaluationProcess, 'in_progress', 30);
        if (onProcessUpdate) onProcessUpdate(evaluationProcess);

        const qualityAssessment = await this.critic.evaluateReport(currentReport, reportData);
        
        this.updateProcess(evaluationProcess, 'completed', 100, 
          `品質評価完了 (総合スコア: ${qualityAssessment.overall_score}点)`);
        if (onProcessUpdate) onProcessUpdate(evaluationProcess);

        // 80点以上なら終了
        if (qualityAssessment.meets_threshold) {
          const successProcess = this.createProcess('critic', '品質基準達成', 
            `品質基準 (${this.critic['config'].passing_threshold}点) を達成しました！`);
          this.updateProcess(successProcess, 'completed', 100, 
            `最終スコア: ${qualityAssessment.overall_score}点`);
          if (onProcessUpdate) onProcessUpdate(successProcess);
          
          currentReport.quality_assessment = qualityAssessment;
          currentReport.final_score = qualityAssessment.overall_score;
          break;
        }

        // 修正が必要なセクションの特定
        const revisionNeeds = this.critic.identifyRevisionNeeds(qualityAssessment);
        
        if (!revisionNeeds.needs_revision || revisionCount >= this.maxRevisions) {
          // 修正回数上限に達した場合
          const limitProcess = this.createProcess('coordinator', '修正回数上限', 
            `修正回数上限 (${this.maxRevisions}回) に達しました。現在の品質で完了します。`);
          this.updateProcess(limitProcess, 'completed', 100, 
            `最終スコア: ${qualityAssessment.overall_score}点`);
          if (onProcessUpdate) onProcessUpdate(limitProcess);
          
          currentReport.quality_assessment = qualityAssessment;
          currentReport.final_score = qualityAssessment.overall_score;
          break;
        }

        // 修正実行
        revisionCount++;
        
        const revisionProcess = this.createProcess('writer', 
          `レポート修正 (${revisionCount}回目)`, 
          `${revisionNeeds.sections_to_revise.length}個のセクションを修正しています...`);
        if (onProcessUpdate) onProcessUpdate(revisionProcess);

        this.updateProcess(revisionProcess, 'in_progress', 20);
        if (onProcessUpdate) onProcessUpdate(revisionProcess);

        const revisedReport = await this.performRevisions(
          currentReport,
          qualityAssessment,
          revisionNeeds,
          reportData,
          revisionCount
        );

        this.updateProcess(revisionProcess, 'completed', 100, 
          `修正完了 (${revisionNeeds.sections_to_revise.length}セクション修正)`);
        if (onProcessUpdate) onProcessUpdate(revisionProcess);

        currentReport = revisedReport;
      }

      // 最終処理
      if (currentReport) {
        currentReport.generation_time = Date.now() - startTime;
        currentReport.last_updated = new Date().toISOString();
        
        // 最終プロセス
        const finalProcess = this.createProcess('coordinator', 'レポート生成完了', 
          'レポート生成プロセスが完了しました。');
        this.updateProcess(finalProcess, 'completed', 100, 
          `最終品質スコア: ${currentReport.final_score}点, 修正回数: ${revisionCount}回`);
        if (onProcessUpdate) onProcessUpdate(finalProcess);
      }

      return currentReport!;

    } catch (error) {
      throw new Error(`Report generation with revisions failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 修正の実行
   */
  private async performRevisions(
    currentReport: ReportGenerationResult,
    qualityAssessment: QualityAssessment,
    revisionNeeds: any,
    originalData: ComprehensiveBusinessReport,
    revisionNumber: number
  ): Promise<ReportGenerationResult> {
    const revisionRecord: RevisionRecord = {
      revision_id: `revision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      revision_number: revisionNumber,
      trigger_reason: `品質基準未達成 (現在スコア: ${qualityAssessment.overall_score}点)`,
      sections_modified: revisionNeeds.sections_to_revise,
      changes_made: [],
      previous_score: qualityAssessment.overall_score,
      new_score: 0, // 後で更新
      created_at: new Date().toISOString()
    };

    const revisedSections: ReportSection[] = [...currentReport.sections];

    // 低スコアセクションの修正
    for (const sectionName of revisionNeeds.sections_to_revise) {
      const sectionIndex = revisedSections.findIndex(s => s.tab_name === sectionName);
      if (sectionIndex === -1) continue;

      const currentSection = revisedSections[sectionIndex];
      const sectionScore = qualityAssessment.section_scores.find(s => s.section_name === sectionName);
      
      if (!sectionScore) continue;

      // 修正指示の生成
      const revisionInstructions = await this.critic.generateRevisionInstructions(
        currentSection,
        sectionScore,
        originalData
      );

      // セクションの修正
      const revisedSection = await this.reviseSection(
        currentSection,
        revisionInstructions,
        originalData
      );

      revisedSections[sectionIndex] = revisedSection;

      // 変更記録
      const changeRecord: ChangeRecord = {
        section: sectionName,
        change_type: revisionInstructions.revision_type,
        old_content: currentSection.content.substring(0, 200) + '...', // 先頭200文字
        new_content: revisedSection.content.substring(0, 200) + '...',
        reason: revisionInstructions.specific_instructions.join('; ')
      };

      revisionRecord.changes_made.push(changeRecord);
    }

    // 修正されたレポートの作成
    const revisedReport: ReportGenerationResult = {
      ...currentReport,
      sections: revisedSections,
      revision_history: [...currentReport.revision_history, revisionRecord],
      word_count: revisedSections.reduce((total, section) => total + section.content.length, 0),
      last_updated: new Date().toISOString()
    };

    return revisedReport;
  }

  /**
   * 個別セクションの修正
   */
  private async reviseSection(
    section: ReportSection,
    instructions: any,
    originalData: ComprehensiveBusinessReport
  ): Promise<ReportSection> {
    const revisionPrompt = `以下のセクションを修正指示に従って改善してください。

現在のセクション「${section.tab_name}」:
${section.content}

修正指示:
${instructions.specific_instructions.join('\n')}

期待される改善:
${instructions.expected_improvements.join('\n')}

修正要件:
- 元の構造と形式を維持
- 具体的なデータと根拠を追加
- 論理的な流れを改善
- 実行可能な提案を強化
- HTML形式で出力

修正されたセクション内容をHTML形式で出力してください:`;

    const response = await this.writer['llm'].invoke(revisionPrompt);
    const revisedContent = this.formatRevisedContent(response.content as string);

    const revisedSection: ReportSection = {
      ...section,
      content: revisedContent,
      completeness_score: Math.min(100, section.completeness_score + 10), // 修正で少し向上
      last_updated: new Date().toISOString()
    };

    return revisedSection;
  }

  /**
   * 修正されたコンテンツのフォーマット
   */
  private formatRevisedContent(content: string): string {
    return content
      .replace(/```html|```/g, '')
      .trim();
  }

  /**
   * レポート統計の取得
   */
  getReportStatistics(report: ReportGenerationResult): any {
    return {
      generation_time: report.generation_time,
      word_count: report.word_count,
      sections_generated: report.sections.length,
      revision_count: report.revision_history.length,
      final_quality_score: report.final_score,
      meets_quality_threshold: report.quality_assessment?.meets_threshold || false,
      average_section_score: report.quality_assessment 
        ? Math.round(report.quality_assessment.section_scores.reduce((sum, s) => sum + s.score, 0) / report.quality_assessment.section_scores.length)
        : 0,
      process_count: report.generation_process.length,
      successful_processes: report.generation_process.filter(p => p.status === 'completed').length
    };
  }

  /**
   * レポートサマリーのフォーマット
   */
  formatReportSummary(report: ReportGenerationResult): string {
    const stats = this.getReportStatistics(report);
    
    return `レポート生成完了: ${report.report_id}
品質スコア: ${report.final_score}点 ${report.quality_assessment?.meets_threshold ? '✅' : '⚠️'}
文字数: ${stats.word_count.toLocaleString()}文字
生成時間: ${Math.round(stats.generation_time / 1000)}秒
修正回数: ${stats.revision_count}回
セクション完成度: ${stats.average_section_score}点`;
  }

  /**
   * プロセス作成ヘルパー
   */
  private createProcess(
    agent: 'writer' | 'critic' | 'coordinator',
    action: string,
    description: string
  ): GenerationProcess {
    return {
      step_id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent,
      action,
      description,
      status: 'pending',
      start_time: new Date().toISOString(),
      progress_percentage: 0
    };
  }

  /**
   * プロセス更新ヘルパー
   */
  private updateProcess(
    process: GenerationProcess,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    progress: number,
    outputSummary?: string,
    errorMessage?: string
  ): void {
    process.status = status;
    process.progress_percentage = progress;
    
    if (status === 'completed' || status === 'failed') {
      process.end_time = new Date().toISOString();
      process.duration = Math.round(
        (new Date(process.end_time).getTime() - new Date(process.start_time).getTime()) / 1000
      );
    }
    
    if (outputSummary) {
      process.output_summary = outputSummary;
    }
    
    if (errorMessage) {
      process.error_message = errorMessage;
    }
  }

  /**
   * 単純なレポート生成（修正なし）
   */
  async generateSimpleReport(
    reportData: ComprehensiveBusinessReport,
    onProcessUpdate?: (process: GenerationProcess) => void
  ): Promise<ReportGenerationResult> {
    return await this.writer.generateComprehensiveReport(reportData, onProcessUpdate);
  }

  /**
   * 個別セクションの再生成
   */
  async regenerateSection(
    reportData: ComprehensiveBusinessReport,
    sectionName: string
  ): Promise<ReportSection> {
    return await this.writer.generateSection(reportData, sectionName);
  }
}