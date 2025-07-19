'use client';

import { useState } from 'react';

interface TestResult {
  test_name: string;
  success: boolean;
  response_time?: number;
  result?: any;
  error?: string;
}

export default function TestAnalysisPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const mockBusinessIdeas = [
    {
      id: 'idea_1',
      title: 'AI-Powered Smart Building Management',
      target_market: '商業ビル・オフィス運営者',
      problem_statement: 'エネルギー効率とテナント満足度の最適化が困難',
      solution: 'AIとIoTを活用したビル管理システム',
      business_model: 'SaaS型サブスクリプション + 省エネ成果報酬',
      mitsubishi_synergy: '三菱地所の保有ビル群でのデータ収集とサービス検証',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_1', 'research_2']
    },
    {
      id: 'idea_2',
      title: 'Urban Mobility as a Service Platform',
      target_market: '都市部通勤者・観光客',
      problem_statement: '都市部での移動手段の最適化と環境負荷軽減',
      solution: '統合モビリティプラットフォーム',
      business_model: '利用料金の手数料モデル + プレミアムサービス',
      mitsubishi_synergy: '丸の内エリアでの実証実験と不動産開発との連携',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_3', 'research_4']
    },
    {
      id: 'idea_3',
      title: 'PropTech Investment Analytics',
      target_market: '不動産投資家・ファンド',
      problem_statement: '不動産投資の意思決定に必要な包括的データ分析の欠如',
      solution: 'AI分析による不動産投資判断支援システム',
      business_model: '月額サブスクリプション + プレミアム分析サービス',
      mitsubishi_synergy: '三菱地所の不動産データベースと専門知見の活用',
      generated_at: new Date().toISOString(),
      iteration_count: 0,
      source_research_ids: ['research_5', 'research_6']
    }
  ];

  const runTest = async (testType: string) => {
    setLoading(true);
    const startTime = Date.now();

    try {
      let payload: any = {
        test_type: testType
      };

      if (testType === 'full_integration' || testType === 'analyst_only') {
        payload.business_ideas = mockBusinessIdeas;
      }

      if (testType === 'full_integration') {
        payload.selected_idea_id = mockBusinessIdeas[0].id;
      }

      const response = await fetch('/api/agents/analysis/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const result = await response.json();

      const testResult: TestResult = {
        test_name: testType,
        success: response.ok && result.success,
        response_time: responseTime,
        result: result
      };

      setResults(prev => [...prev, testResult]);
    } catch (error) {
      const testResult: TestResult = {
        test_name: testType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setResults(prev => [...prev, testResult]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getTestDescription = (testType: string) => {
    const descriptions = {
      'analyst_only': 'Analystエージェント単体テスト - TAM分析、競合分析、リスク評価',
      'researcher_only': 'Enhanced Researcherエージェント単体テスト - ターゲット調査機能',
      'coordination_test': 'Analyst-Researcher連携テスト - 自律的な研究要請システム',
      'full_integration': '完全統合テスト - 分析フェーズ全体のワークフロー',
      'performance': 'パフォーマンステスト - 各コンポーネントの処理速度測定'
    };
    return descriptions[testType as keyof typeof descriptions] || 'テスト説明なし';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🔬 分析フェーズ テストページ</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">Task 008: 詳細分析・市場調査エージェント</h2>
        <ul className="text-sm space-y-1">
          <li>✅ AnalystAgent - TAM高精度分析（Web検索+フェルミ推定）</li>
          <li>✅ 競合分析機能（リスト作成+概要分析レベル）</li>
          <li>✅ Enhanced ResearcherAgent - ターゲット調査対応</li>
          <li>✅ Analyst-Researcher自律連携システム</li>
          <li>✅ 外部データソース統合（政府統計+Web検索）</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          'analyst_only',
          'researcher_only', 
          'coordination_test',
          'full_integration',
          'performance'
        ].map((testType) => (
          <div key={testType} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{testType.replace('_', ' ').toUpperCase()}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {getTestDescription(testType)}
            </p>
            <button
              onClick={() => runTest(testType)}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? '実行中...' : 'テスト実行'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          結果クリア
        </button>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Mock Business Ideas: {mockBusinessIdeas.length}個</span>
          <span>Selected for Analysis: {mockBusinessIdeas[0].title}</span>
        </div>
      </div>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            テスト実行中... 完全統合テストは5-10分かかる場合があります
          </div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              result.success 
                ? 'border-green-500 bg-green-50' 
                : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">
                {result.success ? '✅' : '❌'} {result.test_name.toUpperCase()}
              </h3>
              {result.response_time && (
                <span className="text-sm text-gray-600">
                  {result.response_time}ms
                </span>
              )}
            </div>
            
            {result.error && (
              <p className="text-red-600 mb-2">エラー: {result.error}</p>
            )}
            
            {result.result && (
              <div className="space-y-2">
                {result.result.details && (
                  <div className="text-sm">
                    <strong>実行結果:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(result.result.details).map(([key, value]) => (
                        <li key={key} className="text-gray-700">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <details className="cursor-pointer">
                  <summary className="font-medium">詳細結果を表示</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">📊 テスト結果サマリー</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>総テスト数:</strong> {results.length}
            </div>
            <div>
              <strong>成功:</strong> {results.filter(r => r.success).length}
            </div>
            <div>
              <strong>失敗:</strong> {results.filter(r => !r.success).length}
            </div>
            <div>
              <strong>成功率:</strong> {((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%
            </div>
          </div>
          
          {results.filter(r => r.response_time).length > 0 && (
            <div className="mt-2 text-sm">
              <strong>平均応答時間:</strong>{' '}
              {Math.round(
                results
                  .filter(r => r.response_time)
                  .reduce((sum, r) => sum + (r.response_time || 0), 0) /
                results.filter(r => r.response_time).length
              )}ms
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">⚠️ 注意事項</h3>
        <ul className="text-sm space-y-1">
          <li>• SERPER_API_KEYが設定されていない場合、Web検索が無効になります</li>
          <li>• 完全統合テストは外部API呼び出しが含まれるため時間がかかります</li>
          <li>• パフォーマンステストは複数のテストを順次実行します</li>
          <li>• 実際の政府統計データへのアクセスには時間がかかる場合があります</li>
        </ul>
      </div>
    </div>
  );
}