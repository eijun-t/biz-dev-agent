/**
 * Research Phase Test Script
 * 研究フェーズの動作確認用スクリプト
 */

const API_BASE = 'http://localhost:3002/api/agents/research';

async function runTests() {
  console.log('🧪 研究フェーズテストスイート開始\n');

  const tests = [
    {
      name: 'プランナーのみテスト',
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'planner_only',
        user_input: 'フィンテック業界の新規事業機会を調査',
        target_items: 10
      }
    },
    {
      name: 'リサーチャーのみテスト', 
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'researcher_only',
        user_input: 'AI スタートアップ'
      }
    },
    {
      name: 'パフォーマンステスト',
      endpoint: `${API_BASE}/test`,
      payload: {
        test_type: 'performance',
        user_input: 'サステナビリティ技術の事業機会'
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

  // 完全統合テスト（注意: 時間がかかる場合があります）
  console.log('\n🚀 完全統合テスト実行中...');
  console.log('   注意: このテストは1-2分かかる場合があります');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_type: 'full_integration',
        user_input: '不動産テックの新事業機会を調査'
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
    console.log('\n🎉 全テスト成功! 研究フェーズは正常に動作しています。');
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
  
  if (details.plan) {
    return `${details.plan.total_items}項目の計画生成, 品質スコア: ${details.quality?.score || 'N/A'}`;
  }
  
  if (details.research_item) {
    return `${details.search_results?.count || 0}件の検索結果, 平均関連性: ${details.search_results?.avg_relevance?.toFixed(2) || 'N/A'}`;
  }
  
  if (details.performance_results) {
    return `${details.performance_results.length}件のパフォーマンステスト完了`;
  }
  
  if (details.phase_result) {
    return `${details.phase_result.summaries_count}件の要約生成, 次のアクション: ${details.phase_result.next_action}`;
  }
  
  return 'Test completed';
}

// 使用方法の説明
function showUsage() {
  console.log(`
研究フェーズテストスクリプト

使用方法:
  node scripts/test-research-phase.js

前提条件:
  1. Next.js サーバーが localhost:3000 で起動していること
  2. .env.local に SERPER_API_KEY が設定されていること
  3. OPENAI_API_KEY が設定されていること

このスクリプトは以下のテストを実行します:
  - プランナーのみテスト: 研究計画の生成テスト
  - リサーチャーのみテスト: 単一項目の調査テスト
  - パフォーマンステスト: 異なる規模での計画生成テスト
  - 完全統合テスト: 全体的なワークフローテスト
`);
}

// メイン実行
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  runTests().catch(error => {
    console.error('テストスイート実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { runTests, summarizeResult };