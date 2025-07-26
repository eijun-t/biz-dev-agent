/**
 * Advanced Writer Data Visualizer
 * 簡易HTML/CSSベースのデータ視覚化機能
 */

import {
  DataVisualization,
  ChartVisualization,
  TableVisualization,
  MatrixVisualization,
  VisualizationError
} from './types';

export class DataVisualizer {

  /**
   * 市場規模データをチャートとして視覚化
   */
  createMarketSizeChart(
    marketData: any,
    title: string = '市場規模予測'
  ): ChartVisualization {
    try {
      const data = {
        years: ['2024', '2025', '2026', '2027', '2028'],
        values: this.extractMarketSizeProgression(marketData)
      };

      const html_content = this.generateBarChartHTML(data, title);

      return {
        id: `market_chart_${Date.now()}`,
        type: 'chart',
        chart_type: 'bar',
        title,
        data,
        html_content,
        x_axis_label: '年度',
        y_axis_label: '市場規模（億円）'
      };
    } catch (error) {
      throw new VisualizationError('market_chart', `Market size chart generation failed: ${error.message}`);
    }
  }

  /**
   * 競合比較表を生成
   */
  createCompetitorTable(
    competitorData: any,
    title: string = '主要競合比較'
  ): TableVisualization {
    try {
      const headers = ['企業名', '市場シェア', '主力サービス', '強み', '弱み'];
      const rows = this.extractCompetitorRows(competitorData);

      const html_content = this.generateTableHTML(headers, rows, title);

      return {
        id: `competitor_table_${Date.now()}`,
        type: 'table',
        title,
        data: { headers, rows },
        html_content,
        headers,
        rows,
        styling: 'striped'
      };
    } catch (error) {
      throw new VisualizationError('competitor_table', `Competitor table generation failed: ${error.message}`);
    }
  }

  /**
   * リスクマトリックスを生成
   */
  createRiskMatrix(
    riskData: any,
    title: string = 'リスク評価マトリックス'
  ): MatrixVisualization {
    try {
      const risks = this.extractRiskItems(riskData);
      const html_content = this.generateRiskMatrixHTML(risks, title);

      return {
        id: `risk_matrix_${Date.now()}`,
        type: 'matrix',
        matrix_type: 'risk',
        title,
        data: risks,
        html_content,
        x_axis: '発生確率',
        y_axis: '影響度',
        quadrant_labels: ['低影響・低確率', '低影響・高確率', '高影響・低確率', '高影響・高確率']
      };
    } catch (error) {
      throw new VisualizationError('risk_matrix', `Risk matrix generation failed: ${error.message}`);
    }
  }

  /**
   * 財務予測表を生成
   */
  createFinancialProjectionTable(
    financialData: any,
    title: string = '財務予測'
  ): TableVisualization {
    try {
      const headers = ['項目', '1年目', '2年目', '3年目', '4年目', '5年目'];
      const rows = this.extractFinancialRows(financialData);

      const html_content = this.generateFinancialTableHTML(headers, rows, title);

      return {
        id: `financial_table_${Date.now()}`,
        type: 'table',
        title,
        data: { headers, rows },
        html_content,
        headers,
        rows,
        styling: 'bordered'
      };
    } catch (error) {
      throw new VisualizationError('financial_table', `Financial projection table generation failed: ${error.message}`);
    }
  }

