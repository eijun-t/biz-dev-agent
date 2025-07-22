# スクレイピングシステム - リファクタリング版

## 🎯 概要

このモジュールは、Enhanced Researcher Agentのスクレイピング機能を改良・モジュール化したバージョンです。メンテナンス性、拡張性、テスト容易性を大幅に向上させています。

## 📁 ディレクトリ構造

```
lib/scraping/
├── core/                          # コア機能
│   ├── base-scraper.ts            # 基底スクレイパークラス
│   └── relevance-calculator.ts    # 関連性計算機能
├── sources/                       # データソース別実装
│   ├── yahoo-news.ts              # Yahoo News Japan
│   ├── reddit.ts                  # Reddit API
│   └── [future sources...]        # 将来追加予定
├── utils/                         # ユーティリティ
│   └── html-parser.ts             # HTML解析機能
└── index.ts                       # メインエクスポート
```

## 🚀 基本的な使用方法

### 単一ソースでの検索

```typescript
import { YahooNewsScraper } from './lib/scraping';

const scraper = new YahooNewsScraper();
const results = await scraper.search('スマートシティ', {
  maxResults: 10,
  language: 'ja'
});

console.log(`Found ${results.length} articles`);
results.forEach(result => {
  console.log(`${result.title} (Score: ${result.relevanceScore}/10)`);
});
```

### 複数ソースの統合検索

```typescript
import { UnifiedScraper } from './lib/scraping';

const unified = new UnifiedScraper();
const searchResults = await unified.searchAll('IoT', {
  maxResultsPerSource: 5,
  minRelevanceScore: 4
});

searchResults.forEach(({ source, results, error }) => {
  if (error) {
    console.log(`${source}: ERROR - ${error}`);
  } else {
    console.log(`${source}: ${results.length} results found`);
  }
});
```

### クイック検索（最も簡単な方法）

```typescript
import { quickSearch } from './lib/scraping';

const results = await quickSearch('三菱地所', ['yahoo-news', 'reddit'], 20);
console.log(`Total results: ${results.length}`);
```

## 📊 主要な機能

### 1. BaseScraper クラス

全ての data source に共通する機能を提供：

- **レート制限管理**: API制限を自動遵守
- **リトライ機能**: 失敗時の自動再試行
- **タイムアウト処理**: 長時間のレスポンス待機を防止
- **エラー処理**: 統一されたエラーハンドリング

### 2. 関連性計算

高度なスコアリングアルゴリズム：

```typescript
import { calculateRelevance, filterByRelevance } from './lib/scraping';

// 基本的な関連性計算
const score = calculateRelevance(
  "スマートシティ IoT導入",
  "IoT技術でスマートシティを実現...",
  ["スマートシティ", "IoT"]
);

// 複数アイテムのフィルタリング
const filtered = filterByRelevance(
  articles,
  ["AI", "機械学習"],
  5 // 最小スコア
);
```

### 3. HTML解析

専門的なHTML処理機能：

```typescript
import { cleanHtmlContent, parseYahooNewsHtml } from './lib/scraping';

// 汎用HTML清掃
const cleanText = cleanHtmlContent(rawHtml, {
  maxLength: 1000,
  removeElements: ['.ad', 'script', 'style']
});

// Yahoo News専用パース
const newsItems = parseYahooNewsHtml(yahooHtml);
```

## 🔧 設定オプション

### スクレイパー設定

```typescript
const scraper = new YahooNewsScraper({
  timeout: 15000,        // タイムアウト（ミリ秒）
  rateLimit: 30,         // 分間リクエスト数
  retryAttempts: 3,      // リトライ回数
  reliability: 'high'    // 信頼性レベル
});
```

### 検索オプション

```typescript
const results = await scraper.search('検索クエリ', {
  language: 'ja',        // 言語設定
  region: 'japan',       // 地域設定
  maxResults: 20         // 最大結果数
});
```

