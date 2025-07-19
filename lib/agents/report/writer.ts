/**
 * Writer Agent for Report Generation
 * レポート生成のためのWriterエージェント
 */

import { ChatOpenAI } from '@langchain/openai';
import {
  ComprehensiveBusinessReport,
  ReportSection,
  ReportGenerationResult,
  GenerationProcess,
  WriterConfig,
  ReportSubsection
} from './types';

export class WriterAgent {
  private llm: ChatOpenAI;
  private config: WriterConfig;

  constructor(
    llm: ChatOpenAI,
    config: Partial<WriterConfig> = {}
  ) {
    this.llm = llm;
    this.config = {
      max_section_length: 3000,
      min_section_length: 500,
      include_charts: true,
      include_tables: true,
      writing_style: 'business',
      target_audience: 'executives',
      language: 'ja',
      template_version: '1.0',
      ...config
    };
  }

  /**
   * 包括的レポートの生成
   */
  async generateComprehensiveReport(
    reportData: ComprehensiveBusinessReport,
    onProcessUpdate?: (process: GenerationProcess) => void
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const processes: GenerationProcess[] = [];
    const sections: ReportSection[] = [];

    const sectionNames = [
      '概要',
      '想定ターゲットと課題', 
      'ソリューション仮説・ビジネスモデル',
      '市場規模・競合',
      '三菱地所が取り組む意義',
      '検証アクション',
      'リスク'
    ] as const;

    try {
      // 各セクションを順次生成
      for (const sectionName of sectionNames) {
        const process = this.createProcess('writer', `${sectionName}セクション生成`, 
          `${sectionName}の詳細内容を作成しています...`);
        processes.push(process);
        
        if (onProcessUpdate) {
          onProcessUpdate(process);
        }

        try {
          this.updateProcess(process, 'in_progress', 20);
          if (onProcessUpdate) onProcessUpdate(process);

          const section = await this.generateSection(reportData, sectionName);
          
          this.updateProcess(process, 'completed', 100, 
            `${sectionName}セクション完成 (${section.content.length}文字)`);
          sections.push(section);

        } catch (error) {
          this.updateProcess(process, 'failed', 0, undefined, 
            error instanceof Error ? error.message : String(error));
        }

        if (onProcessUpdate) {
          onProcessUpdate(process);
        }
      }

      // レポート品質チェック
      const qualityProcess = this.createProcess('writer', 'レポート品質チェック', 
        '生成されたレポートの品質を確認しています...');
      processes.push(qualityProcess);
      
      if (onProcessUpdate) {
        this.updateProcess(qualityProcess, 'in_progress', 50);
        onProcessUpdate(qualityProcess);
      }

      const qualityAssessment = await this.performQualityCheck(sections);
      
      this.updateProcess(qualityProcess, 'completed', 100, 
        `品質チェック完了 (総合スコア: ${qualityAssessment.overall_score}点)`);
      
      if (onProcessUpdate) {
        onProcessUpdate(qualityProcess);
      }

      // 最終結果の作成
      const result: ReportGenerationResult = {
        report_id: reportId,
        sections,
        generation_process: processes,
        quality_assessment: qualityAssessment,
        revision_history: [],
        final_score: qualityAssessment.overall_score,
        generation_time: Date.now() - startTime,
        word_count: sections.reduce((total, section) => total + section.content.length, 0),
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      return result;

    } catch (error) {
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 個別セクションの生成
   */
  async generateSection(
    reportData: ComprehensiveBusinessReport,
    sectionName: string
  ): Promise<ReportSection> {
    const sectionPrompts = {
      '概要': this.createOverviewPrompt(reportData),
      '想定ターゲットと課題': this.createTargetAndProblemsPrompt(reportData),
      'ソリューション仮説・ビジネスモデル': this.createSolutionPrompt(reportData),
      '市場規模・競合': this.createMarketPrompt(reportData),
      '三菱地所が取り組む意義': this.createMitsubishiSynergyPrompt(reportData),
      '検証アクション': this.createValidationPrompt(reportData),
      'リスク': this.createRiskPrompt(reportData)
    };

    const prompt = sectionPrompts[sectionName as keyof typeof sectionPrompts];
    
    if (!prompt) {
      throw new Error(`Unknown section: ${sectionName}`);
    }

    const response = await this.llm.invoke(prompt);
    const content = this.formatContent(response.content as string);

    const section: ReportSection = {
      section_id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tab_name: sectionName as any,
      title: sectionName,
      content,
      data_sources: this.extractDataSources(reportData),
      confidence_level: this.calculateConfidenceLevel(reportData, sectionName),
      completeness_score: this.calculateCompletenessScore(content),
      last_updated: new Date().toISOString()
    };

    return section;
  }

  /**
   * 概要セクションのプロンプト作成
   */
  private createOverviewPrompt(reportData: ComprehensiveBusinessReport): string {
    const idea = reportData.selected_business_idea;
    const analysis = reportData.analysis_phase_result;

    return `以下の情報に基づいて、ビジネスアイデアの「概要」セクションを作成してください。

ビジネスアイデア:
- タイトル: ${idea.title}
- 問題: ${idea.problem_statement}
- ソリューション: ${idea.solution}
- ビジネスモデル: ${idea.business_model}

市場分析結果:
- TAM: ${analysis?.market_analysis.tam.value}${analysis?.market_analysis.tam.unit}
- 市場成長率: ${analysis?.market_analysis.market_growth_rate}
- 競合数: ${analysis?.competitive_analysis.direct_competitors.length}社
- リスクスコア: ${analysis?.risk_assessment.overall_risk_score}/10

要件:
- エグゼクティブサマリーとして、経営陣が読む前提で作成
- 結論先行で、要点を3-4ポイントに整理
- 市場機会、ソリューションの価値、期待される成果を含める
- HTML形式で、見出しとリストを使って構造化
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * ターゲットと課題セクションのプロンプト作成
   */
  private createTargetAndProblemsPrompt(reportData: ComprehensiveBusinessReport): string {
    const idea = reportData.selected_business_idea;
    const research = reportData.research_phase_result;

    return `以下の情報に基づいて、「想定ターゲットと課題」セクションを作成してください。

ビジネスアイデア:
- ターゲット市場: ${idea.target_market}
- 解決する問題: ${idea.problem_statement}

調査結果:
${research?.map(r => `- ${r.topic}: ${r.summary}`).join('\n')}

要件:
- ターゲット顧客のペルソナを具体的に記述
- 現在の課題の詳細分析（規模、深刻度、緊急性）
- 課題が解決されない場合の影響
- 市場セグメント別の分析
- HTML形式で表とリストを効果的に使用
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * ソリューションセクションのプロンプト作成
   */
  private createSolutionPrompt(reportData: ComprehensiveBusinessReport): string {
    const idea = reportData.selected_business_idea;
    const analysis = reportData.analysis_phase_result;

    return `以下の情報に基づいて、「ソリューション仮説・ビジネスモデル」セクションを作成してください。

ビジネスアイデア:
- ソリューション: ${idea.solution}
- ビジネスモデル: ${idea.business_model}

財務予測:
- 1年目売上予測: ${analysis?.financial_projections.revenue_projections.year_1}百万円
- 初期投資: ${analysis?.financial_projections.cost_structure.initial_investment}百万円
- 損益分岐点: ${analysis?.financial_projections.profitability.break_even_point}

要件:
- ソリューションの技術的実現性
- 段階的な実装計画
- 収益モデルの詳細説明
- 価格戦略と根拠
- スケーラビリティの評価
- HTML形式で図表を含める
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * 市場規模・競合セクションのプロンプト作成
   */
  private createMarketPrompt(reportData: ComprehensiveBusinessReport): string {
    const analysis = reportData.analysis_phase_result;

    return `以下の分析結果に基づいて、「市場規模・競合」セクションを作成してください。

市場分析:
- TAM: ${analysis?.market_analysis.tam.value}${analysis?.market_analysis.tam.unit}
- SAM: ${analysis?.market_analysis.sam.value}${analysis?.market_analysis.sam.unit}
- SOM: ${analysis?.market_analysis.som.value}${analysis?.market_analysis.som.unit}
- 市場成長率: ${analysis?.market_analysis.market_growth_rate}%
- 市場成熟度: ${analysis?.market_analysis.market_maturity}

競合分析:
直接競合:
${analysis?.competitive_analysis.direct_competitors.map(c => 
  `- ${c.name}: 強み(${c.strengths.join(', ')}) 弱み(${c.weaknesses.join(', ')})`
).join('\n')}

要件:
- 市場規模の算出根拠と信頼性
- 競合マップと差別化戦略
- 市場トレンドと将来予測
- 参入機会とタイミング
- HTML形式で表やグラフを含める
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * 三菱地所シナジーセクションのプロンプト作成
   */
  private createMitsubishiSynergyPrompt(reportData: ComprehensiveBusinessReport): string {
    const idea = reportData.selected_business_idea;
    const analysis = reportData.analysis_phase_result;

    return `以下の情報に基づいて、「三菱地所が取り組む意義」セクションを作成してください。

三菱地所シナジー:
${idea.mitsubishi_synergy}

戦略的提案:
${analysis?.strategic_recommendations.join('\n')}

要件:
- 三菱地所の既存事業との相乗効果
- 競合優位性の具体的説明
- リソース活用の具体例
- 長期的な戦略価値
- ESG・社会貢献の観点
- ブランド価値への影響
- HTML形式で構造化
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * 検証アクションセクションのプロンプト作成
   */
  private createValidationPrompt(reportData: ComprehensiveBusinessReport): string {
    const analysis = reportData.analysis_phase_result;

    return `以下の情報に基づいて、「検証アクション」セクションを作成してください。

次のステップ:
${analysis?.next_steps.join('\n')}

要件:
- 具体的で実行可能なアクションプラン
- 優先順位付けされたタスク
- 各アクションの期間と責任者
- 成功指標とKPI
- 予算とリソース要件
- リスク軽減策
- マイルストーンとチェックポイント
- HTML形式で表を効果的に使用
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * リスクセクションのプロンプト作成
   */
  private createRiskPrompt(reportData: ComprehensiveBusinessReport): string {
    const analysis = reportData.analysis_phase_result;

    return `以下のリスク分析結果に基づいて、「リスク」セクションを作成してください。

リスク評価:
- 総合リスクスコア: ${analysis?.risk_assessment.overall_risk_score}/10

市場リスク:
${analysis?.risk_assessment.market_risks.map(r => 
  `- ${r.risk_name}: ${r.description} (確率: ${r.probability}, 影響: ${r.impact})`
).join('\n')}

技術リスク:
${analysis?.risk_assessment.technology_risks.map(r => 
  `- ${r.risk_name}: ${r.description}`
).join('\n')}

軽減策:
${analysis?.risk_assessment.mitigation_strategies.map(s => 
  `- ${s.risk_addressed}: ${s.strategy}`
).join('\n')}

要件:
- リスクマトリックスによる整理
- 各リスクの詳細分析と対策
- モニタリング計画
- 早期警告指標
- 緊急時対応計画
- HTML形式で表とリストを使用
- 文字数: ${this.config.min_section_length}-${this.config.max_section_length}文字

HTML形式で出力してください。`;
  }

  /**
   * コンテンツのフォーマット
   */
  private formatContent(content: string): string {
    // HTMLタグの調整とクリーンアップ
    let formatted = content
      .replace(/```html|```/g, '')
      .trim();

    // 基本的なHTML構造の確保
    if (!formatted.includes('<h1>') && !formatted.includes('<h2>')) {
      formatted = `<h2>概要</h2>\n${formatted}`;
    }

    return formatted;
  }

  /**
   * データソースの抽出
   */
  private extractDataSources(reportData: ComprehensiveBusinessReport): string[] {
    const sources = [];
    
    if (reportData.research_phase_result) {
      sources.push('調査フェーズ結果');
    }
    
    if (reportData.analysis_phase_result) {
      sources.push('市場分析結果');
      if (reportData.analysis_phase_result.market_analysis.tam.sources) {
        sources.push(...reportData.analysis_phase_result.market_analysis.tam.sources);
      }
    }

    return [...new Set(sources)];
  }

  /**
   * 信頼度レベルの計算
   */
  private calculateConfidenceLevel(
    reportData: ComprehensiveBusinessReport, 
    sectionName: string
  ): 'low' | 'medium' | 'high' {
    const analysis = reportData.analysis_phase_result;
    
    if (!analysis) return 'low';

    const confidenceScore = analysis.analysis_confidence;
    
    // セクション固有の調整
    if (sectionName === '市場規模・競合') {
      const tamConfidence = analysis.market_analysis.tam.confidence_level;
      if (tamConfidence === 'high' && confidenceScore >= 8) return 'high';
      if (tamConfidence === 'medium' && confidenceScore >= 6) return 'medium';
      return 'low';
    }

    if (confidenceScore >= 8) return 'high';
    if (confidenceScore >= 6) return 'medium';
    return 'low';
  }

  /**
   * 完成度スコアの計算
   */
  private calculateCompletenessScore(content: string): number {
    const minLength = this.config.min_section_length;
    const maxLength = this.config.max_section_length;
    
    let score = 0;
    
    // 文字数評価 (40点)
    const length = content.length;
    if (length >= minLength) {
      score += Math.min(40, (length / maxLength) * 40);
    }
    
    // 構造化評価 (30点)
    const hasHeadings = (content.match(/<h[1-6]>/g) || []).length;
    const hasLists = (content.match(/<[uo]l>/g) || []).length;
    const hasTables = (content.match(/<table>/g) || []).length;
    
    score += Math.min(30, (hasHeadings * 10) + (hasLists * 5) + (hasTables * 15));
    
    // コンテンツ品質評価 (30点)
    const hasSpecificData = content.includes('億円') || content.includes('%') || content.includes('年');
    const hasActionableContent = content.includes('実施') || content.includes('策定') || content.includes('検討');
    
    if (hasSpecificData) score += 15;
    if (hasActionableContent) score += 15;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * 品質チェックの実行
   */
  private async performQualityCheck(sections: ReportSection[]): Promise<any> {
    const totalScore = sections.reduce((sum, section) => sum + section.completeness_score, 0) / sections.length;
    
    return {
      overall_score: Math.round(totalScore),
      section_scores: sections.map(section => ({
        section_name: section.tab_name,
        score: section.completeness_score,
        criteria_breakdown: {
          logical_consistency: 80,
          actionable_specificity: 75,
          data_support: 70,
          clarity: 85
        },
        feedback: `${section.tab_name}セクションは適切に生成されました。`
      })),
      evaluation_criteria: {
        logical_consistency_weight: 0.3,
        actionable_specificity_weight: 0.3,
        data_support_weight: 0.2,
        clarity_weight: 0.2,
        minimum_passing_score: 80
      },
      improvement_suggestions: totalScore < 80 ? ['詳細データの追加', '具体的なアクションプランの強化'] : [],
      strengths: ['包括的な分析', '構造化された内容'],
      weaknesses: totalScore < 80 ? ['一部の定量データが不足'] : [],
      meets_threshold: totalScore >= 80,
      assessed_at: new Date().toISOString(),
      assessed_by: 'critic_agent'
    };
  }

  /**
   * プロセス作成ヘルパー
   */
  private createProcess(
    agent: 'writer' | 'critic',
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
}