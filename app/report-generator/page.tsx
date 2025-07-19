'use client';

import { useState, useEffect } from 'react';
import ReportViewer from '@/components/report/ReportViewer';
import ProcessVisualization from '@/components/report/ProcessVisualization';
import { 
  ComprehensiveBusinessReport, 
  ReportGenerationResult, 
  GenerationProcess,
  ReportSection 
} from '@/lib/agents/report/types';

export default function ReportGeneratorPage() {
  const [reportData, setReportData] = useState<ComprehensiveBusinessReport | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProcesses, setGenerationProcesses] = useState<GenerationProcess[]>([]);
  const [error, setError] = useState<string | null>(null);

  // デモ用のモックデータ
  const mockReportData: ComprehensiveBusinessReport = {
    id: 'demo_report_1',
    session_id: 'demo_session',
    title: 'AI-Powered Smart Building Management System',
    research_phase_result: [
      {
        id: 'research_1',
        research_item_id: 'item_1',
        category: 'technology_developments',
        topic: 'スマートビル技術',
        summary: 'IoT、AI、クラウド技術の融合により、ビル管理の自動化と最適化が進展',
        key_insights: [
          'エネルギー効率30%向上の実績',
          'テナント満足度向上',
          '運営コスト削減効果'
        ],
        business_potential: 9,
        mitsubishi_synergy_potential: 9,
        market_size_indicator: '大規模市場',
        technology_maturity: '商用化段階',
        competitive_landscape: '競合中程度',
        regulatory_environment: '支援政策',
        sources: ['https://example.com/research1'],
        language: 'ja',
        region: 'japan',
        created_at: new Date().toISOString()
      }
    ],
    ideation_phase_result: {
      ideas_generated: [
        {
          id: 'idea_1',
          title: 'AI-Powered Smart Building Management System',
          target_market: '商業ビル・オフィス運営者',
          problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
          solution: 'AIとIoTを活用したビル管理システム',
          business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
          mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
          generated_at: new Date().toISOString(),
          iteration_count: 0,
          source_research_ids: ['research_1']
        }
      ],
      selected_idea: {
        id: 'idea_1',
        title: 'AI-Powered Smart Building Management System',
        target_market: '商業ビル・オフィス運営者',
        problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
        solution: 'AIとIoTを活用したビル管理システム',
        business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
        mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
        generated_at: new Date().toISOString(),
        iteration_count: 0,
        source_research_ids: ['research_1']
      },
      evaluation_results: [
        {
          idea_id: 'idea_1',
          market_potential: 35,
          strategic_fit: 35,
          competitive_advantage: 15,
          profitability: 15,
          total_score: 85,
          feedback: '優秀なビジネスアイデアです',
          evaluated_at: new Date().toISOString()
        }
      ],
      final_score: 85,
      iteration_count: 1,
      generated_at: new Date().toISOString(),
      session_id: 'demo_session'
    },
    analysis_phase_result: {
      business_idea_id: 'idea_1',
      market_analysis: {
        tam: {
          value: 5000,
          unit: '億円',
          description: 'スマートビル市場の総市場規模',
          calculation_method: 'トップダウン分析',
          confidence_level: 'high',
          sources: ['総務省統計', '民間調査会社レポート']
        },
        sam: {
          value: 500,
          unit: '億円',
          description: '実際にアプローチ可能な市場',
          market_share_assumption: 0.1
        },
        som: {
          value: 50,
          unit: '億円',
          description: '獲得可能な市場',
          penetration_assumption: 0.01
        },
        market_growth_rate: 15,
        market_maturity: 'growth'
      },
      competitive_analysis: {
        direct_competitors: [
          {
            name: 'ビル管理システムA社',
            strengths: ['豊富な実績', 'システム統合力'],
            weaknesses: ['AI活用の遅れ', '高コスト'],
            key_offerings: ['従来型BMS', '設備管理'],
            target_segments: ['大型商業施設'],
            mitsubishi_advantage_over: ['AI技術力', 'データ量', '実証環境']
          }
        ],
        indirect_competitors: [
          {
            name: '設備管理会社B',
            strengths: ['人的サービス'],
            weaknesses: ['デジタル化の遅れ'],
            key_offerings: ['人的管理'],
            target_segments: ['中小ビル'],
            mitsubishi_advantage_over: ['自動化', 'コスト効率']
          }
        ],
        market_positioning: {
          our_position: 'AI駆動型スマートビル管理のリーダー',
          differentiation_factors: ['AI予測分析', '三菱地所データ活用'],
          competitive_advantages: ['豊富な実証データ', 'ブランド力'],
          potential_weaknesses: ['技術開発コスト', '導入期間']
        },
        market_concentration: 'moderate',
        barriers_to_entry: ['技術開発', '初期投資', '実績構築'],
        threat_level: 'medium'
      },
      risk_assessment: {
        market_risks: [
          {
            risk_name: '市場成長鈍化',
            description: '経済環境変化によるビル投資の減速',
            probability: 'medium',
            impact: 'high',
            risk_score: 6,
            timeframe: '2-3年'
          }
        ],
        technology_risks: [
          {
            risk_name: 'AI技術の陳腐化',
            description: '新技術の出現による既存AIの競争力低下',
            probability: 'low',
            impact: 'medium',
            risk_score: 3,
            timeframe: '3-5年'
          }
        ],
        competitive_risks: [
          {
            risk_name: '大手IT企業の参入',
            description: 'Google、Microsoft等の市場参入',
            probability: 'high',
            impact: 'high',
            risk_score: 9,
            timeframe: '1-2年'
          }
        ],
        financial_risks: [],
        regulatory_risks: [],
        operational_risks: [],
        overall_risk_score: 6,
        mitigation_strategies: [
          {
            risk_addressed: '大手IT企業の参入',
            strategy: '三菱地所の不動産特化ノウハウで差別化',
            implementation_timeline: '6ヶ月',
            responsible_party: '開発チーム',
            success_metrics: ['特許取得', 'パートナーシップ締結']
          }
        ]
      },
      financial_projections: {
        revenue_projections: {
          year_1: 500,
          year_2: 1500,
          year_3: 4000,
          year_5: 10000,
          assumptions: ['年間契約単価500万円', '契約数の段階的拡大']
        },
        cost_structure: {
          initial_investment: 2000,
          operating_costs_annual: 1000,
          major_cost_categories: {
            人件費: 600,
            マーケティング: 200,
            技術開発: 150,
            運営費: 50
          }
        },
        profitability: {
          break_even_point: '2年目',
          gross_margin: 0.7,
          net_margin_projections: {
            year_1: -0.5,
            year_2: 0.1,
            year_3: 0.25
          }
        },
        funding_requirements: {
          total_funding_needed: 3000,
          funding_stages: [
            {
              stage: 'シード',
              amount: 1000,
              timeline: '6ヶ月',
              use_of_funds: ['MVP開発', '初期チーム構築']
            }
          ]
        },
        roi_analysis: {
          expected_roi: 0.4,
          payback_period: '3年',
          sensitivity_analysis: ['市場成長率', '競合状況', '技術開発コスト']
        }
      },
      strategic_recommendations: [
        '三菱地所保有ビルでのパイロット実証',
        'AIエンジニアの積極採用',
        '既存設備会社とのパートナーシップ',
        '段階的な市場展開戦略'
      ],
      next_steps: [
        'MVP開発とパイロット実証',
        '技術チームの組成',
        '競合分析の詳細化',
        'パートナー企業の選定'
      ],
      analysis_confidence: 8,
      analyst_notes: '高い市場ポテンシャルと三菱地所の強みを活かせる有望な事業機会',
      research_requests_made: [],
      total_analysis_time: 180000,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    selected_business_idea: {
      id: 'idea_1',
      title: 'AI-Powered Smart Building Management System',
      target_market: '商業ビル・オフィス運営者',
      problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
      solution: 'AIとIoTを活用したビル管理システム',
      business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
      mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_1']
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    status: 'draft'
  };

  useEffect(() => {
    // デモ用データの設定
    setReportData(mockReportData);
  }, []);

  const handleGenerateReport = async () => {
    if (!reportData) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProcesses([]);

    try {
      const response = await fetch('/api/agents/report/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_type: 'full_generation',
          enable_revisions: true
        })
      });

      if (!response.ok) {
        throw new Error('レポート生成に失敗しました');
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedReport(result.result.report || result.result);
      } else {
        throw new Error(result.error || 'レポート生成に失敗しました');
      }

    } catch (error) {
      console.error('Report generation error:', error);
      setError(error instanceof Error ? error.message : 'レポート生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSection = async (sectionName: string) => {
    if (!generatedReport) return;

    try {
      const response = await fetch('/api/agents/report', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report_id: generatedReport.report_id,
          action: 'regenerate_section',
          parameters: { section_name: sectionName }
        })
      });

      if (!response.ok) {
        throw new Error('セクション再生成に失敗しました');
      }

      const result = await response.json();
      
      if (result.success && result.result.regenerated_section) {
        // セクションを更新
        const updatedSections = generatedReport.sections.map(section =>
          section.tab_name === sectionName ? result.result.regenerated_section : section
        );
        
        setGeneratedReport({
          ...generatedReport,
          sections: updatedSections,
          last_updated: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Section regeneration error:', error);
      setError(error instanceof Error ? error.message : 'セクション再生成に失敗しました');
    }
  };

  const handleExportReport = () => {
    if (!generatedReport) return;

    // HTMLエクスポート機能（簡易版）
    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportData?.selected_business_idea.title} - 分析レポート</title>
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        .section { margin-bottom: 40px; page-break-inside: avoid; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${reportData?.selected_business_idea.title}</h1>
    <div class="meta">
        生成日時: ${new Date(generatedReport.created_at).toLocaleString('ja-JP')}<br>
        品質スコア: ${generatedReport.final_score}点<br>
        文字数: ${generatedReport.word_count.toLocaleString()}文字
    </div>
    
    ${generatedReport.sections.map(section => `
        <div class="section">
            <h2>${section.title}</h2>
            ${section.content}
        </div>
    `).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData?.selected_business_idea.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}_report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">レポートデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {!generatedReport ? (
        // レポート生成前の画面
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              ビジネスレポート生成
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              分析結果から包括的なビジネスレポートを自動生成します
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              📊 分析対象ビジネスアイデア
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {reportData.selected_business_idea.title}
                </h3>
                <p className="text-gray-600 mt-1">
                  {reportData.selected_business_idea.problem_statement}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900">ターゲット市場</h4>
                  <p className="text-gray-600">{reportData.selected_business_idea.target_market}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">ビジネスモデル</h4>
                  <p className="text-gray-600">{reportData.selected_business_idea.business_model}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">三菱地所シナジー</h4>
                <p className="text-gray-600">{reportData.selected_business_idea.mitsubishi_synergy}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📈 分析結果サマリー</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">TAM:</span>
                  <span className="ml-2">{reportData.analysis_phase_result?.market_analysis.tam.value}{reportData.analysis_phase_result?.market_analysis.tam.unit}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">分析信頼度:</span>
                  <span className="ml-2">{reportData.analysis_phase_result?.analysis_confidence}/10</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">リスクスコア:</span>
                  <span className="ml-2">{reportData.analysis_phase_result?.risk_assessment.overall_risk_score}/10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              📝 生成されるレポート内容
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '📋', title: '概要', desc: 'エグゼクティブサマリー' },
                { icon: '🎯', title: '想定ターゲットと課題', desc: 'ペルソナと課題分析' },
                { icon: '💡', title: 'ソリューション仮説・ビジネスモデル', desc: '解決策と収益モデル' },
                { icon: '📊', title: '市場規模・競合', desc: 'TAM/SAM/SOM分析' },
                { icon: '🏢', title: '三菱地所が取り組む意義', desc: 'シナジーと戦略価値' },
                { icon: '✅', title: '検証アクション', desc: '次のステップ' },
                { icon: '⚠️', title: 'リスク', desc: 'リスク評価と軽減策' }
              ].map((section, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-700">❌ {error}</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  レポート生成中...
                </span>
              ) : (
                '📄 レポートを生成する'
              )}
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              💡 自律修正機能付きで、高品質なレポートを自動生成します
            </p>
          </div>

          {isGenerating && (
            <div className="mt-8">
              <ProcessVisualization
                processes={generationProcesses}
                isActive={isGenerating}
                onProcessUpdate={(processes) => setGenerationProcesses(processes)}
              />
            </div>
          )}
        </div>
      ) : (
        // レポート表示画面
        <ReportViewer
          reportData={reportData}
          sections={generatedReport.sections}
          qualityAssessment={generatedReport.quality_assessment}
          generationProcesses={generatedReport.generation_process}
          isGenerating={false}
          onRegenerateSection={handleRegenerateSection}
          onExportReport={handleExportReport}
        />
      )}
    </div>
  );
}