  /**
   * 実装タイムラインを生成
   */
  createImplementationTimeline(
    timelineData: any,
    title: string = '実装タイムライン'
  ): DataVisualization {
    try {
      const phases = this.extractTimelinePhases(timelineData);
      const html_content = this.generateTimelineHTML(phases, title);

      return {
        id: `timeline_${Date.now()}`,
        type: 'timeline',
        title,
        data: phases,
        html_content
      };
    } catch (error) {
      throw new VisualizationError('timeline', `Timeline generation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Private Helper Methods - Data Extraction
  // ============================================================================

  private extractMarketSizeProgression(marketData: any): number[] {
    if (marketData?.marketSize?.growthProjections) {
      return marketData.marketSize.growthProjections.map((p: any) => 
        Math.round(p.value / 100000000) // Convert to 億円
      );
    }
    
    const baseSize = marketData?.marketSize?.total || 1000000000000;
    const growthRate = 0.15; // 15% annual growth
    return Array.from({ length: 5 }, (_, i) => 
      Math.round(baseSize * Math.pow(1 + growthRate, i) / 100000000)
    );
  }

  private extractCompetitorRows(competitorData: any): any[][] {
    if (competitorData?.directCompetitors) {
      return competitorData.directCompetitors.slice(0, 5).map((competitor: any) => [
        competitor.name || '競合企業',
        `${competitor.marketShare || 'N/A'}%`,
        competitor.mainService || '詳細不明',
        competitor.strengths?.join(', ') || '分析中',
        competitor.weaknesses?.join(', ') || '分析中'
      ]);
    }

    return [
      ['競合A', '25%', 'プラットフォームサービス', '市場認知度高', '技術革新遅れ'],
      ['競合B', '18%', 'ソリューション提供', '顧客基盤強固', 'デジタル化遅れ'],
      ['競合C', '12%', 'コンサルティング', '専門性高', 'スケール課題']
    ];
  }

  private extractRiskItems(riskData: any): any[] {
    if (riskData?.risks) {
      return riskData.risks.map((risk: any) => ({
        name: risk.name || 'リスク項目',
        probability: risk.probability || 0.5,
        impact: risk.impact || 0.5,
        mitigation: risk.mitigation || '対策検討中'
      }));
    }

    return [
      { name: '技術リスク', probability: 0.3, impact: 0.8, mitigation: '段階的導入' },
      { name: '市場リスク', probability: 0.6, impact: 0.6, mitigation: '市場調査強化' },
      { name: '競合リスク', probability: 0.7, impact: 0.5, mitigation: '差別化戦略' },
      { name: '規制リスク', probability: 0.2, impact: 0.9, mitigation: '法務チーム強化' }
    ];
  }

  private extractFinancialRows(financialData: any): any[][] {
    const baseRevenue = financialData?.revenueProjection?.year3 || 5000000000;
    
    return [
      ['売上高', '10億円', '25億円', '50億円', '75億円', '100億円'],
      ['営業利益', '▲5億円', '2億円', '12億円', '22億円', '30億円'],
      ['営業利益率', '▲50%', '8%', '24%', '29%', '30%'],
      ['累積投資額', '15億円', '30億円', '45億円', '55億円', '60億円'],
      ['ROI', '▲33%', '7%', '27%', '40%', '50%']
    ];
  }

  private extractTimelinePhases(timelineData: any): any[] {
    return [
      { phase: 'Phase 1: 基盤構築', period: '1-6ヶ月', tasks: ['技術開発', 'チーム組成', '初期投資'] },
      { phase: 'Phase 2: 実証実験', period: '7-12ヶ月', tasks: ['プロトタイプ開発', 'テスト実施', '検証'] },
      { phase: 'Phase 3: 市場投入', period: '13-18ヶ月', tasks: ['サービス開始', 'マーケティング', '顧客獲得'] },
      { phase: 'Phase 4: 拡大展開', period: '19-36ヶ月', tasks: ['機能拡張', '市場拡大', 'スケール化'] }
    ];
  }

  // ============================================================================
  // Private Helper Methods - HTML Generation
  // ============================================================================

  private generateBarChartHTML(data: any, title: string): string {
    const maxValue = Math.max(...data.values);
    const bars = data.years.map((year: string, index: number) => {
      const value = data.values[index];
      const height = (value / maxValue) * 200;
      return `
        <div class="chart-bar-container">
          <div class="chart-bar" style="height: ${height}px;">
            <div class="chart-bar-value">${value}</div>
          </div>
          <div class="chart-bar-label">${year}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="data-visualization chart-container">
        <h3 class="chart-title">${title}</h3>
        <div class="bar-chart">
          ${bars}
        </div>
        <style>
          .chart-container { margin: 20px 0; }
          .chart-title { text-align: center; margin-bottom: 15px; color: #374151; }
          .bar-chart { display: flex; align-items: end; justify-content: space-around; height: 250px; }
          .chart-bar-container { display: flex; flex-direction: column; align-items: center; }
          .chart-bar { 
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            width: 40px; 
            display: flex; 
            align-items: end; 
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            border-radius: 4px 4px 0 0;
          }
          .chart-bar-value { padding: 5px 0; }
          .chart-bar-label { margin-top: 10px; font-size: 12px; color: #6b7280; }
        </style>
      </div>
    `;
  }

  private generateTableHTML(headers: string[], rows: any[][], title: string): string {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = rows.map(row => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
      <div class="data-visualization table-container">
        <h3 class="table-title">${title}</h3>
        <table class="data-table striped">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
        <style>
          .table-container { margin: 20px 0; }
          .table-title { margin-bottom: 15px; color: #374151; }
          .data-table { width: 100%; border-collapse: collapse; }
          .data-table th { 
            background: #f3f4f6; 
            padding: 12px; 
            text-align: left; 
            font-weight: 600; 
            border-bottom: 2px solid #e5e7eb;
          }
          .data-table td { 
            padding: 10px 12px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .data-table.striped tbody tr:nth-child(even) { 
            background: #f9fafb; 
          }
        </style>
      </div>
    `;
  }

  private generateRiskMatrixHTML(risks: any[], title: string): string {
    const riskDots = risks.map(risk => {
      const x = risk.probability * 300; // Scale to 300px width
      const y = (1 - risk.impact) * 200; // Scale to 200px height, inverted
      return `
        <div class="risk-dot" style="left: ${x}px; top: ${y}px;" title="${risk.name}: ${risk.mitigation}">
          <span class="risk-name">${risk.name}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="data-visualization matrix-container">
        <h3 class="matrix-title">${title}</h3>
        <div class="risk-matrix">
          <div class="matrix-y-label">影響度 (高)</div>
          <div class="matrix-content">
            ${riskDots}
            <div class="matrix-quadrant q1">高影響・低確率</div>
            <div class="matrix-quadrant q2">高影響・高確率</div>
            <div class="matrix-quadrant q3">低影響・低確率</div>
            <div class="matrix-quadrant q4">低影響・高確率</div>
          </div>
          <div class="matrix-x-label">発生確率 (高)</div>
        </div>
        <style>
          .matrix-container { margin: 20px 0; }
          .matrix-title { text-align: center; margin-bottom: 15px; color: #374151; }
          .risk-matrix { position: relative; display: flex; flex-direction: column; align-items: center; }
          .matrix-content { 
            position: relative; 
            width: 300px; 
            height: 200px; 
            border: 2px solid #e5e7eb;
            background: linear-gradient(to right, #fef2f2 50%, #fef3c7 50%), 
                        linear-gradient(to top, #fef2f2 50%, #fee2e2 50%);
          }
          .matrix-quadrant {
            position: absolute;
            font-size: 10px;
            color: #6b7280;
            pointer-events: none;
          }
          .q1 { top: 10px; left: 10px; }
          .q2 { top: 10px; right: 10px; }
          .q3 { bottom: 10px; left: 10px; }
          .q4 { bottom: 10px; right: 10px; }
          .risk-dot {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #dc2626;
            border-radius: 50%;
            cursor: pointer;
            transform: translate(-6px, -6px);
          }
          .risk-dot:hover .risk-name {
            display: block;
          }
          .risk-name {
            display: none;
            position: absolute;
            top: -25px;
            left: -40px;
            background: #1f2937;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            z-index: 10;
          }
          .matrix-x-label, .matrix-y-label {
            font-size: 12px;
            color: #6b7280;
            margin: 10px;
          }
          .matrix-y-label {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }
        </style>
      </div>
    `;
  }

  private generateFinancialTableHTML(headers: string[], rows: any[][], title: string): string {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = rows.map(row => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
      <div class="data-visualization table-container">
        <h3 class="table-title">${title}</h3>
        <table class="data-table financial-table">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
        <style>
          .financial-table { border: 1px solid #d1d5db; }
          .financial-table th, .financial-table td { 
            border: 1px solid #d1d5db; 
            text-align: right;
          }
          .financial-table th:first-child, .financial-table td:first-child { 
            text-align: left; 
            font-weight: 600;
          }
        </style>
      </div>
    `;
  }

  private generateTimelineHTML(phases: any[], title: string): string {
    const timelineItems = phases.map((phase, index) => `
      <div class="timeline-item">
        <div class="timeline-marker">${index + 1}</div>
        <div class="timeline-content">
          <h4 class="timeline-phase">${phase.phase}</h4>
          <div class="timeline-period">${phase.period}</div>
          <ul class="timeline-tasks">
            ${phase.tasks.map((task: string) => `<li>${task}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    return `
      <div class="data-visualization timeline-container">
        <h3 class="timeline-title">${title}</h3>
        <div class="timeline">
          ${timelineItems}
        </div>
        <style>
          .timeline-container { margin: 20px 0; }
          .timeline-title { margin-bottom: 20px; color: #374151; }
          .timeline { position: relative; }
          .timeline::before {
            content: '';
            position: absolute;
            left: 20px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e5e7eb;
          }
          .timeline-item {
            position: relative;
            margin-bottom: 30px;
            padding-left: 60px;
          }
          .timeline-marker {
            position: absolute;
            left: 10px;
            top: 0;
            width: 20px;
            height: 20px;
            background: #8b5cf6;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          .timeline-phase {
            margin: 0 0 5px 0;
            color: #374151;
            font-size: 16px;
          }
          .timeline-period {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .timeline-tasks {
            margin: 0;
            padding-left: 20px;
          }
          .timeline-tasks li {
            margin-bottom: 5px;
            color: #4b5563;
          }
        </style>
      </div>
    `;
  }
}