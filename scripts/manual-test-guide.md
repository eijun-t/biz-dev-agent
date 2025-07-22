# Enhanced Researcher Agent テストガイド

## 🚀 クイックテスト（推奨）

最も簡単で安全なテスト方法です。

### 1. 環境変数設定

```bash
# .env ファイルに以下を追加（オプション）
SERPER_API_KEY=your_serper_key_here
ESTAT_API_KEY=your_estat_key_here
```

### 2. 基本テスト実行

```bash
# Node.js/TypeScriptで実行
cd /Users/eijuntei/Desktop/workspace/biz-dev-agent
npx ts-node scripts/test-enhanced-researcher.ts
```

## 📋 段階別テスト手順

### Phase 1: 基本機能テスト（APIキー不要）

```typescript
// 最小限のテスト
import { EnhancedResearcherAgent } from './lib/agents/research/enhanced-researcher';

const researcher = new EnhancedResearcherAgent();
const stats = researcher.getStats();
console.log('初期化成功:', stats);
researcher.destroy();
```

### Phase 2: 無料データソーステスト

```typescript
// Yahoo News Japan, Wikipedia などの無料ソースのみテスト
const result = await researcher.executeComprehensiveResearch(
  'AI',
  ['technology'], // 1カテゴリのみ
  'ja',
  'japan',
  2 // 少ない件数
);
```

### Phase 3: 有料API付きテスト（Serper）

```typescript
// SERPER_API_KEY が設定されている場合のみ
const result = await researcher.executeComprehensiveResearch(
  'スマートシティ',
  ['market_trends', 'technology'],
  'ja',
  'japan',
  5
);
```

## 🛠️ 個別コンポーネントテスト

### キャッシュマネージャー単体テスト

```typescript
import { CacheManager } from './lib/agents/research/cache-manager';

const cache = new CacheManager(1024 * 1024, 60); // 1MB, 60秒
cache.set('market_trends', 'test query', 'ja', 'japan', [], 5);
const result = cache.get('market_trends', 'test query', 'ja', 'japan');
console.log('キャッシュテスト:', result !== null);
cache.destroy();
```

### コスト監視システム単体テスト

```typescript
import { CostMonitoringSystem } from './lib/agents/research/cost-monitor';

const costMonitor = new CostMonitoringSystem(100, 0.8); // 100円予算
costMonitor.recordUsage('news', 'test_source', 1, 'market_trends', 'ja', 'japan');
const status = costMonitor.getCurrentStatus();
console.log('コスト監視:', status.totalSpent);
```

## 🔍 デバッグ用テスト

### データソース個別テスト

```typescript
import { DataSourceFactory } from './lib/agents/research/data-source-modules';
import { DATA_SOURCE_CONFIGS } from './lib/agents/research/enhanced-researcher-config';

// Yahoo News Japanテスト（無料）
const yahooSource = DataSourceFactory.createDataSource(
  DATA_SOURCE_CONFIGS.yahoo_news_jp,
  {}
);

const results = await yahooSource.search('AI', 'ja', 'japan', 3);
console.log('Yahoo News結果:', results.length);
```

## ⚠️ 注意事項とトラブルシューティング

### 1. APIキーエラー
```
Error: API key not found for provider: openai
```
**解決方法**: 環境変数またはconfig内でAPIキーが設定されているか確認

### 2. ネットワークエラー
```
Error: fetch failed
```
**解決方法**: インターネット接続確認、タイムアウト設定を増やす

### 3. メモリエラー
```
Error: Maximum call stack size exceeded
```
**解決方法**: maxParallelRequestsを2に減らす、キャッシュサイズを小さくする

### 4. レート制限エラー
```
Error: Rate limit exceeded
```
**解決方法**: テスト間に間隔を入れる、リクエスト数を減らす

## 📊 テスト結果の確認ポイント

### ✅ 成功指標
- 初期化エラーなし
- 各カテゴリで最低1件の結果取得
- キャッシュヒット率 > 0%（2回目実行時）
- コスト記録が正確
- エラー時でも graceful degradation

### ❌ 失敗指標
- 全カテゴリで0件の結果
- キャッシュが全く効かない
- コスト計算が0のまま
- 例外で処理が停止

## 🚦 段階的テスト推奨順序

1. **基本機能テスト** - APIキー不要
2. **キャッシュテスト** - 軽量
3. **無料ソーステスト** - Yahoo News等
4. **コスト監視テスト** - 低予算設定
5. **有料APIテスト** - Serper等（慎重に）
6. **多カテゴリテスト** - 総合テスト

## 💰 コスト管理

### テスト用の安全設定
```typescript
const SAFE_TEST_CONFIG = {
  costConfig: {
    monthlyBudget: 50, // 50円制限
    alertThreshold: 0.5,
    enforceLimit: true // 予算超過で停止
  },
  maxParallelRequests: 1, // 並列数制限
};
```

### APIキー使用量確認方法
- Serper: https://serper.dev/dashboard
- OpenAI: https://platform.openai.com/usage

これらのテスト手順に従って、Enhanced Researcher Agentの動作を安全に確認できます。