/**
 * Enhanced Researcher Agent Test Script
 * 包括的情報収集エージェントのテストスクリプト
 */

import { EnhancedResearcherAgent, createEnhancedResearcher } from '../lib/agents/research/enhanced-index';
import type { ResearchCategory } from '../lib/agents/research/enhanced-researcher-types';

// テスト設定
const TEST_CONFIG = {
  // テスト用の低予算設定
  costConfig: {
    monthlyBudget: 100, // 100円でテスト
    alertThreshold: 0.5,
    enforceLimit: true
  },
  // キャッシュ設定
  cacheConfig: {
    enabled: true,
    defaultTtl: 60, // 1分（テスト用）
    maxSize: 10 * 1024 * 1024, // 10MB
    evictionPolicy: 'lru' as const
  },
  // 並列制限
  maxParallelRequests: 2
};

// テスト用APIキー（環境変数から取得）
const API_KEYS = {
  serper: process.env.SERPER_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  estat: process.env.ESTAT_API_KEY || ''
};

/**
 * 基本機能テスト
 */
async function testBasicFunctionality() {
  console.log('\n🧪 === Basic Functionality Test ===');
  
  try {
    const researcher = createEnhancedResearcher(API_KEYS, TEST_CONFIG);
    
    // 初期化確認
    const stats = researcher.getStats();
    console.log('✅ Agent initialized successfully');
    console.log(`📊 Data sources: ${stats.dataSources}`);
    console.log(`💾 Cache enabled: ${stats.cache.totalEntries === 0 ? 'Yes (empty)' : 'Yes'}`);
    console.log(`💰 Budget: ¥${stats.cost.monthlyBudget}`);
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Basic functionality test failed:', error);
    return false;
  }
}

/**
 * データソーステスト
 */
async function testDataSources() {
  console.log('\n🧪 === Data Sources Test ===');
  
  try {
    const researcher = createEnhancedResearcher(API_KEYS, TEST_CONFIG);
    
    // 簡単なクエリでテスト
    console.log('🔍 Testing with simple query: "AI"');
    
    const result = await researcher.executeComprehensiveResearch(
      'AI',
      ['technology'], // 技術カテゴリのみでテスト
      'ja',
      'japan',
      3 // 最大3件
    );
    
    console.log(`✅ Research completed`);
    console.log(`📊 Categories: ${result.categorySummaries.length}`);
    console.log(`📈 Overall score: ${result.overallBusinessPotential}`);
    console.log(`🏢 Mitsubishi fit: ${result.mitsubishiStrategicFit}`);
    console.log(`💰 Cost: ¥${result.costIncurred}`);
    console.log(`⏱️ Time: ${result.executionTime}s`);
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Data sources test failed:', error);
    return false;
  }
}

/**
 * キャッシュテスト
 */
