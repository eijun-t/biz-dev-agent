'use client';

import { useState } from 'react';

interface TestResult {
  test_name: string;
  success: boolean;
  response_time?: number;
  result?: any;
  error?: string;
}

export default function TestIdeationPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const mockResearchData = [
    {
      id: 'research_1',
      research_item_id: 'item_1',
      category: 'startup_trends',
      topic: 'フィンテックスタートアップ',
      summary: 'フィンテック分野での急速な成長と新しいビジネスモデルの出現',
      key_insights: [
        'デジタル決済の普及加速',
        '個人投資家向けサービスの拡大',
        'B2Bフィンテックの成長'
      ],
      business_potential: 8,
      mitsubishi_synergy_potential: 7,
      market_size_indicator: '大規模市場',
      technology_maturity: '商用化段階',
      competitive_landscape: '競合多数',
      regulatory_environment: '規制緩和',
      sources: ['https://example.com'],
      language: 'ja',
      region: 'japan',
      created_at: new Date().toISOString()
    },
    {
      id: 'research_2',
      research_item_id: 'item_2',
      category: 'technology_developments',
      topic: 'プロップテック',
      summary: '不動産テクノロジーによる業界変革の進展',
      key_insights: [
        'VR/AR技術の内見への活用',
        'IoTによるスマートビル管理',
        'AI活用の物件推奨システム'
      ],
      business_potential: 9,
      mitsubishi_synergy_potential: 9,
      market_size_indicator: '大規模市場',
      technology_maturity: '実証段階',
      competitive_landscape: '競合少数',
      regulatory_environment: '規制緩和',
      sources: ['https://example.com'],
      language: 'ja',
      region: 'japan',
      created_at: new Date().toISOString()
    },
    {
      id: 'research_3',
      research_item_id: 'item_3',
      category: 'industry_challenges',
      topic: '都市部の高齢化対応',
      summary: '都市部における高齢化社会への対応が急務となっている',
      key_insights: [
        'バリアフリー住宅の需要増加',
        'シニア向けサービスの拡充',
        '地域コミュニティの活性化'
      ],
      business_potential: 7,
      mitsubishi_synergy_potential: 8,
      market_size_indicator: '中規模市場',
      technology_maturity: '成熟段階',
      competitive_landscape: '競合中程度',
      regulatory_environment: '支援政策',
      sources: ['https://example.com'],
      language: 'ja',
      region: 'japan',
      created_at: new Date().toISOString()
    }
  ];

  const runTest = async (testType: string) => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/agents/ideation/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_type: testType,
          research_summaries: mockResearchData,
          user_requirements: 'AI・テクノロジー活用の不動産・都市開発新事業'
        })
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🧪 アイディエーション テストページ</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => runTest('ideator_only')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Ideator テスト
        </button>
        
        <button
          onClick={() => runTest('critic_only')}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Critic テスト
        </button>
        
        <button
          onClick={() => runTest('performance')}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          パフォーマンス
        </button>
        
        <button
          onClick={() => runTest('full_integration')}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          完全統合
        </button>
      </div>

      <button
        onClick={clearResults}
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        結果クリア
      </button>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          テスト実行中...
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
                {result.success ? '✅' : '❌'} {result.test_name}
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
              <details className="cursor-pointer">
                <summary className="font-medium">結果詳細</summary>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">📊 テスト結果サマリー</h3>
          <p>
            成功: {results.filter(r => r.success).length}/{results.length} テスト
          </p>
          <p>
            成功率: {((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}