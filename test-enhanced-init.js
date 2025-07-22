/**
 * Enhanced Agents Initialization Test
 */

console.log('🔍 Testing Enhanced Agents initialization...\n');

// Node.js環境で動作するように設定
process.env.NODE_ENV = 'development';

async function testEnhancedAgents() {
  try {
    // 1. Enhanced Researcher テスト
    console.log('🔬 Testing Enhanced Researcher...');
    
    // モジュールの動的インポートを試行
    let createEnhancedResearcher;
    
    try {
      const researchModule = await import('./lib/agents/research/enhanced-index.js');
      createEnhancedResearcher = researchModule.createEnhancedResearcher;
      console.log('✅ Enhanced Research module imported successfully');
    } catch (importError) {
      console.error('❌ Enhanced Research module import failed:', importError.message);
      return;
    }

    // 2. 初期化テスト
    try {
      const researcher = createEnhancedResearcher(
        {
          serper: 'mock_serper_key',
          openai: 'mock_openai_key',
          estat: 'mock_estat_key'
        },
        {
          enableCache: false,
          enableCostMonitoring: false,
          maxConcurrentRequests: 1,
          requestTimeout: 5000,
          qualityThreshold: 0.5
        }
      );
      console.log('✅ Enhanced Researcher initialized');
      
      // 簡易的なメソッド存在確認
      if (typeof researcher.conductResearch === 'function') {
        console.log('✅ conductResearch method available');
      } else {
        console.warn('⚠️  conductResearch method not found');
      }
      
    } catch (initError) {
      console.error('❌ Enhanced Researcher initialization failed:', initError.message);
      console.error('Stack trace:', initError.stack);
    }

    // 3. Enhanced Ideator テスト
    console.log('\n💡 Testing Enhanced Ideator...');
    
    try {
      const ideationModule = await import('./lib/agents/ideation/enhanced-ideator-index.js');
      const createEnhancedIdeator = ideationModule.createEnhancedIdeator;
      console.log('✅ Enhanced Ideation module imported successfully');
      
      try {
        const ideator = createEnhancedIdeator(
          { provider: 'openai' },
          {
            max_iterations: 1,
            quality_threshold: 0.5,
            enable_competitive_analysis: false,
            enable_quality_validation: false
          }
        );
        console.log('✅ Enhanced Ideator initialized');
        
        if (typeof ideator.generateIdeas === 'function') {
          console.log('✅ generateIdeas method available');
        } else {
          console.warn('⚠️  generateIdeas method not found');
        }
        
      } catch (ideatorInitError) {
        console.error('❌ Enhanced Ideator initialization failed:', ideatorInitError.message);
        console.error('Stack trace:', ideatorInitError.stack);
      }
      
    } catch (ideatorImportError) {
      console.error('❌ Enhanced Ideation module import failed:', ideatorImportError.message);
    }

  } catch (error) {
    console.error('💥 Overall test failed:', error);
  }
}

testEnhancedAgents().then(() => {
  console.log('\n🎯 Test completed.');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});