async function testCaching() {
  console.log('\n🧪 === Caching Test ===');
  
  try {
    const researcher = createEnhancedResearcher(API_KEYS, TEST_CONFIG);
    
    const query = 'スマートシティ';
    const categories: ResearchCategory[] = ['market_trends'];
    
    // 1回目の実行
    console.log('🔍 First execution (should miss cache)');
    const start1 = Date.now();
    await researcher.executeComprehensiveResearch(query, categories, 'ja', 'japan', 2);
    const time1 = Date.now() - start1;
    
    let stats = researcher.getStats();
    console.log(`⏱️ First execution: ${time1}ms`);
    console.log(`💾 Cache entries: ${stats.cache.totalEntries}`);
    console.log(`📊 Hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    
    // 2回目の実行（キャッシュヒット期待）
    console.log('\n🔍 Second execution (should hit cache)');
    const start2 = Date.now();
    await researcher.executeComprehensiveResearch(query, categories, 'ja', 'japan', 2);
    const time2 = Date.now() - start2;
    
    stats = researcher.getStats();
    console.log(`⏱️ Second execution: ${time2}ms`);
    console.log(`💾 Cache entries: ${stats.cache.totalEntries}`);
    console.log(`📊 Hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    
    if (time2 < time1 * 0.5) {
      console.log('✅ Cache working effectively (2nd run faster)');
    } else {
      console.log('⚠️ Cache may not be working as expected');
    }
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Caching test failed:', error);
    return false;
  }
}

/**
 * コスト監視テスト
 */
async function testCostMonitoring() {
  console.log('\n🧪 === Cost Monitoring Test ===');
  
  try {
    const researcher = createEnhancedResearcher(API_KEYS, {
      ...TEST_CONFIG,
      costConfig: {
        monthlyBudget: 10, // 非常に低い予算でテスト
        alertThreshold: 0.5,
        enforceLimit: false // テスト用に制限を無効化
      }
    });
    
    console.log('💰 Testing with ¥10 budget');
    
    // 初期状態
    let costStatus = researcher.getStats().cost;
    console.log(`📊 Initial budget: ¥${costStatus.monthlyBudget}`);
    console.log(`💸 Initial spent: ¥${costStatus.totalSpent}`);
    
    // 調査実行
    await researcher.executeComprehensiveResearch(
      'ドローン配送',
      ['technology', 'regulation'],
      'ja',
      'japan',
      3
    );
    
    // コスト確認
    costStatus = researcher.getStats().cost;
    console.log(`💸 After research spent: ¥${costStatus.totalSpent}`);
    console.log(`⚠️ Over budget: ${costStatus.isOverBudget ? 'Yes' : 'No'}`);
    console.log(`📈 Estimated monthly: ¥${Math.round(costStatus.estimatedMonthlyUsage)}`);
    
    if (costStatus.recentAlerts.length > 0) {
      console.log(`🚨 Alerts: ${costStatus.recentAlerts.length}`);
      costStatus.recentAlerts.forEach(alert => {
        console.log(`   - ${alert.level}: ${alert.message}`);
      });
    }
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Cost monitoring test failed:', error);
    return false;
  }
}

/**
 * 多カテゴリテスト
 */
async function testMultiCategory() {
  console.log('\n🧪 === Multi-Category Test ===');
  
  try {
    const researcher = createEnhancedResearcher(API_KEYS, TEST_CONFIG);
    
    console.log('🔍 Testing with multiple categories: EV charging infrastructure');
    
    const result = await researcher.executeComprehensiveResearch(
      'EV充電インフラ',
      ['market_trends', 'technology', 'regulation'], // 3カテゴリ
      'ja',
      'japan',
      2
    );
    
    console.log(`✅ Multi-category research completed`);
    console.log(`📊 Categories processed: ${result.categorySummaries.length}`);
    
    result.categorySummaries.forEach(summary => {
      console.log(`   - ${summary.category}: ${summary.totalResults} results, quality ${summary.averageQuality.toFixed(1)}/10`);
      console.log(`     Business relevance: ${summary.businessRelevance}/10`);
      console.log(`     Mitsubishi synergy: ${summary.mitsubishiSynergy}/10`);
    });
    
    console.log(`🔗 Cross-category insights: ${result.crossCategoryInsights.length}`);
    console.log(`🎯 Priority recommendations: ${result.priorityRecommendations.length}`);
    console.log(`⚠️ Information gaps: ${result.informationGaps.length}`);
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Multi-category test failed:', error);
    return false;
  }
}

/**
 * エラーハンドリングテスト
 */
async function testErrorHandling() {
  console.log('\n🧪 === Error Handling Test ===');
  
  try {
    const researcher = createEnhancedResearcher(
      { serper: 'invalid_key' }, // 無効なAPIキー
      TEST_CONFIG
    );
    
    console.log('🔍 Testing with invalid API key');
    
    const result = await researcher.executeComprehensiveResearch(
      'テストクエリ',
      ['technology'],
      'ja',
      'japan',
      2
    );
    
    // エラーがあっても結果が返ることを確認
    console.log(`✅ Graceful error handling working`);
    console.log(`📊 Results despite errors: ${result.categorySummaries.length} categories`);
    console.log(`⚠️ Information gaps: ${result.informationGaps.length}`);
    
    researcher.destroy();
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return false;
  }
}

/**
 * メインテスト実行
 */
async function runAllTests() {
  console.log('🚀 Enhanced Researcher Agent Test Suite');
  console.log('======================================');
  
  const tests = [
    { name: 'Basic Functionality', fn: testBasicFunctionality },
    { name: 'Data Sources', fn: testDataSources },
    { name: 'Caching', fn: testCaching },
    { name: 'Cost Monitoring', fn: testCostMonitoring },
    { name: 'Multi-Category', fn: testMultiCategory },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n⏳ Running ${test.name} test...`);
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
      if (success) {
        console.log(`✅ ${test.name} test passed`);
      } else {
        console.log(`❌ ${test.name} test failed`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} test crashed:`, error);
      results.push({ name: test.name, success: false });
    }
    
    // テスト間の間隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 結果サマリー
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  let passed = 0;
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.success) passed++;
  });
  
  console.log(`\n🎯 Overall: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('🎉 All tests passed! Enhanced Researcher Agent is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// テスト実行
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };