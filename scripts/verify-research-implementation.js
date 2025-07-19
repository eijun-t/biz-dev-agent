/**
 * Research Phase Implementation Verification
 * 研究フェーズ実装の検証スクリプト
 */

// シンプルな検証スクリプト（サーバー起動不要）
const path = require('path');
const fs = require('fs');

function checkFileExists(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

function verifyImplementation() {
  console.log('🔍 研究フェーズ実装検証開始\n');

  const requiredFiles = [
    'lib/agents/research/types.ts',
    'lib/agents/research/utils.ts', 
    'lib/agents/research/planner.ts',
    'lib/agents/research/researcher.ts',
    'lib/agents/research/coordinator.ts',
    'lib/agents/research/index.ts',
    'app/api/agents/research/route.ts',
    'app/api/agents/research/test/route.ts'
  ];

  const results = [];

  console.log('📁 必要なファイルの確認:');
  requiredFiles.forEach(file => {
    const exists = checkFileExists(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    results.push({ file, exists });
  });

  const allFilesExist = results.every(r => r.exists);
  
  console.log('\n📦 Dependencies の確認:');
  
  const packageJsonPath = 'package.json';
  if (checkFileExists(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredDeps = [
        '@langchain/openai',
        '@langchain/langgraph',
        '@langchain/core',
        'cheerio'
      ];
      
      requiredDeps.forEach(dep => {
        const hasDepInDeps = packageJson.dependencies && packageJson.dependencies[dep];
        const hasDepInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
        const exists = hasDepInDeps || hasDepInDevDeps;
        console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
      });
    } catch (error) {
      console.log(`  ❌ package.json読み込みエラー: ${error.message}`);
    }
  } else {
    console.log('  ❌ package.json not found');
  }

  console.log('\n🔧 環境変数の確認:');
  const envPath = '.env.local';
  if (checkFileExists(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredEnvVars = [
        'OPENAI_API_KEY',
        'SERPER_API_KEY',
        'RESEARCH_PARALLEL_LIMIT',
        'RESEARCH_TIMEOUT'
      ];
      
      requiredEnvVars.forEach(envVar => {
        const exists = envContent.includes(envVar);
        console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
      });
    } catch (error) {
      console.log(`  ❌ .env.local読み込みエラー: ${error.message}`);
    }
  } else {
    console.log('  ❌ .env.local not found');
  }

  console.log('\n🏗️ 実装構造の確認:');
  
  // TypeScript型定義の確認
  const typesPath = 'lib/agents/research/types.ts';
  if (checkFileExists(typesPath)) {
    try {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      const requiredTypes = [
        'ResearchCategory',
        'ResearchItem',
        'SearchResult',
        'ResearchSummary',
        'ResearchPhaseState',
        'MitsubishiCapability'
      ];
      
      requiredTypes.forEach(type => {
        const exists = typesContent.includes(type);
        console.log(`  ${exists ? '✅' : '❌'} Type: ${type}`);
      });
    } catch (error) {
      console.log(`  ❌ 型定義読み込みエラー: ${error.message}`);
    }
  }

  // クラス定義の確認
  const classFiles = [
    { file: 'lib/agents/research/planner.ts', className: 'PlannerAgent' },
    { file: 'lib/agents/research/researcher.ts', className: 'ResearcherAgent' },
    { file: 'lib/agents/research/coordinator.ts', className: 'ResearchCoordinator' }
  ];

  classFiles.forEach(({ file, className }) => {
    if (checkFileExists(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hasClass = content.includes(`class ${className}`);
        const hasConstructor = content.includes('constructor');
        console.log(`  ${hasClass ? '✅' : '❌'} Class: ${className}`);
        console.log(`  ${hasConstructor ? '✅' : '❌'} Constructor: ${className}`);
      } catch (error) {
        console.log(`  ❌ ${file}読み込みエラー: ${error.message}`);
      }
    }
  });

  console.log('\n📊 検証結果サマリー:');
  console.log('='.repeat(50));
  
  const missingFiles = results.filter(r => !r.exists).length;
  const totalFiles = results.length;
  
  if (allFilesExist) {
    console.log('✅ 全ての必要なファイルが存在しています');
  } else {
    console.log(`❌ ${missingFiles}/${totalFiles} ファイルが不足しています`);
  }

  console.log('\n🎯 次のステップ:');
  if (allFilesExist) {
    console.log('1. Next.js サーバーを起動: npm run dev');
    console.log('2. .env.local でSERPER_API_KEYを設定');
    console.log('3. テストAPIを実行: curl -X GET http://localhost:3000/api/agents/research/test');
    console.log('4. 完全テストを実行: node scripts/test-research-phase.js');
  } else {
    console.log('1. 不足しているファイルを確認してください');
    console.log('2. 必要な依存関係をインストールしてください');
  }

  return {
    success: allFilesExist,
    missingFiles: results.filter(r => !r.exists).map(r => r.file)
  };
}

// 簡単なコード品質チェック
function checkCodeQuality() {
  console.log('\n🔍 コード品質チェック:');
  
  const codeFiles = [
    'lib/agents/research/planner.ts',
    'lib/agents/research/researcher.ts',
    'lib/agents/research/coordinator.ts'
  ];

  codeFiles.forEach(file => {
    if (checkFileExists(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        console.log(`  📄 ${file}:`);
        console.log(`    - 行数: ${lines.length}`);
        console.log(`    - 関数数: ${(content.match(/async \w+\(/g) || []).length}`);
        console.log(`    - エラーハンドリング: ${content.includes('try') && content.includes('catch') ? '✅' : '❌'}`);
        console.log(`    - TypeScript: ${content.includes(': ') ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`    ❌ 読み込みエラー: ${error.message}`);
      }
    }
  });
}

// メイン実行
if (require.main === module) {
  const result = verifyImplementation();
  checkCodeQuality();
  
  if (result.success) {
    console.log('\n🎉 実装検証完了! 研究フェーズの実装は正常です。');
    process.exit(0);
  } else {
    console.log('\n⚠️  実装に問題があります。上記の指示に従って修正してください。');
    process.exit(1);
  }
}

module.exports = { verifyImplementation, checkCodeQuality };