## 📈 パフォーマンスとベストプラクティス

### 1. バッチ処理

複数クエリの効率的な処理：

```typescript
const queries = ['AI', '機械学習', 'IoT'];
const batchResults = await Promise.all(
  queries.map(query => scraper.search(query))
);
```

### 2. キャッシュ活用

同じクエリの重複実行を避ける：

```typescript
const cache = new Map();

async function cachedSearch(query) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const results = await scraper.search(query);
  cache.set(query, results);
  return results;
}
```

### 3. エラー処理

堅牢なエラーハンドリング：

```typescript
try {
  const results = await scraper.search(query);
  return results;
} catch (error) {
  console.warn(`Search failed: ${error.message}`);
  return []; // 空の結果を返す
}
```

## 🧪 テスト

### 基本テスト実行

```bash
# 統合テスト
node scripts/testing/integration-tests/new-scraping-system-test.js

# 個別機能テスト（要TypeScript環境）
npx ts-node -e "
import { YahooNewsScraper } from './lib/scraping';
const scraper = new YahooNewsScraper();
scraper.search('test').then(console.log);
"
```

### テストデータの確認

```bash
# 実際のスクレイピング結果を表示
node scripts/extract-content-sample.js
```

## 🔄 既存システムからの移行

### 段階的移行

1. **Phase 1**: 新システムと並行運用
```typescript
// 既存システム（バックアップとして保持）
import { YahooNewsSource } from './lib/agents/research/data-source-modules';

// 新システム（新機能で使用）
import { YahooNewsScraper } from './lib/scraping';
```

2. **Phase 2**: 新システムに完全移行
```typescript
// OLD
const oldScraper = new YahooNewsSource(config, apiKey);
const results = await oldScraper.search(query, 'ja', 'japan', 10);

// NEW
const newScraper = new YahooNewsScraper();
const results = await newScraper.search(query, { maxResults: 10 });
```

### 互換性の確保

新システムは既存のインターフェースと可能な限り互換性を保っています：

- 同じ出力フォーマット (`ScrapingResult[]`)
- 同じエラーハンドリングパターン
- 同じ設定オプション名

## 🚀 今後の拡張

### 新しいデータソースの追加

```typescript
// 新しいスクレイパーの実装例
export class CustomScraper extends BaseScraper {
  async search(query: string, options = {}) {
    // カスタムロジック実装
    return results;
  }
}

// ファクトリーに追加
ScrapingFactory.registerScraper('custom', CustomScraper);
```

### 予定されている機能

- arXiv学術論文スクレイパー
- Serper News API統合
- e-Stat政府統計API
- Wikipedia/Wikidataアクセス
- キャッシュシステムの改良
- 並列処理の最適化

## ⚠️ 注意事項

### レート制限の遵守

各データソースのレート制限を必ず守ってください：

- Yahoo News: 30 req/min (推奨)
- Reddit API: 60 req/min (公式制限)

### エラー処理

ネットワークエラーやAPI制限に対する適切な処理を実装してください：

```typescript
const scraper = new YahooNewsScraper({
  retryAttempts: 3,
  timeout: 10000
});

try {
  const results = await scraper.searchWithErrorRecovery(query);
} catch (error) {
  // フォールバック処理
  console.warn('Primary scraping failed, using fallback...');
}
```

### メモリ使用量

大量のデータを処理する際は、メモリ使用量に注意してください：

```typescript
// 大量データの場合は分割処理
const chunkSize = 10;
for (let i = 0; i < queries.length; i += chunkSize) {
  const chunk = queries.slice(i, i + chunkSize);
  const results = await Promise.all(
    chunk.map(query => scraper.search(query))
  );
  // 結果を処理...
}
```

## 📞 サポート

このシステムに関する質問や問題は、プロジェクトの Issue として報告してください。

---

*このリファクタリングにより、Enhanced Researcher Agentのスクレイピング機能はより堅牢で拡張可能なシステムになりました。*