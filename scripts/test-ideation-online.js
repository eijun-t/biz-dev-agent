#!/usr/bin/env node

/**
 * Ideation Phase Online Test
 * 実際のAPI呼び出しによるアイディエーション検証
 */

const API_BASE = 'http://localhost:3001/api/agents/ideation';

async function runIdeationTests() {
  console.log('🧪 アイディエーションフェーズ オンラインテスト開始\n');

  const tests = [
    {
      name: 'Ideatorのみテスト',
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'ideator_only',
        research_summaries: generateMockResearchData(),
        user_requirements: 'フィンテック業界の新規事業機会を調査'
      }
    },
    {
      name: 'Criticのみテスト',
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'critic_only'
      }
    },
    {
      name: 'パフォーマンステスト',
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'performance'
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🔍 ${test.name} 実行中...`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(test.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.payload)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = await response.json();
      
      results.push({
        test_name: test.name,
        success: response.ok && result.success,
        response_time: responseTime,
        status: response.status,
        result: result
      });

      if (response.ok && result.success) {
        console.log(`✅ ${test.name} 成功 (${responseTime}ms)`);
        console.log('   結果:', summarizeResult(result));
      } else {
        console.log(`❌ ${test.name} 失敗 (${response.status})`);
        console.log('   エラー:', result.error || result.details);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} 実行エラー:`, error.message);
      results.push({
        test_name: test.name,
        success: false,
        error: error.message
      });
    }
  }

  // 完全統合テスト（時間がかかる）
  console.log('\n🚀 完全統合テスト実行中...');
  console.log('   注意: このテストは2-3分かかる場合があります');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_type: 'full_integration',
        research_summaries: generateMockResearchData(),
        user_requirements: 'AI・テクノロジー活用の不動産・都市開発新事業'
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const result = await response.json();
    
    results.push({
      test_name: '完全統合テスト',
      success: response.ok && result.success,
      response_time: responseTime,
      status: response.status,
      result: result
    });

    if (response.ok && result.success) {
      console.log(`✅ 完全統合テスト 成功 (${responseTime}ms)`);
      console.log('   結果:', summarizeResult(result));
    } else {
      console.log(`❌ 完全統合テスト 失敗 (${response.status})`);
      console.log('   エラー:', result.error || result.details);
    }
    
  } catch (error) {
    console.log(`❌ 完全統合テスト 実行エラー:`, error.message);
    results.push({
      test_name: '完全統合テスト',
      success: false,
      error: error.message
    });
  }

  // 結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`成功: ${successCount}/${totalCount} テスト`);
  console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 全テスト成功! アイディエーションフェーズは正常に動作しています。');
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。詳細を確認してください。');
  }

  console.log('\n詳細結果:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test_name}: ${result.success ? '✅' : '❌'} ${result.response_time ? `(${result.response_time}ms)` : ''}`);
  });

  return results;
}

function summarizeResult(result) {
  if (!result.details) return 'No details available';
  
  const details = result.details;
  
  if (details.ideas_generated) {
    return `${details.ideas_generated}個のアイデア生成`;
  }
  
  if (details.evaluations_count) {
    return `評価完了: スコア ${details.evaluation_result?.total_score || 'N/A'}点`;
  }
  
  if (details.result) {
    return `統合テスト: ${details.result.ideas_generated}個生成, 最終スコア ${details.result.final_score}点`;
  }
  
  if (details.performance_results) {
    return `${details.performance_results.length}件のパフォーマンステスト完了`;
  }
  
  return 'Test completed';
}

function generateMockResearchData() {
  return [
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
}

// 使用方法の説明
function showUsage() {
  console.log(`
アイディエーションフェーズ オンラインテストスクリプト

使用方法:
  node scripts/test-ideation-online.js

前提条件:
  1. Next.js サーバーが localhost:3000 で起動していること
  2. .env.local に OPENAI_API_KEY が設定されていること
  3. アイディエーションモジュールが正しく実装されていること

このスクリプトは以下のテストを実行します:
  - Ideatorのみテスト: アイデア生成機能の検証
  - Criticのみテスト: 評価機能の検証  
  - パフォーマンステスト: 処理性能の検証
  - 完全統合テスト: 全体的なワークフローテスト
`);
}

// メイン実行
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  runIdeationTests().catch(error => {
    console.error('テストスイート実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { runIdeationTests, summarizeResult };